"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import Link from "next/link";

export default function PlayerActionButtons({ playerId }: { playerId: string }) {
  const { isLoggedIn } = useAuth();

  async function handleChallenge() {
    if (!confirm("Send challenge request to this player?")) return;
    try {
      // TODO: replace with real API call
      alert("Challenge request sent (placeholder)");
    } catch (err) {
      console.error(err);
      alert("Failed to send challenge.");
    }
  }

  return (
    <div className="flex gap-3 mt-4 sm:mt-0">
      {isLoggedIn ? (
        <Button onClick={handleChallenge} className="bg-green-600 hover:bg-green-700">
          Challenge
        </Button>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Login to Challenge
        </Link>
      )}
      <Link
        href={`/matches?player=${playerId}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        View Matches
      </Link>
    </div>
  );
}
