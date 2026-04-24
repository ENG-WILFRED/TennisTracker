"use client";

import Link from "next/link";

const G = {
    dark: "#0a180a",
    sidebar: "#152515",
    card: "#1a3020",
    card2: "#1b2f1b",
    cardBorder: "#2d5a35",
    border: "#243e24",
    lime: "#7dc142",
    text: "#e8f5e0",
    text2: "#c2dbb0",
    muted: "#7aaa6a",
    muted2: "#5e8e50",
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
        id: "overview",
        title: "1. Privacy Policy Overview",
        content: `VICO Tennis Tracker collects and processes personal information so that we can deliver results, manage accounts, and improve the platform. We aim to protect your data and use it only for the purposes described in this policy.

By using VICO, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the service and contact us for assistance.`,
    },
    {
        id: "data",
        title: "2. Information We Collect",
        content: `We collect information you provide directly, such as name, email, username, password, profile photo, phone, gender, and organization details.

We also collect usage data, activity logs, court booking records, tournament participation details, messages, and device information to deliver and improve the service.`,
    },
    {
        id: "use",
        title: "3. How We Use Your Information",
        content: `Your personal information is used to create and manage your account, confirm logins, process bookings, coordinate events, provide support, and deliver notifications.

We may also use aggregated and anonymized data for analytics, product improvements, fraud detection, and security monitoring.`,
    },
    {
        id: "sharing",
        title: "4. Information Sharing",
        content: `We do not sell your personal information.

We may share data with service providers that support the platform, payment partners for booking transactions, and organizations when required by your role or membership.

We may also disclose information when required by law or to protect VICO's rights, safety, or property.`,
    },
    {
        id: "security",
        title: "5. Data Security",
        content: `We use industry-standard safeguards to protect your information, including encryption, access controls, and regular security reviews.

However, no system is completely secure, and we cannot guarantee absolute protection. Please keep your password safe and report suspicious account activity immediately.`,
    },
    {
        id: "cookies",
        title: "6. Cookies & Tracking",
        content: `The platform may use cookies and similar technologies to improve your experience, remember preferences, and analyze usage.

You can manage cookies through your browser settings, but disabling them may affect some features.`,
    },
    {
        id: "rights",
        title: "7. Your Rights",
        content: `You may request access to, correction of, or deletion of your personal information by contacting support.

If you are an organization admin, you may also manage your organization's user data as permitted by the platform and applicable law.`,
    },
    {
        id: "changes",
        title: "8. Changes to This Policy",
        content: `We may update this Privacy Policy from time to time. Material changes will be communicated by email or in-app notification before they take effect.

Your continued use of VICO after updates constitutes acceptance of the revised policy.`,
    },
    {
        id: "contact",
        title: "9. Contact Information",
        content: `If you have questions about privacy or data handling, contact us at:

VICO Tennis Tracker
Email: vicotennis0@gmail.com
Address: Kilifi, Kenya`,
    },
];

export default function PrivacyPage() {
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

        .privacy-root * { box-sizing: border-box; margin: 0; padding: 0; }

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

        /* ── Topbar & hero: never scroll ── */
        .topbar {
          flex-shrink: 0;
          background: ${G.sidebar};
          border-bottom: 1px solid ${G.border};
        }
        .topbar-inner {
          padding: 1rem 1.5rem;
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
          padding: 2rem 1.5rem;
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
                        Privacy Policy
                    </div>
                    <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(28px, 5vw, 48px)', color: G.text, letterSpacing: 2, lineHeight: 1, marginBottom: 10 }}>
                        YOUR DATA. YOUR CONTROL.
                    </h1>
                    <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.7, maxWidth: 640 }}>
                        We collect and manage the information needed to power your tennis experience securely, fairly, and transparently.
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
                        <Link href={`/terms${contextSearch}`} className="toc-link" style={{ color: G.lime }}>→ Terms of Service</Link>
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
                                <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>Need help with privacy?</div>
                                <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.7 }}>
                                    Reach out to our team at{' '}
                                    <a href="mailto:kimaniwilfred95@gmail.com" style={{ color: G.lime, textDecoration: 'none' }}>kimaniwilfred95@gmail.com</a>{' '}
                                    for questions or data requests.
                                </p>
                            </div>
                            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: '1.5rem', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: G.muted2, marginBottom: 6 }}>Next steps</div>
                                    <p style={{ fontSize: 14, color: G.text2, lineHeight: 1.7 }}>
                                        {isAcceptingTerms ? 'Review our terms before continuing, and return here anytime to understand how your information is used.' : 'Review our terms before registering, and return here anytime to understand how your information is used.'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {isAcceptingTerms ? (
                                        <>
                                            <Link href={`/accept-terms${contextSearch}`} style={{ padding: '10px 16px', borderRadius: 10, background: G.lime, color: G.dark, textDecoration: 'none', fontWeight: 700 }}>
                                                {isRegistering ? 'Accept and Return to Registration' : 'Accept and Return to Login'}
                                            </Link>
                                            <Link href={`/terms${contextSearch}`} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.card2, color: G.muted, textDecoration: 'none' }}>
                                                Read Terms
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
                                            <Link href={`/terms`} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.card2, color: G.muted, textDecoration: 'none' }}>Read Terms</Link>
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