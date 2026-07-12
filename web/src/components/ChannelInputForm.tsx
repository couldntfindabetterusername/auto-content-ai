import { useState } from 'react';
import { createContentCalendar } from '../api/contentCalendarClient';

function isValidYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

interface Props {
  onSuccess: (jobId: string) => void;
}

export function ChannelInputForm({ onSuccess }: Props) {
  const [channelUrl, setChannelUrl] = useState('');
  const [niche, setNiche] = useState('');
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = channelUrl && !isValidYouTubeUrl(channelUrl)
    ? 'Must be a valid YouTube URL (youtube.com or youtu.be)'
    : null;

  const nicheError = niche && niche.trim().length < 3
    ? 'Niche must be at least 3 characters'
    : null;

  const isValid =
    channelUrl.trim() !== '' &&
    isValidYouTubeUrl(channelUrl) &&
    niche.trim().length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await createContentCalendar({
        channelUrl: channelUrl.trim(),
        niche: niche.trim(),
        preferences: preferences.trim() || undefined,
      });
      onSuccess(res.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          YouTube Channel URL <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={channelUrl}
          onChange={e => setChannelUrl(e.target.value)}
          placeholder="https://youtube.com/@channelname"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {urlError && <p className="mt-1 text-sm text-red-600">{urlError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Niche Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="e.g., fitness, AI, gaming"
          rows={3}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
        />
        {nicheError && <p className="mt-1 text-sm text-red-600">{nicheError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preferences <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <textarea
          value={preferences}
          onChange={e => setPreferences(e.target.value)}
          placeholder="e.g., focus on tutorials, avoid controversial topics"
          rows={3}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {isLoading ? 'Creating...' : 'Generate Content Calendar'}
      </button>
    </form>
  );
}
