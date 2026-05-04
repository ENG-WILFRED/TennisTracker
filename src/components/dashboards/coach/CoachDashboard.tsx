'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { CoachSidebar } from './CoachSidebar';
import CoachDashboardContent from './CoachDashboardContent';
import { ProfileTab } from './CoachProfileSection';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';

export function CoachDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams() as { userId?: string } | undefined;

  const coachIdFromURL = params?.userId || '';
  const coachId = user?.id || coachIdFromURL;

  const [players, setPlayers] = useState<any[]>([]);
  const [coachData, setCoachData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>({ thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 });
  const [stats, setStats] = useState<any>({ studentCount: 0, rating: 0, totalSessions: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [personalForm, setPersonalForm] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    bio: '',
    photo: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingCertificate, setSavingCertificate] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [deletingCertificateIds, setDeletingCertificateIds] = useState<string[]>([]);
  const [deletingAvailabilityIds, setDeletingAvailabilityIds] = useState<string[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [bioForm, setBioForm] = useState('');
  const [editingCertificates, setEditingCertificates] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', issuer: '', issuedAt: '', expiresAt: '' });
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [availForm, setAvailForm] = useState({ day: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [availability, setAvailability] = useState<any[]>([]);

  const activeNav = (searchParams.get('section') as string) || 'Dashboard';
  const profileTab = (searchParams.get('tab') as ProfileTab) || 'personal';

  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    if (section !== 'My Profile') {
      params.delete('tab');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    let isMounted = true;
    let dataFetched = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    const fetchWithRetry = async (attempt: number = 0): Promise<void> => {
      try {
        if (!coachId) {
          console.log('[CoachDashboard] Skipping fetch - no coachId');
          if (isMounted) setLoading(false);
          return;
        }

        // Check network connectivity
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[CoachDashboard] No network connection');
          if (isMounted) {
            setLoadError('No internet connection. Please check your network and try again.');
            setLoading(false);
          }
          return;
        }

        const res = await authenticatedFetch(`/api/dashboard/role?role=coach&userId=${coachId}`);
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data.coach) {
            const profile = {
              firstName: data.coach.firstName || '',
              lastName: data.coach.lastName || '',
              email: data.coach.email || '',
              phone: data.coach.phone || '',
              gender: data.coach.gender || '',
              dateOfBirth: data.coach.dateOfBirth ? new Date(data.coach.dateOfBirth).toISOString().split('T')[0] : '',
              nationality: data.coach.nationality || '',
              bio: data.coach.bio || '',
              photo: data.coach.photo || '',
            };
            setProfileData(profile);
            setPersonalForm(profile);
          }

          dataFetched = true;
          setDashboardData(data);
          setCoachData(data.coach);
          setAvailability(data.coach?.availability || []);
          setPlayers(data.students || []);
          setEarnings(data.earnings || { thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 });
          setStats(data.stats || { studentCount: 0, rating: 0, totalSessions: 0 });
          setActivities(data.activities || []);
          if (isMounted) {
            setLoading(false);
            setLoadError(null);
          }
          if (timeoutId) clearTimeout(timeoutId);
        } else {
          throw new Error(`API returned status ${res.status}`);
        }
      } catch (error) {
        console.error(`[CoachDashboard] Fetch attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : String(error));

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`[CoachDashboard] Retrying in ${delay}ms...`);
          setTimeout(() => {
            if (isMounted) fetchWithRetry(attempt + 1);
          }, delay);
        } else {
          // All retries failed
          if (isMounted) {
            setLoadError('Failed to load dashboard data. Please refresh the page or try again later.');
            setLoading(false);
          }
        }
      }
    };

    // Set timeout with increased duration and better error message
    timeoutId = setTimeout(() => {
      if (isMounted && !dataFetched) {
        console.error('[CoachDashboard] Timeout: Dashboard data not fetched after 30 seconds');
        setLoadError('Loading is taking longer than expected. Please check your connection and try refreshing.');
        setLoading(false);
      }
    }, 30000); // Increased to 30 seconds

    if (coachId) {
      fetchWithRetry();
    } else {
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [coachId, user?.id]);

  const handleMessageClick = (personId: string, personName: string) => {
    router.push(chatUrlForUser(personId, personName));
  };

  const handleNearbyPlayerChallenge = async (personId: string, personName: string) => {
    if (!user?.id) {
      setStatusMessage('Please sign in to send a challenge.');
      return;
    }
    try {
      await sendChallengeRequest(user.id, personId);
      setStatusMessage(`Challenge request sent to ${personName}.`);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to send challenge request.');
    }
  };

  const handleProfileTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'My Profile');
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, ...personalForm }),
      });
      if (res.ok) {
        const result = await res.json().catch(() => null);
        const updatedProfile = result?.profile ? { ...profileData, ...result.profile } : personalForm;
        setProfileData(updatedProfile);
        setPersonalForm(updatedProfile);
        setEditingProfile(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, bio: bioForm }),
      });
      if (res.ok) {
        const result = await res.json().catch(() => null);
        const updatedBio = result?.profile?.bio ?? bioForm;
        setCoachData({ ...coachData, bio: updatedBio });
        setProfileData((prev: any) => ({ ...(prev || {}), bio: updatedBio }));
        setEditingBio(false);
      }
    } catch (error) {
      console.error('Error updating bio:', error);
    } finally {
      setSavingBio(false);
    }
  };

  const handleAddCertificate = async () => {
    if (!certForm.name || !certForm.issuer || !certForm.issuedAt) {
      setStatusMessage('Please fill in required fields (name, issuer, issued date)');
      return;
    }
    setSavingCertificate(true);
    try {
      const res = await authenticatedFetch(`/api/user/certificates/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certForm),
      });
      if (res.ok) {
        const newCert = await res.json();
        setCoachData({ ...coachData, certifications: [...(coachData?.certifications || []), newCert] });
        setCertForm({ name: '', issuer: '', issuedAt: '', expiresAt: '' });
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
    } finally {
      setSavingCertificate(false);
    }
  };

  const handleDeleteCertificate = async (certId: string, index: number) => {
    setDeletingCertificateIds(prev => [...prev, certId]);
    try {
      const res = await authenticatedFetch(`/api/user/certificates/${user?.id}/${certId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = (coachData?.certifications || []).filter((cert: any, i: number) => i !== index);
        setCoachData({ ...coachData, certifications: updated });
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
    } finally {
      setDeletingCertificateIds(prev => prev.filter(id => id !== certId));
    }
  };

  const handleAddAvailability = async () => {
    if (!availForm.day || !availForm.startTime || !availForm.endTime) {
      setStatusMessage('Please fill in all fields');
      return;
    }
    setSavingAvailability(true);
    try {
      const res = await authenticatedFetch(`/api/user/availability/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availForm),
      });
      if (res.ok) {
        const newAvail = await res.json();
        setAvailability([...availability, newAvail]);
        setCoachData({ ...coachData, availability: [...(coachData?.availability || []), newAvail] });
        setAvailForm({ day: 'Monday', startTime: '09:00', endTime: '17:00' });
      }
    } catch (error) {
      console.error('Error adding availability:', error);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleDeleteAvailability = async (availId: string, index: number) => {
    setDeletingAvailabilityIds(prev => [...prev, availId]);
    try {
      const res = await authenticatedFetch(`/api/user/availability/${user?.id}/${availId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = availability.filter((avail: any, i: number) => i !== index);
        setAvailability(updated);
        setCoachData({ ...coachData, availability: updated });
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
    } finally {
      setDeletingAvailabilityIds(prev => prev.filter(id => id !== availId));
    }
  };

  const handleLogout = async () => {
    try {
      await authenticatedFetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1e0f', color: '#e4f2da' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🎾</div>
          <p className="text-xl font-semibold text-white mb-2">Loading coach dashboard...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setLoadError(null);
              setLoading(true);
              setDashboardData(null);
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profileSectionProps = {
    user,
    profileTab,
    editingProfile,
    setEditingProfile,
    profileData,
    personalForm,
    setPersonalForm,
    savingProfile,
    handleSaveProfile,
    editingBio,
    setEditingBio,
    bioForm,
    setBioForm,
    savingBio,
    handleSaveBio,
    coachData,
    editingCertificates,
    setEditingCertificates,
    certForm,
    setCertForm,
    handleAddCertificate,
    savingCertificate,
    deletingCertificateIds,
    handleDeleteCertificate,
    editingAvailability,
    setEditingAvailability,
    availForm,
    setAvailForm,
    handleAddAvailability,
    savingAvailability,
    deletingAvailabilityIds,
    handleDeleteAvailability,
    availability,
    loading,
    handleProfileTab,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#0f1e0f', color: '#e4f2da', height: '100vh', overflow: 'hidden', fontSize: 13 }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <CoachSidebar
        user={user}
        activeNav={activeNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleNavigation={handleNavigation}
        handleLogout={handleLogout}
      />
      <CoachDashboardContent
        activeNav={activeNav}
        statusMessage={statusMessage}
        dashboardData={dashboardData}
        earnings={earnings}
        players={players}
        stats={stats}
        activities={activities}
        user={user}
        coachId={coachId}
        handleNavigation={handleNavigation}
        handleMessageClick={handleMessageClick}
        handleNearbyPlayerChallenge={handleNearbyPlayerChallenge}
        openSidebar={() => setSidebarOpen(true)}
        profileSectionProps={profileSectionProps}
        loading={loading}
        loadError={loadError}
      />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }`}</style>
    </div>
  );
}
