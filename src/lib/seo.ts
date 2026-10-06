/**
 * Central SEO config. Used server-side by the TanStack route `head()` (so crawlers and
 * link-preview bots get per-page tags in the initial HTML) and client-side by <SeoManager />
 * (so titles update on in-app navigation).
 */

export const SITE_NAME = "BadePay";
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || "https://www.badepay.com").replace(/\/$/, "");
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_ALT = "BadePay — Scan. Pay. Done. Fast, secure QR payments for Nigeria.";
export const TWITTER_HANDLE = "@badepay";
export const THEME_COLOR = "#0e0e0e";

const DEFAULT_DESCRIPTION =
  "BadePay is Nigeria's fast, secure QR payment platform. Scan a QR code and pay in naira, send money, pay bills, and accept payments as a merchant — no POS machine needed.";

export interface PageSeo {
  /** Page name, shown first in the browser tab: "<title> | BadePay". */
  title: string;
  description: string;
  /** Keep out of search results (private/app pages). */
  noindex?: boolean;
  /** Use the title as-is without the " | BadePay" suffix. */
  rawTitle?: boolean;
}

const PRIVATE_DESCRIPTION = "Sign in to your BadePay account to manage payments, transfers, and more.";
const priv = (title: string): PageSeo => ({ title, description: PRIVATE_DESCRIPTION, noindex: true });

export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    title: "BadePay — Fast, Secure QR Payments in Nigeria",
    rawTitle: true,
    description: DEFAULT_DESCRIPTION,
  },

  // Public pages
  "/contact": { title: "Contact Us", description: "Get in touch with BadePay for account support, payment issues, merchant enquiries, privacy requests, and partnerships. Email hello@badepay.com or visit us in Lekki Phase 1, Lagos." },
  "/legal": { title: "Legal", description: "Access BadePay's legal terms, policies, and notices — Terms & Conditions, Privacy Policy, Cookie Policy, AML & KYC Policy, and Refund & Dispute Policy." },
  "/privacy": { title: "Privacy Policy", description: "Learn how BadePay collects, uses, shares, stores, and protects your personal information, and the privacy rights available to you under Nigerian law." },
  "/terms": { title: "Terms & Conditions", description: "The Terms & Conditions governing your use of the BadePay app, website, QR payments, and merchant services." },
  "/cookies": { title: "Cookie Policy", description: "How BadePay uses cookies and similar technologies on its website and digital services, and how you can manage your choices." },
  "/aml-kyc": { title: "AML & KYC Policy", description: "BadePay's Anti-Money Laundering and Know Your Customer procedures — identity verification, transaction monitoring, and sanctions screening." },
  "/refunds": { title: "Refund & Dispute Policy", description: "How to report a payment issue, request a refund, or raise a transaction dispute with BadePay." },
  "/login": { title: "Log In", description: "Log in to your BadePay account to scan and pay, send money, pay bills, and manage your wallet." },
  "/register": { title: "Create Account", description: "Create a free BadePay account in minutes. Pay with QR codes, send money, and accept payments for your business across Nigeria." },

  // Auth flow (not useful in search results)
  "/forgot-password": priv("Forgot Password"),
  "/reset-password": priv("Reset Password"),
  "/verify-otp": priv("Verify OTP"),
  "/set-pin": priv("Set PIN"),

  // Customer dashboard
  "/dashboard": priv("Dashboard"),
  "/activity": priv("Activity"),
  "/add-money": priv("Add Money"),
  "/bills": priv("Pay Bills"),
  "/cards": priv("Cards"),
  "/history": priv("Transaction History"),
  "/scan": priv("Scan to Pay"),
  "/stores": priv("Stores"),
  "/transfer": priv("Transfer"),
  "/transaction/success": priv("Transaction Successful"),
  "/transaction/failed": priv("Transaction Failed"),
  "/transaction/detail": priv("Transaction Details"),
  "/profile": priv("Profile"),
  "/profile/edit": priv("Edit Profile"),
  "/profile/security": priv("Security"),
  "/profile/kyc": priv("Identity Verification"),
  "/profile/devices": priv("Devices"),
  "/profile/notifications": priv("Notification Settings"),
  "/profile/support": priv("Help & Support"),
  "/profile/statements": priv("Statements"),
  "/profile/change-pin": priv("Change PIN"),
  "/profile/change-password": priv("Change Password"),
  "/profile/my-qr": priv("My QR Code"),
  "/ai": priv("AI Assistant"),
  "/explore-nigeria": priv("Explore Nigeria"),
  "/video": priv("Videos"),
  "/insights": priv("Insights"),
  "/marketplace": priv("Marketplace"),
  "/savings": priv("Savings"),
  "/news": priv("News"),

  // Admin
  "/admin": priv("Admin Dashboard"),
  "/admin/login": priv("Admin Login"),
  "/admin/dashboard": priv("Admin Dashboard"),
  "/admin/users": priv("Users · Admin"),
  "/admin/merchants": priv("Merchants · Admin"),
  "/admin/transactions": priv("Transactions · Admin"),
  "/admin/bills": priv("Bills · Admin"),
  "/admin/kyc": priv("KYC Reviews · Admin"),
  "/admin/disputes": priv("Disputes · Admin"),
  "/admin/analytics": priv("Analytics · Admin"),
  "/admin/settings": priv("Settings · Admin"),
  "/admin/explore-nigeria": priv("Explore Nigeria · Admin"),

  // Merchant
  "/merchant": priv("Merchant Dashboard"),
  "/merchant/onboarding": priv("Merchant Onboarding"),
  "/merchant/payments": priv("Payments · Merchant"),
  "/merchant/qr": priv("QR Code · Merchant"),
  "/merchant/settlements": priv("Settlements · Merchant"),
  "/merchant/store": priv("My Store · Merchant"),
  "/merchant/orders": priv("Orders · Merchant"),
};

