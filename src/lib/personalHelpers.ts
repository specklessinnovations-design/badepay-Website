import type { KYCLevel } from '@/store/useAuthStore';
import type { Transaction } from '@/mock/transactions';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatAccountDisplay(accountNumber?: string): string {
  if (!accountNumber) return '';
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatDisplayName(firstName: string, lastName?: string): string {
  const formatPart = (part: string) =>
    part.trim() ? part.trim().charAt(0).toUpperCase() + part.trim().slice(1).toLowerCase() : '';
  if (!lastName?.trim()) return formatPart(firstName);
  return `${formatPart(firstName)} ${formatPart(lastName)}`;
}

export function deriveUsername(firstName: string, username?: string): string {
  if (username?.trim()) return username.replace(/^@/, '').toLowerCase();
  return firstName.toLowerCase().replace(/\s+/g, '');
}

export function getKycTierInfo(level: KYCLevel) {
  const tiers: Record<KYCLevel, { label: string; access: string; nextTier?: KYCLevel; nextBenefit?: string }> = {
    0: { label: 'Unverified', access: 'Limited access', nextTier: 1, nextBenefit: 'Basic banking features' },
    1: { label: 'Basic', access: 'Basic access', nextTier: 2, nextBenefit: 'Unlock ₦5M daily limits & virtual cards' },
    2: { label: 'Standard', access: 'Extended limits', nextTier: 3, nextBenefit: 'Premium limits & priority support' },
    3: { label: 'Premium', access: 'Full access' },
  };
  return tiers[level] ?? tiers[1];
}

export function computeMonthlyChange(transactions: Transaction[]): number {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const currentMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && tx.status === 'success';
  });

  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const previousMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && tx.status === 'success';
  });

  const currentNet = currentMonthTx.reduce(
    (sum, tx) => sum + (tx.type === 'credit' ? tx.amount : -tx.amount),
    0
  );
  const previousNet = previousMonthTx.reduce(
    (sum, tx) => sum + (tx.type === 'credit' ? tx.amount : -tx.amount),
    0
  );

  if (previousNet === 0) return currentNet > 0 ? 100 : 0;
  return ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
}

export function getTransactionTotals(transactions: Transaction[]) {
  const successful = transactions.filter((tx) => tx.status === 'success');
  const totalIn = successful.filter((tx) => tx.type === 'credit').reduce((s, tx) => s + tx.amount, 0);
  const totalOut = successful.filter((tx) => tx.type === 'debit').reduce((s, tx) => s + tx.amount, 0);
  return { totalIn, totalOut };
}

export type ActivityFilter = 'all' | 'credit' | 'debit' | 'bills' | 'transfer';

export function filterTransactions(transactions: Transaction[], filter: ActivityFilter, query: string) {
  const q = query.trim().toLowerCase();
  return transactions.filter((tx) => {
    const matchesQuery =
      !q ||
      tx.name.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      tx.amount.toString().includes(q) ||
      tx.id.toLowerCase().includes(q);

    let matchesFilter = true;
    if (filter === 'credit') matchesFilter = tx.type === 'credit';
    else if (filter === 'debit') matchesFilter = tx.type === 'debit';
    else if (filter === 'bills') matchesFilter = tx.category === 'bills';
    else if (filter === 'transfer') matchesFilter = tx.category === 'transfer';

    return matchesQuery && matchesFilter;
  });
}
