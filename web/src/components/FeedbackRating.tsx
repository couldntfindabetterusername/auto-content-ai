import { useState } from 'react';
import { rateCalendar } from '../api/contentCalendarClient';

interface FeedbackRatingProps {
  calendarId: string;
  initialRating?: number | null;
  initialFeedback?: string | null;
}

export function FeedbackRating({ calendarId, initialRating, initialFeedback }: FeedbackRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(initialFeedback ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isMock = calendarId === 'mock';

  async function submit(selectedRating: number) {
    if (isMock) return;
    setStatus('saving');
    setErrorMsg('');
    try {
      await rateCalendar(calendarId, selectedRating, feedback.trim() || undefined);
      setRating(selectedRating);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('error');
    }
  }

  async function submitFeedback() {
    if (!rating || isMock) return;
    await submit(rating);
  }

  const displayRating = hovered ?? rating;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Rate this calendar</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => submit(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              disabled={status === 'saving'}
              className={[
                'w-8 h-8 rounded text-sm font-medium border transition-colors',
                displayRating !== null && n <= displayRating
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600',
                status === 'saving' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {n}
            </button>
          ))}
        </div>
        {rating !== null && (
          <p className="text-xs text-gray-500 mt-1">{rating}/10</p>
        )}
      </div>

      <div>
        <label htmlFor="feedback-text" className="text-sm font-medium text-gray-700 block mb-1">
          Feedback <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="feedback-text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, 250))}
          placeholder="What did you think of the content plan?"
          rows={3}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{feedback.length}/250</span>
          <button
            onClick={submitFeedback}
            disabled={!rating || status === 'saving' || isMock}
            className="px-3 py-1 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'saving' ? 'Saving...' : 'Submit feedback'}
          </button>
        </div>
      </div>

      {status === 'saved' && (
        <p className="text-sm text-green-600">Rating saved.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
