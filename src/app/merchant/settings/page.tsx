/**
 * Merchant store settings: the store's public identity (banner, logo, business name, category,
 * description), edited on a live preview of the storefront header. Backend: PATCH /merchants/store.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Camera, Copy, ExternalLink, ImagePlus, Loader2, Trash2, Check, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useMerchantStoreData } from '@/store/useMerchantStoreData';
import { merchantService } from '@/services/merchantService';
import { MerchantMark } from '@/components/merchant/MerchantBrand';
import { UPLOAD_RULES, UploadKind, uploadFile } from '@/lib/uploads';
import { MERCHANT_CATEGORIES } from '@/types/merchant';

const card = { background: 'var(--card)', border: '1px solid var(--border)' } as const;
const input = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;
const DESC_MAX = 280;

interface Form { name: string; category: string; description: string; logoUrl: string; bannerUrl: string }

/** Hidden file input + upload state for one image slot (logo or banner). */
function useImageSlot(kind: UploadKind, onUploaded: (url: string) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = () => ref.current?.click();
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProgress(0);
    try {
      const uploaded = await uploadFile(kind, file, { onProgress: setProgress });
      onUploaded(uploaded.url);
    } catch (err) {
      toast.error((err as Error).message || 'Upload failed');
    } finally {
      setProgress(null);
    }
  };
  const fileInput = <input ref={ref} type="file" accept={UPLOAD_RULES[kind].accept} className="sr-only" tabIndex={-1} aria-hidden onChange={onChange} />;
  return { pick, busy: progress !== null, progress, fileInput };
}

