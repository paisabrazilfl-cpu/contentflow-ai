import { ENV } from "./env";
import * as db from "../db";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
export type FileContent = { type: "file_url"; file_url: { url: string; mime_type?: string } };
export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = { type: "function"; function: { name: string } };
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

export type JsonSchema = { name: string; schema: Record<string, unknown>; strict?: boolean };
export type OutputSchema = JsonSchema;
export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

type Provider = "openai" | "anthropic" | "nvidia" | "gemini" | "kimi" | "openrouter";

type ProviderConfig = {
  baseUrl: string;
  apiKey?: string;
  model: string;
};

// Try providers in order; return the first one with a valid key
async function pickProvider(): Promise<ProviderConfig | null> {
  // 1. OpenAI (env var)
  if (ENV.openAiKey) {
    return { baseUrl: "https://api.openai.com/v1", apiKey: ENV.openAiKey, model: "gpt-4o-mini" };
  }
  // 2. NVIDIA NIM (OpenAI-compatible, free tier)
  if (ENV.nvidiaKey) {
    return { baseUrl: "https://integrate.api.nvidia.com/v1", apiKey: ENV.nvidiaKey, model: "meta/llama-3.1-70b-instruct" };
  }
  // 3. OpenRouter (OpenAI-compatible, has free models)
  if (ENV.openRouterKey) {
    return { baseUrl: "https://openrouter.ai/api/v1", apiKey: ENV.openRouterKey, model: "meta-llama/llama-3.1-8b-instruct:free" };
  }
  // 4. Anthropic
  if (ENV.anthropicKey) {
    return { baseUrl: "https://api.anthropic.com/v1", apiKey: ENV.anthropicKey, model: "claude-3-5-sonnet-20241022" };
  }
  // 5. Gemini
  if (ENV.geminiKey) {
    return { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", apiKey: ENV.geminiKey, model: "gemini-2.0-flash" };
  }
  // 6. Kimi (Moonshot, OpenAI-compatible)
  if (ENV.kimiKey) {
    return { baseUrl: "https://api.moonshot.cn/v1", apiKey: ENV.kimiKey, model: "moonshot-v1-8k" };
  }
  // 7. Try DB-stored API keys (per-user OpenAI keys)
  try {
    const allBusinesses = await db.getAllBusinesses?.() || [];
    for (const biz of allBusinesses) {
      const keys = await db.getApiKeys(biz.id);
      const openaiKey = keys.find((k: any) => /openai/i.test(k.provider || "") || /openai/i.test(k.keyName || ""));
      if (openaiKey) {
        return { baseUrl: "https://api.openai.com/v1", apiKey: openaiKey.keyValue, model: "gpt-4o-mini" };
      }
    }
  } catch {
    // ignore — DB might not be available
  }
  return null;
}

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;
  const content = Array.isArray(message.content) ? message.content : [message.content];
  const parts = content.map((c): TextContent | ImageContent | FileContent => {
    if (typeof c === "string") return { type: "text", text: c };
    return c as any;
  });
  if (parts.length === 1 && parts[0].type === "text") {
    return { role, name, content: parts[0].text };
  }
  return { role, name, content: parts };
};

const normalizeResponseFormat = ({
  responseFormat, response_format, outputSchema, output_schema,
}: any) => {
  const explicit = responseFormat || response_format;
  if (explicit) return explicit;
  const schema = outputSchema || output_schema;
  if (!schema) return undefined;
  return { type: "json_schema", json_schema: { name: schema.name, schema: schema.schema, strict: schema.strict ?? true } };
};

const toAnthropicMessages = (messages: Message[]) => {
  const system = messages.find(m => m.role === "system");
  const rest = messages.filter(m => m.role !== "system").map(m => {
    const c = Array.isArray(m.content) ? m.content : [m.content];
    const text = c.map(x => typeof x === "string" ? x : (x as any).text || "").join("\n");
    return { role: m.role, content: text };
  });
  return { system: typeof system?.content === "string" ? system.content : "", messages: rest };
};

async function callOpenAICompatible(config: ProviderConfig, payload: any): Promise<any> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM call failed (${config.baseUrl}): ${res.status} – ${t}`);
  }
  return res.json();
}

async function callAnthropic(config: ProviderConfig, payload: any): Promise<any> {
  const { system, messages } = toAnthropicMessages(payload.messages);
  const res = await fetch(`${config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      system,
      messages,
      max_tokens: payload.max_tokens || 4096,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic call failed: ${res.status} – ${t}`);
  }
  const data = await res.json();
  // Convert to OpenAI-style response
  return {
    id: data.id,
    created: Date.now(),
    model: data.model,
    choices: [{
      index: 0,
      message: { role: "assistant", content: data.content?.[0]?.text || "" },
      finish_reason: data.stop_reason,
    }],
    usage: { prompt_tokens: data.usage?.input_tokens || 0, completion_tokens: data.usage?.output_tokens || 0, total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) },
  };
}

/**
 * Try each provider in order until one succeeds.
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const { messages, responseFormat, response_format, outputSchema, output_schema, maxTokens, max_tokens } = params;
  const payload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };
  payload.max_tokens = maxTokens || max_tokens || 4096;

  const normalizedFormat = normalizeResponseFormat({ responseFormat, response_format, outputSchema, output_schema });
  if (normalizedFormat) payload.response_format = normalizedFormat;

  // Build candidate list (NVIDIA first since OpenAI quota is exhausted)
  const candidates: ProviderConfig[] = [];
  if (ENV.nvidiaKey) candidates.push({ baseUrl: "https://integrate.api.nvidia.com/v1", apiKey: ENV.nvidiaKey, model: "meta/llama-3.1-70b-instruct" });
  if (ENV.openAiKey) candidates.push({ baseUrl: "https://api.openai.com/v1", apiKey: ENV.openAiKey, model: "gpt-4o-mini" });
  if (ENV.openRouterKey) candidates.push({ baseUrl: "https://openrouter.ai/api/v1", apiKey: ENV.openRouterKey, model: "meta-llama/llama-3.1-8b-instruct:free" });
  if (ENV.anthropicKey) candidates.push({ baseUrl: "https://api.anthropic.com/v1", apiKey: ENV.anthropicKey, model: "claude-3-5-sonnet-20241022" });
  if (ENV.geminiKey) candidates.push({ baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", apiKey: ENV.geminiKey, model: "gemini-2.0-flash" });
  if (ENV.kimiKey) candidates.push({ baseUrl: "https://api.moonshot.cn/v1", apiKey: ENV.kimiKey, model: "moonshot-v1-8k" });

  if (candidates.length === 0) {
    throw new Error("No LLM API key configured. Set OPENAI_API_KEY, NVIDIA_API_KEY, etc.");
  }

  const errors: string[] = [];
  for (const provider of candidates) {
    try {
      const p = { ...payload, model: provider.model };
      const data = provider.baseUrl.includes("anthropic.com")
        ? await callAnthropic(provider, p)
        : await callOpenAICompatible(provider, p);
      return data as InvokeResult;
    } catch (e: any) {
      const msg = `${provider.baseUrl}/${provider.model}: ${e?.message?.slice(0, 200) || e}`;
      errors.push(msg);
      console.warn(`[LLM] Provider ${provider.model} failed: ${msg}`);
      // Continue to next provider
    }
  }

  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}