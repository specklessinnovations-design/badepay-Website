/** Customer store orders (mobile app: My orders). */
import apiClient from '@/lib/apiClient';

export interface OrderItem { id: string; quantity: number; priceAtPurchase: string | number; product?: { name: string; images?: { imageUrl: string }[] } | null }
export interface Order {
  id: string; reference: string; merchantSlug: string; status: string; paymentStatus: string; paymentMethod: string;
  totalAmount: string | number; createdAt: string; items: OrderItem[];
  store?: { name: string; slug: string } | null;
  shippingAddress?: { recipientName: string; addressLine1: string; addressLine2?: string | null; city: string; state: string; phone: string } | null;
}

const unwrap = (r: any) => r?.data ?? r;
export const ordersApi = {
  list: async (): Promise<Order[]> => unwrap(await apiClient.get('/customer/orders'))?.orders ?? [],
  get: async (id: string): Promise<Order> => unwrap(await apiClient.get(`/customer/orders/${id}`))?.order,
  verifyPayment: async (id: string): Promise<{ order: Order; outcome: string }> => unwrap(await apiClient.post(`/customer/orders/${id}/pay/verify`)),
};

export const naira = (n: number | string) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const orderStatusStyle = (s: string) =>
  ['completed', 'delivered'].includes(s) ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
    : s === 'cancelled' ? { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
      : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
