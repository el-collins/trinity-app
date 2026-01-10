/**
 * AI Agent Configuration
 * 
 * Supports multiple LLM providers:
 * - Anthropic Claude
 * - OpenAI GPT-4
 * - Google Gemini
 * 
 * Set AGENTIC_PROVIDER in .env.local to choose provider
 */

import { AIConfig, AIProvider } from "./types";



export function getAIConfig(): AIConfig {
  const provider = (process.env.AGENTIC_PROVIDER || 'anthropic') as AIProvider;
  
  switch (provider) {
    case 'anthropic':
      return {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY!,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      };
    
    case 'openai':
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      };
    
    case 'gemini':
      return {
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY!,
         model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      };
    
      case 'azure_openai':
      return {
        provider: 'azure_openai',
        apiKey: process.env.AZURE_OPENAI_API_KEY!,
        // Azure uses deployment name, not model name
      };
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
