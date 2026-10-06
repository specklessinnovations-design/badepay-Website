import type { LegalSection } from "@/components/legal/LegalDocument";

// ─── Terms & Conditions ───────────────────────────────────────────────────────
export const TERMS_INTRO = [
  "These Terms & Conditions (“Terms”) govern your access to and use of the BadePay application, website, payment services, merchant services, and other products provided by BadePay (“BadePay”, “we”, “us”, or “our”) (collectively, the “Services”).",
  "By creating an account or using BadePay, you agree to comply with these Terms. If you do not agree, you should not use the Services.",
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "about",
    title: "1. About BadePay",
    blocks: [
      { p: "BadePay is a digital payment platform that enables users and merchants to make and receive payments through supported payment channels, including QR-based payments and other services that may be introduced from time to time." },
      { p: "BadePay may work with licensed banks, payment service providers, switching companies, payment processors, technology providers, and other regulated or authorized partners to provide its services. Where a service is provided or processed by a third-party financial institution or payment service provider, the applicable terms, conditions, and regulatory requirements of that provider may also apply." },
    ],
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    blocks: [
      { p: "To use BadePay you must:" },
      { list: [
        "Meet the minimum age permitted to use financial and payment services under applicable law",
        "Have the legal capacity to enter into a binding agreement",
        "Provide accurate, current, and complete information during registration",
        "Not be prohibited from using payment services under applicable laws or sanctions",
      ] },
      { p: "Merchants must also be duly registered or authorized to carry on the business for which they accept payments through BadePay." },
    ],
  },
  {
    id: "account",
    title: "3. Your Account",
    blocks: [
      { p: "You are responsible for maintaining the confidentiality of your login credentials, PIN, OTPs, and devices, and for all activity that occurs under your account." },
      { p: "You must keep the information associated with your account accurate and up to date, and notify us immediately if you believe your account has been compromised." },
      { callout: "Never share your PIN, password, OTP, or authentication credentials with anyone. BadePay will not ask you to disclose your OTP or PIN through an unsolicited communication." },
    ],
  },
  {
    id: "verification",
    title: "4. Identity Verification",
    blocks: [
      { p: "Access to some or all features of the Services may depend on successful completion of identity verification (KYC). We may request information and documents such as government-issued identification, NIN, BVN, proof of address, or business registration details where legally permitted and required." },
      { p: "Transaction and account limits may apply depending on your verification level, and we may decline, limit, or suspend Services where verification cannot be completed." },
      { link: { href: "/aml-kyc", label: "Read our AML & KYC Policy" } },
    ],
  },
  {
    id: "payments",
    title: "5. Payments and Transactions",
    blocks: [
      { p: "When you initiate a payment, you authorize BadePay and its partners to process the transaction according to your instructions. You are responsible for confirming the recipient, merchant, and amount before authorizing a payment." },
      { list: [
        "Completed transactions may not be reversible except as described in our Refund & Dispute Policy or as required by law",
        "Transactions may be delayed, declined, or held for review for security, fraud-prevention, compliance, or technical reasons",
        "Applicable fees, where any, will be disclosed to you before you confirm a transaction",
        "Transaction records will be available in your account history",
      ] },
    ],
  },
  {
    id: "merchants",
    title: "6. Merchant Obligations",
    blocks: [
      { p: "Merchants who accept payments through BadePay agree to:" },
      { list: [
        "Provide accurate business information and keep it up to date",
        "Accept payments only for lawful goods and services",
        "Display accurate prices and honour completed transactions",
        "Handle customer complaints, refunds, and disputes fairly and promptly",
        "Cooperate with BadePay in investigating suspicious or disputed transactions",
        "Comply with applicable laws, including consumer protection and tax laws",
      ] },
    ],
  },
  {
    id: "prohibited",
    title: "7. Prohibited Use",
    blocks: [
      { p: "You must not use BadePay to:" },
      { list: [
        "Engage in fraud, money laundering, terrorist financing, or any other unlawful activity",
        "Process payments for illegal, counterfeit, or restricted goods or services",
        "Impersonate any person or misrepresent your identity or affiliation",
        "Access or attempt to access another person's account without authorization",
        "Interfere with, disrupt, or attempt to compromise the security of the Services",
        "Copy, reverse engineer, or commercially exploit any part of the Services without authorization",
      ] },
    ],
  },
  {
    id: "suspension",
    title: "8. Suspension and Termination",
    blocks: [
      { p: "BadePay may suspend, restrict, or terminate an account or transaction where we reasonably believe that there is a security, fraud, compliance, legal, or regulatory concern, or where you breach these Terms." },
      { p: "You may close your account at any time by contacting us. Certain financial and transaction information may need to be retained for periods required by applicable laws and regulations, even after your account is closed." },
    ],
  },
  {
    id: "ip",
    title: "9. Intellectual Property",
    blocks: [
      { p: "Unless otherwise stated, BadePay and its associated branding, logos, software, designs, content, graphics, interfaces, trademarks, and other materials are owned by or licensed to BadePay." },
      { p: "You may not copy, reproduce, modify, distribute, reverse engineer, or commercially exploit BadePay's intellectual property without prior written authorization, except where permitted by applicable law." },
    ],
  },
  {
    id: "third-parties",
    title: "10. Third-Party Services",
    blocks: [
      { p: "BadePay may integrate with third-party services, including financial institutions, payment processors, identity verification providers, cloud infrastructure providers, analytics providers, and other technology partners. Your use of certain third-party services may be subject to additional terms and privacy policies provided by those third parties." },
    ],
  },
  {
    id: "communications",
    title: "11. Electronic Communications",
    blocks: [
      { p: "By using BadePay, you consent to receiving electronic communications relating to your account and transactions, including:" },
      { list: ["Transaction confirmations", "OTP and security notifications", "Account alerts", "Service announcements", "Important policy updates", "Customer support communications", "Regulatory or compliance notices"] },
      { p: "Electronic communications may be delivered through the BadePay application, email, SMS, or other approved communication channels." },
    ],
  },
  {
    id: "liability",
    title: "12. Limitation of Liability",
    blocks: [
      { p: "To the extent permitted by applicable law, BadePay will not be liable for any indirect, incidental, special, or consequential losses arising from your use of the Services, or for losses caused by events beyond our reasonable control, including failures of third-party banks, networks, or service providers." },
      { p: "Nothing in these Terms excludes or limits any liability that cannot be excluded or limited under applicable law." },
    ],
  },
  {
    id: "law",
    title: "13. Governing Law",
    blocks: [
      { p: "These Terms are governed by the laws of the Federal Republic of Nigeria. BadePay will comply with applicable Nigerian laws and regulatory requirements relevant to the services it provides and the activities undertaken through the platform." },
    ],
  },
  {
    id: "changes",
    title: "14. Changes to These Terms",
    blocks: [
      { p: "BadePay may update these Terms from time to time to reflect changes in its services, business operations, technology, or applicable laws and regulations. Users are responsible for reviewing the applicable legal documents periodically." },
      { p: "Continued use of BadePay after updated Terms become effective may constitute acceptance of the updated Terms, where permitted by applicable law." },
    ],
  },
  {
    id: "contact",
    title: "15. Contact Us",
    blocks: [
      { p: "For questions about these Terms, please contact:" },
      { contact: true },
    ],
  },
];

