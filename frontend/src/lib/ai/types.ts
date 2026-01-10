export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}


export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'azure_openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}