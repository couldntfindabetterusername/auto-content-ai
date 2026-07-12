import { ZodType } from 'zod';

export type ModelClass = 'cheap' | 'mid' | 'strong';

export interface LlmRequest<T = unknown> {
  purpose: string;
  modelClass: ModelClass;
  prompt: string;
  systemPrompt?: string;
  outputSchema: ZodType<T>;
  maxTokens?: number;
  jobId?: string;
  agentRunId?: string;
}

export interface LlmResponse<T> {
  data: T;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  latencyMs: number;
}

export interface LlmProviderResponse {
  content: string;
  tokensInput: number;
  tokensOutput: number;
}

export interface LlmProvider {
  getModel(modelClass: ModelClass): string;
  generate(
    model: string,
    prompt: string,
    systemPrompt?: string,
    maxTokens?: number,
  ): Promise<LlmProviderResponse>;
  calculateCost(model: string, tokensInput: number, tokensOutput: number): number;
}
