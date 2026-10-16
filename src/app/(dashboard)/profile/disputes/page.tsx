import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Flag, ChevronRight } from 'lucide-react';
import { disputesApi, Dispute, issueLabel, naira, statusStyle } from './shared';

/** My disputes: every problem I've reported and where it stands (mobile app: Disputes). */
export default function DisputesPage() {
  const [items, setItems] = useState<Dispute[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { disputesApi.list().then(setItems).catch((e) => setError(e?.message || 'Could not load your disputes')); }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        To report a problem, open the payment in <Link href="/activity" className="font-semibold" style={{ color: '#6fe8d6' }}>Activity</Link> and choose “Report an issue”.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!items && !error && <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>}
      {items && items.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Flag size={28} className="mx-auto" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-3 font-semibold" style={{ color: 'var(--text-primary)' }}>No disputes</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Problems you report will be tracked here.</p>
        </div>
      )}
      <ul className="space-y-3">
        {items?.map((d) => (
          <li key={d.id}>
            <Link href={`/profile/disputes/${d.id}`} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.ticketNumber}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize" style={statusStyle(d.status)}>{d.status.replace('_', ' ')}</span>
                </div>
                <p className="mt-1 truncate text-sm" style={{ color: 'var(--text-primary)' }}>{issueLabel(d.issueType)}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{naira(d.amount)} · {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
