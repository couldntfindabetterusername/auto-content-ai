// VITE_API_URL: set to backend public URL when frontend is deployed separately (e.g. Vercel).
// Leave unset (or empty) for local dev — Vite proxy handles /api/* → localhost:3000.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
