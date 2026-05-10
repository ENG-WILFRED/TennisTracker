'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || 'Unable to reset password.');
      } else {
        setMessage(result?.message || 'Password has been reset successfully.');
      }
    } catch (err) {
      setError('Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="root">
      <div className="card">
        <div className="headline">Create a new password</div>
        <p className="subtitle">Enter the code sent to your email and choose a password for your Vico Tennis account.</p>

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

          <div className="field">
            <label className="label">OTP code</label>
            <input
              className="input"
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="123456"
              required
            />
          </div>

          <div className="field" style={{ position: 'relative' }}>
            <label className="label">New password</label>
            <input
              className="input"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: G.text2,
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          <div className="field" style={{ position: 'relative' }}>
            <label className="label">Confirm password</label>
            <input
              className="input"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: G.text2,
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Resetting password…' : 'Reset password'}
          </button>
        </form>

        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}

        <p className="helper">
          Need a new code?{' '}
          <Link href="/forgot-password" className="link">
            Request another OTP
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
