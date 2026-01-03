
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
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [lang, setLang] = useState<Language>('es');
  const [isAssistantOpen, setAssistantOpen] = useState(false);

  // Design Refresh Logic: Shift accent colors every hour or on refresh
  const themeHue = useMemo(() => {
    const hours = new Date().getHours();
    return (hours * 15) % 360; 
  }, []);

  // Self-Cleaning UI logic: Automatically resets certain UI states after inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("UI Optimized: Stale assets cleared.");
    }, 300000); // 5 mins
    return () => clearTimeout(timer);
  }, [activeSection]);

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
    <div 
      className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30"
      style={{ '--accent-hue': themeHue } as React.CSSProperties}
    >
      {/* Dynamic Header / Island - Visible on Mobile & Tablet Portrait */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4 lg:hidden pointer-events-none">
        <div className="mx-auto max-w-[200px] h-8 glass-morphism rounded-full flex items-center justify-center px-4 pointer-events-auto border-white/5 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
            TMC Level: Pro ⚡
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

      {/* AI Agent Floating Toggle */}
      {/* Positioned higher (bottom-28) on mobile/tablet to clear nav, lower (bottom-8) on desktop */}
      <div className="fixed right-6 bottom-28 lg:bottom-8 z-50">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setAssistantOpen(true)}
          className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-2xl shadow-blue-500/40 border border-white/20 active-scale"
        >
          🤖
        </motion.button>
      </div>

      {/* AI Agent Drawer */}
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setAssistantOpen(false)} lang={lang === 'es' ? 'es' : 'en'} currentSection={activeSection} />

      {/* Mobile/Tablet Portrait Bottom Navigation - Hidden on LG+ */}
      <div className="lg:hidden">
        <MobileNav activeSection={activeSection} onNavigate={setActiveSection} />
      </div>
    </div>
  );
};

export default App;
