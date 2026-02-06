"use client";
import { useEffect, useState } from "react";
import { getPlayerDashboard, updatePlayerProfile } from "@/actions/matches";
import { useRouter } from "next/navigation";
import ProfileCard from "./components/ProfileCard";
import Stats from "./components/Stats";
import UpcomingMatches from "./components/UpcomingMatches";
import EditProfileModal from "./components/EditProfileModal";

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
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-center">
      <div className="w-full max-w-5xl px-4">
        <div className="flex justify-end mb-6">
          <button onClick={() => router.push('/matches')} className="bg-green-500 text-white font-bold px-6 py-2 rounded-md">Go to Match Making</button>
        </div>
        <h1 className="text-3xl font-extrabold text-green-800 text-center mb-6">Player Dashboard</h1>
        <ProfileCard player={player} rank={rank} badges={badges} onEdit={openEditModal} toast={toast} />
        <Stats player={player} />
        <UpcomingMatches upcomingMatches={upcomingMatches} />
      </div>
      <EditProfileModal show={showModal} editForm={editForm} onChange={handleEditChange} onClose={() => setShowModal(false)} onSubmit={handleEditSubmit} saving={saving} />
      <footer className="mt-8 text-gray-500 text-sm">&copy; {new Date().getFullYear()} Pwani University Tennis Club</footer>
    </div>
  );
}