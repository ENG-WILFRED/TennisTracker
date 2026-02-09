"use client";
import React from "react";
import Button from "@/components/Button";

export default function ChallengeButton({ playerId }: { playerId: string }) {
  async function handleChallenge() {
    if (!confirm("Send challenge request to this player?")) return;
    // Placeholder behavior: integrate with backend action when available.
    try {
      // TODO: replace with real API call
      alert("Challenge request sent (placeholder)");
    } catch (err) {
      console.error(err);
      alert("Failed to send challenge.");
    }
  }

  return (
    <Button onClick={handleChallenge} className="bg-green-600 hover:bg-green-700">
      Challenge
    </Button>
  );
}
