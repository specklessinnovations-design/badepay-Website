import { create } from 'zustand';
import { adminService } from '@/services/adminService';
import { mapUsersToAdminRecords, mapTransactionsToAdminRecords, mapUsersToKycSubmissions, computeAnalytics } from '@/lib/adminMappers';
import type {
  AdminUserRecord,
  AdminTxRecord,
  KYCSubmission,
  AnalyticsData,
  DisputeRecord,
} from '@/types/admin';

export type { AdminUserRecord, AdminTxRecord, KYCSubmission, AnalyticsData, DisputeRecord };

// ─── Users Store ──────────────────────────────────────────────────────────────
interface UsersState {
  users: AdminUserRecord[];
  loading: boolean;
  refresh: () => void;
  toggleStatus: (id: string) => void;
}

export const useAdminUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const resp = await adminService.getUsers();
      set({ users: resp.data.data, loading: false });
    } catch {
      set({ users: [], loading: false });
    }
  },

  toggleStatus: async (id) => {
    const record = useAdminUsersStore.getState().users.find((u) => u.id === id);
    if (!record) return;
    await adminService.toggleUserActive(id, !record.isActive).catch(() => null);
    await useAdminUsersStore.getState().refresh();
  },
}));

// ─── Merchants Store ──────────────────────────────────────────────────────────
interface MerchantsState {
  merchants: any[];
  loading: boolean;
  refresh: () => void;
  toggleStatus: (id: string) => void;
}

export const useAdminMerchantsStore = create<MerchantsState>((set) => ({
  merchants: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const merchants = await adminService.getMerchants(1, 100);
      set({ merchants, loading: false });
    } catch {
      set({ merchants: [], loading: false });
    }
  },

  toggleStatus: async (id) => {
    const record = useAdminMerchantsStore.getState().merchants.find((m) => m.id === id);
    if (!record) return;
    await adminService.toggleUserActive(id, !record.isActive).catch(() => null);
    await useAdminMerchantsStore.getState().refresh();
  },
}));

// ─── Transactions Store ───────────────────────────────────────────────────────
interface TxState {
  transactions: AdminTxRecord[];
  loading: boolean;
  refresh: () => void;
  reverseTransaction: (id: string) => void;
}

export const useAdminTransactionsStore = create<TxState>((set) => ({
  transactions: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const resp = await adminService.getTransactions();
      set({ transactions: resp.data.data, loading: false });
    } catch {
      set({ transactions: [], loading: false });
    }
  },

  reverseTransaction: async (id) => {
    await adminService.reverseTransaction(id).catch(() => null);
    await useAdminTransactionsStore.getState().refresh();
  },
}));

// ─── KYC Store ────────────────────────────────────────────────────────────────
interface KYCState {
  submissions: KYCSubmission[];
  loading: boolean;
  refresh: () => void;
  approveKYC: (id: string) => void;
  rejectKYC: (id: string) => void;
}

export const useAdminKYCStore = create<KYCState>((set) => ({
  submissions: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const submissions = await adminService.getPendingKyc();
      set({ submissions, loading: false });
    } catch {
      set({ submissions: [], loading: false });
    }
  },

  approveKYC: async (id) => {
    const submission = useAdminKYCStore.getState().submissions.find((s) => s.id === id);
    if (!submission) return;
    await adminService.reviewKyc(submission.userId, 'approve');
    await useAdminKYCStore.getState().refresh();
    await useAdminUsersStore.getState().refresh();
  },

  rejectKYC: async (id) => {
    const submission = useAdminKYCStore.getState().submissions.find((s) => s.id === id);
    if (!submission) return;
    await adminService.reviewKyc(submission.userId, 'reject');
    await useAdminKYCStore.getState().refresh();
    await useAdminUsersStore.getState().refresh();
  },
}));

// ─── Disputes Store ───────────────────────────────────────────────────────────
interface DisputesState {
  disputes: DisputeRecord[];
  loading: boolean;
  refresh: () => void;
  updateStatus: (id: string, status: DisputeRecord['status']) => void;
}

export const useAdminDisputesStore = create<DisputesState>((set) => ({
  disputes: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const disputes = await adminService.getDisputes();
      const normalized = Array.isArray(disputes) ? disputes : [];
      set({ disputes: normalized, loading: false });
    } catch {
      set({ disputes: [], loading: false });
    }
  },

  updateStatus: async (id, status) => {
    await adminService.updateDispute(id, status as any).catch(() => null);
    await useAdminDisputesStore.getState().refresh();
  },
}));

// ─── Analytics Store ──────────────────────────────────────────────────────────
interface AnalyticsState {
  data: AnalyticsData;
  loading: boolean;
  refresh: () => void;
}

const emptyAnalytics: AnalyticsData = {
  dailyRevenue: [],
  weeklyUsers: [],
  monthlyVolume: [],
  kpiSummary: {
    totalUsers: 0, totalVolume: 0, totalTransactions: 0, totalRevenue: 0,
    activeToday: 0, pendingKYC: 0, openDisputes: 0, merchantCount: 0, consumerCount: 0,
  },
};

export const useAdminAnalyticsStore = create<AnalyticsState>((set) => ({
  data: emptyAnalytics,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const data = await adminService.getAnalytics();
      set({ data, loading: false });
    } catch {
      set({ data: computeAnalytics([], [], []), loading: false });
    }
  },
}));

// ─── Refresh All ──────────────────────────────────────────────────────────────
export function refreshAllAdminData() {
  useAdminUsersStore.getState().refresh();
  useAdminMerchantsStore.getState().refresh();
  useAdminTransactionsStore.getState().refresh();
  useAdminKYCStore.getState().refresh();
  useAdminDisputesStore.getState().refresh();
  useAdminAnalyticsStore.getState().refresh();
}
