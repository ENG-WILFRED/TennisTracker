"use client";
import { useState } from "react";
import { loginPlayer } from "@/actions/auth";

export default function LoginPage() {
    const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setToast(null);
        try {
            const user = await loginPlayer(form);
            setToast({ type: "success", message: "Login successful! 🎾" });
            // Save playerId and redirect to dashboard
            if (user && user.id) {
                localStorage.setItem("playerId", user.id);
                window.location.href = "/dashboard";
            }
        } catch (err: any) {
            setToast({ type: "error", message: err.message || "Login failed." });
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 flex flex-col items-center justify-center py-8">
            <div className="bg-white/95 rounded-2xl shadow-lg p-8 w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <img
                        src="/tennis.jpeg"
                        alt="Tennis Ball"
                        className={`w-36 h-36 rounded-full object-cover transition-all duration-300 cursor-pointer ${isHovered ? 'scale-110 rotate-3 shadow-2xl' : 'scale-100 shadow-md'}`}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    />
                    <h1 className="text-2xl font-extrabold text-green-800 mt-3 text-center">Pwani University Tennis Login</h1>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-slate-700 font-medium mb-2">Username or Email</label>
                        <input
                            name="usernameOrEmail"
                            value={form.usernameOrEmail}
                            onChange={handleChange}
                            required
                            className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2"
                            autoComplete="username"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-slate-700 font-medium mb-2">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full border border-emerald-200 rounded-md px-3 py-2 mb-2"
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white font-bold px-4 py-3 rounded-md mb-2 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading && <span className="w-5 h-5 border-2 border-white border-t-emerald-300 rounded-full animate-spin inline-block" />}
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {toast && (
                    <div className={`mt-4 rounded-md px-4 py-3 font-semibold text-center ${toast.type === 'success' ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-red-700 bg-red-100 border border-red-300'}`}>
                        {toast.message}
                    </div>
                )}
            </div>
            <footer className="mt-8 text-gray-500 text-sm">&copy; {new Date().getFullYear()} Pwani University Tennis Club</footer>
        </div>
    );
}