import type { StoredUser } from '@/services/authService';
import type { Transaction } from '@/store/useTransactionStore';
import type { AdminUserRecord, AdminTxRecord, KYCSubmission, AnalyticsData } from '@/types/admin';
import platformDataService from '@/services/platformDataService';

type DisputeRecord = {
  id: string;
  status: string;
  [key: string]: any;
};

export type { AnalyticsData };

export function mapKycDisplayStatus(user: StoredUser): AdminUserRecord['kycStatus'] {
  if (user.kycStatus === 'approved' || user.kycLevel >= 2) return 'verified';
  if (user.kycStatus === 'pending' || user.kycLevel === 1) return 'pending';
  return 'unverified';
}

export function storedUserToAdminRecord(
  user: StoredUser,
  txStats: { count: number; volume: number }
): AdminUserRecord {
  const fullName =
    user.userType === 'merchant' && user.merchantProfile?.tradingName
      ? user.merchantProfile.tradingName
      : `${user.firstName} ${user.lastName}`.trim();

  return {
    id: user.id,
    fullName,
    email: user.email,
    phone: user.phone ?? '—',
    accountNumber: user.accountNumber ?? '—',
    balance: user.balance,
    kycStatus: mapKycDisplayStatus(user),
    isActive: user.isActive !== false,
    userType: user.userType,
    kycLevel: user.kycLevel,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin ?? user.createdAt,
    totalTransactions: txStats.count,
    totalVolume: txStats.volume,
    merchantId: user.merchantProfile?.merchantId,
    businessCategory: user.merchantProfile?.category,
  };
}

export function buildUserTxStats(userId: string, transactions: Transaction[]) {
  const userTxs = transactions.filter((t) => t.userId === userId && t.status === 'success');
  return {
    count: userTxs.length,
    volume: userTxs.reduce((s, t) => s + t.amount, 0),
  };
}

export function mapUsersToAdminRecords(users: StoredUser[], transactions: Transaction[]): AdminUserRecord[] {
  return users.map((u) => storedUserToAdminRecord(u, buildUserTxStats(u.id, transactions)));
}

function mapTxCategory(category: Transaction['category']): AdminTxRecord['type'] {
  if (category === 'bills') return 'bill';
  if (category === 'deposit') return 'topup';
  if (category === 'withdrawal') return 'withdrawal';
  return 'transfer';
}

export function transactionToAdminRecord(tx: Transaction, users: StoredUser[]): AdminTxRecord {
  const user = users.find((u) => u.id === tx.userId);
  const senderName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : tx.userName ?? 'Platform user';
  const senderEmail = user?.email ?? tx.userEmail ?? '—';

  return {
    id: tx.id,
    reference: tx.reference ?? tx.id,
    senderName,
    senderEmail,
    recipientName: tx.recipientName ?? tx.name ?? '—',
    amount: tx.amount,
    fee: 0,
    type: mapTxCategory(tx.category),
    category: tx.category ?? 'transfer',
    status: tx.status === 'success' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
    createdAt: tx.date ?? tx.createdAt ?? '',
    userId: tx.userId,
  };
}

export function mapTransactionsToAdminRecords(
  transactions: Transaction[],
  users: StoredUser[]
): AdminTxRecord[] {
  return [...transactions]
    .sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .map((tx) => transactionToAdminRecord(tx, users));
}

export function userToKycSubmission(user: StoredUser): KYCSubmission | null {
  const needsReview = user.kycStatus === 'pending' || (user.kycLevel < 2 && user.kycLevel >= 1);
  if (!needsReview) return null;

  const idType =
    user.bvnVerified && user.ninVerified
      ? 'BVN + NIN'
      : user.bvnVerified
        ? 'BVN'
        : user.ninVerified
          ? 'NIN'
          : 'Identity documents';

  let status: KYCSubmission['status'] = 'pending';
  if (user.kycStatus === 'approved' || user.kycLevel >= 2) status = 'approved';
  else if (user.kycStatus === 'rejected') status = 'rejected';

  return {
    id: `kyc_${user.id}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`.trim(),
    userEmail: user.email,
    idType,
    kycLevel: user.kycLevel,
    status,
    submittedAt: user.kycSubmittedAt ?? user.createdAt,
  };
}

export function mapUsersToKycSubmissions(users: StoredUser[]): KYCSubmission[] {
  return users
    .map(userToKycSubmission)
    .filter((s): s is KYCSubmission => s !== null)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function computeAnalytics(
  users: StoredUser[],
  transactions: Transaction[],
  disputes: DisputeRecord[]
): AnalyticsData {
  const successful = transactions.filter((t) => t.status === 'success');
  const totalVolume = successful.reduce((s, t) => s + t.amount, 0);
  const totalRevenue = Math.round(totalVolume * 0.005);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = users.filter((u) => {
    if (!u.lastLogin) return false;
    const login = new Date(u.lastLogin);
    login.setHours(0, 0, 0, 0);
    return login.getTime() === today.getTime();
  }).length;

  const pendingKYC = users.filter(
    (u) => u.kycStatus === 'pending' || (u.kycLevel < 2 && u.kycLevel >= 1)
  ).length;

  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;

  const dailyMap = new Map<string, { amount: number; transactions: number }>();
  for (const tx of successful) {
    const day = new Date(tx.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    const entry = dailyMap.get(day) ?? { amount: 0, transactions: 0 };
    entry.amount += tx.amount;
    entry.transactions += 1;
    dailyMap.set(day, entry);
  }

  const dailyRevenue = Array.from(dailyMap.entries())
    .slice(0, 30)
    .map(([date, v]) => ({ date, amount: v.amount, transactions: v.transactions }));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, { volume: number; count: number }>();
  for (const tx of successful) {
    const d = new Date(tx.date);
    const key = monthNames[d.getMonth()];
    const entry = monthlyMap.get(key) ?? { volume: 0, count: 0 };
    entry.volume += tx.amount;
    entry.count += 1;
    monthlyMap.set(key, entry);
  }

  const monthlyVolume = monthNames.map((month) => ({
    month,
    volume: monthlyMap.get(month)?.volume ?? 0,
    count: monthlyMap.get(month)?.count ?? 0,
  }));

  const weeklyUsers = Array.from({ length: 8 }).map((_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const newUsers = users.filter((u) => {
      const created = new Date(u.createdAt);
      return created >= weekStart && created < weekEnd;
    }).length;
    const activeUsers = users.filter((u) => {
      if (!u.lastLogin) return false;
      const login = new Date(u.lastLogin);
      return login >= weekStart && login < weekEnd;
    }).length;
    return { week: `W${i + 1}`, newUsers, activeUsers };
  });

  const merchants = users.filter((u) => u.userType === 'merchant').length;
  const consumers = users.length - merchants;

  return {
    dailyRevenue,
    weeklyUsers,
    monthlyVolume,
    kpiSummary: {
      totalUsers: users.length,
      totalVolume,
      totalTransactions: transactions.length,
      totalRevenue,
      activeToday,
      pendingKYC,
      openDisputes,
      merchantCount: merchants,
      consumerCount: consumers,
    },
  };
}

export async function getOpenDisputeCount(): Promise<number> {
  const disputes = await platformDataService.getAllDisputes();
  return disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;
}

export async function getPlatformSummary() {
  const users = await platformDataService.getAllUsers();
  const transactions = await platformDataService.getAllTransactions();
  const disputes = await platformDataService.getAllDisputes();
  const merchant = await platformDataService.getMerchantLedger();
  return {
    users,
    transactions,
    disputes,
    merchant,
    analytics: computeAnalytics(users, transactions, disputes),
  };
}
