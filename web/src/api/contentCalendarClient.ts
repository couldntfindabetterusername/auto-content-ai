import type { CalendarResponse, CreateCalendarRequest, CreateCalendarResponse } from '../types/calendar';

export async function createContentCalendar(
  request: CreateCalendarRequest,
): Promise<CreateCalendarResponse> {
  const res = await fetch('/api/content-calendars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getCalendar(id: string): Promise<CalendarResponse> {
  const res = await fetch(`/api/content-calendars/${id}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}
