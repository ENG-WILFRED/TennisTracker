import React from 'react';

interface TabNavigationProps {
  activeTab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements';
  setActiveTab: (tab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements') => void;
  pendingRegistrations?: any[];
}

const TABS = [
  { key: 'overview', label: '📊 Overview', icon: '📊' },
  { key: 'registrations', label: '👥 Registrations', icon: '👥' },
  { key: 'schedule', label: '📅 Schedule', icon: '📅' },
  { key: 'analytics', label: '📈 Analytics', icon: '📈' },
  { key: 'announcements', label: '📢 Announcements', icon: '📢' },
  { key: 'rules', label: '📋 Rules & Details', icon: '📋' },
  { key: 'facilities', label: '🏨 Facilities', icon: '🏨' },
  { key: 'settings', label: '⚙️ Settings', icon: '⚙️' },
];

export function TabNavigation({
  activeTab,
  setActiveTab,
}: TabNavigationProps) {
  return (
    <div className="flex gap-2 border-b border-[rgba(99,153,34,0.08)] pb-4 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as any)}
          className={`px-4 py-2 rounded-lg border-none transition-all duration-150 text-xl font-semibold cursor-pointer ${
            activeTab === tab.key
              ? 'bg-[rgba(99,153,34,0.18)] text-[#a3d45e]'
              : 'bg-transparent text-[#5a7242] hover:text-[#8dc843]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
