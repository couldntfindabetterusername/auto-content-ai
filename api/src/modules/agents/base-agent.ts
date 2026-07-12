import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ZodType } from 'zod';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { agentRuns } from '../../db/schema';
import { AgentOutput } from './agent.types';

@Injectable()
export abstract class BaseAgent<I = unknown, O = unknown> {
  abstract readonly name: string;
  abstract readonly modelClass: ModelClass;
  abstract readonly promptName: string;
  abstract readonly promptVersion: string;
  abstract readonly inputSchema: ZodType<I>;
  abstract readonly outputSchema: ZodType<O>;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
  ) {}

  abstract buildPrompt(input: I): string;

  async run(rawInput: unknown, jobId: string): Promise<AgentOutput<O>> {
    const parsed = this.inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new Error(`[${this.name}] Invalid input: ${parsed.error.message}`);
    }
    const input = parsed.data;

    const [runRow] = await this.db
      .insert(agentRuns)
      .values({
        job_id: jobId,
        agent_name: this.name,
        status: 'running',
        input_json: rawInput,
        prompt_version: this.promptVersion,
        started_at: new Date(),
      })
      .returning({ id: agentRuns.id });

    const agentRunId: string = runRow.id;
    const start = Date.now();

    try {
      const prompt = this.buildPrompt(input);

      const llmResult = await this.llmService.generate<O>({
        purpose: this.name,
        modelClass: this.modelClass,
        prompt,
        outputSchema: this.outputSchema,
        jobId,
        agentRunId,
      });

      await this.db
        .update(agentRuns)
        .set({
          status: 'done',
          output_json: llmResult.data,
          completed_at: new Date(),
          model_used: llmResult.model,
          tokens_input: llmResult.tokensInput,
          tokens_output: llmResult.tokensOutput,
          cost_usd: llmResult.costUsd.toFixed(8),
        })
        .where(eq(agentRuns.id, agentRunId));

      return {
        data: llmResult.data,
        agentRunId,
        model: llmResult.model,
        tokensInput: llmResult.tokensInput,
        tokensOutput: llmResult.tokensOutput,
        costUsd: llmResult.costUsd,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.db
        .update(agentRuns)
        .set({
          status: 'failed',
          error_message: message,
          completed_at: new Date(),
        })
        .where(eq(agentRuns.id, agentRunId));
      throw err;
    }
  }
}
