import React, { useMemo, useState } from 'react';
import { Check, Plus, ShieldCheck } from 'lucide-react';
import {
  PageHeader, Card, Tabs, DataTable, StatusBadge, Badge, Button, Drawer, Field, TextInput, TextArea, Select, Mono, Spinner, ErrorState, Can,
} from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime, formatRelative } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

interface AdminRow { id: string; name: string; email: string; role: string; roleName: string; isActive: boolean; twoFactorEnabled: boolean; lastLoginAt: string | null; createdAt: string }
interface Role { key: string; name: string; description: string; permissions: string[]; system: boolean; adminCount: number }
interface RolesData { roles: Role[]; permissions: { key: string; description: string }[] }

const group = (key: string) => key.split('.')[0];
const GROUP_LABEL: Record<string, string> = {
  dashboard: 'Overview', users: 'Customers', wallets: 'Wallets', merchants: 'Merchants', kyc: 'KYC', transactions: 'Transactions',
  refunds: 'Refunds', fraud: 'Fraud', review: 'Stuck payments', reconciliation: 'Reconciliation', settlements: 'Settlements',
  finance: 'Finance reports', tickets: 'Tickets', account_closure: 'Account closures', content: 'Content', pilot: 'Pilot',
  audit_logs: 'Audit log', admin_users: 'Admin accounts', roles: 'Roles', settings: 'Settings',
};

