"use client";
import React from "react";
import Button from "@/components/Button";
import { useAuth } from '@/context/AuthContext';
import { sendChallengeRequest } from '@/lib/nearby';

export default function ChallengeButton({ playerId }: { playerId: string }) {
  const { user } = useAuth();

  async function handleChallenge() {
    if (!user?.id) {
      alert('Please login to send a challenge.');
      return;
    }
    if (!confirm("Send challenge request to this player?")) return;
    try {
      await sendChallengeRequest(user.id, playerId);
      alert("Challenge request sent successfully.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to send challenge.");
    }
  }

  return (
    <Button onClick={handleChallenge} className="bg-green-600 hover:bg-green-700">
      Challenge
    </Button>
  );
}
