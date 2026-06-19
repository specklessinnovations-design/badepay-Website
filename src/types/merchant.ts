export type MerchantBusinessType = 'freelancer' | 'informal' | 'small' | 'registered' | 'ngo';
export type PayoutPreference = 'instant' | 'daily';

export interface MerchantProfile {
  businessType: MerchantBusinessType;
  businessName: string;
  tradingName: string;
  address: string;
  rcNumber: string;
  taxId: string;
  supportPhone: string;
  category: string;
  payoutPreference: PayoutPreference;
  payoutAccount: string;
  verified: boolean;
  merchantId: string;
  qrSlug: string;
  onboardingComplete: boolean;
}

export const MERCHANT_BUSINESS_TYPES = [
  { id: 'freelancer' as const, label: 'Freelancer', desc: 'Individual professional' },
  { id: 'informal' as const, label: 'Informal seller', desc: 'Market or street vendor' },
  { id: 'small' as const, label: 'Small business', desc: 'Up to 20 employees' },
  { id: 'registered' as const, label: 'Registered company', desc: 'CAC registered (RC/BN)' },
  { id: 'ngo' as const, label: 'NGO / Non-profit', desc: 'Registered non-profit' },
];

export const MERCHANT_CATEGORIES = [
  'Retail',
  'Food & beverages',
  'Fashion',
  'Beauty',
  'Logistics',
  'Education',
  'Health',
  'Services',
  'Digital products',
  'Other',
];

export function buildTradingSlug(tradingName: string, businessName: string): string {
  return (tradingName || businessName || 'merchant')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function generateMerchantId(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MID-${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function buildMerchantQrPayload(profile: Pick<MerchantProfile, 'businessName' | 'tradingName' | 'merchantId' | 'qrSlug'>) {
  return JSON.stringify({
    type: 'badepay_merchant',
    merchantId: profile.merchantId,
    merchantName: profile.tradingName || profile.businessName,
    slug: profile.qrSlug,
    url: `https://badepay.ng/m/${profile.qrSlug}`,
  });
}
