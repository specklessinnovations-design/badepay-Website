/**
 * Create or edit a store product or QR payment item.
 *   Type:    physical goods · service · donation & giving (tithes, offerings, fundraising)
 *   Pricing: fixed price, or the payer chooses (suggested amount + optional minimum)
 *   QR:      listed when someone scans the store's QR code, so they can say what they're paying for
 * Rules match the API (services/productRules.ts).
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Wrench, HandHeart } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { FileUpload } from '@/components/ui/file-upload';

export type ProductType = 'physical' | 'service' | 'donation';
export type ProductPricing = 'fixed' | 'open';

export interface MerchantProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ProductType;
  pricing: ProductPricing;
  price: number | string;
  minAmount: number | string | null;
  showOnQr: boolean;
  sortOrder?: number;
  stock: number;
  discount: number | string;
  deliveryInfo?: string | null;
  isActive: boolean;
  images?: { imageUrl: string }[];
  imageUrl?: string;
}

export const PRODUCT_TYPES: { value: ProductType; label: string; hint: string; icon: React.ElementType }[] = [
  { value: 'physical', label: 'Physical item', hint: 'Goods with stock and delivery', icon: Package },
  { value: 'service', label: 'Service', hint: 'Bookings, tickets, fees', icon: Wrench },
  { value: 'donation', label: 'Donation & giving', hint: 'Tithes, offerings, fundraising', icon: HandHeart },
];

export const productImage = (p: Pick<MerchantProduct, 'images' | 'imageUrl'>) => p.images?.[0]?.imageUrl ?? p.imageUrl ?? '';

export const priceLabel = (p: Pick<MerchantProduct, 'pricing' | 'price' | 'minAmount'>) => {
  const n = (v: number | string | null) => `₦${Number(v ?? 0).toLocaleString('en-NG')}`;
  if (p.pricing === 'fixed') return n(p.price);
  if (p.minAmount) return `Any amount from ${n(p.minAmount)}`;
  return Number(p.price) > 0 ? `Any amount · suggested ${n(p.price)}` : 'Any amount';
};

const field = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none';
const fieldStyle = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;
const labelCls = 'block text-xs font-semibold mb-1.5';

export function ProductEditor({ product, defaultType, onClose, onSaved }: {
  product: MerchantProduct | null;
  /** For a new item: start as this type (e.g. 'donation' from a church's "Add giving item") */
  defaultType?: ProductType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<ProductType>(product?.type ?? defaultType ?? 'physical');
  const [pricing, setPricing] = useState<ProductPricing>(product?.pricing ?? (defaultType === 'donation' ? 'open' : 'fixed'));
  const [f, setF] = useState({
    name: product?.name ?? '',
    description: product?.description === 'No description provided' ? '' : product?.description ?? '',
    category: product?.category ?? (defaultType === 'donation' ? 'Giving' : ''),
    price: product ? String(Number(product.price) || '') : '',
    minAmount: product?.minAmount ? String(Number(product.minAmount)) : '',
    stock: product ? String(product.stock) : '1',
    discount: product ? String(Number(product.discount) || 0) : '0',
    deliveryInfo: product?.deliveryInfo ?? '',
    showOnQr: product?.showOnQr ?? (defaultType === 'donation'),
    isActive: product?.isActive ?? true,
  });
  const [images, setImages] = useState<string[]>(product?.images?.map((i) => i.imageUrl) ?? []);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const pickType = (t: ProductType) => {
    setType(t);
    if (t === 'donation') { setPricing('open'); setF((x) => ({ ...x, showOnQr: true, category: x.category || 'Giving' })); }
  };

  const validate = (): string => {
    if (f.name.trim().length < 2) return 'Enter a name';
    if (f.category.trim().length < 2) return 'Enter a category';
    const price = Number(f.price || 0);
    const min = f.minAmount ? Number(f.minAmount) : null;
    if (pricing === 'fixed' && !(price > 0)) return 'Enter a price, or let people choose the amount';
    if (pricing === 'open' && min !== null && min < 10) return 'The minimum amount must be at least ₦10';
    if (pricing === 'open' && min !== null && price > 0 && price < min) return 'The suggested amount can’t be below the minimum';
    if (f.description.trim() && f.description.trim().length < 5) return 'Make the description at least 5 characters, or leave it empty';
    return '';
  };

  const save = async () => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setSaving(true);
    const body = {
      name: f.name.trim(),
      description: f.description.trim() || undefined,
      category: f.category.trim(),
      type,
      pricing,
      price: Number(f.price || 0),
      minAmount: pricing === 'open' && f.minAmount ? Number(f.minAmount) : null,
      showOnQr: f.showOnQr,
      ...(type === 'physical' ? { stock: Number(f.stock) || 0, deliveryInfo: f.deliveryInfo.trim().length >= 5 ? f.deliveryInfo.trim() : undefined } : {}),
      ...(pricing === 'fixed' && type !== 'donation' ? { discount: Math.min(100, Number(f.discount) || 0) } : {}),
      images: images.map((url) => ({ url })),
      ...(product ? { isActive: f.isActive } : {}),
    };
    try {
      if (product) await apiClient.patch(`/merchants/store/products/${product.id}`, body);
      else await apiClient.post('/merchants/store/products', body);
      onSaved();
    } catch (e) {
      setError((e as Error)?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Rendered at the top of the page: page containers use transforms, which would trap a fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }} role="dialog" aria-modal="true" aria-label={product ? 'Edit item' : 'New item'}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{product ? 'Edit item' : 'New item'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)' }}><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Type</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type">
              {PRODUCT_TYPES.map((t) => {
                const on = type === t.value;
                const Icon = t.icon;
                return (
                  <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => pickType(t.value)}
                    className="rounded-xl p-2.5 text-left transition-colors"
                    style={{ border: `1px solid ${on ? '#6fe8d6' : 'var(--border)'}`, background: on ? 'rgba(111,232,214,0.08)' : 'var(--surface-secondary)' }}>
                    <Icon size={16} style={{ color: on ? '#6fe8d6' : 'var(--text-secondary)' }} />
                    <span className="mt-1 block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                    <span className="block text-[10.5px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Name</span>
            <input className={field} style={fieldStyle} value={f.name} maxLength={80} placeholder={type === 'donation' ? 'e.g. Tithe, Offering, Building fund' : 'e.g. Choir T-shirt'} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Description <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></span>
            <textarea className={`${field} resize-none`} style={fieldStyle} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Category</span>
            <input className={field} style={fieldStyle} value={f.category} maxLength={40} placeholder="e.g. Giving, Events, Merchandise" onChange={(e) => setF({ ...f, category: e.target.value })} />
          </label>

          <div>
            <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Amount</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pricing">
              {([['fixed', 'Fixed price'], ['open', 'Payer chooses']] as const).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={pricing === v} onClick={() => setPricing(v)}
                  className="rounded-xl py-2 text-xs font-semibold"
                  style={{ border: `1px solid ${pricing === v ? '#6fe8d6' : 'var(--border)'}`, background: pricing === v ? 'rgba(111,232,214,0.08)' : 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
                  {l}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{pricing === 'fixed' ? 'Price (₦)' : 'Suggested (₦, optional)'}</span>
                <input className={field} style={fieldStyle} inputMode="decimal" type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
              </label>
              {pricing === 'open' ? (
                <label className="block">
                  <span className="mb-1 block text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Minimum (₦, optional)</span>
                  <input className={field} style={fieldStyle} inputMode="decimal" type="number" min={10} value={f.minAmount} onChange={(e) => setF({ ...f, minAmount: e.target.value })} />
                </label>
              ) : type !== 'donation' && (
                <label className="block">
                  <span className="mb-1 block text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Discount %</span>
                  <input className={field} style={fieldStyle} inputMode="numeric" type="number" min={0} max={100} value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} />
                </label>
              )}
            </div>
          </div>

          {type === 'physical' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Stock</span>
                <input className={field} style={fieldStyle} inputMode="numeric" type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
              </label>
              <label className="block">
                <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Delivery info</span>
                <input className={field} style={fieldStyle} value={f.deliveryInfo} placeholder="e.g. Pick up after service" onChange={(e) => setF({ ...f, deliveryInfo: e.target.value })} />
              </label>
            </div>
          )}

          <div>
            <span className={labelCls} style={{ color: 'var(--text-secondary)' }}>Images <span style={{ color: 'var(--text-tertiary)' }}>(up to 4)</span></span>
            <div className="space-y-3">
              {images.map((url, i) => (
                <FileUpload key={url} kind="product_image" shape="square" value={url}
                  onChange={(next) => setImages((xs) => (next ? xs.map((x, j) => (j === i ? next : x)) : xs.filter((_, j) => j !== i)))}
                  onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))} />
              ))}
              {images.length < 4 && (
                <FileUpload key={`new-${images.length}`} kind="product_image" shape="square" value=""
                  onChange={(url) => url && setImages((xs) => [...xs, url])}
                  onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))} />
              )}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#6fe8d6]" checked={f.showOnQr} onChange={(e) => setF({ ...f, showOnQr: e.target.checked })} />
            <span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Show when people scan my QR code</span>
              <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>They pick this, then pay in the RCCGPay app or by card. {type === 'donation' ? 'Giving items are only paid this way.' : ''}</span>
            </span>
          </label>
          {product && (
            <label className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" className="h-4 w-4 accent-[#6fe8d6]" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />
              Active (visible to customers)
            </label>
          )}
          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
        </div>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={save} disabled={saving || uploading > 0}
            className="h-11 w-full rounded-xl text-sm font-black disabled:opacity-60" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
            {uploading > 0 ? 'Uploading…' : saving ? 'Saving…' : product ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
