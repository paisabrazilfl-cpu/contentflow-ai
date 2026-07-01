/**
 * Business Analyzer — Onboarding Intelligence
 *
 * Uses Firecrawl to ACTUALLY scrape the website, then asks the LLM
 * to analyze the real content (not guess from URL/name alone).
 */

import { invokeLLM } from "./_core/llm";
import { fetchPage } from "./web-search";

export type BusinessAnalysis = {
  industry: string;
  services: string[];
  targetAudience: string;
  competitors: string[];
  topicClusters: string[];
  toneOfVoice: string;
  postingSchedule: Array<{ platform: string; frequency: string; bestTime: string; priority: number }>;
  contentStrategy: string;
  keywords: string[];
};

export async function analyzeBusinessWebsite(websiteUrl: string, businessName: string): Promise<BusinessAnalysis> {
  // 1) Scrape the actual website
  let siteContent = "";
  let siteTitle = "";
  let siteDescription = "";
  try {
    const page = await fetchPage(websiteUrl);
    if (page) {
      siteTitle = page.title;
      siteDescription = page.description;
      siteContent = page.content.slice(0, 6000);
    }
  } catch (e) {
    console.warn("[BusinessAnalyzer] Could not scrape site, falling back to name inference:", String(e));
  }

  // 2) Ask the LLM with the actual scraped content
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert digital marketing strategist and business analyst. Analyze the given business and generate a comprehensive content strategy. Be specific and actionable.`,
      },
      {
        role: "user",
        content: `Analyze this business and create a full content strategy:

Business Name: ${businessName}
Website URL: ${websiteUrl}

${siteContent ? `SCRAPED WEBSITE CONTENT:
Title: ${siteTitle}
Description: ${siteDescription}

${siteContent}

` : ""}${siteContent ? "Base your analysis on the ACTUAL scraped content above." : "Infer the industry from the domain name and business name."}

Generate a comprehensive analysis including:
1. Their industry/niche
2. Key services or products they offer
3. Their target audience demographics and psychographics
4. 3-5 likely competitors in their space
5. 8-12 topic clusters for content creation
6. Recommended tone of voice
7. Optimal posting schedule for each platform (Google Business, Instagram, Facebook, TikTok, YouTube, Reddit, WordPress)
8. A brief content strategy summary
9. 10-15 SEO keywords to target`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "business_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            industry: { type: "string" },
            services: { type: "array", items: { type: "string" } },
            targetAudience: { type: "string" },
            competitors: { type: "array", items: { type: "string" } },
            topicClusters: { type: "array", items: { type: "string" } },
            toneOfVoice: { type: "string" },
            postingSchedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  frequency: { type: "string" },
                  bestTime: { type: "string" },
                  priority: { type: "integer" },
                },
                required: ["platform", "frequency", "bestTime", "priority"],
                additionalProperties: false,
              },
            },
            contentStrategy: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
          },
          required: ["industry", "services", "targetAudience", "competitors", "topicClusters", "toneOfVoice", "postingSchedule", "contentStrategy", "keywords"],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.choices[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("Failed to get analysis from LLM");
  }

  // Sometimes the LLM wraps in markdown ```json ... ``` — strip that
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  return JSON.parse(cleaned) as BusinessAnalysis;
}
