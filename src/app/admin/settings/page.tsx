import React, { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  Gauge, Landmark, LayoutGrid, LifeBuoy, Pencil, Plus, Save, ShieldAlert, Trash2, Undo2, UserCheck, Wrench, FlaskConical, type LucideIcon,
} from 'lucide-react';
import { PageHeader, TextInput, TextArea, Select, Toggle, Button, Spinner, ErrorState, Badge, Card, Drawer, Field } from '@/components/admin/ui';
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
  /** White-label apps on this backend, each with its own switches */
  apps: AppProfile[];
  /** Switches for apps not in the list */
  defaultFeatures: Features;
}

type AppFeature = 'specialOffers' | 'newsFeed' | 'aiAssistant' | 'weather' | 'betting';
type Features = Record<AppFeature, boolean>;
interface AppProfile { id: string; name: string; about: string; features: Features }

const FEATURES: { key: AppFeature; label: string; short: string; hint: string }[] = [
  { key: 'specialOffers', label: 'Special offers', short: 'Offers', hint: 'Home-screen banners, managed in Content → Special offers.' },
  { key: 'newsFeed', label: 'Explore & news feed', short: 'News', hint: 'News stories on the home screen.' },
  { key: 'aiAssistant', label: 'AI assistant', short: 'AI', hint: 'The sparkle button at the top right of the home screen.' },
  { key: 'weather', label: 'Weather', short: 'Weather', hint: 'Forecast card and Weather service.' },
  { key: 'betting', label: 'Betting top-ups', short: 'Betting', hint: 'Fund Bet9ja, SportyBet and other wallets via Nomba. Keep off for church and faith-based apps.' },
];
const featureLabel = (k: string) => FEATURES.find((f) => f.key === k)?.label ?? k;

/** What a white-label build sends in its X-App header. */
const APP_ID = /^[a-z0-9][a-z0-9-]{1,31}$/;
const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);

interface Change { top: keyof PlatformSettings; key: string; label: string; before?: unknown; after?: unknown }

/** Readable changes to the app list, matched by app ID (not position). */
function appChanges(before: PlatformSettings, after: PlatformSettings): Change[] {
  const out: Change[] = [];
  for (const k of Object.keys(after.defaultFeatures) as AppFeature[]) {
    if (before.defaultFeatures[k] !== after.defaultFeatures[k]) {
      out.push({ top: 'defaultFeatures', key: `default.${k}`, label: `Default apps · ${featureLabel(k)}`, before: before.defaultFeatures[k] ? 'on' : 'off', after: after.defaultFeatures[k] ? 'on' : 'off' });
    }
  }
  const old = new Map(before.apps.map((a) => [a.id, a]));
  for (const a of after.apps) {
    const b = old.get(a.id);
    if (!b) { out.push({ top: 'apps', key: `add.${a.id}`, label: `Add app ${a.name} (${a.id})` }); continue; }
    if (b.name !== a.name) out.push({ top: 'apps', key: `name.${a.id}`, label: `${a.id} · name`, before: b.name, after: a.name });
    if (b.about !== a.about) out.push({ top: 'apps', key: `about.${a.id}`, label: `${a.name} · description`, before: b.about || '—', after: a.about || '—' });
    for (const k of Object.keys(a.features) as AppFeature[]) {
      if (b.features[k] !== a.features[k]) out.push({ top: 'apps', key: `f.${a.id}.${k}`, label: `${a.name} · ${featureLabel(k)}`, before: b.features[k] ? 'on' : 'off', after: a.features[k] ? 'on' : 'off' });
    }
  }
  for (const b of before.apps) if (!after.apps.some((a) => a.id === b.id)) out.push({ top: 'apps', key: `del.${b.id}`, label: `Remove app ${b.name} (${b.id})` });
  return out;
}

const TIERS = [
  { id: '0', label: 'Level 0', hint: 'Unverified' },
  { id: '1', label: 'Level 1', hint: 'BVN verified' },
  { id: '2', label: 'Level 2', hint: 'NIN + selfie' },
  { id: '3', label: 'Level 3', hint: 'Admin approved' },
] as const;
const LIMIT_COLUMNS = [{ key: 'perTransaction', label: 'Per payment' }, { key: 'daily', label: 'Daily' }, { key: 'monthly', label: 'Monthly' }] as const;

