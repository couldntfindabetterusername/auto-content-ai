import { useEffect, useState } from 'react';
import { AdminJobTable } from '../components/AdminJobTable';
import type { AdminJob } from '../components/AdminJobTable';
import { apiUrl } from '../api/apiUrl';

interface AdminStats {
  total_jobs: number;
  avg_cost_usd: number;
  avg_qa_score: number;
  failure_rate: number;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border border-border px-5 py-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

async function fetchAdmin<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { credentials: 'include' });
  if (res.status === 403) throw new Error('403');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `${res.status}`);
  }
  return res.json();
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [jobs, setJobs] = useState<AdminJob[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAdmin<AdminStats>('/api/admin/stats'),
      fetchAdmin<AdminJob[]>('/api/admin/jobs'),
    ])
      .then(([s, j]) => {
        setStats(s);
        setJobs(j);
      })
      .catch((err: Error) => {
        if (err.message === '403') {
          setForbidden(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-4xl font-bold text-muted mb-2">403</p>
          <p className="text-muted-foreground text-sm">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-left">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-left">
      <div className="mb-8">
        <p className="text-2xl font-bold text-foreground">Admin Dashboard</p>
        <p className="text-sm text-muted-foreground mt-1">Job quality and cost overview.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          <StatCard label="Total Jobs" value={String(stats.total_jobs)} />
          <StatCard label="Avg Cost" value={`$${stats.avg_cost_usd.toFixed(4)}`} />
          <StatCard label="Avg QA Score" value={stats.avg_qa_score.toFixed(1)} />
          <StatCard label="Failure Rate" value={`${(stats.failure_rate * 100).toFixed(1)}%`} />
        </div>
      )}

      <AdminJobTable jobs={jobs ?? []} />
    </div>
  );
}
