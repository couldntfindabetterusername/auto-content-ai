import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgentProgressTimeline } from '../components/AgentProgressTimeline';
import { subscribeToJobEvents } from '../api/jobEventsClient';
import type { AgentStage, JobProgressEvent } from '../types/job';

const STEP_TO_AGENT: Record<string, string> = {
  validating_input: 'Channel Analyzer',
  fetching_channel: 'Channel Analyzer',
  analyzing_channel: 'Channel Analyzer',
  researching_trends: 'Trend Scout',
  selecting_topics: 'Script Generator',
  generating_outlines: 'Script Generator',
  optimizing_seo: 'SEO Optimizer',
  reviewing_quality: 'SEO Optimizer',
  rendering_output: 'SEO Optimizer',
};

const INITIAL_STAGES: AgentStage[] = [
  { name: 'Channel Analyzer', status: 'pending', steps: ['validating_input', 'fetching_channel', 'analyzing_channel'] },
  { name: 'Trend Scout',      status: 'pending', steps: ['researching_trends'] },
  { name: 'Script Generator', status: 'pending', steps: ['selecting_topics', 'generating_outlines'] },
  { name: 'SEO Optimizer',    status: 'pending', steps: ['optimizing_seo', 'reviewing_quality', 'rendering_output'] },
];

function applyStepToStages(prev: AgentStage[], activeAgent: string): AgentStage[] {
  return prev.map((s, idx) => {
    const activeIdx = prev.findIndex(x => x.name === activeAgent);
    if (s.name === activeAgent) return { ...s, status: 'active' };
    if (idx < activeIdx) return { ...s, status: 'completed' };
    return { ...s, status: 'pending' };
  });
}

export function JobProgressPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<AgentStage[]>(INITIAL_STAGES);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const connect = useCallback((id: string) => {
    const handleEvent = (event: JobProgressEvent) => {
      if (event.type === 'completed') {
        setProgress(100);
        setStages(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setTimeout(() => navigate(`/calendar/${id}`), 2000);
        return;
      }

      if (event.type === 'failed') {
        setError(event.message || 'Job failed');
        setStages(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'failed' } : s));
        return;
      }

      const activeAgent = STEP_TO_AGENT[event.step];
      if (activeAgent) setStages(prev => applyStepToStages(prev, activeAgent));
      setProgress(event.progress);
    };

    const handleError = (err: Error) => setError(err.message);

    unsubscribeRef.current?.();
    unsubscribeRef.current = subscribeToJobEvents(id, handleEvent, handleError);
  }, [navigate]);

  useEffect(() => {
    if (!jobId) {
      setError('Invalid job ID');
      return;
    }
    connect(jobId);
    return () => unsubscribeRef.current?.();
  }, [jobId, connect]);

  const handleRetry = () => {
    if (!jobId) return;
    setError(null);
    setStages(INITIAL_STAGES);
    setProgress(0);
    connect(jobId);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Generating Your Content Calendar</h1>
        <p className="text-sm text-gray-500 mb-8">Job ID: {jobId}</p>

        <AgentProgressTimeline stages={stages} currentProgress={progress} />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">Error: {error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