type SectionId = 'general' | 'maintenance' | 'pilot' | 'apps' | 'limits' | 'fraud' | 'approvals' | 'settlement';
const NAV: { group: string; items: { id: SectionId; label: string; icon: LucideIcon }[] }[] = [
  { group: 'Platform', items: [
    { id: 'general', label: 'Support contacts', icon: LifeBuoy },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'pilot', label: 'Private pilot', icon: FlaskConical },
  ] },
  { group: 'White label', items: [{ id: 'apps', label: 'Apps & features', icon: LayoutGrid }] },
  { group: 'Risk & compliance', items: [
    { id: 'limits', label: 'Transaction limits', icon: Gauge },
    { id: 'fraud', label: 'Fraud rules', icon: ShieldAlert },
    { id: 'approvals', label: 'Approvals', icon: UserCheck },
  ] },
  { group: 'Merchants', items: [{ id: 'settlement', label: 'Settlement', icon: Landmark }] },
];
const SECTION_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

/** Which section each top-level setting belongs to (for the unsaved-change markers). */
const SECTION_OF: Record<keyof PlatformSettings, SectionId> = {
  supportEmail: 'general', supportPhone: 'general',
  maintenanceMode: 'maintenance', maintenanceMessage: 'maintenance',
  pilot: 'pilot', apps: 'apps', defaultFeatures: 'apps', limits: 'limits', fraud: 'fraud', approvals: 'approvals', settlement: 'settlement',
};

/** Flattened "path → value" pairs for a readable diff. */
function flatten(obj: unknown, prefix = ''): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') return { [prefix]: obj };
  return Object.entries(obj as Record<string, unknown>).reduce((acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }), {});
}

/** Plain-English names for the save confirmation (e.g. "limits.0.daily" → "Level 0 · Daily limit"). */
const SETTING_LABELS: Record<string, string> = {
  maintenanceMode: 'Maintenance mode', maintenanceMessage: 'Maintenance message', supportEmail: 'Support email', supportPhone: 'Support phone',
  'fraud.maxPaymentsPerHour': 'Fraud · Payments per hour', 'fraud.newDeviceHoldAbove': 'Fraud · New device hold from', 'fraud.newRecipientHoldAbove': 'Fraud · New recipient hold from',
  'settlement.hourLagos': 'Settlement · Payout hour', 'settlement.fee': 'Settlement · Fee per payout', 'settlement.newAccountHoldHours': 'Settlement · Hold after bank change',
  'settlement.cardOrderCommissionPercent': 'Settlement · Card order commission', 'settlement.splitFeeBearer': 'Settlement · Split payment fee',
  'pilot.enabled': 'Pilot mode', 'pilot.message': 'Pilot message', 'approvals.superadminAbove': 'Approvals · Super administrator threshold',
};
const LIMIT_NAMES: Record<string, string> = { perTransaction: 'Per payment', daily: 'Daily', monthly: 'Monthly' };
function settingLabel(key: string): string {
  const [top, a, b] = key.split('.');
  if (top === 'limits' && a && b) return `Level ${a} · ${LIMIT_NAMES[b] ?? b} limit`;
  if (top === 'pilot' && a === 'caps' && b) return `Pilot · ${LIMIT_NAMES[b] ?? b} cap`;
  return SETTING_LABELS[key] ?? key;
}
const showValue = (v: unknown) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : typeof v === 'string' && v.length > 40 ? `${v.slice(0, 40)}…` : String(v));

const limitError = (l: Limits) => (l.perTransaction > l.daily || l.daily > l.monthly ? 'Per payment must not exceed daily, and daily must not exceed monthly.' : null);

function readSection(): SectionId {
  const s = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
  return (SECTION_IDS as string[]).includes(s) ? (s as SectionId) : 'general';
}

/* ---------- Building blocks ---------- */

/** One setting: label and explanation on the left, the control on the right. */
function Row({ label, description, children, htmlFor }: { label: React.ReactNode; description?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--ad-fg-strong)]">{label}</label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-[var(--ad-muted)]">{description}</p>}
      </div>
      <div className="min-w-0 md:max-w-md">{children}</div>
    </div>
  );
}

