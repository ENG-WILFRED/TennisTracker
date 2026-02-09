"use client";
import { useState } from "react";
import React from "react";
import Link from "next/link";
import Button from '@/components/Button';
import { registerPlayer } from "@/actions/auth";
import { User, Mail, Lock, Phone, Calendar, Globe, FileText, UserCircle } from 'lucide-react';

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

  const InputField = ({ 
    icon: Icon, 
    label, 
    name, 
    type = "text", 
    required = false,
    placeholder = ""
  }: { 
    icon: any; 
    label: string; 
    name: string; 
    type?: string; 
    required?: boolean;
    placeholder?: string;
  }) => (
    <div className="group">
      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-600" />
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={form[name as keyof typeof form]}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none hover:border-slate-300"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50/30 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <img
                src="/tennis.jpeg"
                alt="Tennis Ball"
                className="relative w-28 h-28 rounded-2xl object-cover shadow-lg border-4 border-white group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Title Section */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Join Pwani University Tennis
              </h1>
              <p className="text-slate-600 text-lg">
                Create your account and start tracking your matches
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Free to join
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Track performance
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Connect with players
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Account Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Account Credentials</h2>
                  <p className="text-sm text-slate-500">Your login information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField icon={User} label="Username" name="username" required placeholder="Choose a username" />
                <InputField icon={Mail} label="Email" name="email" type="email" required placeholder="your.email@example.com" />
                <InputField icon={Lock} label="Password" name="password" type="password" required placeholder="Min. 8 characters" />
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Details</h2>
                  <p className="text-sm text-slate-500">Tell us about yourself</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <InputField icon={User} label="First Name" name="firstName" required placeholder="John" />
                <InputField icon={User} label="Last Name" name="lastName" required placeholder="Doe" />
                <InputField icon={Phone} label="Phone Number" name="phone" placeholder="+254 700 000000" />
                
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-emerald-600" />
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none hover:border-slate-300 bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <InputField icon={Calendar} label="Date of Birth" name="dateOfBirth" type="date" />
                <InputField icon={Globe} label="Nationality" name="nationality" placeholder="e.g., Kenyan" />
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">About You</h2>
                  <p className="text-sm text-slate-500">Share your tennis journey</p>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about your tennis experience, playing style, and goals..."
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-700 transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none hover:border-slate-300 resize-y"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 space-y-3">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-slate-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                    Login here
                  </Link>
                </p>
              </div>
              
              {/* Messages */}
              {success && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-800 font-semibold">Registration successful! 🎾</p>
                      <p className="text-emerald-600 text-sm">Welcome to the Pwani University Tennis community</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-rose-800 font-semibold">Registration failed</p>
                      <p className="text-rose-600 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Pwani University Tennis Club. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}