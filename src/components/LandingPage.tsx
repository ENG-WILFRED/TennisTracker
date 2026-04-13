"use client";

import React,{ useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Role {
  icon: string;
  tag: string;
  accent: string;
  title: string;
  features: string[];
  cta: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface Step {
  num: string;
  title: string;
  desc: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = [
  {
    icon: "🎾",
    tag: "Players",
    accent: "#7dc142",
    title: "Dominate\nYour Game",
    features: ["ELO rankings & weekly updates","Full match history & stats","Issue ranking challenges","Achievement badges & leaderboards","Smart court booking","Tournament registration"],
    cta: "Join as Player",
  },
  {
    icon: "🎓",
    tag: "Coaches",
    accent: "#3b82f6",
    title: "Train.\nEarn. Grow.",
    features: ["Coaching dashboard & KPIs","Session scheduling system","Commission wallet & payouts","Player performance analytics","Verified certification badges","1-on-1 & group clinic management"],
    cta: "Join as Coach",
  },
  {
    icon: "🧑‍⚖️",
    tag: "Referees",
    accent: "#f97316",
    title: "Officiate\nWith Precision",
    features: ["Match & tournament assignments","Best-of-3 live score recording","Rule appeals & dispute tracking","ITF rules database on demand","Ball crew coordination","Credential expiry reminders"],
    cta: "Join as Referee",
  },
  {
    icon: "🏢",
    tag: "Organizations",
    accent: "#8b5cf6",
    title: "Build Your\nClub Empire",
    features: ["Multi-tenant club & academy setup","Court management & pricing","Membership tiers & auto-billing","Tournament creation & brackets","Staff & role assignment","Revenue & analytics dashboards"],
    cta: "Join as Org",
  },
  {
    icon: "⚙️",
    tag: "Staff & Admins",
    accent: "#dc2626",
    title: "Run the\nWhole Show",
    features: ["M-Pesa, PayPal & Stripe payments","Audit logs & compliance reports","Task templates & assignments","Broadcast announcements by role","Revenue forecasting tools","Multi-role dashboards & KPIs"],
    cta: "Join as Admin",
  },
  {
    icon: "👀",
    tag: "Spectators",
    accent: "#f0c040",
    title: "Follow Every\nRally",
    features: ["Live match score updates","Tournament brackets & results","Player profiles & career stats","Notifications for favourite players","Match history & replays","Rankings & leaderboards"],
    cta: "Follow as Fan",
  },
];

const GAME_SCORES = ["0-0","15-0","15-15","30-15","30-30","40-30","DEUCE","ADV-40","GAME"];

const MARQUEE_ITEMS = [
  "ELO Rankings","Live Scoring","Tournament Brackets","Court Booking",
  "Coach Sessions","M-Pesa Payments","Referee Tools","Club Management",
  "Spectator Mode","Performance Analytics",
];

const FEATURES = [
  { icon: "📅", title: "Smart Booking", desc: "Courts, coaches, and sessions in one calendar. Auto-conflict detection, pricing tiers, and instant confirmation." },
  { icon: "🏆", title: "Tournament Engine", desc: "Create brackets, schedule rounds, auto-seed players by ELO, and broadcast results in real time." },
  { icon: "⚡", title: "Real-Time Match System", desc: "WebSocket-powered live scoring. Referees update, spectators watch, players track — simultaneously." },
  { icon: "💬", title: "Communication Hub", desc: "Role-based announcements, push notifications, chat, and broadcast messaging across the ecosystem." },
];

const STEPS = [
  { num: "01", title: "Create Account", desc: "Sign up in under 2 minutes with email or social login." },
  { num: "02", title: "Choose Your Role", desc: "Player, Coach, Referee, Org, Admin, or Spectator." },
  { num: "03", title: "Join or Create", desc: "Find a tournament, join a club, or start your own." },
  { num: "04", title: "Play. Manage. Watch.", desc: "Your dashboard is live. The game starts now." },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useIntersection(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex items-center gap-3 font-mono text-[0.68rem] tracking-[3px] uppercase text-[#a8d84e] mb-4 ${center ? "justify-center" : ""}`}>
      <span className="w-6 h-px bg-[#a8d84e] shrink-0" />
      {children}
      {center && <span className="w-6 h-px bg-[#a8d84e] shrink-0" />}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 clamp(1rem, 5vw, 2.5rem)",
      height: "64px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(15,31,15,0.97)" : "rgba(15,31,15,0.7)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(45,90,53,0.4)",
      transition: "background 0.3s",
    }}>
      <a href="#" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", color: "#a8d84e", letterSpacing: "4px", textDecoration: "none" }}>
        VICO
      </a>

      {/* Desktop links */}
      <ul style={{ display: "flex", gap: "2rem", listStyle: "none", margin: 0, padding: 0 }} className="nav-links">
        {["Roles","Live Play","Features","How It Works"].map((item, i) => (
          <li key={i}>
            <a href={`#${["roles","realtime","features","howitworks"][i]}`} style={{
              color: "#7aaa6a", textDecoration: "none", fontSize: "0.8rem",
              fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = "#a8d84e"}
            onMouseLeave={e => (e.target as HTMLElement).style.color = "#7aaa6a"}>
              {item}
            </a>
          </li>
        ))}
      </ul>

      <a href="#cta" style={{
        background: "#a8d84e", color: "#0f1f0f", padding: "8px 20px",
        borderRadius: "4px", fontWeight: 700, fontSize: "0.78rem",
        letterSpacing: "1px", textTransform: "uppercase", textDecoration: "none",
        border: "2px solid #a8d84e", transition: "all 0.25s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "#a8d84e"; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.background = "#a8d84e"; (e.target as HTMLElement).style.color = "#0f1f0f"; }}
      className="nav-cta">
        Early Access
      </a>

      {/* Hamburger */}
      <button onClick={onMenuOpen} className="hamburger" style={{
        display: "none", flexDirection: "column", gap: "5px",
        background: "none", border: "none", cursor: "pointer", padding: "4px",
      }}>
        {[0,1,2].map(i => <span key={i} style={{ display: "block", width: "22px", height: "2px", background: "#a8d84e", borderRadius: "2px" }} />)}
      </button>
    </nav>
  );
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,20,10,0.99)",
      zIndex: 200, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "2rem",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.4s cubic-bezier(0.77,0,0.18,1)",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: "1.5rem", right: "1.5rem",
        fontSize: "1.5rem", color: "#7aaa6a", background: "none", border: "none", cursor: "pointer",
      }}>✕</button>
      {["Roles","Live Play","Features","How It Works"].map((item, i) => (
        <a key={i} href={`#${["roles","realtime","features","howitworks"][i]}`} onClick={onClose}
          style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.8rem",
            color: "#e8f5e0", textDecoration: "none", letterSpacing: "4px",
          }}>
          {item}
        </a>
      ))}
      <a href="#cta" onClick={onClose} style={{
        background: "#a8d84e", color: "#0f1f0f", padding: "12px 2.5rem",
        borderRadius: "4px", fontWeight: 700, letterSpacing: "2px",
        textTransform: "uppercase", textDecoration: "none", fontSize: "0.9rem",
        marginTop: "1rem",
      }}>
        Get Started
      </a>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [gameScore, setGameScore] = useState("30-15");
  const [scoreIdx, setScoreIdx] = useState(3);
  const [timer, setTimer] = useState(47 * 60 + 22);

  useEffect(() => {
    const si = setInterval(() => {
      setScoreIdx(i => {
        const ni = (i + 1) % GAME_SCORES.length;
        setGameScore(GAME_SCORES[ni]);
        return ni;
      });
    }, 2200);
    const ti = setInterval(() => setTimer(t => t + 1), 1000);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
  };

  return (
    <section style={{
      minHeight: "100svh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      paddingTop: "100px", paddingBottom: "160px",
      padding: "100px clamp(1rem, 5vw, 2.5rem) 160px",
    }}>
      {/* Animated grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(168,216,78,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(168,216,78,0.04) 1px,transparent 1px)",
        backgroundSize: "50px 50px",
        animation: "gridMove 25s linear infinite",
        pointerEvents: "none",
      }} />
      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(700px, 120vw)", height: "min(700px, 120vw)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(125,193,66,0.1) 0%, transparent 70%)",
        animation: "orbPulse 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Court lines overlay */}
      <svg viewBox="0 0 1200 800" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        opacity: 0.06, pointerEvents: "none",
      }} preserveAspectRatio="xMidYMid slice">
        <rect x="100" y="100" width="1000" height="600" fill="none" stroke="#a8d84e" strokeWidth="1.5" />
        <line x1="600" y1="100" x2="600" y2="700" stroke="#a8d84e" strokeWidth="1.5" />
        <line x1="100" y1="400" x2="1100" y2="400" stroke="#a8d84e" strokeWidth="1" />
        <line x1="250" y1="100" x2="250" y2="700" stroke="#a8d84e" strokeWidth="1" />
        <line x1="950" y1="100" x2="950" y2="700" stroke="#a8d84e" strokeWidth="1" />
      </svg>

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "1000px", width: "100%" }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(45,90,53,0.35)", border: "1px solid rgba(45,90,53,0.8)",
          padding: "6px 16px", borderRadius: "100px",
          fontSize: "0.72rem", fontFamily: "monospace", color: "#7dc142",
          letterSpacing: "2px", textTransform: "uppercase", marginBottom: "1.5rem",
          animation: "fadeSlideDown 0.8s ease both",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#7dc142", animation: "pulse 1.5s ease-in-out infinite" }} />
          The Tennis Ecosystem · Launching April 17, 2026
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(4.5rem, 14vw, 12rem)",
          lineHeight: 0.88, letterSpacing: "-2px",
          color: "#e8f5e0", margin: "0 0 1.5rem",
          animation: "fadeSlideDown 0.8s 0.15s ease both",
          opacity: 0, animationFillMode: "forwards",
        }}>
          THE{" "}
          <span style={{ color: "transparent", WebkitTextStroke: "2px #a8d84e" }}>OPERATING</span>
          <br />SYSTEM FOR<br />TENNIS
        </h1>

        <p style={{
          fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)", color: "#7aaa6a",
          maxWidth: "560px", margin: "0 auto 2.5rem",
          lineHeight: 1.7, fontWeight: 300,
          animation: "fadeSlideDown 0.8s 0.3s ease both",
          opacity: 0, animationFillMode: "forwards",
        }}>
          <strong style={{ color: "#a8d84e", fontWeight: 600 }}>Players. Coaches. Referees. Organizations.</strong>
          <br />Manage tournaments, track performance, book courts, and watch matches live — all in one platform.
        </p>

        <div style={{
          display: "flex", gap: "1rem", justifyContent: "center",
          flexWrap: "wrap",
          animation: "fadeSlideDown 0.8s 0.45s ease both",
          opacity: 0, animationFillMode: "forwards",
        }}>
          <a href="/register" className="btn-primary">Register</a>
          <a href="#realtime" className="btn-secondary">
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#dc2626", animation: "pulse 1s ease-in-out infinite", display: "inline-block" }} />
            Watch Live Demo
          </a>
        </div>
      </div>

      {/* Live score widget */}
      <div style={{
        position: "absolute", bottom: "1.5rem", left: "50%",
        transform: "translateX(-50%)",
        zIndex: 5,
        animation: "fadeSlideUp 0.8s 0.8s ease both",
        opacity: 0, animationFillMode: "forwards",
        width: "calc(100% - 2rem)", maxWidth: "420px",
      }}>
        <div style={{
          background: "rgba(21,37,21,0.95)",
          border: "1px solid rgba(45,90,53,0.8)",
          borderRadius: "12px", padding: "14px 18px",
          display: "flex", alignItems: "center", gap: "1rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          flexWrap: "wrap",
        }}>
          <span style={{ background: "#dc2626", color: "white", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "2px", padding: "3px 8px", borderRadius: "3px", animation: "pulse 1s ease-in-out infinite", whiteSpace: "nowrap" }}>LIVE</span>
          <div style={{ flex: 1, minWidth: "140px" }}>
            {[
              { name: "N. OMONDI", sets: ["6","4","3"], serving: true },
              { name: "J. KAMAU", sets: ["3","6","2"], serving: false }
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 0", fontSize: "0.88rem" }}>
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                  {p.serving && <span style={{ color: "#a8d84e", fontSize: "0.45rem" }}>●</span>}
                  {p.name}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  {p.sets.map((s, j) => (
                    <span key={j} style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, minWidth: "16px", textAlign: "center", color: j === 2 ? "#f0c040" : (i===0&&j<2)||(i===1&&j===1) ? "#a8d84e" : "#7aaa6a" }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ width: "1px", height: "36px", background: "rgba(45,90,53,0.6)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.6rem", color: "#7aaa6a", letterSpacing: "1px", textTransform: "uppercase" }}>GAME</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", color: "#f0c040", lineHeight: 1 }}>{gameScore}</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: "1rem", right: "1rem", fontFamily: "monospace", fontSize: "0.65rem", color: "#7aaa6a", opacity: 0.5 }}>{fmt(timer)}</div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const { ref, visible } = useIntersection(0.4);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const targets = [6, 100, 3, 17];

  useEffect(() => {
    if (!visible) return;
    targets.forEach((target, i) => {
      let current = 0;
      const step = target / 40;
      const t = setInterval(() => {
        current = Math.min(current + step, target);
        setCounts(c => { const n = [...c]; n[i] = Math.floor(current); return n; });
        if (current >= target) clearInterval(t);
      }, 35);
    });
  }, [visible]);

  const items = [
    { val: counts[0], suffix: "", prefix: "", label: "Roles Supported" },
    { val: counts[1], suffix: "%", prefix: "", label: "Real-Time Updates" },
    { val: counts[2], suffix: "+", prefix: "", label: "Payment Methods" },
    { val: counts[3], suffix: "", prefix: "APR ", label: "Launch Date 2026" },
  ];

  return (
    <div ref={ref} style={{
      background: "#152515", borderTop: "1px solid rgba(45,90,53,0.5)",
      borderBottom: "1px solid rgba(45,90,53,0.5)",
      padding: "1.5rem clamp(1rem, 5vw, 2.5rem)",
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0",
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          textAlign: "center", padding: "0.75rem 1rem",
          borderRight: i < 3 ? "1px solid rgba(45,90,53,0.4)" : "none",
          transition: "all 0.4s ease",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(10px)",
          transitionDelay: `${i * 0.08}s`,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", color: "#a8d84e", lineHeight: 1 }}>
            {item.prefix}{item.val}{item.suffix}
          </div>
          <div style={{ fontSize: "0.68rem", color: "#7aaa6a", letterSpacing: "1px", textTransform: "uppercase", marginTop: "4px" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ padding: "1.2rem 0", background: "#1a3020", borderTop: "1px solid rgba(45,90,53,0.4)", borderBottom: "1px solid rgba(45,90,53,0.4)", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "3rem", animation: "marquee 25s linear infinite", width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.05rem",
            color: "#7aaa6a", letterSpacing: "3px", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: "1.2rem",
          }}>
            {item} <span style={{ color: "#a8d84e", fontSize: "1.2rem" }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Roles Section ────────────────────────────────────────────────────────────
function RolesSection() {
  return (
    <section id="roles" style={{ padding: "5rem clamp(1rem, 5vw, 2.5rem)", background: "#0f1f0f" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <SectionLabel>Built For Everyone</SectionLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.2rem, 5vw, 4.5rem)", lineHeight: 0.95, marginBottom: "0.75rem" }}>
          YOUR ROLE.<br />YOUR TOOLS.
        </h2>
        <p style={{ color: "#7aaa6a", fontSize: "0.95rem", fontWeight: 300, maxWidth: "460px", lineHeight: 1.7, marginBottom: "3rem" }}>
          One platform, six roles. Every stakeholder in the tennis ecosystem gets a tailored experience.
        </p>
        <div className="roles-grid">
          {ROLES.map((role, i) => <RoleCard key={i} role={role} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function RoleCard({ role, index }: { role: Role; index: number }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1f3a24" : "#162a1b",
        borderLeft: `1px solid ${hovered ? role.accent + "60" : "rgba(45,90,53,0.4)"}`,
        borderRight: `1px solid ${hovered ? role.accent + "60" : "rgba(45,90,53,0.4)"}`,
        borderBottom: `1px solid ${hovered ? role.accent + "60" : "rgba(45,90,53,0.4)"}`,
        borderTop: `3px solid ${role.accent}`,
        borderRadius: "8px", padding: "clamp(1.5rem, 3vw, 2.2rem)",
        position: "relative", overflow: "hidden", cursor: "pointer",
        transition: "all 0.3s ease",
        transform: visible ? (hovered ? "translateY(-4px)" : "none") : "translateY(20px)",
        opacity: visible ? 1 : 0,
        transitionDelay: visible ? `${index * 0.07}s` : "0s",
        boxShadow: hovered ? `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${role.accent}30` : "none",
      }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 20% 20%, ${role.accent}08 0%, transparent 60%)`, pointerEvents: "none" }} />

      <span style={{ fontSize: "clamp(1.8rem, 5vw, 2.2rem)", marginBottom: "1rem", display: "block", transition: "transform 0.3s", transform: hovered ? "scale(1.15) rotate(-5deg)" : "scale(1)" }}>{role.icon}</span>

      <span style={{
        fontSize: "0.8rem", fontWeight: 700, letterSpacing: "2px",
        textTransform: "uppercase", padding: "3px 10px", borderRadius: "3px",
        background: role.accent + "22", color: role.accent, display: "inline-block", marginBottom: "1rem",
      }}>{role.tag}</span>

      <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.5rem, 4vw, 1.9rem)", lineHeight: 1.05, marginBottom: "1.2rem", whiteSpace: "pre-line" }}>{role.title}</h3>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
        {role.features.map((f: string, i: number) => (
          <li key={i} style={{
            fontSize: "clamp(0.75rem, 2vw, 0.82rem)", color: "#7aaa6a", padding: "7px 0",
            borderBottom: "1px solid rgba(45,90,53,0.2)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ color: role.accent, fontSize: "0.9rem", lineHeight: 1 }}>›</span>
            {f}
          </li>
        ))}
      </ul>

      <a href="#cta" style={{
        fontSize: "0.78rem", fontWeight: 700, letterSpacing: "2px",
        textTransform: "uppercase", color: role.accent, textDecoration: "none",
        display: "flex", alignItems: "center", gap: "6px", transition: "gap 0.2s",
      }}>
        {role.cta} <span style={{ transition: "transform 0.2s", transform: hovered ? "translateX(4px)" : "none" }}>→</span>
      </a>
    </div>
  );
}

// ─── Realtime Section ─────────────────────────────────────────────────────────
function RealtimeSection() {
  const { ref: leftRef, visible: leftVisible } = useIntersection();
  const { ref: rightRef, visible: rightVisible } = useIntersection();

  return (
    <section id="realtime" style={{ padding: "5rem clamp(1rem, 5vw, 2.5rem)", background: "#152515" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "clamp(2rem, 6vw, 5rem)", alignItems: "center" }}>
        <div ref={leftRef} style={{ transition: "all 0.6s ease", opacity: leftVisible ? 1 : 0, transform: leftVisible ? "none" : "translateY(24px)" }}>
          <SectionLabel>Killer Feature</SectionLabel>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.2rem, 5vw, 4.5rem)", lineHeight: 0.95, marginBottom: "1rem" }}>
            TENNIS,<br />LIVE AND<br />UNFILTERED
          </h2>
          <p style={{ color: "#7aaa6a", fontSize: "0.95rem", fontWeight: 300, lineHeight: 1.7, marginBottom: "2rem" }}>
            Every point. Every rally. Every set. Watch matches unfold in real-time with live scoring powered by WebSockets — no refresh needed.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { icon: "⚡", title: "Real-Time Score Updates", desc: "WebSocket-powered, zero latency score delivery" },
              { icon: "🏆", title: "Live Tournament Brackets", desc: "Bracket progression updates as matches complete" },
              { icon: "📊", title: "Performance Analytics Live", desc: "Stats computed as the match progresses" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "1rem 1.2rem", background: "rgba(26,48,32,0.5)",
                border: "1px solid rgba(45,90,53,0.5)", borderRadius: "8px",
              }}>
                <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "2px" }}>{item.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "#7aaa6a" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={rightRef} style={{ transition: "all 0.6s 0.2s ease", opacity: rightVisible ? 1 : 0, transform: rightVisible ? "none" : "translateY(24px)" }}>
          <ScoreBoard />
        </div>
      </div>
    </section>
  );
}

function ScoreBoard() {
  const [p1pts, setP1pts] = useState("30");
  const [p2pts, setP2pts] = useState("15");
  const [scoreIdx, setScoreIdx] = useState(3);

  useEffect(() => {
    const si = setInterval(() => {
      setScoreIdx(i => {
        const ni = (i + 1) % GAME_SCORES.length;
        const s = GAME_SCORES[ni];
        if (s.includes("-") && !s.includes("ADV")) {
          const [a, b] = s.split("-"); setP1pts(a); setP2pts(b);
        } else { setP1pts(s === "GAME" ? "WIN" : s); setP2pts(s === "GAME" ? "" : ""); }
        return ni;
      });
    }, 2200);
    return () => clearInterval(si);
  }, []);

  return (
    <div style={{
      background: "#0f1f0f", border: "1px solid rgba(45,90,53,0.6)",
      borderRadius: "16px", padding: "clamp(1.2rem, 3vw, 2rem)",
      boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(45,90,53,0.4)" }}>
        <span style={{ fontSize: "0.72rem", color: "#7aaa6a", letterSpacing: "1px" }}>🏆 Nairobi Open 2026</span>
        <span style={{ fontSize: "0.72rem", color: "#a8d84e", letterSpacing: "1px", fontFamily: "monospace" }}>QF · COURT 1</span>
      </div>

      {[
        { flag: "🇰🇪", name: "N. OMONDI", rank: "#12 KEN", sets: [{ v: "6", active: true }, { v: "4" }, { v: "3", live: true }] },
        { flag: "🇺🇬", name: "J. KAMAU", rank: "#8 UGA", sets: [{ v: "3" }, { v: "6", active: true }, { v: "2", live: true }] },
      ].map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 0", borderTop: i > 0 ? "1px solid rgba(45,90,53,0.2)" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, fontSize: "1rem" }}>
            <span style={{ fontSize: "1.2rem" }}>{p.flag}</span>
            <div>
              <div>{p.name}</div>
              <div style={{ fontSize: "0.68rem", color: "#7aaa6a", fontFamily: "monospace" }}>{p.rank}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            {p.sets.map((s, j) => (
              <span key={j} style={{
                fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", minWidth: "20px", textAlign: "center",
                color: s.live ? "#f0c040" : s.active ? "#a8d84e" : "#7aaa6a",
                transition: "all 0.3s",
              }}>{s.v}</span>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1rem", padding: "1rem 1.2rem", background: "rgba(168,216,78,0.05)", border: "1px solid rgba(168,216,78,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "0.68rem", color: "#7aaa6a", letterSpacing: "1px" }}>Current Game</div>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[{ label: "OMONDI", val: p1pts, hot: true }, { label: "KAMAU", val: p2pts }].map((pt, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", color: "#7aaa6a", marginBottom: "2px" }}>{pt.label}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.2rem", lineHeight: 1, transition: "all 0.3s", color: pt.hot ? "#f0c040" : "#a8d84e", textShadow: pt.hot ? "0 0 20px rgba(240,192,64,0.5)" : "none" }}>{pt.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rally */}
      <div style={{ marginTop: "1rem", height: "50px", borderRadius: "6px", background: "rgba(45,90,53,0.12)", border: "1px solid rgba(45,90,53,0.2)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(168,216,78,0.25)" }} />
        <div style={{ position: "absolute", width: "10px", height: "10px", borderRadius: "50%", background: "#f0c040", boxShadow: "0 0 10px #f0c040", top: "50%", transform: "translateY(-50%)", animation: "rally 1.6s ease-in-out infinite" }} />
      </div>

      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#7aaa6a", fontFamily: "monospace" }}>
        <span>Aces: 4 · DFs: 1</span>
        <span style={{ color: "#a8d84e" }}>● LIVE</span>
        <span>BPs: 2</span>
      </div>
    </div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "5rem clamp(1rem, 5vw, 2.5rem)", background: "#0f1f0f" }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <SectionLabel>Core Platform</SectionLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.2rem, 5vw, 4.5rem)", lineHeight: 0.95, marginBottom: "0.75rem" }}>
          EVERYTHING<br />TENNIS NEEDS
        </h2>
        <p style={{ color: "#7aaa6a", fontSize: "0.95rem", fontWeight: 300, maxWidth: "460px", lineHeight: 1.7, marginBottom: "3rem" }}>
          Four pillars. Infinite depth. Built to handle the full complexity of modern tennis operations.
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1a3020" : "#152515",
        borderBottom: `3px solid ${hovered ? "#a8d84e" : "transparent"}`,
        padding: "2.2rem 1.8rem", transition: "all 0.3s ease",
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
        transitionDelay: `${index * 0.1}s`,
        cursor: "default",
      }}>
      <span style={{ fontSize: "2rem", marginBottom: "1.2rem", display: "block" }}>{feature.icon}</span>
      <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", marginBottom: "0.75rem" }}>{feature.title}</h3>
      <p style={{ fontSize: "0.83rem", color: "#7aaa6a", lineHeight: 1.65 }}>{feature.desc}</p>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="howitworks" style={{ padding: "5rem clamp(1rem, 5vw, 2.5rem)", background: "#152515", textAlign: "center" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <SectionLabel center>Simple Onboarding</SectionLabel>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.2rem, 5vw, 4.5rem)", lineHeight: 0.95, marginBottom: "0.75rem" }}>
          GET STARTED<br />IN MINUTES
        </h2>
        <p style={{ color: "#7aaa6a", fontSize: "0.95rem", fontWeight: 300, margin: "0 auto 3rem", lineHeight: 1.7, maxWidth: "460px" }}>
          No complex setup. No learning curve. Just pick your role and play.
        </p>
        <div className="steps-grid">
          {STEPS.map((step, i) => <StepCard key={i} step={step} index={i} isLast={i === STEPS.length - 1} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 1rem", position: "relative",
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
        transition: "all 0.5s ease", transitionDelay: `${index * 0.12}s`,
      }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        background: hovered ? "#a8d84e" : "#1a3020",
        border: `2px solid ${hovered ? "#a8d84e" : "rgba(45,90,53,0.8)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem",
        color: hovered ? "#0f1f0f" : "#a8d84e",
        marginBottom: "1.2rem", position: "relative", zIndex: 1,
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 0 30px rgba(168,216,78,0.4)" : "none",
      }}>
        {step.num}
      </div>
      {!isLast && <div className="step-connector" />}
      <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", marginBottom: "0.5rem" }}>{step.title}</h3>
      <p style={{ fontSize: "0.8rem", color: "#7aaa6a", lineHeight: 1.6 }}>{step.desc}</p>
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  const { ref, visible } = useIntersection();
  return (
    <section id="cta" style={{
      padding: "6rem clamp(1rem, 5vw, 2.5rem)", background: "#0f1f0f",
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      {/* Big watermark */}
      <div style={{
        position: "absolute", fontFamily: "'Bebas Neue',sans-serif",
        fontSize: "clamp(8rem, 30vw, 22rem)", color: "rgba(45,90,53,0.07)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        pointerEvents: "none", whiteSpace: "nowrap", lineHeight: 1,
        userSelect: "none",
      }}>VICO</div>

      <div ref={ref} style={{
        position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto",
        transition: "all 0.7s ease", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)",
      }}>
        <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#7dc142", letterSpacing: "3px", marginBottom: "1.5rem" }}>⚡ LAUNCHING APRIL 17, 2026</div>

        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem, 8vw, 6rem)", lineHeight: 0.92, marginBottom: "1.5rem" }}>
          THE FUTURE OF<br />TENNIS STARTS<br />
          <span style={{ color: "#a8d84e" }}>HERE</span>
        </h2>

        <p style={{ color: "#7aaa6a", fontSize: "0.95rem", marginBottom: "2.5rem", lineHeight: 1.7 }}>
          Don't miss the drop. Be part of the ecosystem from day one.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
          <a href="/register" className="btn-primary">Register</a>
          <a href="/login" className="btn-secondary">Login</a>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          {["🎾 Player","🎓 Coach","🧑‍⚖️ Referee","🏢 Organization","👀 Spectator"].map((r, i) => (
            <a key={i} href="#" style={{
              background: "rgba(45,90,53,0.15)", border: "1px solid rgba(45,90,53,0.6)",
              color: "#7aaa6a", padding: "8px 16px", borderRadius: "4px",
              fontSize: "0.78rem", fontWeight: 600, letterSpacing: "1px",
              textDecoration: "none", transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,216,78,0.1)"; e.currentTarget.style.borderColor = "#a8d84e"; e.currentTarget.style.color = "#a8d84e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(45,90,53,0.15)"; e.currentTarget.style.borderColor = "rgba(45,90,53,0.6)"; e.currentTarget.style.color = "#7aaa6a"; }}>
              {r}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: "#0a160a", borderTop: "1px solid rgba(45,90,53,0.5)",
      padding: "2.5rem clamp(1rem, 5vw, 2.5rem)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "1.5rem",
    }}>
      <div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", color: "#a8d84e", letterSpacing: "4px" }}>VICO</div>
        <div style={{ color: "#7aaa6a", fontSize: "0.8rem", marginTop: "4px" }}>The Real Deal Is Coming · April 17, 2026</div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {["NEXT.JS","FLUTTER","POSTGRESQL","WEBSOCKETS","M-PESA","STRIPE"].map((t, i) => (
          <span key={i} style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#7aaa6a", background: "rgba(45,90,53,0.2)", border: "1px solid rgba(45,90,53,0.5)", padding: "3px 8px", borderRadius: "3px", letterSpacing: "1px" }}>{t}</span>
        ))}
      </div>
      <div style={{ textAlign: "right", color: "#7aaa6a", fontSize: "0.78rem" }}>
        <div>Complete Tennis Platform</div>
        <div style={{ marginTop: "3px", color: "#a8d84e" }}>17 · 04 · 2026</div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function VICOLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: #0f1f0f;
          color: #e8f5e0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* Keyframes */
        @keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(50px); } }
        @keyframes orbPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; } 50% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes rally { 0% { left: 5%; } 50% { left: 88%; } 100% { left: 5%; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Reusable button styles */
        .btn-primary {
          display: inline-block;
          background: #a8d84e;
          color: #0f1f0f;
          padding: 12px 28px;
          border-radius: 5px;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-decoration: none;
          border: 2px solid #a8d84e;
          transition: all 0.25s;
          white-space: nowrap;
        }
        .btn-primary:hover {
          background: transparent;
          color: #a8d84e;
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(168,216,78,0.35);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #e8f5e0;
          padding: 12px 28px;
          border-radius: 5px;
          font-weight: 600;
          font-size: 0.82rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(45,90,53,0.7);
          transition: all 0.25s;
          white-space: nowrap;
        }
        .btn-secondary:hover {
          border-color: #a8d84e;
          color: #a8d84e;
          transform: translateY(-2px);
        }

        /* Responsive grids */
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(45,90,53,0.2);
          border-radius: 8px;
          overflow: hidden;
        }
        .roles-grid > * {
          border-radius: 0 !important;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(45,90,53,0.2);
          border-radius: 8px;
          overflow: hidden;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          position: relative;
        }
        .steps-grid::before {
          content: '';
          position: absolute;
          top: 36px;
          left: 12.5%;
          right: 12.5%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(45,90,53,0.6), transparent);
        }

        .step-connector {
          display: none;
        }

        /* Nav desktop/mobile toggle */
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-cta { display: none !important; }
          .hamburger { display: flex !important; }
          .roles-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
          .steps-grid::before { display: none; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .roles-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid::before { display: none; }
        }

        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr; }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f1f0f; }
        ::-webkit-scrollbar-thumb { background: rgba(45,90,53,0.6); border-radius: 2px; }
      `}</style>

      <Nav onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Hero />
      <StatsBar />
      <Marquee />
      <RolesSection />
      <RealtimeSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </>
  );
}