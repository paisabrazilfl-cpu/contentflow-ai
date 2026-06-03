/**
 * Content Quality Control
 * 
 * Provides:
 * - Quality scoring (1-10) via LLM
 * - Brand voice consistency check
 * - Duplicate detection (similarity against recent posts)
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { contentQueue } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export type QualityScore = {
  overall: number; // 1-10
  relevance: number;
  engagement: number;
  seoOptimization: number;
  brandVoiceMatch: number;
  reasoning: string;
  suggestions: string[];
  isDuplicate: boolean;
  duplicateSimilarity: number; // 0-100
};

/**
 * Score content quality using LLM
 */
export async function scoreContent(
  content: string,
  title: string,
  platform: string,
  brandVoice: string,
  targetAudience: string,
  recentTitles: string[]
): Promise<QualityScore> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a content quality analyst. Score the given content on multiple dimensions. Be strict and honest — only give 8+ for genuinely excellent content. Check for duplicate/similar content against the recent posts list.`
      },
      {
        role: "user",
        content: `Score this content:

TITLE: ${title}
PLATFORM: ${platform}
CONTENT: ${content.slice(0, 2000)}

BRAND VOICE: ${brandVoice || "Professional and engaging"}
TARGET AUDIENCE: ${targetAudience || "General audience"}

RECENT POST TITLES (check for duplicates):
${recentTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join("\n")}

Score each dimension 1-10 and provide brief reasoning.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quality_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overall: { type: "integer", description: "Overall quality score 1-10" },
            relevance: { type: "integer", description: "Topic relevance to audience 1-10" },
            engagement: { type: "integer", description: "Engagement potential 1-10" },
            seoOptimization: { type: "integer", description: "SEO optimization level 1-10" },
            brandVoiceMatch: { type: "integer", description: "Brand voice consistency 1-10" },
            reasoning: { type: "string", description: "Brief explanation of scores" },
            suggestions: { type: "array", items: { type: "string" }, description: "Improvement suggestions" },
            isDuplicate: { type: "boolean", description: "Whether this is too similar to a recent post" },
            duplicateSimilarity: { type: "integer", description: "Similarity percentage to most similar recent post 0-100" }
          },
          required: ["overall", "relevance", "engagement", "seoOptimization", "brandVoiceMatch", "reasoning", "suggestions", "isDuplicate", "duplicateSimilarity"],
          additionalProperties: false
        }
      }
    }
  });

  const text = response.choices[0]?.message?.content;
  if (!text || typeof text !== "string") {
    return {
      overall: 5, relevance: 5, engagement: 5, seoOptimization: 5, brandVoiceMatch: 5,
      reasoning: "Could not score content", suggestions: [], isDuplicate: false, duplicateSimilarity: 0
    };
  }

  return JSON.parse(text) as QualityScore;
}

/**
 * Get recent post titles for duplicate detection
 */
export async function getRecentTitles(businessId: number, limit = 50): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select({ title: contentQueue.title })
    .from(contentQueue)
    .where(eq(contentQueue.businessId, businessId))
    .orderBy(desc(contentQueue.createdAt))
    .limit(limit);
  return items.map(i => i.title || "").filter(Boolean);
}
