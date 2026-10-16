import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Tabs, DataTable, StatusBadge, Badge, Button, Drawer, Field, TextInput, TextArea, Toggle, EmptyState, Can } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime, humanize } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';
import { FileUpload } from '@/components/ui/file-upload';

interface Post { id: string; title: string; slug: string; content: string; excerpt: string | null; coverImageUrl: string | null; category: string; tags: string[]; isPublished: boolean; featured: boolean; publishedAt: string | null; updatedAt: string }
interface Video { id: string; title: string; description: string; videoUrl: string; thumbnailUrl: string | null; category: string; location: string | null; duration: number | null; isPublished: boolean; featured: boolean; publishedAt: string | null; updatedAt: string }
type Kind = 'news' | 'videos';


export default function ContentPage() {
  const canManage = useCan('content.manage');
  const [tab, setTab] = useState<Kind>('news');
  const news = useAdminQuery<{ posts: Post[] }>('/admin/news');
  const videos = useAdminQuery<{ videos: Video[] }>('/admin/videos');
  const [editing, setEditing] = useState<{ kind: Kind; item: Post | Video | null } | null>(null);
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
        title="News & videos"
        description="Articles and videos shown in the BadePay apps and website. Drafts are only visible here."
        actions={<Can perm="content.manage"><Button variant="primary" icon={<Plus size={14} />} onClick={() => setEditing({ kind: tab, item: null })}>New {tab === 'news' ? 'article' : 'video'}</Button></Can>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'news', label: 'News', count: news.data?.posts.length }, { value: 'videos', label: 'Videos', count: videos.data?.videos.length }]} />
      {tab === 'news' ? (
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
