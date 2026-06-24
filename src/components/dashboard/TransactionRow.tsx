import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus } from 'lucide-react';
import { Transaction } from '@/store/useTransactionStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/badge';

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const isCredit = transaction.type === 'credit';
  
  const getIcon = () => {
    switch (transaction.category) {
      case 'deposit': return <Plus size={20} className="text-green-500" />;
      case 'withdrawal': return <ArrowUpRight size={20} className="text-red-500" />;
      case 'bills': return <Landmark size={20} className="text-blue-500" />;
      case 'transfer': return isCredit ? <ArrowDownLeft size={20} className="text-green-500" /> : <ArrowUpRight size={20} className="text-red-500" />;
      default: return <Landmark size={20} className="text-gray-500" />;
    }
  };

  const getIconBg = () => {
    switch (transaction.category) {
      case 'deposit': return 'bg-green-100';
      case 'withdrawal': return 'bg-red-100';
      case 'bills': return 'bg-blue-100';
      case 'transfer': return isCredit ? 'bg-green-100' : 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg()}`}>
          {getIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{transaction.name}</p>
          <p className="text-xs text-gray-500 truncate">{formatDate(transaction.date)}</p>
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end">
        <span className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
        <div className="mt-1">
          {transaction.status === 'success' && <Badge variant="success">Success</Badge>}
          {transaction.status === 'pending' && <Badge variant="warning">Pending</Badge>}
          {transaction.status === 'failed' && <Badge variant="danger">Failed</Badge>}
        </div>
      </div>
    </div>
  );
}
