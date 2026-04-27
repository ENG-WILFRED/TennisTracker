"use client";

import Link from "next/link";

const G = {
  dark: "#0a180a",
  sidebar: "#152515",
  card: "#1a3020",
  card2: "#1b2f1b",
  cardBorder: "#2d5a35",
  border: "#243e24",
  mid: "#2d5a27",
  lime: "#7dc142",
  accent: "#a8d84e",
  text: "#e8f5e0",
  text2: "#c2dbb0",
  muted: "#7aaa6a",
  muted2: "#5e8e50",
  red: "#d94f4f",
  yellow: "#f0c040",
};

const courtLines = [
    { type: "h", top: "15%", opacity: 0.06 },
    { type: "h", top: "50%", opacity: 0.12 },
    { type: "h", top: "85%", opacity: 0.06 },
    { type: "v", left: "10%", opacity: 0.06 },
    { type: "v", left: "50%", opacity: 0.12 },
    { type: "v", left: "90%", opacity: 0.06 },
];

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using VICO Tennis Tracker ("the Platform"), you confirm that you are at least 13 years of age, have read and understood these Terms, and agree to be bound by them. If you are using the Platform on behalf of an organization, you represent that you have authority to bind that organization to these Terms.

If you do not agree to these Terms, you must not access or use the Platform.`,
  },
  {
    id: "accounts",
    title: "2. User Accounts & Registration",
    content: `When you create an account, you must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.

You agree to notify us immediately of any unauthorized use of your account. VICO cannot and will not be liable for any loss or damage arising from your failure to protect your credentials.

Each person may maintain only one account unless explicitly authorized by VICO. Accounts are non-transferable.`,
  },
  {
    id: "roles",
    title: "3. User Roles & Permissions",
    content: `The Platform supports seven distinct roles: Players, Coaches, Referees, Staff, Finance Officers, Organization Admins, and Spectators. Each role carries specific permissions and responsibilities.

Organization Admins are responsible for managing their club's data, members, and compliance with these Terms. Coaches and Referees must ensure their credentials and certifications are accurate and up to date. Players and Spectators agree to engage respectfully with all Platform features and community members.

VICO reserves the right to modify role permissions at any time with reasonable notice.`,
  },
  {
    id: "conduct",
    title: "4. Acceptable Use",
    content: `You agree not to use the Platform to: upload or transmit harmful, offensive, or unlawful content; impersonate any person or entity; attempt to gain unauthorized access to any part of the Platform; interfere with or disrupt the integrity of the Platform; use automated scripts or bots to scrape or interact with the Platform; engage in any activity that violates applicable laws or regulations.

VICO reserves the right to suspend or terminate accounts that violate these conduct standards without prior notice.`,
  },
  {
    id: "payments",
    title: "5. Payments & Billing",
    content: `The Platform integrates with M-Pesa, PayPal, and Stripe to process payments for court bookings, membership fees, coaching sessions, and tournament entry fees. By initiating a payment, you agree to the terms of the applicable payment provider.

All fees are displayed inclusive of applicable taxes unless otherwise stated. Refunds are subject to the cancellation policies set by individual organizations. VICO is not responsible for payment disputes between users and organizations, though we will cooperate in good faith to assist resolution.

Outstanding balances may result in restricted access to Platform features.`,
  },
  {
    id: "bookings",
    title: "6. Court Bookings & Cancellations",
    content: `Court bookings are subject to real-time availability and the pricing policies of the relevant organization, including peak-hour surcharges. A booking is confirmed only upon receipt of payment confirmation.

