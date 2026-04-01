'use client';

import React, { useState, useEffect } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface Staff {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
  expertise?: string;
  coachingLevel?: string;
  experience: number;
  status: string;
  sessions: number;
}

interface StaffSectionProps {
  orgId?: string;
}

export default function OrganizationStaffSection({ orgId }: StaffSectionProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) {
      fetchStaff();
    }
  }, [orgId]);

  async function fetchStaff() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/organization/${orgId}/staff`);
      if (!res.ok) throw new Error(`Failed to fetch staff: ${res.status}`);
      const data = await res.json();
      setStaff(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching staff');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return <div style={{ color: 'red', padding: 12 }}>Error: {error}</div>;
  }

  const activeCount = staff.filter(s => s.status === 'Active').length;
  const totalSessions = staff.reduce((sum, s) => sum + (s.sessions || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Staff Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Staff</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime, marginBottom: 6 }}>{loading ? '-' : staff.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Active</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.bright, marginBottom: 6 }}>{loading ? '-' : activeCount}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Student Hours</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, marginBottom: 6 }}>{loading ? '-' : totalSessions}h</div>
        </div>
      </div>

      {/* Staff List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👥 Team Members</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading staff...</div>
        ) : staff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>No staff members found</div>
        ) : (
          staff.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < staff.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.photo ? `url(${s.photo})` : G.dark, border: `2px solid ${G.mid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!s.photo && `${s.name.charAt(0)}${s.name.split(' ')[1]?.[0] || ''}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{s.role} {s.expertise && `• ${s.expertise}`}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 9, padding: '4px 8px', background: s.status === 'Active' ? G.lime + '33' : G.bright + '33', color: s.status === 'Active' ? G.lime : G.bright, borderRadius: 4, fontWeight: 700 }}>
                  {s.status}
                </span>
                <span style={{ fontSize: 9, padding: '4px 8px', background: G.dark, color: G.accent, borderRadius: 4, fontWeight: 600 }}>
                  {s.sessions}h
                </span>
              </div>
            </div>
          ))
        )}
        <button style={{ width: '100%', marginTop: 12, padding: '8px', background: G.bright, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          + Add Staff Member
        </button>
      </div>
    </div>
  );
}
