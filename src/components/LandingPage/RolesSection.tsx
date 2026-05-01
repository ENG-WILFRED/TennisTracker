"use client";

import React from "react";
import { ROLES } from "./constants";
import { Label } from "./Label";
import { RoleCard } from "./RoleCard";

export function RolesSection() {
  return (
    <section id="roles" className="py-24 px-6 md:px-12 bg-[#0f1f0f]">
      <div className="max-w-6xl mx-auto">
        <Label>Built For Everyone</Label>
        <h2
          className="font-bold leading-[0.95] mb-3 text-[#e8f5e0]"
          style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2.2rem,5vw,4.2rem)" }}
        >
          YOUR ROLE.
          <br />
          YOUR TOOLS.
        </h2>
        <p className="text-[#7aaa6a] text-[0.9rem] font-light max-w-[440px] leading-relaxed mb-14">
          One platform, six roles. Every stakeholder in the tennis ecosystem gets a tailored experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((role, i) => (
            <RoleCard key={i} role={role} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
