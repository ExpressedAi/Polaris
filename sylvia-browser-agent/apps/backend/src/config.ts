// LLM configuration management
export type LlmProvider = "openai" | "gemini" | "claude" | "openrouter";

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  temperature: number;
}

let llmConfig: LlmConfig = {
  provider: (process.env.SYLVIA_PROVIDER as LlmProvider) || "openrouter",
  model: process.env.SYLVIA_MODEL || "openai/gpt-4o-mini",
  temperature: 0.4
};

export function getLlmConfig(): LlmConfig {
  return { ...llmConfig };
}

export function updateLlmConfig(updates: Partial<LlmConfig>): LlmConfig {
  if (updates.provider !== undefined) {
    llmConfig.provider = updates.provider;
  }
  if (updates.model !== undefined) {
    llmConfig.model = updates.model;
  }
  if (updates.temperature !== undefined) {
    llmConfig.temperature = Math.max(0, Math.min(1, updates.temperature));
  }
  return { ...llmConfig };
}
