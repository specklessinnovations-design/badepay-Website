import React, { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { COMPANY } from "@/content/legal/company";

export const LEGAL_LINKS = [
  { href: "/legal", label: "Legal" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/aml-kyc", label: "AML & KYC Policy" },
  { href: "/refunds", label: "Refund & Dispute Policy" },
];

const NAV_LINKS = [
  { href: "/legal", label: "Legal" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

interface PublicPageLayoutProps {
  children: ReactNode;
  title: string;
}

/** Dark marketing-style shell shared by the public legal & contact pages. */
export function PublicPageLayout({ children, title }: PublicPageLayoutProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [title, location]);

  return (
    <div className="bp-public">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
      <style>{`
        .bp-public { min-height:100vh; background:linear-gradient(170deg,#161616 0%,#0e0e0e 55%,#0a1408 100%); color:rgba(255,255,255,0.72); font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; }
        .bp-public a { text-decoration:none; }
        .bp-nav { position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; padding:16px 48px; background:rgba(14,14,14,0.85); backdrop-filter:blur(14px); border-bottom:1px solid rgba(255,255,255,0.06); }
        .bp-nav-a { color:rgba(255,255,255,0.55); font-size:14px; transition:color 0.2s; }
        .bp-nav-a:hover, .bp-nav-a.active { color:#6fe8d6; }
        .bp-btn-lime { background:#6fe8d6; color:#1a1a1a; border:none; padding:9px 22px; border-radius:50px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.25s; display:inline-block; }
        .bp-btn-lime:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(111,232,214,0.35); }
        .bp-btn-ghost { background:transparent; color:rgba(255,255,255,0.65); border:1px solid rgba(255,255,255,0.15); padding:9px 22px; border-radius:50px; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.25s; display:inline-block; }
        .bp-btn-ghost:hover { color:#fff; border-color:rgba(255,255,255,0.35); background:rgba(255,255,255,0.05); }
        .bp-menu-btn { display:none; background:transparent; border:none; cursor:pointer; padding:6px; color:#fff; }
        .bp-mobile-menu { display:none; }
        .bp-footer { border-top:1px solid rgba(255,255,255,0.06); padding:48px 48px 28px; margin-top:auto; }
        .bp-footer-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:40px; }
        .bp-footer h4 { color:#fff; font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; margin:0 0 14px; }
        .bp-footer-a { display:block; color:rgba(255,255,255,0.45); font-size:13px; padding:4px 0; transition:color 0.2s; }
        .bp-footer-a:hover { color:#6fe8d6; }
        @media (max-width: 860px) {
          .bp-nav { padding:14px 16px; }
          .bp-nav-links, .bp-nav-cta { display:none !important; }
          .bp-menu-btn { display:block; }
          .bp-mobile-menu { display:flex; flex-direction:column; gap:4px; padding:8px 16px 18px; background:rgba(14,14,14,0.97); border-bottom:1px solid rgba(255,255,255,0.06); position:sticky; top:65px; z-index:49; }
          .bp-mobile-menu a { color:rgba(255,255,255,0.7); font-size:16px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
          .bp-footer { padding:36px 16px 24px; }
          .bp-footer-grid { grid-template-columns:1fr; gap:28px; }
        }
      `}</style>

      <nav className="bp-nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/favicon.png" alt="BadePay" style={{ height: 34, width: "auto", objectFit: "contain" }} />
          <span style={{ fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>BadePay</span>
        </Link>
        <div className="bp-nav-links" style={{ display: "flex", gap: 30 }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className={`bp-nav-a${location === l.href ? " active" : ""}`}>{l.label}</Link>
          ))}
        </div>
        <div className="bp-nav-cta" style={{ display: "flex", gap: 10 }}>
          <Link href="/login"><button className="bp-btn-ghost">Log In</button></Link>
          <Link href="/register"><button className="bp-btn-lime">Get Started</button></Link>
        </div>
        <button className="bp-menu-btn" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>
      {menuOpen && (
        <div className="bp-mobile-menu">
          {NAV_LINKS.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          <Link href="/login">Log In</Link>
          <Link href="/register" style={{ color: "#6fe8d6" }}>Get Started</Link>
        </div>
      )}

      <main style={{ flex: 1 }}>{children}</main>

      <footer className="bp-footer">
        <div className="bp-footer-grid">
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src="/favicon.png" alt="BadePay" style={{ height: 28, width: "auto" }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>BadePay</span>
            </Link>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", maxWidth: 320, margin: 0 }}>
              {COMPANY.address}
            </p>
            <a href={`mailto:${COMPANY.email}`} className="bp-footer-a" style={{ marginTop: 8 }}>{COMPANY.email}</a>
          </div>
          <div>
            <h4>Legal</h4>
            {LEGAL_LINKS.map(l => <Link key={l.href} href={l.href} className="bp-footer-a">{l.label}</Link>)}
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/" className="bp-footer-a">Home</Link>
            <Link href="/contact" className="bp-footer-a">Contact Us</Link>
            <Link href="/login" className="bp-footer-a">Log In</Link>
            <Link href="/register" className="bp-footer-a">Create Account</Link>
          </div>
        </div>
        <p style={{ maxWidth: 1200, margin: "36px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} BadePay. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