/** Public, indexable paths — used for the sitemap. */
export const PUBLIC_PATHS = Object.entries(PAGE_SEO).filter(([, s]) => !s.noindex).map(([p]) => p);

function titleCase(slug: string) {
  return decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/** Resolve SEO data for any pathname, including dynamic routes. */
export function getPageSeo(pathname: string): PageSeo {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (PAGE_SEO[path]) return PAGE_SEO[path];

  const store = path.match(/^\/store\/([^/]+)$/);
  if (store) {
    const name = titleCase(store[1]);
    return { title: `${name} Store`, description: `Shop from ${name} and pay securely with BadePay — fast QR and card payments in naira.` };
  }
  if (/^\/admin\/users\/[^/]+$/.test(path)) return priv("User Details · Admin");
  if (/^\/admin\/merchants\/[^/]+$/.test(path)) return priv("Merchant Details · Admin");

  return { title: "Page Not Found", description: DEFAULT_DESCRIPTION, noindex: true };
}

export function formatTitle(seo: PageSeo) {
  return seo.rawTitle ? seo.title : `${seo.title} | ${SITE_NAME}`;
}

export type MetaTag = { title: string } | { name: string; content: string } | { property: string; content: string };

/** Meta tags for a page, in TanStack Router `head().meta` shape. */
export function buildMeta(pathname: string): MetaTag[] {
  const seo = getPageSeo(pathname);
  const title = formatTitle(seo);
  const path = pathname.split(/[?#]/)[0] || "/";
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return [
    { title },
    { name: "description", content: seo.description },
    { name: "robots", content: seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_NG" },
    { property: "og:title", content: title },
    { property: "og:description", content: seo.description },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:secure_url", content: OG_IMAGE },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: OG_IMAGE_ALT },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: OG_IMAGE },
    { name: "twitter:image:alt", content: OG_IMAGE_ALT },
  ];
}

export function canonicalUrl(pathname: string) {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/** Organization + WebSite structured data for the home page. */
export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: "hello@badepay.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "17A, Rahman Adeboyejo Street, Lekki Phase 1",
        addressLocality: "Lagos",
        addressRegion: "Lagos State",
        addressCountry: "NG",
      },
      contactPoint: { "@type": "ContactPoint", email: "hello@badepay.com", contactType: "customer support", areaServed: "NG", availableLanguage: "English" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-NG",
    },
  ],
};
