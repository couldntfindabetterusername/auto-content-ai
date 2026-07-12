import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmProvider, LlmProviderResponse, ModelClass } from '../llm.types';

const MODELS: Record<ModelClass, string> = {
  cheap: 'gemini-2.0-flash',
  mid: 'gemini-2.5-flash',
  strong: 'gemini-2.5-pro',
};

// Pricing per 1M tokens (USD) — verify at ai.google.dev/pricing
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-2.5-pro': { input: 1.25, output: 5.0 },
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

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    });

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
