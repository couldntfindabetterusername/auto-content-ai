import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BaseAgent } from './base-agent';
import { AgentOutput, AgentProgressEvent } from './agent.types';

@Injectable()
export class AgentRunnerService {
  private readonly publisher: Redis;

  constructor() {
    this.publisher = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async runAgent<I, O>(
    agent: BaseAgent<I, O>,
    input: unknown,
    jobId: string,
  ): Promise<AgentOutput<O>> {
    const channel = `job:${jobId}:progress`;

    await this.publish(channel, {
      jobId,
      agentName: agent.name,
      status: 'running',
      agentRunId: '',
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await agent.run(input, jobId);

      await this.publish(channel, {
        jobId,
        agentName: agent.name,
        status: 'done',
        agentRunId: result.agentRunId,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await this.publish(channel, {
        jobId,
        agentName: agent.name,
        status: 'failed',
        agentRunId: '',
        timestamp: new Date().toISOString(),
        error: message,
      });

      throw err;
    }
  }

  private async publish(channel: string, event: AgentProgressEvent): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(event));
    } catch {
      // never break execution for pub/sub failures
    }
  }
}
