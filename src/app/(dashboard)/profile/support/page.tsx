

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { fileDispute } from '@/services/platformDataService';
import toast from 'react-hot-toast';

const FAQ = [
  {
    q: 'How do I add money to my wallet?',
    a: 'Go to Home → Add money, or open Send money and choose the Add money tab.',
  },
  {
    q: 'How do I upgrade my KYC tier?',
    a: 'Open Profile → KYC verification and submit your BVN and NIN.',
  },
  {
    q: 'I forgot my transaction PIN',
    a: 'Go to Profile → Security center → Transaction PIN to set a new one.',
  },
];

const ISSUE_TYPES = [
  { id: 'failed_but_debited', label: 'Failed but wallet was debited' },
  { id: 'double_charge', label: 'Double charge' },
  { id: 'unauthorized_transaction', label: 'Unauthorized transaction' },
  { id: 'wrong_recipient', label: 'Wrong recipient' },
  { id: 'other', label: 'Other issue' },
] as const;

export default function SupportPage() {
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [issueType, setIssueType] = useState<(typeof ISSUE_TYPES)[number]['id']>('other');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    const parsedAmount = parseFloat(amount) || 0;
    fileDispute({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      amount: parsedAmount,
      issueType,
      description: `${subject.trim()}: ${message.trim()}`,
    });

    toast.success('Dispute filed — our team will review within 24 hours');
    setSubject('');
    setMessage('');
    setAmount('');
    setIssueType('other');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <summary className="cursor-pointer font-medium text-[var(--text-primary)]">{item.q}</summary>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.a}</p>
          </details>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="font-medium text-[var(--text-primary)]">File a dispute</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Disputes appear in the admin portal for review by our support team.
        </p>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value as (typeof ISSUE_TYPES)[number]['id'])}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
        >
          {ISSUE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Disputed amount (optional)"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue…"
          rows={4}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
        />
        <button type="submit" className="w-full rounded-xl bg-[#6fe8d6] py-3 text-sm font-semibold text-[#1a1a1a]">
          Submit dispute
        </button>
      </form>
    </div>
  );
}
