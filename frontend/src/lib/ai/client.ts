import { getAIConfig } from './config';
import { AIMessage, AIResponse } from './types';


/**
 * Universal AI Client
 * Supports Anthropic Claude, OpenAI GPT-4, and Google Gemini
 */
export class AIClient {
  private config = getAIConfig();

  async chat(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    switch (this.config.provider) {
      case 'anthropic':
        return this.chatAnthropic(messages, systemPrompt);
      
      case 'openai':
        return this.chatOpenAI(messages, systemPrompt);
      
      case 'gemini':
        return this.chatGemini(messages, systemPrompt);
      
      case 'azure_openai':
        return this.chatAzureOpenAI(messages, systemPrompt);
      
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async chatAnthropic(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages.filter(m => m.role !== 'system'),
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        content: data.content[0].text,
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Anthropic API request timed out after 30 seconds. Check your network connection or firewall settings.');
      }
      throw error;
    }
  }

  private async chatOpenAI(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    const formattedMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: formattedMessages,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }

  private async chatGemini(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    // Gemini uses a different format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (systemPrompt) {
      contents.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  private async chatAzureOpenAI(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    const formattedMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    // Azure OpenAI requires endpoint and deployment name
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';

    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        messages: formattedMessages,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }
}

// Singleton instance
export const aiClient = new AIClient();
