/**
 * Cron Jobs Router
 *
 * User-defined scheduled jobs. Each job has:
 * - name: human label
 * - agent: which worker to dispatch to (ABBY, FORGE, CRAWLER, VAULT, WIRE, MR.NICE)
 * - schedule: cron-style frequency ("every_minute", "every_5_min", ..., "daily_midnight", "weekly_monday")
 * - prompt: plain English task description
 * - status: "active" | "paused"
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { Client } from "pg";
import { invokeLLM } from "./_core/llm";
import { runCycle } from "./runtime/autonomous";

const SCHEDULE_MINUTES: Record<string, number> = {
  every_minute: 1,
  every_5_min: 5,
  every_15_min: 15,
  every_30_min: 30,
  every_hour: 60,
  every_6_hours: 360,
  daily_midnight: 1440,
  weekly_monday: 10080,
};

export const AGENTS = [
  { id: "ABBY", name: "ABBY", role: "Orchestrates the whole swarm" },
  { id: "FORGE", name: "FORGE", role: "Builds & generates content" },
  { id: "CRAWLER", name: "CRAWLER", role: "Researches & scrapes the web" },
  { id: "VAULT", name: "VAULT", role: "Stores & manages data" },
  { id: "WIRE", name: "WIRE", role: "Connects & integrates platforms" },
  { id: "MR.NICE", name: "MR.NICE", role: "Posts to social media" },
] as const;

const AGENT_PROMPTS: Record<string, string> = {
  "ABBY": "You are ABBY, the orchestrator of the ContentFlow AI swarm. You coordinate other agents, set priorities, and ensure the entire content pipeline runs smoothly.",
  "FORGE": "You are FORGE, the content creation agent. You generate blog posts, social media content, video scripts, and any text-based content. Be creative, on-brand, and engaging.",
  "CRAWLER": "You are CRAWLER, the research agent. You gather information from the web, analyze trends, and provide insights to inform content strategy.",
  "VAULT": "You are VAULT, the data management agent. You organize, store, and retrieve information. You handle content archives, brand assets, and historical data.",
  "WIRE": "You are WIRE, the integration agent. You manage connections to external platforms (social media, blogs, CRMs) and ensure data flows correctly between systems.",
  "MR.NICE": "You are MR.NICE, the social media posting agent. You craft platform-specific posts optimized for each social network and publish them on schedule.",
};

async function getPg() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const client = new Client({ connectionString: url, ssl: false });
  await client.connect();
  return client;
}

function computeNextRun(schedule: string, from: Date = new Date()): Date {
  const minutes = SCHEDULE_MINUTES[schedule] || 60;
  return new Date(from.getTime() + minutes * 60 * 1000);
}

export const cronRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const pg = await getPg();
    if (!pg) return [];
    try {
      const r = await pg.query(
        `SELECT * FROM cron_jobs WHERE "businessId" = $1 ORDER BY "createdAt" DESC`,
        [1] // Use a fixed business ID for now
      );
      return r.rows;
    } finally {
      await pg.end();
    }
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      agent: z.enum(["ABBY", "FORGE", "CRAWLER", "VAULT", "WIRE", "MR.NICE"]),
      schedule: z.enum([
        "every_minute", "every_5_min", "every_15_min", "every_30_min",
        "every_hour", "every_6_hours", "daily_midnight", "weekly_monday"
      ]),
      prompt: z.string().min(1).max(4000),
    }))
    .mutation(async ({ ctx, input }) => {
      const pg = await getPg();
      if (!pg) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const nextRun = computeNextRun(input.schedule);
      try {
        const r = await pg.query(
          `INSERT INTO cron_jobs ("businessId", name, agent, schedule, prompt, status, "nextRun", "totalRuns", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW(), NOW())
           RETURNING *`,
          [1, input.name, input.agent, input.schedule, input.prompt, "active", nextRun]
        );
        return r.rows[0];
      } finally {
        await pg.end();
      }
    }),

  toggle: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "paused"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const pg = await getPg();
      if (!pg) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      try {
        const r = await pg.query(
          `UPDATE cron_jobs SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
          [input.status, input.id]
        );
        if (r.rows.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
        return r.rows[0];
      } finally {
        await pg.end();
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const pg = await getPg();
      if (!pg) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      try {
        await pg.query(`DELETE FROM cron_jobs WHERE id = $1`, [input.id]);
        return { success: true };
      } finally {
        await pg.end();
      }
    }),

  runNow: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const pg = await getPg();
      if (!pg) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      try {
        // Get the job
        const jobR = await pg.query(`SELECT * FROM cron_jobs WHERE id = $1`, [input.id]);
        if (jobR.rows.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
        const job = jobR.rows[0];

        // Run the job
        const result = await runCronJob(job);
        const nextRun = computeNextRun(job.schedule);

        // Update job stats
        const updateR = await pg.query(
          `UPDATE cron_jobs
           SET "lastRun" = NOW(), "nextRun" = $1, "totalRuns" = "totalRuns" + 1, "lastResult" = $2, "updatedAt" = NOW()
           WHERE id = $3
           RETURNING *`,
          [nextRun, JSON.stringify(result), input.id]
        );
        return updateR.rows[0];
      } finally {
        await pg.end();
      }
    }),

  agents: publicProcedure.query(() => AGENTS),
});

/**
 * Execute a cron job by dispatching to the appropriate agent
 */
