import { Role, Feature, Step } from "./types";

export const ROLES: Role[] = [
  {
    icon: "🎾",
    tag: "Players",
    accent: "text-[#a8d84e]",
    accentBg: "bg-[#a8d84e]/10",
    accentBorder: "border-[#a8d84e]",
    borderGlow: "rgba(168,216,78,0.15)",
    title: "Dominate\nYour Game",
    features: ["ELO rankings & weekly updates","Full match history & stats","Issue ranking challenges","Achievement badges & leaderboards","Smart court booking","Tournament registration"],
    cta: "Join as Player",
  },
  {
    icon: "🎓",
    tag: "Coaches",
    accent: "text-sky-400",
    accentBg: "bg-sky-400/10",
    accentBorder: "border-sky-400",
    borderGlow: "rgba(56,189,248,0.12)",
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
    borderGlow: "rgba(251,146,60,0.12)",
    title: "Officiate\nWith Precision",
    features: ["Match & tournament assignments","Best-of-3 live score recording","Rule appeals & dispute tracking","ITF rules database on demand","Ball crew coordination","Credential expiry reminders"],
    cta: "Join as Referee",
  },
  {
    icon: "🏢",
    tag: "Organizations",
    accent: "text-violet-400",
    accentBg: "bg-violet-400/10",
    accentBorder: "border-violet-400",
    borderGlow: "rgba(167,139,250,0.12)",
    title: "Build Your\nClub Empire",
    features: ["Multi-tenant club & academy setup","Court management & pricing","Membership tiers & auto-billing","Tournament creation & brackets","Staff & role assignment","Revenue & analytics dashboards"],
    cta: "Join as Org",
  },
  {
    icon: "⚙️",
    tag: "Staff & Admins",
    accent: "text-rose-400",
    accentBg: "bg-rose-400/10",
    accentBorder: "border-rose-400",
    borderGlow: "rgba(251,113,133,0.12)",
    title: "Run the\nWhole Show",
    features: ["M-Pesa, PayPal & Stripe payments","Audit logs & compliance reports","Task templates & assignments","Broadcast announcements by role","Revenue forecasting tools","Multi-role dashboards & KPIs"],
    cta: "Join as Admin",
  },
  {
    icon: "👀",
    tag: "Spectators",
    accent: "text-amber-400",
    accentBg: "bg-amber-400/10",
    accentBorder: "border-amber-400",
    borderGlow: "rgba(251,191,36,0.12)",
    title: "Follow Every\nRally",
    features: ["Live match score updates","Tournament brackets & results","Player profiles & career stats","Notifications for favourite players","Match history & replays","Rankings & leaderboards"],
    cta: "Follow as Fan",
  },
];

export const GAME_SCORES = ["0-0","15-0","15-15","30-15","30-30","40-30","DEUCE","ADV-40","GAME"];

export const MARQUEE_ITEMS = [
  "Live Scoring","ELO Rankings","Tournament Brackets","Court Booking",
  "Coach Sessions","M-Pesa Payments","Referee Tools","Club Management",
  "Spectator Mode","Performance Analytics","Real-Time Updates",
];

export const FEATURES: Feature[] = [
  { icon: "📅", title: "Smart Booking", desc: "Courts, coaches, and sessions in one calendar. Auto-conflict detection, pricing tiers, and instant confirmation." },
  { icon: "🏆", title: "Tournament Engine", desc: "Create brackets, schedule rounds, auto-seed players by ELO, and broadcast results in real time." },
  { icon: "⚡", title: "Real-Time Match System", desc: "WebSocket-powered live scoring. Referees update, spectators watch, players track — simultaneously." },
  { icon: "💬", title: "Communication Hub", desc: "Role-based announcements, push notifications, chat, and broadcast messaging across the ecosystem." },
];

export const STEPS: Step[] = [
  { num: "01", title: "Create Account", desc: "Sign up in under 2 minutes with email or social login." },
  { num: "02", title: "Choose Your Role", desc: "Player, Coach, Referee, Org, Admin, or Spectator." },
  { num: "03", title: "Join or Create", desc: "Find a tournament, join a club, or start your own." },
  { num: "04", title: "Play. Manage. Watch.", desc: "Your dashboard is live. Explore and help shape the platform." },
];

export const STATUS_SECTIONS = [
  {
    title: "Currently Testing",
    items: ["Real-time match scoring","Role-based dashboards","Tournament flows","M-Pesa payment integration"]
  },
  {
    title: "What to Expect",
    items: ["Continuous updates","Performance improvements","Feature refinements","Honest bug acknowledgements"]
  },
  {
    title: "Best Suited For",
    items: ["Tennis clubs testing digital workflows","Coaches managing players","Players tracking performance","Organizations exploring tools"]
  }
];

export const NAV_LINKS = [["Roles","#roles"],["Live Play","#realtime"],["Features","#features"],["How It Works","#howitworks"]];
