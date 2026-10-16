import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { disputesApi, ISSUE_TYPES } from './shared';

/** Report a problem with one payment (opened from the transaction's "Report an issue"). */
export default function NewDisputePage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get('tx') ?? '';
  const [issueType, setIssueType] = useState<string>('');
  const [amount, setAmount] = useState(params.get('amount') ?? '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!transactionId) {
    return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Open the payment in Activity and choose “Report an issue”.</p>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType) return setError('Choose what went wrong');
    if (description.trim().length < 10) return setError('Tell us a little more (at least 10 characters)');
    setError('');
    setSaving(true);
    try {
      const d = await disputesApi.create({ transactionId, amount: Number(amount) || 0, issueType, description: description.trim() });
      navigate(`/profile/disputes/${d.id}`, { replace: true });
    } catch (err) {
      setError((err as Error)?.message || 'Could not send your report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const box = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>What went wrong?</legend>
        <div className="space-y-2">
          {ISSUE_TYPES.map((t) => (
            <label key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm" style={{ ...box, borderColor: issueType === t.id ? '#6fe8d6' : 'var(--border)' }}>
              <input type="radio" name="issue" value={t.id} checked={issueType === t.id} onChange={() => setIssueType(t.id)} className="accent-[#6fe8d6]" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Amount in question (₦)</span>
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={box} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Tell us what happened</span>
        <textarea rows={4} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none" style={box} />
      </label>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      <button type="submit" disabled={saving} className="h-11 w-full rounded-xl text-sm font-black disabled:opacity-60" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
        {saving ? 'Sending…' : 'Send report'}
      </button>
    </form>
  );
}
