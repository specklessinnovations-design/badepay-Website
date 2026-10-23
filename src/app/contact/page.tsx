import React, { useState } from "react";
import { Link } from "wouter";
import { Mail, MapPin, Globe, ShieldCheck, Send } from "lucide-react";
import { PublicPageLayout } from "@/components/legal/PublicPageLayout";
import { COMPANY } from "@/content/legal/company";

const TOPICS = [
  "General enquiry",
  "Account support",
  "Payment or transaction issue",
  "Refund or dispute",
  "Merchant / business enquiry",
  "Privacy or data request",
  "Legal or compliance",
  "Partnerships",
];

const MAP_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(COMPANY.address)}&z=16&output=embed`;

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [sent, setSent] = useState(false);

  const update = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[${form.topic}] Message from ${form.name}`;
    const body = `${form.message}\n\n—\nName: ${form.name}\nEmail: ${form.email}`;
    window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const cards = [
    { icon: Mail, label: "Email us", value: COMPANY.email, href: `mailto:${COMPANY.email}`, hint: "For support, legal, privacy, and general enquiries" },
    { icon: MapPin, label: "Visit us", value: COMPANY.address, href: COMPANY.mapsUrl, hint: "Registered business address" },
    { icon: Globe, label: "Website", value: COMPANY.website, href: COMPANY.websiteUrl },
  ];

  return (
    <PublicPageLayout title="Contact Us">
      <style>{`
        .ct-wrap { max-width:1200px; margin:0 auto; padding:72px 48px 80px; }
        .ct-grid { display:grid; grid-template-columns:1fr 1.15fr; gap:32px; align-items:start; margin-top:44px; }
        .ct-card { display:flex; gap:16px; padding:20px; border-radius:18px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.025); transition:all 0.25s; }
        .ct-card:hover { border-color:rgba(111,232,214,0.4); background:rgba(111,232,214,0.04); }
        .ct-icon { width:42px; height:42px; flex-shrink:0; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(111,232,214,0.1); color:#6fe8d6; }
        .ct-form { padding:32px; border-radius:22px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); }
        .ct-label { display:block; font-size:12px; font-weight:600; color:rgba(255,255,255,0.55); margin-bottom:8px; letter-spacing:0.3px; }
        .ct-input { width:100%; box-sizing:border-box; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:13px 16px; color:#fff; font-size:15px; font-family:inherit; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .ct-input:focus { border-color:#6fe8d6; box-shadow:0 0 0 3px rgba(111,232,214,0.15); }
        .ct-input::placeholder { color:rgba(255,255,255,0.25); }
        select.ct-input option { background:#141414; color:#fff; }
        .ct-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .ct-submit { display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; background:#6fe8d6; color:#1a1a1a; border:none; padding:15px; border-radius:50px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.25s; }
        .ct-submit:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(111,232,214,0.35); }
        .ct-map { margin-top:16px; border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); height:220px; }
        .ct-map iframe { width:100%; height:100%; border:0; filter:invert(0.9) hue-rotate(180deg) saturate(0.6); }
        @media (max-width: 900px) {
          .ct-wrap { padding:44px 16px 56px; }
          .ct-grid { grid-template-columns:1fr; }
          .ct-form { padding:22px 18px; }
          .ct-row { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="ct-wrap">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(111,232,214,0.08)", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe8d6" }} />
          <span style={{ color: "#6fe8d6", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>CONTACT US</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(34px,4.6vw,56px)", fontWeight: 300, lineHeight: 1.08, margin: "0 0 16px" }}>
          We're here to <span style={{ color: "#6fe8d6", fontWeight: 500 }}>help</span>.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 620, margin: 0 }}>
          Questions about your account, a payment, becoming a merchant, or how we handle your data? Reach out and our team will get back to you.
        </p>

        <div className="ct-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cards.map(c => (
              <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="ct-card">
                <div className="ct-icon"><c.icon size={20} /></div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 0.4 }}>{c.label}</p>
                  <p style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 500, lineHeight: 1.5, overflowWrap: "anywhere" }}>{c.value}</p>
                  {c.hint && <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{c.hint}</p>}
                </div>
              </a>
            ))}

            <div className="ct-card" style={{ background: "rgba(111,232,214,0.05)", borderColor: "rgba(111,232,214,0.2)" }}>
              <div className="ct-icon"><ShieldCheck size={20} /></div>
              <div>
                <p style={{ margin: "0 0 4px", color: "#fff", fontSize: 15, fontWeight: 600 }}>Stay safe</p>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
                  BadePay will never ask for your password, PIN, or OTP through an unsolicited email, SMS, or social media message.
                </p>
              </div>
            </div>

            <div className="ct-map">
              <iframe src={MAP_EMBED} title="BadePay office location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>

          <form className="ct-form" onSubmit={handleSubmit}>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: "0 0 6px" }}>Send us a message</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
              This opens your email app with your message ready to send to {COMPANY.email}.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="ct-row">
                <div>
                  <label className="ct-label" htmlFor="ct-name">Full name</label>
                  <input id="ct-name" className="ct-input" required value={form.name} onChange={update("name")} placeholder="Ada Okafor" autoComplete="name" />
                </div>
                <div>
                  <label className="ct-label" htmlFor="ct-email">Email address</label>
                  <input id="ct-email" type="email" className="ct-input" required value={form.email} onChange={update("email")} placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="ct-label" htmlFor="ct-topic">Topic</label>
                <select id="ct-topic" className="ct-input" value={form.topic} onChange={update("topic")}>
                  {TOPICS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="ct-label" htmlFor="ct-message">Message</label>
                <textarea id="ct-message" className="ct-input" required rows={6} value={form.message} onChange={update("message")}
                  placeholder="Tell us how we can help. For transaction issues, include the transaction reference, date, and amount."
                  style={{ resize: "vertical", minHeight: 140 }} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Please don't include your PIN, password, OTP, or full card details. See our <Link href="/privacy" style={{ color: "#6fe8d6" }}>Privacy Policy</Link>.
              </p>
              <button type="submit" className="ct-submit"><Send size={16} /> Send message</button>
              {sent && (
                <p role="status" style={{ margin: 0, fontSize: 13, color: "#6fe8d6", textAlign: "center" }}>
                  Your email app should open now. If it doesn't, email us directly at <a href={`mailto:${COMPANY.email}`} style={{ color: "#fff", textDecoration: "underline" }}>{COMPANY.email}</a>.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </PublicPageLayout>
  );
}
