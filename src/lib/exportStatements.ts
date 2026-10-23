import type { Transaction } from '@/store/useTransactionStore';
import { formatNGN, formatDate } from '@/utils/formatting';

export function exportTransactionsCsv(transactions: Transaction[], filename = 'badepay-statements.csv') {
  const headers = ['ID', 'Date', 'Name', 'Description', 'Type', 'Category', 'Amount', 'Status'];
  const rows = transactions.map((tx) => [
    tx.id,
    formatDate(tx.date || tx.createdAt || '', 'full'),
    tx.name || 'Transaction',
    tx.description || '',
    tx.type,
    tx.category || 'transfer',
    (tx.amount || 0).toString(),
    tx.status,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsPdf(transactions: Transaction[], userName: string) {
  const lines = transactions.length
    ? transactions
        .map(
          (tx) =>
            `${formatDate(tx.date || tx.createdAt || '', 'short')} · ${tx.name || 'Transaction'} · ${tx.type === 'credit' ? '+' : '-'}${formatNGN(tx.amount || 0)} · ${tx.status}`
        )
        .join('\n')
    : 'No transactions recorded.';

  const content = `BadePay Statement\nAccount: ${userName}\nGenerated: ${new Date().toLocaleString()}\n\n${lines}`;
  const blob = new Blob([content], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'badepay-statement.txt';
  link.click();
  URL.revokeObjectURL(url);
}
