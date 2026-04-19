"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { RoleSelection } from "@/components/RoleSelection";
import { useToast } from "@/components/ui/ToastContext";
import { UserRole } from "@/config/roles";

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

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const { setCurrentRole, setUserMemberships } = useRole();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableMemberships, setAvailableMemberships] = useState<any[]>([]);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('accepted')) {
      const pendingLoginDataStr = sessionStorage.getItem('pendingLoginData');
      const pendingTokensStr = sessionStorage.getItem('pendingTokens');
      if (pendingLoginDataStr && pendingTokensStr) {
        const data = JSON.parse(pendingLoginDataStr);
        const tokens = JSON.parse(pendingTokensStr);
        sessionStorage.removeItem('pendingLoginData');
        sessionStorage.removeItem('pendingTokens');
        const user = { ...data.user, acceptedTerms: true };
        const memberships = user?.memberships?.filter((m: any) => m.status === 'accepted') || [];
        const shouldShowRoleSelection = memberships.length > 1 || (memberships.length === 1 && memberships[0].role !== 'spectator');

        if (shouldShowRoleSelection) {
          setAvailableMemberships(memberships);
          setPendingUser(user);
          setTokens(tokens);
          setShowRoleSelection(true);
        } else {
          const selectedMembership = memberships[0];
          completeLogin({ ...data, user }, selectedMembership?.role, selectedMembership?.orgId, selectedMembership?.orgName);
        }
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Login failed');
      }

      if (data.requiresTermsAcceptance) {
        sessionStorage.setItem('pendingLoginData', JSON.stringify(data));
        sessionStorage.setItem('pendingTokens', JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
        router.push('/accept-terms');
        return;
      }

      const memberships = data.user?.memberships?.filter((m: any) => m.status === 'accepted') || data.availableRoles || [];
      const shouldShowRoleSelection = memberships.length > 1 || (memberships.length === 1 && memberships[0].role !== 'spectator');

      if (shouldShowRoleSelection) {
        setAvailableMemberships(memberships);
        setPendingUser({ ...data.user, memberships });
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setShowRoleSelection(true);
        setLoading(false);
        return;
      }

      const selectedMembership = memberships[0];
      await completeLogin(data, selectedMembership?.role, selectedMembership?.orgId, selectedMembership?.orgName);
    } catch (error: any) {
      addToast(error.message || 'Login failed.', 'error');
      setLoading(false);
    }
  };

  const completeLogin = async (data: any, selectedRole: UserRole, orgId?: string, orgName?: string) => {
    const finalUser = {
      ...data.user,
      role: selectedRole,
      orgId,
      orgName,
    };

    setCurrentRole(selectedRole);
    const memberships = data.user?.memberships?.filter((m: any) => m.status === 'accepted') || data.availableRoles || [];
    // Save memberships to context/localStorage for context switching
    setUserMemberships(memberships.length ? memberships : [{ role: selectedRole, orgId, orgName }]);

    login(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      finalUser
    );

    addToast('Login successful! Redirecting…', 'success');

    setTimeout(() => {
      if (finalUser.id && selectedRole) {
        router.push(`/dashboard/${selectedRole}/${finalUser.id}`);
      } else {
        router.push('/dashboard');
      }
    }, 500);
  };

  const handleRoleSelect = async (membership: any) => {
    setLoading(true);
    try {
      if (!tokens || !pendingUser) {
        throw new Error('Session expired, please sign in again.');
      }
      await completeLogin({ ...tokens, user: pendingUser }, membership.role, membership.orgId, membership.orgName);
    } catch (error: any) {
      setShowRoleSelection(false);
      setPendingUser(null);
      setTokens(null);
      addToast(error.message || 'Role selection failed.', 'error');
      setLoading(false);
    }
  };

  const handleGoogleClicked = () => {
    addToast('Google login is coming soon. Please sign in with username or email.', 'error');
  };

  if (showRoleSelection && availableMemberships.length > 0 && pendingUser) {
    return (
      <>
        <div className="min-h-screen app-bg flex flex-col items-center justify-center py-8">
          <RoleSelection
            availableMemberships={availableMemberships}
            userName={`${pendingUser.firstName} ${pendingUser.lastName}`}
            userPhoto={pendingUser.photo}
            onRoleSelect={handleRoleSelect}
            isLoading={loading}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .shimmer-bar {
          background: linear-gradient(90deg, ${G.lime}, ${G.accent}, ${G.lime});
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
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

        .btn-oauth {
          flex: 1;
          padding: 9px;
          background: ${G.card2};
          border: 1px solid ${G.border};
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: ${G.text2};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: border-color 0.2s;
        }
        .btn-oauth:hover { border-color: ${G.muted2}; }

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
        className="login-root"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: G.dark,
          minHeight: "100vh",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
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
              YOUR GAME.<br /><span style={{ color: G.lime }}>ELEVATED.</span>
            </div>

            <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.7, maxWidth: 320, marginBottom: "2.5rem" }}>
              The complete tennis ecosystem — tournaments, coaching, court bookings, rankings, and community.
            </p>

            <div style={{ display: "flex", gap: "2rem" }}>
              {[['7', 'User Roles'], ['60+', 'Data Models'], ['3', 'Payment Methods']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: G.lime, letterSpacing: 1 }}>{n}</div>
                  <div style={{ fontSize: 11, color: G.muted2, letterSpacing: 1, textTransform: "uppercase" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {['🎾 Tournaments', '📊 Analytics', '💬 Live Chat', '🏆 Rankings', '📅 Bookings', '💳 M-Pesa · PayPal · Stripe'].map((p) => (
                <span key={p} style={{
                  fontSize: 11, padding: "5px 12px", borderRadius: 20,
                  border: `1px solid ${G.cardBorder}`, color: G.muted,
                  letterSpacing: 0.5, background: "rgba(29,48,32,0.5)",
                }}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "2rem", position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: "100%", maxWidth: 440,
            background: G.card, border: `1px solid ${G.cardBorder}`,
            borderRadius: 20, padding: "2.5rem", position: "relative", overflow: "hidden",
          }}>
            <div className="shimmer-bar" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3 }} />

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: G.text, letterSpacing: 1.5, marginBottom: 4 }}>
              WELCOME BACK
            </div>
            <p style={{ fontSize: 13, color: G.muted, marginBottom: "1.8rem" }}>
              Sign in to access your tennis dashboard
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600, color: G.muted,
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6,
                }}>Username or Email</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted2 }}>
                    <UserIcon />
                  </span>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Enter your username or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "0.5rem" }}>
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
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Link
                href="/forgot-password"
                style={{
                  display: "block", textAlign: "right", fontSize: 12,
                  color: G.muted, textDecoration: "none", marginBottom: "1rem",
                }}
              >
                Forgot password?
              </Link>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: 13,
                  background: loading ? G.mid : G.lime,
                  border: "none", borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                  color: G.dark, cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: 0.5, transition: "all 0.2s", marginBottom: "1.2rem",
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? "Signing in…" : "Sign In to VICO"}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.2rem" }}>
              <div style={{ flex: 1, height: 1, background: G.border }} />
              <span style={{ fontSize: 12, color: G.muted2 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: G.border }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: "1.2rem" }}>
              <button type="button" className="btn-oauth" onClick={handleGoogleClicked}>
                <GoogleIcon /> Google (coming soon)
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: G.muted2 }}>
              No account?{' '}
              <Link href="/register" style={{ color: G.lime, textDecoration: "none", fontWeight: 500 }}>
                Create one for free
              </Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
