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
import ExtrasPanel from '@/components/ExtrasPanel';
import EditProfileModal from "./components/EditProfileModal";
import Button from '@/components/Button';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const playerId = typeof window !== "undefined" ? localStorage.getItem("playerId") : null;
  const router = useRouter();

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    getPlayerDashboard(playerId)
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold text-green-800">Player Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/matches')}>Match Making</Button>
            <Button variant="outline" onClick={() => router.push('/leaderboard')}>Leaderboard</Button>
          </div>
        </div>

        <nav className="flex gap-3 overflow-x-auto mb-6">
          <Button className="px-4 py-2 rounded-full bg-green-600 text-white font-semibold">Overview</Button>
          <Button onClick={() => router.push('/matches')} className="px-4 py-2 rounded-full bg-white text-green-700 border border-green-200">Matches</Button>
          <Button className="px-4 py-2 rounded-full bg-white text-green-700 border border-green-200">Stats</Button>
          <Button onClick={openEditModal} className="px-4 py-2 rounded-full bg-white text-green-700 border border-green-200">Edit Profile</Button>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ProfileCard player={player} rank={rank} badges={badges} onEdit={openEditModal} toast={toast} />
            <div className="mt-6">
              <InventoryPanel inventory={dashboard.inventory || []} />
            </div>
            <div className="mt-6">
              <ExtrasPanel />
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