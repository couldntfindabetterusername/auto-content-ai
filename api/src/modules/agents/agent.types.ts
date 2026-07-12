export type AgentStatus = 'running' | 'done' | 'failed';

export interface AgentInput<T = unknown> {
  data: T;
  jobId: string;
}

export interface AgentOutput<T = unknown> {
  data: T;
  agentRunId: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  latencyMs: number;
}

export interface AgentRunRecord {
  id: string;
  jobId: string;
  agentName: string;
  status: AgentStatus;
  inputJson: unknown;
  outputJson: unknown | null;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  modelUsed: string | null;
  promptVersion: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  costUsd: number | null;
}

export interface AgentProgressEvent {
  jobId: string;
  agentName: string;
  status: AgentStatus;
  agentRunId: string;
  timestamp: string;
  error?: string;
}
