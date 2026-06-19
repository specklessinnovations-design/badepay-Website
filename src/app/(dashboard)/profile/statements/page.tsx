

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { exportTransactionsCsv, exportTransactionsPdf } from '@/lib/exportStatements';
import { formatDisplayName } from '@/lib/personalHelpers';
import toast from 'react-hot-toast';

export default function StatementsPage() {
  const { user } = useAuthStore();
  const transactions = useTransactionStore((s) => s.transactions);

  if (!user) return null;

  const name = formatDisplayName(user.firstName, user.lastName);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Export your transaction history for {name}. {transactions.length} transaction
        {transactions.length === 1 ? '' : 's'} available.
      </p>
      <button
        type="button"
        onClick={() => {
          exportTransactionsCsv(transactions);
          toast.success('CSV downloaded');
        }}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3.5 text-sm font-medium text-[var(--text-primary)]"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => {
          exportTransactionsPdf(transactions, name);
          toast.success('Statement downloaded');
        }}
        className="w-full rounded-xl bg-[#6fe8d6] py-3.5 text-sm font-semibold text-[#1a1a1a]"
      >
        Export statement
      </button>
    </div>
  );
}
