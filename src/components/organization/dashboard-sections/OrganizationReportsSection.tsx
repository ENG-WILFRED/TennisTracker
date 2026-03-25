'use client';

import React, { useState } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface ReportsSectionProps {
  // Reports data
}

export default function OrganizationReportsSection({}: ReportsSectionProps) {
  const [reportType, setReportType] = useState('revenue');

  const reports = {
    revenue: { title: 'Revenue Report', icon: '💰', data: [12500, 13200, 11800, 15600, 14200, 16800] },
    members: { title: 'Member Activity', icon: '👥', data: [120, 135, 128, 142, 150, 165] },
    events: { title: 'Event Attendance', icon: '🎾', data: [45, 52, 48, 61, 58, 70] },
    ratings: { title: 'Club Ratings', icon: '⭐', data: [4.2, 4.3, 4.1, 4.5, 4.4, 4.6] },
  };

  const currentReport = reports[reportType as keyof typeof reports];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Report Type Selector */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Select Report</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {['revenue', 'members', 'events', 'ratings'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              style={{
                padding: '12px',
                background: reportType === type ? G.lime : G.dark,
                border: `1px solid ${reportType === type ? G.lime : G.cardBorder}`,
                borderRadius: 8,
                color: reportType === type ? '#0f1f0f' : G.text,
                fontWeight: reportType === type ? 700 : 500,
                fontSize: 11,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type === 'revenue' && '💰'} {type === 'members' && '👥'} {type === 'events' && '🎾'} {type === 'ratings' && '⭐'} {type}
            </button>
          ))}
        </div>
      </div>

      {/* Current Report */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>
          {currentReport.icon} {currentReport.title}
        </div>

        {/* Report Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
          <div style={{ background: '#0f1f0f', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Current Value</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>
              {reportType === 'ratings' ? '4.6★' : reportType === 'revenue' ? '$16,800' : currentReport.data[currentReport.data.length - 1]}
            </div>
          </div>
          <div style={{ background: '#0f1f0f', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Average</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.accent }}>
              {reportType === 'ratings' ? '4.3★' : reportType === 'revenue' ? '$14,200' : Math.round(currentReport.data.reduce((a, b) => a + b) / currentReport.data.length)}
            </div>
          </div>
          <div style={{ background: '#0f1f0f', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 4 }}>Growth</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.bright }}>↑ 8.2%</div>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div style={{ background: '#0f1f0f', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', gap: 4, height: 200, justifyContent: 'space-around', alignItems: 'flex-end' }}>
            {currentReport.data.map((value: any, i: number) => {
              const max = Math.max(...currentReport.data);
              const height = (value / max) * 180;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${height}px`,
                    background: `linear-gradient(to top, ${G.lime}, ${G.bright})`,
                    borderRadius: 4,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  title={`Month ${i + 1}: ${value}`}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, fontSize: 9, color: G.muted }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        <button style={{ padding: '10px', background: G.bright, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          📥 Download PDF
        </button>
        <button style={{ padding: '10px', background: G.accent, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          📊 Export CSV
        </button>
      </div>
    </div>
  );
}
