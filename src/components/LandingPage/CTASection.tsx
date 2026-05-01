"use client";

import React from "react";
import { useIntersection } from "./hooks";

export function CTASection() {
  const { ref, visible } = useIntersection();

  return (
    <section id="cta" className="py-36 px-6 md:px-12 bg-[#0a1408] text-center relative overflow-hidden">
      {/* Watermark */}
      <div
        className="absolute font-bold text-[#1e3a20]/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap leading-none select-none"
        style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(7rem,28vw,20rem)",
        }}
      >
        VICO
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(100,180,60,0.06) 0%, transparent 70%)",
        }}
      />

      <div
        ref={ref}
        className={`relative z-10 max-w-3xl mx-auto transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="font-mono text-[0.68rem] text-[#7dc142] tracking-[3px] mb-8 flex items-center justify-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#7dc142] inline-block"
            style={{ animation: "blink 1.5s ease-in-out infinite" }}
          />
          LIVE IN DEBUG MODE · ACTIVELY IMPROVING
        </div>

        <h2
          className="font-bold leading-[0.92] mb-8 text-[#e8f5e0]"
          style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2.8rem,8vw,5.5rem)" }}
        >
          VICO IS LIVE —
          <br />
          BE PART OF
          <br />
          <span className="text-[#a8d84e]">THE BUILD</span>
        </h2>

        <p className="text-[#7aaa6a] text-[0.95rem] mb-12 leading-relaxed max-w-[550px] mx-auto">
          Join early, explore features, and help shape the platform as we improve performance, stability, and user
          experience together.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <a
            href="/register"
            className="inline-block bg-[#a8d84e] text-[#07110a] px-9 py-4 rounded-lg font-bold text-[0.85rem] tracking-[1.5px] uppercase no-underline border-2 border-[#a8d84e] transition-all duration-200 hover:bg-transparent hover:text-[#a8d84e] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(168,216,78,0.35)]"
          >
            Start Using VICO
          </a>
          <a
            href="/login"
            className="inline-block bg-transparent text-[#e8f5e0] px-9 py-4 rounded-lg font-semibold text-[0.85rem] tracking-[1.5px] uppercase no-underline border border-[#2d5a35]/60 transition-all duration-200 hover:border-[#a8d84e]/60 hover:text-[#a8d84e] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(168,216,78,0.2)]"
          >
            Login
          </a>
        </div>

        <p className="text-[#7aaa6a]/40 text-[0.65rem] font-mono tracking-wider">
          ⚙️ Debug Mode Active · Features may evolve · Feedback welcome
        </p>
      </div>
    </section>
  );
}
