export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'success' | 'pending' | 'failed';
  date: string;
  description: string;
  category: 'transfer' | 'bills' | 'deposit' | 'withdrawal';
  userId?: string;
  userEmail?: string;
  userName?: string;
  recipientName?: string;
  reference?: string;
  fee?: number;
}

export const mockTransactions: Transaction[] = [
  { id: 'TXN10001', name: 'Chinedu Okafor', amount: 15000.0, type: 'debit', status: 'success', date: '2026-05-19T10:14:00Z', description: 'Dinner reimbursement', category: 'transfer' },
  { id: 'TXN10002', name: 'MTN Airtime', amount: 2000.0, type: 'debit', status: 'success', date: '2026-05-19T08:30:00Z', description: 'Airtime Recharge', category: 'bills' },
  { id: 'TXN10003', name: 'Card Top-up', amount: 50000.0, type: 'credit', status: 'success', date: '2026-05-18T16:45:00Z', description: 'Funding via Mastercard', category: 'deposit' },
  { id: 'TXN10004', name: 'EKEDC Prepaid', amount: 10000.0, type: 'debit', status: 'success', date: '2026-05-18T12:10:00Z', description: 'Prepaid Electricity Token', category: 'bills' },
  { id: 'TXN10005', name: 'GTBank Withdrawal', amount: 25000.0, type: 'debit', status: 'success', date: '2026-05-17T14:22:00Z', description: 'Withdrawal to GTB', category: 'withdrawal' },
  { id: 'TXN10006', name: 'Funmi Alao', amount: 8500.0, type: 'credit', status: 'success', date: '2026-05-17T09:05:00Z', description: 'Payment for groceries', category: 'transfer' },
  { id: 'TXN10007', name: 'DSTV Subscription', amount: 18500.0, type: 'debit', status: 'success', date: '2026-05-16T18:00:00Z', description: 'DSTV Compact package', category: 'bills' },
  { id: 'TXN10008', name: 'Airtel Data', amount: 5000.0, type: 'debit', status: 'success', date: '2026-05-16T11:15:00Z', description: '20GB Monthly Plan', category: 'bills' },
  { id: 'TXN10009', name: 'Obinna Nwosu', amount: 12000.0, type: 'debit', status: 'success', date: '2026-05-15T15:30:00Z', description: 'Loan repayment', category: 'transfer' },
  { id: 'TXN10010', name: 'Ibrahim Musa', amount: 35000.0, type: 'credit', status: 'success', date: '2026-05-15T08:12:00Z', description: 'Freelance design payment', category: 'transfer' },
  { id: 'TXN10011', name: 'Card Top-up', amount: 10000.0, type: 'credit', status: 'success', date: '2026-05-14T20:00:00Z', description: 'Funding via Visa', category: 'deposit' },
  { id: 'TXN10012', name: 'Water Board', amount: 3500.0, type: 'debit', status: 'failed', date: '2026-05-14T13:40:00Z', description: 'Water bill payment', category: 'bills' },
  { id: 'TXN10013', name: 'Smile Internet', amount: 15000.0, type: 'debit', status: 'success', date: '2026-05-13T10:00:00Z', description: 'Unlimited Lite Router', category: 'bills' },
  { id: 'TXN10014', name: 'Tosin Balogun', amount: 5000.0, type: 'debit', status: 'pending', date: '2026-05-13T07:22:00Z', description: 'Lunch transfer', category: 'transfer' },
  { id: 'TXN10015', name: 'Refund', amount: 4500.0, type: 'credit', status: 'success', date: '2026-05-12T16:50:00Z', description: 'Failed utility refund', category: 'deposit' },
  { id: 'TXN10016', name: 'Spectranet', amount: 12500.0, type: 'debit', status: 'success', date: '2026-05-11T12:00:00Z', description: 'Home broadband topup', category: 'bills' },
  { id: 'TXN10017', name: 'Ngozi Eze', amount: 7500.0, type: 'credit', status: 'success', date: '2026-05-10T19:30:00Z', description: 'Gift', category: 'transfer' },
  { id: 'TXN10018', name: 'Zenith Withdrawal', amount: 20000.0, type: 'debit', status: 'success', date: '2026-05-09T14:15:00Z', description: 'Bank cashout', category: 'withdrawal' },
  { id: 'TXN10019', name: '9mobile Airtime', amount: 1000.0, type: 'debit', status: 'success', date: '2026-05-08T09:40:00Z', description: 'Quick airtime purchase', category: 'bills' },
  { id: 'TXN10020', name: 'Zainab Abubakar', amount: 25000.0, type: 'debit', status: 'success', date: '2026-05-07T11:00:00Z', description: 'Rent sharing', category: 'transfer' },
  { id: 'TXN10021', name: 'Glo Data', amount: 3000.0, type: 'debit', status: 'success', date: '2026-05-06T17:15:00Z', description: '10GB Data Pack', category: 'bills' },
  { id: 'TXN10022', name: 'IKEDC Postpaid', amount: 22000.0, type: 'debit', status: 'success', date: '2026-05-05T13:10:00Z', description: 'Monthly electricity bill', category: 'bills' },
  { id: 'TXN10023', name: 'Card Top-up', amount: 30000.0, type: 'credit', status: 'success', date: '2026-05-04T08:45:00Z', description: 'Funding via Mastercard', category: 'deposit' },
  { id: 'TXN10024', name: 'Kelechi Amadi', amount: 14000.0, type: 'credit', status: 'success', date: '2026-05-03T16:00:00Z', description: 'Movie tickets refund', category: 'transfer' },
  { id: 'TXN10025', name: 'StarTimes TV', amount: 6500.0, type: 'debit', status: 'success', date: '2026-05-02T12:30:00Z', description: 'Classic Bouquet', category: 'bills' },
  { id: 'TXN10026', name: 'LCC Toll', amount: 2500.0, type: 'debit', status: 'success', date: '2026-05-01T08:15:00Z', description: 'e-Tag topup', category: 'bills' },
  { id: 'TXN10027', name: 'Access Withdrawal', amount: 40000.0, type: 'debit', status: 'success', date: '2026-04-30T15:20:00Z', description: 'Withdrawal to Access Bank', category: 'withdrawal' },
  { id: 'TXN10028', name: 'Halima Bello', amount: 18000.0, type: 'credit', status: 'success', date: '2026-04-29T10:10:00Z', description: 'Aso Ebi contribution', category: 'transfer' },
  { id: 'TXN10029', name: 'UBA Transfer', amount: 50000.0, type: 'credit', status: 'success', date: '2026-04-28T11:45:00Z', description: 'Wallet credit from UBA', category: 'deposit' },
  { id: 'TXN10030', name: 'AEDC Prepaid', amount: 15000.0, type: 'debit', status: 'success', date: '2026-04-27T16:30:00Z', description: 'Meter funding token', category: 'bills' },
];
