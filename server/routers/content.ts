import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  deleteContentQueueItem,
  getBrandVoice,
  getContentQueueByUserId,
  getCurrentMonth,
  getGeneratedContentByUserId,
  getSubscriptionByUserId,
  getUsageForMonth,
  incrementGenerationCount,
  insertContentQueueItem,
  insertGeneratedContent,
} from "../db";
import { sendUsageAlertEmail } from "../services/email";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getGenerationLimit, isUnlimited } from "../../shared/plans";
import type { PlanKey } from "../../shared/plans";

const PLATFORM_SCHEMA = z.enum([
  "google_youtube",
  "google_business",
  "meta_facebook",
  "meta_instagram",
  "tiktok",
  "reddit",
]);

const CONTENT_TYPE_SCHEMA = z.enum([
  "blog_post",
  "social_post",
  "video_script",
  "community_post",
  "ad_copy",
  "email_newsletter",
]);

// ─── Rate limit check ─────────────────────────────────────────────────────────
async function checkRateLimit(userId: number, userEmail: string | null | undefined, userName: string | null | undefined): Promise<void> {
  const sub = await getSubscriptionByUserId(userId);
  const plan = (sub?.plan ?? "free") as PlanKey;

  if (isUnlimited(plan)) return; // Agency = unlimited

  const limit = getGenerationLimit(plan);
  const month = getCurrentMonth();
  const usage = await getUsageForMonth(userId, month);
  const used = usage?.generationCount ?? 0;

  if (used >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `You've reached your ${limit} AI generation limit for this month on the ${plan} plan. Upgrade to generate more content.`,
    });
  }

  // Send alert at 80% usage
  if (used === Math.floor(limit * 0.8) && userEmail) {
    sendUsageAlertEmail(userEmail, userName ?? "there", used, limit, plan).catch(console.error);
  }
  // Send alert at 100%
  if (used + 1 >= limit && userEmail) {
    sendUsageAlertEmail(userEmail, userName ?? "there", used + 1, limit, plan).catch(console.error);
  }
}

// ─── Platform-specific prompt builder ────────────────────────────────────────
function buildGenerationPrompt(
  platform: string,
  contentType: string,
  topic: string,
  brandVoiceData: { businessName?: string | null; toneKeywords?: string | null; targetAudience?: string | null; avoidKeywords?: string | null } | null | undefined
): string {
  const brandContext = brandVoiceData
    ? `
Business: ${brandVoiceData.businessName ?? "Unknown"}
Tone: ${brandVoiceData.toneKeywords ?? "professional, engaging"}
Target Audience: ${brandVoiceData.targetAudience ?? "general audience"}
Avoid: ${brandVoiceData.avoidKeywords ?? "none specified"}`
    : "";

  const platformGuide: Record<string, string> = {
    google_youtube: "Create a YouTube video script with a hook, main content, and CTA. Include timestamps.",
    google_business: "Write a Google Business post (max 1500 chars). Include a call-to-action.",
    meta_facebook: "Write an engaging Facebook post. Use emojis sparingly. Include a question to drive comments.",
    meta_instagram: "Write an Instagram caption with relevant hashtags (15-20). Engaging and visual.",
    tiktok: "Write a TikTok video script. Punchy hook in first 3 seconds. Trend-aware. Max 60 seconds.",
    reddit: "Write a Reddit post. Authentic, value-first, no overt promotion. Suitable for the topic's subreddit.",
  };

  const contentGuide: Record<string, string> = {
    blog_post: "Write a comprehensive SEO-optimized blog post with H2/H3 headings, introduction, body, and conclusion.",
    social_post: "Write a concise, engaging social media post optimized for the platform.",
    video_script: "Write a complete video script with scene descriptions, dialogue, and CTAs.",
    community_post: "Write a community-focused post that provides value and encourages discussion.",
    ad_copy: "Write compelling ad copy with a strong headline, benefits, and CTA.",
    email_newsletter: "Write an email newsletter with subject line, preview text, and body content.",
  };

  return `You are an expert content marketer and SEO specialist.
${brandContext}

Platform: ${platform.replace(/_/g, " ").toUpperCase()}
Content Type: ${contentType.replace(/_/g, " ")}
Topic: ${topic}

Platform Guidelines: ${platformGuide[platform] ?? "Create engaging, platform-appropriate content."}
Content Guidelines: ${contentGuide[contentType] ?? "Create high-quality content."}

Additional Requirements:
- Optimize for AEO (Answer Engine Optimization) — write content that AI engines like ChatGPT and Gemini will cite
- Include relevant keywords naturally
- Make it shareable and engaging
- Ensure it provides genuine value to the reader

Generate the content now:`;
}

export const contentRouter = router({
  // Generate AI content
  generate: protectedProcedure
    .input(
      z.object({
        platform: PLATFORM_SCHEMA,
        contentType: CONTENT_TYPE_SCHEMA,
        topic: z.string().min(3).max(500),
        additionalContext: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.user.id, ctx.user.email, ctx.user.name);

      const brandVoiceData = await getBrandVoice(ctx.user.id);
      const prompt = buildGenerationPrompt(input.platform, input.contentType, input.topic, brandVoiceData);

      const systemPrompt = `You are ContentFlow AI — an expert AI content automation system. Generate high-quality, platform-optimized content that drives engagement and ranks well in both traditional search and AI citation engines. Always return only the content itself, no meta-commentary.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt + (input.additionalContext ? `\n\nAdditional context: ${input.additionalContext}` : "") },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const result = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: { type: string; text?: string }) => c.type === "text" ? (c.text ?? "") : "").join("") : "");

      await incrementGenerationCount(ctx.user.id);
      await insertGeneratedContent({
        userId: ctx.user.id,
        platform: input.platform,
        contentType: input.contentType,
        prompt: input.topic,
        result,
        metadata: { additionalContext: input.additionalContext },
      });

      return { content: result };
    }),

  // Get generation history
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return getGeneratedContentByUserId(ctx.user.id, input.limit);
    }),

  // Get current usage stats
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getSubscriptionByUserId(ctx.user.id);
    const plan = (sub?.plan ?? "free") as PlanKey;
    const month = getCurrentMonth();
    const usage = await getUsageForMonth(ctx.user.id, month);
    const used = usage?.generationCount ?? 0;
    const limit = isUnlimited(plan) ? null : getGenerationLimit(plan);
    return { used, limit, plan, month };
  }),

  // Queue a post for publishing
  queuePost: protectedProcedure
    .input(
      z.object({
        platform: PLATFORM_SCHEMA,
        contentType: z.enum(["post", "video", "story", "reel", "community_post", "blog"]),
        title: z.string().max(512).optional(),
        body: z.string(),
        mediaUrls: z.array(z.string().url()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        scheduledAt: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await insertContentQueueItem({
        userId: ctx.user.id,
        platform: input.platform,
        contentType: input.contentType,
        title: input.title,
        body: input.body,
        mediaUrls: input.mediaUrls ?? [],
        metadata: input.metadata ?? {},
        scheduledAt: new Date(input.scheduledAt),
        status: "pending",
      });
      return { success: true };
    }),

  // Get content queue
  getQueue: protectedProcedure.query(async ({ ctx }) => {
    return getContentQueueByUserId(ctx.user.id);
  }),

  // Delete a queue item
  deleteQueueItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteContentQueueItem(input.id, ctx.user.id);
      return { success: true };
    }),
});
