/**
 * AI Visibility Score — REAL web search version
 *
 * Uses Firecrawl (web search) to find ACTUAL mentions of the business
 * across the web, then asks the LLM to score visibility based on real data.
 *
 * Replaces the old "ask the LLM if it knows" approach (which was unreliable).
 */

import { invokeLLM } from "./_core/llm";
import { searchWeb, fetchPage } from "./web-search";

export type VisibilityResult = {
  overallScore: number; // 0-100
  breakdown: {
    nameRecognition: number; // 0-25
    relevanceScore: number; // 0-25
    detailLevel: number; // 0-25
    citationLikelihood: number; // 0-25
  };
  citationsDetected: number;
  searchResults: Array<{ url: string; title: string; description: string }>;
  recommendations: string[];
  lastChecked: number; // timestamp
};

/**
 * Check AI visibility for a business using real web search
 */
export async function checkAIVisibility(
  businessName: string,
  industry: string,
  keywords: string[],
  websiteUrl?: string
): Promise<VisibilityResult> {
  // 1) REAL web search — find what the AI can find
  const searchQueries = [
    businessName,
    `${businessName} ${industry}`,
    ...keywords.slice(0, 3).map(k => `best ${k} ${industry}`),
  ];

  const allResults: Array<{ url: string; title: string; description: string }> = [];
  for (const q of searchQueries.slice(0, 3)) {
    try {
      const r = await searchWeb(q, { limit: 3 });
      allResults.push(...r);
    } catch (e) {
      console.warn("[Visibility] search failed for:", q, String(e));
    }
  }

  // Dedupe by URL
  const seen = new Set<string>();
  const uniqueResults = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, 10);

  // 2) Detect direct mentions of business name in search results
  const nameRegex = new RegExp(businessName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const nameMentions = uniqueResults.filter(r =>
    nameRegex.test(r.title) || nameRegex.test(r.description)
  );

  // 3) Optionally fetch the business's own site
  let ownSiteContent = "";
  if (websiteUrl) {
    try {
      const page = await fetchPage(websiteUrl);
      if (page) {
        ownSiteContent = `${page.title}\n${page.description}\n${page.content.slice(0, 2000)}`;
      }
    } catch {
      // ignore
    }
  }

  // 4) Ask the LLM to score based on REAL search evidence
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an AI visibility analyst. You evaluate how visible a business is to AI systems (ChatGPT, Perplexity, Google AI). You base your score on REAL web search evidence, not on what you personally know.`,
      },
      {
        role: "user",
        content: `Score the AI visibility of "${businessName}" based on actual web search results.

Industry: ${industry}
Website: ${websiteUrl || "N/A"}
Keywords: ${keywords.join(", ")}

WEB SEARCH RESULTS for queries: ${searchQueries.slice(0, 3).join(" | ")}
${uniqueResults.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Description: ${r.description}`).join("\n")}

DIRECT MENTIONS of "${businessName}": ${nameMentions.length} out of ${uniqueResults.length} results

OWN WEBSITE CONTENT (first 2000 chars):
${ownSiteContent || "(no content scraped)"}

Based on this real evidence, score 0-100 for AI visibility:
- nameRecognition (0-25): How many of the top results mention the business?
- relevanceScore (0-25): Do the search results indicate the business is relevant for industry queries?
- detailLevel (0-25): How much information is available about the business online?
- citationLikelihood (0-25): Would an AI cite this business based on the available data?`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "visibility_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "integer" },
            nameRecognition: { type: "integer" },
            relevanceScore: { type: "integer" },
            detailLevel: { type: "integer" },
            citationLikelihood: { type: "integer" },
            citationsDetected: { type: "integer" },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["overallScore", "nameRecognition", "relevanceScore", "detailLevel", "citationLikelihood", "citationsDetected", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.choices[0]?.message?.content;
  let parsed: any = {
    overallScore: 0,
    nameRecognition: 0,
    relevanceScore: 0,
    detailLevel: 0,
    citationLikelihood: 0,
    citationsDetected: nameMentions.length,
    recommendations: ["Try again — could not parse LLM response"],
  };

  if (text && typeof text === "string") {
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("[Visibility] Failed to parse LLM response, using fallback");
    }
  }

  return {
    overallScore: Math.min(100, Math.max(0, parsed.overallScore ?? 0)),
    breakdown: {
      nameRecognition: parsed.nameRecognition ?? 0,
      relevanceScore: parsed.relevanceScore ?? 0,
      detailLevel: parsed.detailLevel ?? 0,
      citationLikelihood: parsed.citationLikelihood ?? 0,
    },
    citationsDetected: parsed.citationsDetected ?? nameMentions.length,
    searchResults: uniqueResults,
    recommendations: parsed.recommendations ?? ["Set up a website, list on directories (Yelp, GMB, Crunchbase)"],
    lastChecked: Date.now(),
  };
}
