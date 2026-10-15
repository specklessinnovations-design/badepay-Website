/**
 * BadePay Admin API client. Uses the admin JWT (stored separately from customer tokens).
 *
 * - A 401 clears the session and sends the admin to sign in again.
 * - High-risk actions pass `otp` (the authenticator code), sent as X-Admin-OTP.
 * - Errors are AdminApiError with the HTTP status and the server's message.
 */

// Backend base URL is set via VITE_API_URL in .env; falls back to the production backend when unset.
const BASE_URL: string = import.meta.env.VITE_API_URL || 'https://badepay-backend.vercel.app/api/v1';

const ADMIN_TOKEN_KEY = 'badepay_admin_token';

export class AdminApiError extends Error {
  constructor(message: string, readonly status: number, readonly requestId?: string | null) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export function getAdminToken(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* storage unavailable: the session just won't survive a reload */
  }
}

type Unauthorized = () => void;
let onUnauthorized: Unauthorized | null = null;
/** The auth store registers how to end the session when the API says the token is no longer valid. */
export const setUnauthorizedHandler = (fn: Unauthorized | null): void => {
  onUnauthorized = fn;
};

export interface RequestOptions {
  /** Authenticator code for step-up actions */
  otp?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE_URL}${path}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return s ? `${url}${url.includes('?') ? '&' : '?'}${s}` : url;
}

async function send(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<Response> {
  const token = getAdminToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.otp) headers['X-Admin-OTP'] = opts.otp;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new AdminApiError('Could not reach the BadePay API. Check your connection and try again.', 0);
  }
  if (res.status === 401 && token && !path.startsWith('/admin/auth/login')) {
    setAdminToken(null);
    onUnauthorized?.();
  }
  return res;
}

export async function adminFetch<T = any>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const res = await send(method, path, body, opts);
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new AdminApiError(data?.message || `Request failed (${res.status})`, res.status, res.headers.get('x-request-id'));
  }
  return data as T;
}

/** Downloads a CSV (or other file) from an authenticated endpoint. */
export async function adminDownload(path: string, query?: RequestOptions['query']): Promise<void> {
  const res = await send('GET', path, undefined, { query });
  if (!res.ok) {
    let message = `Export failed (${res.status})`;
    try {
      message = (await res.json())?.message || message;
    } catch {
      /* not JSON */
    }
    throw new AdminApiError(message, res.status);
  }
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'export.csv';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const adminApiClient = {
  get: <T = any>(path: string, opts?: RequestOptions) => adminFetch<T>('GET', path, undefined, opts),
  post: <T = any>(path: string, body?: unknown, opts?: RequestOptions) => adminFetch<T>('POST', path, body ?? {}, opts),
  patch: <T = any>(path: string, body?: unknown, opts?: RequestOptions) => adminFetch<T>('PATCH', path, body ?? {}, opts),
  put: <T = any>(path: string, body?: unknown, opts?: RequestOptions) => adminFetch<T>('PUT', path, body ?? {}, opts),
  delete: <T = any>(path: string, body?: unknown, opts?: RequestOptions) => adminFetch<T>('DELETE', path, body, opts),
  download: adminDownload,
};

export default adminApiClient;
