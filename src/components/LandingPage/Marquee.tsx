"use client";

import React from "react";
import { MARQUEE_ITEMS } from "./constants";

export function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="py-4 bg-[#0f1a10] border-y border-[#1e3a20]/50 overflow-hidden">
      <div className="flex gap-10 w-max" style={{ animation: "marquee 28s linear infinite" }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-mono text-[0.68rem] text-[#6aaa6a]/70 tracking-[3px] whitespace-nowrap flex items-center gap-5 uppercase"
          >
            {item} <span className="text-[#a8d84e]/40 text-base">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
