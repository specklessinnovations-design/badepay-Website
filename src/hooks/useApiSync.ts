
// FRONTEND-ONLY MODE: useApiSync is a no-op — all data comes from mock stores.
export function useApiSync(_enabled: boolean) {
  return { refresh: async () => {} };
}
