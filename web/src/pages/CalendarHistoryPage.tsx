import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCalendars } from '../api/contentCalendarClient';
import type { CalendarHistoryItem, CalendarHistoryResponse } from '../api/contentCalendarClient';

function StatusBadge({ status }: { status: string }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  if (status === 'completed') return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
  if (status === 'processing') return <span className={`${base} bg-blue-100 text-blue-800`}>{status}</span>;
  if (status === 'failed') return <span className={`${base} bg-red-100 text-red-800`}>{status}</span>;
  if (status === 'queued') return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status}</span>;
  return <span className={`${base} bg-muted text-foreground/80`}>{status}</span>;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
      <div
        className="bg-primary h-1.5 rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CalendarHistoryPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<CalendarHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    listCalendars(page, pageSize)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  function handleRowClick(item: CalendarHistoryItem) {
    if (item.calendarId) {
      navigate(`/calendar/${item.calendarId}`);
    } else if (item.status === 'processing' || item.status === 'queued') {
      navigate(`/jobs/${item.id}`);
    }
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Calendars</h1>
          <p className="text-sm text-muted-foreground mt-1">All your past and in-progress content calendars.</p>
        </div>
        <button
          onClick={() => navigate('/new')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          New Calendar
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground text-sm mb-4">No calendars yet.</p>
          <button
            onClick={() => navigate('/new')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Create your first calendar
          </button>
        </div>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel / Niche</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">QA Score</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((item) => {
                  const isClickable = !!item.calendarId || item.status === 'processing' || item.status === 'queued';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`${isClickable ? 'cursor-pointer hover:bg-muted/40' : ''} transition-colors`}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-foreground truncate max-w-xs">{item.channelUrl}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{item.niche}</p>
                        {(item.status === 'processing' || item.status === 'queued') &&
                          item.progressPercent != null && (
                            <ProgressBar percent={item.progressPercent} />
                          )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground/80">
                        {item.qaScore ? parseFloat(item.qaScore).toFixed(1) : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {data.total} total · page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
