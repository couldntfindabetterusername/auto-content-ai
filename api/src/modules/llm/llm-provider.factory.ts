import { Injectable } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { LlmProvider } from './llm.types';

@Injectable()
export class LlmProviderFactory {
  private readonly registry: Record<string, LlmProvider>;

  constructor(private readonly geminiProvider: GeminiProvider) {
    this.registry = {
      gemini: this.geminiProvider,
    };
  }

  getProvider(name: string): LlmProvider {
    const provider = this.registry[name];
    if (!provider) throw new Error(`Unknown LLM provider: ${name}`);
    return provider;
  }
}