function Section({ title, description, children, footer, actions }: { title: string; description: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="ad-card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--ad-border)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--ad-fg-strong)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">{description}</p>
        </div>
        {actions}
      </header>
      <div className="divide-y divide-[var(--ad-border)]">{children}</div>
      {footer && <footer className="border-t border-[var(--ad-border)] bg-[var(--ad-bg-elev)] px-5 py-3 text-xs text-[var(--ad-muted)]">{footer}</footer>}
    </section>
  );
}

/** Number input with a fixed prefix (₦) or suffix (%, hours). */
function NumberInput({ value, onChange, disabled, prefix, suffix, id, label, min = 0, max, showMoney }: {
  value: number; onChange: (v: number) => void; disabled: boolean; prefix?: string; suffix?: string; id?: string; label?: string; min?: number; max?: number; showMoney?: boolean;
}) {
  return (
    <div>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[var(--ad-muted)]">{prefix}</span>}
        <TextInput
          id={id} aria-label={label} type="number" min={min} max={max} disabled={disabled}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`tabular-nums ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-16' : ''}`}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[var(--ad-muted)]">{suffix}</span>}
      </div>
      {showMoney && <p className="mt-1 text-xs text-[var(--ad-muted)]">{formatMoney(value)}</p>}
    </div>
  );
}

function StatusLine({ on, onText, offText, tone }: { on: boolean; onText: string; offText: string; tone: 'danger' | 'warning' }) {
  return on ? <Badge tone={tone}>{onText}</Badge> : <span className="text-sm text-[var(--ad-muted)]">{offText}</span>;
}

/* ---------- Page ---------- */