async function runCronJob(job: any): Promise<any> {
  const agentPersona = AGENT_PROMPTS[job.agent] || AGENT_PROMPTS["ABBY"];

  try {
    const completion = await invokeLLM({
      messages: [
        { role: "system", content: agentPersona },
        { role: "user", content: `TASK: ${job.prompt}\n\nPlease execute this task and return a structured response.` },
      ],
      maxTokens: 2048,
    });

    const resultText = completion?.choices?.[0]?.message?.content || "No response";

    // Special handling for MR.NICE (posting) — also save to content_queue
    if (job.agent === "MR.NICE" || /post|publish|share/i.test(job.prompt)) {
      try {
        const pg = await getPg();
        if (pg) {
          // Detect platform from prompt
          const platformMatch = job.prompt.match(/instagram|facebook|tiktok|linkedin|twitter|reddit|google business|wordpress/i);
          const platform = platformMatch ? platformMatch[0].toLowerCase().replace(/\s+/g, "") : "instagram";
          await pg.query(
            `INSERT INTO content_queue ("businessId", platform, "contentType", title, content, status, "createdAt", "updatedAt")
             VALUES ($1, $2, 'social', $3, $4, 'pending', NOW(), NOW())`,
            [1, platform, `Auto: ${job.name}`, resultText.slice(0, 5000)]
          );
          await pg.end();
        }
      } catch (e) {
        console.warn("[Cron] Failed to save content:", String(e));
      }
    }

    return {
      success: true,
      agent: job.agent,
      response: resultText.slice(0, 2000),
      timestamp: new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      success: false,
      agent: job.agent,
      error: e?.message || String(e),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Background scheduler — runs every 30 seconds, checks for due jobs
 */
let schedulerStarted = false;
export function startCronScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log("[Cron] Scheduler started");

  setInterval(async () => {
    const pg = await getPg();
    if (!pg) return;
    try {
      // Find due jobs
      const r = await pg.query(
        `SELECT * FROM cron_jobs WHERE status = 'active' AND "nextRun" <= NOW() LIMIT 10`
      );

      for (const job of r.rows) {
        try {
          const result = await runCronJob(job);
          const nextRun = computeNextRun(job.schedule);
          await pg.query(
            `UPDATE cron_jobs SET "lastRun" = NOW(), "nextRun" = $1, "totalRuns" = "totalRuns" + 1, "lastResult" = $2, "updatedAt" = NOW() WHERE id = $3`,
            [nextRun, JSON.stringify(result), job.id]
          );
          console.log(`[Cron] Ran job ${job.id} (${job.name}) → ${result.success ? "ok" : "err"}`);
        } catch (e) {
          console.error(`[Cron] Job ${job.id} failed:`, e);
        }
      }

      // Self-improvement: every cycle, also run the autonomous runtime on a self-improvement objective
      // (skip if there are already many recent cycles in the last hour)
      try {
        const recent = await pg.query(
          `SELECT COUNT(*) as c FROM runtime_cycles WHERE created_at > NOW() - INTERVAL '1 hour'`
        );
        const recentCount = parseInt(recent.rows[0]?.c || "0");
        if (recentCount < 3) {
          // Run a self-improvement cycle
          const state = await runCycle("Continuously improve system health, reliability, and performance");
          console.log(`[SelfImprove] Cycle ${state.cycleId} → status=${state.terminalStatus}, confidence=${state.confidence.toFixed(2)}`);
        }
      } catch (e) {
        // Silent — self-improvement is optional
      }
    } catch (e) {
      console.error("[Cron] Scheduler error:", e);
    } finally {
      await pg.end();
    }
  }, 30_000);
}
