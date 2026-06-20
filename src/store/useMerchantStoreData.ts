import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  isActive: boolean;
  discount: number;
  variants: string[];
  createdAt: string;
}

export interface StoreInfo {
  name: string;
  description: string;
  category: string;
  bannerUrl: string;
  logoUrl: string;
  isPublished: boolean;
  slug: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  merchantSlug: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod: 'wallet' | 'bank';
  reference: string;
  createdAt: string;
}

const DEMO_MERCHANT_ID = 'demo_merchant_001';
const DEMO_MERCHANT_SLUG = 'adaezecollections';

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo_prod_001', name: 'Ankara Wrap Dress',
    description: 'Beautiful handcrafted Ankara print wrap dress. Perfect for events and casual outings.',
    price: 18500, category: 'Clothing', stock: 14, discount: 10, variants: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://picsum.photos/seed/ankara-dress/400/400',
    isActive: true, createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'demo_prod_002', name: 'Leather Tote Bag',
    description: 'Premium Nigerian leather tote bag. Spacious, stylish and durable.',
    price: 32000, category: 'Clothing', stock: 8, discount: 0, variants: ['Black', 'Brown', 'Tan'],
    imageUrl: 'https://picsum.photos/seed/leather-bag/400/400',
    isActive: true, createdAt: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'demo_prod_003', name: 'Gold Statement Necklace',
    description: 'Handmade 18k gold-plated statement necklace. Great for weddings & formal events.',
    price: 12500, category: 'Beauty', stock: 22, discount: 15, variants: ['Gold', 'Rose Gold'],
    imageUrl: 'https://picsum.photos/seed/gold-necklace/400/400',
    isActive: true, createdAt: '2026-05-10T10:00:00.000Z',
  },
  {
    id: 'demo_prod_004', name: 'Adire Printed Blazer',
    description: 'Modern cut blazer in traditional Adire fabric. Office-ready with cultural flair.',
    price: 45000, category: 'Clothing', stock: 5, discount: 0, variants: ['XS', 'S', 'M', 'L'],
    imageUrl: 'https://picsum.photos/seed/adire-blazer/400/400',
    isActive: true, createdAt: '2026-05-12T10:00:00.000Z',
  },
  {
    id: 'demo_prod_005', name: 'Beaded Clutch Bag',
    description: 'Hand-beaded evening clutch. Unique patterns, each piece is one-of-a-kind.',
    price: 9800, category: 'Clothing', stock: 3, discount: 0, variants: ['Blue', 'Red', 'Green'],
    imageUrl: 'https://picsum.photos/seed/beaded-clutch/400/400',
    isActive: true, createdAt: '2026-05-15T10:00:00.000Z',
  },
  {
    id: 'demo_prod_006', name: 'Shea Butter Body Cream',
    description: 'Pure unrefined shea butter enriched with coconut and lavender oil. 500ml jar.',
    price: 4500, category: 'Beauty', stock: 40, discount: 5, variants: ['500ml', '250ml'],
    imageUrl: 'https://picsum.photos/seed/shea-cream/400/400',
    isActive: true, createdAt: '2026-05-18T10:00:00.000Z',
  },
];

const DEMO_STORE_INFO: StoreInfo = {
  name: 'Adaeze Collections',
  description: 'Premium Nigerian fashion, accessories & beauty products. Handcrafted with love in Lagos.',
  category: 'Fashion',
  bannerUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&h=400&fit=crop',
  logoUrl: '',
  isPublished: true,
  slug: DEMO_MERCHANT_SLUG,
};

