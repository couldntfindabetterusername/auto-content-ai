export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  google_id: string;
}

export async function getMe(): Promise<User | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export function getLoginUrl(): string {
  return '/api/auth/google';
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
