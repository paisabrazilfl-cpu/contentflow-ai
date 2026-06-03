/**
 * Business Analyzer — Onboarding Intelligence
 * 
 * Analyzes a business website URL via LLM to extract:
 * - Business niche/industry
 * - Key services/products
 * - Target audience
 * - Competitors
 * - Recommended topic clusters
 * - Optimal posting schedule per platform
 * - Platform priorities
 */

import { invokeLLM } from "./_core/llm";

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
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert digital marketing strategist and business analyst. Analyze the given business and generate a comprehensive content strategy. Be specific and actionable. Base your analysis on the business name and URL provided — infer the industry, services, and audience from the domain name and business name.`
      },
      {
        role: "user",
        content: `Analyze this business and create a full content strategy:

Business Name: ${businessName}
Website URL: ${websiteUrl}

Generate a comprehensive analysis including:
1. Their likely industry/niche
2. Key services or products they offer
3. Their target audience demographics and psychographics
4. 3-5 likely competitors in their space
5. 8-12 topic clusters for content creation
6. Recommended tone of voice
7. Optimal posting schedule for each platform (Google Business, Instagram, Facebook, TikTok, YouTube, Reddit, WordPress)
8. A brief content strategy summary
9. 10-15 SEO keywords to target`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "business_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            industry: { type: "string", description: "The business industry/niche" },
            services: { type: "array", items: { type: "string" }, description: "Key services or products" },
            targetAudience: { type: "string", description: "Target audience description" },
            competitors: { type: "array", items: { type: "string" }, description: "Likely competitors" },
            topicClusters: { type: "array", items: { type: "string" }, description: "Content topic clusters" },
            toneOfVoice: { type: "string", description: "Recommended brand tone" },
            postingSchedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  frequency: { type: "string" },
                  bestTime: { type: "string" },
                  priority: { type: "integer" }
                },
                required: ["platform", "frequency", "bestTime", "priority"],
                additionalProperties: false
              },
              description: "Posting schedule per platform"
            },
            contentStrategy: { type: "string", description: "Brief content strategy summary" },
            keywords: { type: "array", items: { type: "string" }, description: "SEO keywords to target" }
          },
          required: ["industry", "services", "targetAudience", "competitors", "topicClusters", "toneOfVoice", "postingSchedule", "contentStrategy", "keywords"],
          additionalProperties: false
        }
      }
    }
  });

  const text = response.choices[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("Failed to get analysis from LLM");
  }

  return JSON.parse(text) as BusinessAnalysis;
}
