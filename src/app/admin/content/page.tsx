import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Tabs, DataTable, StatusBadge, Badge, Button, Drawer, Field, TextInput, TextArea, Select, Toggle, EmptyState, Can } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime, humanize } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';
import { FileUpload } from '@/components/ui/file-upload';

interface Post { id: string; title: string; slug: string; content: string; excerpt: string | null; coverImageUrl: string | null; category: string; tags: string[]; isPublished: boolean; featured: boolean; publishedAt: string | null; updatedAt: string }
interface Video { id: string; title: string; description: string; videoUrl: string; thumbnailUrl: string | null; category: string; location: string | null; duration: number | null; isPublished: boolean; featured: boolean; publishedAt: string | null; updatedAt: string }
type Kind = 'news' | 'videos';
type Tab = Kind | 'offers';
/** A "Special Offers" banner on the apps' home screens. */
interface Advert { id: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null; apps: string[]; sortOrder: number; isActive: boolean; startsAt: string | null; endsAt: string | null; updatedAt: string }
/** A white-label app registered in Settings → Apps. */
interface AppRef { id: string; name: string }

/** Live / scheduled / ended / paused, from the switch and the dates. */
function offerStatus(a: Advert): string {
  if (!a.isActive) return 'paused';
  const now = Date.now();
  if (a.startsAt && Date.parse(a.startsAt) > now) return 'scheduled';
  if (a.endsAt && Date.parse(a.endsAt) <= now) return 'ended';
  return 'live';
}


