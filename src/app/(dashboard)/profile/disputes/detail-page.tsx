import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Send } from 'lucide-react';
import { bpToast } from '@/lib/bpToast';
import { disputesApi, Dispute, DisputeMessage, FINAL, issueLabel, naira, statusStyle } from './shared';

/** One dispute: status, the conversation with support (customer and BadePay messages), reply, cancel. */
export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [dispute, msgs] = await Promise.all([disputesApi.get(id), disputesApi.messages(id).catch(() => [])]);
      setD(dispute);
      setMessages(msgs);
    } catch (e) {
      setError((e as Error)?.message || 'Could not load this dispute');
    }
  };
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await disputesApi.reply(id, reply.trim());
      setReply('');
      await load();
    } catch (e) {
      bpToast.error((e as Error)?.message || 'Could not send');
    } finally {
      setBusy(false);
    }
  };
  const cancel = async () => {
    if (!window.confirm('Cancel this dispute? You can report the payment again later.')) return;
    setBusy(true);
    try { await disputesApi.cancel(id); await load(); } catch (e) { bpToast.error((e as Error)?.message || 'Could not cancel'); } finally { setBusy(false); }
  };

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!d) return <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>;
  const closed = FINAL.includes(d.status);
  const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <Link href="/profile/disputes" className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>← My disputes</Link>
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.ticketNumber}</span>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize" style={statusStyle(d.status)}>{d.status.replace('_', ' ')}</span>
        </div>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-primary)' }}>{issueLabel(d.issueType)} · {naira(d.amount)}</p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Reported {when(d.createdAt)}</p>
        {d.resolutionNote && (
          <p className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
            <b>BadePay:</b> {d.resolutionNote}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Conversation</p>
        <ul className="space-y-2.5">
          <li className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm" style={{ background: 'rgba(111,232,214,0.12)', color: 'var(--text-primary)' }}>
              {d.description}<p className="mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>You · {when(d.createdAt)}</p>
            </div>
          </li>
          {messages.map((m) => (
            <li key={m.id} className={`flex ${m.authorType === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
                style={{ background: m.authorType === 'customer' ? 'rgba(111,232,214,0.12)' : 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
                {m.body}
                <p className="mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{m.authorType === 'customer' ? 'You' : 'BadePay support'} · {when(m.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
        {!closed ? (
          <div className="mt-4 flex gap-2">
            <textarea rows={2} maxLength={5000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a message for support"
              aria-label="Message to support" className="min-w-0 flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            <button type="button" onClick={send} disabled={busy || !reply.trim()} aria-label="Send"
              className="flex w-11 items-center justify-center rounded-xl disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              <Send size={16} />
            </button>
          </div>
        ) : <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>This dispute is {d.status}. Report the payment again from Activity if you still need help.</p>}
      </div>

      {['open', 'under_review'].includes(d.status) && (
        <button type="button" onClick={cancel} disabled={busy} className="w-full rounded-xl py-2.5 text-xs font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Cancel this dispute
        </button>
      )}
    </div>
  );
}