export default function MerchantSettingsPage() {
  const user = useAuthStore(s => s.user);
  const merchantId = user?.id || '';
  const storeInfo = useMerchantStoreData(s => s.stores[merchantId]);
  const fetchStore = useMerchantStoreData(s => s.fetchStore);

  const initial = useMemo<Form>(() => ({
    name: storeInfo?.name || user?.merchantProfile?.tradingName || user?.merchantProfile?.businessName || '',
    category: storeInfo?.category || user?.merchantProfile?.category || '',
    description: storeInfo?.description || '',
    logoUrl: storeInfo?.logoUrl || '',
    bannerUrl: storeInfo?.bannerUrl || '',
  }), [storeInfo, user?.merchantProfile]);

  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(f => ({ ...f, [key]: value }));

  useEffect(() => { if (merchantId) void fetchStore(merchantId); }, [merchantId]); // eslint-disable-line react-hooks/exhaustive-deps
  // The store loads after the first render: fill the form once it arrives.
  useEffect(() => { setForm(initial); }, [initial]);

  const logo = useImageSlot('store_logo', url => set('logoUrl', url));
  const banner = useImageSlot('store_banner', url => set('bannerUrl', url));

  const dirty = (Object.keys(form) as (keyof Form)[]).some(k => form[k].trim() !== initial[k].trim());
  const nameError = form.name.trim().length < 2 ? 'Business name must be at least 2 characters' : '';
  const uploading = logo.busy || banner.busy;

  const slug = storeInfo?.slug || user?.merchantProfile?.qrSlug || '';
  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://badepay.com'}/store/${slug}`;

  const handleSave = async () => {
    if (nameError) { toast.error(nameError); return; }
    setSaving(true);
    try {
      const updated = await merchantService.updateMyStore({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
      });
      if (!updated) throw new Error('save failed');
      await fetchStore(merchantId);
      toast.success('Store settings saved');
    } catch {
      toast.error('Could not save your store settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(storeUrl); toast.success('Store link copied'); }
    catch { toast.error('Could not copy. Select the link and copy it.'); }
  };

  if (!user?.merchantProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Store size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 className="text-xl font-black mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Merchant Required</h2>
        <Link href="/merchant/onboarding" className="rounded-xl px-5 py-2.5 text-sm font-black" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          Become a Merchant
        </Link>
      </div>
    );
  }

  const displayName = form.name.trim() || 'Your business';

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Store settings</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          How your business appears to customers on your storefront, QR payments and receipts.
        </p>
      </div>

      {/* Live preview: banner + logo, editable in place */}
      <section className="overflow-hidden rounded-2xl" style={card}>
        <div className="group relative h-40 sm:h-52" style={{ background: 'var(--surface-secondary)' }}>
          {form.bannerUrl ? (
            <img src={form.bannerUrl} alt="Store banner" className="h-full w-full object-cover" />
          ) : (
            <button type="button" onClick={banner.pick} disabled={banner.busy}
              className="flex h-full w-full flex-col items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,#051a14 0%,#0d3028 45%,#081e18 100%)', color: 'rgba(255,255,255,0.75)' }}>
              <ImagePlus size={26} />
              <span className="text-sm font-semibold">Add a banner</span>
              <span className="text-xs opacity-70">1600 × 600 recommended · {UPLOAD_RULES.store_banner.label}</span>
            </button>
          )}

          {banner.busy && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
              <Loader2 size={16} className="animate-spin" /> Uploading banner… {banner.progress}%
            </div>
          )}

          {form.bannerUrl && !banner.busy && (
            <div className="absolute right-3 top-3 flex gap-2">
              <button type="button" onClick={banner.pick}
                className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white backdrop-blur"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <Camera size={13} /> Change banner
              </button>
              <button type="button" onClick={() => set('bannerUrl', '')} aria-label="Remove banner"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white backdrop-blur"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          )}
          {banner.fileInput}
        </div>

        <div className="relative px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <div className="relative">
              <div className="rounded-[22px] p-1" style={{ background: 'var(--card)' }}>
                <MerchantMark name={displayName} logoUrl={form.logoUrl || undefined} size={84} />
              </div>
              {logo.busy && (
                <div className="absolute inset-1 flex items-center justify-center rounded-[20px] text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  {logo.progress}%
                </div>
              )}
              <button type="button" onClick={logo.pick} disabled={logo.busy} aria-label="Change logo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full shadow-md"
                style={{ background: '#6fe8d6', color: '#1a1a1a', border: '3px solid var(--card)' }}>
                <Camera size={14} />
              </button>
              {logo.fileInput}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="truncate text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
              <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {form.description.trim() || 'Add a short description so customers know what you sell.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>Logo: square, at least 400 × 400 · {UPLOAD_RULES.store_logo.label}</span>
            {form.logoUrl && (
              <button type="button" onClick={() => set('logoUrl', '')} className="font-semibold underline-offset-2 hover:underline" style={{ color: 'var(--text-secondary)' }}>
                Remove logo
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Business details */}
      <section className="space-y-5 rounded-2xl p-5" style={card}>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Business details</h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>Shown on your storefront and when customers pay you.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="biz-name" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Business name</label>
          <input id="biz-name" value={form.name} onChange={e => set('name', e.target.value)} maxLength={80}
            placeholder="e.g. Mama Ngozi Kitchen" aria-invalid={!!nameError && dirty}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6fe8d6]/40" style={input} />
          {nameError && dirty && <p className="text-xs" style={{ color: 'var(--error-text, #ef4444)' }}>{nameError}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="biz-category" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Category</label>
          <select id="biz-category" value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6fe8d6]/40" style={input}>
            <option value="">Select a category</option>
            {[...new Set([...MERCHANT_CATEGORIES, ...(form.category ? [form.category] : [])])].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="biz-desc" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Description</label>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{form.description.length}/{DESC_MAX}</span>
          </div>
          <textarea id="biz-desc" value={form.description} onChange={e => set('description', e.target.value.slice(0, DESC_MAX))} rows={4}
            placeholder="What do you sell? Opening hours, delivery areas…"
            className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6fe8d6]/40" style={input} />
        </div>
      </section>

      {/* Storefront link */}
      <section className="rounded-2xl p-5" style={card}>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Storefront link</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <p className="min-w-0 flex-1 truncate rounded-xl px-3.5 py-2.5 font-mono text-xs" style={input}>{storeUrl}</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleCopy} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold sm:flex-none"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <Copy size={13} /> Copy
            </button>
            <a href={`/store/${slug}`} target="_blank" rel="noopener noreferrer" className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold sm:flex-none"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <ExternalLink size={13} /> View
            </a>
          </div>
        </div>
      </section>

      {/* Save bar: appears once something has changed */}
      {(dirty || saving) && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-lg"
          style={{ ...card, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading image…' : 'You have unsaved changes'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm(initial)} disabled={saving}
              className="h-9 rounded-xl px-4 text-xs font-semibold disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Discard
            </button>
            <button type="button" onClick={handleSave} disabled={saving || uploading || !!nameError}
              className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-black disabled:opacity-50"
              style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
