import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { PublicPageLayout, LEGAL_LINKS } from "./PublicPageLayout";
import { COMPANY } from "@/content/legal/company";

export type LegalBlock =
  | { p: string }
  | { h: string }
  | { list: string[] }
  | { callout: string }
  | { link: { href: string; label: string } }
  | { contact: true };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocumentProps {
  title: string;
  eyebrow?: string;
  intro: string[];
  sections: LegalSection[];
  path: string;
  /** Optional content rendered above the first section. */
  lead?: React.ReactNode;
  showRelated?: boolean;
}

function ContactCard() {
  return (
    <div className="ld-contact">
      <p style={{ color: "#fff", fontWeight: 600, margin: "0 0 10px" }}>{COMPANY.name}</p>
      <p><span>Email:</span> <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
      <p><span>Website:</span> <a href={COMPANY.websiteUrl} target="_blank" rel="noreferrer">{COMPANY.website}</a></p>
      <p><span>Address:</span> {COMPANY.address}</p>
    </div>
  );
}

function renderBlock(block: LegalBlock, i: number) {
  if ("p" in block) return <p key={i} className="ld-p">{block.p}</p>;
  if ("h" in block) return <h3 key={i} className="ld-h3" style={{ color: "#fff" }}>{block.h}</h3>;
  if ("list" in block) return <ul key={i} className="ld-ul">{block.list.map(item => <li key={item}>{item}</li>)}</ul>;
  if ("callout" in block) return <div key={i} className="ld-callout">{block.callout}</div>;
  if ("link" in block) return <Link key={i} href={block.link.href} className="ld-link">{block.link.label} →</Link>;
  return <ContactCard key={i} />;
}

/** Renders a long-form legal document with a sticky table of contents. */
export function LegalDocument({ title, eyebrow = "Legal", intro, sections, path, lead, showRelated = true }: LegalDocumentProps) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" }
    );
    sections.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  const related = LEGAL_LINKS.filter(l => l.href !== path && l.href !== "/legal");

  return (
    <PublicPageLayout title={title}>
      <style>{`
        .ld-hero { max-width:1200px; margin:0 auto; padding:72px 48px 40px; }
        .ld-wrap { max-width:1200px; margin:0 auto; padding:0 48px 80px; display:grid; grid-template-columns:240px 1fr; gap:56px; align-items:start; }
        .ld-toc { position:sticky; top:96px; max-height:calc(100vh - 120px); overflow-y:auto; padding-right:8px; scrollbar-width:thin; }
        .ld-toc a { display:block; font-size:13px; line-height:1.4; color:rgba(255,255,255,0.4); padding:7px 0 7px 14px; border-left:2px solid rgba(255,255,255,0.06); transition:all 0.2s; }
        .ld-toc a:hover { color:rgba(255,255,255,0.8); }
        .ld-toc a.active { color:#6fe8d6; border-left-color:#6fe8d6; }
        .ld-body { min-width:0; max-width:760px; }
        .ld-section { scroll-margin-top:96px; padding:28px 0; border-top:1px solid rgba(255,255,255,0.06); }
        .ld-section:first-child { border-top:none; padding-top:0; }
        .ld-h2 { font-size:22px; font-weight:600; margin:0 0 16px; letter-spacing:-0.2px; }
        .ld-h3 { font-size:16px; font-weight:600; margin:22px 0 10px; }
        .ld-p { font-size:15px; line-height:1.75; margin:0 0 14px; color:rgba(255,255,255,0.68); }
        .ld-ul { margin:0 0 16px; padding:0; list-style:none; display:grid; gap:8px; }
        .ld-ul li { position:relative; padding-left:22px; font-size:15px; line-height:1.6; color:rgba(255,255,255,0.68); }
        .ld-ul li::before { content:''; position:absolute; left:4px; top:10px; width:6px; height:6px; border-radius:50%; background:#6fe8d6; opacity:0.75; }
        .ld-callout { margin:8px 0 16px; padding:16px 20px; border-radius:14px; background:rgba(111,232,214,0.07); border:1px solid rgba(111,232,214,0.22); color:#fff; font-weight:600; font-size:15px; line-height:1.6; }
        .ld-link { display:inline-block; margin:0 0 14px; color:#6fe8d6; font-weight:600; font-size:14px; }
        .ld-link:hover { text-decoration:underline; }
        .ld-contact { margin:6px 0 10px; padding:20px 22px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); }
        .ld-contact p { margin:0 0 6px; font-size:14px; line-height:1.6; color:rgba(255,255,255,0.7); }
        .ld-contact span { color:rgba(255,255,255,0.4); }
        .ld-contact a { color:#6fe8d6; }
        .ld-related { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin-top:16px; }
        .ld-related a { padding:16px 18px; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); color:#fff; font-size:14px; font-weight:500; transition:all 0.2s; }
        .ld-related a:hover { border-color:rgba(111,232,214,0.4); background:rgba(111,232,214,0.05); }
        @media (max-width: 960px) {
          .ld-hero { padding:44px 16px 24px; }
          .ld-wrap { grid-template-columns:1fr; padding:0 16px 56px; gap:0; }
          .ld-toc { display:none; }
        }
      `}</style>

      <header className="ld-hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(111,232,214,0.08)", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe8d6" }} />
          <span style={{ color: "#6fe8d6", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{eyebrow}</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(34px,4.6vw,56px)", fontWeight: 300, lineHeight: 1.08, margin: "0 0 14px" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 24px" }}>Last updated: {COMPANY.lastUpdated}</p>
        <div style={{ maxWidth: 760 }}>
          {intro.map(t => <p key={t} className="ld-p" style={{ fontSize: 16 }}>{t}</p>)}
        </div>
      </header>

      <div className="ld-wrap">
        <aside className="ld-toc" aria-label="On this page">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", margin: "0 0 12px" }}>On this page</p>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? "active" : ""}
              onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>
              {s.title}
            </a>
          ))}
        </aside>

        <article className="ld-body">
          {lead}
          {sections.map(s => (
            <section key={s.id} id={s.id} className="ld-section">
              <h2 className="ld-h2" style={{ color: "#fff" }}>{s.title}</h2>
              {s.blocks.map(renderBlock)}
            </section>
          ))}

          {showRelated && (
            <section className="ld-section">
              <h2 className="ld-h2" style={{ color: "#fff" }}>Related documents</h2>
              <div className="ld-related">
                {related.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
              </div>
            </section>
          )}
        </article>
      </div>
    </PublicPageLayout>
  );
}
