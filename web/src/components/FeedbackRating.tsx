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
        <p className="text-sm font-medium text-foreground/80 mb-2">Rate this calendar</p>
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
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-background border-border text-foreground/80 hover:border-primary hover:text-primary',
                status === 'saving' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {n}
            </button>
          ))}
        </div>
        {rating !== null && (
          <p className="text-xs text-muted-foreground mt-1">{rating}/10</p>
        )}
      </div>

      <div>
        <label htmlFor="feedback-text" className="text-sm font-medium text-foreground/80 block mb-1">
          Feedback <span className="text-muted-foreground/60 font-normal">(optional)</span>
        </label>
        <textarea
          id="feedback-text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, 250))}
          placeholder="What did you think of the content plan?"
          rows={3}
          className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground/60"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground/60">{feedback.length}/250</span>
          <button
            onClick={submitFeedback}
            disabled={!rating || status === 'saving' || isMock}
            className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'saving' ? 'Saving...' : 'Submit feedback'}
          </button>
        </div>
      </div>

      {status === 'saved' && (
        <p className="text-sm text-green-600">Rating saved.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
