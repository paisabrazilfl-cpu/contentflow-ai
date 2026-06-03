/**
 * AI Visibility Score
 * 
 * Checks how visible a business is on AI engines (ChatGPT, Perplexity, Google AI)
 * by analyzing whether the LLM "knows" about the business when asked relevant questions.
 * 
 * Scores 0-100 based on:
 * - Does the AI mention the business by name?
 * - Does it recommend the business for relevant queries?
 * - How detailed is the AI's knowledge?
 * - Is the business cited in relevant contexts?
 */

import { invokeLLM } from "./_core/llm";

export type VisibilityResult = {
  overallScore: number; // 0-100
  breakdown: {
    nameRecognition: number; // 0-25
    relevanceScore: number; // 0-25
    detailLevel: number; // 0-25
    citationLikelihood: number; // 0-25
  };
  citationsDetected: number;
  recommendations: string[];
  lastChecked: number; // timestamp
};

/**
 * Check AI visibility for a business
 */
export async function checkAIVisibility(
  businessName: string,
  industry: string,
  keywords: string[],
  websiteUrl?: string
): Promise<VisibilityResult> {
  // Ask the LLM to evaluate how well it knows this business
  const searchQueries = keywords.slice(0, 5).map(k => `best ${k} ${industry}`);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are evaluating how visible a business is to AI systems. You represent what AI assistants (ChatGPT, Claude, Perplexity, Google AI) would know about this business. Be honest — if you don't know the business, score it low. Only give high scores if the business is genuinely well-known in its space.`
      },
      {
        role: "user",
        content: `Evaluate the AI visibility of this business:

Business: ${businessName}
Industry: ${industry}
Website: ${websiteUrl || "N/A"}
Keywords: ${keywords.join(", ")}

Questions to consider:
1. Would you mention "${businessName}" if someone asked: "${searchQueries[0] || `best ${industry} company`}"?
2. How much do you know about this specific business?
3. Would you cite their website as a source for ${industry}-related questions?
4. How likely is this business to appear in AI-generated recommendations?

Score each dimension and provide an overall AI visibility score 0-100.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "visibility_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: { type: "integer", description: "Overall AI visibility score 0-100" },
            nameRecognition: { type: "integer", description: "How well AI recognizes the business name 0-25" },
            relevanceScore: { type: "integer", description: "How relevant the business is for industry queries 0-25" },
            detailLevel: { type: "integer", description: "How much detail AI knows about the business 0-25" },
            citationLikelihood: { type: "integer", description: "How likely AI would cite/recommend this business 0-25" },
            citationsDetected: { type: "integer", description: "Estimated number of contexts where business would be mentioned" },
            recommendations: { type: "array", items: { type: "string" }, description: "How to improve AI visibility" }
          },
          required: ["overallScore", "nameRecognition", "relevanceScore", "detailLevel", "citationLikelihood", "citationsDetected", "recommendations"],
          additionalProperties: false
        }
      }
    }
  });

  const text = response.choices[0]?.message?.content;
  if (!text || typeof text !== "string") {
    return {
      overallScore: 0,
      breakdown: { nameRecognition: 0, relevanceScore: 0, detailLevel: 0, citationLikelihood: 0 },
      citationsDetected: 0,
      recommendations: ["Could not check visibility. Try again later."],
      lastChecked: Date.now(),
    };
  }

  const parsed = JSON.parse(text);
  return {
    overallScore: Math.min(100, Math.max(0, parsed.overallScore)),
    breakdown: {
      nameRecognition: parsed.nameRecognition,
      relevanceScore: parsed.relevanceScore,
      detailLevel: parsed.detailLevel,
      citationLikelihood: parsed.citationLikelihood,
    },
    citationsDetected: parsed.citationsDetected,
    recommendations: parsed.recommendations,
    lastChecked: Date.now(),
  };
}
