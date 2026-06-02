import { invokeLLM } from "./_core/llm";
import type { Business } from "../drizzle/schema";

export type ContentGenerationRequest = {
  platform: string;
  contentType: string; // blog, social, video, schema
  topic?: string;
  business: Business;
};

export type GeneratedContent = {
  title: string;
  content: string;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
};

const PLATFORM_GUIDELINES: Record<string, string> = {
  google: "Optimize for Google Business Profile. Keep it concise (1500 chars max), include a CTA, use local SEO keywords.",
  instagram: "Write an engaging Instagram caption (2200 chars max). Include relevant hashtags (up to 30). Use emojis sparingly. Include a hook in the first line.",
  facebook: "Write a Facebook post that encourages engagement. Ask questions, use storytelling. 1-3 paragraphs max.",
  tiktok: "Write a TikTok video script/caption. Keep it punchy, trendy, and under 300 chars for the caption. Include trending hashtag suggestions.",
  youtube: "Write a YouTube video title, description (5000 chars max with timestamps), and tags. Optimize for search.",
  reddit: "Write a Reddit post that provides genuine value. No promotional language. Be authentic and conversational. Match the subreddit tone.",
  wordpress: "Write a full blog post with H2/H3 headings, intro paragraph, 3-5 sections, conclusion with CTA. Include meta description and focus keyword. 1000-2000 words.",
};

const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  blog: "Generate a comprehensive blog article with proper heading structure (H2, H3), introduction, body sections, and conclusion. Include internal linking suggestions and a meta description.",
  social: "Generate a social media post optimized for engagement. Include a hook, value proposition, and call-to-action.",
  video: "Generate a video script with: hook (first 3 seconds), intro, main content sections, CTA, and outro. Include visual/B-roll suggestions.",
  schema: "Generate structured data markup (JSON-LD) for the business. Include Organization, LocalBusiness, FAQ, or Article schema as appropriate.",
};

export async function generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const { platform, contentType, topic, business } = request;

  const platformGuide = PLATFORM_GUIDELINES[platform] || "Write engaging content for this platform.";
  const typeGuide = CONTENT_TYPE_INSTRUCTIONS[contentType] || CONTENT_TYPE_INSTRUCTIONS.social;

  const systemPrompt = `You are an expert AI content strategist and copywriter for "${business.name}".

BUSINESS CONTEXT:
- Industry: ${business.industry || "General"}
- Target Audience: ${business.targetAudience || "General audience"}
- Brand Voice/Tone: ${business.toneOfVoice || "Professional and engaging"}
- Website: ${business.websiteUrl || "N/A"}
- Description: ${business.description || "A growing business"}

PLATFORM GUIDELINES (${platform}):
${platformGuide}

CONTENT TYPE (${contentType}):
${typeGuide}

RULES:
1. Stay on-brand with the specified tone of voice
2. Never use placeholder text — generate real, publishable content
3. Include relevant keywords naturally for SEO
4. Make content actionable and valuable to the target audience
5. Adapt length and format to the platform requirements`;

  const userPrompt = topic
    ? `Generate ${contentType} content for ${platform} about: "${topic}"`
    : `Generate ${contentType} content for ${platform} that would be relevant and valuable for our target audience in the ${business.industry || "general"} industry. Choose a trending or evergreen topic.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "generated_content",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "The title or headline for the content" },
            content: { type: "string", description: "The full generated content body" },
            hashtags: {
              type: "array",
              items: { type: "string" },
              description: "Relevant hashtags (for social platforms)"
            },
            seoKeywords: {
              type: "array",
              items: { type: "string" },
              description: "SEO keywords targeted in this content"
            },
            metaDescription: { type: "string", description: "Meta description for SEO (under 160 chars)" },
          },
          required: ["title", "content", "hashtags", "seoKeywords", "metaDescription"],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0]?.message?.content;
  const text = typeof messageContent === "string" ? messageContent : "";

  try {
    const parsed = JSON.parse(text);
    return {
      title: parsed.title,
      content: parsed.content,
      hashtags: parsed.hashtags,
      metadata: {
        seoKeywords: parsed.seoKeywords,
        metaDescription: parsed.metaDescription,
        platform,
        contentType,
        generatedAt: Date.now(),
      },
    };
  } catch {
    // If JSON parsing fails, use the raw text
    return {
      title: topic || `${contentType} for ${platform}`,
      content: text,
      metadata: { platform, contentType, generatedAt: Date.now() },
    };
  }
}

export async function generateBatchContent(
  business: Business,
  platforms: string[],
  contentType: string,
  topic?: string
): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];
  for (const platform of platforms) {
    const content = await generateContent({ platform, contentType, topic, business });
    results.push(content);
  }
  return results;
}
