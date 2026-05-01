"use client";

import React from "react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#07110a] border-t border-[#1e3a20]/60">
      {/* Top footer */}
      <div className="px-6 md:px-12 py-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <div
            className="font-black tracking-[6px] text-[#a8d84e] mb-3"
            style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "2rem" }}
          >
            VICO
          </div>
          <p className="text-[#7aaa6a] text-[0.78rem] leading-relaxed mb-5 max-w-[240px]">
            The complete operating system for tennis — built for players, coaches, referees, and organizations.
          </p>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#7dc142]"
              style={{ animation: "blink 1.8s ease-in-out infinite" }}
            />
            <span className="text-[0.65rem] font-mono text-[#7aaa6a] tracking-[1.5px] uppercase">
              Live in Debug Mode
            </span>
          </div>
        </div>

        {/* Platform links */}
        <div>
          <p className="text-[0.65rem] font-bold text-[#a8d84e] uppercase tracking-[2.5px] mb-5">
            Platform
          </p>
          <ul className="space-y-2.5">
            {[
              "Features",
              "How It Works",
              "Tournament Engine",
              "Live Scoring",
              "Court Booking",
              "Leaderboards",
            ].map((link, i) => (
              <li key={i}>
                <a
                  href="#"
                  className="text-[#7aaa6a] text-[0.78rem] no-underline hover:text-[#a8d84e] transition-colors duration-200"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company links */}
        <div>
          <p className="text-[0.65rem] font-bold text-[#a8d84e] uppercase tracking-[2.5px] mb-5">
            Company
          </p>
          <ul className="space-y-2.5">
            {[
              "About VICO Softwares",
              "Contact Us",
              "Privacy Policy",
              "Terms of Service",
              "Cookie Policy",
              "Support",
            ].map((link, i) => (
              <li key={i}>
                <a
                  href="#"
                  className="text-[#7aaa6a] text-[0.78rem] no-underline hover:text-[#a8d84e] transition-colors duration-200"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2d5a35]/40 to-transparent" />

      {/* Bottom footer */}
      <div className="px-6 md:px-12 py-5 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[0.68rem] text-[#7aaa6a]/60 font-mono">
          <span>© {year} VICO Softwares Ltd. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[0.62rem] font-mono text-[#7aaa6a]/40 tracking-[1px]">
            Developed by VICO Softwares
          </span>
          <span className="w-px h-3 bg-[#2d5a35]/50" />
          <span className="text-[0.62rem] font-mono text-[#7aaa6a]/40 tracking-[1px]">v1.0.0-debug</span>
        </div>
      </div>
    </footer>
  );
}
