"use client";

import React, { useState } from "react";
import { Feature } from "./types";
import { useIntersection } from "./hooks";

export function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-8 rounded-xl border transition-all duration-300 cursor-default h-full flex flex-col ${
        hovered
          ? "bg-[#152515] border-[#a8d84e]/40 -translate-y-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          : "bg-[#111e12] border-[#1e3a20]/50"
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? "translateY(-8px)" : "none") : "translateY(20px)",
        transitionDelay: `${index * 0.12}s`,
      }}
    >
      <span className="text-[2.2rem] mb-6 block leading-none">{feature.icon}</span>
      <h3
        className="font-bold text-[1.4rem] mb-4 text-[#e8f5e0] flex-grow"
        style={{ fontFamily: "'Bebas Neue', cursive" }}
      >
        {feature.title}
      </h3>
      <p className="text-[0.8rem] text-[#7aaa6a] leading-relaxed">{feature.desc}</p>
    </div>
  );
}
