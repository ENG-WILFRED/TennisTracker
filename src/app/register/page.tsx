"use client";
import { useState } from "react";
import { registerPlayer } from "@/actions/auth";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    bio: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await registerPlayer(form);
      setSuccess(true);
      setForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        nationality: "",
        bio: "",
        phone: "",
      });
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 flex flex-col items-center justify-center py-8">
      <div className="bg-white/95 rounded-2xl shadow-lg p-8 w-full max-w-3xl">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/tennis.jpeg"
            alt="Tennis Ball"
            className={`w-36 h-36 rounded-full object-cover transition-all duration-300 cursor-pointer ${isHovered ? 'scale-110 rotate-3 shadow-2xl' : 'scale-100 shadow-md'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
          <h1 className="text-2xl font-extrabold text-green-800 mt-3">Pwani University Tennis</h1>
          <p className="text-gray-500 text-center">Register to join the match tracker!</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-6 mb-6 justify-between">
            {/** left/right responsive inputs use flex-basis */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Username</label>
              <input name="username" value={form.username} onChange={handleChange} required className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2">
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Date of Birth</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-700 font-medium mb-2">Nationality</label>
              <input name="nationality" value={form.nationality} onChange={handleChange} className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-slate-700 font-medium mb-2">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={2} className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2 resize-y" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white font-bold px-4 py-3 rounded-md mb-2 disabled:opacity-60">{loading ? 'Registering...' : 'Register'}</button>
          {success && <div className="text-emerald-700 text-center font-semibold mt-2">Registration successful! 🎾</div>}
          {error && <div className="text-red-600 text-center font-semibold mt-2">{error}</div>}
        </form>
      </div>
      <footer className="mt-8 text-gray-500 text-sm">&copy; {new Date().getFullYear()} Pwani University Tennis Club</footer>
    </div>
  );
}