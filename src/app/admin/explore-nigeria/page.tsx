import React, { useEffect, useState } from 'react';
import { ImageIcon, PlayCircle, Save, Trash2, Sparkles } from 'lucide-react';
import adminApiClient from '@/lib/adminApiClient';
import { useToast } from '@/hooks/useToast';

type ExploreItem = {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  location: string;
  category: string;
  createdAt: string;
};

const emptyForm = {
  title: '',
  description: '',
  mediaType: 'image' as 'image' | 'video',
  mediaUrl: '',
  location: '',
  category: '',
};

export default function AdminExploreNigeriaPage() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await adminApiClient.get('/explore-nigeria');
      setItems(response?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.description || !form.mediaUrl || !form.location || !form.category) {
      showError('Please fill all fields before publishing.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await adminApiClient.put(`/explore-nigeria/${editingId}`, form);
        showSuccess('Explore Nigeria item updated.');
      } else {
        await adminApiClient.post('/explore-nigeria', form);
        showSuccess('Explore Nigeria item published.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch {
      showError('Failed to save Explore Nigeria content.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: ExploreItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      location: item.location,
      category: item.category,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApiClient.delete(`/explore-nigeria/${id}`);
      showSuccess('Item removed.');
      await loadItems();
    } catch {
      showError('Unable to remove item.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-white/10 bg-[var(--ad-card)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ad-muted-soft)]">Content Management</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--ad-fg-strong)]">Explore Nigeria</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ad-muted)]">
              Add image and video highlights for the Explore Nigeria section. The content will appear instantly on the public experience.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--ad-accent)]/20 bg-[var(--ad-accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--ad-accent)]">
            <Sparkles size={15} />
            Admin publishing
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-white/10 bg-[var(--ad-card)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-2 text-lg font-black text-[var(--ad-fg-strong)]">
            <Save size={18} className="text-[var(--ad-accent)]" />
            {editingId ? 'Edit content' : 'Publish new content'}
          </div>

          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Title"
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--ad-fg-strong)] outline-none"
          />
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description"
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--ad-fg-strong)] outline-none"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.mediaType}
              onChange={(event) => setForm({ ...form, mediaType: event.target.value as 'image' | 'video' })}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--ad-fg-strong)] outline-none"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Category"
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--ad-fg-strong)] outline-none"
            />
          </div>
          <input
            value={form.mediaUrl}
            onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })}
            placeholder="Image or video URL"
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--ad-fg-strong)] outline-none"
          />
          <input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="Location"
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--ad-fg-strong)] outline-none"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl bg-[var(--ad-accent)] px-4 py-3 text-sm font-black text-[#07110f] transition-opacity disabled:opacity-60"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : editingId ? 'Update content' : 'Publish content'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-[var(--ad-muted)]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-[var(--ad-card)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-[var(--ad-fg-strong)]">Published items</h3>
            <span className="text-sm text-[var(--ad-muted)]">{items.length} total</span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-black/10 p-4 text-sm text-[var(--ad-muted)]">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-black/10 p-4 text-sm text-[var(--ad-muted)]">No items published yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ad-accent)]">
                        {item.mediaType === 'video' ? <PlayCircle size={14} /> : <ImageIcon size={14} />}
                        {item.category}
                      </div>
                      <h4 className="mt-1 text-sm font-black text-[var(--ad-fg-strong)]">{item.title}</h4>
                      <p className="mt-1 text-sm text-[var(--ad-muted)]">{item.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[var(--ad-fg-strong)]">
                        Edit
                      </button>
                      <button type="button" onClick={() => void handleDelete(item.id)} className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
