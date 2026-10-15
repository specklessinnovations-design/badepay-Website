import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Save, Undo2 } from 'lucide-react';
import { PageHeader, Card, Field, TextInput, TextArea, Select, Toggle, Button, Spinner, ErrorState, Badge } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatMoney } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';

interface Limits { perTransaction: number; daily: number; monthly: number }
interface PlatformSettings {
  maintenanceMode: boolean; maintenanceMessage: string;
  limits: Record<'0' | '1' | '2' | '3', Limits>;
  fraud: { maxPaymentsPerHour: number; newDeviceHoldAbove: number; newRecipientHoldAbove: number };
  settlement: { hourLagos: number; fee: number; newAccountHoldHours: number; cardOrderCommissionPercent: number; splitFeeBearer: 'SUB_ACCOUNT' | 'PARENT_ACCOUNT' | 'PROPORTIONATE' };
  pilot: { enabled: boolean; message: string; caps: Limits };
  approvals: { superadminAbove: number };
  supportEmail: string; supportPhone: string;
}

const TIER_LABEL = { '0': 'Level 0 — unverified', '1': 'Level 1 — BVN', '2': 'Level 2 — NIN + selfie', '3': 'Level 3 — admin approved' } as const;

/** Flattened "path → value" pairs for a readable diff. */
function flatten(obj: unknown, prefix = ''): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') return { [prefix]: obj };
  return Object.entries(obj as Record<string, unknown>).reduce((acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }), {});
}

function NumberField({ label, value, onChange, disabled, hint, money }: { label: string; value: number; onChange: (v: number) => void; disabled: boolean; hint?: string; money?: boolean }) {
  return (
    <Field label={label} hint={hint ?? (money ? formatMoney(value) : undefined)}>
      {(id) => <TextInput id={id} type="number" min={0} step={money ? '1' : 'any'} value={Number.isFinite(value) ? value : ''} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />}
    </Field>
  );
}

