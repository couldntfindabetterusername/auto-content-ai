export interface JobProgressEvent {
  type?: 'completed' | 'failed';
  step: string;
  status: 'running' | 'done' | 'failed';
  progress: number;
  error?: string;
}

export interface AgentStage {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  steps: string[];
}
