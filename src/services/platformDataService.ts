/**
 * BadePay Platform Data Service
 * Connects to the real backend API for platform-wide data (stores, savings, disputes).
 */
import apiClient from '@/lib/apiClient';

export const platformDataService = {
  // ── Savings ────────────────────────────────────────────────────────────────

  /** GET /savings — list savings pockets */
  listSavings: async () => {
    const resp = await apiClient.get('/savings');
    return resp?.data || [];
  },

  /** POST /savings — create a savings pocket */
  createSavings: async (data: { name: string; target?: number; frequency?: string }) => {
    const resp = await apiClient.post('/savings', data);
    return resp?.data || null;
  },

  /** POST /savings/:id/fund — fund a pocket */
  fundSavings: async (id: string, amount: number, pin: string) => {
    const resp = await apiClient.post(`/savings/${id}/fund`, { amount, pin });
    return resp?.data || null;
  },

  /** POST /savings/:id/withdraw — withdraw from a pocket */
  withdrawSavings: async (id: string, amount: number, pin: string) => {
    const resp = await apiClient.post(`/savings/${id}/withdraw`, { amount, pin });
    return resp?.data || null;
  },

  /** DELETE /savings/:id — close a pocket */
  closeSavings: async (id: string) => {
    const resp = await apiClient.delete(`/savings/${id}`);
    return resp?.data || null;
  },

  // ── Disputes ───────────────────────────────────────────────────────────────

  /** GET /disputes — list user disputes */
  listDisputes: async () => {
    const resp = await apiClient.get('/disputes');
    return resp?.data || [];
  },

  /** POST /disputes — raise a dispute */
  raiseDispute: async (data: {
    transactionId: string;
    amount: number;
    issueType: string;
    description: string;
  }) => {
    const resp = await apiClient.post('/disputes', data);
    return resp?.data || null;
  },

  /** PATCH /disputes/:id/cancel — cancel a dispute */
  cancelDispute: async (id: string) => {
    const resp = await apiClient.patch(`/disputes/${id}/cancel`);
    return resp?.data || null;
  },

  // ── Stores (Public) ────────────────────────────────────────────────────────

  /** GET /stores/:slug — get public store */
  getStore: async (slug: string) => {
    const resp = await apiClient.get(`/stores/${slug}`);
    return resp?.data || null;
  },

  /** GET /stores/:slug/products — get store products */
  getStoreProducts: async (slug: string) => {
    const resp = await apiClient.get(`/stores/${slug}/products`);
    return resp?.data || [];
  },

  /** POST /stores/:slug/orders — place an order */
  placeOrder: async (slug: string, data: any) => {
    const resp = await apiClient.post(`/stores/${slug}/orders`, data);
    return resp?.data || null;
  },

  // ── Merchant Store (Authenticated) ─────────────────────────────────────────

  /** GET /merchants/store — get merchant's own store */
  getMerchantStore: async () => {
    const resp = await apiClient.get('/merchants/store');
    return resp?.data || null;
  },

  /** PATCH /merchants/store — update store details */
  updateMerchantStore: async (data: any) => {
    const resp = await apiClient.patch('/merchants/store', data);
    return resp?.data || null;
  },

  /** GET /merchants/store/products — get merchant products */
  getMerchantProducts: async () => {
    const resp = await apiClient.get('/merchants/store/products');
    return resp?.data || [];
  },

  /** POST /merchants/store/products — add a product */
  addProduct: async (data: any) => {
    const resp = await apiClient.post('/merchants/store/products', data);
    return resp?.data || null;
  },

  /** PATCH /merchants/store/products/:id — update a product */
  updateProduct: async (id: string, data: any) => {
    const resp = await apiClient.patch(`/merchants/store/products/${id}`, data);
    return resp?.data || null;
  },

  /** DELETE /merchants/store/products/:id — delete a product */
  deleteProduct: async (id: string) => {
    const resp = await apiClient.delete(`/merchants/store/products/${id}`);
    return resp?.data || null;
  },

  /** GET /merchants/store/orders — get merchant orders */
  getMerchantOrders: async () => {
    const resp = await apiClient.get('/merchants/store/orders');
    return resp?.data || [];
  },

  /** PATCH /merchants/store/orders/:id — update order status */
  updateOrderStatus: async (id: string, status: string) => {
    const resp = await apiClient.patch(`/merchants/store/orders/${id}`, { status });
    return resp?.data || null;
  },
};

export default platformDataService;
