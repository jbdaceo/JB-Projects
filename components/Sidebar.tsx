
import React, { useEffect, useState, useMemo } from 'react';
import { AppSection, Language } from '../types';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  Home, Gamepad2, Globe, BookOpen, Mic, Languages, Sparkles, Briefcase, Bot
} from 'lucide-react';

interface SidebarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
  onLangToggle: () => void;
  tmcLevel: 'Novice' | 'Semi Pro' | 'Pro';
  levelProgress: number;
  onOpenLevelInfo: () => void;
  onOpenAiAssistant?: () => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  activeSection, onNavigate, lang, onLangToggle, tmcLevel, levelProgress, onOpenLevelInfo, onOpenAiAssistant
}) => {
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialOpen(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const isOpen = isInitialOpen || isHovered;

  const sidebarVariants: Variants = {
    open: { width: "280px", transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { width: "84px", transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  const text = useMemo(() => ({
    brand: lang === 'es' ? 'EL CAMINO' : 'FREEDOM PATH',
    subBrand: 'ILS SYSTEM',
    welcome: lang === 'es' ? 'Inicio' : 'Home',
    worlds: lang === 'es' ? 'Mundos' : 'Worlds',
    lessons: lang === 'es' ? 'Lecciones' : 'Lessons',
    speaking: lang === 'es' ? 'Voz' : 'Voice',
    vocab: lang === 'es' ? 'Vocab Pro' : 'Vocab Pro',
    coaching: lang === 'es' ? 'Tutoría' : 'Coaching',
    kids: lang === 'es' ? 'Kids' : 'Kids',
    jobs: lang === 'es' ? 'Trabajos' : 'Jobs',
    assistant: lang === 'es' ? 'Asistente' : 'Assistant',
    levelStatus: lang === 'es' ? 'Nivel' : 'Level',
  }), [lang]);

  const items = [
    { id: AppSection.Home, label: text.welcome, icon: Home },
    { id: AppSection.Worlds, label: text.worlds, icon: Globe },
    { id: AppSection.Lessons, label: text.lessons, icon: BookOpen },
    { id: AppSection.Speaking, label: text.speaking, icon: Mic },
    { id: AppSection.Vocab, label: text.vocab, icon: Languages },
    { id: AppSection.Coaching, label: text.coaching, icon: Sparkles },
    { id: AppSection.Kids, label: text.kids, icon: Gamepad2 },
    { id: AppSection.Jobs, label: text.jobs, icon: Briefcase },
  ];

  return (
    <motion.aside 
      initial="open"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-screen bg-slate-950/80 border-r border-white/5 flex flex-col backdrop-blur-3xl shadow-2xl overflow-hidden font-sans relative"
    >
      {/* Sidebar Edge Decor */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/5" />

      <div className="p-5 flex flex-col gap-8 h-full">
        {/* Brand */}
        <div className="flex items-center gap-4 h-16 shrink-0 overflow-hidden">
            <div className={`w-12 h-12 rounded-2xl ${lang === 'es' ? 'colombia-gradient' : 'usa-gradient'} flex items-center justify-center text-white font-bold text-2xl shadow-xl shrink-0`}>C</div>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col whitespace-nowrap">
                    <span className="font-display font-black text-sm leading-tight text-white uppercase italic tracking-tighter">{text.brand}</span>
                    <span className="font-sans font-bold text-[8px] text-brand-500 uppercase tracking-[0.3em]">{text.subBrand}</span>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* Lang Toggle */}
        <div onClick={onLangToggle} className="relative w-full h-10 bg-slate-900 rounded-xl border border-white/5 cursor-pointer p-1 flex items-center shadow-inner overflow-hidden shrink-0">
          {isOpen ? (
            <>
              <motion.div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-lg z-10 flex items-center justify-center ${lang === 'es' ? 'bg-gradient-to-br from-yellow-400 to-red-500' : 'bg-gradient-to-br from-blue-600 to-red-600'}`} 
                animate={{ left: lang === 'es' ? '4px' : '50%' }} 
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <div className="flex w-full justify-between px-3 text-[10px] font-black z-20 pointer-events-none relative select-none uppercase tracking-wider">
                <span className={`flex-1 text-center transition-colors ${lang === 'es' ? 'text-white' : 'text-slate-600'}`}>ES</span>
                <span className={`flex-1 text-center transition-colors ${lang === 'en' ? 'text-white' : 'text-slate-600'}`}>EN</span>
              </div>
            </>
          ) : (
            <div className="w-full text-center text-[10px] font-black text-brand-500 uppercase">{lang.toUpperCase()}</div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto hide-scrollbar -mx-2 px-2">
            {items.map((item) => (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)} 
                className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all group relative ${activeSection === item.id ? 'bg-brand-600/10 text-brand-400 font-bold border border-brand-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}
              >
                  {activeSection === item.id && <div className="absolute left-0 w-1 h-6 bg-brand-500 rounded-full" />}
                  <item.icon size={20} className="shrink-0" />
                  {isOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-4 text-xs font-black uppercase tracking-widest truncate">{item.label}</motion.span>}
              </button>
            ))}
        </nav>

        {/* Level & Assistant */}
        <div className="space-y-4 mt-auto">
            <button onClick={onOpenAiAssistant} className="w-full p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center gap-3 text-indigo-300 transition-all">
                <Bot size={20} />
                {isOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-widest">{text.assistant}</motion.span>}
            </button>

            <button onClick={onOpenLevelInfo} className="w-full p-3 bg-white/5 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-white/20 transition-all justify-center">
                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-800" />
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={100} strokeDashoffset={100 - levelProgress} strokeLinecap="round" className="text-brand-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black">{Math.round(levelProgress)}%</div>
                </div>
                {isOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start min-w-0">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{text.levelStatus}</span>
                      <span className="text-xs font-black text-white uppercase truncate">{tmcLevel}</span>
                  </motion.div>
                )}
            </button>
        </div>
      </div>
    </motion.aside>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