export default function TeamPage() {
  const me = useAdminAuthStore((s) => s.admin);
  const can = (p: string) => !!me?.permissions.includes(p);
  const [tab, setTab] = useState<'admins' | 'roles' | 'matrix'>(can('admin_users.view') ? 'admins' : 'roles');
  const admins = useAdminQuery<AdminRow[]>(can('admin_users.view') ? '/admin/admins' : null);
  const roles = useAdminQuery<RolesData>('/admin/roles');
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const [creating, setCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | 'new' | null>(null);

  const roleOptions = (roles.data?.roles ?? [])
    .filter((r) => r.key !== 'superadmin' || me?.role === 'superadmin')
    .map((r) => ({ value: r.key, label: `${r.name}${r.system ? '' : ' (custom)'}` }));

  const changeRole = async (a: AdminRow) => {
    const ok = await confirm({
      title: `Change ${a.name}’s role?`, tone: 'danger', confirmLabel: 'Change role', stepUp: true, requireNote: true,
      description: <>Currently <b>{a.roleName}</b>. They’re signed out everywhere and get the new permissions when they sign in again.</>,
      fields: [{ name: 'role', label: 'New role', type: 'select', required: true, options: roleOptions.filter((o) => o.value !== a.role) }],
    });
    if (ok) await run(`role-${a.id}`, () => adminApiClient.patch(`/admin/admins/${a.id}`, { role: ok.values.role, reason: ok.note }, { otp: ok.otp }), 'Role changed');
  };
  const toggleActive = async (a: AdminRow) => {
    const ok = await confirm({
      title: a.isActive ? `Disable ${a.name}?` : `Enable ${a.name}?`, tone: a.isActive ? 'danger' : 'success',
      confirmLabel: a.isActive ? 'Disable' : 'Enable', stepUp: true, requireNote: true,
      description: a.isActive ? <>They’re signed out at once and can’t sign in. Their audit history stays.</> : <>They can sign in again with their current role (<b>{a.roleName}</b>).</>,
    });
    if (ok) await run(`active-${a.id}`, () => adminApiClient.patch(`/admin/admins/${a.id}`, { isActive: !a.isActive, reason: ok.note }, { otp: ok.otp }));
  };
  const revoke = async (a: AdminRow) => {
    const ok = await confirm({ title: `Sign ${a.name} out everywhere?`, tone: 'danger', confirmLabel: 'Sign out everywhere', requireNote: true, description: <>Every session ends now. Use this for a lost laptop or suspicious activity.</> });
    if (ok) await run(`revoke-${a.id}`, () => adminApiClient.post(`/admin/admins/${a.id}/sessions/revoke`, { reason: ok.note }));
  };
  const reset2fa = async (a: AdminRow) => {
    const ok = await confirm({ title: `Reset ${a.name}’s two-factor?`, tone: 'danger', confirmLabel: 'Reset two-factor', stepUp: true, requireNote: true, description: <>For a lost phone. They’re signed out and must set up their authenticator again. Confirm their identity first.</> });
    if (ok) await run(`2fa-${a.id}`, () => adminApiClient.post(`/admin/admins/${a.id}/2fa/reset`, { reason: ok.note }, { otp: ok.otp }));
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Team & roles"
        description="Admins get exactly the permissions of their role. The API enforces every permission; nobody can change their own role, grant permissions they don’t hold, or remove the last super administrator. All changes are audited."
        actions={tab === 'admins'
          ? <Can perm="admin_users.manage"><Button variant="primary" icon={<Plus size={14} />} onClick={() => setCreating(true)}>Add admin</Button></Can>
          : <Can perm="roles.manage"><Button variant="primary" icon={<Plus size={14} />} onClick={() => setEditingRole('new')}>New custom role</Button></Can>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'admins', label: 'Admins', count: admins.data?.length, hidden: !can('admin_users.view') },
        { value: 'roles', label: 'Roles', count: roles.data?.roles.length },
        { value: 'matrix', label: 'Permission matrix' },
      ]} />

      {tab === 'admins' && (
        <DataTable
          rows={admins.data}
          loading={admins.isLoading}
          error={admins.error}
          onRetry={() => admins.refetch()}
          rowKey={(a) => a.id}
          columns={[
            { key: 'who', header: 'Admin', cell: (a) => <span><span className="font-medium text-(--ad-fg-strong)">{a.name}</span>{a.id === me?.id && <Badge tone="accent" className="ml-1.5">You</Badge>}<br /><span className="text-xs text-(--ad-muted)">{a.email}</span></span> },
            { key: 'role', header: 'Role', cell: (a) => <Badge tone={a.role === 'superadmin' ? 'violet' : 'neutral'}>{a.roleName}</Badge> },
            { key: '2fa', header: 'Two-factor', cell: (a) => a.twoFactorEnabled ? <Badge tone="success"><ShieldCheck size={11} /> On</Badge> : <Badge tone="warning">Off</Badge> },
            { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.isActive ? 'active' : 'disabled'} /> },
            { key: 'seen', header: 'Last sign-in', cell: (a) => <span className="text-xs text-(--ad-muted)" title={formatDateTime(a.lastLoginAt)}>{a.lastLoginAt ? formatRelative(a.lastLoginAt) : 'Never'}</span> },
            {
              key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (a) => a.id !== me?.id && can('admin_users.manage') && (a.role !== 'superadmin' || me?.role === 'superadmin') && (
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Button size="sm" loading={pending === `role-${a.id}`} onClick={() => changeRole(a)}>Role</Button>
                  <Button size="sm" loading={pending === `revoke-${a.id}`} onClick={() => revoke(a)}>Sign out</Button>
                  {a.twoFactorEnabled && <Button size="sm" loading={pending === `2fa-${a.id}`} onClick={() => reset2fa(a)}>Reset 2FA</Button>}
                  <Button size="sm" variant={a.isActive ? 'danger' : 'success'} loading={pending === `active-${a.id}`} onClick={() => toggleActive(a)}>{a.isActive ? 'Disable' : 'Enable'}</Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === 'roles' && (roles.isLoading ? <Spinner /> : roles.error ? <Card><ErrorState error={roles.error} onRetry={() => roles.refetch()} /></Card> : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {roles.data?.roles.map((r) => (
            <Card
              key={r.key}
              title={<span className="flex items-center gap-2">{r.name}{r.system ? <Badge>Built-in</Badge> : <Badge tone="accent">Custom</Badge>}</span>}
              description={<><Mono>{r.key}</Mono> · {r.adminCount} admin{r.adminCount === 1 ? '' : 's'}</>}
              actions={!r.system && can('roles.manage') && <Button size="sm" onClick={() => setEditingRole(r)}>Edit</Button>}
            >
              <p className="mb-2 text-sm text-(--ad-fg)">{r.description}</p>
              <div className="flex flex-wrap gap-1">
                {r.permissions.length === roles.data!.permissions.length
                  ? <Badge tone="violet">All permissions</Badge>
                  : r.permissions.map((p) => <Badge key={p}>{p}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      ))}

      {tab === 'matrix' && roles.data && <PermissionMatrix data={roles.data} />}

      <CreateAdminDrawer open={creating} onClose={() => setCreating(false)} roleOptions={roleOptions} />
      {editingRole && roles.data && (
        <RoleDrawer role={editingRole === 'new' ? null : editingRole} catalogue={roles.data.permissions} myPermissions={me?.permissions ?? []} onClose={() => setEditingRole(null)} />
      )}
      {dialog}
    </div>
  );
}

function PermissionMatrix({ data }: { data: RolesData }) {
  return (
    <div className="ad-card overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="sticky top-0 bg-(--ad-bg-elev)">
          <tr>
            <th className="border-b border-(--ad-border) px-3 py-2 font-semibold">Permission</th>
            {data.roles.map((r) => <th key={r.key} className="border-b border-(--ad-border) px-2 py-2 text-center font-semibold">{r.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.permissions.map((p) => (
            <tr key={p.key} className="border-b border-(--ad-border) last:border-0">
              <td className="px-3 py-1.5"><Mono>{p.key}</Mono><br /><span className="text-(--ad-muted)">{p.description}</span></td>
              {data.roles.map((r) => (
                <td key={r.key} className="px-2 py-1.5 text-center">
                  {r.permissions.includes(p.key) ? <Check size={14} className="inline text-[#047857]" aria-label="Allowed" /> : <span className="text-(--ad-muted-soft)" aria-label="Not allowed">·</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateAdminDrawer({ open, onClose, roleOptions }: { open: boolean; onClose: () => void; roleOptions: { value: string; label: string }[] }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const strong = form.password.length >= 12 && /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) && /\d/.test(form.password) && /[^A-Za-z0-9]/.test(form.password);
  const valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && strong && form.role;

  const submit = async () => {
    const ok = await confirm({ title: 'Create this admin?', tone: 'success', confirmLabel: 'Create admin', stepUp: true, description: <>{form.name} ({form.email}) gets the <b>{roleOptions.find((r) => r.value === form.role)?.label}</b> role. Share the password over a separate channel and ask them to set up two-factor on first sign-in.</> });
    if (!ok) return;
    const done = await run('create', () => adminApiClient.post('/admin/admins', form, { otp: ok.otp }), 'Admin created');
    if (done) { setForm({ name: '', email: '', password: '', role: '' }); onClose(); }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Add admin" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} loading={pending === 'create'} onClick={submit}>Create admin</Button></>}>
      <div className="space-y-4">
        <Field label="Full name" required>{(id) => <TextInput id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
        <Field label="Work email" required>{(id) => <TextInput id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
        <Field label="Temporary password" required hint="At least 12 characters with upper and lower case letters, a number and a symbol." error={form.password && !strong ? 'Not strong enough yet' : null}>
          {(id) => <TextInput id={id} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
        </Field>
        <Field label="Role" required>{(id) => <Select id={id} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[{ value: '', label: 'Choose a role…' }, ...roleOptions]} />}</Field>
      </div>
      {dialog}
    </Drawer>
  );
}

function RoleDrawer({ role, catalogue, myPermissions, onClose }: {
  role: Role | null; catalogue: { key: string; description: string }[]; myPermissions: string[]; onClose: () => void;
}) {
  const [key, setKey] = useState(role?.key ?? '');
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [perms, setPerms] = useState<string[]>(role?.permissions ?? []);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const groups = useMemo(() => {
    const m = new Map<string, { key: string; description: string }[]>();
    for (const p of catalogue) m.set(group(p.key), [...(m.get(group(p.key)) ?? []), p]);
    return [...m.entries()];
  }, [catalogue]);
  const toggle = (p: string) => setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const valid = name.trim().length >= 2 && perms.length > 0 && (role || /^[a-z][a-z0-9_]{2,40}$/.test(key));

  const save = async () => {
    const ok = await confirm({
      title: role ? `Save changes to ${role.name}?` : 'Create this role?', tone: 'success', confirmLabel: 'Save role', stepUp: true,
      ...(role ? { requireNote: true, noteLabel: 'Why is this role changing?' } : {}),
      description: <>{perms.length} permissions.{role && role.adminCount > 0 && <> The {role.adminCount} admin(s) holding it are signed out so the change applies at once.</>}</>,
    });
    if (!ok) return;
    const done = role
      ? await run('save', () => adminApiClient.patch(`/admin/roles/${role.key}`, { name, description, permissions: perms, reason: ok.note }, { otp: ok.otp }), 'Role saved')
      : await run('save', () => adminApiClient.post('/admin/roles', { key, name, description, permissions: perms }, { otp: ok.otp }), 'Role created');
    if (done) onClose();
  };
  const remove = async () => {
    if (!role) return;
    const ok = await confirm({ title: `Delete ${role.name}?`, tone: 'danger', confirmLabel: 'Delete role', stepUp: true, description: <>Only possible when no admin holds it.</> });
    if (!ok) return;
    const done = await run('delete', () => adminApiClient.delete(`/admin/roles/${role.key}`, undefined, { otp: ok.otp }), 'Role deleted');
    if (done) onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={role ? `Edit ${role.name}` : 'New custom role'}
      footer={(
        <>
          {role && <Button variant="danger" loading={pending === 'delete'} onClick={remove} className="mr-auto">Delete</Button>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} loading={pending === 'save'} onClick={save}>Save role</Button>
        </>
      )}
    >
      <div className="space-y-4">
        {!role && <Field label="Key" required hint="Lower-case letters, numbers and _ (e.g. senior_support). Can’t be changed later.">{(id) => <TextInput id={id} value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} />}</Field>}
        <Field label="Name" required>{(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Description">{(id) => <TextArea id={id} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
        <div>
          <p className="mb-2 text-xs font-semibold text-(--ad-fg-strong)">Permissions <span className="font-normal text-(--ad-muted)">— you can only grant permissions you hold</span></p>
          <div className="space-y-3">
            {groups.map(([g, items]) => (
              <fieldset key={g} className="rounded-lg border border-(--ad-border) p-3">
                <legend className="px-1 text-xs font-semibold text-(--ad-muted)">{GROUP_LABEL[g] ?? g}</legend>
                <div className="space-y-1.5">
                  {items.map((p) => {
                    const allowed = myPermissions.includes(p.key);
                    return (
                      <label key={p.key} className={`flex items-start gap-2 text-sm ${allowed ? '' : 'opacity-50'}`} title={allowed ? undefined : 'You don’t hold this permission'}>
                        <input type="checkbox" className="mt-0.5 accent-[#0f766e]" checked={perms.includes(p.key)} disabled={!allowed} onChange={() => toggle(p.key)} />
                        <span><Mono>{p.key}</Mono><br /><span className="text-xs text-(--ad-muted)">{p.description}</span></span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </div>
      {dialog}
    </Drawer>
  );
}
