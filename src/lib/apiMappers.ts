import { User } from '@/store/useAuthStore';
import { Transaction } from '@/store/useTransactionStore';

export function mapProfileToUser(profile: Record<string, unknown>): User {
  const kycMap: Record<string, 0 | 1 | 2 | 3> = { verified: 2, pending: 1, rejected: 0 };
  const fullName = String(profile.full_name || profile.fullName || '');
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ') || '';
  
  return {
    id: String(profile.id || profile._id || ''),
    firstName: firstName || 'User',
    lastName: lastName || '',
    email: String(profile.email || ''),
    phone: String(profile.phone || ''),
    userType: (profile.userType as 'consumer' | 'merchant') || 'consumer',
    accountNumber: String(profile.account_number || profile.accountNumber || ''),
    balance: Number(profile.balance ?? 0),
    kycLevel: (kycMap[String(profile.kyc_status || '')] ?? 0) as 0 | 1 | 2 | 3,
    createdAt: String(profile.createdAt || new Date().toISOString()),
  };
}

export function mapApiTransaction(tx: Record<string, unknown>, currentUserId: string): Transaction {
  const sender = tx.sender_id as Record<string, unknown> | undefined;
  const recipient = tx.recipient_id as Record<string, unknown> | undefined;
  const senderId = sender?._id ? String(sender._id) : String(tx.sender_id || '');
  const isOutgoing = senderId === currentUserId;

  const name = isOutgoing
    ? String(recipient?.full_name || 'Recipient')
    : String(sender?.full_name || 'Sender');

  let category: Transaction['category'] = 'transfer';
  const cat = String(tx.category || '');
  if (cat.includes('bill')) category = 'bills';
  else if (cat.includes('topup') || cat.includes('wallet_funding')) category = 'deposit';
  else if (cat.includes('withdraw')) category = 'withdrawal';
  else if (tx.type === 'topup') category = 'deposit';

  return {
    id: String(tx._id || tx.reference),
    name: name || 'Transaction',
    amount: Number(tx.amount),
    type: isOutgoing ? 'debit' : 'credit',
    status: (tx.status as Transaction['status']) || 'success',
    date: String(tx.createdAt || new Date().toISOString()),
    description: String(tx.description || ''),
    category,
  };
}
