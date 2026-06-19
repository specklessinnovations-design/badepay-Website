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

interface UsersState {
  users: AdminUserRecord[];
  refresh: () => void;
  toggleStatus: (id: string) => void;
}

export const useAdminUsersStore = create<UsersState>((set) => ({
  users: [],

  refresh: async () => {
    try {
      const resp = await adminService.getUsers();
      set({ users: resp.data.data });
    } catch (e) {
      set({ users: [] });
    }
  },

  toggleStatus: async (id) => {
    const record = useAdminUsersStore.getState().users.find((u) => u.id === id);
    if (!record) return;
    await adminService.toggleUserActive(id, !record.isActive).catch(() => null);
    await useAdminUsersStore.getState().refresh();
  },
}));

interface TxState {
  transactions: AdminTxRecord[];
  refresh: () => void;
  reverseTransaction: (id: string) => void;
}

export const useAdminTransactionsStore = create<TxState>((set) => ({
  transactions: [],

  refresh: async () => {
    try {
      const resp = await adminService.getTransactions();
      set({ transactions: resp.data.data });
    } catch (e) {
      set({ transactions: [] });
    }
  },

  reverseTransaction: async (id) => {
    await adminService.reverseTransaction(id).catch(() => null);
    await useAdminTransactionsStore.getState().refresh();
  },
}));

interface KYCState {
  submissions: KYCSubmission[];
  refresh: () => void;
  approveKYC: (id: string) => void;
  rejectKYC: (id: string) => void;
}

export const useAdminKYCStore = create<KYCState>((set) => ({
  submissions: [],

  refresh: async () => {
    try {
      const submissions = await adminService.getPendingKyc();
      set({ submissions });
    } catch (e) {
      set({ submissions: [] });
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

interface DisputesState {
  disputes: DisputeRecord[];
  refresh: () => void;
  updateStatus: (id: string, status: DisputeRecord['status']) => void;
}

export const useAdminDisputesStore = create<DisputesState>((set) => ({
  disputes: [],

  refresh: async () => {
    set({ disputes: [] });
  },

  updateStatus: async (id, status) => {
    await adminService.updateDispute(id, status as any).catch(() => null);
    await useAdminDisputesStore.getState().refresh();
  },
}));

interface AnalyticsState {
  data: AnalyticsData;
  refresh: () => void;
}

const emptyAnalytics: AnalyticsData = {
  dailyRevenue: [],
  weeklyUsers: [],
  monthlyVolume: [],
  kpiSummary: {
    totalUsers: 0,
    totalVolume: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeToday: 0,
    pendingKYC: 0,
    openDisputes: 0,
    merchantCount: 0,
    consumerCount: 0,
  },
};

export const useAdminAnalyticsStore = create<AnalyticsState>((set) => ({
  data: emptyAnalytics,

  refresh: async () => {
    try {
      const data = await adminService.getAnalytics();
      set({ data });
    } catch (e) {
      set({ data: computeAnalytics([], [], []) });
    }
  },
}));

export function refreshAllAdminData() {
  useAdminUsersStore.getState().refresh();
  useAdminTransactionsStore.getState().refresh();
  useAdminKYCStore.getState().refresh();
  useAdminDisputesStore.getState().refresh();
  useAdminAnalyticsStore.getState().refresh();
}
