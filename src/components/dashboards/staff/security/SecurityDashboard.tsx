'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = { dark: '#0f1f0f', card: '#1a3020', cardBorder: '#2d5a35', lime: '#7dc142', text: '#e8f5e0', muted: '#7aaa6a' };

interface SecurityDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  stats: Record<string, any>;
  sectionData?: Record<string, any>;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const resolvedStats = {
    visitorsLogged: stats.visitorsLogged ?? 0,
    incidentsToday: stats.incidentsToday ?? 0,
    patrols: stats.patrols ?? 0,
    alerts: stats.alerts ?? 0,
  };

  const visitors = (sectionData?.visitors ?? []).map((visitor: any) => ({
    name: visitor.name || visitor.userId || 'Visitor',
    purpose: visitor.scanType || 'Entry',
    status: visitor.status || 'Checked in',
    location: visitor.location || 'Main Gate',
    scannedAt: visitor.scannedAt,
  }));

  const incidents = (sectionData?.incidents ?? []).map((incident: any) => ({
    id: incident.id,
    location: incident.location || incident.summary || 'Unknown',
    status: incident.status || 'Open',
    summary: incident.summary || incident.description || 'No details provided',
    severity: incident.severity || 'Medium',
    reportedBy: incident.reportedBy,
  }));

  const patrols = (sectionData?.patrols ?? []).map((patrol: any) => ({
    route: patrol.route || 'Patrol route',
    lastCheck: patrol.scannedAt ? new Date(patrol.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : patrol.lastCheck || 'Unknown',
    status: patrol.status || 'Completed',
  }));

  const alerts = (sectionData?.alerts ?? []).map((alert: any) => ({
    message: alert.message || alert.summary || 'Security alert',
    level: alert.level || 'Warning',
    raised: alert.raised || (alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'),
  }));

  const renderCard = (label: string, value: React.ReactNode, icon: string) => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ color: G.lime, fontSize: 24, fontWeight: 900, marginTop: 8 }}>{icon} {value}</div>
    </div>
  );

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        {[
          { label: 'Visitors Logged', value: resolvedStats.visitorsLogged, icon: '📋' },
          { label: 'Today’s Incidents', value: resolvedStats.incidentsToday, icon: '⚠️' },
          { label: 'Patrols Completed', value: resolvedStats.patrols, icon: '🚶' },
          { label: 'Active Alerts', value: resolvedStats.alerts, icon: '🚨' },
        ].map((item, index) => (
          <React.Fragment key={index}>{renderCard(item.label, item.value, item.icon)}</React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.lime, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Recent Incidents</div>
          {incidents.length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11 }}>No incident reports available.</div>
          ) : incidents.map((incident: { id: string; location: string; summary: string; severity: string; status: string }) => (
            <div key={incident.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${G.cardBorder}` }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{incident.id} — {incident.location}</div>
              <div style={{ color: G.text, fontSize: 11, marginTop: 4 }}>{incident.summary}</div>
              <div style={{ color: G.muted, fontSize: 10, marginTop: 6 }}>{incident.severity} • {incident.status}</div>
            </div>
          ))}
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.lime, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Patrol Status</div>
          {patrols.length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11 }}>No patrol logs available.</div>
          ) : patrols.map((patrol: { route: string; lastCheck: string; status: string }) => (
            <div key={patrol.route} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${G.cardBorder}` }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{patrol.route}</div>
              <div style={{ color: G.text, fontSize: 11, marginTop: 4 }}>Last check: {patrol.lastCheck}</div>
              <div style={{ color: G.muted, fontSize: 10, marginTop: 6 }}>{patrol.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSectionHeading = (title: string) => (
    <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ color: G.lime, fontSize: 16, fontWeight: 800 }}>{title}</div>
      <div style={{ color: G.muted, fontSize: 11 }}>Updated now</div>
    </div>
  );

  const renderVisitors = () => (
    <div style={{ display: 'grid', gap: 14 }}>
      {renderSectionHeading('Visitor Logs')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {visitors.length === 0 ? (
          <div style={{ color: G.muted, fontSize: 11 }}>No visitor logs available.</div>
        ) : visitors.map((visitor: { name: string; purpose: string; location: string; scannedAt?: string }, index: number) => (
          <div key={`${visitor.name}-${index}`} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{visitor.name}</div>
            <div style={{ color: G.text, fontSize: 11, marginTop: 4 }}>{visitor.purpose}</div>
            <div style={{ color: G.muted, fontSize: 10, marginTop: 10 }}>{visitor.location}</div>
            <div style={{ color: G.muted, fontSize: 10, marginTop: 4 }}>Scanned at {visitor.scannedAt ? new Date(visitor.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div style={{ display: 'grid', gap: 14 }}>
      {renderSectionHeading('Incident Reports')}
      {incidents.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No incident reports available.</div>
      ) : incidents.map((incident: { id: string; location: string; status: string; summary: string; severity: string; reportedBy?: any }) => (
        <div key={incident.id} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>{incident.id}</div>
              <div style={{ color: G.text, fontSize: 11, marginTop: 4 }}>{incident.location}</div>
            </div>
            <div style={{ color: incident.status === 'Resolved' ? '#7dc142' : '#f59e0b', fontWeight: 700, fontSize: 11 }}>{incident.status}</div>
          </div>
          <div style={{ marginTop: 12, color: G.text, fontSize: 12 }}>{incident.summary}</div>
          <div style={{ marginTop: 10, color: G.muted, fontSize: 10 }}>Severity: {incident.severity}</div>
          {incident.reportedBy && (
            <div style={{ marginTop: 6, color: G.muted, fontSize: 10 }}>Reported by: {incident.reportedBy?.firstName ? `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}` : 'unknown'}</div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPatrols = () => (
    <div style={{ display: 'grid', gap: 14 }}>
      {renderSectionHeading('Patrol Logs')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {patrols.length === 0 ? (
          <div style={{ color: G.muted, fontSize: 11 }}>No patrol logs available.</div>
        ) : patrols.map((patrol: { route: string; lastCheck: string; status: string }) => (
          <div key={patrol.route} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{patrol.route}</div>
            <div style={{ color: G.text, fontSize: 11, marginTop: 6 }}>Last checked at {patrol.lastCheck}</div>
            <div style={{ color: G.muted, fontSize: 10, marginTop: 10 }}>{patrol.status}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div style={{ display: 'grid', gap: 14 }}>
      {renderSectionHeading('Security Alerts')}
      {alerts.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No security alerts available.</div>
      ) : alerts.map((alert: { message: string; level: string; raised: string }, index: number) => (
        <div key={`${alert.message}-${index}`} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{alert.message}</div>
          <div style={{ color: G.muted, fontSize: 10, marginTop: 8 }}>Level: {alert.level}</div>
          <div style={{ color: G.text, fontSize: 11, marginTop: 6 }}>Raised {alert.raised}</div>
        </div>
      ))}
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    visitors: renderVisitors,
    incidents: renderIncidents,
    patrols: renderPatrols,
    alerts: renderAlerts,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{renderer()}</div>;
};

export default SecurityDashboard;
