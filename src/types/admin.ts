export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  accountNumber: string;
  balance: number;
  kycStatus: 'verified' | 'pending' | 'unverified';
  isActive: boolean;
  userType: 'consumer' | 'merchant';
  kycLevel: number;
  createdAt: string;
  lastLogin: string;
  totalTransactions: number;
  totalVolume: number;
  merchantId?: string;
  businessCategory?: string;
  merchantProfile?: {
    tradingName?: string;
    businessName?: string;
    businessType?: string;
    category?: string;
    verified?: boolean;
    qrSlug?: string;
  };
}

export interface AdminTxRecord {
  id: string;
  reference: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  amount: number;
  fee: number;
  type: 'transfer' | 'bill' | 'topup' | 'withdrawal';
  category: string;
  status: 'success' | 'pending' | 'failed' | 'reversed';
  createdAt: string;
  userId?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  idType: string;
  kycLevel: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface AnalyticsData {
  dailyRevenue: { date: string; amount: number; transactions: number }[];
  weeklyUsers: { week: string; newUsers: number; activeUsers: number }[];
  monthlyVolume: { month: string; volume: number; count: number }[];
  kpiSummary: {
    totalUsers: number;
    totalVolume: number;
    totalTransactions: number;
    totalRevenue: number;
    activeToday: number;
    pendingKYC: number;
    openDisputes: number;
    merchantCount: number;
    consumerCount: number;
  };
}

export interface DisputeRecord {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  transactionId: string;
  amount: number;
  issueType: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  description: string;
  createdAt: string;
  updatedAt: string;
}