// ─── Cookie Policy ────────────────────────────────────────────────────────────
export const COOKIES_INTRO = [
  "This Cookie Policy explains how BadePay uses cookies and similar technologies on the BadePay website and related digital services. It should be read together with our Privacy Policy.",
];

export const COOKIES_SECTIONS: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "1. What Are Cookies?",
    blocks: [
      { p: "Cookies are small text files stored on your device when you visit a website. Similar technologies include local storage, SDKs, pixels, and log files. They help websites and apps work properly, remember your preferences, and understand how they are used." },
    ],
  },
  {
    id: "how-we-use",
    title: "2. How We Use Cookies",
    blocks: [
      { p: "Our website and application may use cookies and similar technologies to:" },
      { list: ["Keep you signed in", "Remember preferences", "Improve security", "Analyze usage", "Improve performance", "Detect fraudulent or abnormal activity", "Improve our services"] },
    ],
  },
  {
    id: "types",
    title: "3. Types of Cookies We Use",
    blocks: [
      { h: "Strictly necessary" },
      { p: "Required for core functionality such as signing in, keeping your session secure, and remembering your cookie choices. These cannot be switched off in our systems." },
      { h: "Preference" },
      { p: "Remember settings such as theme and language so the experience is consistent across visits." },
      { h: "Analytics and performance" },
      { p: "Help us understand how visitors use the Services so we can troubleshoot issues and improve performance." },
      { h: "Security and fraud prevention" },
      { p: "Help us detect suspicious activity, protect accounts, and prevent unauthorized access." },
    ],
  },
  {
    id: "third-party",
    title: "4. Third-Party Technologies",
    blocks: [
      { p: "Some cookies or similar technologies may be set by trusted third-party providers, such as analytics, infrastructure, or security providers. These providers may process information in accordance with their own privacy policies." },
    ],
  },
  {
    id: "choices",
    title: "5. Managing Your Choices",
    blocks: [
      { p: "When you first visit our website you can accept all cookies or set your preferences through our cookie banner. You may also control cookies through your browser or device settings, including blocking or deleting them." },
      { p: "Some functionality may not operate correctly if certain technologies are disabled." },
    ],
  },
  {
    id: "changes",
    title: "6. Changes to This Policy",
    blocks: [
      { p: "We may update this Cookie Policy from time to time. The updated policy will become effective on the date stated at the top of this page." },
      { link: { href: "/privacy", label: "Read our Privacy Policy" } },
    ],
  },
  {
    id: "contact",
    title: "7. Contact Us",
    blocks: [{ contact: true }],
  },
];

