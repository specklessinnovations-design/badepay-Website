import { create } from 'zustand';
import merchantService, { type Product, type StoreInfo, type Order } from '@/services/merchantService';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface MerchantStoreDataState {
  stores: Record<string, StoreInfo>;
  products: Record<string, Product[]>;
  orders: Order[];
  publicStores: { user: any; store: StoreInfo }[];
  isLoading: boolean;

  fetchStore: (merchantId: string) => Promise<void>;
  fetchProducts: (merchantId: string) => Promise<void>;
  fetchOrders: (merchantSlug: string) => Promise<void>;
  fetchPublicStores: () => Promise<void>;

  upsertStore: (merchantId: string, info: Partial<StoreInfo>) => Promise<void>;
  addProduct: (merchantId: string, product: Omit<Product, 'id' | 'createdAt' | 'storeId'>) => Promise<void>;
  updateProduct: (merchantId: string, productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (merchantId: string, productId: string) => Promise<void>;
  publishStore: (merchantId: string) => Promise<void>;
  unpublishStore: (merchantId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;

  getStoreProducts: (merchantId: string) => Product[];
  getStoreInfo: (merchantId: string) => StoreInfo | undefined;
  getMerchantOrders: (merchantSlug: string) => Order[];
}

export const useMerchantStoreData = create<MerchantStoreDataState>()((set, get) => ({
  stores: {},
  products: {},
  orders: [],
  publicStores: [],
  isLoading: false,

  fetchStore: async (merchantId: string) => {
    set({ isLoading: true });
    try {
      const store = await merchantService.getMyStore();
      if (store) {
        set((state) => ({
          stores: { ...state.stores, [merchantId]: store },
          isLoading: false,
        }));
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProducts: async (merchantId: string) => {
    set({ isLoading: true });
    try {
      const products = await merchantService.getMyProducts();
      set((state) => ({
        products: { ...state.products, [merchantId]: products },
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchOrders: async (merchantSlug: string) => {
    set({ isLoading: true });
    try {
      const orders = await merchantService.getMyOrders();
      set((state) => ({
        orders: orders.filter((o) => o.merchantSlug === merchantSlug),
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchPublicStores: async () => {
    set({ isLoading: true });
    try {
      const data = await merchantService.getPublicStores();
      let storesData = [];
      // Backend returns: { stores: [...] } directly
      if (data?.stores) {
        storesData = data.stores;
      } else if (data?.data?.stores) {
        storesData = data.data.stores;
      }
      // Transform to match expected format: { user: {...}, store: {...} }
      const formattedStores = storesData.map((store: any) => ({
        user: store.merchant || {},
        store: store,
      }));
      // Also populate the `stores` map for quick lookup
      const storesMap: Record<string, StoreInfo> = {};
      storesData.forEach((item: any) => {
        if (item.id) {
          storesMap[item.id] = item;
        }
      });
      set({ publicStores: formattedStores, stores: { ...storesMap }, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  upsertStore: async (merchantId, info) => {
    try {
      const updated = await merchantService.updateMyStore(info);
      if (updated) {
        set((state) => ({
          stores: { ...state.stores, [merchantId]: updated },
        }));
      }
    } catch {}
  },

  addProduct: async (merchantId, productData) => {
    try {
      const product = await merchantService.addProduct(productData);
      if (product) {
        set((state) => ({
          products: {
            ...state.products,
            [merchantId]: [product, ...(state.products[merchantId] || [])],
          },
        }));
      }
    } catch {}
  },

  updateProduct: async (merchantId, productId, updates) => {
    try {
      const updated = await merchantService.updateProduct(productId, updates);
      if (updated) {
        set((state) => ({
          products: {
            ...state.products,
            [merchantId]: (state.products[merchantId] || []).map((p) =>
              p.id === productId ? updated : p
            ),
          },
        }));
      }
    } catch {}
  },

  deleteProduct: async (merchantId, productId) => {
    try {
      const success = await merchantService.deleteProduct(productId);
      if (success) {
        set((state) => ({
          products: {
            ...state.products,
            [merchantId]: (state.products[merchantId] || []).filter((p) => p.id !== productId),
          },
        }));
      }
    } catch {}
  },

  publishStore: async (merchantId) => {
    try {
      const updated = await merchantService.updateMyStore({ isPublished: true });
      if (updated) {
        set((state) => ({
          stores: { ...state.stores, [merchantId]: updated },
        }));
      }
    } catch {}
  },

  unpublishStore: async (merchantId) => {
    try {
      const updated = await merchantService.updateMyStore({ isPublished: false });
      if (updated) {
        set((state) => ({
          stores: { ...state.stores, [merchantId]: updated },
        }));
      }
    } catch {}
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const success = await merchantService.updateOrderStatus(orderId, status);
      if (success) {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        }));
      }
    } catch {}
  },

  getStoreProducts: (merchantId) => get().products[merchantId] || [],
  getStoreInfo: (merchantId) => get().stores[merchantId],
  getMerchantOrders: (merchantSlug) => get().orders.filter((o) => o.merchantSlug === merchantSlug),
}));
