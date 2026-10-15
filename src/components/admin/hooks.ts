import { useCallback, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch, useLocation } from 'wouter';
import adminApiClient, { AdminApiError, RequestOptions } from '@/lib/adminApiClient';
import { useToast } from '@/hooks/useToast';

/**
 * GET an admin endpoint and return `data` from the { status, data } envelope.
 * Keeps the previous page on screen while the next one loads; `enabled: false` skips the call
 * (e.g. when the admin lacks the permission).
 */
export function useAdminQuery<T = any>(
  path: string | null,
  query?: RequestOptions['query'],
  opts: { enabled?: boolean; refetchInterval?: number } = {},
) {
  return useQuery<T, AdminApiError>({
    queryKey: ['admin', path, query ?? {}],
    queryFn: async () => (await adminApiClient.get(path!, { query })).data as T,
    enabled: !!path && opts.enabled !== false,
    placeholderData: keepPreviousData,
    refetchInterval: opts.refetchInterval,
    retry: (count, error) => count < 1 && !(error instanceof AdminApiError && [401, 403, 404].includes(error.status)),
    staleTime: 15_000,
  });
}

/**
 * Runs an admin action with a pending flag, success/error toasts and a refresh of admin data.
 * Returns the response, or undefined when it failed (the error has already been shown).
 */
export function useAdminAction() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>, success?: string | ((r: T) => string)): Promise<T | undefined> => {
    setPending(key);
    try {
      const result = await fn();
      const msg = typeof success === 'function' ? success(result) : success ?? (result as { message?: string })?.message;
      if (msg) showSuccess(msg);
      await qc.invalidateQueries({ queryKey: ['admin'] });
      return result;
    } catch (e) {
      const err = e as AdminApiError;
      showError(err.requestId ? `${err.message} (ref ${err.requestId.slice(0, 8)})` : err.message || 'Something went wrong');
      return undefined;
    } finally {
      setPending(null);
    }
  }, [qc, showError, showSuccess]);

  return { run, pending, isPending: (key: string) => pending === key };
}

/**
 * Filter state kept in the URL query string, so filters survive reloads and links can be shared
 * (e.g. the dashboard links to "?status=pending").
 */
export function useUrlState<T extends Record<string, string>>(defaults: T): [T, (patch: Partial<T>) => void] {
  const search = useSearch();
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const state = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, params.get(k) ?? v])) as T;
  const set = useCallback((patch: Partial<T>) => {
    const next = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === (defaults as Record<string, string>)[k]) next.delete(k);
      else next.set(k, String(v));
    }
    // Any filter change other than the page itself goes back to page 1.
    if (!('page' in patch)) next.delete('page');
    const qs = next.toString();
    navigate(`${location}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [search, location, navigate, defaults]);
  return [state, set];
}
