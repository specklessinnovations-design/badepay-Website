import React from 'react';
import { Card, StatusBadge, Badge, EmptyState, ErrorState, Spinner, KeyValue } from './ui';
import { formatDateTime } from '@/lib/adminFormat';

/** A Prembly identity check as stored by BadePay (no raw BVN/NIN, no photos). */
export interface KycSubmission {
  id: string;
  type: string;
  status: string;
  level: number;
  identityLast4: string;
  provider: string;
  nameMatch: boolean | null;
  dobMatch: boolean | null;
  faceConfidence: number | null;
  livenessConfidence: number | null;
  pepStatus: string | null;
  reasons: string[];
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

const yesNo = (v: boolean | null) => (v === null ? <Badge>Not checked</Badge> : v ? <Badge tone="success">Match</Badge> : <Badge tone="danger">No match</Badge>);
const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);

export function KycCheckDetails({ s }: { s: KycSubmission }) {
  return (
    <KeyValue columns={3} items={[
      { label: 'Check', value: `${s.type.toUpperCase()} ••••${s.identityLast4}` },
      { label: 'Provider', value: s.provider === 'prembly' ? 'Prembly' : s.provider },
      { label: 'Level on approval', value: `Level ${s.level}` },
      { label: 'Name', value: yesNo(s.nameMatch) },
      { label: 'Date of birth', value: yesNo(s.dobMatch) },
      { label: 'PEP / sanctions', value: s.pepStatus ? <StatusBadge status={s.pepStatus} /> : <Badge>Not screened</Badge> },
      { label: 'Face match', value: pct(s.faceConfidence), hidden: s.faceConfidence === null },
      { label: 'Liveness', value: pct(s.livenessConfidence), hidden: s.livenessConfidence === null },
      { label: 'Checked', value: formatDateTime(s.createdAt) },
    ]} />
  );
}

export function KycChecks({ items, loading, error, onRetry }: { items?: KycSubmission[]; loading?: boolean; error?: unknown; onRetry?: () => void }) {
  if (loading) return <Spinner />;
  if (error) return <Card><ErrorState error={error} onRetry={onRetry} /></Card>;
  if (!items?.length) return <Card><EmptyState title="No identity checks yet" description="Checks appear here once the customer verifies their BVN or NIN in the app." /></Card>;
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <Card key={s.id} title={<span className="flex items-center gap-2">{s.type.toUpperCase()} check <StatusBadge status={s.status} label={s.status === 'review' ? 'Needs review' : undefined} /></span>}>
          <KycCheckDetails s={s} />
          {s.reasons.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-(--ad-muted)">Why it wasn’t approved automatically</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-(--ad-fg)">{s.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
          {s.reviewedAt && (
            <p className="mt-3 text-xs text-(--ad-muted)">Reviewed by {s.reviewedBy} · {formatDateTime(s.reviewedAt)}{s.reviewNote ? ` — “${s.reviewNote}”` : ''}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
