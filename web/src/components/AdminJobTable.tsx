import { useState } from 'react';

export interface AdminJob {
  id: string;
  status: string;
  channel_url: string;
  niche: string;
  user_email: string | null;
  user_name: string | null;
  total_cost_usd: number;
  quality_score: string | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  status: string;
  model_used: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  if (status === 'completed') return <span className={`${base} bg-green-200 text-green-800`}>{status}</span>;
  if (status === 'processing') return <span className={`${base} bg-blue-200 text-blue-800`}>{status}</span>;
  if (status === 'failed') return <span className={`${base} bg-red-200 text-red-800`}>{status}</span>;
  if (status === 'queued') return <span className={`${base} bg-yellow-200 text-yellow-800`}>{status}</span>;
  return <span className={`${base} bg-gray-200 text-gray-700`}>{status}</span>;
}

function formatDuration(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number | string | null) {
  if (usd == null) return '—';
  const n = typeof usd === 'string' ? parseFloat(usd) : usd;
  if (isNaN(n)) return '—';
  return n === 0 ? '$0.00' : `$${n.toFixed(4)}`;
}

function AgentRunsPanel({ jobId }: { jobId: string }) {
  const [runs, setRuns] = useState<AgentRun[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (runs === null && !loading && !error) {
    setLoading(true);
    fetch(`/api/admin/jobs/${jobId}/agent-runs`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: AgentRun[]) => {
        setRuns(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }

  if (loading) return <div className="px-6 py-3 text-xs text-gray-400">Loading agent runs...</div>;
  if (error) return <div className="px-6 py-3 text-xs text-red-500">Error: {error}</div>;
  if (!runs || runs.length === 0) return <div className="px-6 py-3 text-xs text-gray-400">No agent runs recorded.</div>;

  return (
    <div className="px-6 pb-4 pt-1 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agent Runs</p>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-gray-400 text-left">
            <th className="pr-4 pb-1 font-medium">Agent</th>
            <th className="pr-4 pb-1 font-medium">Status</th>
            <th className="pr-4 pb-1 font-medium">Model</th>
            <th className="pr-4 pb-1 font-medium">Tokens In</th>
            <th className="pr-4 pb-1 font-medium">Tokens Out</th>
            <th className="pr-4 pb-1 font-medium">Cost</th>
            <th className="pr-4 pb-1 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {runs.map((run) => {
            const durationMs =
              run.completed_at && run.started_at
                ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
                : null;
            return (
              <tr key={run.id} className="text-gray-700">
                <td className="pr-4 py-1.5 font-mono">{run.agent_name}</td>
                <td className="pr-4 py-1.5">
                  <StatusBadge status={run.status} />
                </td>
                <td className="pr-4 py-1.5 text-gray-500">{run.model_used ?? '—'}</td>
                <td className="pr-4 py-1.5">{run.tokens_input ?? '—'}</td>
                <td className="pr-4 py-1.5">{run.tokens_output ?? '—'}</td>
                <td className="pr-4 py-1.5">{formatCost(run.cost_usd)}</td>
                <td className="pr-4 py-1.5">{formatDuration(durationMs)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {runs.some((r) => r.error_message) && (
        <div className="mt-2 space-y-1">
          {runs
            .filter((r) => r.error_message)
            .map((r) => (
              <p key={r.id} className="text-xs text-red-600 font-mono">
                [{r.agent_name}] {r.error_message}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

interface AdminJobTableProps {
  jobs: AdminJob[];
}

export function AdminJobTable({ jobs }: AdminJobTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">No jobs found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel / Niche</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">QA</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jobs.map((job) => (
            <>
              <tr
                key={job.id}
                onClick={() => toggleRow(job.id)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <p className="text-xs font-medium text-gray-900">{job.user_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{job.user_email ?? '—'}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-xs text-gray-800 truncate max-w-[160px]">{job.channel_url}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[160px]">{job.niche}</p>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{formatCost(job.total_cost_usd)}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{formatDuration(job.duration_ms)}</td>
                <td className="px-5 py-4 text-sm text-gray-700">
                  {job.quality_score ? parseFloat(job.quality_score).toFixed(1) : '—'}
                </td>
                <td className="px-5 py-4 text-xs text-red-500 max-w-[160px] truncate">
                  {job.error_message ?? '—'}
                </td>
              </tr>
              {expandedId === job.id && (
                <tr key={`${job.id}-runs`}>
                  <td colSpan={7} className="border-t border-gray-100">
                    <AgentRunsPanel jobId={job.id} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
