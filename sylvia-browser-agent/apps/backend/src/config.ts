// LLM configuration management
export interface LlmConfig {
  model: string;
  temperature: number;
}

let llmConfig: LlmConfig = {
  model: process.env.SYLVIA_MODEL || "gpt-4o-mini",
  temperature: 0.4
};

export function getLlmConfig(): LlmConfig {
  return { ...llmConfig };
}

export function updateLlmConfig(updates: Partial<LlmConfig>): LlmConfig {
  if (updates.model !== undefined) {
    llmConfig.model = updates.model;
  }
  if (updates.temperature !== undefined) {
    llmConfig.temperature = Math.max(0, Math.min(1, updates.temperature));
  }
  return { ...llmConfig };
}