export default function ContentPage() {
  const canManage = useCan('content.manage');
  const [tab, setTab] = useState<Tab>('news');
  const news = useAdminQuery<{ posts: Post[] }>('/admin/news');
  const videos = useAdminQuery<{ videos: Video[] }>('/admin/videos');
  const offers = useAdminQuery<{ adverts: Advert[]; apps?: AppRef[] }>('/admin/adverts');
  const appName = (id: string) => offers.data?.apps?.find((a) => a.id === id)?.name ?? id;
  const [editing, setEditing] = useState<{ kind: Kind; item: Post | Video | null } | null>(null);
  const [editingOffer, setEditingOffer] = useState<{ item: Advert | null } | null>(null);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const togglePublish = async (kind: Kind, item: Post | Video) => {
    const ok = await confirm({
      title: item.isPublished ? 'Unpublish?' : 'Publish?', tone: item.isPublished ? 'danger' : 'success', confirmLabel: item.isPublished ? 'Unpublish' : 'Publish',
      description: <>“{item.title}” {item.isPublished ? 'disappears from the apps and website.' : 'goes live in the apps and on the website.'}</>,
    });
    if (ok) await run(`pub-${item.id}`, () => adminApiClient.put(`/admin/${kind}/${item.id}`, { isPublished: !item.isPublished }), item.isPublished ? 'Unpublished' : 'Published');
  };
  const remove = async (kind: Kind, item: Post | Video) => {
    const ok = await confirm({ title: 'Delete permanently?', tone: 'danger', confirmLabel: 'Delete', requireNote: true, description: <>“{item.title}” is removed for good.</> });
    if (ok) await run(`del-${item.id}`, () => adminApiClient.delete(`/admin/${kind}/${item.id}`, { reason: ok.note }), 'Deleted');
  };

  const toggleOffer = async (a: Advert) => {
    const ok = await confirm({
      title: a.isActive ? 'Pause this offer?' : 'Show this offer?', tone: a.isActive ? 'danger' : 'success', confirmLabel: a.isActive ? 'Pause' : 'Show',
      description: <>“{a.title}” {a.isActive ? 'disappears from the home screens.' : 'shows on the home screens (within its dates).'}</>,
    });
    if (ok) await run(`pub-${a.id}`, () => adminApiClient.put(`/admin/adverts/${a.id}`, { isActive: !a.isActive }), a.isActive ? 'Paused' : 'Live');
  };
  const removeOffer = async (a: Advert) => {
    const ok = await confirm({ title: 'Delete permanently?', tone: 'danger', confirmLabel: 'Delete', requireNote: true, description: <>“{a.title}” is removed for good.</> });
    if (ok) await run(`del-${a.id}`, () => adminApiClient.delete(`/admin/adverts/${a.id}`, { reason: ok.note }), 'Deleted');
  };

  const actions = (kind: Kind, item: Post | Video) => canManage && (
    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" onClick={() => setEditing({ kind, item })}>Edit</Button>
      <Button size="sm" variant={item.isPublished ? 'secondary' : 'success'} loading={pending === `pub-${item.id}`} onClick={() => togglePublish(kind, item)}>{item.isPublished ? 'Unpublish' : 'Publish'}</Button>
      <Button size="sm" variant="danger" loading={pending === `del-${item.id}`} onClick={() => remove(kind, item)}>Delete</Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="News, videos & offers"
        description="Articles, videos and Special Offers banners shown in the apps and website. Drafts are only visible here."
        actions={<Can perm="content.manage"><Button variant="primary" icon={<Plus size={14} />} onClick={() => (tab === 'offers' ? setEditingOffer({ item: null }) : setEditing({ kind: tab, item: null }))}>New {tab === 'news' ? 'article' : tab === 'videos' ? 'video' : 'offer'}</Button></Can>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'news', label: 'News', count: news.data?.posts.length }, { value: 'videos', label: 'Videos', count: videos.data?.videos.length }, { value: 'offers', label: 'Special offers', count: offers.data?.adverts.length }]} />
      {tab === 'offers' ? (
        <DataTable
          rows={offers.data?.adverts}
          loading={offers.isLoading}
          error={offers.error}
          onRetry={() => offers.refetch()}
          rowKey={(a) => a.id}
          onRowClick={canManage ? (a) => setEditingOffer({ item: a }) : undefined}
          empty={<EmptyState title="No offers yet" description="Offers appear as swipeable banners under “Special Offers” on the home screen." />}
          columns={[
            { key: 'image', header: <span className="sr-only">Image</span>, cell: (a) => <img src={a.imageUrl} alt="" className="h-10 w-24 rounded-md object-cover" /> },
            { key: 'title', header: 'Offer', cell: (a) => <span><span className="font-medium text-(--ad-fg-strong)">{a.title}</span><br /><span className="text-xs text-(--ad-muted)">{a.linkUrl ?? 'No link'}</span></span> },
            { key: 'apps', header: 'Apps', cell: (a) => <span className="text-xs">{a.apps.length ? a.apps.map(appName).join(', ') : 'All apps'}</span> },
            { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={offerStatus(a)} /> },
            { key: 'when', header: 'Runs', cell: (a) => <span className="text-xs text-(--ad-muted)">{a.startsAt ? formatDateTime(a.startsAt) : 'Now'} →<br />{a.endsAt ? formatDateTime(a.endsAt) : 'No end'}</span> },
            { key: 'order', header: 'Order', align: 'right', cell: (a) => <span className="tabular-nums text-xs">{a.sortOrder}</span> },
            {
              key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (a) => canManage && (
                <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => setEditingOffer({ item: a })}>Edit</Button>
                  <Button size="sm" variant={a.isActive ? 'secondary' : 'success'} loading={pending === `pub-${a.id}`} onClick={() => toggleOffer(a)}>{a.isActive ? 'Pause' : 'Show'}</Button>
                  <Button size="sm" variant="danger" loading={pending === `del-${a.id}`} onClick={() => removeOffer(a)}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
      ) : tab === 'news' ? (
        <DataTable
          rows={news.data?.posts}
          loading={news.isLoading}
          error={news.error}
          onRetry={() => news.refetch()}
          rowKey={(p) => p.id}
          onRowClick={canManage ? (p) => setEditing({ kind: 'news', item: p }) : undefined}
          empty={<EmptyState title="No articles yet" />}
          columns={[
            { key: 'title', header: 'Title', cell: (p) => <span><span className="font-medium text-(--ad-fg-strong)">{p.title}</span>{p.featured && <Badge tone="accent" className="ml-1.5">Featured</Badge>}<br /><span className="text-xs text-(--ad-muted)">{humanize(p.category)}</span></span> },
            { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.isPublished ? 'published' : 'draft'} /> },
            { key: 'when', header: 'Published / updated', cell: (p) => <span className="text-xs text-(--ad-muted)">{p.publishedAt ? formatDateTime(p.publishedAt) : '—'}<br />{formatDateTime(p.updatedAt)}</span> },
            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (p) => actions('news', p) },
          ]}
        />
      ) : (
        <DataTable
          rows={videos.data?.videos}
          loading={videos.isLoading}
          error={videos.error}
          onRetry={() => videos.refetch()}
          rowKey={(v) => v.id}
          onRowClick={canManage ? (v) => setEditing({ kind: 'videos', item: v }) : undefined}
          empty={<EmptyState title="No videos yet" />}
          columns={[
            { key: 'title', header: 'Title', cell: (v) => <span><span className="font-medium text-(--ad-fg-strong)">{v.title}</span>{v.featured && <Badge tone="accent" className="ml-1.5">Featured</Badge>}<br /><span className="text-xs text-(--ad-muted)">{humanize(v.category)}{v.location ? ` · ${v.location}` : ''}</span></span> },
            { key: 'status', header: 'Status', cell: (v) => <StatusBadge status={v.isPublished ? 'published' : 'draft'} /> },
            { key: 'when', header: 'Published / updated', cell: (v) => <span className="text-xs text-(--ad-muted)">{v.publishedAt ? formatDateTime(v.publishedAt) : '—'}<br />{formatDateTime(v.updatedAt)}</span> },
            { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (v) => actions('videos', v) },
          ]}
        />
      )}
      {editing && <ContentEditor kind={editing.kind} item={editing.item} onClose={() => setEditing(null)} />}
      {editingOffer && <OfferEditor item={editingOffer.item} apps={offers.data?.apps ?? []} onClose={() => setEditingOffer(null)} />}
      {dialog}
    </div>
  );
}

