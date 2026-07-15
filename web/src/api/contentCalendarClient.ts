import type { CalendarResponse, CreateCalendarRequest, CreateCalendarResponse } from '../types/calendar';
import { apiUrl } from './apiUrl';

export interface CalendarHistoryItem {
  id: string;
  calendarId: string | null;
  channelUrl: string;
  niche: string;
  status: string;
  progressPercent: number | null;
  createdAt: string;
  qaScore: string | null;
}

export interface CalendarHistoryResponse {
  items: CalendarHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listCalendars(
  page = 1,
  pageSize = 20,
): Promise<CalendarHistoryResponse> {
  const res = await fetch(
    apiUrl(`/api/content-calendars?page=${page}&pageSize=${pageSize}`),
    { credentials: 'include' },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function createContentCalendar(
  request: CreateCalendarRequest,
): Promise<CreateCalendarResponse> {
  const res = await fetch(apiUrl('/api/content-calendars'), {
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

export async function rateCalendar(
  id: string,
  rating: number,
  feedback?: string,
): Promise<void> {
  const res = await fetch(apiUrl(`/api/content-calendars/${id}/rate`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, feedback }),
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
}

export async function getCalendar(id: string): Promise<CalendarResponse> {
  const res = await fetch(apiUrl(`/api/content-calendars/${id}`), {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}
