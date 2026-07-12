import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodType } from 'zod';
import { createHash } from 'crypto';
import { llmCalls } from '../../db/schema';
import { LlmProviderFactory } from './llm-provider.factory';
import { LlmRequest, LlmResponse } from './llm.types';

const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TIMEOUT_MS = 60_000;

@Injectable()
export class LlmService {
  constructor(
    private readonly config: ConfigService,
    @Inject('DB') private readonly db: any,
    private readonly providerFactory: LlmProviderFactory,
  ) {}

  async generate<T>(request: LlmRequest<T>): Promise<LlmResponse<T>> {
    const providerName = this.config.get<string>('LLM_PROVIDER', DEFAULT_PROVIDER);
    const provider = this.providerFactory.getProvider(providerName);
    const model = provider.getModel(request.modelClass);
    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
    const timeoutMs = this.config.get<number>('LLM_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
    const start = Date.now();

    const call = (prompt: string) =>
      Promise.race([
        provider.generate(model, prompt, request.systemPrompt, maxTokens),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`LLM timeout after ${timeoutMs}ms`)), timeoutMs),
        ),
      ]);

    let raw = await call(request.prompt);
    let validated = tryParsedAndValidate(raw.content, request.outputSchema);

    if (validated === null) {
      const repairPrompt = buildRepairPrompt(raw.content);
      raw = await call(repairPrompt);
      validated = tryParsedAndValidate(raw.content, request.outputSchema);
    }

    if (validated === null) {
      throw new Error(`LLM output failed schema validation after repair (purpose=${request.purpose})`);
    }

    const latencyMs = Date.now() - start;
    const costUsd = provider.calculateCost(model, raw.tokensInput, raw.tokensOutput);
    const promptHash = createHash('sha256').update(request.prompt).digest('hex').slice(0, 32);

    await this.logCall({
      jobId: request.jobId,
      agentRunId: request.agentRunId,
      providerName,
      model,
      purpose: request.purpose,
      promptHash,
      tokensInput: raw.tokensInput,
      tokensOutput: raw.tokensOutput,
      costUsd,
      latencyMs,
    });

    return { data: validated, model, tokensInput: raw.tokensInput, tokensOutput: raw.tokensOutput, costUsd, latencyMs };
  }

  private async logCall(params: {
    jobId?: string;
    agentRunId?: string;
    providerName: string;
    model: string;
    purpose: string;
    promptHash: string;
    tokensInput: number;
    tokensOutput: number;
    costUsd: number;
    latencyMs: number;
  }): Promise<void> {
    try {
      await this.db.insert(llmCalls).values({
        job_id: params.jobId ?? null,
        agent_run_id: params.agentRunId ?? null,
        provider: params.providerName,
        model: params.model,
        purpose: params.purpose,
        prompt_hash: params.promptHash,
        tokens_input: params.tokensInput,
        tokens_output: params.tokensOutput,
        cost_usd: params.costUsd.toFixed(8),
        latency_ms: params.latencyMs,
      });
    } catch {
      // Logging must never break caller
    }
  }
}

function tryParsedAndValidate<T>(text: string, schema: ZodType<T>): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  const result = schema.safeParse(parsed);
  return result.success ? result.data : null;
}

function buildRepairPrompt(original: string): string {
  return `Your previous response could not be parsed as valid JSON or did not match the required schema. Return ONLY valid JSON with no markdown fences, no explanation, no extra text:\n\n${original}`;
}
