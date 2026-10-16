

import React from 'react';
import { Link } from 'wouter';

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


export default function SupportPage() {
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

      {/* Problems with a payment are reported from the payment itself (so we know which one). */}
      <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="font-medium text-[var(--text-primary)]">Problem with a payment?</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Open the payment in Activity and choose “Report an issue”. You can follow the conversation with our support team in My disputes.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/activity" className="rounded-xl bg-[#6fe8d6] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]">Go to Activity</Link>
          <Link href="/profile/disputes" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]">My disputes</Link>
        </div>
      </div>
    </div>
  );
}