function ContentEditor({ kind, item, onClose }: { kind: Kind; item: Post | Video | null; onClose: () => void }) {
  const post = kind === 'news' ? (item as Post | null) : null;
  const video = kind === 'videos' ? (item as Video | null) : null;
  const [f, setF] = useState({
    title: item?.title ?? '', category: item?.category ?? '', featured: item?.featured ?? false, isPublished: item?.isPublished ?? false,
    content: post?.content ?? '', excerpt: post?.excerpt ?? '', coverImageUrl: post?.coverImageUrl ?? '', tags: post?.tags.join(', ') ?? '',
    description: video?.description ?? '', videoUrl: video?.videoUrl ?? '', thumbnailUrl: video?.thumbnailUrl ?? '', location: video?.location ?? '',
    duration: video?.duration ? String(video.duration) : '',
  });
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(0);
  const { run, pending } = useAdminAction();
  const valid = f.title.trim() && f.category.trim() && (kind === 'news' ? f.content.trim() : f.description.trim() && f.videoUrl) && uploading === 0;

  const save = async () => {
    const body = kind === 'news'
      ? { title: f.title, category: f.category, content: f.content, excerpt: f.excerpt || undefined, coverImageUrl: f.coverImageUrl || undefined, tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean), featured: f.featured, isPublished: f.isPublished }
      : { title: f.title, category: f.category, description: f.description, videoUrl: f.videoUrl, thumbnailUrl: f.thumbnailUrl || undefined, location: f.location || undefined, duration: f.duration ? Number(f.duration) : undefined, featured: f.featured, isPublished: f.isPublished };
    const done = await run('save', () => (item ? adminApiClient.put(`/admin/${kind}/${item.id}`, body) : adminApiClient.post(`/admin/${kind}`, body)), 'Saved');
    if (done) onClose();
  };

  return (
    <Drawer open onClose={onClose} width="max-w-2xl" title={`${item ? 'Edit' : 'New'} ${kind === 'news' ? 'article' : 'video'}`}
      footer={<><Button onClick={() => setPreview(!preview)} className="mr-auto">{preview ? 'Edit' : 'Preview'}</Button><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} loading={pending === 'save'} onClick={save}>{uploading ? 'Uploading…' : f.isPublished ? 'Save & publish' : 'Save draft'}</Button></>}>
      {preview ? (
        <article className="space-y-3">
          {kind === 'news' && f.coverImageUrl && <img src={f.coverImageUrl} alt="" className="max-h-60 w-full rounded-lg object-cover" />}
          {kind === 'videos' && f.thumbnailUrl && <img src={f.thumbnailUrl} alt="" className="max-h-60 w-full rounded-lg object-cover" />}
          <p className="text-xs uppercase text-(--ad-muted)">{f.category}</p>
          <h2 className="text-xl font-bold">{f.title || 'Untitled'}</h2>
          {kind === 'news' && f.excerpt && <p className="text-sm text-(--ad-muted)">{f.excerpt}</p>}
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{kind === 'news' ? f.content : f.description}</p>
        </article>
      ) : (
        <div className="space-y-4">
          <Field label="Title" required>{(id) => <TextInput id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
          <Field label="Category" required>{(id) => <TextInput id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />}</Field>
          {kind === 'news' ? (
            <>
              <Field label="Excerpt">{(id) => <TextArea id={id} rows={2} value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} />}</Field>
              <Field label="Content" required>{(id) => <TextArea id={id} rows={12} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />}</Field>
              <FileUpload kind="content_image" label="Cover image" shape="wide" value={f.coverImageUrl} onChange={(url) => setF({ ...f, coverImageUrl: url })} onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))} />
              <Field label="Tags" hint="Comma-separated">{(id) => <TextInput id={id} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />}</Field>
            </>
          ) : (
            <>
              <Field label="Description" required>{(id) => <TextArea id={id} rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
              <FileUpload kind="content_video" label="Video file *" shape="video" value={f.videoUrl} onChange={(url) => setF({ ...f, videoUrl: url })} onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))} />
              <FileUpload kind="content_image" label="Thumbnail" shape="wide" value={f.thumbnailUrl} onChange={(url) => setF({ ...f, thumbnailUrl: url })} onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Location">{(id) => <TextInput id={id} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />}</Field>
                <Field label="Duration (seconds)">{(id) => <TextInput id={id} type="number" min={0} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />}</Field>
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-6 border-t border-(--ad-border) pt-3">
            <label className="flex items-center gap-2 text-sm"><Toggle label="Featured" checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><Toggle label="Published" checked={f.isPublished} onChange={(v) => setF({ ...f, isPublished: v })} /> Published</label>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/** ISO → value for <input type="datetime-local"> (local time), and back. */
