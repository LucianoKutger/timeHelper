import { env } from '../config/env';
import { supabase } from '../lib/supabase';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${env.apiUrl}${path}`, { ...init, headers });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message ?? payload?.detail ?? 'API request failed');
  return payload as T;
}
