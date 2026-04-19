"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastContext";

const G = {
  dark: "#0a180a",
  sidebar: "#152515",
  card: "#1a3020",
  card2: "#1b2f1b",
  card3: "#203520",
  cardBorder: "#2d5a35",
  border: "#243e24",
  border2: "#326832",
  mid: "#2d5a27",
  bright: "#3d7a32",
  lime: "#7dc142",
  accent: "#a8d84e",
  yellow: "#f0c040",
  blue: "#4a9eff",
  red: "#d94f4f",
  text: "#e8f5e0",
  text2: "#c2dbb0",
  muted: "#7aaa6a",
  muted2: "#5e8e50",
};

const roles: { label: string; icon: string; description: string }[] = [
  { label: "Player",    icon: "🎾", description: "Compete in tournaments and book courts" },
  { label: "Coach",     icon: "🏅", description: "Offer coaching sessions and guide players" },
  { label: "Referee",   icon: "🟡", description: "Officiate matches and manage events" },
  { label: "Staff",     icon: "🛠️", description: "Manage court operations and logistics" },
];

const courtLines = [
  { type: "h", top: "15%", opacity: 0.06 },
  { type: "h", top: "50%", opacity: 0.12 },
  { type: "h", top: "85%", opacity: 0.06 },
  { type: "v", left: "10%", opacity: 0.06 },
  { type: "v", left: "50%", opacity: 0.12 },
  { type: "v", left: "90%", opacity: 0.06 },
];

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too short", color: G.red },
    { label: "Weak", color: G.red },
    { label: "Fair", color: G.yellow },
    { label: "Good", color: G.lime },
    { label: "Strong", color: G.accent },
  ];
  return { score, ...map[score] };
}

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError]           = useState("");
  const [agreed, setAgreed]         = useState(false);
  const [navigatingToLogin, setNavigatingToLogin] = useState(false);
  const { addToast } = useToast();
  const [loading, setLoading]       = useState(false);

  const strength = getPasswordStrength(password);

  const handleNavigateToLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setNavigatingToLogin(true);
    // Delay navigation to show spinner
    setTimeout(() => {
      router.push('/login');
    }, 600);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      const errMsg = "Please agree to the terms before continuing.";
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    if (password !== passwordConfirm) {
      const errMsg = "Passwords do not match.";
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    if (!firstName || !lastName || !email || !password) {
      const errMsg = "Please complete all required fields.";
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    setLoading(true);
    try {
      // Generate username from first and last name
      const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
      
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: baseUsername,
          email, 
          password, 
          firstName, 
          lastName, 
          acceptedTerms: true 
        }),
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok || registerData.error) {
        throw new Error(registerData.error || 'Registration failed.');
      }

      addToast('Your account was created successfully. Redirecting to login...', 'success');
      
      // Clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      const errMsg = err.message || 'An unexpected error occurred.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .register-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .shimmer-bar {
          background: linear-gradient(90deg, ${G.lime}, ${G.accent}, ${G.lime});
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .float-b1 { animation: float 8s ease-in-out infinite; }
        .float-b2 { animation: float 8s ease-in-out infinite; animation-delay: -4s; }
        @keyframes float {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          33%  { transform: translate(-20px, 20px) rotate(120deg); }
          66%  { transform: translate(15px,-15px) rotate(240deg); }
        }

        .auth-input {
          width: 100%;
          background: ${G.card2};
          border: 1px solid ${G.border};
          border-radius: 8px;
          padding: 10px 12px 10px 38px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: ${G.text};
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input:focus {
          border-color: ${G.lime};
          box-shadow: 0 0 0 3px rgba(125,193,66,0.12);
        }
        .auth-input::placeholder { color: ${G.muted2}; }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s, background 0.3s;
        }

        .eye-icon {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .eye-icon:hover {
          color: ${G.lime};
        }

        .disclaimer-box {
          background: rgba(125, 193, 66, 0.08);
          border: 1px solid ${G.border2};
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 1.25rem;
          font-size: 12px;
          color: ${G.text2};
          line-height: 1.5;
        }

        .brand-panel-stripe {
          background: repeating-linear-gradient(
            -45deg,
            transparent, transparent 40px,
            rgba(125,193,66,0.02) 40px,
            rgba(125,193,66,0.02) 41px
          );
        }

        @media (max-width: 800px) {
          .brand-panel { display: none !important; }
        }
      `}</style>

      <div
        className="register-root"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: G.dark,
          minHeight: "100vh",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Court lines */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
          {courtLines.map((l, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                background: `rgba(125,193,66,${l.opacity})`,
                ...(l.type === "h"
                  ? { height: 1, width: "100%", top: l.top }
                  : { width: 1, height: "100%", left: l.left }),
              }}
            />
          ))}
        </div>

        {/* Floating orbs */}
        <div
          className="float-b1"
          style={{
            position: "fixed", top: -80, right: -60, width: 300, height: 300,
            borderRadius: "50%", zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(circle at 35% 35%, rgba(125,193,66,0.15), rgba(61,122,50,0.04))",
            border: "1px solid rgba(125,193,66,0.08)",
          }}
        />
        <div
          className="float-b2"
          style={{
            position: "fixed", bottom: -100, left: -60, width: 200, height: 200,
            borderRadius: "50%", zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(circle at 35% 35%, rgba(125,193,66,0.12), rgba(61,122,50,0.03))",
            border: "1px solid rgba(125,193,66,0.06)",
          }}
        />

        {/* Brand panel */}
        <div
          className="brand-panel brand-panel-stripe"
          style={{
            flex: "0 0 42%",
            background: G.sidebar,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "3rem",
            position: "relative",
            zIndex: 1,
            borderRight: `1px solid ${G.cardBorder}`,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "4rem" }}>
              <div style={{
                width: 44, height: 44, background: G.lime, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: G.dark, letterSpacing: 1,
              }}>V</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: G.text, letterSpacing: 3 }}>VICO</div>
                <div style={{ fontSize: 10, color: G.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: -4 }}>Tennis Tracker</div>
              </div>
            </div>

            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(52px, 6vw, 80px)",
              color: G.text, lineHeight: 0.95, letterSpacing: 2, marginBottom: "1.5rem",
            }}>
              JOIN THE<br /><span style={{ color: G.lime }}>COMMUNITY.</span>
            </div>

            <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.7, maxWidth: 320, marginBottom: "2.5rem" }}>
              Create your free account and unlock tournaments, coaching sessions, court bookings, live rankings, and real-time chat.
            </p>

            {/* Role preview */}
            <div style={{
              background: G.card2, border: `1px solid ${G.cardBorder}`,
              borderRadius: 12, padding: "1.2rem", marginBottom: "2rem",
            }}>
              <div style={{ fontSize: 11, color: G.muted2, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
                Who can join?
              </div>
              {roles.map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "8px 0",
                    borderBottom: r.label !== "Staff" ? `1px solid ${G.border}` : "none",
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: G.text2, fontWeight: 500 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{r.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["🎾 Tournaments", "📊 Analytics", "💬 Live Chat", "🏆 Rankings", "📅 Bookings"].map((p) => (
                <span key={p} style={{
                  fontSize: 11, padding: "5px 12px", borderRadius: 20,
                  border: `1px solid ${G.cardBorder}`, color: G.muted,
                  letterSpacing: 0.5, background: "rgba(29,48,32,0.5)",
                }}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Auth panel */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "2rem",
          position: "relative", zIndex: 1, overflowY: "auto",
        }}>
          <div style={{
            width: "100%", maxWidth: 460,
            background: G.card, border: `1px solid ${G.cardBorder}`,
            borderRadius: 20, padding: "2.5rem",
            position: "relative", overflow: "hidden",
            margin: "2rem 0",
          }}>
            {/* Shimmer bar */}
            <div className="shimmer-bar" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3 }} />

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: G.text, letterSpacing: 1.5, marginBottom: 4 }}>
              CREATE YOUR ACCOUNT
            </div>
            <p style={{ fontSize: 13, color: G.muted, marginBottom: "1.8rem" }}>
              Free forever · No credit card required
            </p>

            <form onSubmit={handleRegister}>
              {/* Disclaimer */}
              <div className="disclaimer-box">
                📝 You're signing up as a user. After login, you can explore organizations, apply for roles (Player/Coach/Referee), or create your own organization.
              </div>

              {/* First and Last Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1rem" }}>
                {[
                  { label: "First Name", value: firstName, setter: setFirstName, placeholder: "First name" },
                  { label: "Last Name",  value: lastName,  setter: setLastName,  placeholder: "Last name" },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label style={{
                      display: "block", fontSize: 11, fontWeight: 600, color: G.muted,
                      letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6,
                    }}>{label}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted2 }}>
                        <UserIcon />
                      </span>
                      <input
                        className="auth-input"
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600, color: G.muted,
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6,
                }}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted2 }}>
                    <MailIcon />
                  </span>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600, color: G.muted,
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6,
                }}>Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted2 }}>
                    <LockIcon />
                  </span>
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-icon"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: G.muted2,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? (
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
                {password.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 3, background: G.border, borderRadius: 2, overflow: "hidden" }}>
                      <div
                        className="strength-fill"
                        style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: strength.color, marginTop: 4, display: "block" }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600, color: G.muted,
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6,
                }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted2 }}>
                    <LockIcon />
                  </span>
                  <input
                    className="auth-input"
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="eye-icon"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: G.muted2,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {showPasswordConfirm ? (
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
                {passwordConfirm.length > 0 && password !== passwordConfirm && (
                  <span style={{ fontSize: 11, color: G.red, marginTop: 4, display: "block" }}>
                    Passwords do not match
                  </span>
                )}
                {passwordConfirm.length > 0 && password === passwordConfirm && (
                  <span style={{ fontSize: 11, color: G.lime, marginTop: 4, display: "block" }}>
                    ✓ Passwords match
                  </span>
                )}
              </div>

              {error && (
                <div style={{ marginBottom: "1rem", padding: "14px", borderRadius: 14, background: "rgba(217,79,79,0.12)", color: G.text, border: `1px solid ${G.red}` }}>
                  {error}
                </div>
              )}
              <label style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                marginBottom: "1rem", cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: G.lime, marginTop: 2, flexShrink: 0, cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: G.muted, lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <Link href="/terms" style={{ color: G.lime, textDecoration: "none" }}>Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" style={{ color: G.lime, textDecoration: "none" }}>Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !agreed || password !== passwordConfirm || !password}
                style={{
                  width: "100%", padding: 13,
                  background: loading || !agreed || password !== passwordConfirm || !password ? G.mid : G.lime,
                  border: "none", borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                  color: G.dark, cursor: loading || !agreed || password !== passwordConfirm || !password ? "not-allowed" : "pointer",
                  letterSpacing: 0.5, transition: "all 0.2s",
                  opacity: loading || !agreed || password !== passwordConfirm || !password ? 0.7 : 1,
                }}
              >
                {loading ? "Creating your account…" : "Create My VICO Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 12, color: G.muted2, marginTop: "1.2rem" }}>
              Already have an account?{" "}
              <a 
                href="/login" 
                onClick={handleNavigateToLogin}
                style={{ color: G.lime, textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Spinner Overlay */}
      {navigatingToLogin && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 24, 10, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${G.cardBorder}`,
              borderTopColor: G.lime,
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: G.text, fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>
              Navigating to Login...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}