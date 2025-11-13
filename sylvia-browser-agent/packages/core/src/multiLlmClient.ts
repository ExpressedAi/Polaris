// Multi-provider LLM client supporting OpenAI, Gemini, Claude, and OpenRouter
import type { LlmMessage } from "./models";

export type LlmProvider = "openai" | "gemini" | "claude" | "openrouter";

export interface MultiLlmClientOptions {
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface EnvConfig {
  openaiKey?: string;
  geminiKey?: string;
  anthropicKey?: string;
  openrouterKey?: string;
  defaultProvider: LlmProvider;
  defaultModel: string;
  defaultTemperature: number;
}

function getEnvConfig(): EnvConfig {
  return {
    openaiKey: process.env.OPENAI_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openrouterKey: process.env.OPENROUTER_API_KEY,
    defaultProvider: (process.env.SYLVIA_PROVIDER as LlmProvider) || "openrouter",
    defaultModel: process.env.SYLVIA_MODEL || "openai/gpt-4o-mini",
    defaultTemperature: process.env.SYLVIA_TEMPERATURE ? Number(process.env.SYLVIA_TEMPERATURE) : 0.4
  };
}

export class MultiLlmClient {
  private config: EnvConfig;

  constructor(config?: Partial<EnvConfig>) {
    this.config = { ...getEnvConfig(), ...(config || {}) };
  }

  async chat(messages: LlmMessage[], options: MultiLlmClientOptions = {}): Promise<string> {
    const provider = options.provider || this.config.defaultProvider;
    const model = options.model || this.config.defaultModel;
    const temperature = options.temperature ?? this.config.defaultTemperature;
    const maxTokens = options.maxTokens ?? 2048;

    switch (provider) {
      case "openai":
        return this.callOpenAI(messages, { model, temperature, maxTokens });
      case "gemini":
        return this.callGemini(messages, { model, temperature, maxTokens });
      case "claude":
        return this.callClaude(messages, { model, temperature, maxTokens });
      case "openrouter":
        return this.callOpenRouter(messages, { model, temperature, maxTokens });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // ---------- OpenRouter (Unified API for all providers) ----------

  private async callOpenRouter(
    messages: LlmMessage[],
    opts: { model: string; temperature: number; maxTokens: number }
  ): Promise<string> {
    if (!this.config.openrouterKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }

    const body = {
      model: opts.model, // e.g., "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash-exp"
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.openrouterKey}`,
        "HTTP-Referer": "https://sylvia-sidecar.app",
        "X-Title": "Sylvia Sidecar"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "[No response from OpenRouter]";
    return content.trim();
  }

  // ---------- OpenAI ----------

  private async callOpenAI(
    messages: LlmMessage[],
    opts: { model: string; temperature: number; maxTokens: number }
  ): Promise<string> {
    if (!this.config.openaiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const body = {
      model: opts.model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.openaiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "[No response from OpenAI]";
    return content.trim();
  }

  // ---------- Gemini (Google) ----------

  private async callGemini(
    messages: LlmMessage[],
    opts: { model: string; temperature: number; maxTokens: number }
  ): Promise<string> {
    if (!this.config.geminiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Gemini uses systemInstruction for system messages
    const systemMessages = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const nonSystem = messages.filter((m) => m.role !== "system");

    const contents = nonSystem.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: opts.temperature,
        maxOutputTokens: opts.maxTokens
      }
    };

    if (systemMessages) {
      body.systemInstruction = {
        parts: [{ text: systemMessages }]
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${this.config.geminiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p.text || "").join("\n").trim();

    return text || "[No response from Gemini]";
  }

  // ---------- Claude (Anthropic) ----------

  private async callClaude(
    messages: LlmMessage[],
    opts: { model: string; temperature: number; maxTokens: number }
  ): Promise<string> {
    if (!this.config.anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const systemMessages = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const nonSystem = messages.filter((m) => m.role !== "system");

    const body: any = {
      model: opts.model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      messages: nonSystem.map((m) => ({
        role: m.role,
        content: m.content
      }))
    };

    if (systemMessages) {
      body.system = systemMessages;
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.anthropicKey!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Claude error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const contentBlocks = json.content || [];
    const text = contentBlocks
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return text || "[No response from Claude]";
  }
}