const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : '');
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function OfferEditor({ item, apps, onClose }: { item: Advert | null; apps: AppRef[]; onClose: () => void }) {
  const [f, setF] = useState({
    title: item?.title ?? '', subtitle: item?.subtitle ?? '', imageUrl: item?.imageUrl ?? '', linkUrl: item?.linkUrl ?? '',
    /** Empty = every app */
    apps: item?.apps ?? ([] as string[]),
    sortOrder: String(item?.sortOrder ?? 0), isActive: item?.isActive ?? true,
    startsAt: toLocalInput(item?.startsAt ?? null), endsAt: toLocalInput(item?.endsAt ?? null),
  });
  const [uploading, setUploading] = useState(0);
  const { run, pending } = useAdminAction();
  const linkOk = !f.linkUrl || /^(\/\S*|https:\/\/\S+)$/.test(f.linkUrl.trim());
  const datesOk = !f.startsAt || !f.endsAt || f.startsAt < f.endsAt;
  const valid = f.title.trim().length >= 2 && f.imageUrl && linkOk && datesOk && uploading === 0;

  const save = async () => {
    const body = {
      title: f.title.trim(), subtitle: f.subtitle.trim() || null, imageUrl: f.imageUrl, linkUrl: f.linkUrl.trim() || null,
      apps: f.apps, sortOrder: Number(f.sortOrder) || 0, isActive: f.isActive,
      startsAt: fromLocalInput(f.startsAt), endsAt: fromLocalInput(f.endsAt),
    };
    const done = await run('save', () => (item ? adminApiClient.put(`/admin/adverts/${item.id}`, body) : adminApiClient.post('/admin/adverts', body)), 'Saved');
    if (done) onClose();
  };

  return (
    <Drawer open onClose={onClose} width="max-w-xl" title={`${item ? 'Edit' : 'New'} offer`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} loading={pending === 'save'} onClick={save}>{uploading ? 'Uploading…' : 'Save offer'}</Button></>}>
      <div className="space-y-4">
        {f.imageUrl && (
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl">
            <img src={f.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-transparent" />
            <div className="relative flex h-full max-w-[70%] flex-col justify-end p-4 text-white">
              <span className="text-lg font-bold leading-tight">{f.title || 'Title'}</span>
              {f.subtitle && <span className="text-xs opacity-85">{f.subtitle}</span>}
            </div>
          </div>
        )}
        <FileUpload kind="content_image" label="Banner image *" shape="wide" value={f.imageUrl} onChange={(url) => setF({ ...f, imageUrl: url })} onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))} />
        <p className="-mt-2 text-xs text-(--ad-muted)">Wide image, about 16:7 (e.g. 1600×700). Text on the left stays readable.</p>
        <Field label="Title" required>{(id) => <TextInput id={id} maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label="Subtitle">{(id) => <TextInput id={id} maxLength={140} value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} />}</Field>
        <Field label="Link" hint="An app screen such as /bills, /savings, /marketplace — or a website starting with https://" error={linkOk ? null : 'Start with / or https://'}>
          {(id) => <TextInput id={id} placeholder="/bills" value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} />}
        </Field>
        <div>
          <p className="text-xs font-semibold text-(--ad-fg-strong)">Show in</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[...apps, ...f.apps.filter((id) => !apps.some((a) => a.id === id)).map((id) => ({ id, name: id }))].map((a) => {
              const on = f.apps.includes(a.id);
              return (
                <button key={a.id} type="button" aria-pressed={on}
                  onClick={() => setF({ ...f, apps: on ? f.apps.filter((x) => x !== a.id) : [...f.apps, a.id] })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? 'border-[#0f766e] bg-[#0f766e]/10 text-[#0f766e]' : 'border-(--ad-border) text-(--ad-muted) hover:text-(--ad-fg-strong)'}`}>
                  {a.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-(--ad-muted)">{f.apps.length ? `Only in ${f.apps.length === 1 ? 'this app' : 'these apps'}.` : 'None selected — shown in every app.'} Apps are added in Settings → Apps.</p>
        </div>
        <Field label="Order" hint="Lower shows first">{(id) => <TextInput id={id} type="number" min={0} max={999} value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" hint="Empty = now">{(id) => <TextInput id={id} type="datetime-local" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} />}</Field>
          <Field label="Ends" hint="Empty = no end" error={datesOk ? null : 'Must be after the start'}>{(id) => <TextInput id={id} type="datetime-local" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} />}</Field>
        </div>
        <label className="flex items-center gap-2 border-t border-(--ad-border) pt-3 text-sm"><Toggle label="Active" checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} /> Active</label>
      </div>
    </Drawer>
  );
}
