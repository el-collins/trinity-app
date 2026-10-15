import { getAIConfig } from './config';
import { AIMessage, AIResponse } from './types';
import { fetchWithRetry } from './http';


/**
 * Universal AI Client
 * Supports Anthropic Claude, OpenAI GPT-4, and Google Gemini
 */
export class AIClient {
  private config = getAIConfig();

  async chat(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    const started = Date.now();
    let result: AIResponse;
    switch (this.config.provider) {
      case 'anthropic':
        result = await this.chatAnthropic(messages, systemPrompt);
        break;

      case 'openai':
        result = await this.chatOpenAI(messages, systemPrompt);
        break;

      case 'gemini':
        result = await this.chatGemini(messages, systemPrompt);
        break;

      case 'azure_openai':
        result = await this.chatAzureOpenAI(messages, systemPrompt);
        break;

      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
    console.info(
      JSON.stringify({
        event: 'ai_call',
        provider: this.config.provider,
        latencyMs: Date.now() - started,
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
      })
    );
    return result;
  }

  private async chatAnthropic(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    const { response } = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.filter((m) => m.role !== 'system'),
      }),
    });

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
  }

  private async chatOpenAI(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    const formattedMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const { response } = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
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

    const { response } = await fetchWithRetry(
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

    const { response } = await fetchWithRetry(url, {
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
