import { env } from '../config/env';
import { supabase } from '../lib/supabase';

function responseErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return 'API-Anfrage fehlgeschlagen.';

  const responsePayload = payload as { detail?: unknown; message?: unknown };
  if (typeof responsePayload.message === 'string') return responsePayload.message;
  if (typeof responsePayload.detail === 'string') return responsePayload.detail;

  if (responsePayload.detail && typeof responsePayload.detail === 'object') {
    const detail = responsePayload.detail as { message?: unknown };
    if (typeof detail.message === 'string') return detail.message;
  }

  return 'API-Anfrage fehlgeschlagen.';
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${env.apiUrl}${path}`, { ...init, headers });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(responseErrorMessage(payload));
  return payload as T;
}
