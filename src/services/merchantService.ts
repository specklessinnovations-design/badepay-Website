/**
 * BadePay Merchant Service
 * Connects to the real backend API for merchant operations (store, QR, payments).
 */

import apiClient from '@/lib/apiClient';

export interface StoreInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  bannerUrl?: string;
  logoUrl?: string;
  isPublished: boolean;
  slug: string;
  merchantId: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  discount: number;
  variants: string[];
  createdAt: string;
  storeId: string;
}

export interface Order {
  id: string;
  merchantSlug: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod: 'wallet' | 'bank';
  reference: string;
  createdAt: string;
}

export interface MerchantPayment {
  id: string;
  amount: number;
  customerName: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  createdAt: string;
}

export interface MerchantSettlement {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  reference: string;
  createdAt: string;
}

/** Query string without empty values (URLSearchParams would send `search=undefined`). */
const toQuery = (params: Record<string, unknown>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString();

export const merchantService = {
  /**
   * Get all stores (marketplace)
   * Backend: GET /stores
   */
  getPublicStores: async (params?: { search?: string; category?: string; limit?: number; offset?: number }): Promise<any> => {
    try {
      const queryString = params ? toQuery(params) : '';
      const path = queryString ? `/stores?${queryString}` : '/stores';
      const resp = await apiClient.get(path);
      return resp?.data || {};
    } catch {
      return {};
    }
  },

  /**
   * Get all products (marketplace)
   * Backend: GET /stores/products
   */
  getAllProducts: async (params?: { search?: string; category?: string; minPrice?: number; maxPrice?: number; limit?: number; offset?: number }): Promise<any> => {
    try {
      const queryString = params ? toQuery(params) : '';
      const path = queryString ? `/stores/products?${queryString}` : '/stores/products';
      const resp = await apiClient.get(path);
      return resp?.data || {};
    } catch {
      return {};
    }
  },

  /**
   * Get public store by slug
   * Backend: GET /stores/:slug
   */
  getPublicStore: async (slug: string): Promise<any> => {
    try {
      const resp = await apiClient.get(`/stores/${slug}`);
      return resp?.data || {};
    } catch {
      return {};
    }
  },

  /**
   * Get public store products
   * Backend: GET /stores/:slug/products
   */
  getPublicStoreProducts: async (slug: string): Promise<any> => {
    try {
      const resp = await apiClient.get(`/stores/${slug}/products`);
      return resp?.data || {};
    } catch {
      return {};
    }
  },

  /**
   * Place order at store
   * Backend: POST /stores/:slug/orders
   */
  placeStoreOrder: async (slug: string, data: any): Promise<any> => {
    try {
      const resp = await apiClient.post(`/stores/${slug}/orders`, data);
      return resp?.data || {};
    } catch {
      return {};
    }
  },

  /**
   * Get my store info.
   * Backend: GET /merchants/store
   */
  getMyStore: async (): Promise<StoreInfo | null> => {
    try {
      const resp = await apiClient.get('/merchants/store');
      const data = resp?.data || {};
      // Handle different response structures
      if (data.store) return data.store;
      if (data.data?.store) return data.data.store;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Update my store info.
   * Backend: PATCH /api/v1/merchants/store
   */
  updateMyStore: async (data: Partial<StoreInfo>): Promise<StoreInfo | null> => {
    try {
      const resp = await apiClient.patch('/merchants/store', data);
      const responseData = resp?.data || {};
      if (responseData.store) return responseData.store;
      if (responseData.data?.store) return responseData.data.store;
      return responseData;
    } catch {
      return null;
    }
  },

  /**
   * Get my store products.
   * Backend: GET /api/v1/merchants/store/products
   */
  getMyProducts: async (): Promise<Product[]> => {
    try {
      const resp = await apiClient.get('/merchants/store/products');
      const data = resp?.data || {};
      if (data.products) return data.products;
      if (data.data?.products) return data.data.products;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Add a product.
   * Backend: POST /api/v1/merchants/store/products
   */
  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'storeId'>): Promise<Product | null> => {
    try {
      const resp = await apiClient.post('/merchants/store/products', product);
      const data = resp?.data || {};
      if (data.product) return data.product;
      if (data.data?.product) return data.data.product;
      return data;
    } catch {
      return null;
    }
  },
  /**
   * Update a product.
   * Backend: PATCH /api/v1/merchants/store/products/:id
   */
  updateProduct: async (productId: string, data: Partial<Product>): Promise<Product | null> => {
    try {
      const resp = await apiClient.patch(`/merchants/store/products/${productId}`, data);
      const responseData = resp?.data || {};
      if (responseData.product) return responseData.product;
      if (responseData.data?.product) return responseData.data.product;
      return responseData;
    } catch {
      return null;
    }
  },

  /**
   * Delete a product.
   * Backend: DELETE /api/v1/merchants/store/products/:id
   */
  deleteProduct: async (productId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/merchants/store/products/${productId}`);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get my store orders.
   * Backend: GET /api/v1/merchants/store/orders
   */
  getMyOrders: async (): Promise<Order[]> => {
    try {
      const resp = await apiClient.get('/merchants/store/orders');
      const data = resp?.data || {};
      if (data.orders) return data.orders;
      if (data.data?.orders) return data.data.orders;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Update order status.
   * Backend: PATCH /api/v1/merchants/store/orders/:id
   */
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<boolean> => {
    try {
      await apiClient.patch(`/merchants/store/orders/${orderId}`, { status });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get store analytics.
   * Backend: GET /store/analytics
   */
  getAnalytics: async (): Promise<any> => {
    try {
      const resp = await apiClient.get('/store/analytics');
      return resp?.data || {};
    } catch {
      return {};
    }
  },

  /**
   * Generate QR code for merchant.
   * Backend: GET /api/v1/qr/generate
   */
  /**
   * The merchant's reusable pay link (what the QR shows). The BadePay app pays it from the wallet;
   * any phone camera opens a page to pay by card, transfer or USSD — and pick what it's for.
   * Backend: POST /api/v1/qr/merchant/link
   */
  getMerchantPayLink: async (amount?: number): Promise<{ url: string; amount: number | null; displayName: string } | null> => {
    try {
      const resp = await apiClient.post('/qr/merchant/link', amount ? { amount } : {});
      return resp?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Money received through the QR, totalled per item (tithe, offering…), with each payment and note.
   * Backend: GET /api/v1/merchants/store/collections
   */
  getCollections: async (params: { from?: string; to?: string; productId?: string; page?: number; limit?: number } = {}): Promise<any> => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();
    const resp = await apiClient.get(`/merchants/store/collections${qs ? `?${qs}` : ''}`);
    return resp?.data ?? resp;
  },

  generateQrCode: async (): Promise<{ qrCode: string; qrSlug: string } | null> => {
    try {
      const resp = await apiClient.get('/qr/generate');
      return resp?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Generate dynamic QR code with amount.
   * Backend: POST /api/v1/qr/dynamic
   */
  generateDynamicQrCode: async (amount: number): Promise<{ qrCode: string; qrSlug: string } | null> => {
    try {
      const resp = await apiClient.post('/qr/dynamic', { amount });
      return resp?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get merchant payments (from transactions).
   * Backend: GET /transactions?type=qr_payment
   */
  getPayments: async (): Promise<MerchantPayment[]> => {
    // Money coming in (QR, store orders, transfers to the business account), like the mobile app's list.
    try {
      const resp = await apiClient.get('/transactions?limit=100');
      const txs: any[] = resp?.data?.transactions || resp?.data || [];
      return txs
        .filter((t) => t.direction === 'in')
        .map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          customerName: t.metadata?.payerName || t.counterparty?.name || t.description || 'Customer',
          status: (['success', 'completed'].includes(t.status) ? 'success' : t.status === 'failed' || t.status === 'reversed' ? 'failed' : 'pending') as MerchantPayment['status'],
          reference: String(t.reference || '').replace(/-REC$/, ''),
          createdAt: t.createdAt || new Date().toISOString(),
        }));
    } catch {
      return [];
    }
  },

  /**
   * Payouts from the business wallet to the bank (real payout records, newest first).
   * Backend: GET /api/v1/merchants/payouts
   */
  getSettlements: async (): Promise<MerchantSettlement[]> => {
    try {
      const resp = await apiClient.get('/merchants/payouts?limit=50');
      const payouts: any[] = resp?.data?.payouts ?? [];
      return payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        // pending/held/review → still on its way; success → completed; failed/reversed are left out of "pending"
        status: (p.status === 'success' ? 'completed' : ['pending', 'held', 'review'].includes(p.status) ? 'pending' : 'processing') as MerchantSettlement['status'],
        reference: p.reference,
        createdAt: p.createdAt,
      }));
    } catch {
      return [];
    }
  },
};

export default merchantService;
