import React, { useState } from 'react';
import { Link } from 'wouter';
import { Plus } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, Badge, Button, Drawer, Field, TextArea, TextInput, Toggle, EmptyState } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime } from '@/lib/adminFormat';

interface Invite { id: string; email: string; allowMerchant: boolean; note: string | null; invitedBy: string; createdAt: string; usedAt: string | null; usedByUserId: string | null; revokedAt: string | null }

export default function PilotPage() {
  const [f, setF] = useUrlState({ status: 'open' });
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ invites: Invite[]; totals: { open: number; used: number; revoked: number } }>('/admin/pilot/invites', { status: f.status === 'all' ? '' : f.status });
  const [adding, setAdding] = useState(false);
  const [emails, setEmails] = useState('');
  const [allowMerchant, setAllowMerchant] = useState(false);
  const [note, setNote] = useState('');
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const list = emails.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
  const bad = list.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const add = async () => {
    const done = await run('add', () => adminApiClient.post('/admin/pilot/invites', { emails: list, allowMerchant, note: note || undefined }), `${list.length} invite(s) added`);
    if (done) { setEmails(''); setNote(''); setAllowMerchant(false); setAdding(false); }
  };
  const revoke = async (i: Invite) => {
    const ok = await confirm({ title: 'Revoke invite?', tone: 'danger', confirmLabel: 'Revoke', description: <>{i.email} won’t be able to sign up while the pilot is on.</> });
    if (ok) await run(`revoke-${i.id}`, () => adminApiClient.delete(`/admin/pilot/invites/${i.id}`), 'Invite revoked');
  };
  const status = (i: Invite) => (i.revokedAt ? 'revoked' : i.usedAt ? 'used' : 'open');

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Pilot invites"
        description={<>While pilot mode is on (<Link href={adminPath('/settings')} className="text-[#0f766e] hover:underline">Settings</Link>), only invited emails can create an account.</>}
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setAdding(true)}>Invite people</Button>}
      />
      <FilterPanel
        onClearAll={() => setF({ status: 'open' })}
        active={f.status !== 'open' ? [{ key: 'status', label: `Status: ${f.status === 'all' ? 'All' : f.status}`, onRemove: () => setF({ status: 'open' }) }] : []}
      >
        <FilterGroup label="Invite status">
          <FilterSelect label="Invite status" defaultValue="open" value={f.status} onChange={(v) => setF({ status: v })} options={[
            { value: 'open', label: 'Open', count: data?.totals.open }, { value: 'used', label: 'Used', count: data?.totals.used },
            { value: 'revoked', label: 'Revoked', count: data?.totals.revoked }, { value: 'all', label: 'All invites' },
          ]} />
        </FilterGroup>
      </FilterPanel>
      <DataTable
        rows={data?.invites}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(i) => i.id}
        empty={<EmptyState title="No invites" />}
        columns={[
          { key: 'email', header: 'Email', cell: (i) => <span>{i.email}{i.allowMerchant && <Badge tone="accent" className="ml-1.5">Business allowed</Badge>}</span> },
          { key: 'status', header: 'Status', cell: (i) => <StatusBadge status={status(i)} /> },
          { key: 'note', header: 'Note', cell: (i) => <span className="text-xs">{i.note ?? '—'}</span> },
          { key: 'when', header: 'Invited / used', cell: (i) => <span className="text-xs text-(--ad-muted)">{formatDateTime(i.createdAt)}{i.usedAt && <><br />used {formatDateTime(i.usedAt)}</>}</span> },
          {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (i) => (
              <span className="flex justify-end gap-1.5">
                {i.usedByUserId && <Link href={adminPath(`/users/${i.usedByUserId}`)}><Button size="sm" variant="ghost">Customer</Button></Link>}
                {status(i) === 'open' && <Button size="sm" variant="danger" loading={pending === `revoke-${i.id}`} onClick={() => revoke(i)}>Revoke</Button>}
              </span>
            ),
          },
        ]}
      />
      <Drawer open={adding} onClose={() => setAdding(false)} title="Invite people"
        footer={<><Button onClick={() => setAdding(false)}>Cancel</Button><Button variant="primary" disabled={!list.length || bad.length > 0 || list.length > 500} loading={pending === 'add'} onClick={add}>Invite {list.length || ''}</Button></>}>
        <div className="space-y-4">
          <Field label="Emails" required hint="One per line or separated by commas (up to 500)." error={bad.length ? `Not valid: ${bad.slice(0, 3).join(', ')}` : null}>
            {(id) => <TextArea id={id} rows={8} value={emails} onChange={(e) => setEmails(e.target.value)} />}
          </Field>
          <label className="flex items-center gap-2 text-sm"><Toggle label="Allow business accounts" checked={allowMerchant} onChange={setAllowMerchant} /> Allow business (merchant) accounts</label>
          <Field label="Note">{(id) => <TextInput id={id} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        </div>
      </Drawer>
      {dialog}
    </div>
  );
}
