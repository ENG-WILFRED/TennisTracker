"use client";

import React, { useState } from "react";
import { Role } from "./types";
import { useIntersection } from "./hooks";

export function RoleCard({ role, index }: { role: Role; index: number }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 p-7 ${
        hovered ? `border-current ${role.accentBorder} shadow-[0_12px_40px_rgba(0,0,0,0.4)]` : "border-[#1e3a20]/60"
      }`}
      style={{
        background: hovered
          ? `linear-gradient(135deg, #152515 0%, #1a2e1a 100%)`
          : "#111e12",
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? "translateY(-4px)" : "none") : "translateY(18px)",
        transition: `all 0.35s ease ${visible ? index * 0.07 : 0}s`,
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.4), inset 0 0 40px ${role.borderGlow}`
          : "none",
      }}
    >
      <span className={`text-[2rem] mb-4 block transition-transform duration-300 ${hovered ? "scale-110 -rotate-6" : ""}`}>
        {role.icon}
      </span>
      <span
        className={`text-[0.72rem] font-bold tracking-[2px] uppercase px-2.5 py-1 rounded-sm ${role.accentBg} ${role.accent} inline-block mb-4`}
      >
        {role.tag}
      </span>
      <h3
        className="font-bold leading-[1.05] mb-5 text-[#e8f5e0] whitespace-pre-line"
        style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(1.5rem,3vw,1.85rem)" }}
      >
        {role.title}
      </h3>

      <ul className="list-none p-0 m-0 mb-6 space-y-0">
        {role.features.map((f: string, i: number) => (
          <li key={i} className="text-[0.76rem] text-[#7aaa6a] py-[6px] border-b border-[#1e3a20]/40 flex items-center gap-2 last:border-0">
            <span className={`${role.accent} text-xs leading-none shrink-0`}>›</span>
            {f}
          </li>
        ))}
      </ul>

      <a
        href="#cta"
        className={`text-[0.73rem] font-bold tracking-[2px] uppercase ${role.accent} no-underline flex items-center gap-1.5 transition-all duration-200 hover:gap-2.5`}
      >
        {role.cta} <span>→</span>
      </a>
    </div>
  );
}