// ─── AML & KYC Policy ─────────────────────────────────────────────────────────
export const AML_INTRO = [
  "BadePay maintains procedures designed to help prevent fraud, money laundering, terrorist financing, identity theft, and other unlawful activities.",
  "Our AML/KYC requirements may include identity verification, transaction monitoring, sanctions screening, and other compliance measures required by applicable laws and our financial/payment partners.",
];

export const AML_SECTIONS: LegalSection[] = [
  {
    id: "commitment",
    title: "1. Our Commitment",
    blocks: [
      { p: "BadePay is committed to complying with applicable Nigerian anti-money laundering (AML), counter-terrorist financing (CFT), and Know Your Customer (KYC) laws and regulations, as well as the requirements of the licensed banks and payment partners we work with." },
    ],
  },
  {
    id: "kyc",
    title: "2. Customer Identification (KYC)",
    blocks: [
      { p: "Where required, we may collect and verify information such as:" },
      { list: [
        "Full name, date of birth, phone number, and address",
        "Government-issued identification or passport",
        "National Identification Number (NIN), where legally permitted and required",
        "Bank Verification Number (BVN), where legally permitted and required",
        "Facial or biometric information where legally required and appropriately processed",
        "Proof of address",
      ] },
      { p: "We will only request information that is reasonably necessary for the relevant purpose." },
    ],
  },
  {
    id: "kyb",
    title: "3. Merchant and Business Verification",
    blocks: [
      { p: "Merchants and business customers may be required to provide:" },
      { list: [
        "Business registration information",
        "Tax or business identification information",
        "Details of directors, owners, or authorized representatives",
        "Information about the nature of the business and expected transaction activity",
      ] },
    ],
  },
  {
    id: "tiers",
    title: "4. Account Tiers and Limits",
    blocks: [
      { p: "Account features and transaction limits may depend on the level of verification completed. Additional information may be requested before higher limits or certain features are made available." },
    ],
  },
  {
    id: "monitoring",
    title: "5. Transaction Monitoring and Screening",
    blocks: [
      { p: "We may monitor transactions, accounts, devices, and usage patterns, and screen customers against sanctions and other relevant lists, to identify and prevent:" },
      { list: ["Fraud", "Money laundering", "Terrorist financing", "Unauthorized transactions", "Account takeover", "Identity theft", "Other unlawful or suspicious activities"] },
    ],
  },
  {
    id: "enhanced",
    title: "6. Enhanced Due Diligence",
    blocks: [
      { p: "Where activity presents a higher risk, we may request additional information, including the source of funds or the purpose of a transaction, and may delay or decline transactions until the review is complete." },
    ],
  },
  {
    id: "reporting",
    title: "7. Reporting and Cooperation",
    blocks: [
      { p: "Where required by law, BadePay may report suspicious activity and share information with relevant financial institutions, payment partners, regulators, law-enforcement agencies, or other authorized parties." },
    ],
  },
  {
    id: "actions",
    title: "8. Account Restrictions",
    blocks: [
      { p: "BadePay may suspend, restrict, or terminate an account or transaction where we reasonably believe that there is a security, fraud, compliance, legal, or regulatory concern, or where requested verification information is not provided." },
    ],
  },
  {
    id: "records",
    title: "9. Record Keeping",
    blocks: [
      { p: "We retain identification and transaction records for the periods required by applicable laws and regulations, even after an account is closed." },
      { link: { href: "/privacy", label: "See how we protect your data" } },
    ],
  },
  {
    id: "contact",
    title: "10. Contact Us",
    blocks: [{ contact: true }],
  },
];

