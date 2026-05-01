import React, { useEffect, useState } from "react";
import { NavProps } from "./types";
import { NAV_LINKS } from "./constants";

export function Nav({ onMenuOpen }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] h-[60px] flex items-center justify-between px-6 md:px-12 border-b transition-all duration-500 ${
      scrolled
        ? "bg-[#07110a]/98 border-[#1e3d20]/60 backdrop-blur-xl"
        : "bg-transparent border-transparent"
    }`}>
      <span className="font-black text-[1.4rem] text-[#a8d84e] tracking-[6px] uppercase select-none" style={{fontFamily:"'Bebas Neue', cursive", fontSize:"1.7rem"}}>VICO</span>

      <ul className="hidden md:flex gap-10 list-none">
        {NAV_LINKS.map(([label, href]: any, i: number) => (
          <li key={i}>
            <a href={href} className="text-[#8ab88a] no-underline text-[0.72rem] font-semibold tracking-[2px] uppercase transition-colors duration-200 hover:text-[#a8d84e]">{label}</a>
          </li>
        ))}
      </ul>

      <div className="hidden md:flex items-center gap-3">
        <a href="/login" className="text-[#8ab88a] text-[0.75rem] font-semibold tracking-[1px] uppercase no-underline hover:text-[#a8d84e] transition-colors px-4 py-2">Login</a>
        <a href="#cta" className="bg-[#a8d84e] text-[#07110a] px-5 py-2 rounded-md text-[0.73rem] font-bold tracking-[1.5px] uppercase no-underline transition-all duration-200 hover:bg-[#c8f060] hover:shadow-[0_0_20px_rgba(168,216,78,0.35)] whitespace-nowrap">Get Started</a>
      </div>

      <button onClick={onMenuOpen} className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2">
        {[0,1,2].map(i => <span key={i} className="block w-5 h-[2px] bg-[#a8d84e] rounded-full" />)}
      </button>
    </nav>
  );
}
