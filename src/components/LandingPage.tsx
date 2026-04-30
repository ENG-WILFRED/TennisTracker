"use client";

import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Role {
  icon: string;
  tag: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
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
const ROLES: Role[] = [
  {
    icon: "🎾",
    tag: "Players",
    accent: "text-[#7dc142]",
    accentBg: "bg-[#7dc142]/10",
    accentBorder: "border-[#7dc142]",
    title: "Dominate\nYour Game",
    features: ["ELO rankings & weekly updates","Full match history & stats","Issue ranking challenges","Achievement badges & leaderboards","Smart court booking","Tournament registration"],
    cta: "Join as Player",
  },
  {
    icon: "🎓",
    tag: "Coaches",
    accent: "text-blue-400",
    accentBg: "bg-blue-400/10",
    accentBorder: "border-blue-400",
    title: "Train.\nEarn. Grow.",
    features: ["Coaching dashboard & KPIs","Session scheduling system","Commission wallet & payouts","Player performance analytics","Verified certification badges","1-on-1 & group clinic management"],
    cta: "Join as Coach",
  },
  {
    icon: "🧑‍⚖️",
    tag: "Referees",
    accent: "text-orange-400",
    accentBg: "bg-orange-400/10",
    accentBorder: "border-orange-400",
    title: "Officiate\nWith Precision",
    features: ["Match & tournament assignments","Best-of-3 live score recording","Rule appeals & dispute tracking","ITF rules database on demand","Ball crew coordination","Credential expiry reminders"],
    cta: "Join as Referee",
  },
  {
    icon: "🏢",
    tag: "Organizations",
    accent: "text-purple-400",
    accentBg: "bg-purple-400/10",
    accentBorder: "border-purple-400",
    title: "Build Your\nClub Empire",
    features: ["Multi-tenant club & academy setup","Court management & pricing","Membership tiers & auto-billing","Tournament creation & brackets","Staff & role assignment","Revenue & analytics dashboards"],
    cta: "Join as Org",
  },
  {
    icon: "⚙️",
    tag: "Staff & Admins",
    accent: "text-red-400",
    accentBg: "bg-red-400/10",
    accentBorder: "border-red-400",
    title: "Run the\nWhole Show",
    features: ["M-Pesa, PayPal & Stripe payments","Audit logs & compliance reports","Task templates & assignments","Broadcast announcements by role","Revenue forecasting tools","Multi-role dashboards & KPIs"],
    cta: "Join as Admin",
  },
  {
    icon: "👀",
    tag: "Spectators",
    accent: "text-yellow-400",
    accentBg: "bg-yellow-400/10",
    accentBorder: "border-yellow-400",
    title: "Follow Every\nRally",
    features: ["Live match score updates","Tournament brackets & results","Player profiles & career stats","Notifications for favourite players","Match history & replays","Rankings & leaderboards"],
    cta: "Follow as Fan",
  },
];

const GAME_SCORES = ["0-0","15-0","15-15","30-15","30-30","40-30","DEUCE","ADV-40","GAME"];

const MARQUEE_ITEMS = [
  "Live in Debug Mode","ELO Rankings","Live Scoring","Tournament Brackets",
  "Court Booking","Coach Sessions","M-Pesa Payments","Referee Tools",
  "Club Management","Spectator Mode","Performance Analytics",
];

const FEATURES: Feature[] = [
  { icon: "📅", title: "Smart Booking", desc: "Courts, coaches, and sessions in one calendar. Auto-conflict detection, pricing tiers, and instant confirmation." },
  { icon: "🏆", title: "Tournament Engine", desc: "Create brackets, schedule rounds, auto-seed players by ELO, and broadcast results in real time." },
  { icon: "⚡", title: "Real-Time Match System", desc: "WebSocket-powered live scoring. Referees update, spectators watch, players track — simultaneously." },
  { icon: "💬", title: "Communication Hub", desc: "Role-based announcements, push notifications, chat, and broadcast messaging across the ecosystem." },
];

const STEPS: Step[] = [
  { num: "01", title: "Create Account", desc: "Sign up in under 2 minutes with email or social login." },
  { num: "02", title: "Choose Your Role", desc: "Player, Coach, Referee, Org, Admin, or Spectator." },
  { num: "03", title: "Join or Create", desc: "Find a tournament, join a club, or start your own." },
  { num: "04", title: "Play. Manage. Watch.", desc: "Your dashboard is live. Explore and help shape the platform." },
];

// ─── Hook ──────────────────────────────────────────────────────────────────────
function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
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

// ─── SectionLabel ─────────────────────────────────────────────────────────────
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
    <nav className={`fixed top-0 left-0 right-0 z-[100] h-16 flex items-center justify-between px-[clamp(1rem,5vw,2.5rem)] border-b border-[#2d5a35]/40 backdrop-blur-xl transition-all duration-300 ${scrolled ? "bg-[#0f1f0f]/97" : "bg-[#0f1f0f]/70"}`}>
      <a href="#" className="font-['Bebas_Neue'] text-[1.8rem] text-[#a8d84e] tracking-[4px] no-underline">VICO</a>

      <ul className="hidden md:flex gap-8 list-none m-0 p-0">
        {["Roles","Live Play","Features","How It Works"].map((item, i) => (
          <li key={i}>
            <a href={`#${["roles","realtime","features","howitworks"][i]}`}
              className="text-[#7aaa6a] no-underline text-[0.8rem] font-semibold tracking-[1px] uppercase transition-colors duration-200 hover:text-[#a8d84e]">
              {item}
            </a>
          </li>
        ))}
      </ul>

      <a href="#cta" className="hidden md:inline-block bg-[#a8d84e] text-[#0f1f0f] px-5 py-2 rounded text-[0.78rem] font-bold tracking-[1px] uppercase no-underline border-2 border-[#a8d84e] transition-all duration-200 hover:bg-transparent hover:text-[#a8d84e] whitespace-nowrap">
        Try the Platform
      </a>

      <button onClick={onMenuOpen} className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1">
        {[0,1,2].map(i => <span key={i} className="block w-[22px] h-[2px] bg-[#a8d84e] rounded-sm" />)}
      </button>
    </nav>
  );
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`fixed inset-0 bg-[#0a140a]/99 z-[200] flex flex-col items-center justify-center gap-8 transition-transform duration-[400ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${open ? "translate-x-0" : "translate-x-full"}`}>
      <button onClick={onClose} className="absolute top-6 right-6 text-2xl text-[#7aaa6a] bg-transparent border-none cursor-pointer">✕</button>
      {["Roles","Live Play","Features","How It Works"].map((item, i) => (
        <a key={i} href={`#${["roles","realtime","features","howitworks"][i]}`} onClick={onClose}
          className="font-['Bebas_Neue'] text-[2.8rem] text-[#e8f5e0] no-underline tracking-[4px]">
          {item}
        </a>
      ))}
      <a href="#cta" onClick={onClose} className="bg-[#a8d84e] text-[#0f1f0f] px-10 py-3 rounded font-bold tracking-[2px] uppercase no-underline text-[0.9rem] mt-4">
        Start Using VICO
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
    <section className="min-h-svh flex flex-col items-center justify-center relative overflow-hidden pt-24 pb-40 px-[clamp(1rem,5vw,2.5rem)]">
      {/* Animated grid */}
      <div className="absolute inset-0 pointer-events-none animate-[gridMove_25s_linear_infinite]"
        style={{ backgroundImage: "linear-gradient(rgba(168,216,78,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(168,216,78,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,120vw)] h-[min(700px,120vw)] rounded-full pointer-events-none animate-[orbPulse_5s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(125,193,66,0.1) 0%, transparent 70%)" }} />

      {/* Court lines SVG */}
      <svg viewBox="0 0 1200 800" className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <rect x="100" y="100" width="1000" height="600" fill="none" stroke="#a8d84e" strokeWidth="1.5" />
        <line x1="600" y1="100" x2="600" y2="700" stroke="#a8d84e" strokeWidth="1.5" />
        <line x1="100" y1="400" x2="1100" y2="400" stroke="#a8d84e" strokeWidth="1" />
        <line x1="250" y1="100" x2="250" y2="700" stroke="#a8d84e" strokeWidth="1" />
        <line x1="950" y1="100" x2="950" y2="700" stroke="#a8d84e" strokeWidth="1" />
      </svg>

      <div className="relative z-[2] text-center max-w-[1000px] w-full">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-[#2d5a35]/35 border border-[#2d5a35]/80 px-4 py-1.5 rounded-full text-[0.72rem] font-mono text-[#7dc142] tracking-[2px] uppercase mb-6 animate-[fadeSlideDown_0.8s_ease_both]">
          <span className="w-2 h-2 rounded-full bg-[#7dc142] animate-[pulse_1.5s_ease-in-out_infinite]" />
          LIVE NOW · Debug Mode (Improving Daily)
        </div>

        {/* Title */}
        <h1 className="font-['Bebas_Neue'] leading-[0.88] tracking-[-2px] text-[#e8f5e0] mb-6 opacity-0 animate-[fadeSlideDown_0.8s_0.15s_ease_forwards]"
          style={{ fontSize: "clamp(4.5rem,14vw,12rem)" }}>
          THE{" "}
          <span className="text-transparent" style={{ WebkitTextStroke: "2px #a8d84e" }}>OPERATING</span>
          <br />SYSTEM FOR<br />TENNIS IS LIVE
        </h1>

        <p className="text-[#7aaa6a] max-w-[580px] mx-auto mb-10 leading-[1.7] font-light opacity-0 animate-[fadeSlideDown_0.8s_0.3s_ease_forwards]"
          style={{ fontSize: "clamp(0.95rem,2.5vw,1.15rem)" }}>
          <strong className="text-[#a8d84e] font-semibold">Players. Coaches. Referees. Organizations.</strong>
          <br />Manage tournaments, track performance, book courts, and watch matches live — all in one evolving platform.{" "}
          <span className="opacity-70">Currently running in debug mode as we refine the experience with real users.</span>
        </p>

        <div className="flex gap-4 justify-center flex-wrap opacity-0 animate-[fadeSlideDown_0.8s_0.45s_ease_forwards]">
          <a href="/register" className="inline-block bg-[#a8d84e] text-[#0f1f0f] px-7 py-3 rounded font-bold text-[0.82rem] tracking-[1.5px] uppercase no-underline border-2 border-[#a8d84e] transition-all duration-200 hover:bg-transparent hover:text-[#a8d84e] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(168,216,78,0.35)] whitespace-nowrap">
            Start Using VICO
          </a>
          <a href="#realtime" className="inline-flex items-center gap-2 bg-transparent text-[#e8f5e0] px-7 py-3 rounded font-semibold text-[0.82rem] tracking-[1.5px] uppercase no-underline border border-[#2d5a35]/70 transition-all duration-200 hover:border-[#a8d84e] hover:text-[#a8d84e] hover:-translate-y-0.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_1s_ease-in-out_infinite] inline-block" />
            Explore Live System
          </a>
        </div>

        {/* No-friction note */}
        <p className="text-[#7aaa6a]/60 text-xs tracking-widest uppercase mt-5 font-mono opacity-0 animate-[fadeSlideDown_0.8s_0.6s_ease_forwards]">
          No setup required · Start in under 2 minutes
        </p>
      </div>

      {/* Live score widget */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[5] w-[calc(100%-2rem)] max-w-[420px] opacity-0 animate-[fadeSlideUp_0.8s_0.8s_ease_forwards]">
        <div className="bg-[#152515]/95 border border-[#2d5a35]/80 rounded-xl px-[18px] py-3.5 flex items-center gap-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex-wrap">
          <span className="bg-red-600 text-white text-[0.6rem] font-bold tracking-[2px] px-2 py-0.5 rounded-sm animate-[pulse_1s_ease-in-out_infinite] whitespace-nowrap">LIVE</span>
          <div className="flex-1 min-w-[140px]">
            {[
              { name: "N. OMONDI", sets: ["6","4","3"], serving: true },
              { name: "J. KAMAU", sets: ["3","6","2"], serving: false }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1 text-[0.88rem]">
                <span className="font-semibold flex items-center gap-1.5">
                  {p.serving && <span className="text-[#a8d84e] text-[0.45rem]">●</span>}
                  {p.name}
                </span>
                <div className="flex gap-2.5">
                  {p.sets.map((s, j) => (
                    <span key={j} className={`font-mono text-base font-bold min-w-[16px] text-center ${j === 2 ? "text-yellow-400" : (i===0&&j<2)||(i===1&&j===1) ? "text-[#a8d84e]" : "text-[#7aaa6a]"}`}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="w-px h-9 bg-[#2d5a35]/60" />
          <div className="text-center">
            <div className="text-[0.6rem] text-[#7aaa6a] tracking-[1px] uppercase">GAME</div>
            <div className="font-['Bebas_Neue'] text-[1.8rem] text-yellow-400 leading-none">{gameScore}</div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 font-mono text-[0.65rem] text-[#7aaa6a] opacity-50">{fmt(timer)}</div>
    </section>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner() {
  const { ref, visible } = useIntersection(0.3);
  return (
    <section ref={ref} className={`bg-[#1a3020] border-y border-[#2d5a35]/50 px-[clamp(1rem,5vw,2.5rem)] py-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="max-w-[1240px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[0.7rem] font-mono tracking-[3px] uppercase text-[#a8d84e]">🚧 Current Status</span>
          <span className="flex-1 h-px bg-[#2d5a35]/50" />
          <span className="text-[0.65rem] font-mono text-[#7aaa6a] bg-[#a8d84e]/10 border border-[#a8d84e]/30 px-3 py-1 rounded-full">VICO is in Debug Mode — Improving Daily</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[0.75rem] font-semibold text-[#a8d84e] uppercase tracking-[1px] mb-3">Currently Testing</p>
            <ul className="space-y-1.5">
              {["Real-time match scoring","Role-based dashboards","Tournament flows","M-Pesa payments integration"].map((item, i) => (
                <li key={i} className="text-[0.8rem] text-[#7aaa6a] flex items-center gap-2">
                  <span className="text-[#a8d84e] text-xs">›</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[0.75rem] font-semibold text-[#a8d84e] uppercase tracking-[1px] mb-3">What to Expect</p>
            <ul className="space-y-1.5">
              {["Continuous updates","Performance improvements","Feature refinements","Honest bug acknowledgements"].map((item, i) => (
                <li key={i} className="text-[0.8rem] text-[#7aaa6a] flex items-center gap-2">
                  <span className="text-[#a8d84e] text-xs">›</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:border-l border-[#2d5a35]/40 sm:pl-6">
            <p className="text-[0.75rem] font-semibold text-[#a8d84e] uppercase tracking-[1px] mb-3">Best Suited For</p>
            <ul className="space-y-1.5">
              {["Tennis clubs testing digital workflows","Coaches managing players","Players tracking performance","Organizations exploring tools"].map((item, i) => (
                <li key={i} className="text-[0.8rem] text-[#7aaa6a] flex items-center gap-2">
                  <span className="text-[#a8d84e] text-xs">›</span>{item}
                </li>
              ))}
            </ul>
            <p className="text-[0.75rem] text-[#7aaa6a]/70 mt-4 leading-relaxed italic">Your feedback directly shapes this platform.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const { ref, visible } = useIntersection(0.4);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const targets = [6, 100, 3, 2026];

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
    { val: counts[3], suffix: "", prefix: "", label: "Live Since April" },
  ];

  return (
    <div ref={ref} className="bg-[#152515] border-y border-[#2d5a35]/50 grid grid-cols-2 md:grid-cols-4 px-[clamp(1rem,5vw,2.5rem)]">
      {items.map((item, i) => (
        <div key={i} className={`text-center py-5 px-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${i < 3 ? "border-r border-[#2d5a35]/40" : ""}`}
          style={{ transitionDelay: `${i * 0.08}s` }}>
          <div className="font-['Bebas_Neue'] text-[#a8d84e] leading-none" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)" }}>
            {item.prefix}{item.val}{item.suffix}
          </div>
          <div className="text-[0.68rem] text-[#7aaa6a] tracking-[1px] uppercase mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="py-5 bg-[#1a3020] border-y border-[#2d5a35]/40 overflow-hidden">
      <div className="flex gap-12 animate-[marquee_30s_linear_infinite] w-max">
        {doubled.map((item, i) => (
          <span key={i} className="font-['Bebas_Neue'] text-[1.05rem] text-[#7aaa6a] tracking-[3px] whitespace-nowrap flex items-center gap-5">
            {item} <span className="text-[#a8d84e] text-xl">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Roles Section ────────────────────────────────────────────────────────────
function RolesSection() {
  return (
    <section id="roles" className="py-20 px-[clamp(1rem,5vw,2.5rem)] bg-[#0f1f0f]">
      <div className="max-w-[1240px] mx-auto">
        <SectionLabel>Built For Everyone</SectionLabel>
        <h2 className="font-['Bebas_Neue'] leading-[0.95] mb-3" style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)" }}>
          YOUR ROLE.<br />YOUR TOOLS.
        </h2>
        <p className="text-[#7aaa6a] text-[0.95rem] font-light max-w-[460px] leading-[1.7] mb-12">
          One platform, six roles. Every stakeholder in the tennis ecosystem gets a tailored experience — live now in debug mode.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2d5a35]/20 rounded-lg overflow-hidden">
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
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 p-[clamp(1.5rem,3vw,2.2rem)] bg-[#162a1b] border-t-[3px] ${role.accentBorder} ${hovered ? "bg-[#1f3a24] -translate-y-1 shadow-[0_16px_40px_rgba(0,0,0,0.4)]" : ""}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? (hovered ? "translateY(-4px)" : "none") : "translateY(20px)", transition: `all 0.3s ease ${visible ? index * 0.07 : 0}s` }}>

      <div className={`absolute inset-0 pointer-events-none opacity-30`}
        style={{ background: `radial-gradient(circle at 20% 20%, ${role.accentBorder.replace("border-","").includes("[") ? role.accentBorder.replace("border-[","").replace("]","") : "transparent"}08 0%, transparent 60%)` }} />

      <span className={`text-[clamp(1.8rem,5vw,2.2rem)] mb-4 block transition-transform duration-300 ${hovered ? "scale-[1.15] -rotate-6" : ""}`}>{role.icon}</span>

      <span className={`text-[0.8rem] font-bold tracking-[2px] uppercase px-2.5 py-1 rounded-sm ${role.accentBg} ${role.accent} inline-block mb-4`}>{role.tag}</span>

      <h3 className="font-['Bebas_Neue'] leading-[1.05] mb-5 whitespace-pre-line" style={{ fontSize: "clamp(1.5rem,4vw,1.9rem)" }}>{role.title}</h3>

      <ul className="list-none p-0 m-0 mb-6">
        {role.features.map((f, i) => (
          <li key={i} className="text-[clamp(0.75rem,2vw,0.82rem)] text-[#7aaa6a] py-[7px] border-b border-[#2d5a35]/20 flex items-center gap-2">
            <span className={`${role.accent} text-[0.9rem] leading-none`}>›</span>{f}
          </li>
        ))}
      </ul>

      <a href="#cta" className={`text-[0.78rem] font-bold tracking-[2px] uppercase ${role.accent} no-underline flex items-center gap-1.5 transition-all duration-200`}>
        {role.cta} <span className={`transition-transform duration-200 ${hovered ? "translate-x-1" : ""}`}>→</span>
      </a>
    </div>
  );
}

// ─── Realtime Section ─────────────────────────────────────────────────────────
function RealtimeSection() {
  const { ref: leftRef, visible: leftVisible } = useIntersection();
  const { ref: rightRef, visible: rightVisible } = useIntersection();

  return (
    <section id="realtime" className="py-20 px-[clamp(1rem,5vw,2.5rem)] bg-[#152515]">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,6vw,5rem)] items-center">
        <div ref={leftRef} className={`transition-all duration-700 ${leftVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <SectionLabel>Killer Feature</SectionLabel>
          <h2 className="font-['Bebas_Neue'] leading-[0.95] mb-4" style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)" }}>
            TENNIS,<br />LIVE AND<br />UNFILTERED
          </h2>
          <p className="text-[#7aaa6a] text-[0.95rem] font-light leading-[1.7] mb-6">
            Every point. Every rally. Every set. Watch matches unfold in real-time with live scoring powered by WebSockets — no refresh needed.
          </p>
          <p className="text-[#7aaa6a]/60 text-[0.8rem] leading-relaxed mb-6 italic">
            Currently used in live testing environments with real match simulations and scoring flows.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: "⚡", title: "Real-Time Score Updates", desc: "WebSocket-powered, zero latency score delivery" },
              { icon: "🏆", title: "Live Tournament Brackets", desc: "Bracket progression updates as matches complete" },
              { icon: "📊", title: "Performance Analytics Live", desc: "Stats computed as the match progresses" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 bg-[#1a3020]/50 border border-[#2d5a35]/50 rounded-lg">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-semibold text-[0.9rem] mb-0.5">{item.title}</div>
                  <div className="text-[0.78rem] text-[#7aaa6a]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={rightRef} className={`transition-all duration-700 delay-200 ${rightVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
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
    <div className="bg-[#0f1f0f] border border-[#2d5a35]/60 rounded-2xl p-[clamp(1.2rem,3vw,2rem)] shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#2d5a35]/40">
        <span className="text-[0.72rem] text-[#7aaa6a] tracking-[1px]">🏆 Nairobi Open 2026</span>
        <span className="text-[0.72rem] text-[#a8d84e] tracking-[1px] font-mono">QF · COURT 1</span>
      </div>

      {[
        { flag: "🇰🇪", name: "N. OMONDI", rank: "#12 KEN", sets: [{ v: "6", active: true }, { v: "4" }, { v: "3", live: true }] },
        { flag: "🇺🇬", name: "J. KAMAU", rank: "#8 UGA", sets: [{ v: "3" }, { v: "6", active: true }, { v: "2", live: true }] },
      ].map((p, i) => (
        <div key={i} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-[#2d5a35]/20" : ""}`}>
          <div className="flex items-center gap-3 font-semibold text-base">
            <span className="text-xl">{p.flag}</span>
            <div>
              <div>{p.name}</div>
              <div className="text-[0.68rem] text-[#7aaa6a] font-mono">{p.rank}</div>
            </div>
          </div>
          <div className="flex gap-4">
            {p.sets.map((s, j) => (
              <span key={j} className={`font-['Bebas_Neue'] text-[1.8rem] min-w-[20px] text-center transition-all duration-300 ${s.live ? "text-yellow-400" : s.active ? "text-[#a8d84e]" : "text-[#7aaa6a]"}`}>{s.v}</span>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 px-5 py-4 bg-[#a8d84e]/5 border border-[#a8d84e]/15 rounded-lg flex items-center justify-between">
        <div className="text-[0.68rem] text-[#7aaa6a] tracking-[1px]">Current Game</div>
        <div className="flex gap-8">
          {[{ label: "OMONDI", val: p1pts, hot: true }, { label: "KAMAU", val: p2pts }].map((pt, i) => (
            <div key={i} className="text-center">
              <div className="text-[0.65rem] text-[#7aaa6a] mb-0.5">{pt.label}</div>
              <div className={`font-['Bebas_Neue'] text-[2.2rem] leading-none transition-all duration-300 ${pt.hot ? "text-yellow-400 drop-shadow-[0_0_20px_rgba(240,192,64,0.5)]" : "text-[#a8d84e]"}`}>{pt.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rally ball */}
      <div className="mt-4 h-[50px] rounded-md bg-[#2d5a35]/12 border border-[#2d5a35]/20 relative overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#a8d84e]/25" />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_#f0c040] top-1/2 -translate-y-1/2 animate-[rally_1.6s_ease-in-out_infinite]" />
      </div>

      <div className="mt-3 flex justify-between text-[0.72rem] text-[#7aaa6a] font-mono">
        <span>Aces: 4 · DFs: 1</span>
        <span className="text-[#a8d84e]">● LIVE</span>
        <span>BPs: 2</span>
      </div>
    </div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-[clamp(1rem,5vw,2.5rem)] bg-[#0f1f0f]">
      <div className="max-w-[1240px] mx-auto">
        <SectionLabel>Core Platform</SectionLabel>
        <h2 className="font-['Bebas_Neue'] leading-[0.95] mb-3" style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)" }}>
          EVERYTHING<br />TENNIS NEEDS
        </h2>
        <p className="text-[#7aaa6a] text-[0.95rem] font-light max-w-[460px] leading-[1.7] mb-12">
          Four pillars. Infinite depth. Built to handle the full complexity of modern tennis operations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2d5a35]/20 rounded-lg overflow-hidden">
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
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-9 transition-all duration-300 cursor-default border-b-[3px] ${hovered ? "bg-[#1a3020] border-[#a8d84e]" : "bg-[#152515] border-transparent"}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transitionDelay: `${index * 0.1}s` }}>
      <span className="text-[2rem] mb-5 block">{feature.icon}</span>
      <h3 className="font-['Bebas_Neue'] text-[1.4rem] mb-3">{feature.title}</h3>
      <p className="text-[0.83rem] text-[#7aaa6a] leading-[1.65]">{feature.desc}</p>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="howitworks" className="py-20 px-[clamp(1rem,5vw,2.5rem)] bg-[#152515] text-center">
      <div className="max-w-[900px] mx-auto">
        <SectionLabel center>Simple Onboarding</SectionLabel>
        <h2 className="font-['Bebas_Neue'] leading-[0.95] mb-3" style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)" }}>
          GET STARTED<br />IN MINUTES
        </h2>
        <p className="text-[#7aaa6a] text-[0.95rem] font-light mx-auto mb-12 leading-[1.7] max-w-[460px]">
          No complex setup. No learning curve. Pick your role and start exploring the live platform.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#2d5a35]/60 to-transparent" />
          {STEPS.map((step, i) => <StepCard key={i} step={step} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center px-4 relative"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: `all 0.5s ease ${index * 0.12}s` }}>
      <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center font-['Bebas_Neue'] text-[1.8rem] relative z-[1] mb-5 transition-all duration-300 border-2 ${hovered ? "bg-[#a8d84e] border-[#a8d84e] text-[#0f1f0f] shadow-[0_0_30px_rgba(168,216,78,0.4)]" : "bg-[#1a3020] border-[#2d5a35]/80 text-[#a8d84e]"}`}>
        {step.num}
      </div>
      <h3 className="font-['Bebas_Neue'] text-[1.3rem] mb-2">{step.title}</h3>
      <p className="text-[0.8rem] text-[#7aaa6a] leading-[1.6]">{step.desc}</p>
    </div>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  const { ref, visible } = useIntersection();
  return (
    <section id="cta" className="py-24 px-[clamp(1rem,5vw,2.5rem)] bg-[#0f1f0f] text-center relative overflow-hidden">
      {/* Big watermark */}
      <div className="absolute font-['Bebas_Neue'] text-[#2d5a35]/7 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap leading-none select-none"
        style={{ fontSize: "clamp(8rem,30vw,22rem)" }}>VICO</div>

      <div ref={ref} className={`relative z-[1] max-w-[680px] mx-auto transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="font-mono text-[0.75rem] text-[#7dc142] tracking-[3px] mb-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7dc142] animate-[pulse_1.5s_ease-in-out_infinite] inline-block" />
          LIVE IN DEBUG MODE · ACTIVELY IMPROVING
        </div>

        <h2 className="font-['Bebas_Neue'] leading-[0.92] mb-6" style={{ fontSize: "clamp(2.8rem,8vw,6rem)" }}>
          VICO IS LIVE —<br />BE PART OF<br />
          <span className="text-[#a8d84e]">THE BUILD</span>
        </h2>

        <p className="text-[#7aaa6a] text-[0.95rem] mb-10 leading-[1.7] max-w-[520px] mx-auto">
          VICO is currently running in debug mode. Join early, explore features, and help shape the platform as we improve performance, stability, and user experience.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-8">
          <a href="/register" className="inline-block bg-[#a8d84e] text-[#0f1f0f] px-8 py-3.5 rounded font-bold text-[0.85rem] tracking-[1.5px] uppercase no-underline border-2 border-[#a8d84e] transition-all duration-200 hover:bg-transparent hover:text-[#a8d84e] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(168,216,78,0.35)]">
            Start Using VICO
          </a>
          <a href="/login" className="inline-block bg-transparent text-[#e8f5e0] px-8 py-3.5 rounded font-semibold text-[0.85rem] tracking-[1.5px] uppercase no-underline border border-[#2d5a35]/70 transition-all duration-200 hover:border-[#a8d84e] hover:text-[#a8d84e] hover:-translate-y-0.5">
            Login
          </a>
        </div>

        {/* Role chips */}
        <div className="flex gap-2 justify-center flex-wrap mb-6">
          {["🎾 Player","🎓 Coach","🧑‍⚖️ Referee","🏢 Organization","👀 Spectator"].map((r, i) => (
            <a key={i} href="#" className="bg-[#2d5a35]/15 border border-[#2d5a35]/60 text-[#7aaa6a] px-4 py-2 rounded text-[0.78rem] font-semibold tracking-[1px] no-underline transition-all duration-200 hover:bg-[#a8d84e]/10 hover:border-[#a8d84e] hover:text-[#a8d84e]">
              {r}
            </a>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-[#7aaa6a]/50 text-[0.72rem] font-mono tracking-wider">
          ⚙️ Debug Mode Active · Features may evolve · Feedback welcome
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a160a] border-t border-[#2d5a35]/50 px-[clamp(1rem,5vw,2.5rem)] py-10 flex items-center justify-between flex-wrap gap-6">
      <div>
        <div className="font-['Bebas_Neue'] text-[1.8rem] text-[#a8d84e] tracking-[4px]">VICO</div>
        <div className="text-[#7aaa6a] text-[0.8rem] mt-1">Live in Debug Mode · Actively Improving Daily</div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["NEXT.JS","FLUTTER","POSTGRESQL","WEBSOCKETS","M-PESA","STRIPE"].map((t, i) => (
          <span key={i} className="font-mono text-[0.65rem] text-[#7aaa6a] bg-[#2d5a35]/20 border border-[#2d5a35]/50 px-2 py-1 rounded-sm tracking-[1px]">{t}</span>
        ))}
      </div>
      <div className="text-right text-[#7aaa6a] text-[0.78rem]">
        <div>Complete Tennis Platform</div>
        <div className="mt-1 text-[#a8d84e]">Live Since April 2026</div>
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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f1f0f; }
        ::-webkit-scrollbar-thumb { background: rgba(45,90,53,0.6); border-radius: 2px; }

        @keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(50px); } }
        @keyframes orbPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; } 50% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes rally { 0% { left: 5%; } 50% { left: 88%; } 100% { left: 5%; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <Nav onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Hero />
      <StatusBanner />
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