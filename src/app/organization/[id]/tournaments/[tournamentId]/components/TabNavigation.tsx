import React, { useState, useEffect } from 'react';

interface TabNavigationProps {
  activeTab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements' | 'appeals';
  setActiveTab: (tab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements' | 'appeals') => void;
  pendingRegistrations?: any[];
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'registrations', label: 'Registrations', icon: '👥' },
  { key: 'schedule', label: 'Schedule', icon: '📅' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'announcements', label: 'Announcements', icon: '📢' },
  { key: 'rules', label: 'Rules & Details', icon: '📋' },
  { key: 'facilities', label: 'Facilities', icon: '🏨' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'appeals', label: 'Appeals', icon: '🔔' },
];

export function TabNavigation({
  activeTab,
  setActiveTab,
}: TabNavigationProps) {
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabSelect = (tabKey: string) => {
    setActiveTab(tabKey as any);
    setMobileTabOpen(false);
  };

  return (
    <div className="relative mb-6">
      {/* Mobile Tab Selector */}
      <div className="flex flex-col gap-2 lg:hidden">
        <p style={{ fontSize: 12, fontStyle: 'italic', color: '#7aaa6a', margin: 0, fontFamily: "'Epilogue', sans-serif" }}>
          Tap here to switch between tournament sections.
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileTabOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold"
            style={{
              borderColor: '#2d5a35',
              background: '#1a3020',
              color: '#e8f5e0',
              fontFamily: "'Epilogue', sans-serif"
            }}
          >
            <span>{TABS.find((tab) => tab.key === activeTab)?.icon} {TABS.find((tab) => tab.key === activeTab)?.label}</span>
            <span style={{ transform: mobileTabOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
          </button>
        </div>
      </div>

      {mobileTabOpen && (
        <div className="lg:hidden mt-2 flex flex-col gap-2 rounded-2xl border p-3"
          style={{ borderColor: '#2d5a35', background: '#1a3020' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabSelect(tab.key)}
              className="w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              style={{
                background: activeTab === tab.key ? '#7dc14220' : 'transparent',
                color: activeTab === tab.key ? '#7dc142' : '#e8f5e0',
                border: activeTab === tab.key ? '1px solid #7dc142' : '1px solid transparent',
                fontFamily: "'Epilogue', sans-serif"
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Desktop Tabs */}
      <div className="hidden lg:flex gap-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #7dc142' : '3px solid transparent',
              color: activeTab === tab.key ? '#7dc142' : '#7aaa6a',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 900 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
              marginBottom: -2,
              fontFamily: "'Epilogue', sans-serif"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
