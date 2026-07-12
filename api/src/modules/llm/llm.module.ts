import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProviderFactory } from './llm-provider.factory';
import { GeminiProvider } from './providers/gemini.provider';
import { PromptLoader } from './prompt-loader';

@Module({
  providers: [LlmService, LlmProviderFactory, GeminiProvider, PromptLoader],
  exports: [LlmService, PromptLoader],
})
export class LlmModule {}
