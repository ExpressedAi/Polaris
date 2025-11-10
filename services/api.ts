
export interface OpenRouterMessageContent {
  type: 'text' | 'input_image' | 'input_audio' | 'input_video';
  text?: string;
  image?: { url: string };
  input_audio?: { data: string; format: 'wav' | 'mp3' };
  video_url?: { url: string };
}

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterMessageContent[];
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ApiError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface WeightedPrompt {
  id: string;
  content: string;
  weight: number; // 1-100 percentage
}

export interface InferenceParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  minP?: number;
}

export interface ApiSettings {
  apiKey?: string;
  secondaryApiKey?: string;
  mainModel?: string;
  backupModel?: string;
  embeddingModel?: string;
  systemInstruction?: string;
  weightedPrompts?: WeightedPrompt[];
  temperature?: number;
  maxTokens?: number;
  inferenceParameters?: InferenceParameters; // Preflection-optimized parameters
  // Multi-modality settings
  useImageGeneration?: boolean;
  useWebSearch?: boolean;
  useAudioVideo?: boolean;
}

export async function sendMessage(
  messages: OpenRouterMessage[],
  settings: ApiSettings = {},
  useBackup: boolean = false
): Promise<string> {
  // BYO key only — we never fall back to bundled keys
  const apiKey = settings.apiKey?.trim() || settings.secondaryApiKey?.trim();
  
  if (!apiKey) {
    throw new Error('No OpenRouter API key found. Add your key in the Settings view to continue.');
  }

  // Get models from settings or env or defaults
  // Override model based on modality if specified
  let mainModel = settings.mainModel || 'openrouter/polaris-alpha';
  if (settings.useImageGeneration) {
    mainModel = 'google/gemini-2.5-flash-image';
  } else if (settings.useWebSearch) {
    mainModel = 'openai/gpt-4o-mini-search-preview';
  } else if (settings.useAudioVideo) {
    mainModel = 'google/gemini-2.5-flash-preview-09-2025';
  }
  const backupModel = settings.backupModel || 'x-ai/grok-4-fast';
  const model = useBackup ? backupModel : mainModel;

  // Prepare messages with system instruction if provided
  // System instruction should be included at the start of the conversation
  // We check if there's already a system message to avoid duplicates
  let finalMessages = [...messages];
  
  // Use weighted prompts if available, otherwise fall back to single system instruction
  if (settings.weightedPrompts && settings.weightedPrompts.length > 0) {
    const hasSystemMessage = finalMessages.some(m => m.role === 'system');
    if (!hasSystemMessage) {
      // Combine weighted prompts into a single system message
      // Sort by weight (descending) and combine with clear weighting indicators
      const sortedPrompts = [...settings.weightedPrompts].sort((a, b) => b.weight - a.weight);
      const combinedPrompt = sortedPrompts.map((prompt, index) => {
        const weightLabel = index === 0 ? 'PRIMARY' : index === 1 ? 'SECONDARY' : 'TERTIARY';
        return `[${weightLabel} PROMPT - ${prompt.weight}% WEIGHT]\n${prompt.content}`;
      }).join('\n\n---\n\n');
      
      finalMessages = [
        { role: 'system' as const, content: combinedPrompt },
        ...finalMessages
      ];
    }
  } else if (settings.systemInstruction && settings.systemInstruction.trim()) {
    const hasSystemMessage = finalMessages.some(m => m.role === 'system');
    if (!hasSystemMessage) {
      // Add system instruction at the beginning
      finalMessages = [
        { role: 'system' as const, content: settings.systemInstruction },
        ...finalMessages
      ];
    }
  }

  // Get temperature and max_tokens from settings or defaults
  // Preflection-optimized parameters take precedence over user settings
  const preflectionParams = settings.inferenceParameters || {};
  const temperature = preflectionParams.temperature ?? settings.temperature ?? 0.7;
  const maxTokens = settings.maxTokens ?? 128000;
  
  // Build request body with Preflection parameters if available
  const requestBody: any = {
    model,
    messages: finalMessages,
    temperature,
    max_tokens: maxTokens,
  };
  
  // Add Preflection-optimized parameters if provided
  if (preflectionParams.topP !== undefined) requestBody.top_p = preflectionParams.topP;
  if (preflectionParams.topK !== undefined) requestBody.top_k = preflectionParams.topK;
  if (preflectionParams.frequencyPenalty !== undefined) requestBody.frequency_penalty = preflectionParams.frequencyPenalty;
  if (preflectionParams.presencePenalty !== undefined) requestBody.presence_penalty = preflectionParams.presencePenalty;
  if (preflectionParams.repetitionPenalty !== undefined) requestBody.repetition_penalty = preflectionParams.repetitionPenalty;
  if (preflectionParams.minP !== undefined) requestBody.min_p = preflectionParams.minP;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Chat Platform Template',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: { message: `HTTP ${response.status}: ${response.statusText}` }
      }));
      
      // If main model fails and we haven't tried backup, retry with backup
      if (!useBackup && response.status >= 500) {
        console.warn(`Main model failed, trying backup model...`);
        return sendMessage(messages, settings, true);
      }
      
      throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    // If it's a network error and we haven't tried backup, retry with backup
    if (!useBackup && error instanceof TypeError && error.message.includes('fetch')) {
      console.warn(`Network error with main model, trying backup model...`);
      return sendMessage(messages, settings, true);
    }
    
    throw error;
  }
}
