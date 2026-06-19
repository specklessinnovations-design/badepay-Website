// FRONTEND-ONLY MODE: All API calls are stubbed — no real backend requests are made.
// This file exists only to satisfy imports; actual data comes from mock stores.

const ACCESS_KEY = "bade_pay_token";
const REFRESH_KEY = "bade_pay_refresh";

function noop() {
  return Promise.resolve({ data: {} } as any);
}

const apiClient: any = {
  get: (..._args: any[]) => noop(),
  post: (..._args: any[]) => noop(),
  put: (..._args: any[]) => noop(),
  patch: (..._args: any[]) => noop(),
  delete: (..._args: any[]) => noop(),
  del: (..._args: any[]) => noop(),
  setTokens: (access?: string | null, refresh?: string | null) => {
    if (typeof localStorage === "undefined") return;
    if (access) localStorage.setItem(ACCESS_KEY, access);
    else localStorage.removeItem(ACCESS_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  },
  getAccessToken: () => (typeof localStorage !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null),
  getRefreshToken: () => (typeof localStorage !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export async function apiRequest(_path: string, _opts: any = {}) {
  return noop();
}

export { apiClient };
export default apiClient;
