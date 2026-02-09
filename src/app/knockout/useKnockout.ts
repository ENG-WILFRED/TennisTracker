"use client";
import { useEffect, useState } from "react";
import {
  getAllPlayers,
  getGroupStandings,
  getCurrentPoolsAndMatches,
  savePoolWinner,
  createSemifinalsFromGroups,
  createFinalsFromSemis,
  getKnockoutMatches,
} from "@/actions/matches";

const SCORE_STEPS = [15, 30, 40, 45];

export default function useKnockout() {
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>({});
  const [scores, setScores] = useState<{ [matchId: string]: { a: number; b: number } }>({});
  const [tiebreaks, setTiebreaks] = useState<{ [matchId: string]: { a: boolean[]; b: boolean[] } }>({});
  const [winners, setWinners] = useState<{ [matchId: string]: "a" | "b" | null }>({});
  const [stage, setStage] = useState<"group" | "semis" | "finals" | "done">("group");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllPlayers(), getCurrentPoolsAndMatches(), getGroupStandings()])
      .then(([playersData, matchesData, standingsData]) => {
        setPlayers(playersData);
        setMatches(matchesData);
        setStandings(standingsData);
        setStage(matchesData.length && matchesData[0].pool ? "group" : "semis");
        setLoading(false);
      });
  }, []);

  function handlePointCheckbox(matchId: string, who: "a" | "b", point: number, checked: boolean) {
    setScores((prev) => {
      const prevScore = prev[matchId] || { a: 0, b: 0 };
      let newScore = { ...prevScore };
      if (checked) {
        if (newScore[who] < point) newScore[who] = point;
      } else {
        if (newScore[who] >= point) newScore[who] = SCORE_STEPS.filter(s => s < point).pop() || 0;
      }
      return { ...prev, [matchId]: newScore };
    });
    if (point === 40 && !checked) {
      setTiebreaks((prev) => ({ ...prev, [matchId]: { a: [false, false, false], b: [false, false, false] } }));
    }
  }

  function handleTiebreakCheckbox(matchId: string, who: "a" | "b", idx: number, checked: boolean) {
    setTiebreaks((prev) => {
      const prevTB = prev[matchId] || { a: [false, false, false], b: [false, false, false] };
      const newTB = {
        a: [...prevTB.a],
        b: [...prevTB.b],
      };
      newTB[who][idx] = checked;
      if (checked) {
        newTB[who === "a" ? "b" : "a"][idx] = false;
      }
      return { ...prev, [matchId]: newTB };
    });
  }

  async function handleConfirmWinner(matchId: string, winner: "a" | "b", aId: string, bId: string) {
    const winnerId = winner === "a" ? aId : bId;
    await savePoolWinner(matchId, winnerId);
    setWinners((prev) => ({ ...prev, [matchId]: winner }));
    setToast({ type: "success", message: "Winner saved!" });
    setTimeout(() => setToast(null), 1200);
    const [matchesData, standingsData] = await Promise.all([
      getCurrentPoolsAndMatches(),
      getGroupStandings(),
    ]);
    setMatches(matchesData);
    setStandings(standingsData);
  }

  const allGroupMatchesHaveWinner = matches.length > 0 && matches.every(m => m.winnerId);

  async function handleProceedToSemis() {
    setToast({ type: "info", message: "Creating semifinals..." });
    await createSemifinalsFromGroups();
    setStage("semis");
    setToast({ type: "success", message: "Semifinals created!" });
    setTimeout(() => setToast(null), 1200);
    const knockoutMatches = await getKnockoutMatches();
    setMatches(knockoutMatches);
  }

  async function handleProceedToFinals() {
    setToast({ type: "info", message: "Creating finals..." });
    await createFinalsFromSemis();
    setStage("finals");
    setToast({ type: "success", message: "Finals created!" });
    setTimeout(() => setToast(null), 1200);
    const knockoutMatches = await getKnockoutMatches();
    setMatches(knockoutMatches);
  }

  return {
    players,
    matches,
    standings,
    scores,
    tiebreaks,
    winners,
    stage,
    loading,
    toast,
    handlePointCheckbox,
    handleTiebreakCheckbox,
    handleConfirmWinner,
    handleProceedToSemis,
    handleProceedToFinals,
    allGroupMatchesHaveWinner,
  } as const;
}
