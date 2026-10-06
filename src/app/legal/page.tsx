import { Link } from "wouter";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

const DOCUMENTS = [
  {
    href: "/terms",
    title: "Terms & Conditions",
    body: "Govern your access to and use of the BadePay application, website, payment services, merchant services, and other products provided by BadePay.",
    note: "By creating an account or using BadePay, you agree to comply with our Terms & Conditions.",
  },
  {
    href: "/privacy",
    title: "Privacy Policy",
    body: "Explains how BadePay collects, uses, stores, protects, and shares personal information in connection with our services.",
    note: "We are committed to protecting your personal information and handling it responsibly in accordance with applicable data protection requirements.",
  },
  {
    href: "/cookies",
    title: "Cookie Policy",
    body: "Explains how cookies and similar technologies may be used on the BadePay website and related digital services.",
  },
  {
    href: "/aml-kyc",
    title: "AML & KYC Policy",
    body: "BadePay maintains procedures designed to help prevent fraud, money laundering, terrorist financing, identity theft, and other unlawful activities.",
    note: "Our AML/KYC requirements may include identity verification, transaction monitoring, sanctions screening, and other compliance measures required by applicable laws and our financial/payment partners.",
  },
  {
    href: "/refunds",
    title: "Refund & Dispute Policy",
    body: "Explains how users and merchants can report payment issues, request refunds where applicable, and raise transaction disputes.",
  },
];

const SECTIONS: LegalSection[] = [
  {
    id: "regulatory",
    title: "Regulatory & Compliance",
    blocks: [
      { p: "BadePay may work with licensed banks, payment service providers, switching companies, payment processors, technology providers, and other regulated or authorized partners to provide its services." },
      { p: "Where a service is provided or processed by a third-party financial institution or payment service provider, the applicable terms, conditions, and regulatory requirements of that provider may also apply." },
      { p: "BadePay will comply with applicable Nigerian laws and regulatory requirements relevant to the services it provides and the activities undertaken through the platform." },
    ],
  },
  {
    id: "electronic-communications",
    title: "Electronic Communications",
    blocks: [
      { p: "By using BadePay, you consent to receiving electronic communications relating to your account and transactions, including:" },
      { list: ["Transaction confirmations", "OTP and security notifications", "Account alerts", "Service announcements", "Important policy updates", "Customer support communications", "Regulatory or compliance notices"] },
      { p: "Electronic communications may be delivered through the BadePay application, email, SMS, or other approved communication channels." },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    blocks: [
      { p: "Unless otherwise stated, BadePay and its associated branding, logos, software, designs, content, graphics, interfaces, trademarks, and other materials are owned by or licensed to BadePay." },
      { p: "You may not copy, reproduce, modify, distribute, reverse engineer, or commercially exploit BadePay's intellectual property without prior written authorization, except where permitted by applicable law." },
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    blocks: [
      { p: "BadePay may integrate with third-party services, including financial institutions, payment processors, identity verification providers, cloud infrastructure providers, analytics providers, and other technology partners." },
      { p: "Your use of certain third-party services may be subject to additional terms and privacy policies provided by those third parties." },
    ],
  },
  {
    id: "fraud-security",
    title: "Fraud & Security",
    blocks: [
      { p: "BadePay takes security and fraud prevention seriously." },
      { p: "We may monitor transactions, accounts, devices, and other activity to identify suspicious or unauthorized activity." },
      { p: "BadePay may suspend, restrict, or terminate an account or transaction where we reasonably believe that there is a security, fraud, compliance, legal, or regulatory concern." },
      { callout: "Never share your PIN, password, OTP, or authentication credentials with anyone." },
      { p: "BadePay will not ask you to disclose your OTP or PIN through an unsolicited communication." },
    ],
  },
  {
    id: "legal-notices",
    title: "Legal Notices",
    blocks: [
      { p: "BadePay may update its legal documents from time to time to reflect changes in its services, business operations, technology, or applicable laws and regulations." },
      { p: "Users are responsible for reviewing the applicable legal documents periodically." },
      { p: "Continued use of BadePay after an updated legal document becomes effective may constitute acceptance of the updated terms, where permitted by applicable law." },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    blocks: [
      { p: "For legal, privacy, compliance, or general enquiries, please contact:" },
      { contact: true },
      { link: { href: "/contact", label: "Go to the Contact page" } },
    ],
  },
];

function DocumentCards() {
  return (
    <section className="ld-section" style={{ borderTop: "none", paddingTop: 0 }}>
      <style>{`
        .lg-cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .lg-card { display:flex; flex-direction:column; gap:10px; padding:22px; border-radius:18px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.025); transition:all 0.25s; }
        .lg-card:hover { border-color:rgba(111,232,214,0.45); background:rgba(111,232,214,0.05); transform:translateY(-2px); }
        .lg-card:hover .lg-arrow { transform:translateX(4px); }
        .lg-arrow { transition:transform 0.25s; }
        @media (max-width: 640px) { .lg-cards { grid-template-columns:1fr; } }
      `}</style>
      <h2 className="ld-h2" style={{ color: "#fff" }}>Legal Documents</h2>
      <div className="lg-cards">
        {DOCUMENTS.map((d, i) => (
          <Link key={d.href} href={d.href} className="lg-card">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#6fe8d6" }}>0{i + 1}</span>
            <span style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{d.title}</span>
            <span style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>{d.body}</span>
            {d.note && <span style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.4)" }}>{d.note}</span>}
            <span style={{ marginTop: "auto", paddingTop: 6, color: "#6fe8d6", fontSize: 13, fontWeight: 600 }}>
              View {d.title} <span className="lg-arrow" style={{ display: "inline-block" }}>→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <LegalDocument
      title="BadePay Legal"
      eyebrow="Legal Center"
      path="/legal"
      intro={[
        "Welcome to BadePay. This Legal page provides access to the legal terms, policies, and notices that govern your use of the BadePay platform and services.",
        "BadePay is committed to operating its services transparently, securely, and in accordance with applicable laws and regulatory requirements.",
      ]}
      lead={<DocumentCards />}
      sections={SECTIONS}
      showRelated={false}
    />
  );
}
