"use client";

import React from "react";
import { useIntersection } from "./hooks";

const columns = [
  {
    number: "01 /",
    title: "Currently Testing",
    items: [
      "Real-time match scoring",
      "Role-based dashboards",
      "Tournament flows",
      "M-Pesa payment integration",
    ],
  },
  {
    number: "02 /",
    title: "What to Expect",
    items: [
      "Continuous updates",
      "Performance improvements",
      "Feature refinements",
      "Honest bug acknowledgements",
    ],
  },
  {
    number: "03 /",
    title: "Best Suited For",
    items: [
      "Tennis clubs testing digital workflows",
      "Coaches managing players",
      "Players tracking performance",
      "Organizations exploring tools",
    ],
    footnote: "Your feedback directly shapes this platform.",
  },
];

export function StatusBanner() {
  const { ref, visible } = useIntersection(0.1);

  return (
    <>
      {/* Add to your globals.css or <head>: */}
      {/* @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500&family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap'); */}

      <section
        ref={ref}
        className={`relative overflow-hidden bg-[#0e1a0f] border-y border-[#a8d84e]/10 transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {/* Top accent gradient line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#a8d84e]/70 to-transparent" />

        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 lg:px-14 py-12 md:py-14">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-10 md:mb-12">
            <div className="flex items-center gap-3.5">
              <span className="w-2 h-2 rounded-full bg-[#a8d84e] shadow-[0_0_10px_rgba(168,216,78,0.7),0_0_24px_rgba(168,216,78,0.3)] animate-pulse flex-shrink-0" />
              <span
                className="text-[#a8d84e] text-[0.62rem] tracking-[0.22em] uppercase"
                style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}
              >
                Platform Status
              </span>
            </div>
            <span
              className="text-[#7aaa6a] text-[0.58rem] tracking-[0.15em] uppercase bg-[#a8d84e]/5 border border-[#a8d84e]/18 px-3.5 py-1.5 rounded-sm"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Debug Mode · Improving Daily
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-[#a8d84e]/22 to-[#a8d84e]/5 mb-10 md:mb-12" />

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {columns.map((col, i) => (
              <div
                key={i}
                className={[
                  "relative",
                  // Vertical dividers on md+
                  i > 0 ? "md:border-l md:border-[#2d5a35]/40 md:pl-10" : "",
                  i < columns.length - 1 ? "md:pr-10" : "",
                  // Horizontal dividers on mobile
                  i < columns.length - 1
                    ? "border-b border-[#2d5a35]/30 pb-7 mb-7 md:border-b-0 md:pb-0 md:mb-0"
                    : "",
                ].join(" ")}
              >
                <span
                  className="block text-[#a8d84e]/32 text-[0.52rem] tracking-[0.15em] mb-2.5"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {col.number}
                </span>

                <p
                  className="text-[#c8e87e] text-[0.82rem] tracking-[0.05em] uppercase mb-6 leading-none"
                  style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
                >
                  {col.title}
                </p>

                <ul className="flex flex-col gap-3">
                  {col.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-[#7aaa6a]/85 text-[0.8rem] leading-snug font-light"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span className="text-[#a8d84e]/60 text-[0.68rem] flex-shrink-0 mt-[3px]">›</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {col.footnote && (
                  <p
                    className="text-[#7aaa6a]/35 text-[0.7rem] italic mt-6 leading-relaxed font-light"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {col.footnote}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Footer strip */}
          <div className="mt-12 md:mt-14 pt-6 border-t border-[#2d5a35]/22 flex items-center justify-between flex-wrap gap-4">
            <span
              className="text-[#a8d84e]/28 text-[0.56rem] tracking-[0.15em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              v0.1 · Beta · Nairobi, Kenya
            </span>
            <div className="flex gap-1.5 items-center">
              <span className="w-[5px] h-[5px] rounded-full bg-[#a8d84e]/55" />
              <span className="w-[5px] h-[5px] rounded-full bg-[#a8d84e]/28" />
              <span className="w-[5px] h-[5px] rounded-full bg-[#a8d84e]/15" />
            </div>
          </div>

        </div>
      </section>
    </>
  );
}