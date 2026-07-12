import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmProvider, LlmProviderResponse, ModelClass } from '../llm.types';

const MODELS: Record<ModelClass, string> = {
  cheap: 'gemini-3.1-flash-lite',
  mid: 'gemini-3-flash-preview',
  strong: 'gemini-3.5-flash',
};

// Pricing per 1M tokens (USD) — verify at ai.google.dev/pricing
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'gemini-3-flash-preview': { input: 0.5, output: 3.0 },
  'gemini-3.5-flash': { input: 1.5, output: 9.0 },
};

const DEFAULT_MAX_TOKENS = 8192;

@Injectable()
export class GeminiProvider implements LlmProvider {
  private client: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY') ?? '';
    this.client = new GoogleGenerativeAI(apiKey);
  }

  getModel(modelClass: ModelClass): string {
    return MODELS[modelClass];
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const is503 = err?.message?.includes('503') || err?.status === 503;
        if (!is503 || attempt === maxRetries - 1) throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
    throw new Error('unreachable');
  }

  async generate(
    model: string,
    prompt: string,
    systemPrompt?: string,
    maxTokens = DEFAULT_MAX_TOKENS,
  ): Promise<LlmProviderResponse> {
    const genModel = this.client.getGenerativeModel({
      model,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    });

    const result = await this.withRetry(() =>
      genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    );

    const response = result.response;
    const usage = response.usageMetadata;

    return {
      content: response.text(),
      tokensInput: usage?.promptTokenCount ?? 0,
      tokensOutput: usage?.candidatesTokenCount ?? 0,
    };
  }

  calculateCost(model: string, tokensInput: number, tokensOutput: number): number {
    const pricing = PRICING[model] ?? { input: 0, output: 0 };
    return (tokensInput * pricing.input + tokensOutput * pricing.output) / 1_000_000;
  }
}
