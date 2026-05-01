import React from "react";
import { MobileMenuProps } from "./types";
import { NAV_LINKS } from "./constants";

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <div className={`fixed inset-0 bg-[#07110a]/99 z-[200] flex flex-col items-center justify-center gap-7 transition-all duration-500 ease-in-out ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <button onClick={onClose} className="absolute top-5 right-6 text-2xl text-[#a8d84e] bg-transparent border-none cursor-pointer font-light">✕</button>
      {NAV_LINKS.map(([label, href]: any, i: number) => (
        <a key={i} href={href} onClick={onClose} className="text-[#e8f5e0] no-underline font-bold tracking-[4px] uppercase hover:text-[#a8d84e] transition-colors" style={{fontFamily:"'Bebas Neue', cursive", fontSize:"2.6rem"}}>{label}</a>
      ))}
      <a href="#cta" onClick={onClose} className="bg-[#a8d84e] text-[#07110a] px-10 py-3 rounded-md font-bold tracking-[2px] uppercase no-underline text-[0.88rem] mt-4 hover:bg-[#c8f060]">Start Using VICO</a>
    </div>
  );
}
