'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import adminApiClient from '@/lib/adminApiClient';
import { formatCurrency } from '@/utils/formatCurrency';

type BillTransaction = {
  id: string;
  reference: string;
  amount: number;
  type: string;
  category: string;
  status: string;
  createdAt: string;
  senderId?: string;
  sender?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: {
    provider?: string;
    accountRef?: string;
    token?: string;
  };
};

export default function AdminBillsPage() {
  const [bills, setBills] = useState<BillTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getTransactions(1, 1000);
      const allTransactions = response.data?.transactions || [];
      // Filter to show only bill payments
      setBills(allTransactions.filter((tx: any) => tx.type === 'bill_payment'));
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-emerald-500 bg-emerald-500/10';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'failed':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const totalSpent = bills
    .filter(b => b.status === 'success')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bill Payments</h1>
        <p className="text-gray-400">Manage and view all bill payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Bills</h3>
          <p className="text-3xl font-bold text-white">{bills.length}</p>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Spent</h3>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Success Rate</h3>
          <p className="text-3xl font-bold text-white">
            {bills.length > 0 
              ? Math.round((bills.filter(b => b.status === 'success').length / bills.length) * 100) 
              : 0}%
          </p>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bill Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-white font-medium">
                        {bill.sender?.firstName} {bill.sender?.lastName}
                      </p>
                      <p className="text-gray-400 text-sm">{bill.sender?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300 capitalize">{bill.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-400">{bill.metadata?.provider || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-red-400 font-medium">-{formatCurrency(bill.amount)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bills.length === 0 && (
            <div className="text-center py-12 text-gray-400">No bill payments found</div>
          )}
        </div>
      </div>
    </div>
  );
}
