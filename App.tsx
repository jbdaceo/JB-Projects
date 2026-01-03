
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, Language } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Home from './components/Home';
import LessonGenerator from './components/LessonGenerator';
import SpeakingPractice from './components/SpeakingPractice';
import VocabularyTool from './components/VocabularyTool';
import CoachingSessions from './components/CoachingSessions';
import Community from './components/Community';
import KidsZone from './components/KidsZone';
import AIAssistant from './components/AIAssistant';
import Mascot from './components/Mascot';
import AuthModal from './components/AuthModal';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

// Base Hue Mapping for Themes
const THEME_CONFIG: Record<AppSection, { hue: number, sat: number }> = {
  [AppSection.Home]: { hue: 220, sat: 90 }, // Blue
  [AppSection.Lessons]: { hue: 260, sat: 85 }, // Violet/Indigo
  [AppSection.Speaking]: { hue: 190, sat: 95 }, // Cyan
  [AppSection.Vocab]: { hue: 160, sat: 80 }, // Emerald
  [AppSection.Coaching]: { hue: 25, sat: 95 }, // Amber/Orange
  [AppSection.Community]: { hue: 290, sat: 85 }, // Fuchsia
  [AppSection.Kids]: { hue: 330, sat: 90 }, // Rose/Pink
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [lang, setLang] = useState<Language>('es');
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);

  // Theme Randomizer Logic
  useEffect(() => {
    const base = THEME_CONFIG[activeSection];
    // Generate a variation: +/- 15 degrees hue, +/- 5% saturation
    const randomHueShift = Math.floor(Math.random() * 30) - 15;
    const randomSatShift = Math.floor(Math.random() * 10) - 5;
    
    const finalHue = base.hue + randomHueShift;
    const finalSat = Math.max(50, Math.min(100, base.sat + randomSatShift));

    // Update CSS Variables for Tailwind "brand" color
    document.documentElement.style.setProperty('--brand-hue', finalHue.toString());
    document.documentElement.style.setProperty('--brand-sat', `${finalSat}%`);
  }, [activeSection]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleGuest = () => {
    setIsLoggedIn(false);
    setShowAuthModal(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.Home:
        return <Home onStart={() => setActiveSection(AppSection.Lessons)} lang={lang} />;
      case AppSection.Lessons:
        return <LessonGenerator lang={lang} />;
      case AppSection.Speaking:
        return <SpeakingPractice lang={lang} />;
      case AppSection.Vocab:
        return <VocabularyTool lang={lang} />;
      case AppSection.Coaching:
        return <CoachingSessions lang={lang} />;
      case AppSection.Community:
        return <Community lang={lang} />;
      case AppSection.Kids:
        return <KidsZone lang={lang} />;
      default:
        return <Home onStart={() => setActiveSection(AppSection.Lessons)} lang={lang} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-brand-500/30">
      
      <AuthModal isOpen={showAuthModal} onLogin={handleLogin} onGuest={handleGuest} />

      {/* Dynamic Header / Island - Visible on Mobile & Tablet Portrait */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4 lg:hidden pointer-events-none flex justify-center items-center relative">
        {/* Language Toggle - Absolute Left */}
        <button 
          onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
          className="absolute left-4 top-4 h-8 px-3 glass-morphism rounded-full flex items-center gap-2 pointer-events-auto border-white/5 shadow-lg active-scale backdrop-blur-md transition-colors hover:bg-white/10"
        >
           <div className="flex gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${lang === 'es' ? 'bg-brand-500' : 'bg-slate-600'}`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${lang === 'en' ? 'bg-brand-500' : 'bg-slate-600'}`}></div>
          </div>
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
            {lang.toUpperCase()}
          </span>
        </button>

        <div className="h-8 glass-morphism rounded-full flex items-center justify-center px-4 pointer-events-auto border-white/5 shadow-lg backdrop-blur-md">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
            TMC Level: {isLoggedIn ? 'Pro ⚡' : 'Guest'}
          </span>
        </div>
      </div>

      {/* Desktop/Tablet Landscape Sidebar - Visible only on LG+ */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onNavigate={setActiveSection} lang={lang} onLangToggle={() => setLang(l => l === 'es' ? 'en' : 'es')} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8 lg:p-12 pb-32 lg:pb-12 pt-16 lg:pt-12 scroll-smooth">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mascot Companion - "Poco" */}
      <Mascot activeSection={activeSection} lang={lang} />

      {/* AI Agent Floating Toggle */}
      <div className="fixed right-6 bottom-28 lg:bottom-8 z-50">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setAssistantOpen(true)}
          className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-2xl shadow-2xl shadow-brand-500/40 border border-white/20 active-scale text-white"
        >
          🤖
        </motion.button>
      </div>

      {/* AI Agent Drawer */}
      <AIAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setAssistantOpen(false)} 
        lang={lang === 'es' ? 'es' : 'en'} 
        currentSection={activeSection}
        onNavigate={setActiveSection} 
      />

      {/* Mobile/Tablet Portrait Bottom Navigation - Hidden on LG+ */}
      <div className="lg:hidden">
        <MobileNav activeSection={activeSection} onNavigate={setActiveSection} lang={lang} />
      </div>
    </div>
  );
};

export default App;