// ─── Refund & Dispute Policy ──────────────────────────────────────────────────
export const REFUNDS_INTRO = [
  "This policy explains how users and merchants can report payment issues, request refunds where applicable, and raise transaction disputes.",
];

export const REFUNDS_SECTIONS: LegalSection[] = [
  {
    id: "scope",
    title: "1. Scope",
    blocks: [
      { p: "This policy applies to payments made or received through BadePay, including QR payments, transfers, and merchant payments." },
    ],
  },
  {
    id: "merchant-refunds",
    title: "2. Refunds for Goods and Services",
    blocks: [
      { p: "Refunds for goods or services purchased from a merchant are primarily governed by that merchant's own refund policy. If you are unhappy with a purchase, please contact the merchant first." },
      { p: "Where a merchant agrees to a refund, it may be processed back to the original payment method or your BadePay balance, where applicable. Processing times may vary depending on the payment method and partners involved." },
    ],
  },
  {
    id: "failed",
    title: "3. Failed, Duplicate, or Incorrect Transactions",
    blocks: [
      { p: "If you were debited for a transaction that failed, was charged twice, or was processed for an incorrect amount, please report it to us. Eligible transactions are typically reversed once our review, and confirmation from the relevant bank or payment partner, is complete." },
    ],
  },
  {
    id: "unauthorized",
    title: "4. Unauthorized Transactions",
    blocks: [
      { p: "If you notice a transaction you did not authorize, contact us immediately. We may temporarily restrict your account to protect it while we investigate." },
      { callout: "Never share your PIN, password, OTP, or authentication credentials with anyone. Transactions authorized using credentials you shared may not be eligible for reversal." },
    ],
  },
  {
    id: "how-to",
    title: "5. How to Raise a Dispute",
    blocks: [
      { p: "You can raise a dispute through the support section of the BadePay app or by emailing us. Please include:" },
      { list: [
        "Your registered name and phone number or email address",
        "The transaction reference",
        "The date, time, and amount of the transaction",
        "The merchant or recipient involved",
        "A description of the issue and any supporting evidence (e.g. receipts or screenshots)",
      ] },
      { p: "We recommend reporting issues as soon as possible after the transaction, as delays may make investigations harder." },
    ],
  },
  {
    id: "process",
    title: "6. How We Handle Disputes",
    blocks: [
      { list: [
        "We will acknowledge your dispute and provide a reference for follow-up",
        "We may contact you, the merchant, or the relevant bank or payment partner for more information",
        "We will inform you of the outcome and any action taken",
      ] },
      { p: "Resolution timelines may depend on the requirements of the banks, card networks, and payment partners involved, and on applicable regulations." },
    ],
  },
  {
    id: "merchants",
    title: "7. Merchant Responsibilities",
    blocks: [
      { p: "Merchants must respond to disputes promptly, provide requested evidence, and honour valid refund requests. BadePay may hold or adjust settlements related to disputed or fraudulent transactions where permitted." },
    ],
  },
  {
    id: "escalation",
    title: "8. Escalation",
    blocks: [
      { p: "If you are not satisfied with the outcome of your dispute, you may ask for it to be reviewed again by replying to our response. You may also have the right to escalate complaints to the relevant regulatory authority under applicable law." },
    ],
  },
  {
    id: "contact",
    title: "9. Contact Us",
    blocks: [
      { contact: true },
      { link: { href: "/contact", label: "Go to the Contact page" } },
    ],
  },
];
