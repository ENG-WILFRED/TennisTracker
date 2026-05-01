"use client";

import React from "react";
import { useIntersection } from "./hooks";
import { Label } from "./Label";
import { ScoreBoard } from "./ScoreBoard";

export function RealtimeSection() {
  const { ref: lRef, visible: lVis } = useIntersection();
  const { ref: rRef, visible: rVis } = useIntersection();

  return (
    <section id="realtime" className="py-24 px-6 md:px-12 bg-[#0d180e]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div
          ref={lRef}
          className={`transition-all duration-700 ${
            lVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Label>Killer Feature</Label>
          <h2
            className="font-bold leading-[0.92] mb-5 text-[#e8f5e0]"
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "clamp(2.2rem,5vw,4.2rem)",
            }}
          >
            TENNIS,
            <br />
            LIVE AND
            <br />
            UNFILTERED
          </h2>
          <p className="text-[#7aaa6a] text-[0.9rem] leading-relaxed mb-4">
            Every point. Every rally. Every set. Watch matches unfold in real-time with live scoring —
            no refresh needed.
          </p>
          <p className="text-[#7aaa6a]/50 text-[0.75rem] leading-relaxed mb-8 italic">
            Currently used in live testing with real match simulations and scoring flows.
          </p>
          <div className="flex flex-col gap-3">
            {[
              {
                icon: "⚡",
                title: "Real-Time Score Updates",
                desc: "WebSocket-powered, zero-latency score delivery",
              },
              {
                icon: "🏆",
                title: "Live Tournament Brackets",
                desc: "Bracket progression updates as matches complete",
              },
              {
                icon: "📊",
                title: "Performance Analytics Live",
                desc: "Stats computed as the match progresses",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 rounded-lg bg-[#111e12] border border-[#1e3a20]/60"
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <div className="font-semibold text-[0.85rem] mb-0.5 text-[#e8f5e0]">{item.title}</div>
                  <div className="text-[0.73rem] text-[#7aaa6a]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={rRef}
          className={`transition-all duration-700 delay-200 ${
            rVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <ScoreBoard />
        </div>
      </div>
    </section>
  );
}
