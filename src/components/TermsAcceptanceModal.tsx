"use client";

import { useState } from "react";
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
};

interface TermsAcceptanceModalProps {
  pendingLoginData: any;
  tokens: { accessToken: string; refreshToken: string };
  onAccepted: () => void;
  onDecline: () => void;
  onError: (error: string) => void;
}

export function TermsAcceptanceModal({ pendingLoginData, tokens, onAccepted, onDecline, onError }: TermsAcceptanceModalProps) {
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  const handleAcceptTerms = async () => {
    setAcceptingTerms(true);
    try {
      onAccepted();
    } catch (error: any) {
      onError(error.message || 'Unable to accept terms.');
      setAcceptingTerms(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center py-8 px-4">
      <div style={{ width: '100%', maxWidth: 520, background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 20, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div className="shimmer-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }} />
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: G.text, letterSpacing: 1.2, marginBottom: 8 }}>
            Accept Terms to Continue
          </div>
          <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.7 }}>
            Before you can continue, please accept our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 16, background: G.card2, border: `1px solid ${G.border}` }}>
          <p style={{ fontSize: 13, color: G.text2, lineHeight: 1.8 }}>
            Your account is almost ready. Review our{' '}
            <Link href="/terms?acceptingterms=true&registering=false"  style={{ color: G.lime, textDecoration: 'none' }}>Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy?acceptingterms=true&registering=false"  style={{ color: G.lime, textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAcceptTerms}
          disabled={acceptingTerms}
          style={{
            width: '100%', padding: 14,
            background: acceptingTerms ? G.mid : G.lime,
            border: 'none', borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
            color: G.dark, cursor: acceptingTerms ? 'not-allowed' : 'pointer',
            opacity: acceptingTerms ? 0.75 : 1,
            marginBottom: '1rem',
          }}
        >
          {acceptingTerms ? 'Accepting terms…' : 'Accept and Login'}
        </button>

        <button
          type="button"
          onClick={onDecline}
          style={{
            width: '100%', padding: 12,
            background: 'transparent',
            border: `1px solid ${G.border}`,
            borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            color: G.muted, cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          Decline Terms
        </button>

        <p style={{ fontSize: 12, color: G.muted2, textAlign: 'center' }}>
          Once accepted, you will be able to continue into your VICO dashboard.
        </p>
      </div>
    </div>
  );
}