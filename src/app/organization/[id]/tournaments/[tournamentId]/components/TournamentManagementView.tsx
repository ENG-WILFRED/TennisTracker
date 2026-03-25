"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TournamentHeader } from './TournamentHeader';
import { TabNavigation } from './TabNavigation';
import { TournamentOverviewSection } from './TournamentOverviewSection';
import { TournamentRegistrationsSection } from './TournamentRegistrationsSection';
import { TournamentScheduleSection } from './TournamentScheduleSection';
import { TournamentAnalyticsSection } from './TournamentAnalyticsSection';
import { TournamentAnnouncementsSection } from './TournamentAnnouncementsSection';
import { TournamentRulesSection } from './TournamentRulesSection';
import { TournamentFacilitiesSection } from './TournamentFacilitiesSection';
import { TournamentSettingsSection } from './TournamentSettingsSection';

interface TournamentManagementViewProps {
  tournament: any;
  leaderboard: any[];
  activeTab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements';
  setActiveTab: (tab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements') => void;
  pendingRegistrations: any[];
  approvedRegistrations: any[];
  onRegistrationAction: (registrationId: string, action: 'approve' | 'reject') => void;
  managementLoading: boolean;
  fetchTournamentData: () => void;
  onSaveTournament: (updates: any) => Promise<void>;
  updateLoading: boolean;
  orgId: string;
}

export function TournamentManagementView({
  tournament,
  leaderboard,
  activeTab,
  setActiveTab,
  pendingRegistrations,
  approvedRegistrations,
  onRegistrationAction,
  managementLoading,
  fetchTournamentData,
  orgId,
  onSaveTournament,
  updateLoading,
}: TournamentManagementViewProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        
        * { box-sizing: border-box; }
        
        body, html {
          margin: 0;
          padding: 0;
        }
        
        .tmv-root {
          min-height: 100vh;
          background: #0a160a;
          color: #dff0d0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 28px 32px;
          position: relative;
          overflow-x: hidden;
        }
        
        .tmv-root::before {
          content: '';
          position: fixed;
          top: -200px;
          left: 40%;
          width: 700px;
          height: 700px;
          background: radial-gradient(ellipse, rgba(125,193,66,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        
        .tmv-content {
          position: relative;
          z-index: 1;
          width: 100%;
        }
        
        @media (max-width: 640px) {
          .tmv-root { padding: 16px; }
        }
      `}</style>

      <div className="tmv-root">
        <div className="tmv-content">
          <TournamentHeader
            tournament={tournament}
            approvedRegistrations={approvedRegistrations}
            orgId={orgId}
            pendingRegistrations={pendingRegistrations}
          />

          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingRegistrations={pendingRegistrations}
          />

          {activeTab === 'overview' && (
            <TournamentOverviewSection
              tournament={tournament}
              leaderboard={leaderboard}
              pendingRegistrations={pendingRegistrations}
              approvedRegistrations={approvedRegistrations}
              announcements={[]}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'registrations' && (
            <TournamentRegistrationsSection
              tournament={tournament}
              pendingRegistrations={pendingRegistrations}
              approvedRegistrations={approvedRegistrations}
              onRegistrationAction={onRegistrationAction}
              managementLoading={managementLoading}
            />
          )}

          {activeTab === 'schedule' && (
            <TournamentScheduleSection tournament={tournament} />
          )}

          {activeTab === 'analytics' && (
            <TournamentAnalyticsSection
              tournament={tournament}
              leaderboard={leaderboard}
              approvedRegistrations={approvedRegistrations}
            />
          )}

          {activeTab === 'announcements' && (
            <TournamentAnnouncementsSection tournament={tournament} />
          )}

          {activeTab === 'rules' && (
            <TournamentRulesSection
              tournament={tournament}
              fetchTournamentData={fetchTournamentData}
              onSaveTournament={onSaveTournament}
            />
          )}

          {activeTab === 'facilities' && (
            <TournamentFacilitiesSection orgId={orgId} tournament={tournament} />
          )}

          {activeTab === 'settings' && (
            <TournamentSettingsSection
              tournament={tournament}
              onSaveTournament={onSaveTournament}
              updateLoading={updateLoading}
            />
          )}
        </div>
      </div>
    </>
  );
}
