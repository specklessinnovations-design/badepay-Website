/**
 * Unified platform data layer — single source of truth for web (and future API).
 * All registered accounts live in badepay_users regardless of signup channel.
 */

import type { StoredUser } from '@/services/authService';
import * as authService from '@/services/authService';
import type { Transaction } from '@/mock/transactions';

const TRANSACTIONS_KEY = 'badepay_transactions';
const DISPUTES_KEY = 'badepay_disputes';
const SETTINGS_KEY = 'badepay_platform_settings';
const MERCHANT_KEY = 'badepay_merchant';

export interface DisputeRecord {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  transactionId: string;
  transactionRef: string;
  amount: number;
  issueType: 'unauthorized_transaction' | 'double_charge' | 'failed_but_debited' | 'wrong_recipient' | 'other';
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  corporateAddress: string;
  maxDailyTransferLimit: number;
  kycThreshold: number;
  autoApproveBvn: boolean;
  maintenanceMode: boolean;
}

export interface MerchantLedgerSnapshot {
  payments: { id: string; customerName: string; amount: number; date: string; status: string; reference: string }[];
  settlements: { id: string; amount: number; date: string; status: string; reference: string }[];
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'BadePay Digital',
  supportEmail: 'support@badepay.app',
  supportPhone: '0800 BADEPAY',
  corporateAddress: '14 Victoria Island, Lagos, NG',
  maxDailyTransferLimit: 5000000,
  kycThreshold: 50000,
  autoApproveBvn: true,
  maintenanceMode: false,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAllUsers(): StoredUser[] {
  return authService.listUsers();
}

export function getUserById(id: string): StoredUser | null {
  return authService.getUserById(id);
}

export function getAllTransactions(): Transaction[] {
  const persisted = readJson<{ state?: { transactions?: Transaction[] } } | Transaction[]>(
    TRANSACTIONS_KEY,
    []
  );
  if (Array.isArray(persisted)) return persisted;
  return persisted?.state?.transactions ?? [];
}

export function getMerchantLedger(): MerchantLedgerSnapshot {
  const empty: MerchantLedgerSnapshot = { payments: [], settlements: [] };
  const persisted = readJson<{ state?: MerchantLedgerSnapshot }>(MERCHANT_KEY, { state: empty });
  return persisted?.state ?? empty;
}

export function getAllDisputes(): DisputeRecord[] {
  return readJson<DisputeRecord[]>(DISPUTES_KEY, []);
}

export function saveDisputes(disputes: DisputeRecord[]) {
  writeJson(DISPUTES_KEY, disputes);
}

export function getPlatformSettings(): PlatformSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<PlatformSettings>>(SETTINGS_KEY, {}) };
}

export function savePlatformSettings(settings: PlatformSettings) {
  writeJson(SETTINGS_KEY, settings);
}

export function updateUser(id: string, updates: Partial<StoredUser>): Promise<StoredUser> {
  return authService.updateUserProfile(id, updates);
}

export function setUserActive(id: string, isActive: boolean): Promise<StoredUser> {
  return updateUser(id, { isActive });
}

export function approveUserKyc(userId: string, level: 2 | 3 = 2): Promise<StoredUser> {
  return updateUser(userId, { kycLevel: level, kycStatus: 'approved' });
}

export function rejectUserKyc(userId: string): Promise<StoredUser> {
  return updateUser(userId, { kycStatus: 'rejected' });
}

export function reverseTransaction(id: string): boolean {
  const txs = getAllTransactions();
  const index = txs.findIndex((t) => t.id === id);
  if (index === -1) return false;
  txs[index] = { ...txs[index], status: 'failed' };
  writeJson(TRANSACTIONS_KEY, { state: { transactions: txs }, version: 0 });
  return true;
}

export function fileDispute(input: {
  userId: string;
  userName: string;
  transactionId?: string;
  transactionRef?: string;
  amount: number;
  issueType: DisputeRecord['issueType'];
  description: string;
}): DisputeRecord {
  const disputes = getAllDisputes();
  const dispute: DisputeRecord = {
    id: `d_${Date.now()}`,
    ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
    userId: input.userId,
    userName: input.userName,
    transactionId: input.transactionId ?? '',
    transactionRef: input.transactionRef ?? '',
    amount: input.amount,
    issueType: input.issueType,
    description: input.description,
    status: 'open',
    priority: input.amount >= 100000 ? 'high' : input.amount >= 20000 ? 'medium' : 'low',
    createdAt: new Date().toISOString(),
  };
  disputes.unshift(dispute);
  saveDisputes(disputes);
  return dispute;
}

export function updateDisputeStatus(id: string, status: DisputeRecord['status']) {
  const disputes = getAllDisputes().map((d) => (d.id === id ? { ...d, status } : d));
  saveDisputes(disputes);
}

export function recordUserLogin(userId: string) {
  updateUser(userId, { lastLogin: new Date().toISOString() }).catch(() => {});
}

export function isMaintenanceMode(): boolean {
  return getPlatformSettings().maintenanceMode;
}

export function isUserSuspended(user: StoredUser): boolean {
  return user.isActive === false;
}