export default function SettingsPage() {
  const canManage = useCan('settings.manage');
  const { data, isLoading, error, refetch } = useAdminQuery<PlatformSettings>('/admin/settings');
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);

  const changes = useMemo(() => {
    if (!data || !draft) return [];
    const before = flatten(data);
    const after = flatten(draft);
    return Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map((k) => ({ key: k, before: before[k], after: after[k] }));
  }, [data, draft]);

  if (isLoading || (!draft && !error)) return <Spinner />;
  if (error || !draft) return <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>;
  const ro = !canManage;
  const set = (fn: (d: PlatformSettings) => void) => setDraft((d) => { const next = structuredClone(d!); fn(next); return next; });

  const limitErrors = (l: Limits) => (l.perTransaction > l.daily || l.daily > l.monthly ? 'Per payment ≤ daily ≤ monthly' : null);
  const invalid = Object.values(draft.limits).some(limitErrors) || !!limitErrors(draft.pilot.caps);

  const save = async () => {
    const ok = await confirm({
      title: 'Save these settings?', tone: 'danger', confirmLabel: 'Save settings', stepUp: true,
      description: (
        <div>
          <p className="mb-2">They apply to every customer within about 30 seconds. The audit log records each change with its old value.</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-(--ad-bg-elev) p-2 font-mono text-[11px]">
            {changes.map((c) => <li key={c.key}>{c.key}: {String(c.before)} → <b>{String(c.after)}</b></li>)}
          </ul>
        </div>
      ),
    });
    if (!ok) return;
    // Send only the sections that changed.
    const sections = [...new Set(changes.map((c) => c.key.split('.')[0]))];
    const patch = Object.fromEntries(sections.map((s) => [s, draft[s as keyof PlatformSettings]]));
    await run('save', () => adminApiClient.put('/admin/settings', patch, { otp: ok.otp }), 'Settings saved');
  };

  return (
    <div className="pb-20">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description={<>Platform controls enforced by the API. {ro && <Badge tone="warning">Read-only for your role</Badge>} Change history is in the <Link href={adminPath('/audit-log?targetType=settings')} className="text-[#0f766e] hover:underline">audit log</Link>.</>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Maintenance mode" description="Pauses every money-moving request. Customers see the message; reads keep working.">
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{draft.maintenanceMode ? <Badge tone="danger">ON — payments paused</Badge> : 'Off'}</span>
              <Toggle label="Maintenance mode" checked={draft.maintenanceMode} disabled={ro} onChange={(v) => set((d) => { d.maintenanceMode = v; })} />
            </label>
            <Field label="Message shown to customers">{(id) => <TextArea id={id} rows={2} maxLength={300} disabled={ro} value={draft.maintenanceMessage} onChange={(e) => set((d) => { d.maintenanceMessage = e.target.value; })} />}</Field>
          </div>
        </Card>

        <Card title="Approvals (maker-checker)" description="Refunds and stuck-payment outcomes always need a second admin.">
          <NumberField money label="Only a super administrator may approve from (₦)" value={draft.approvals.superadminAbove} disabled={ro} onChange={(v) => set((d) => { d.approvals.superadminAbove = v; })} />
        </Card>

        <Card title="Outgoing limits by KYC level" description="Per customer, on personal wallets. Days and months start at Lagos midnight." className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-xs text-(--ad-muted)"><th className="py-1.5 pr-3">Level</th><th className="px-2">Per payment (₦)</th><th className="px-2">Daily (₦)</th><th className="px-2">Monthly (₦)</th><th /></tr></thead>
              <tbody>
                {(Object.keys(TIER_LABEL) as (keyof typeof TIER_LABEL)[]).map((lvl) => (
                  <tr key={lvl} className="border-t border-(--ad-border)">
                    <td className="py-2 pr-3 text-xs font-semibold">{TIER_LABEL[lvl]}</td>
                    {(['perTransaction', 'daily', 'monthly'] as const).map((k) => (
                      <td key={k} className="px-2 py-2">
                        <TextInput type="number" min={0} aria-label={`${TIER_LABEL[lvl]} ${k}`} disabled={ro} value={draft.limits[lvl][k]} onChange={(e) => set((d) => { d.limits[lvl][k] = Number(e.target.value); })} />
                      </td>
                    ))}
                    <td className="px-2 text-xs text-[#b91c1c]">{limitErrors(draft.limits[lvl])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Fraud rules" description="Payments that trip a rule are held for review on the Fraud holds page.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField label="Max payments per hour" value={draft.fraud.maxPaymentsPerHour} disabled={ro} onChange={(v) => set((d) => { d.fraud.maxPaymentsPerHour = v; })} hint="More than this is held" />
            <NumberField money label="New-device hold from (₦)" value={draft.fraud.newDeviceHoldAbove} disabled={ro} onChange={(v) => set((d) => { d.fraud.newDeviceHoldAbove = v; })} />
            <NumberField money label="New-recipient hold from (₦)" value={draft.fraud.newRecipientHoldAbove} disabled={ro} onChange={(v) => set((d) => { d.fraud.newRecipientHoldAbove = v; })} />
          </div>
        </Card>

        <Card title="Merchant settlement">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NumberField label="Payout hour (Lagos, 0–23)" value={draft.settlement.hourLagos} disabled={ro} onChange={(v) => set((d) => { d.settlement.hourLagos = v; })} hint="When daily/weekly/monthly payouts run" />
            <NumberField money label="Fee per payout (₦)" value={draft.settlement.fee} disabled={ro} onChange={(v) => set((d) => { d.settlement.fee = v; })} />
            <NumberField label="Hold after bank change (hours)" value={draft.settlement.newAccountHoldHours} disabled={ro} onChange={(v) => set((d) => { d.settlement.newAccountHoldHours = v; })} hint="0–168" />
            <NumberField label="Card order commission (%)" value={draft.settlement.cardOrderCommissionPercent} disabled={ro} onChange={(v) => set((d) => { d.settlement.cardOrderCommissionPercent = v; })} hint="0–50" />
            <Field label="Who pays SeerBit’s fee on split payments">
              {(id) => <Select id={id} disabled={ro} value={draft.settlement.splitFeeBearer} onChange={(e) => set((d) => { d.settlement.splitFeeBearer = e.target.value as PlatformSettings['settlement']['splitFeeBearer']; })}
                options={[{ value: 'SUB_ACCOUNT', label: 'Merchant (sub-account)' }, { value: 'PARENT_ACCOUNT', label: 'BadePay' }, { value: 'PROPORTIONATE', label: 'Shared proportionately' }]} />}
            </Field>
          </div>
        </Card>

        <Card title="Private pilot" description="Invite-only sign-up and capped limits. Invites are managed on the Pilot invites page.">
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{draft.pilot.enabled ? <Badge tone="warning">Pilot ON — invite only</Badge> : 'Open sign-up'}</span>
              <Toggle label="Pilot mode" checked={draft.pilot.enabled} disabled={ro} onChange={(v) => set((d) => { d.pilot.enabled = v; })} />
            </label>
            <Field label="Message for people without an invite">{(id) => <TextArea id={id} rows={2} maxLength={300} disabled={ro} value={draft.pilot.message} onChange={(e) => set((d) => { d.pilot.message = e.target.value; })} />}</Field>
            <div className="grid grid-cols-3 gap-2">
              {(['perTransaction', 'daily', 'monthly'] as const).map((k) => (
                <NumberField key={k} money label={`Cap: ${k === 'perTransaction' ? 'per payment' : k}`} value={draft.pilot.caps[k]} disabled={ro} onChange={(v) => set((d) => { d.pilot.caps[k] = v; })} />
              ))}
            </div>
            {limitErrors(draft.pilot.caps) && <p className="text-xs text-[#b91c1c]">{limitErrors(draft.pilot.caps)}</p>}
          </div>
        </Card>

        <Card title="Support contacts" description="Shown to customers in the apps and emails.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Support email">{(id) => <TextInput id={id} type="email" disabled={ro} value={draft.supportEmail} onChange={(e) => set((d) => { d.supportEmail = e.target.value; })} />}</Field>
            <Field label="Support phone">{(id) => <TextInput id={id} disabled={ro} maxLength={20} value={draft.supportPhone} onChange={(e) => set((d) => { d.supportPhone = e.target.value; })} />}</Field>
          </div>
        </Card>
      </div>

      {canManage && changes.length > 0 && (
        <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-(--ad-border-strong) bg-(--ad-card) px-4 py-3 shadow-lg">
          <p className="text-sm"><b>{changes.length}</b> unsaved change{changes.length === 1 ? '' : 's'}{invalid && <span className="ml-2 text-[#b91c1c]">Fix the limits first</span>}</p>
          <div className="flex gap-2">
            <Button icon={<Undo2 size={14} />} onClick={() => setDraft(structuredClone(data!))}>Discard</Button>
            <Button variant="primary" icon={<Save size={14} />} disabled={invalid} loading={pending === 'save'} onClick={save}>Save changes</Button>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
