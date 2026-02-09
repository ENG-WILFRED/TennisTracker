import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import About from './landing/About';
import PlayersSection from './landing/PlayersSection';
import CoachesSection from './landing/CoachesSection';
import RulesSection from './landing/RulesSection';
import CTASection from './landing/CTASection';
import Footer from './landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full"><Header /></div>
      <div className="w-full"><Hero /></div>
      <div className="w-full"><Features /></div>
      <div className="w-full"><About /></div>
      <div className="w-full"><PlayersSection /></div>
      <div className="w-full"><CoachesSection /></div>
      <div className="w-full"><RulesSection /></div>
      <div className="w-full"><CTASection /></div>
      <div className="w-full"><Footer /></div>
    </div>
  );
}