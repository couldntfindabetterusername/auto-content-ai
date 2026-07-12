export interface JobProgressEvent {
  step: string;
  progress: number;
  message: string;
  type?: 'progress' | 'completed' | 'failed';
}

export interface AgentStage {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  steps: string[];
}
