import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Plus, Edit3, Trash2, Eye, EyeOff, Package, Tag,
  Image as ImageIcon, X, Check, ChevronDown, Globe, Lock,
  AlertCircle, ShoppingBag, Upload, Star, Percent
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMerchantStoreData, type Product } from '@/store/useMerchantStoreData';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';

const PRODUCT_CATEGORIES = [
  'All', 'Clothing', 'Food & Drinks', 'Electronics', 'Beauty', 'Home & Living',
  'Books', 'Health', 'Services', 'Digital', 'Other'
];

const PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/product-a/400/400',
  'https://picsum.photos/seed/product-b/400/400',
  'https://picsum.photos/seed/product-c/400/400',
  'https://picsum.photos/seed/product-d/400/400',
  'https://picsum.photos/seed/product-e/400/400',
];

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Product>;
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [stock, setStock] = useState(initial?.stock?.toString() || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [discount, setDiscount] = useState(initial?.discount?.toString() || '0');
  const [variants, setVariants] = useState(initial?.variants?.join(', ') || '');
  const [imgPickerOpen, setImgPickerOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const isValid = name.trim() && parseFloat(price) > 0 && parseInt(stock) >= 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      imageUrl: imageUrl || PLACEHOLDER_IMAGES[0],
      discount: parseFloat(discount) || 0,
      variants: variants.split(',').map(v => v.trim()).filter(Boolean),
      isActive: initial?.isActive ?? true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 10 }}
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
          {initial?.id ? 'Edit Product' : 'Add New Product'}
        </h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg"
          style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>
          <X size={14} />
        </button>
      </div>

      {/* Product image */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest mb-2 block"
          style={{ color: 'var(--text-tertiary)' }}>Product Photo</label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
        />

        {imageUrl ? (
          /* Preview with change/remove */
          <div className="relative rounded-2xl overflow-hidden"
            style={{ height: 140, background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <img src={imageUrl} alt="product" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black"
                style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                <Upload size={12} /> Change
              </button>
              <button
                type="button"
                onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        ) : (
          /* Upload dropzone */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChange(e.dataTransfer.files?.[0] ?? null);
            }}
            className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 transition-all"
            style={{
              background: isDragging ? 'rgba(111,232,214,0.08)' : 'var(--surface-secondary)',
              border: `2px dashed ${isDragging ? '#6fe8d6' : 'var(--border)'}`,
            }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(111,232,214,0.1)' }}>
              <Upload size={18} style={{ color: '#6fe8d6' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                Upload a photo
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Click or drag & drop · JPG, PNG, WebP · Max 5 MB
              </p>
            </div>
          </button>
        )}

        {/* Sample images fallback */}
        <div className="mt-2">
          <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Or pick a sample:
          </p>
          <div className="flex gap-1.5">
            {PLACEHOLDER_IMAGES.map((url, i) => (
              <button key={i} type="button" onClick={() => setImageUrl(url)}
                className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 transition-all"
                style={{ border: imageUrl === url ? '2px solid #6fe8d6' : '2px solid var(--border)' }}>
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Upload error */}
        {uploadError && (
          <p className="mt-1.5 text-xs font-medium" style={{ color: '#f87171' }}>{uploadError}</p>
        )}
      </div>

      {/* Name + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-tertiary)' }}>Product Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blue Sneakers"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-tertiary)' }}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none appearance-none cursor-pointer"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {PRODUCT_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-tertiary)' }}>Price (₦) *</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="0" type="number" min="0"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-tertiary)' }}>Stock Qty *</label>
          <input value={stock} onChange={e => setStock(e.target.value)} placeholder="0" type="number" min="0"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      {/* Discount + Variants */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-tertiary)' }}>Discount (%)</label>
          <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" type="number" min="0" max="100"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
            style={{ color: 'var(--text-tertiary)' }}>Variants</label>
          <input value={variants} onChange={e => setVariants(e.target.value)} placeholder="Red, Blue, XL…"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
          style={{ color: 'var(--text-tertiary)' }}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe your product…" rows={2}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
          style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all active:scale-95 disabled:opacity-40"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          <Check size={14} /> {initial?.id ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </motion.div>
  );
}

export default function MerchantStorePage() {
  const user = useAuthStore(s => s.user);
  const {
    stores, products, upsertStore, addProduct, updateProduct,
    deleteProduct, publishStore, unpublishStore,
  } = useMerchantStoreData();

  const merchantId = user?.id || '';
  const storeInfo = stores[merchantId];
  const storeProducts = products[merchantId] || [];

  const [activeTab, setActiveTab] = useState<'info' | 'products'>('products');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [searchQ, setSearchQ] = useState('');

  const [storeName, setStoreName] = useState(
    storeInfo?.name || user?.merchantProfile?.tradingName || ''
  );
  const [storeDesc, setStoreDesc] = useState(storeInfo?.description || '');
  const [storeBanner, setStoreBanner] = useState(storeInfo?.bannerUrl || '');
  const [storeCategory, setStoreCategory] = useState(
    storeInfo?.category || user?.merchantProfile?.category || ''
  );

  const isPublished = storeInfo?.isPublished ?? false;

  const handleSaveInfo = () => {
    upsertStore(merchantId, {
      name: storeName,
      description: storeDesc,
      bannerUrl: storeBanner,
      category: storeCategory,
      logoUrl: storeInfo?.logoUrl || '',
      isPublished: storeInfo?.isPublished ?? false,
      slug: user?.merchantProfile?.qrSlug || merchantId,
    });
    toast.success('Store info saved!');
  };

  const handlePublish = () => {
    if (!storeName.trim()) { toast.error('Add a store name first'); return; }
    if (storeProducts.length === 0) { toast.error('Add at least one product'); return; }
    if (isPublished) {
      unpublishStore(merchantId);
      toast.success('Store unpublished');
    } else {
      upsertStore(merchantId, {
        name: storeName,
        description: storeDesc,
        bannerUrl: storeBanner,
        category: storeCategory,
        logoUrl: storeInfo?.logoUrl || '',
        isPublished: true,
        slug: user?.merchantProfile?.qrSlug || merchantId,
      });
      publishStore(merchantId);
      toast.success('🎉 Store is now live!');
    }
  };

  const handleAddProduct = (data: Omit<Product, 'id' | 'createdAt'>) => {
    addProduct(merchantId, data);
    setShowForm(false);
    toast.success('Product added!');
  };

  const handleUpdateProduct = (data: Omit<Product, 'id' | 'createdAt'>) => {
    if (!editProduct) return;
    updateProduct(merchantId, editProduct.id, data);
    setEditProduct(null);
    toast.success('Product updated!');
  };

  const handleDelete = (p: Product) => {
    deleteProduct(merchantId, p.id);
    toast.success(`"${p.name}" removed`);
  };

  const filtered = storeProducts.filter(p => {
    const matchCat = filterCat === 'All' || p.category === filterCat;
    const matchQ = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  const activeCount = storeProducts.filter(p => p.isActive).length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>My Store</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {storeProducts.length} product{storeProducts.length !== 1 ? 's' : ''} · {activeCount} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <a
              href={`/store/${user?.merchantProfile?.qrSlug || merchantId}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Globe size={13} /> Preview Store
            </a>
          )}
          <button onClick={handlePublish}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95"
            style={{
              background: isPublished ? 'rgba(248,113,113,0.12)' : '#6fe8d6',
              color: isPublished ? '#f87171' : '#1a1a1a',
              border: isPublished ? '1px solid rgba(248,113,113,0.2)' : 'none',
            }}>
            {isPublished ? <><Lock size={13} /> Unpublish</> : <><Globe size={13} /> Publish Store</>}
          </button>
        </div>
      </motion.div>

      {/* ── Status banner ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: isPublished ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${isPublished ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isPublished ? 'bg-[#34d399] animate-pulse' : 'bg-[#f59e0b]'}`} />
          <p className="text-xs font-bold" style={{ color: isPublished ? '#34d399' : '#f59e0b' }}>
            {isPublished
              ? `Your store is LIVE at badepay.ng/m/${user?.merchantProfile?.qrSlug || 'your-store'}`
              : 'Store is unpublished — customers cannot see it yet. Add products and publish to go live.'}
          </p>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {(['products', 'info'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="rounded-lg px-4 py-1.5 text-xs font-black capitalize transition-all"
            style={{
              background: activeTab === tab ? '#6fe8d6' : 'transparent',
              color: activeTab === tab ? '#1a1a1a' : 'var(--text-secondary)',
            }}>
            {tab === 'products' ? `Products (${storeProducts.length})` : 'Store Info'}
          </button>
        ))}
      </div>

      {/* ── Store Info Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Store Details</h3>

              {/* Banner preview */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block"
                  style={{ color: 'var(--text-tertiary)' }}>Banner Image</label>
                <div className="h-32 rounded-2xl overflow-hidden mb-2 relative"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  {storeBanner
                    ? <img src={storeBanner} alt="banner" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                        <Upload size={20} style={{ color: 'var(--text-tertiary)' }} />
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paste a URL below</p>
                      </div>
                  }
                </div>
                <input value={storeBanner} onChange={e => setStoreBanner(e.target.value)}
                  placeholder="https://... banner image URL"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                    style={{ color: 'var(--text-tertiary)' }}>Store Name</label>
                  <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="My Awesome Store"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                    style={{ color: 'var(--text-tertiary)' }}>Category</label>
                  <select value={storeCategory} onChange={e => setStoreCategory(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none appearance-none cursor-pointer"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {PRODUCT_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                  style={{ color: 'var(--text-tertiary)' }}>Store Description</label>
                <textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} rows={3}
                  placeholder="Tell customers what you sell…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <button onClick={handleSaveInfo}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all active:scale-95"
                style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                <Check size={15} /> Save Store Info
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Products Tab ── */}
        {activeTab === 'products' && (
          <motion.div key="products" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Add product form */}
            <AnimatePresence>
              {showForm && !editProduct && (
                <ProductForm onSave={handleAddProduct} onCancel={() => setShowForm(false)} />
              )}
              {editProduct && (
                <ProductForm
                  key={editProduct.id}
                  initial={editProduct}
                  onSave={handleUpdateProduct}
                  onCancel={() => setEditProduct(null)}
                />
              )}
            </AnimatePresence>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <Package size={14} style={{ color: 'var(--text-tertiary)' }} />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search products…" className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {PRODUCT_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all"
                    style={{
                      background: filterCat === c ? '#6fe8d6' : 'transparent',
                      color: filterCat === c ? '#1a1a1a' : 'var(--text-secondary)',
                    }}>{c}</button>
                ))}
              </div>
              {!showForm && !editProduct && (
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all active:scale-95 flex-shrink-0"
                  style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                  <Plus size={14} /> Add Product
                </button>
              )}
            </div>

            {/* Product grid */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4 accent-icon-wrap">
                  <ShoppingBag size={28} style={{ color: 'var(--accent-text)' }} />
                </div>
                <p className="text-sm font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                  {storeProducts.length === 0 ? 'No products yet' : 'No products match filter'}
                </p>
                <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                  {storeProducts.length === 0
                    ? 'Add your first product to start selling'
                    : 'Try a different category or search term'}
                </p>
                {storeProducts.length === 0 && (
                  <button onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all active:scale-95"
                    style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                    <Plus size={15} /> Add First Product
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map((product, i) => {
                    const discountedPrice = product.discount > 0
                      ? product.price * (1 - product.discount / 100)
                      : product.price;
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-2xl overflow-hidden group"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                      >
                        {/* Product image */}
                        <div className="relative h-44 overflow-hidden"
                          style={{ background: 'var(--surface-secondary)' }}>
                          {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            : <div className="h-full w-full flex items-center justify-center">
                                <Package size={32} style={{ color: 'var(--text-tertiary)' }} />
                              </div>
                          }
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {product.discount > 0 && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={{ background: '#f59e0b', color: '#1a1a1a' }}>
                                -{product.discount}%
                              </span>
                            )}
                            {product.stock <= 5 && product.stock > 0 && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={{ background: 'rgba(248,113,113,0.9)', color: '#fff' }}>
                                Low stock
                              </span>
                            )}
                            {product.stock === 0 && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                                Out of stock
                              </span>
                            )}
                          </div>
                          {/* Toggle active */}
                          <button
                            onClick={() => updateProduct(merchantId, product.id, { isActive: !product.isActive })}
                            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full transition-all"
                            style={{
                              background: product.isActive ? 'rgba(52,211,153,0.9)' : 'rgba(0,0,0,0.6)',
                              color: '#fff',
                            }}>
                            {product.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <p className="text-sm font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {product.name}
                              </p>
                              <p className="text-[10px] mt-0.5 font-bold" style={{ color: 'var(--text-tertiary)' }}>
                                {product.category}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-black" style={{ color: 'var(--accent-text)' }}>
                                {formatNGN(discountedPrice)}
                              </p>
                              {product.discount > 0 && (
                                <p className="text-[10px] line-through" style={{ color: 'var(--text-tertiary)' }}>
                                  {formatNGN(product.price)}
                                </p>
                              )}
                            </div>
                          </div>

                          {product.description && (
                            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                              {product.description}
                            </p>
                          )}

                          {product.variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.variants.slice(0, 3).map(v => (
                                <span key={v} className="text-[10px] rounded-full px-2 py-0.5 font-bold"
                                  style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>
                                  {v}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3"
                            style={{ borderTop: '1px solid var(--border)' }}>
                            <span className="text-xs font-bold" style={{ color: product.stock > 5 ? 'var(--text-tertiary)' : '#f59e0b' }}>
                              {product.stock} in stock
                            </span>
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditProduct(product); setShowForm(false); }}
                                className="h-7 w-7 flex items-center justify-center rounded-lg transition-all active:scale-95"
                                style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                                <Edit3 size={12} />
                              </button>
                              <button onClick={() => handleDelete(product)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg transition-all active:scale-95"
                                style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