export default function SettingsPage() {
  const canManage = useCan('settings.manage');
  const { data, isLoading, error, refetch } = useAdminQuery<PlatformSettings>('/admin/settings');
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [section, setSectionState] = useState<SectionId>(readSection);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const uid = useId();
  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);

  const setSection = (s: SectionId) => {
    setSectionState(s);
    window.history.replaceState(window.history.state, '', `#${s}`);
  };

  const [editingApp, setEditingApp] = useState<{ index: number | null } | null>(null);

  const changes = useMemo<Change[]>(() => {
    if (!data || !draft) return [];
    const strip = ({ apps: _a, defaultFeatures: _d, ...rest }: PlatformSettings) => rest;
    const before = flatten(strip(data));
    const after = flatten(strip(draft));
    const plain = Object.keys(after)
      .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map((k) => ({ top: k.split('.')[0] as keyof PlatformSettings, key: k, label: settingLabel(k), before: showValue(before[k]), after: showValue(after[k]) }));
    return [...plain, ...appChanges(data, draft)];
  }, [data, draft]);

  const changedIn = useMemo(() => {
    const counts: Partial<Record<SectionId, number>> = {};
    for (const c of changes) {
      const s = SECTION_OF[c.top];
      if (s) counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [changes]);

  if (isLoading || (!draft && !error)) return <Spinner />;
  if (error || !draft) return <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>;
  const ro = !canManage;
  const set = (fn: (d: PlatformSettings) => void) => setDraft((d) => { const next = structuredClone(d!); fn(next); return next; });

  const invalidIn: Partial<Record<SectionId, boolean>> = {
    limits: Object.values(draft.limits).some((l) => !!limitError(l)),
    pilot: !!limitError(draft.pilot.caps),
    apps: draft.apps.some((a) => !APP_ID.test(a.id) || a.name.trim().length < 2) || new Set(draft.apps.map((a) => a.id)).size !== draft.apps.length,
  };
  const invalid = Object.values(invalidIn).some(Boolean);
  const fid = (name: string) => `${uid}-${name}`;

  const save = async () => {
    const ok = await confirm({
      title: 'Save these settings?', tone: 'danger', confirmLabel: 'Save settings', stepUp: true,
      description: (
        <div>
          <p className="mb-2">They apply to every customer within about 30 seconds. The audit log records each change with its old value.</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-(--ad-bg-elev) p-2 font-mono text-[11px]">
            {changes.map((c) => <li key={c.key}>{c.label}{c.before !== undefined && <>: {String(c.before)} → <b>{String(c.after)}</b></>}</li>)}
          </ul>
        </div>
      ),
    });
    if (!ok) return;
    // Send only the sections that changed.
    const keys = [...new Set(changes.map((c) => c.top))];
    const patch = Object.fromEntries(keys.map((s) => [s, draft[s as keyof PlatformSettings]]));
    await run('save', () => adminApiClient.put('/admin/settings', patch, { otp: ok.otp }), 'Settings saved');
  };

  const panels: Record<SectionId, React.ReactNode> = {
    general: (
      <Section title="Support contacts" description="How customers reach you. Shown in the apps, on receipts and in emails.">
        <Row label="Support email" htmlFor={fid('email')}>
          <TextInput id={fid('email')} type="email" disabled={ro} value={draft.supportEmail} onChange={(e) => set((d) => { d.supportEmail = e.target.value; })} />
        </Row>
        <Row label="Support phone" htmlFor={fid('phone')} description="Include the country code, e.g. +234…">
          <TextInput id={fid('phone')} disabled={ro} maxLength={20} value={draft.supportPhone} onChange={(e) => set((d) => { d.supportPhone = e.target.value; })} />
        </Row>
      </Section>
    ),

    maintenance: (
      <Section title="Maintenance" description="Pause every money-moving request across all apps. Customers can still sign in and view their balances and history.">
        <Row label="Maintenance mode" description="Turn on only during an incident or planned downtime.">
          <div className="flex items-center justify-between gap-3">
            <StatusLine on={draft.maintenanceMode} onText="On — payments paused" offText="Off — everything is running" tone="danger" />
            <Toggle label="Maintenance mode" checked={draft.maintenanceMode} disabled={ro} onChange={(v) => set((d) => { d.maintenanceMode = v; })} />
          </div>
        </Row>
        <Row label="Message to customers" htmlFor={fid('mmsg')} description="Shown whenever a payment is blocked. Up to 300 characters.">
          <TextArea id={fid('mmsg')} rows={3} maxLength={300} disabled={ro} value={draft.maintenanceMessage} onChange={(e) => set((d) => { d.maintenanceMessage = e.target.value; })} />
        </Row>
      </Section>
    ),

    pilot: (
      <Section
        title="Private pilot"
        description="Limit sign-up to invited people and cap what they can spend."
        footer={<>Invitations are managed on the <Link href={adminPath('/pilot')} className="text-[#0f766e] hover:underline">Pilot invites</Link> page.</>}
      >
        <Row label="Pilot mode" description="When on, only invited people can create an account.">
          <div className="flex items-center justify-between gap-3">
            <StatusLine on={draft.pilot.enabled} onText="On — invite only" offText="Off — open sign-up" tone="warning" />
            <Toggle label="Pilot mode" checked={draft.pilot.enabled} disabled={ro} onChange={(v) => set((d) => { d.pilot.enabled = v; })} />
          </div>
        </Row>
        <Row label="Message for people without an invite" htmlFor={fid('pmsg')}>
          <TextArea id={fid('pmsg')} rows={3} maxLength={300} disabled={ro} value={draft.pilot.message} onChange={(e) => set((d) => { d.pilot.message = e.target.value; })} />
        </Row>
        <Row label="Spending caps" description="Apply to pilot users on top of their KYC limits.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LIMIT_COLUMNS.map((c) => (
              <div key={c.key}>
                <p className="mb-1 text-xs font-medium text-[var(--ad-muted)]">{c.label}</p>
                <NumberInput prefix="₦" label={`Pilot cap ${c.label}`} value={draft.pilot.caps[c.key]} disabled={ro} onChange={(v) => set((d) => { d.pilot.caps[c.key] = v; })} />
              </div>
            ))}
          </div>
          {limitError(draft.pilot.caps) && <p className="mt-2 text-xs text-[#b91c1c]">{limitError(draft.pilot.caps)}</p>}
        </Row>
      </Section>
    ),

    apps: (
      <Section
        title="Apps & features"
        description="Every white-label app on this platform, and which features each one shows. Apps pick up changes within a few minutes — no app release needed."
        actions={canManage ? <Button icon={<Plus size={14} />} onClick={() => setEditingApp({ index: null })}>Add app</Button> : undefined}
        footer={
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {FEATURES.map((f) => <div key={f.key}><dt className="inline font-semibold text-[var(--ad-fg-strong)]">{f.short}:</dt> <dd className="inline">{f.hint}</dd></div>)}
          </dl>
        }
      >
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-[var(--ad-bg-elev)] text-left text-xs font-medium tracking-wide text-[var(--ad-muted)] uppercase">
                <th className="px-5 py-2.5">App</th>
                {FEATURES.map((f) => <th key={f.key} className="px-2 py-2.5 text-center" title={f.label}>{f.short}</th>)}
                <th className="w-20 px-3 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ad-border)]">
              {draft.apps.map((app, i) => (
                <tr key={i}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--ad-fg-strong)]">{app.name}</p>
                    <p className="font-mono text-[11px] text-[var(--ad-muted)]">X-App: {app.id}</p>
                    {app.about && <p className="mt-0.5 max-w-[240px] truncate text-xs text-[var(--ad-muted)]" title={app.about}>{app.about}</p>}
                  </td>
                  {FEATURES.map((f) => (
                    <td key={f.key} className="px-2 py-3.5 text-center">
                      <div className="inline-flex">
                        <Toggle label={`${f.label} in ${app.name}`} checked={app.features[f.key]} disabled={ro} onChange={(v) => set((d) => { d.apps[i]!.features[f.key] = v; })} />
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-3.5">
                    {canManage && (
                      <div className="flex justify-end gap-1">
                        <button type="button" aria-label={`Edit ${app.name}`} title="Edit" onClick={() => setEditingApp({ index: i })} className="rounded-md p-1.5 text-[var(--ad-muted)] hover:bg-[var(--ad-bg-elev)] hover:text-[var(--ad-fg-strong)]"><Pencil size={14} /></button>
                        <button type="button" aria-label={`Remove ${app.name}`} title="Remove" onClick={() => set((d) => { d.apps.splice(i, 1); })} className="rounded-md p-1.5 text-[var(--ad-muted)] hover:bg-[#b91c1c]/10 hover:text-[#b91c1c]"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-[var(--ad-bg-elev)]/50">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-[var(--ad-fg-strong)]">Default</p>
                  <p className="text-xs text-[var(--ad-muted)]">Any app not listed above</p>
                </td>
                {FEATURES.map((f) => (
                  <td key={f.key} className="px-2 py-3.5 text-center">
                    <div className="inline-flex">
                      <Toggle label={`${f.label} for unlisted apps`} checked={draft.defaultFeatures[f.key]} disabled={ro} onChange={(v) => set((d) => { d.defaultFeatures[f.key] = v; })} />
                    </div>
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    ),

    limits: (
      <Section title="Transaction limits" description="Maximum a customer can send from their personal wallet, by verification level. Days and months reset at midnight Lagos time.">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="bg-[var(--ad-bg-elev)] text-left text-xs font-medium tracking-wide text-[var(--ad-muted)] uppercase">
                <th className="px-5 py-2.5">KYC level</th>
                {LIMIT_COLUMNS.map((c) => <th key={c.key} className="px-3 py-2.5">{c.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ad-border)]">
              {TIERS.map((t) => {
                const err = limitError(draft.limits[t.id]);
                return (
                  <tr key={t.id} className="align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--ad-fg-strong)]">{t.label}</p>
                      <p className="text-xs text-[var(--ad-muted)]">{t.hint}</p>
                      {err && <p className="mt-1 max-w-[180px] text-xs text-[#b91c1c]">{err}</p>}
                    </td>
                    {LIMIT_COLUMNS.map((c) => (
                      <td key={c.key} className="px-3 py-3">
                        <NumberInput prefix="₦" showMoney label={`${t.label} ${c.label}`} value={draft.limits[t.id][c.key]} disabled={ro} onChange={(v) => set((d) => { d.limits[t.id][c.key] = v; })} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    ),

    fraud: (
      <Section
        title="Fraud rules"
        description="Payments that break a rule are held instead of sent."
        footer={<>Held payments wait on the <Link href={adminPath('/fraud')} className="text-[#0f766e] hover:underline">Fraud holds</Link> page for review.</>}
      >
        <Row label="Payments per hour" htmlFor={fid('pph')} description="A customer making more payments than this in an hour has the extra ones held.">
          <NumberInput id={fid('pph')} suffix="per hour" value={draft.fraud.maxPaymentsPerHour} disabled={ro} onChange={(v) => set((d) => { d.fraud.maxPaymentsPerHour = v; })} />
        </Row>
        <Row label="New device" htmlFor={fid('dev')} description="Hold payments from a newly signed-in device at or above this amount.">
          <NumberInput id={fid('dev')} prefix="₦" showMoney value={draft.fraud.newDeviceHoldAbove} disabled={ro} onChange={(v) => set((d) => { d.fraud.newDeviceHoldAbove = v; })} />
        </Row>
        <Row label="New recipient" htmlFor={fid('rcp')} description="Hold first-time payments to someone at or above this amount.">
          <NumberInput id={fid('rcp')} prefix="₦" showMoney value={draft.fraud.newRecipientHoldAbove} disabled={ro} onChange={(v) => set((d) => { d.fraud.newRecipientHoldAbove = v; })} />
        </Row>
      </Section>
    ),

    approvals: (
      <Section title="Approvals" description="Refunds and stuck-payment decisions always need a second admin to approve them (maker-checker).">
        <Row label="Super administrator threshold" htmlFor={fid('sa')} description="At or above this amount, only a super administrator can approve.">
          <NumberInput id={fid('sa')} prefix="₦" showMoney value={draft.approvals.superadminAbove} disabled={ro} onChange={(v) => set((d) => { d.approvals.superadminAbove = v; })} />
        </Row>
      </Section>
    ),

    settlement: (
      <Section title="Merchant settlement" description="When and how merchants are paid out to their bank accounts.">
        <Row label="Payout time" htmlFor={fid('hour')} description="Hour of the day (Lagos time, 0–23) when daily, weekly and monthly payouts run.">
          <NumberInput id={fid('hour')} suffix=":00 WAT" min={0} max={23} value={draft.settlement.hourLagos} disabled={ro} onChange={(v) => set((d) => { d.settlement.hourLagos = v; })} />
        </Row>
        <Row label="Fee per payout" htmlFor={fid('fee')} description="Deducted from each payout.">
          <NumberInput id={fid('fee')} prefix="₦" showMoney value={draft.settlement.fee} disabled={ro} onChange={(v) => set((d) => { d.settlement.fee = v; })} />
        </Row>
        <Row label="Hold after bank change" htmlFor={fid('hold')} description="Payouts pause for this long after a merchant changes their bank account (0–168).">
          <NumberInput id={fid('hold')} suffix="hours" max={168} value={draft.settlement.newAccountHoldHours} disabled={ro} onChange={(v) => set((d) => { d.settlement.newAccountHoldHours = v; })} />
        </Row>
        <Row label="Card order commission" htmlFor={fid('comm')} description="Taken from card orders placed through merchant stores (0–50).">
          <NumberInput id={fid('comm')} suffix="%" max={50} value={draft.settlement.cardOrderCommissionPercent} disabled={ro} onChange={(v) => set((d) => { d.settlement.cardOrderCommissionPercent = v; })} />
        </Row>
        <Row label="Split payment fee" htmlFor={fid('split')} description="Who pays SeerBit’s processing fee on split payments.">
          <Select
            id={fid('split')} disabled={ro} value={draft.settlement.splitFeeBearer}
            onChange={(e) => set((d) => { d.settlement.splitFeeBearer = e.target.value as PlatformSettings['settlement']['splitFeeBearer']; })}
            options={[{ value: 'SUB_ACCOUNT', label: 'Merchant (sub-account)' }, { value: 'PARENT_ACCOUNT', label: 'BadePay' }, { value: 'PROPORTIONATE', label: 'Shared proportionately' }]}
          />
        </Row>
      </Section>
    ),
  };

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description={<>Platform-wide controls, enforced by the API. Every change is recorded in the <Link href={adminPath('/audit-log?targetType=settings')} className="text-[#0f766e] hover:underline">audit log</Link>.</>}
        actions={ro ? <Badge tone="warning">Read-only for your role</Badge> : undefined}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Section menu: a sidebar on large screens, a scrolling row on small ones */}
        <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
            {NAV.map((g) => (
              <div key={g.group} className="flex shrink-0 gap-1 lg:flex-col">
                <p className="hidden px-3 pb-1 text-[11px] font-semibold tracking-wider text-[var(--ad-muted)] uppercase lg:block">{g.group}</p>
                {g.items.map((item) => {
                  const active = item.id === section;
                  const count = changedIn[item.id];
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setSection(item.id)}
                      className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        active ? 'bg-[var(--ad-card)] font-semibold text-[var(--ad-fg-strong)] shadow-sm ring-1 ring-[var(--ad-border)]' : 'text-[var(--ad-muted)] hover:bg-[var(--ad-bg-elev)] hover:text-[var(--ad-fg-strong)]'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-[#0f766e]' : ''} />
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      {invalidIn[item.id] ? (
                        <span className="h-2 w-2 rounded-full bg-[#b91c1c]" title="Needs fixing" />
                      ) : count ? (
                        <span className="rounded-full bg-[#0f766e]/10 px-1.5 text-[11px] font-semibold text-[#0f766e]" title="Unsaved changes">{count}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0">{panels[section]}</div>
      </div>

      {canManage && changes.length > 0 && (
        <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ad-border-strong)] bg-[var(--ad-card)] px-4 py-3 shadow-lg">
          <p className="text-sm">
            <b>{changes.length}</b> unsaved change{changes.length === 1 ? '' : 's'}
            {Object.keys(changedIn).length > 1 && <span className="text-[var(--ad-muted)]"> across {Object.keys(changedIn).length} sections</span>}
            {invalid && <span className="ml-2 text-[#b91c1c]">Fix the highlighted limits first</span>}
          </p>
          <div className="flex gap-2">
            <Button icon={<Undo2 size={14} />} onClick={() => setDraft(structuredClone(data!))}>Discard</Button>
            <Button variant="primary" icon={<Save size={14} />} disabled={invalid} loading={pending === 'save'} onClick={save}>Save changes</Button>
          </div>
        </div>
      )}
      {editingApp && (
        <AppEditor
          app={editingApp.index === null ? null : draft.apps[editingApp.index]!}
          takenIds={draft.apps.filter((_, i) => i !== editingApp.index).map((a) => a.id)}
          defaults={draft.defaultFeatures}
          onClose={() => setEditingApp(null)}
          onSave={(app) => {
            set((d) => { if (editingApp.index === null) d.apps.push(app); else d.apps[editingApp.index] = app; });
            setEditingApp(null);
          }}
        />
      )}
      {dialog}
    </div>
  );
}

/** Add or edit a white-label app. Changes join the page's unsaved changes until Save. */
function AppEditor({ app, takenIds, defaults, onClose, onSave }: {
  app: AppProfile | null; takenIds: string[]; defaults: Features; onClose: () => void; onSave: (app: AppProfile) => void;
}) {
  const [name, setName] = useState(app?.name ?? '');
  const [id, setId] = useState(app?.id ?? '');
  const [idTouched, setIdTouched] = useState(!!app);
  const [about, setAbout] = useState(app?.about ?? '');
  const appId = idTouched ? id : slugify(name);
  const idError = !appId ? null : !APP_ID.test(appId) ? 'Use 2–32 lowercase letters, numbers or dashes.' : takenIds.includes(appId) ? 'Another app already uses this ID.' : null;
  const valid = name.trim().length >= 2 && !!appId && !idError;

  return (
    <Drawer open onClose={onClose} title={app ? `Edit ${app.name}` : 'Add app'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} onClick={() => onSave({ id: appId, name: name.trim(), about: about.trim(), features: app?.features ?? { ...defaults, betting: false } })}>{app ? 'Done' : 'Add app'}</Button></>}>
      <div className="space-y-4">
        <Field label="App name" required hint="Shown to users, e.g. by the AI assistant.">
          {(fid) => <TextInput id={fid} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ChurchPay" />}
        </Field>
        <Field label="App ID" required error={idError} hint={<>The build’s <code>VITE_APP_ID</code>; sent as the <code>X-App</code> header. {app && 'Changing it disconnects builds that use the old ID.'}</>}>
          {(fid) => <TextInput id={fid} className="font-mono" maxLength={32} value={appId} onChange={(e) => { setIdTouched(true); setId(e.target.value.toLowerCase()); }} placeholder="churchpay" />}
        </Field>
        <Field label="Who it’s for" hint="Optional. Helps the AI assistant answer in context, e.g. “for RCCG parishes and members”.">
          {(fid) => <TextArea id={fid} rows={2} maxLength={200} value={about} onChange={(e) => setAbout(e.target.value)} />}
        </Field>
        {!app && <p className="rounded-lg bg-[var(--ad-bg-elev)] p-3 text-xs text-[var(--ad-muted)]">A new app starts with the Default switches, with betting off. Adjust them in the table, then save.</p>}
      </div>
    </Drawer>
  );
}