Cancellations made within the organization's stated cancellation window may incur a cancellation fee. VICO is not liable for court conditions, facility closures, or disputes arising from on-site experiences. Any disputes regarding bookings should first be raised with the relevant organization.`,
  },
  {
    id: "content",
    title: "7. User-Generated Content",
    content: `You retain ownership of content you submit (including profile photos, bios, and chat messages). By submitting content, you grant VICO a non-exclusive, worldwide, royalty-free licence to use, display, and distribute that content solely for the purposes of operating and improving the Platform.

You are solely responsible for content you submit. VICO reserves the right to remove content that violates these Terms or that we deem harmful, without prior notice.`,
  },
  {
    id: "ip",
    title: "8. Intellectual Property",
    content: `All Platform content, branding, software, and design — including the VICO name, logo, and interface — are the intellectual property of VICO or its licensors and are protected by applicable copyright, trademark, and other laws.

You may not reproduce, distribute, modify, or create derivative works from any Platform content without our express written permission.`,
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers & Limitation of Liability",
    content: `The Platform is provided "as is" and "as available" without warranties of any kind, express or implied. VICO does not warrant that the Platform will be uninterrupted, error-free, or free of viruses.

To the maximum extent permitted by law, VICO shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of data, revenue, or reputation.`,
  },
  {
    id: "termination",
    title: "10. Termination",
    content: `You may delete your account at any time by contacting support or through account settings. Upon termination, your right to use the Platform ceases immediately.

VICO may suspend or terminate your account at its sole discretion, with or without cause, and with or without notice, particularly where there is a violation of these Terms, suspected fraudulent activity, or legal obligation to do so.`,
  },
  {
    id: "changes",
    title: "11. Changes to These Terms",
    content: `We may update these Terms from time to time. When we do, we will revise the "Last Updated" date at the top of this page. For material changes, we will provide notice via email or a prominent in-app notification at least 14 days before the changes take effect.

Your continued use of the Platform after changes become effective constitutes your acceptance of the revised Terms.`,
  },
  {
    id: "law",
    title: "12. Governing Law",
    content: `These Terms are governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts located in Nairobi, Kenya.`,
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: `If you have any questions about these Terms, please contact us at:

VICO Tennis Tracker
Email: vicotennis0@gmail.com
Address: Kilifi, Kenya`,
  },
];

