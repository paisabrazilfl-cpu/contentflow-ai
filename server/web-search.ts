/**
 * Web Search Service
 *
 * Unified web search & research using Firecrawl (no Tavily/Exa needed).
 * - searchWeb(): search the web and return results
 * - researchTopic(): deep research on a topic (search + scrape top results)
 * - fetchPage(): fetch + extract markdown from a single URL
 *
 * Firecrawl is already configured in env. Tavily/Exa were deprecated.
 */

import { ENV } from "./_core/env";

const FIRECRAWL_API = "https://api.firecrawl.dev";

export type SearchResult = {
  url: string;
  title: string;
  description: string;
  content?: string;
};

export type ResearchResult = {
  query: string;
  summary: string;
  sources: SearchResult[];
};

/**
 * Web search using Firecrawl's /search endpoint
 */
export async function searchWeb(
  query: string,
  options: { limit?: number; fetchContent?: boolean } = {}
): Promise<SearchResult[]> {
  const { limit = 5, fetchContent = false } = options;

  if (!ENV.firecrawlKey) {
    return fallbackDuckDuckGo(query, limit);
  }

  try {
    const res = await fetch(`${FIRECRAWL_API}/v1/search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) {
      console.warn(`[WebSearch] Firecrawl ${res.status}, falling back to DDG`);
      return fallbackDuckDuckGo(query, limit);
    }

    const data = await res.json();
    const items: SearchResult[] = (data.data || []).map((d: any) => ({
      url: d.url,
      title: d.title || d.metadata?.title || "",
      description: d.description || d.metadata?.description || "",
    }));

    if (fetchContent && items.length > 0) {
      // Optionally fetch the content of each result
      await Promise.allSettled(
        items.slice(0, 3).map(async (item) => {
          try {
            const page = await fetchPage(item.url);
            item.content = page?.content?.slice(0, 2000) || "";
          } catch {
            // ignore
          }
        })
      );
    }

    return items;
  } catch (e) {
    console.warn("[WebSearch] Firecrawl error, falling back:", String(e));
    return fallbackDuckDuckGo(query, limit);
  }
}

/**
 * Fetch a single page and extract content via Firecrawl
 */
export async function fetchPage(url: string): Promise<{ content: string; title: string; description: string } | null> {
  if (!ENV.firecrawlKey) {
    return null;
  }

  try {
    const res = await fetch(`${FIRECRAWL_API}/v1/scrape`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      content: data.data?.markdown || data.data?.content || "",
      title: data.data?.metadata?.title || "",
      description: data.data?.metadata?.description || "",
    };
  } catch {
    return null;
  }
}

/**
 * Deep research: search + scrape top results + summarize
 */
export async function researchTopic(
  query: string,
  options: { maxSources?: number } = {}
): Promise<ResearchResult> {
  const { maxSources = 3 } = options;

  const results = await searchWeb(query, { limit: maxSources, fetchContent: true });

  const sources = results.filter(r => r.content && r.content.length > 100).slice(0, maxSources);

  // Build a textual summary from the sources
  const combined = sources
    .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\n${(s.content || "").slice(0, 1000)}`)
    .join("\n\n---\n\n");

  return {
    query,
    summary: combined || "No detailed sources found for this query.",
    sources,
  };
}

/**
 * Fallback: DuckDuckGo HTML search (no API key needed)
 */
async function fallbackDuckDuckGo(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ContentFlow-AI/1.0)",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    // Extract result links + titles (basic regex parsing)
    const results: SearchResult[] = [];
    const linkRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const links: Array<{ url: string; title: string }> = [];
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const url = m[1];
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      if (url && title && url.startsWith("http")) {
        links.push({ url, title });
      }
    }
    const snippets: string[] = [];
    while ((m = snippetRe.exec(html)) !== null) {
      snippets.push(m[1].replace(/<[^>]+>/g, "").trim());
    }
    for (let i = 0; i < Math.min(links.length, limit); i++) {
      results.push({
        url: links[i].url,
        title: links[i].title,
        description: snippets[i] || "",
      });
    }
    return results;
  } catch {
    return [];
  }
}
