import { useState } from 'react';

type Section = 'titles' | 'hook' | 'outline' | 'seo' | 'thumbnail' | 'full_concept';

interface Props {
  calendarId: string | null;
  videoIndex: number;
  section: Section;
  onSuccess: () => void;
}

export function RegenerateSectionButton({ calendarId, videoIndex, section, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!calendarId || calendarId === 'mock') return null;

  async function handleClick() {
    setLoading(true);
    setError(null);
    let succeeded = false;
    try {
      const res = await fetch(`/api/content-calendars/${calendarId}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, videoIndex }),
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string })?.message || `Failed: ${res.status}`);
      }
      succeeded = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setLoading(false);
    }
    if (succeeded) onSuccess();
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        title={`Regenerate ${section}`}
        className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-40 transition-colors"
      >
        {loading ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
      </button>
      {error && (
        <div className="absolute right-0 bottom-full mb-1 z-50 w-52 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}
