/** Customer disputes (support tickets): same API and issue types as the backend and the mobile app. */
import apiClient from '@/lib/apiClient';

export const ISSUE_TYPES = [
  { id: 'wrong_debit', label: 'Money left my account but the payment failed' },
  { id: 'failed_transfer', label: 'Transfer didn’t arrive' },
  { id: 'failed_bill', label: 'Bill or airtime not delivered' },
  { id: 'unauthorized_charge', label: 'A charge I didn’t make' },
  { id: 'account_hacked', label: 'Someone else used my account' },
  { id: 'other', label: 'Something else' },
] as const;

export const issueLabel = (id: string) => ISSUE_TYPES.find((i) => i.id === id)?.label ?? id.replace(/_/g, ' ');

export interface Dispute {
  id: string; ticketNumber: string; transactionId: string; amount: string | number; issueType: string; description: string;
  status: string; priority: string; resolutionNote: string | null; createdAt: string; updatedAt: string; resolvedAt: string | null;
}
export interface DisputeMessage { id: string; authorType: 'customer' | 'admin'; authorName: string | null; body: string; createdAt: string }

const unwrap = (r: any) => r?.data ?? r;
export const disputesApi = {
  list: async (): Promise<Dispute[]> => unwrap(await apiClient.get('/disputes?limit=50'))?.disputes ?? [],
  get: async (id: string): Promise<Dispute> => unwrap(await apiClient.get(`/disputes/${id}`)),
  messages: async (id: string): Promise<DisputeMessage[]> => unwrap(await apiClient.get(`/disputes/${id}/messages`)) ?? [],
  reply: async (id: string, body: string) => unwrap(await apiClient.post(`/disputes/${id}/messages`, { body })),
  create: async (data: { transactionId: string; amount: number; issueType: string; description: string }): Promise<Dispute> =>
    unwrap(await apiClient.post('/disputes', data)),
  cancel: async (id: string) => apiClient.patch(`/disputes/${id}/cancel`),
};

export const FINAL = ['resolved', 'closed', 'rejected', 'cancelled'];
export const statusStyle = (s: string) =>
  s === 'resolved' ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
    : FINAL.includes(s) ? { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
      : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
export const naira = (n: number | string) => `₦${Number(n).toLocaleString('en-NG')}`;
