'use client';

import React from 'react';
import { MembershipSwitcher } from '@/components/MembershipSwitcher';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  border: '#243e24',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  muted: '#5e8e50',
  muted2: '#7aaa68',
};

interface NavItem {
  label: string;
  icon: string;
  pill?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '🏠', pill: 0 },
  { label: 'My Profile', icon: '👤' },
  { label: 'Sessions', icon: '📅' },
  { label: 'Players', icon: '👥' },
  { label: 'Calendar', icon: '📆' },
  { label: 'Find People', icon: '👥' },
  { label: 'Find Courts', icon: '🎾' },
  { label: 'Tasks', icon: '📋' },
  { label: 'Messaging', icon: '💬' },
  { label: 'Community', icon: '🌐' },
];

interface CoachSidebarProps {
  user?: any;
  activeNav: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleNavigation: (section: string) => void;
  handleLogout: () => void;
}

export function CoachSidebar({
  user,
  activeNav,
  sidebarOpen,
  setSidebarOpen,
  handleNavigation,
  handleLogout,
}: CoachSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] transform border-r transition-transform duration-300 md:relative md:sticky md:top-0 md:translate-x-0 md:flex md:w-56 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{
        background: G.sidebar,
        borderColor: G.border,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div
        className="hidden md:flex"
        style={{
          padding: '14px 15px 13px',
          borderBottom: `1px solid ${G.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: G.lime,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          🎾
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 13.5, color: G.lime, letterSpacing: -0.4, lineHeight: 1.1 }}>
            Vico Sports
          </div>
          <div style={{ fontSize: 8.5, color: G.muted, letterSpacing: 1.1, textTransform: 'uppercase' }}>
            Coach Platform
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#243e24] text-[#7aaa6a] hover:bg-[#1e3a20] transition lg:hidden"
          aria-label="Close navigation"
        >
          ✕
        </button>
      </div>

      <nav style={{ flex: 1, padding: '6px 7px 0', overflowY: 'auto' }}>
        {(['Main', 'Content'] as const).map(section => {
          const sectionItems = section === 'Main' ? navItems.slice(0, 4) : navItems.slice(4);
          return (
            <React.Fragment key={section}>
              <div
                style={{
                  fontSize: 8.5,
                  color: G.muted,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  padding: '8px 5px 3px',
                }}
              >
                {section}
              </div>
              {sectionItems.map(item => {
                const on = activeNav === item.label;
                return (
                  <div
                    key={item.label}
                    onClick={() => handleNavigation(item.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 9px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      marginBottom: 1,
                      border: `1px solid ${on ? G.border : 'transparent'}`,
                      background: on ? G.card : 'transparent',
                      color: on ? G.lime : G.muted,
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      if (!on) {
                        (e.currentTarget as HTMLDivElement).style.background = G.card;
                        (e.currentTarget as HTMLDivElement).style.color = G.lime2;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!on) {
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        (e.currentTarget as HTMLDivElement).style.color = G.muted;
                      }
                    }}
                  >
                    <span style={{ fontSize: 13, width: 16, textAlign: 'center', color: on ? G.lime : 'inherit' }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 600 }}>{item.label}</span>
                    {item.pill ? (
                      <span
                        style={{
                          marginLeft: 'auto',
                          background: G.lime,
                          color: '#0a180a',
                          fontSize: 8.5,
                          fontWeight: 800,
                          borderRadius: 9,
                          padding: '1px 6px',
                        }}
                      >
                        {item.pill}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </nav>

      <div style={{ padding: 9 }}>
        <div
          style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            borderRadius: 11,
            padding: '12px 11px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color .2s, background .2s',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 7 }}>
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.firstName}
                style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${G.lime}`, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: G.card,
                  border: `2px solid ${G.lime}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                👨‍🏫
              </div>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: 12.5, letterSpacing: -0.2 }}>
            Coach {user?.firstName ?? 'Maria'}
          </div>
          <div style={{ fontSize: 9.5, color: G.muted2, marginTop: 1 }}>Head Tennis Coach</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {['ITF L2', 'ATP', 'Active'].map(c => (
              <span
                key={c}
                style={{
                  fontSize: 8.5,
                  background: 'rgba(121,191,62,.12)',
                  border: '1px solid rgba(121,191,62,.3)',
                  color: G.lime,
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontWeight: 700,
                }}
              >
                {c}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <MembershipSwitcher />
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleNavigation('My Profile')}
              style={{
                flex: 1,
                background: G.dark,
                color: G.lime,
                border: `1px solid ${G.lime}`,
                borderRadius: 6,
                padding: '4px 0',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                background: '#ff6b6b',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 0',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
