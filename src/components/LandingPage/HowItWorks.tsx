"use client";

import React from "react";
import { STEPS } from "./constants";
import { Label } from "./Label";
import { StepCard } from "./StepCard";

export function HowItWorks() {
  return (
    <section id="howitworks" className="py-32 px-6 md:px-12 bg-[#0d180e] text-center">
      <div className="max-w-5xl mx-auto">
        <Label center>Simple Onboarding</Label>
        <h2
          className="font-bold leading-[0.95] mb-6 text-[#e8f5e0]"
          style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2.2rem,5vw,4.2rem)" }}
        >
          GET STARTED
          <br />
          IN MINUTES
        </h2>
        <p className="text-[#7aaa6a] text-[0.9rem] font-light mx-auto mb-20 leading-relaxed max-w-[500px]">
          No complex setup. No learning curve. Pick your role and start exploring the live platform.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* connector line */}
          <div className="hidden lg:block absolute top-[34px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#2d5a35]/40 to-transparent" />
          {STEPS.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
