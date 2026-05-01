"use client";

import React, { useState } from "react";
import { Step } from "./types";
import { useIntersection } from "./hooks";

export function StepCard({ step, index }: { step: Step; index: number }) {
  const { ref, visible } = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center px-4 relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transition: `all 0.6s ease ${index * 0.15}s`,
      }}
    >
      <div
        className={`w-[72px] h-[72px] rounded-full flex items-center justify-center font-bold relative z-[1] mb-7 transition-all duration-300 border-2 text-[1.8rem] ${
          hovered
            ? "bg-[#a8d84e] border-[#a8d84e] text-[#07110a] shadow-[0_0_32px_rgba(168,216,78,0.4)]"
            : "bg-[#111e12] border-[#2d5a35]/70 text-[#a8d84e]"
        }`}
        style={{ fontFamily: "'Bebas Neue', cursive" }}
      >
        {step.num}
      </div>
      <h3
        className="font-bold text-[1.25rem] mb-3 text-[#e8f5e0]"
        style={{ fontFamily: "'Bebas Neue', cursive" }}
      >
        {step.title}
      </h3>
      <p className="text-[0.78rem] text-[#7aaa6a] leading-relaxed">{step.desc}</p>
    </div>
  );
}
