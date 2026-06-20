import React, { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { PrivacyPolicyModal } from "@/components/ui/privacy-policy-modal";


// ─── Types ────────────────────────────────────────────────────────────────────
interface SectionProps { children: ReactNode; id: string; bg?: string; className?: string; style?: CSSProperties; }

// ─── Section IDs / nav config ─────────────────────────────────────────────────
const SECTIONS = [
  { id: "hero", label: "HOME" },
  { id: "about", label: "ABOUT" },
  { id: "features", label: "FEATURES" },
  { id: "industries", label: "INDUSTRIES" },
  { id: "how-it-works", label: "HOW IT WORKS" },
  { id: "merchant", label: "MERCHANT" },
  { id: "cta", label: "GET STARTED" },
];

// ─── useActiveSection ─────────────────────────────────────────────────────────
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);
  return active;
}

// ─── useSectionInView ─────────────────────────────────────────────────────────
function useSectionInView(id: string): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id]);
  return visible;
}

// ─── SectionReveal ────────────────────────────────────────────────────────────
function SectionReveal({ children, sectionId, delay = 0, y = 36, x = 0, scale = 1, className = "", style = {} }:
  { children: ReactNode; sectionId: string; delay?: number; y?: number; x?: number; scale?: number; className?: string; style?: CSSProperties }) {
  const visible = useSectionInView(sectionId);
  return (
    <div className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible
        ? "translateY(0px) translateX(0px) scale(1)"
        : `translateY(${y}px) translateX(${x}px) scale(${scale})`,
      transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

// ─── SnapSection ─────────────────────────────────────────────────────────────
function SnapSection({ children, id, bg = "#fff", className = "", style = {} }: SectionProps) {
  return (
    <section id={id} className={`snap-section ${className}`}
      style={{ width: "100%", scrollSnapAlign: "start", scrollSnapStop: "always", position: "relative", overflow: "hidden", background: bg, display: "flex", flexDirection: "column", ...style }}>
      {children}
    </section>
  );
}

// ─── QR Code SVG ─────────────────────────────────────────────────────────────
function QRCodeSVG({ size = 120 }: { size?: number }) {
  const cell = size / 21;
  const M = [
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1], [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1], [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {M.map((row, r) => row.map((v, c) => v ? (
        <rect key={`${r}-${c}`} x={c * cell + 0.5} y={r * cell + 0.5} width={cell - 1} height={cell - 1} rx={cell * 0.12} fill="#1a1a1a" />
      ) : null))}
    </svg>
  );
}

// ─── Phone Screen ─────────────────────────────────────────────────────────────
function PhoneScreen({ stage }: { stage: "scan" | "confirm" | "success" }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#050505", borderRadius: 36, overflow: "hidden", padding: "28px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 600 }}>9:41</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[0.3, 0.5, 0.8, 1].map((o, i) => <div key={i} style={{ width: 2.5, height: 4 + i * 1.5, background: `rgba(255,255,255,${o})`, borderRadius: 1 }} />)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>BadePay</span>
        <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="/favicon.png" alt="logo" style={{ width: 18, height: 18, objectFit: "contain" }} />
        </div>
      </div>
      {stage === "scan" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, letterSpacing: 2 }}>SCAN MERCHANT QR CODE</p>
          <div style={{ flex: 1, background: "#0d0d0d", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {[["0%", "0%", "right", "bottom"], ["100%", "0%", "left", "bottom"], ["0%", "100%", "right", "top"], ["100%", "100%", "left", "top"]].map(([l, t, br, bb], i) => (
              <div key={i} style={{
                position: "absolute", left: l, top: t, width: 20, height: 20, borderRadius: 3,
                borderTop: (bb === "top") ? "none" : "2px solid #6fe8d6", borderBottom: (bb === "bottom") ? "none" : "2px solid #6fe8d6",
                borderLeft: (br === "left") ? "none" : "2px solid #6fe8d6", borderRight: (br === "right") ? "none" : "2px solid #6fe8d6", margin: 12
              }} />
            ))}
            <div className="scan-beam-inner" />
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 1 }}>ALIGN QR CODE</p>
          </div>
        </div>
      )}
      {stage === "confirm" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#0d0d0d", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 8, letterSpacing: 2, marginBottom: 7 }}>PAYING TO</p>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="/favicon.png" alt="logo" style={{ width: 24, height: 24, objectFit: "contain" }} />
              </div>
              <div><p style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Chioma's Boutique</p><p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>Lekki Phase 1, Lagos</p></div>
            </div>
          </div>
          <div style={{ background: "#0d0d0d", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 8, letterSpacing: 2, marginBottom: 5 }}>AMOUNT</p>
            <p style={{ color: "#6fe8d6", fontSize: 26, fontWeight: 300, letterSpacing: -1 }}>₦ 24,500</p>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: "auto" }}>
            <div style={{ flex: 1, height: 38, background: "#1a1a1a", borderRadius: 19, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}>Cancel</span></div>
            <div style={{ flex: 2, height: 38, background: "#6fe8d6", borderRadius: 19, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>Confirm Pay</span></div>
          </div>
        </div>
      )}
      {stage === "success" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 56, height: 56, background: "#6fe8d6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M5 13l5 5 11-11" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center" }}>Payment Successful!</p>
          <p style={{ color: "#6fe8d6", fontSize: 24, fontWeight: 300, letterSpacing: -1 }}>₦ 24,500</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center" }}>Chioma's Boutique · Just now</p>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.05)", margin: "2px 0" }} />
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 2 }}>REF: PF-2026-4891</p>
        </div>
      )}
    </div>
  );
}

