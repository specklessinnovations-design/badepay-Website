import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, LogOut } from 'lucide-react';
import { PageHeader, Card, KeyValue, Badge, Button, TextInput, Mono } from '@/components/admin/ui';
import { useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

export default function AccountPage() {
  const admin = useAdminAuthStore((s) => s.admin);
  const loadMe = useAdminAuthStore((s) => s.loadMe);
  const replaceToken = useAdminAuthStore((s) => s.replaceToken);
  const logout = useAdminAuthStore((s) => s.logout);
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  if (!admin) return null;

  const start = async () => {
    const r = await run('setup', () => adminApiClient.post('/admin/auth/2fa/setup'));
    if (r?.data) setSetup(r.data);
  };
  const enable = async () => {
    const r = await run('enable', () => adminApiClient.post('/admin/auth/2fa/enable', { code }), 'Two-factor is on. Other sessions were signed out.');
    if (r?.data?.token) {
      replaceToken(r.data.token);
      setSetup(null);
      setCode('');
      await loadMe();
    }
  };
  const signOutEverywhere = async () => {
    const ok = await confirm({ title: 'Sign out on every device?', tone: 'danger', confirmLabel: 'Sign out everywhere', description: <>Every session ends, including this one.</> });
    if (ok) await logout('You signed out on every device.', { everywhere: true });
  };

  return (
    <div>
      <PageHeader eyebrow="Account" title="My account & security" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <KeyValue columns={1} items={[
            { label: 'Name', value: admin.name },
            { label: 'Email', value: admin.email },
            { label: 'Role', value: <Badge tone={admin.role === 'superadmin' ? 'violet' : 'neutral'}>{admin.roleName}</Badge> },
            { label: 'Last sign-in', value: formatDateTime(admin.lastLoginAt) },
          ]} />
          <p className="mt-3 text-xs text-(--ad-muted)">Role changes are made by an administrator on Team & roles.</p>
        </Card>

        <Card title="Two-factor authentication">
          {admin.twoFactorEnabled ? (
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#047857]" size={20} />
              <div>
                <p className="text-sm font-semibold">On</p>
                <p className="text-sm text-(--ad-muted)">You’ll be asked for a code at sign-in and before high-risk actions (approvals, settings, role changes). Lost your phone? Ask another administrator to reset it.</p>
              </div>
            </div>
          ) : setup ? (
            <div className="space-y-3">
              <p className="text-sm">1. Scan this with Google Authenticator, Microsoft Authenticator or 1Password.</p>
              <img src={setup.qrCodeDataUrl} alt="Two-factor QR code" className="h-44 w-44 rounded-lg border border-(--ad-border)" />
              <p className="text-xs text-(--ad-muted)">Can’t scan? Enter this key: <Mono>{setup.secret}</Mono></p>
              <p className="text-sm">2. Enter the 6-digit code it shows.</p>
              <div className="flex gap-2">
                <TextInput inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="w-36 font-mono tracking-[0.3em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Authenticator code" />
                <Button variant="primary" disabled={code.length !== 6} loading={pending === 'enable'} onClick={enable}>Turn on</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 text-[#b45309]" size={20} />
                <div>
                  <p className="text-sm font-semibold">Off</p>
                  <p className="text-sm text-(--ad-muted)">
                    Protect your account with an authenticator app.
                    {admin.twoFactorRequired && <> <b>Required</b>: high-risk actions are refused until it’s on.</>}
                  </p>
                </div>
              </div>
              <Button variant="primary" loading={pending === 'setup'} onClick={start}>Set up two-factor</Button>
            </div>
          )}
        </Card>

        <Card title="Sessions" description="Admin sessions last 8 hours and end after 15 minutes without activity.">
          <Button variant="danger" icon={<LogOut size={14} />} onClick={signOutEverywhere}>Sign out on every device</Button>
        </Card>

        <Card title={`Your permissions (${admin.permissions.length})`} description="What your role allows. Anything else is refused by the API.">
          <div className="flex max-h-64 flex-wrap gap-1 overflow-y-auto">
            {admin.permissions.map((p) => <Badge key={p}>{p}</Badge>)}
          </div>
        </Card>
      </div>
      {dialog}
    </div>
  );
}
