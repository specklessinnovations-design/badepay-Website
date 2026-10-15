/**
 * Where the admin portal lives. Set VITE_ADMIN_BASE_PATH (e.g. "/ops-7f3k2q") per deployment;
 * the public "/admin" path is not served.
 *
 * This only keeps the portal out of casual sight: route strings ship in the JavaScript bundle.
 * The real protection is server-side — permissions on every API call, two-factor and the audit log.
 */

function normalise(path: string | undefined): string {
  const p = (path ?? '').trim().replace(/\/+$/, '');
  if (!p) return '/bp-console';
  return p.startsWith('/') ? p : `/${p}`;
}

export const ADMIN_BASE: string = normalise(import.meta.env.VITE_ADMIN_BASE_PATH as string | undefined);

/** adminPath('/users') → "<base>/users" */
export const adminPath = (path = ''): string => `${ADMIN_BASE}${path && !path.startsWith('/') ? '/' : ''}${path}`;

export const isAdminPath = (pathname: string): boolean => pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`);
