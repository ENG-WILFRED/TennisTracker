"use client";

import { useEffect, useState, use, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTournamentDetails, getTournamentLeaderboard } from '@/actions/tournaments';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import React from 'react';

import { TournamentManagementView } from './components';

/* ─────────────────────────────────────────
   INLINE STYLES
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   MAIN PAGE - ORGANIZATION TOURNAMENT MANAGEMENT
───────────────────────────────────────── */
export default function OrganizationTournamentManagementPage({
  params
}: {
  params: Promise<{ id: string; tournamentId: string }>
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements'>('overview');
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState<any[]>([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Unwrap params Promise (Next.js 15)
  const resolvedParams = use(params);
  const orgId = resolvedParams.id;
  const tournamentId = resolvedParams.tournamentId;

  const fetchTournamentData = async () => {
    if (!tournamentId || !orgId) {
      setLoading(false);
      return;
    }

    try {
      const [tournamentData, leaderboardData] = await Promise.all([
        getTournamentDetails(tournamentId),
        getTournamentLeaderboard(tournamentId)
      ]);

      if (tournamentData) {
        setTournament(tournamentData);

        // Verify this tournament belongs to the organization
        if (tournamentData.organization?.id !== orgId) {
          router.push('/dashboard/organization/' + orgId);
          return;
        }

        // Process management data from the fetched tournament
        if (tournamentData?.registrations) {
          setPendingRegistrations(
            tournamentData.registrations.filter((r: any) => r.status === 'pending')
          );
          setApprovedRegistrations(
            tournamentData.registrations.filter((r: any) => r.status === 'approved')
          );
        }
      }

      if (leaderboardData) {
        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationAction = async (registrationId: string, action: 'approve' | 'reject') => {
    try {
      setManagementLoading(true);
      const res = await authenticatedFetch(`/api/tournaments/${tournamentId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Refetch tournament to update registrations
        await fetchTournamentData();
      }
    } catch (error) {
      console.error('Error updating registration:', error);
    } finally {
      setManagementLoading(false);
    }
  };

  const handleSaveTournament = async (updates: any) => {
    setUpdateLoading(true);
    try {
      const response = await authenticatedFetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to save tournament');
      }

      await fetchTournamentData();
    } catch (error) {
      console.error('Error saving tournament:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId, orgId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f1f0f',
        color: '#e8f5e0'
      }}>
        Loading tournament...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f1f0f',
        color: '#e8f5e0'
      }}>
        Tournament not found
      </div>
    );
  }

  return (
    <TournamentManagementView
      tournament={tournament}
      leaderboard={leaderboard}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pendingRegistrations={pendingRegistrations}
      approvedRegistrations={approvedRegistrations}
      onRegistrationAction={handleRegistrationAction}
      managementLoading={managementLoading}
      fetchTournamentData={fetchTournamentData}
      onSaveTournament={handleSaveTournament}
      updateLoading={updateLoading}
      orgId={orgId}
    />
  );
}
