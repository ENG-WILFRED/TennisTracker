"use client";

import React, { useEffect, useState } from "react";
import { GAME_SCORES } from "./constants";

export function ScoreBoard() {
  const [p1pts, setP1pts] = useState("30");
  const [p2pts, setP2pts] = useState("15");
  const [scoreIdx, setScoreIdx] = useState(3);

  useEffect(() => {
    const si = setInterval(() => {
      setScoreIdx((i) => {
        const ni = (i + 1) % GAME_SCORES.length;
        const s = GAME_SCORES[ni];
        if (s.includes("-") && !s.includes("ADV")) {
          const [a, b] = s.split("-");
          setP1pts(a);
          setP2pts(b);
        } else {
          setP1pts(s === "GAME" ? "WIN" : s);
          setP2pts(s === "GAME" ? "" : "");
        }
        return ni;
      });
    }, 2200);
    return () => clearInterval(si);
  }, []);

  return (
    <div className="bg-[#0a1408] border border-[#2d5a35]/50 rounded-2xl p-7 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1e3a20]/50">
        <span className="text-[0.68rem] text-[#7aaa6a] tracking-[1px]">🏆 Nairobi Open 2026</span>
        <span className="text-[0.68rem] text-[#a8d84e] font-mono">QF · COURT 1</span>
      </div>

      {[
        {
          flag: "🇰🇪",
          name: "N. OMONDI",
          rank: "#12 KEN",
          sets: [
            { v: "6", hi: true },
            { v: "4" },
            { v: "3", live: true },
          ],
        },
        {
          flag: "🇺🇬",
          name: "J. KAMAU",
          rank: "#8 UGA",
          sets: [
            { v: "3" },
            { v: "6", hi: true },
            { v: "2", live: true },
          ],
        },
      ].map((p, i) => (
        <div key={i} className={`flex items-center justify-between py-3.5 ${i > 0 ? "border-t border-[#1e3a20]/30" : ""}`}>
          <div className="flex items-center gap-3 font-semibold text-sm text-[#e8f5e0]">
            <span className="text-xl">{p.flag}</span>
            <div>
              <div>{p.name}</div>
              <div className="text-[0.65rem] text-[#7aaa6a] font-mono">{p.rank}</div>
            </div>
          </div>
          <div className="flex gap-4">
            {p.sets.map((s, j) => (
              <span
                key={j}
                className={`font-bold text-[1.7rem] min-w-[18px] text-center transition-all duration-300 ${
                  s.live ? "text-yellow-400" : s.hi ? "text-[#a8d84e]" : "text-[#7aaa6a]"
                }`}
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                {s.v}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 px-5 py-4 bg-[#a8d84e]/5 border border-[#a8d84e]/12 rounded-lg flex items-center justify-between">
        <div className="text-[0.63rem] text-[#7aaa6a] tracking-[1px] uppercase">Current Game</div>
        <div className="flex gap-8">
          {[
            { label: "OMONDI", val: p1pts, hot: true },
            { label: "KAMAU", val: p2pts },
          ].map((pt, i) => (
            <div key={i} className="text-center">
              <div className="text-[0.6rem] text-[#7aaa6a] mb-0.5">{pt.label}</div>
              <div
                className={`font-bold text-[2rem] leading-none transition-all duration-300 ${
                  pt.hot ? "text-yellow-400" : "text-[#a8d84e]"
                }`}
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                {pt.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rally ball */}
      <div className="mt-4 h-11 rounded-md bg-[#1e3a20]/15 border border-[#1e3a20]/20 relative overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#a8d84e]/20" />
        <div
          className="absolute w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_#f0c040] top-1/2 -translate-y-1/2"
          style={{ animation: "rally 1.8s ease-in-out infinite" }}
        />
      </div>

      <div className="mt-3 flex justify-between text-[0.67rem] text-[#7aaa6a] font-mono">
        <span>Aces: 4 · DFs: 1</span>
        <span className="text-[#a8d84e]">● LIVE</span>
        <span>BPs: 2</span>
      </div>
    </div>
  );
}
