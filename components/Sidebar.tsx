
import React, { useState, useMemo } from 'react';
import { AppSection, Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Globe, BookOpen, Mic, Languages, Briefcase, Bot, Users, Radio, Smartphone
} from 'lucide-react';
import { triggerHaptic } from '../utils/performance';
import GlobalScoreboard from './GlobalScoreboard';

interface SidebarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
  onLangToggle: () => void;
  tmcLevel: 'Novice' | 'Semi Pro' | 'Pro';
  levelProgress: number;
  onOpenLevelInfo: () => void;
  onOpenAiAssistant: () => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  activeSection, onNavigate, lang, onLangToggle, onOpenAiAssistant
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const text = useMemo(() => ({
    brand: lang === 'es' ? 'EL CAMINO' : 'FREEDOM PATH',
    subBrand: 'SYSTEM:X',
    langLabel: lang === 'es' ? 'Idioma: Español' : 'Language: English',
    items: [
      { id: AppSection.Home, label: lang === 'es' ? 'Inicio' : 'Home', icon: Home, color: 'text-blue-400', hover: 'hover:bg-blue-500/10 hover:border-blue-500/30' },
      { id: AppSection.SocialFeed, label: lang === 'es' ? 'El Flujo' : 'The Feed', icon: Smartphone, color: 'text-pink-400', hover: 'hover:bg-pink-500/10 hover:border-pink-500/30' },
      { id: AppSection.Worlds, label: lang === 'es' ? 'Mundos' : 'Destinations', icon: Globe, color: 'text-emerald-400', hover: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' },
      { id: AppSection.Lessons, label: lang === 'es' ? 'Clases' : 'Learn', icon: BookOpen, color: 'text-orange-400', hover: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
      { id: AppSection.Speaking, label: lang === 'es' ? 'Hablar' : 'Speak', icon: Mic, color: 'text-violet-400', hover: 'hover:bg-violet-500/10 hover:border-violet-500/30' },
      { id: AppSection.Vocab, label: lang === 'es' ? 'Vocabulario' : 'Vocab', icon: Languages, color: 'text-yellow-400', hover: 'hover:bg-yellow-500/10 hover:border-yellow-500/30' },
      { id: AppSection.Community, label: lang === 'es' ? 'Comunidad' : 'Community', icon: Users, color: 'text-cyan-400', hover: 'hover:bg-cyan-500/10 hover:border-cyan-500/30' },
      { id: AppSection.Jobs, label: lang === 'es' ? 'Empleos' : 'Jobs', icon: Briefcase, color: 'text-indigo-400', hover: 'hover:bg-indigo-500/10 hover:border-indigo-500/30' },
      { id: AppSection.LiveClassroom, label: lang === 'es' ? 'En Vivo' : 'Live', icon: Radio, color: 'text-red-500', hover: 'hover:bg-red-500/10 hover:border-red-500/30' },
    ]
  }), [lang]);

  return (
    <motion.aside 
      animate={{ width: isHovered ? 280 : 100 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-[calc(100vh-24px)] m-3 rounded-[40px] ios-glass flex flex-col z-50 sticky top-3 shadow-[0_0_40px_rgba(0,0,0,0.2)] overflow-hidden"
    >
      {/* Background Liquid Mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative flex flex-col h-full px-4 py-6 gap-6 z-10">
        {/* Brand & Passport - Highlighted */}
        <div className="relative group/passport">
            <button 
            onClick={() => { triggerHaptic('heavy'); onNavigate(AppSection.Passport); }}
            className="flex items-center gap-4 h-14 outline-none w-full"
            >
                <div className={`w-12 h-12 rounded-[20px] ${lang === 'es' ? 'bg-gradient-to-br from-amber-400 to-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/20 shrink-0 relative overflow-hidden group-hover/passport:scale-105 transition-transform`}>
                    C
                    <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping" />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
                <AnimatePresence>
                {isHovered && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col whitespace-nowrap overflow-hidden">
                        <span className="font-display font-black text-lg text-white italic tracking-tighter leading-none drop-shadow-md">{text.brand}</span>
                        <span className="text-[9px] font-bold text-amber-300 uppercase tracking-[0.2em] animate-pulse">View Passport</span>
                    </motion.div>
                )}
                </AnimatePresence>
            </button>
        </div>

        {/* Explicit Language Toggle */}
        <button 
          onClick={() => { onLangToggle(); triggerHaptic('medium'); }} 
          className={`w-full p-1 rounded-[24px] border transition-all flex items-center gap-3 group relative overflow-hidden ${lang === 'es' ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.03] border-white/10'}`}
        >
           <div className={`h-10 rounded-[20px] flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${isHovered ? 'w-full px-4' : 'w-full'}`}>
              <div className="flex items-center justify-between w-full px-2">
                  <span className={`${lang === 'es' ? 'text-white' : 'text-slate-400'}`}>ES</span>
                  <div className={`w-8 h-5 rounded-full relative transition-all shadow-inner ${lang === 'es' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${lang === 'es' ? 'left-1' : 'right-1'}`} />
                  </div>
                  <span className={`${lang === 'en' ? 'text-white' : 'text-slate-400'}`}>EN</span>
              </div>
           </div>
        </button>
        <div className="text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'es' ? 'Español' : 'English'} Interface</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 overflow-y-auto hide-scrollbar py-2">
            {text.items.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => { onNavigate(item.id); triggerHaptic('light'); }} 
                  className={`w-full flex items-center h-14 px-3.5 rounded-[24px] transition-all relative group overflow-hidden ${isActive ? 'bg-white/[0.1] text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10' : `text-slate-400 hover:text-white ${item.hover} border border-transparent`}`}
                >
                    <item.icon 
                        size={22} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={`shrink-0 transition-all duration-300 ${isActive ? `${item.color} scale-110 drop-shadow-[0_0_8px_currentColor]` : `${item.color} opacity-70 group-hover:opacity-100 group-hover:scale-110`}`} 
                    />
                    <AnimatePresence>
                      {isHovered && (
                        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="ml-4 text-xs font-bold uppercase tracking-wider truncate">
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && !isHovered && <div className={`absolute right-4 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${item.color.replace('text-', 'bg-')}`} />}
                </button>
              );
            })}
        </nav>

        {/* Global Competition Widget */}
        <div className="py-4 border-t border-white/10">
            <GlobalScoreboard lang={lang} condensed={!isHovered} />
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-2">
            <button onClick={onOpenAiAssistant} className={`w-full h-14 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-95 border ${isHovered ? 'bg-indigo-600/80 border-indigo-400/50 text-white shadow-lg' : 'bg-white/[0.05] border-white/10 text-slate-400 hover:bg-white/[0.1]'}`}>
                <Bot size={24} className={isHovered ? 'animate-bounce' : ''}/>
                {isHovered && <span className="text-xs font-bold uppercase tracking-wider">Assistant</span>}
            </button>
        </div>
      </div>
    </motion.aside>
  );
});

export default Sidebar;