// ─── Top Progress Bar ─────────────────────────────────────────────────────────
function TopProgress({ active }: { active: string }) {
  const idx = SECTIONS.findIndex(s => s.id === active);
  const pct = ((idx + 1) / SECTIONS.length) * 100;
  return (
    <div className="top-progress-bar">
      <div style={{ height: "100%", width: `${pct}%`, background: "#6fe8d6", transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)", boxShadow: "0 0 8px rgba(111,232,214,0.8)" }} />
    </div>
  );
}

// ─── Scroll Arrows (neon lime) ────────────────────────────────────────────────
function ScrollArrows({ active }: { active: string }) {
  const idx = SECTIONS.findIndex(s => s.id === active);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const upDisabled = idx <= 0;
  const downDisabled = idx >= SECTIONS.length - 1;

  const activeStyle = {
    background: "rgba(111,232,214,0.08)",
    border: "2px solid #6fe8d6",
    borderRadius: "50%" as const,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.25s",
    boxShadow: "0 0 12px rgba(111,232,214,0.5), 0 0 24px rgba(111,232,214,0.2)",
  };

  const disabledStyle = {
    background: "transparent",
    border: "2px solid rgba(111,232,214,0.15)",
    borderRadius: "50%" as const,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default",
    opacity: 0.35,
    transition: "all 0.25s",
    boxShadow: "none",
  };

  return (
    <div className="scroll-arrows">
      <button
        onClick={() => !upDisabled && scrollTo(SECTIONS[idx - 1].id)}
        disabled={upDisabled}
        aria-label="Previous section"
        style={upDisabled ? disabledStyle : activeStyle}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M4 10l4-4 4 4" stroke={upDisabled ? "rgba(111,232,214,0.3)" : "#6fe8d6"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => !downDisabled && scrollTo(SECTIONS[idx + 1].id)}
        disabled={downDisabled}
        aria-label="Next section"
        style={downDisabled ? disabledStyle : activeStyle}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke={downDisabled ? "rgba(111,232,214,0.3)" : "#6fe8d6"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Mobile Nav ───────────────────────────────────────────────────────────────
function MobileNav({ onGetStarted }: { onGetStarted: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const [open, setOpen] = useState(false);
  const scrollTo = (id: string) => { setOpen(false); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100); };
  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
        <span style={{ display: "block", width: 20, height: 1.5, background: "rgba(255,255,255,0.7)", marginBottom: 5, borderRadius: 1, transition: "all 0.3s", transform: open ? "rotate(45deg) translate(3px,3px)" : "none" }} />
        <span style={{ display: "block", width: 14, height: 1.5, background: "rgba(255,255,255,0.7)", borderRadius: 1, transition: "all 0.3s", opacity: open ? 0 : 1 }} />
        <span style={{ display: "block", width: 20, height: 1.5, background: "rgba(255,255,255,0.7)", marginTop: 5, borderRadius: 1, transition: "all 0.3s", transform: open ? "rotate(-45deg) translate(3px,-3px)" : "none" }} />
      </button>
      {open && (
        <div className="mobile-menu-drawer">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className="mobile-menu-item">{s.label}</button>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Link href="/login" onClick={() => setOpen(false)}><button className="btn-ghost-dark" style={{ width: "100%", padding: "13px 0" }}>Log In</button></Link>
            <Link href="/register" onClick={(e) => { setOpen(false); onGetStarted(e); }}><button className="btn-lime" style={{ width: "100%", padding: "13px 0" }}>Get Started Free</button></Link>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [, navigate] = useLocation();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [count, setCount] = useState(0);

  const sectionIds = SECTIONS.map(s => s.id);
  const activeSection = useActiveSection(sectionIds);
  const statsVisible = useSectionInView("about");

  useEffect(() => { setTimeout(() => setHeroLoaded(true), 80); }, []);
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!statsVisible) return;
    let n = 0;
    const t = setInterval(() => { n += 18; setCount(Math.min(n, 5000)); if (n >= 5000) clearInterval(t); }, 14);
    return () => clearInterval(t);
  }, [statsVisible]);

  const phoneStages: ("scan" | "confirm" | "success")[] = ["scan", "confirm", "success"];

  const handleGetStartedClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/register");
  };

  return (
    <>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .snap-container {
          height: 100vh; overflow-y: scroll; overflow-x: hidden;
          scroll-snap-type: y mandatory; scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          font-family: 'DM Sans', sans-serif;
        }
        .snap-container::-webkit-scrollbar { display:none; }
        .snap-container { -ms-overflow-style:none; scrollbar-width:none; }
        .snap-section { height: 100vh; min-height: 100vh; }

        .top-progress-bar { position:fixed; top:0; left:0; right:0; height:2px; background:rgba(255,255,255,0.08); z-index:2000; }

        .mobile-menu-btn { display:none; background:transparent; border:none; cursor:pointer; padding:4px; flex-direction:column; align-items:flex-end; }
        .mobile-menu-drawer { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(10,10,10,0.97); z-index:999; padding:80px 28px 40px; flex-direction:column; gap:4px; overflow-y:auto; }
        .mobile-menu-item { background:transparent; border:none; color:rgba(255,255,255,0.6); font-size:22px; font-weight:300; font-family:inherit; cursor:pointer; text-align:left; padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.06); width:100%; letter-spacing:2px; transition:color 0.2s; }
        .mobile-menu-item:hover { color:#6fe8d6; }

        @keyframes bounceDown { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }
        @keyframes scanY { 0%{top:15%} 50%{top:78%} 100%{top:15%} }
        @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes ringPulse { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes floatQR { 0%,100%{transform:translateY(0px) rotate(-4deg)} 50%{transform:translateY(-12px) rotate(-4deg)} }
        @keyframes floatPhone { 0%,100%{transform:translateY(0px) rotate(6deg)} 50%{transform:translateY(-10px) rotate(6deg)} }
        @keyframes floatNotif { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes beamPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes flowLine { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
        @keyframes dotPop { 0%{transform:scale(0)} 100%{transform:scale(1)} }

        .scan-beam-inner { animation:scanY 2.4s ease-in-out infinite; position:absolute; left:14px; right:14px; height:2px; background:linear-gradient(90deg,transparent,#6fe8d6,transparent); box-shadow:0 0 10px #6fe8d6; }
        .qr-float { animation:floatQR 5s ease-in-out infinite; }
        .phone-float { animation:floatPhone 5.5s ease-in-out 0.5s infinite; }
        .notif-float { animation:floatNotif 4s ease-in-out 1s infinite; }
        .pulse-dot { animation:pulse 2.2s ease-in-out infinite; }
        .ring-pulse { animation:ringPulse 1.8s ease-out infinite; }
        .stage-slide { animation:slideIn 0.4s ease both; }

        .btn-lime { background:#6fe8d6; color:#1a1a1a; border:none; padding:14px 36px; border-radius:50px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.25s; display:inline-block; text-align:center; }
        .btn-lime:hover { background:#b8f030; transform:translateY(-2px); box-shadow:0 12px 32px rgba(111,232,214,0.4); }
        .btn-ghost-dark { background:transparent; color:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.15); padding:14px 36px; border-radius:50px; font-size:15px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.25s; display:inline-block; text-align:center; }
        .btn-ghost-dark:hover { background:rgba(255,255,255,0.06); color:#fff; border-color:rgba(255,255,255,0.35); transform:translateY(-2px); }
        .btn-ghost-light { background:transparent; color:rgba(26,26,26,0.6); border:1.5px solid rgba(26,26,26,0.2); padding:14px 36px; border-radius:50px; font-size:15px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.25s; display:inline-block; text-align:center; }
        .btn-ghost-light:hover { background:#1a1a1a; color:#6fe8d6; transform:translateY(-2px); }
        .nav-a { color:rgba(255,255,255,0.5); text-decoration:none; font-size:14px; letter-spacing:0.1px; transition:color 0.2s; }
        .nav-a:hover { color:#6fe8d6; }
        .industry-row { border-bottom:1px solid #f0f0ec; padding:18px 0; transition:all 0.3s; cursor:default; }
        .industry-row:hover { border-bottom-color:#6fe8d6; padding-left:10px; }

        /* ── NEW FEATURES SECTION STYLES ── */
        .feat-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          flex: 1;
          overflow: hidden;
        }
        .feat-left-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .feat-right-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .feat-flow-panel {
          background: #0d0d0d;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }
        .feat-stat-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2px;
        }
        .feat-stat-box {
          background: #111;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          overflow: hidden;
        }
        .feat-stat-box::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #6fe8d6;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .feat-stat-box:hover::after { transform: scaleX(1); }
        .feat-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          flex: 1;
        }
        .feat-detail-card {
          background: #111;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: background 0.3s;
        }
        .feat-detail-card:hover { background: #161616; }
        .feat-compare-panel {
          background: #0a0a0a;
          padding: 24px 26px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .feat-compare-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .feat-compare-row:last-child { border-bottom: none; }
        .feat-flow-node {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .feat-flow-line {
          width: 2px;
          height: 24px;
          background: rgba(111,232,214,0.2);
          margin-left: 15px;
          position: relative;
          overflow: hidden;
        }
        .feat-flow-line::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 100%;
          background: #6fe8d6;
          animation: flowLine 2s ease-in-out infinite;
        }
        .feat-icon-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(111,232,214,0.1);
          border: 1px solid rgba(111,232,214,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hiw-grid { display:grid; grid-template-columns:1fr auto 1fr; gap:24px; align-items:center; flex:1; }
        .hiw-step { display:flex; gap:14px; margin-bottom:14px; }
        .hiw-step-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:14px 16px; flex:1; }

        .about-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; flex:1; padding: 80px 48px; max-width:1200px; margin:0 auto; width:100%; }
        .industries-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; flex:1; padding: 80px 48px; max-width:1200px; margin:0 auto; width:100%; overflow:hidden; }
        .merchant-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; flex:1; padding: 80px 48px; max-width:1200px; margin:0 auto; width:100%; }
        .cta-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; flex:1; padding: 80px 48px; max-width:1200px; margin:0 auto; width:100%; }

        .scroll-arrows { position:fixed; bottom:28px; right:28px; display:flex; flex-direction:column; gap:10px; z-index:1000; }

        @media (max-width: 768px) {
          .scroll-arrows { display:none !important; }
          .hero-nav { padding:14px 20px !important; }
          .snap-container { scroll-snap-type:none; height:auto; overflow-y:auto; }
          .snap-section { height:auto !important; min-height:auto !important; scroll-snap-align:none; }
          .top-progress-bar { display:none !important; }
          .mobile-menu-btn { display:flex !important; }
          .mobile-menu-drawer { display:flex !important; }
          .desktop-nav-links { display:none !important; }
          .desktop-nav-cta { display:none !important; }

          .hero-content { display:flex !important; flex-direction:column !important; padding:32px 20px 0 !important; gap:0 !important; text-align:center !important; align-items:center !important; }
          .hero-left { align-items:center !important; display:flex; flex-direction:column; }
          .hero-left h1 { font-size:clamp(38px,10vw,56px) !important; }
          .hero-left p { max-width:100% !important; font-size:16px !important; }
          .hero-btns { flex-direction:column !important; width:100%; }
          .hero-btns button, .hero-btns a { width:100% !important; }
          .hero-btns .btn-lime { padding:15px !important; }
          .hero-btns .btn-ghost-dark { padding:13px !important; }
          .hero-stats { justify-content:center !important; gap:24px !important; }
          .hero-visual { position:relative !important; height:340px !important; width:100% !important; display:flex !important; align-items:center !important; justify-content:center !important; margin-top:32px; }
          .hero-qr-card { display:none !important; }
          .hero-phone { position:relative !important; right:auto !important; top:auto !important; animation:none !important; transform:none !important; }
          .hero-phone-inner { width:200px !important; height:400px !important; }
          .hero-notif { position:absolute !important; bottom:8px !important; left:50% !important; transform:translateX(-50%) !important; white-space:nowrap; animation:none !important; }
          .hero-rings { display:none !important; }

          .about-grid { grid-template-columns:1fr !important; gap:32px !important; padding:40px 20px !important; }
          .about-grid h2 { font-size:clamp(28px,8vw,40px) !important; }

          .feat-main-grid { grid-template-columns:1fr !important; }
          .feat-stat-row { grid-template-columns:1fr 1fr !important; }
          .feat-detail-grid { grid-template-columns:1fr !important; }
          .features-header { padding:24px 20px 20px !important; flex-direction:column !important; gap:10px !important; align-items:flex-start !important; }
          .features-bottom { padding:14px 20px !important; flex-direction:column !important; gap:10px !important; align-items:flex-start !important; }
          .features-bottom-btns { flex-direction:column !important; width:100% !important; }
          .features-bottom-btns button, .features-bottom-btns a { width:100% !important; }
          .feat-flow-panel { padding:20px !important; }
          .feat-compare-panel { padding:18px 20px !important; }

          .hiw-header { padding:32px 20px 20px !important; }
          .hiw-grid { grid-template-columns:1fr !important; gap:0 !important; padding:0 20px 32px !important; overflow-y:auto !important; }
          .hiw-right-steps { order:2; }
          .hiw-phone-col { order:1; display:flex !important; justify-content:center !important; margin-bottom:28px !important; }
          .hiw-phone-col > div { width:180px !important; }
          .hiw-line { display:none !important; }
          .hiw-step { margin-bottom:10px !important; }
          .hiw-step-card { padding:12px 14px !important; }

          .industries-grid { grid-template-columns:1fr !important; gap:0 !important; padding:40px 20px 32px !important; overflow-y:auto !important; }
          .industries-right { padding-top:0 !important; }
          .industries-benefits { grid-template-columns:1fr 1fr !important; }

          .merchant-grid { grid-template-columns:1fr !important; gap:32px !important; padding:40px 20px !important; }
          .merchant-grid h2 { font-size:clamp(28px,8vw,40px) !important; }
          .merchant-features { grid-template-columns:1fr 1fr !important; }

          .cta-grid { grid-template-columns:1fr !important; gap:32px !important; padding:40px 20px !important; overflow-y:auto !important; }
          .cta-visual { display:none !important; }
          .cta-btns { flex-direction:column !important; }
          .cta-btns button, .cta-btns a { width:100% !important; }
          .cta-footer { padding:20px !important; flex-direction:column !important; gap:12px !important; text-align:center !important; }
          .cta-footer-links { justify-content:center !important; }
        }

        @media (max-width: 480px) {
          .hero-left h1 { font-size:clamp(32px,9vw,42px) !important; }
          .about-grid { padding:32px 16px !important; }
          .industries-grid { padding:28px 16px 24px !important; }
          .merchant-grid { padding:32px 16px !important; }
          .merchant-features { grid-template-columns:1fr !important; }
          .cta-grid { padding:28px 16px !important; }
          .feat-stat-row { grid-template-columns:1fr !important; }
          .industries-benefits { grid-template-columns:1fr !important; }
        }
      `}</style>

      <TopProgress active={activeSection} />
      <ScrollArrows active={activeSection} />

      <div className="snap-container">

        {/* ════ 1. HERO ════════════════════════════════════════════════════════ */}
        <SnapSection id="hero" bg="linear-gradient(150deg, #1c1c1c 0%, #0e0e0e 60%, #0a1a05 100%)">
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(111,232,214,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -120, right: -60, width: 560, height: 560, background: "#6fe8d6", opacity: 0.05, borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />

          <nav className="hero-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 100, flexShrink: 0 }}>
            <div style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "translateX(0)" : "translateX(-16px)", transition: "all 0.7s ease", display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/favicon.png" alt="BadePay" style={{ height: 40, width: "auto", objectFit: "contain" }} />
              <span style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>BadePay</span>
            </div>
            <div className="desktop-nav-links" style={{ display: "flex", gap: 32, opacity: heroLoaded ? 1 : 0, transition: "opacity 0.7s ease 0.15s" }}>
              {SECTIONS.slice(1).map(s => (
                <a key={s.id} className="nav-a" href={`#${s.id}`}
                  onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>
                  {s.label}
                </a>
              ))}
            </div>
            <div className="desktop-nav-cta" style={{ display: "flex", gap: 10, opacity: heroLoaded ? 1 : 0, transition: "opacity 0.7s ease 0.25s" }}>
              <Link href="/login"><button className="btn-ghost-dark" style={{ padding: "9px 22px", fontSize: 13 }}>Log In</button></Link>
              <Link href="/register" onClick={handleGetStartedClick}><button className="btn-lime" style={{ padding: "9px 22px", fontSize: 13 }}>Get Started</button></Link>
            </div>
            <MobileNav onGetStarted={handleGetStartedClick} />
          </nav>

          <div className="hero-content" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center", padding: "0 48px", position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <div className="hero-left" style={{ display: "flex", flexDirection: "column" }}>
              <SectionReveal sectionId="hero" delay={0.1} y={16}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(111,232,214,0.08)", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 50, padding: "7px 18px", marginBottom: 20 }}>
                  <span className="pulse-dot" style={{ width: 6, height: 6, background: "#6fe8d6", borderRadius: "50%", display: "inline-block" }} />
                  <span style={{ color: "#6fe8d6", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>NIGERIA'S FASTEST QR PAYMENTS</span>
                </div>
              </SectionReveal>
              <SectionReveal sectionId="hero" delay={0.2} y={44}>
                <h1 style={{ fontSize: "clamp(44px,5.2vw,82px)", fontWeight: 300, lineHeight: 1.06, color: "#fff", marginBottom: 20 }}>
                  Accept<br /><span style={{ color: "#6fe8d6", fontStyle: "italic" }}>Payments</span><br />Instantly
                </h1>
              </SectionReveal>
              <SectionReveal sectionId="hero" delay={0.32} y={24}>
                <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 420, marginBottom: 32, fontWeight: 300 }}>
                  Built for Nigerian businesses. Scan your QR code and pay in naira — no POS machine, no delays.
                </p>
              </SectionReveal>
              <SectionReveal sectionId="hero" delay={0.44} y={14}>
                <div className="hero-btns" style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
                  <Link href="/register" onClick={handleGetStartedClick}><button className="btn-lime">Get Started Free</button></Link>
                  <button className="btn-ghost-dark" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>Watch Demo →</button>
                </div>
              </SectionReveal>
              <SectionReveal sectionId="hero" delay={0.55} y={10}>
                <div className="hero-stats" style={{ display: "flex", gap: 32 }}>
                  {[["5,000+", "Merchants"], ["₦2B+", "Processed"], ["0.3s", "Pay Time"]].map(([v, l], i) => (
                    <div key={i}><p style={{ color: "#fff", fontSize: 20, fontWeight: 500, lineHeight: 1 }}>{v}</p><p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4, letterSpacing: 1 }}>{l.toUpperCase()}</p></div>
                  ))}
                </div>
              </SectionReveal>
            </div>

            <div className="hero-visual" style={{ position: "relative", width: "100%", height: 540, flexShrink: 0 }}>
              <div className="hero-rings" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 120, height: 120, zIndex: 1 }}>
                <div className="ring-pulse" style={{ position: "absolute", inset: 0, border: "1.5px solid rgba(111,232,214,0.25)", borderRadius: "50%" }} />
                <div className="ring-pulse" style={{ position: "absolute", inset: -16, border: "1px solid rgba(111,232,214,0.1)", borderRadius: "50%", animationDelay: "0.8s" }} />
              </div>

              <SectionReveal sectionId="hero" delay={0.52} scale={0.9} y={20} className="hero-qr-card" style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 3 }}>
                <div className="qr-float" style={{ width: 260, background: "#fff", borderRadius: 22, padding: "16px 14px", boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(111,232,214,0.4)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: "rotate(-5deg)" }}>
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><p style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>Chioma's Boutique</p><p style={{ fontSize: 8, color: "#888", letterSpacing: 1 }}>LEKKI PHASE 1</p></div>
                    <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <img src="/favicon.png" alt="logo" style={{ width: 20, height: 20, objectFit: "contain" }} />
                    </div>
                  </div>
                  <div style={{ background: "#fff", padding: 5, borderRadius: 8, border: "1.5px solid #f0f0f0" }}><QRCodeSVG size={150} /></div>
                  <div style={{ textAlign: "center" }}><p style={{ fontSize: 7, fontWeight: 700, color: "#888", letterSpacing: 3 }}>SCAN TO PAY WITH</p><p style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", letterSpacing: 2 }}>BadePay</p></div>
                </div>
              </SectionReveal>

              <div className="hero-qr-card" style={{ position: "absolute", top: "50%", left: 260, right: 260, height: 2, transform: "translateY(-50%)", zIndex: 2, background: "linear-gradient(90deg, rgba(111,232,214,0.9) 0%, rgba(111,232,214,0.6) 50%, rgba(111,232,214,0.1) 100%)", boxShadow: "0 0 8px rgba(111,232,214,0.35)", animation: "beamPulse 1.8s ease-in-out infinite" }} />

              <SectionReveal sectionId="hero" delay={0.62} scale={0.9} y={20} className="hero-phone" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 4 }}>
                <div className="phone-float hero-phone-inner" style={{ width: 260, height: 520, background: "#050505", border: "6px solid #1a1a1a", borderRadius: 40, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.8), -16px 0 48px rgba(111,232,214,0.07)", position: "relative", transform: "rotate(5deg)" }}>
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "35%", height: "5%", background: "#1a1a1a", borderRadius: "0 0 12px 12px", zIndex: 5 }} />
                  <div className="stage-slide" key={activeStep} style={{ width: "100%", height: "100%" }}><PhoneScreen stage={phoneStages[activeStep]} /></div>
                </div>
              </SectionReveal>

              <SectionReveal sectionId="hero" delay={0.82} y={10} className="hero-notif" style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
                <div className="notif-float" style={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(111,232,214,0.4)", borderRadius: 14, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(20px)", boxShadow: "0 0 20px rgba(111,232,214,0.15), 0 14px 40px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
                  <div style={{ width: 30, height: 30, background: "#6fe8d6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                  <div><p style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>₦24,500 received!</p><p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>From Ade • Just now</p></div>
                </div>
              </SectionReveal>
            </div>
          </div>

          <div style={{ overflow: "hidden", background: "#6fe8d6", padding: "10px 0", flexShrink: 0, position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", gap: 48, animation: "marquee 22s linear infinite", whiteSpace: "nowrap" }}>
              {[...Array(4)].map((_, j) =>
                ["INSTANT PAYMENTS", "SCAN TO PAY", "NO POS MACHINE", "NAIRA PAYMENTS", "REAL-TIME ALERTS", "DAILY SETTLEMENT", "SECURE TRANSACTIONS", "5000+ MERCHANTS"].map((t, i) => (
                  <span key={`${j}-${i}`} style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: "#1a1a1a", display: "inline-flex", alignItems: "center", gap: 16 }}>{t}<span style={{ width: 3, height: 3, background: "rgba(26,26,26,0.3)", borderRadius: "50%", display: "inline-block" }} /></span>
                ))
              )}
            </div>
          </div>
        </SnapSection>

        {/* ════ 2. ABOUT ═══════════════════════════════════════════════════════ */}
        <SnapSection id="about" bg="#fff">
          <div className="about-grid">
            <SectionReveal sectionId="about" delay={0.1} x={-36}>
              <div>
                <div style={{ display: "inline-block", border: "1.5px solid #e8e8e0", borderRadius: 50, padding: "6px 18px", marginBottom: 28 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#bbb", letterSpacing: 3 }}>ABOUT BADEPAY</p>
                </div>
                <h2 style={{ fontSize: "clamp(32px,4vw,64px)", fontWeight: 300, lineHeight: 1.1, color: "#1a1a1a", marginBottom: 24 }}>Nigeria's Simplest Way to Accept Payments</h2>
                <p style={{ fontSize: 18, color: "#555", fontWeight: 300, lineHeight: 1.85, marginBottom: 18 }}>BadePay helps Nigerian businesses accept cashless payments with nothing but a QR code — no POS terminal required.</p>
                <p style={{ fontSize: 14, color: "#999", fontWeight: 300, lineHeight: 1.9 }}>From Balogun Market to Victoria Island boutiques — instant naira settlements, zero hardware costs. Bank-grade encryption ensures every transaction is secure and seamless.</p>
              </div>
            </SectionReveal>
            <SectionReveal sectionId="about" delay={0.22} x={36}>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, background: "#f0f0ec", borderRadius: 18, overflow: "hidden" }}>
                  {[
                    { val: statsVisible && count >= 5000 ? "5,000+" : statsVisible && count > 0 ? `${count.toLocaleString()}+` : "0+", label: "Merchants" },
                    { val: "₦2B+", label: "Monthly" },
                    { val: "0.3s", label: "Pay Time" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", padding: "24px 16px", textAlign: "center" }}>
                      <p style={{ fontSize: 28, fontWeight: 300, color: "#1a1a1a", lineHeight: 1 }}>{s.val}</p>
                      <p style={{ fontSize: 9, color: "#ccc", letterSpacing: 2, marginTop: 5 }}>{s.label.toUpperCase()}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {["No POS machine needed", "No card reader required", "Instant naira settlement", "Works across all networks"].map((item, i) => (
                    <SectionReveal key={i} sectionId="about" delay={0.32 + i * 0.07} y={12}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 24, height: 24, background: "#6fe8d6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span style={{ color: "#444", fontSize: 13 }}>{item}</span>
                      </div>
                    </SectionReveal>
                  ))}
                </div>
                <SectionReveal sectionId="about" delay={0.56} y={10}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/register" onClick={handleGetStartedClick}><button className="btn-lime">Get Started Free</button></Link>
                    <button className="btn-ghost-light" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>See Features</button>
                  </div>
                </SectionReveal>
                <SectionReveal sectionId="about" delay={0.7} y={10}>
                  <div style={{ background: "#f8f8f5", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 14, border: "1px solid #f0f0ec" }}>
                    <QRCodeSVG size={44} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Your QR. Your Identity.</p>
                      <p style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>Every merchant gets a unique QR — display it anywhere and start accepting payments instantly.</p>
                    </div>
                  </div>
                </SectionReveal>
              </div>
            </SectionReveal>
          </div>
        </SnapSection>

        {/* ════ 3. FEATURES — REDESIGNED ═══════════════════════════════════════ */}
        <SnapSection id="features" bg="linear-gradient(160deg, #0d0d0d 0%, #0a0a0a 100%)">
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, background: "#6fe8d6", opacity: 0.04, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, overflow: "hidden" }}>

            {/* Header */}
            <SectionReveal sectionId="features" delay={0.06} y={16}>
              <div className="features-header" style={{ padding: "36px 48px 24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 50, background: "rgba(111,232,214,0.05)", marginBottom: 10 }}>
                    <div className="pulse-dot" style={{ width: 5, height: 5, background: "#6fe8d6", borderRadius: "50%" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(111,232,214,0.7)", letterSpacing: "2px" }}>WHY MERCHANTS CHOOSE BADEPAY</span>
                  </div>
                  <h2 style={{ fontSize: "clamp(22px,3vw,44px)", fontWeight: 300, color: "#fff", lineHeight: 1.15 }}>Built for merchants who <span style={{ color: "#6fe8d6", fontStyle: "italic" }}>mean business.</span></h2>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 300, lineHeight: 1.75, maxWidth: 260, paddingBottom: 2 }}>Every tool to accept payments faster, smarter, and safer across Nigeria.</p>
              </div>
            </SectionReveal>

            {/* Main content grid */}
            <div className="feat-main-grid">

              {/* LEFT COLUMN */}
              <div className="feat-left-col">

                {/* Payment flow diagram */}
                <SectionReveal sectionId="features" delay={0.12} y={20}>
                  <div className="feat-flow-panel">
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 3 }}>PAYMENT FLOW — HOW MONEY MOVES</p>

                    {/* Flow diagram */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {[
                        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" /></svg>, label: "Customer opens BadePay app", sub: "Any Nigerian smartphone" },
                        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="2" strokeLinecap="round"><path d="M3 7h4l2 9 4-12 2 9h4" /></svg>, label: "Scans your merchant QR", sub: "Unique code tied to your account" },
                        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>, label: "Enters amount & confirms", sub: "PIN or biometric auth" },
                        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, label: "Naira hits your balance", sub: "Instant — under 0.3 seconds" },
                      ].map((step, i) => (
                        <div key={i}>
                          <div className="feat-flow-node">
                            <div className="feat-icon-dot">{step.icon}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{step.label}</p>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 1 }}>{step.sub}</p>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(111,232,214,0.5)", letterSpacing: 1 }}>0{i + 1}</div>
                          </div>
                          {i < 3 && <div className="feat-flow-line" />}
                        </div>
                      ))}
                    </div>

                    {/* Mini timeline bar */}
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 2 }}>TIME TO COMPLETE</span>
                        <span style={{ color: "#6fe8d6", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>AVG 0.3s</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "8%", background: "#6fe8d6", borderRadius: 2 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>0s</span>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>4s</span>
                      </div>
                    </div>
                  </div>
                </SectionReveal>

                {/* Stat row */}
                <SectionReveal sectionId="features" delay={0.2} y={14}>
                  <div className="feat-stat-row">
                    {[
                      { val: "₦0", label: "Hardware cost", note: "No POS. No card reader." },
                      { val: "T+0", label: "Settlement", note: "Same-day naira payout" },
                      { val: "256-bit", label: "Encryption", note: "Bank-grade security" },
                    ].map((s, i) => (
                      <div key={i} className="feat-stat-box">
                        <p style={{ fontSize: 22, fontWeight: 300, color: "#6fe8d6", lineHeight: 1, letterSpacing: -0.5 }}>{s.val}</p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginTop: 2 }}>{s.label.toUpperCase()}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4, lineHeight: 1.4 }}>{s.note}</p>
                      </div>
                    ))}
                  </div>
                </SectionReveal>

              </div>

              {/* RIGHT COLUMN */}
              <div className="feat-right-col">

                {/* Feature detail cards */}
                <SectionReveal sectionId="features" delay={0.16} y={20} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div className="feat-detail-grid" style={{ flex: 1 }}>
                    {[
                      {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
                        title: "Instant Confirmation",
                        desc: "Dashboard updates the moment payment completes. No refresh, no waiting.",
                        badge: "3s avg",
                        badgeColor: "#6fe8d6",
                      },
                      {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                        title: "Bank-Grade Security",
                        desc: "Every transaction encrypted end-to-end. Your funds, locked down 24/7.",
                        badge: "AES-256",
                        badgeColor: "#6fe8d6",
                      },
                      {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
                        title: "Merchant Dashboard",
                        desc: "Real-time analytics, transaction history, settlement tracking — one screen.",
                        badge: "Live",
                        badgeColor: "#6fe8d6",
                      },
                      {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
                        title: "Works Everywhere",
                        desc: "Market stall, shop front, events — BadePay runs wherever your business is.",
                        badge: "Nationwide",
                        badgeColor: "#6fe8d6",
                      },
                    ].map((f, i) => (
                      <div key={i} className="feat-detail-card">
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(111,232,214,0.07)", border: "1px solid rgba(111,232,214,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>{f.icon}</div>
                          <span style={{ background: "rgba(111,232,214,0.1)", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 50, padding: "3px 10px", fontSize: 9, fontWeight: 700, color: "#6fe8d6", letterSpacing: 1 }}>{f.badge}</span>
                        </div>
                        <div>
                          <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 }}>{f.title}</p>
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</p>
                        </div>
                        {/* Mini visual indicator */}
                        <div style={{ height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden", marginTop: "auto" }}>
                          <div style={{ height: "100%", width: ["85%", "100%", "92%", "78%"][i], background: "rgba(111,232,214,0.4)", borderRadius: 1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionReveal>

                {/* BadePay vs Cash/POS comparison */}
                <SectionReveal sectionId="features" delay={0.28} y={14}>
                  <div className="feat-compare-panel">
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 3 }}>BADEPAY VS TRADITIONAL METHODS</p>
                    <div>
                      {[
                        { label: "Setup cost", bp: "₦0", old: "₦50,000+ POS" },
                        { label: "Settlement time", bp: "Instant", old: "1–3 business days" },
                        { label: "Hardware needed", bp: "None", old: "POS terminal" },
                        { label: "Cash risk", bp: "Zero", old: "Theft / shortage" },
                        { label: "Transaction data", bp: "Full data", old: "Manual records" },
                      ].map((row, i) => (
                        <div key={i} className="feat-compare-row">
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, width: 110, flexShrink: 0 }}>{row.label}</p>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 16, height: 16, background: "#6fe8d6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-3.5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </div>
                              <span style={{ color: "#6fe8d6", fontSize: 11, fontWeight: 600 }}>{row.bp}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 16, height: 16, background: "rgba(255,255,255,0.06)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3l-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                              </div>
                              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{row.old}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionReveal>

              </div>
            </div>

            {/* Footer CTA */}
            <SectionReveal sectionId="features" delay={0.38} y={10}>
              <div className="features-bottom" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>Join thousands of merchants already using BadePay across Nigeria.</p>
                <div className="features-bottom-btns" style={{ display: "flex", gap: 10 }}>
                  <Link href="/register"><button className="btn-lime" style={{ padding: "11px 26px", fontSize: 13 }}>Get Started Free</button></Link>
                  <Link href="/contact"><button className="btn-ghost-dark" style={{ padding: "11px 26px", fontSize: 13 }}>Talk to Sales</button></Link>
                </div>
              </div>
            </SectionReveal>

          </div>
        </SnapSection>

        {/* ════ 4. INDUSTRIES ══════════════════════════════════════════════════ */}
        <SnapSection id="industries" bg="#fff">
          <div className="industries-grid">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <SectionReveal sectionId="industries" delay={0.1} x={-28}>
                <div style={{ marginBottom: 36 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#ccc", letterSpacing: 4, marginBottom: 14 }}>INDUSTRIES WE SERVE</p>
                  <h2 style={{ fontSize: "clamp(28px,3.8vw,58px)", fontWeight: 300, lineHeight: 1.1, color: "#1a1a1a", marginBottom: 10 }}>Built for Every Business</h2>
                  <p style={{ fontSize: 16, color: "#aaa", fontWeight: 300 }}>From Balogun to Abuja — BadePay works everywhere.</p>
                </div>
              </SectionReveal>
              {[
                ["Retail Stores", "Accept payments without POS limitations."],
                ["Restaurants & Bukkas", "Speed up table service and checkout."],
                ["Supermarkets", "Reduce waiting time at payment points."],
                ["Fuel Stations", "Quick, cashless payment at the pump."],
                ["Market Traders", "Collect payments at Balogun, Idumota, anywhere."],
              ].map(([name, desc], i) => (
                <SectionReveal key={i} sectionId="industries" delay={0.16 + i * 0.06} y={14}>
                  <div className="industry-row"><h3 style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a", marginBottom: 3 }}>{name}</h3><p style={{ fontSize: 12, color: "#bbb", lineHeight: 1.6, fontWeight: 300 }}>{desc}</p></div>
                </SectionReveal>
              ))}
            </div>
            <div className="industries-right" style={{ paddingTop: 0 }}>
              <SectionReveal sectionId="industries" delay={0.2} x={28}>
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#ccc", letterSpacing: 4, marginBottom: 14 }}>MORE INDUSTRIES</p>
                  {[
                    ["Pharmacies", "Secure digital transactions for medications."],
                    ["Service Providers", "Collect instantly — plumber, tailor, anyone."],
                    ["Online Sellers", "Seamless checkout with naira payments."],
                  ].map(([name, desc], i) => (
                    <SectionReveal key={i} sectionId="industries" delay={0.24 + i * 0.06} y={14}>
                      <div className="industry-row"><h3 style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a", marginBottom: 3 }}>{name}</h3><p style={{ fontSize: 12, color: "#bbb", lineHeight: 1.6, fontWeight: 300 }}>{desc}</p></div>
                    </SectionReveal>
                  ))}
                </div>
              </SectionReveal>
              <SectionReveal sectionId="industries" delay={0.42} y={20}>
                <div className="industries-benefits" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { title: "Better UX", desc: "No cash drama. No POS failures. Scan and pay." },
                    { title: "Zero Setup Cost", desc: "₦0 hardware, ₦0 setup. % only." },
                    { title: "Data Insights", desc: "See what sells, when, and to who." },
                  ].map((b, i) => (
                    <div key={i} style={{ background: "#f6f6f2", borderRadius: 16, padding: 18 }}><h3 style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 5 }}>{b.title}</h3><p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6, fontWeight: 300 }}>{b.desc}</p></div>
                  ))}
                  <div style={{ background: "#6fe8d6", borderRadius: 16, padding: 18 }}><p style={{ fontSize: 36, fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>+1%</p><p style={{ fontSize: 11, color: "rgba(26,26,26,0.5)", fontWeight: 300, marginTop: 5 }}>Cashback on every transaction</p></div>
                </div>
              </SectionReveal>
            </div>
          </div>
        </SnapSection>

        {/* ════ 5. HOW IT WORKS ════════════════════════════════════════════════ */}
        <SnapSection id="how-it-works" bg="linear-gradient(160deg, #111 0%, #0a0a0a 50%, #0d1a05 100%)">
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(111,232,214,0.04) 1px, transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", right: -60, transform: "translateY(-50%)", width: 360, height: 360, background: "#6fe8d6", opacity: 0.04, borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, maxWidth: 1640, margin: "0 auto", width: "100%", overflow: "hidden" }}>
            <SectionReveal sectionId="how-it-works" delay={0.08} y={16}>
              <div className="hiw-header" style={{ padding: "48px 48px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <div style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 50, padding: "5px 16px", marginBottom: 10 }}><p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 3 }}>HOW SCAN-TO-PAY WORKS</p></div>
                  <h2 style={{ fontSize: "clamp(22px,3.2vw,46px)", fontWeight: 300, color: "#fff" }}>Six Steps. Three Seconds. Done.</h2>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} onClick={() => setActiveStep(i)} style={{ width: i === activeStep ? 18 : 7, height: 7, borderRadius: 3.5, background: i === activeStep ? "#6fe8d6" : "rgba(255,255,255,0.15)", transition: "all 0.3s", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            </SectionReveal>
            <div className="hiw-grid" style={{ flex: 1, padding: "0 48px 48px" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                <div className="hiw-line" style={{ position: "absolute", left: 17, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #6fe8d6, rgba(111,232,214,0.05))", borderRadius: 2, opacity: 0.35 }} />
                {[
                  { n: 1, title: "Register", desc: "Sign up and complete KYC verification — under 5 minutes.", icon: "📋" },
                  { n: 2, title: "Get Your QR", desc: "BadePay generates a unique QR tied to your merchant account.", icon: "🔲" },
                  { n: 3, title: "Display It", desc: "Print or show your QR digitally at your checkout point.", icon: "🏪" },
                ].map((s, i) => (
                  <SectionReveal key={i} sectionId="how-it-works" delay={0.18 + i * 0.09} y={18}>
                    <div className="hiw-step">
                      <div style={{ flexShrink: 0, zIndex: 1 }}><div style={{ width: 34, height: 34, background: "#6fe8d6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#1a1a1a", boxShadow: "0 0 0 5px rgba(111,232,214,0.08)" }}>{s.n}</div></div>
                      <div className="hiw-step-card"><div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><span style={{ fontSize: 14 }}>{s.icon}</span><p style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{s.title}</p></div><p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</p></div>
                    </div>
                  </SectionReveal>
                ))}
              </div>
              <div className="hiw-phone-col" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SectionReveal sectionId="how-it-works" delay={0.14} scale={0.88}>
                  <div style={{ width: 200, position: "relative" }}>
                    <div style={{ position: "absolute", inset: -20, background: "rgba(111,232,214,0.05)", borderRadius: "50%", filter: "blur(24px)" }} />
                    <div style={{ width: 200, aspectRatio: "9/18", background: "#050505", border: "5px solid #161616", borderRadius: 40, overflow: "hidden", position: "relative", boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 100px rgba(0,0,0,0.8)" }}>
                      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "36%", height: "5%", background: "#111", borderRadius: "0 0 10px 10px", zIndex: 5 }} />
                      <div className="stage-slide" key={activeStep} style={{ width: "100%", height: "100%" }}><PhoneScreen stage={phoneStages[activeStep]} /></div>
                    </div>
                  </div>
                </SectionReveal>
              </div>
              <div className="hiw-right-steps" style={{ display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                <div className="hiw-line" style={{ position: "absolute", left: 17, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #6fe8d6, rgba(111,232,214,0.05))", borderRadius: 2, opacity: 0.35 }} />
                {[
                  { n: 4, title: "Customer Scans", desc: "Customer opens BadePay app, scans your QR — any Nigerian smartphone.", icon: "📱" },
                  { n: 5, title: "Confirm Amount", desc: "Customer enters amount and confirms with PIN or biometrics.", icon: "✅" },
                  { n: 6, title: "You Get Paid", desc: "Instant alert — payment hits your BadePay balance immediately.", icon: "💸" },
                ].map((s, i) => (
                  <SectionReveal key={i} sectionId="how-it-works" delay={0.18 + i * 0.09} y={18}>
                    <div className="hiw-step">
                      <div style={{ flexShrink: 0, zIndex: 1 }}><div style={{ width: 34, height: 34, background: "#6fe8d6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#1a1a1a", boxShadow: "0 0 0 5px rgba(111,232,214,0.08)" }}>{s.n}</div></div>
                      <div className="hiw-step-card"><div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><span style={{ fontSize: 14 }}>{s.icon}</span><p style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{s.title}</p></div><p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</p></div>
                    </div>
                  </SectionReveal>
                ))}
              </div>
            </div>
          </div>
        </SnapSection>

        {/* ════ 6. MERCHANT DASHBOARD ══════════════════════════════════════════ */}
        <SnapSection id="merchant" bg="#fff">
          <div className="merchant-grid">
            <SectionReveal sectionId="merchant" delay={0.1} x={-36}>
              <div>
                <div style={{ display: "inline-block", border: "1.5px solid #e8e8e0", borderRadius: 50, padding: "6px 18px", marginBottom: 28 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#bbb", letterSpacing: 3 }}>MERCHANT DASHBOARD</p>
                </div>
                <h2 style={{ fontSize: "clamp(32px,4vw,64px)", fontWeight: 300, lineHeight: 1.1, color: "#1a1a1a", marginBottom: 20 }}>
                  Powerful Business Insights
                </h2>
                <p style={{ fontSize: 18, color: "#555", fontWeight: 300, lineHeight: 1.85, marginBottom: 10 }}>
                  Everything you need to run your business in one place — from transaction monitoring to customer management.
                </p>
                <p style={{ fontSize: 14, color: "#999", fontWeight: 300, lineHeight: 1.9 }}>
                  Track settlements, analyze sales, and export reports. All designed to save you time and give you complete control.
                </p>
              </div>
            </SectionReveal>
            <SectionReveal sectionId="merchant" delay={0.22} x={36}>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="merchant-features" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    "Transaction monitoring",
                    "Payment history",
                    "Settlement tracking",
                    "Profile management",
                    "Sales analytics",
                    "Exportable reports",
                    "Customer records",
                    "Dispute management",
                  ].map((item, i) => (
                    <SectionReveal key={i} sectionId="merchant" delay={0.24 + i * 0.05} y={12}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 24, height: 24, background: "#6fe8d6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span style={{ color: "#444", fontSize: 13 }}>{item}</span>
                      </div>
                    </SectionReveal>
                  ))}
                </div>
                <SectionReveal sectionId="merchant" delay={0.6} y={10}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/register"><button className="btn-lime">Get Started Free</button></Link>
                    <button className="btn-ghost-light" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Explore Features</button>
                  </div>
                </SectionReveal>
                <SectionReveal sectionId="merchant" delay={0.75} y={10}>
                  <div style={{ background: "#f8f8f5", border: "1px solid #f0f0ec", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#ccc", letterSpacing: 2 }}>TODAY'S REVENUE</p>
                      <span style={{ background: "#6fe8d6", borderRadius: 50, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>+18%</span>
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 300, color: "#1a1a1a", letterSpacing: -1 }}>₦ 482,000</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
                      {[35, 55, 40, 70, 45, 85, 60, 90, 50, 95, 65, 100].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? "#6fe8d6" : "#e0e0d5", borderRadius: "2px 2px 0 0" }} />
                      ))}
                    </div>
                  </div>
                </SectionReveal>
              </div>
            </SectionReveal>
          </div>
        </SnapSection>

        {/* ════ 7. CTA ═════════════════════════════════════════════════════════ */}
        <SnapSection id="cta" bg="linear-gradient(150deg, #0a1a05 0%, #111 40%, #0e0e0e 100%)">
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(111,232,214,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, left: -80, width: 400, height: 400, background: "#6fe8d6", opacity: 0.05, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
          <div className="cta-grid">
            <SectionReveal sectionId="cta" delay={0.1} x={-28}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(111,232,214,0.08)", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 22 }}>
                  <span className="pulse-dot" style={{ width: 5, height: 5, background: "#6fe8d6", borderRadius: "50%", display: "inline-block" }} />
                  <span style={{ color: "#6fe8d6", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>JOIN 5,000+ NIGERIAN MERCHANTS</span>
                </div>
                <h2 style={{ fontSize: "clamp(28px,3.8vw,58px)", fontWeight: 300, color: "#fff", lineHeight: 1.15, marginBottom: 18 }}>Turn Every Smartphone into a Payment Terminal</h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.8, marginBottom: 10 }}>No POS machine. No long waits. Just a QR code — customers pay instantly in naira.</p>
                <p style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.2)", marginBottom: 36 }}>Your QR Code. Your Business. Instant Naira Payments.</p>
                <div className="cta-btns" style={{ display: "flex", gap: 12 }}>
                  <Link href="/register?role=merchant" onClick={handleGetStartedClick}><button className="btn-lime">Register Your Business</button></Link>
                  <button className="btn-ghost-dark" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>Request a Demo</button>
                </div>
              </div>
            </SectionReveal>
            <SectionReveal sectionId="cta" delay={0.28} scale={0.92} y={20} className="cta-visual">
              <div style={{ position: "relative", height: 360 }}>
                <div style={{ position: "absolute", left: 0, top: 0, right: 50, bottom: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: 22, backdropFilter: "blur(10px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div><p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 2 }}>TODAY'S REVENUE</p><p style={{ color: "#fff", fontSize: 26, fontWeight: 300, letterSpacing: -1 }}>₦ 847,500</p></div>
                    <div style={{ background: "rgba(111,232,214,0.1)", border: "1px solid rgba(111,232,214,0.2)", borderRadius: 9, padding: "4px 11px" }}><p style={{ color: "#6fe8d6", fontSize: 11, fontWeight: 600 }}>+12.4%</p></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64, marginBottom: 16 }}>
                    {[40, 65, 45, 80, 55, 90, 72, 88, 60, 95, 70, 100].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? "#6fe8d6" : `rgba(111,232,214,${0.1 + i * 0.03})`, borderRadius: "2px 2px 0 0" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { name: "Chioma's Boutique", amt: "₦24,500", time: "2 min ago" },
                      { name: "Emeka Stores", amt: "₦8,200", time: "5 min ago" },
                      { name: "Fatima's Kitchen", amt: "₦3,800", time: "11 min ago" },
                    ].map((tx, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 24, height: 24, background: `rgba(111,232,214,${0.3 - i * 0.08})`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, fontWeight: 700, color: "#1a1a1a" }}>{tx.name[0]}</span></div>
                          <div><p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 500 }}>{tx.name}</p><p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{tx.time}</p></div>
                        </div>
                        <p style={{ color: "#6fe8d6", fontSize: 12, fontWeight: 500 }}>{tx.amt}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: "absolute", right: 0, top: 14, width: 130, height: 148, background: "#fff", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", transform: "rotate(6deg)" }}>
                  <p style={{ fontSize: 6, fontWeight: 700, color: "#aaa", letterSpacing: 2 }}>SCAN TO PAY</p>
                  <QRCodeSVG size={82} />
                  <p style={{ fontSize: 7, fontWeight: 600, color: "#1a1a1a", letterSpacing: 1.5 }}>BadePay</p>
                </div>
                <div style={{ position: "absolute", right: -8, bottom: 14, background: "rgba(10,10,10,0.95)", border: "1px solid rgba(111,232,214,0.3)", borderRadius: 12, padding: "8px 11px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}>
                  <div style={{ width: 24, height: 24, background: "#6fe8d6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                  <div><p style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>₦12,000 received</p><p style={{ color: "rgba(255,255,255,0.35)", fontSize: 8 }}>From Biodun • Now</p></div>
                </div>
              </div>
            </SectionReveal>
          </div>
          <SectionReveal sectionId="cta" delay={0.48} y={12}>
            <div className="cta-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, maxWidth: 1640, margin: "0 auto", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <img src="/favicon.png" alt="BadePay" style={{ height: 30, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 300 }}>© 2026 BadePay Inc. Nigeria's QR Payment Leader.</p>
              <div className="cta-footer-links" style={{ display: "flex", gap: 20 }}>
                <a href="mailto:support@badepay.ng" className="nav-a" style={{ fontSize: 11 }}>Contact</a>
                <a href="mailto:support@badepay.ng" className="nav-a" style={{ fontSize: 11 }}>Support</a>
                <a href="#" className="nav-a" style={{ fontSize: 11 }}>Legal</a>
              </div>
            </div>
          </SectionReveal>
        </SnapSection>

      </div>
    </>
  );
}