import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProviderFactory } from './llm-provider.factory';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [LlmService, LlmProviderFactory, GeminiProvider],
  exports: [LlmService],
})
export class LlmModule {}
