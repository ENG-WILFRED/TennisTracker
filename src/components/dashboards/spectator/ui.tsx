'use client';

import React from 'react';
import type { NavSection } from './types';

export const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  card2: '#1b2f1b',
  card3: '#203520',
  cardBorder: '#2d5a35',
  border: '#243e24',
  mid: '#2d5a27',
  bright: '#3a7230',
  lime: '#7dc142',
  accent: '#a8d84e',
  yellow: '#f0c040',
  blue: '#4a9eff',
  red: '#d94f4f',
  text: '#e8f5e0',
  text2: '#c2dbb0',
  muted: '#7aaa6a',
  muted2: '#5e8e50',
  success: '#5fc45f',
  danger: '#e57373',
};

export function StatPill({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3 flex-1 min-w-[80px]"
      style={{ background: G.card2, border: `1px solid ${G.border}` }}
    >
      <span className="text-[10px] uppercase tracking-widest" style={{ color: G.muted }}>{label}</span>
      <span className="text-lg font-bold" style={{ color: accent ? G.lime : G.text }}>{value}</span>
    </div>
  );
}

export function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: `${color || G.lime}22`, color: color || G.lime, border: `1px solid ${color || G.lime}44` }}
    >
      {children}
    </span>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: G.card, border: `1px solid ${G.cardBorder}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-wide" style={{ color: G.lime }}>{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: G.muted }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function NavBtn({
  section,
  active,
  onClick,
}: {
  section: NavSection;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150"
      style={{
        background: active ? G.mid : 'transparent',
        color: active ? G.text : G.muted,
        border: `1px solid ${active ? G.lime : 'transparent'}`,
      }}
    >
      <span className="text-base leading-none">{section.icon}</span>
      <span>{section.label}</span>
    </button>
  );
}

export function ActionBtn({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: G.lime, color: G.dark, border: 'none' },
    secondary: { background: G.mid, color: G.text, border: `1px solid ${G.cardBorder}` },
    ghost: { background: 'transparent', color: G.muted, border: `1px solid ${G.cardBorder}` },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} rounded-xl px-4 py-2.5 text-sm font-bold transition-opacity cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-[.98]'} ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: G.muted }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: G.card2,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 12,
  color: G.text,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
};
