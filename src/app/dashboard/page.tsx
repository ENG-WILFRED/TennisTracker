"use client";
import { useEffect, useState } from "react";
import { getPlayerDashboard, updatePlayerProfile } from "@/actions/matches";
import { useRouter } from "next/navigation";
import ProfileCard from "./components/ProfileCard";
import Stats from "./components/Stats";
import UpcomingMatches from "./components/UpcomingMatches";
import AttendanceChart from "./components/AttendanceChart";
import InventoryPanel from "./components/InventoryPanel";
import CoachesPanel from "./components/CoachesPanel";
import EditProfileModal from "./components/EditProfileModal";
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem("playerId");
    setPlayerId(id);
  }, []);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getPlayerDashboard(playerId)
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Player not found. Please log in again.");
        setLoading(false);
        // Clear invalid playerId from localStorage
        localStorage.removeItem("playerId");
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      });
  }, [playerId, router]);

  function openEditModal() {
    if (!dashboard) return;
    let dateOfBirth = "";
    if (dashboard.player.dateOfBirth) {
      if (typeof dashboard.player.dateOfBirth === "string") {
        dateOfBirth = dashboard.player.dateOfBirth.slice(0, 10);
      } else if (dashboard.player.dateOfBirth instanceof Date) {
        dateOfBirth = dashboard.player.dateOfBirth.toISOString().slice(0, 10);
      }
    }
    setEditForm({
      firstName: dashboard.player.firstName,
      lastName: dashboard.player.lastName,
      email: dashboard.player.email,
      phone: dashboard.player.phone || "",
      gender: dashboard.player.gender || "",
      dateOfBirth,
      nationality: dashboard.player.nationality || "",
      bio: dashboard.player.bio || "",
      photo: dashboard.player.photo || "",
    });
    setShowModal(true);
    setToast(null);
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      if (!playerId) throw new Error("Player ID is missing");
      await updatePlayerProfile(playerId, editForm);
      setShowModal(false);
      setToast("Profile updated!");
      const data = await getPlayerDashboard(playerId);
      setDashboard(data);
    } catch (err: any) {
      setToast("Failed to update profile.");
    }
    setSaving(false);
  }

  if (!playerId) {
    return (
      <div className="p-8 text-center text-red-600">Please log in to view your dashboard.</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex flex-col items-center gap-4">
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-red-600 font-semibold text-lg">{error}</div>
          <p className="text-gray-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-4 border-t-green-200 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-8 text-center text-red-600">Could not load dashboard.</div>;
  }

  const { player, rank, badges, upcomingMatches } = dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-full flex-1">
        <PageHeader
          title="Player Dashboard"
          navItems={[
            { label: 'Overview', active: true },
            { label: 'players', onClick: () => router.push('/players') },
            { label: 'Matches', onClick: () => router.push('/matches') },
            { label: 'Edit Profile', onClick: openEditModal },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 auto-rows-max lg:auto-rows-fr">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ProfileCard player={player} rank={rank} badges={badges} onEdit={openEditModal} toast={toast} />
            <div className="flex-1">
              <InventoryPanel inventory={dashboard.inventory || []} />
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Stats player={player} />
            <AttendanceChart attendance={dashboard.attendance || []} />
            <UpcomingMatches upcomingMatches={upcomingMatches} />
          </div>
          <div className="lg:col-span-1">
            <CoachesPanel coaches={dashboard.coaches || []} />
          </div>
        </div>
      </div>
      <EditProfileModal show={showModal} editForm={editForm} onChange={handleEditChange} onClose={() => setShowModal(false)} onSubmit={handleEditSubmit} saving={saving} />
      <footer className="mt-8 text-gray-500 text-sm text-center">&copy; {new Date().getFullYear()} Pwani University Tennis Club</footer>
    </div>
  );
}