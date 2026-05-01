"use client";

import React, { useState } from "react";
import { Nav } from "./Nav";
import { MobileMenu } from "./MobileMenu";
import { Hero } from "./Hero";
import { StatusBanner } from "./StatusBanner";
import { StatsBar } from "./StatsBar";
import { Marquee } from "./Marquee";
import { RolesSection } from "./RolesSection";
import { RealtimeSection } from "./RealtimeSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorks } from "./HowItWorks";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";

export default function VICOLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=JetBrains+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: #0f1f0f;
          color: #e8f5e0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #07110a; }
        ::-webkit-scrollbar-thumb { background: #2d5a35; border-radius: 2px; }

        @keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(60px); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translate(-50%, 18px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes rally { 0% { left: 5%; } 50% { left: 86%; } 100% { left: 5%; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <Nav onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Hero />
      <StatusBanner />
      <StatsBar />
      <Marquee />
      <RolesSection />
      <RealtimeSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </>
  );
}
