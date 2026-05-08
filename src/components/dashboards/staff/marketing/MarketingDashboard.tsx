'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface MarketingDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const baseStats = {
    campaignsLive: 4,
    engagement: '18%',
    newLeads: 76,
    conversionRate: '7.2%',
    ...stats,
  };

  const campaigns: Array<{ name: string; status: string; roi: string }> =
    sectionData?.campaigns?.map((campaign: any) => ({
      name: campaign.content?.slice(0, 30) || 'Campaign',
      status: 'Live',
      roi: `${campaign.shareCount ?? 0} shares`,
    })) ?? [
      { name: 'Spring membership drive', status: 'Running', roi: '3.2x' },
      { name: 'Holiday tournament push', status: 'Planning', roi: '—' },
    ];

  const social: Array<{ channel: string; posts: number; engagement: string }> =
    sectionData?.social?.map((item: any, index: number) => ({
      channel: item.content ? `Post ${index + 1}` : `Channel ${index + 1}`,
      posts: item.shareCount ?? 0,
      engagement: item.shareCount ? `${Math.min(item.shareCount * 2, 99)}%` : '0%',
    })) ?? [
      { channel: 'Instagram', posts: 8, engagement: '21%' },
      { channel: 'Facebook', posts: 4, engagement: '16%' },
    ];

  const analytics: Array<{ label: string; value: string }> =
    sectionData?.analytics?.map((row: any) => ({
      label: row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Metric',
      value: `${row.shareCount ?? 0} shares`,
    })) ?? [
      { label: 'Website visits', value: '2.4k' },
      { label: 'New subscribers', value: '310' },
    ];

  const renderOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      {[
        { label: 'Campaigns Live', value: baseStats.campaignsLive, icon: '🚀' },
        { label: 'Engagement', value: baseStats.engagement, icon: '❤️' },
        { label: 'New Leads', value: baseStats.newLeads, icon: '📈' },
        { label: 'Conversion', value: baseStats.conversionRate, icon: '🎯' },
      ].map((item, index) => (
        <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
          <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
        </div>
      ))}
    </div>
  );

  const renderCampaigns = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📣 Campaigns</div>
      {campaigns.map((campaign, index) => (
        <div key={campaign.name} style={{ padding: '10px 0', borderBottom: index < campaigns.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{campaign.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{campaign.status} • ROI {campaign.roi}</div>
        </div>
      ))}
    </div>
  );

  const renderSocial = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📱 Social</div>
      {social.map((item, index) => (
        <div key={item.channel} style={{ padding: '10px 0', borderBottom: index < social.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{item.channel}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{item.posts} posts • {item.engagement} engagement</div>
        </div>
      ))}
    </div>
  );

  const renderAnalytics = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Analytics</div>
      {analytics.map((row, index) => (
        <div key={row.label} style={{ padding: '10px 0', borderBottom: index < analytics.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{row.label}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{row.value}</div>
        </div>
      ))}
    </div>
  );

  const renderCreative = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎨 Creative</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Asset creation, content plans, and campaign collateral.</div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    campaigns: renderCampaigns,
    analytics: renderAnalytics,
    social: renderSocial,
    creative: renderCreative,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default MarketingDashboard;