const DEMO_ORDERS: Order[] = [
  {
    id: 'demo_ord_001', merchantSlug: DEMO_MERCHANT_SLUG,
    customerName: 'Fatima Bello', customerPhone: '+2348055001122',
    deliveryAddress: '12 Alhaji Bashir Street, Victoria Island, Lagos',
    items: [{ product: DEMO_PRODUCTS[0], quantity: 1 }, { product: DEMO_PRODUCTS[2], quantity: 1 }],
    totalAmount: 27125, status: 'completed', paymentStatus: 'paid', paymentMethod: 'wallet',
    reference: 'ORD-ABC123', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo_ord_002', merchantSlug: DEMO_MERCHANT_SLUG,
    customerName: 'Chukwuemeka Eze', customerPhone: '+2348063334455',
    deliveryAddress: '3A Aba Road, Port Harcourt, Rivers State',
    items: [{ product: DEMO_PRODUCTS[1], quantity: 1 }],
    totalAmount: 32000, status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'bank',
    reference: 'ORD-DEF456', createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo_ord_003', merchantSlug: DEMO_MERCHANT_SLUG,
    customerName: 'Ngozi Adesanya', customerPhone: '+2348071122334',
    deliveryAddress: '86 Obafemi Awolowo Way, Ikeja, Lagos',
    items: [{ product: DEMO_PRODUCTS[3], quantity: 1 }, { product: DEMO_PRODUCTS[4], quantity: 2 }],
    totalAmount: 64600, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'wallet',
    reference: 'ORD-GHI789', createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'demo_ord_004', merchantSlug: DEMO_MERCHANT_SLUG,
    customerName: 'Yetunde Adebayo', customerPhone: '+2348089876543',
    deliveryAddress: '20 Festac Road, Amuwo Odofin, Lagos',
    items: [{ product: DEMO_PRODUCTS[5], quantity: 3 }],
    totalAmount: 12825, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'wallet',
    reference: 'ORD-JKL012', createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

function seedDemoDataIfNeeded(
  state: { stores: Record<string, StoreInfo>; products: Record<string, Product[]>; orders: Order[] }
) {
  let changed = false;
  const stores = { ...state.stores };
  const products = { ...state.products };
  const orders = [...state.orders];

  if (!stores[DEMO_MERCHANT_ID]) {
    stores[DEMO_MERCHANT_ID] = DEMO_STORE_INFO;
    changed = true;
  }

  if (!products[DEMO_MERCHANT_ID] || products[DEMO_MERCHANT_ID].length === 0) {
    products[DEMO_MERCHANT_ID] = DEMO_PRODUCTS;
    changed = true;
  } else {
    const demoById = Object.fromEntries(DEMO_PRODUCTS.map(p => [p.id, p]));
    const updated = products[DEMO_MERCHANT_ID].map(p => {
      const canonical = demoById[p.id];
      if (canonical && p.imageUrl !== canonical.imageUrl) {
        changed = true;
        return { ...p, imageUrl: canonical.imageUrl };
      }
      return p;
    });
    const existingIds = new Set(updated.map(p => p.id));
    const missing = DEMO_PRODUCTS.filter(p => !existingIds.has(p.id));
    if (missing.length > 0) {
      updated.push(...missing);
      changed = true;
    }
    if (changed) products[DEMO_MERCHANT_ID] = updated;
  }

  const existingOrderIds = new Set(orders.map(o => o.id));
  const missingOrders = DEMO_ORDERS.filter(o => !existingOrderIds.has(o.id));
  if (missingOrders.length > 0) {
    orders.push(...missingOrders);
    changed = true;
  }

  return changed ? { stores, products, orders } : null;
}

interface MerchantStoreDataState {
  stores: Record<string, StoreInfo>;
  products: Record<string, Product[]>;
  orders: Order[];
  _seeded: boolean;

  seedDemoData: () => void;
  upsertStore: (merchantId: string, info: Partial<StoreInfo>) => void;
  addProduct: (merchantId: string, product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (merchantId: string, productId: string, updates: Partial<Product>) => void;
  deleteProduct: (merchantId: string, productId: string) => void;
  publishStore: (merchantId: string) => void;
  unpublishStore: (merchantId: string) => void;
  placeOrder: (order: Omit<Order, 'id' | 'reference' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  markOrderPaid: (orderId: string) => void;
  getStoreProducts: (merchantId: string) => Product[];
  getStoreInfo: (merchantId: string) => StoreInfo | undefined;
  getMerchantOrders: (merchantSlug: string) => Order[];
}

export const useMerchantStoreData = create<MerchantStoreDataState>()(
  persist(
    (set, get) => ({
      stores: {},
      products: {},
      orders: [],
      _seeded: false,

      seedDemoData: () => {
        const state = get();
        const patched = seedDemoDataIfNeeded(state);
        if (patched) set({ ...patched, _seeded: true });
        else if (!state._seeded) set({ _seeded: true });
      },

      upsertStore: (merchantId, info) =>
        set((state) => ({
          stores: {
            ...state.stores,
            [merchantId]: { ...state.stores[merchantId], ...info } as StoreInfo,
          },
        })),

      addProduct: (merchantId, productData) => {
        const product: Product = {
          ...productData,
          id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          products: {
            ...state.products,
            [merchantId]: [product, ...(state.products[merchantId] || [])],
          },
        }));
        return product;
      },

      updateProduct: (merchantId, productId, updates) =>
        set((state) => ({
          products: {
            ...state.products,
            [merchantId]: (state.products[merchantId] || []).map((p) =>
              p.id === productId ? { ...p, ...updates } : p
            ),
          },
        })),

      deleteProduct: (merchantId, productId) =>
        set((state) => ({
          products: {
            ...state.products,
            [merchantId]: (state.products[merchantId] || []).filter((p) => p.id !== productId),
          },
        })),

      publishStore: (merchantId) =>
        set((state) => ({
          stores: {
            ...state.stores,
            [merchantId]: { ...state.stores[merchantId], isPublished: true },
          },
        })),

      unpublishStore: (merchantId) =>
        set((state) => ({
          stores: {
            ...state.stores,
            [merchantId]: { ...state.stores[merchantId], isPublished: false },
          },
        })),

      placeOrder: (orderData) => {
        const order: Order = {
          ...orderData,
          id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          reference: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),

      markOrderPaid: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, paymentStatus: 'paid', status: 'confirmed' } : o
          ),
        })),

      getStoreProducts: (merchantId) => get().products[merchantId] || [],
      getStoreInfo: (merchantId) => get().stores[merchantId],
      getMerchantOrders: (merchantSlug) =>
        get().orders.filter((o) => o.merchantSlug === merchantSlug),
    }),
    { name: 'badepay_merchant_store_data' }
  )
);

useMerchantStoreData.getState().seedDemoData();
