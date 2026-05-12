'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastContext';

const G = {
  dark: '#0a180a',
  sidebar: '#152515',
  card: '#1a3020',
  card2: '#1b2f1b',
  card3: '#203520',
  cardBorder: '#2d5a35',
  border: '#243e24',
  border2: '#326832',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  yellow: '#f0c040',
  blue: '#4a9eff',
  red: '#d94f4f',
  text: '#e8f5e0',
  text2: '#c2dbb0',
  muted: '#7aaa6a',
  muted2: '#5e8e50',
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok) {
        addToast(result?.error || 'Unable to send reset OTP.', 'error');
      } else {
        addToast(result?.message || 'A reset code has been sent to your email.', 'success');
        router.push('/reset-password');
      }
    } catch (err) {
      addToast('Unable to send reset OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="root">
      <div className="card">
        <div className="headline">Reset your password</div>
        <p className="subtitle">Enter the email address linked to your Vico Tennis account and we’ll send a one-time OTP code.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Sending code…' : 'Send reset code'}
          </button>
        </form>

        <p className="helper">
          Already have a code?{' '}
          <Link href="/reset-password" className="link">
            Enter it here
          </Link>
        </p>

        <p className="helper">
          <Link href="/login" className="link">
            Back to login
          </Link>
        </p>
      </div>

      <style jsx>{`
        .root {
          min-height: 100vh;
          padding: 48px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, ${G.lime}22, transparent 28%),
                      linear-gradient(180deg, #07110c 0%, #09160e 100%);
          color: ${G.text};
        }

        .card {
          width: 100%;
          max-width: 520px;
          background: ${G.card};
          border: 1px solid ${G.border};
          border-radius: 24px;
          box-shadow: 0 36px 90px rgba(0, 0, 0, 0.24);
          padding: 40px;
        }

        .headline {
          margin: 0 0 12px;
          font-size: 32px;
          font-weight: 800;
          color: #f8fafc;
        }

        .subtitle {
          margin: 0 0 28px;
          color: ${G.text2};
          line-height: 1.7;
        }

        .field {
          margin-bottom: 20px;
        }

        .label {
          display: block;
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${G.muted2};
        }

        .input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid ${G.border};
          background: ${G.card2};
          color: ${G.text};
          padding: 14px 16px;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input:focus {
          border-color: ${G.lime};
          box-shadow: 0 0 0 4px rgba(125, 193, 66, 0.16);
        }

        .button {
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 14px 16px;
          background: ${G.lime};
          color: ${G.dark};
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 18px 30px rgba(125, 193, 66, 0.16);
        }

        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .message {
          margin-top: 20px;
          line-height: 1.7;
          font-size: 14px;
        }

        .success {
          color: #b7f2b0;
        }

        .error {
          color: #f8b4b4;
        }

        .helper {
          margin-top: 28px;
          font-size: 14px;
          color: ${G.text2};
          text-align: center;
        }

        .link {
          color: ${G.lime};
          text-decoration: none;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
