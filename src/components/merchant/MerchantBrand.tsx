/**
 * The merchant's own brand (store logo + trading name), used in place of the BadePay logo across
 * the merchant portal so it looks like their dashboard. Falls back to initials when there's no logo.
 */
import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMerchantStoreData } from '@/store/useMerchantStoreData';

export function useMerchantBrand() {
  const user = useAuthStore(s => s.user);
  const store = useMerchantStoreData(s => (user ? s.stores[user.id] : undefined)) as { logoUrl?: string; name?: string } | undefined;
  useEffect(() => {
    if (user?.id && !store) void useMerchantStoreData.getState().fetchStore(user.id);
  }, [user?.id, store]);
  const name = user?.merchantProfile?.tradingName || user?.merchantProfile?.businessName || store?.name || user?.firstName || 'Merchant';
  return { name, logoUrl: store?.logoUrl || undefined };
}

export const initialsOf = (name: string) =>
  name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'B';

/** Square logo tile: the merchant's logo, or their initials on the brand colour. */
export function MerchantMark({ name, logoUrl, size = 40, className = '' }: { name: string; logoUrl?: string; size?: number; className?: string }) {
  const radius = Math.round(size * 0.28);
  return logoUrl ? (
    <img src={logoUrl} alt={`${name} logo`} className={`shrink-0 object-cover ${className}`}
      style={{ width: size, height: size, borderRadius: radius, background: '#fff', border: '1px solid var(--border)' }} />
  ) : (
    <div aria-hidden className={`flex shrink-0 items-center justify-center font-black ${className}`}
      style={{ width: size, height: size, borderRadius: radius, background: '#0d6b5e', color: '#ffffff', fontSize: Math.round(size * 0.36) }}>
      {initialsOf(name)}
    </div>
  );
}
