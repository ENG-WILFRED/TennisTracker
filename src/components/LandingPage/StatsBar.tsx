"use client";

import React, { useEffect, useState } from "react";
import { useIntersection } from "./hooks";

export function StatsBar() {
  const { ref, visible } = useIntersection(0.3);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const targets = [6, 100, 3, 2026];

  useEffect(() => {
    if (!visible) return;
    targets.forEach((target, i) => {
      let current = 0;
      const step = target / 40;
      const t = setInterval(() => {
        current = Math.min(current + step, target);
        setCounts((c) => {
          const n = [...c];
          n[i] = Math.floor(current);
          return n;
        });
        if (current >= target) clearInterval(t);
      }, 30);
    });
  }, [visible]);

  const items = [
    { val: counts[0], suffix: "", label: "Roles Supported" },
    { val: counts[1], suffix: "%", label: "Real-Time Updates" },
    { val: counts[2], suffix: "+", label: "Payment Methods" },
    { val: counts[3], suffix: "", label: "Live Since" },
  ];

  return (
    <div ref={ref} className="bg-[#0d180e] border-b border-[#2d5a35]/40 grid grid-cols-2 md:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={i}
          className={`text-center py-6 px-4 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${i < 3 ? "border-r border-[#2d5a35]/30" : ""}`}
          style={{ transitionDelay: `${i * 0.07}s` }}
        >
          <div
            className="text-[#a8d84e] font-bold leading-none mb-1"
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "clamp(2rem,4.5vw,2.8rem)",
            }}
          >
            {item.val}
            {item.suffix}
          </div>
          <div className="text-[0.63rem] text-[#7aaa6a] tracking-[1.5px] uppercase font-mono">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
