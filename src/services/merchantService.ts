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

export const merchantService = {
  /**
   * Get all stores (marketplace)
   * Backend: GET /stores
   */
  getPublicStores: async (params?: { search?: string; category?: string; limit?: number; offset?: number }): Promise<any> => {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
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
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
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
    try {
      const resp = await apiClient.get('/transactions?type=qr_payment');
      const txs = resp?.data?.transactions || resp?.data || [];
      return txs.map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        customerName: t.senderName || t.recipientName || 'Customer',
        status: t.status === 'completed' ? 'success' : (t.status || 'pending'),
        reference: t.reference || '',
        createdAt: t.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get merchant settlements.
   * Backend: Derived from transactions if dedicated endpoint doesn't exist
   */
  getSettlements: async (): Promise<MerchantSettlement[]> => {
    try {
      const paymentsResp = await apiClient.get('/transactions?type=qr_payment');
      const transactions = paymentsResp?.data?.transactions || paymentsResp?.data || [];
      
      // Group transactions by date to create settlement records
      const settlementsByDate = new Map<string, MerchantSettlement>();
      
      transactions.forEach((t: any) => {
        if (t.status === 'completed' || t.status === 'success') {
          const date = new Date(t.createdAt || Date.now());
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (!settlementsByDate.has(dateKey)) {
            settlementsByDate.set(dateKey, {
              id: `settle_${dateKey}`,
              amount: 0,
              status: 'completed',
              reference: `SETTLE-${dateKey}`,
              createdAt: t.createdAt || new Date().toISOString(),
            });
          }
          
          const settlement = settlementsByDate.get(dateKey)!;
          settlement.amount += t.amount || 0;
        }
      });
      
      return Array.from(settlementsByDate.values());
    } catch {
      return [];
    }
  },
};

export default merchantService;