export default function TermsPage() {
    const scrollToSection = (id: string) => {
        const el = document.getElementById("sec-" + id);
        const panel = document.getElementById("content-panel");
        if (el && panel) {
            panel.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
        }
    };

    // Check URL parameters for context
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const isAcceptingTerms = urlParams.has('acceptingterms');
    const isRegistering = urlParams.has('registering');
    const contextSearch = typeof window !== 'undefined' ? window.location.search : '';
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .terms-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Fixed shell ── */
        .page-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          background: ${G.dark};
          color: ${G.text};
        }

        /* ── Top shimmer & topbar: never scroll ── */
        .shimmer-bar {
          background: linear-gradient(90deg, ${G.lime}, ${G.accent}, ${G.lime});
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
          flex-shrink: 0;
          height: 3px;
          width: 100%;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .topbar {
          flex-shrink: 0;
          background: ${G.sidebar};
          border-bottom: 1px solid ${G.border};
        }
        .topbar-inner {
          padding: 1.2rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .hero {
          flex-shrink: 0;
          background: ${G.sidebar};
          border-bottom: 1px solid ${G.border};
          padding: 2.5rem 1.5rem;
        }

        /* ── Scrollable body ── */
        .main-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        /* Court-line backdrop */
        .court-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        /* ── TOC sidebar: fixed height, own scroll ── */
        .toc-panel {
          width: 260px;
          flex-shrink: 0;
          background: ${G.sidebar};
          border-right: 1px solid ${G.border};
          overflow-y: auto;
          padding: 1.5rem 1rem;
          z-index: 1;
        }

        /* ── Content panel: fixed height, own scroll ── */
        .content-panel {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          z-index: 1;
          scroll-behavior: smooth;
        }

        /* ── TOC link styles ── */
        .toc-link {
          display: block;
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 13px;
          color: ${G.muted};
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          border-left: 2px solid transparent;
          cursor: pointer;
          background: none;
          border-top: none;
          border-right: none;
          border-bottom: none;
          text-align: left;
          width: 100%;
        }
        .toc-link:hover {
          background: ${G.card2};
          color: ${G.text2};
          border-left-color: ${G.lime};
        }
        .toc-link.active {
          background: rgba(124,193,66,0.1);
          color: ${G.lime};
          border-left-color: ${G.lime};
        }

        /* ── Section cards ── */
        .section-card {
          background: ${G.card};
          border: 1px solid ${G.border};
          border-radius: 14px;
          padding: 1.8rem;
          margin-bottom: 1rem;
          scroll-margin-top: 1.5rem;
        }

        /* ── Responsive: collapse TOC on small screens ── */
        @media (max-width: 700px) {
          .toc-panel { display: none; }
          .page-shell { height: auto; overflow: visible; }
          .main-body { overflow: visible; flex-direction: column; }
          .content-panel { overflow: visible; }
        }

        @media (max-width: 480px) {
          .content-panel { padding: 1rem 0.75rem; }
          .section-card { padding: 1.2rem; border-radius: 12px; }
        }
      `}</style>

            <div className="page-shell">

                {/* ── Top shimmer ── */}
                <div className="shimmer-bar" />

                {/* ── Top bar ── */}
                <div className="topbar">
                    <div className="topbar-inner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, background: G.lime, borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: G.dark,
                            }}>V</div>
                            <div>
                                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: G.text, letterSpacing: 2 }}>VICO</div>
                                <div style={{ fontSize: 9, color: G.muted, letterSpacing: 2, textTransform: 'uppercase', marginTop: -3 }}>Tennis Tracker</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link href="/login" style={{ color: G.text2, textDecoration: 'none', padding: '10px 16px', border: `1px solid ${G.border}`, borderRadius: 10, background: G.card2 }}>Sign In</Link>
                            <Link href="/register" style={{ color: G.dark, textDecoration: 'none', padding: '10px 16px', borderRadius: 10, background: G.lime, fontWeight: 700 }}>Create Account</Link>
                        </div>
                    </div>
                </div>

                {/* ── Hero banner ── */}
                <div className="hero">
                    <div style={{ fontSize: 11, color: G.lime, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, padding: '6px 12px', borderRadius: 999, border: `1px solid ${G.cardBorder}`, display: 'inline-block', background: 'rgba(124,193,66,0.08)' }}>
                        Legal Document
                    </div>
                    <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(28px, 5vw, 48px)', color: G.text, letterSpacing: 2, lineHeight: 1, marginBottom: 10 }}>
                        TERMS OF <span style={{ color: G.lime }}>SERVICE</span>
                    </h1>
                    <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.7, maxWidth: 640 }}>
                        Please read these terms carefully before using the VICO Tennis Tracker platform. By creating an account, you agree to be bound by the following terms and conditions.
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: G.muted2 }}>📅 Last Updated: April 13, 2026</span>
                        <span style={{ fontSize: 12, color: G.muted2 }}>📍 Governed by Kenyan Law</span>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="main-body">

                    {/* Court-line backdrop */}
                    <div className="court-lines">
                        {courtLines.map((l, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                background: `rgba(125,193,66,${l.opacity})`,
                                ...(l.type === 'h'
                                    ? { height: 1, width: '100%', top: l.top }
                                    : { width: 1, height: '100%', left: l.left }),
                            }} />
                        ))}
                    </div>

                    {/* ── TOC panel — does NOT scroll with content ── */}
                    <div className="toc-panel">
                        <div style={{ fontSize: 10, color: G.muted2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, paddingLeft: 4 }}>
                            Contents
                        </div>
                        {sections.map((item) => (
                            <button
                                key={item.id}
                                className="toc-link"
                                onClick={() => scrollToSection(item.id)}
                            >
                                {item.title}
                            </button>
                        ))}
                        <div style={{ height: 1, background: G.border, margin: '12px 0' }} />
                        <Link href={`/privacy${contextSearch}`} className="toc-link" style={{ color: G.lime }}>→ Privacy Policy</Link>
                    </div>

                    {/* ── Content panel — scrolls independently ── */}
                    <div className="content-panel" id="content-panel">
                        {sections.map((section) => (
                            <div key={section.id} id={"sec-" + section.id} className="section-card">
                                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: G.lime, marginBottom: 12 }}>
                                    {section.title}
                                </h2>
                                {section.content.split("\n\n").map((paragraph, index) => (
                                    <p key={index} style={{ fontSize: 14, color: G.text2, lineHeight: 1.8, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        ))}

                        {/* Footer cards */}
                        <div style={{ display: 'grid', gap: 12, marginTop: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 14, padding: '1.5rem' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>Questions about these Terms?</div>
                                <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.7 }}>
                                    We're happy to clarify anything. Reach out at{' '}
                                    <a href="mailto:kimaniwilfred95@gmail.com" style={{ color: G.lime, textDecoration: 'none' }}>kimaniwilfred95@gmail.com</a>{' '}
                                    for questions or data requests.
                                </p>
                            </div>
                            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: '1.5rem', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: G.muted2, marginBottom: 6 }}>Next steps</div>
                                    <p style={{ fontSize: 14, color: G.text2, lineHeight: 1.7 }}>
                                        {isAcceptingTerms ? 'Review our privacy policy before continuing, and return here anytime to understand your rights and obligations.' : 'Review our privacy policy before registering, and return here anytime to understand your rights and obligations.'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {isAcceptingTerms ? (
                                        <>
                                            <Link href={`/accept-terms${contextSearch}`} style={{ padding: '10px 16px', borderRadius: 10, background: G.lime, color: G.dark, textDecoration: 'none', fontWeight: 700 }}>
                                                {isRegistering ? 'Accept and Return to Registration' : 'Accept and Return to Login'}
                                            </Link>
                                            <Link href={`/privacy${contextSearch}`} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.card2, color: G.muted, textDecoration: 'none' }}>
                                                Read Privacy Policy
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => window.history.back()}
                                                style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.card2, color: G.muted, cursor: 'pointer' }}
                                            >
                                                Back
                                            </button>
                                            <Link href={`/privacy`} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.card2, color: G.muted, textDecoration: 'none' }}>Read Privacy Policy</Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}