"use client";

import React from "react";
import { FEATURES } from "./constants";
import { Label } from "./Label";
import { FeatureCard } from "./FeatureCard";

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6 md:px-12 bg-[#0f1f0f]">
      <div className="max-w-6xl mx-auto">
        <Label>Core Platform</Label>
        <h2
          className="font-bold leading-[0.95] mb-6 text-[#e8f5e0]"
          style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2.2rem,5vw,4.2rem)" }}
        >
          EVERYTHING
          <br />
          TENNIS NEEDS
        </h2>
        <p className="text-[#7aaa6a] text-[0.9rem] font-light max-w-[500px] leading-relaxed mb-16">
          Four pillars. Infinite depth. Built to handle the full complexity of modern tennis operations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
