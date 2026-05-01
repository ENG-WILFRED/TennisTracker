import React from "react";
import { LabelProps } from "./types";

export function Label({ children, center = false }: LabelProps) {
  return (
    <div className={`flex items-center gap-3 mb-5 ${center ? "justify-center" : ""}`}>
      <span className="w-8 h-px bg-[#a8d84e]/60 shrink-0" />
      <span className="font-mono text-[0.65rem] tracking-[3.5px] uppercase text-[#a8d84e]">{children}</span>
      {center && <span className="w-8 h-px bg-[#a8d84e]/60 shrink-0" />}
    </div>
  );
}
