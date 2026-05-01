"use client";

import React, { useEffect, useState } from "react";
import { GAME_SCORES } from "./constants";

export function Hero() {
  const [gameScore, setGameScore] = useState("30-15");
  const [scoreIdx, setScoreIdx] = useState(3);

  useEffect(() => {
    const si = setInterval(() => {
      setScoreIdx((i) => {
        const ni = (i + 1) % GAME_SCORES.length;
        setGameScore(GAME_SCORES[ni]);
        return ni;
      });
    }, 2200);
    return () => {
      clearInterval(si);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 md:px-10 py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0b] to-[#0f1f0f]" />

      {/* Subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,216,78,0.06),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2d5a35]/60 text-[0.65rem] tracking-widest text-[#7dc142] mb-6">
          <span className="w-1.5 h-1.5 bg-[#7dc142] rounded-full animate-pulse" />
          LIVE PLATFORM
        </div>

        {/* Headline */}
        <h1
          className="text-[#e8f5e0] font-semibold leading-tight mb-4
                   text-[2rem] sm:text-[2.4rem] md:text-[2.8rem]"
          style={{ fontFamily: "'Bebas Neue', cursive" }}
        >
          Manage Tennis. <br className="hidden sm:block" />
          In Real Time.
        </h1>

        {/* Description */}
        <p className="text-[#7aaa6a] text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Run tournaments, track matches, manage players, and handle bookings — all from one unified platform built for
          modern tennis operations.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/register"
            className="bg-[#a8d84e] text-[#07110a] px-6 py-2.5 text-sm font-semibold rounded-md 
                   border border-[#a8d84e] transition hover:bg-transparent hover:text-[#a8d84e]"
          >
            Get Started
          </a>

          <a
            href="#realtime"
            className="border border-[#2d5a35]/60 px-6 py-2.5 text-sm text-[#e8f5e0] rounded-md
                   hover:border-[#a8d84e] hover:text-[#a8d84e] transition"
          >
            View Live Demo
          </a>
        </div>
      </div>

      {/* Minimal Live Card */}
      <div className="absolute bottom-6 w-full flex justify-center px-4">
        <div
          className="bg-[#0f1f0f]/90 border border-[#2d5a35]/60 rounded-lg px-4 py-3 
                    w-full max-w-sm flex justify-between items-center text-sm"
        >
          <div>
            <div className="text-[#7aaa6a] text-xs">Live Match</div>
            <div className="text-[#e8f5e0] font-medium">Omondi vs Kamau</div>
          </div>

          <div className="text-yellow-400 font-bold text-lg">{gameScore}</div>
        </div>
      </div>
    </section>
  );
}
