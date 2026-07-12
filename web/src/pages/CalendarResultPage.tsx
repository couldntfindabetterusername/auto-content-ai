import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCalendar } from '../api/contentCalendarClient';
import { CalendarSummaryCard } from '../components/CalendarSummaryCard';
import type { CalendarResponse } from '../types/calendar';

export function CalendarResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid calendar ID');
      setLoading(false);
      return;
    }

    getCalendar(id)
      .then(setCalendar)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 border rounded-xl">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-36 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Failed to load calendar</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => navigate('/new')}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
          >
            Generate New Calendar
          </button>
        </div>
      </div>
    );
  }

  if (!calendar) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-left">
      <div className="mb-6">
        <p className="text-2xl font-bold text-gray-900">Your Content Calendar</p>
        {calendar.qualityScore && (
          <p className="text-sm text-gray-500 mt-1">
            Quality score: {Math.round(Number(calendar.qualityScore) * 10) / 10}/10
          </p>
        )}
      </div>
      <CalendarSummaryCard calendar={calendar} />
    </div>
  );
}
