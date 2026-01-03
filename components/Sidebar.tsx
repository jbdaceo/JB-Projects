
import React, { useEffect, useState } from 'react';
import { AppSection, Language } from '../types';
import { motion, useAnimation } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface SidebarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
  onLangToggle: () => void;
  tmcLevel: 'Novice' | 'Semi Pro' | 'Pro';
  onOpenLevelInfo: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate, lang, onLangToggle, tmcLevel, onOpenLevelInfo }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();

  const text = {
    levelStatus: lang === 'es' ? 'Estado del Nivel' : 'Level Status',
    profOnline: lang === 'es' ? 'Profesor En Línea' : 'Professor Online',
    welcome: lang === 'es' ? 'Bienvenida' : 'Welcome',
    lessons: lang === 'es' ? 'Lecciones' : 'Lessons',
    speaking: lang === 'es' ? 'Entrenamiento' : 'Speaking',
    vocab: lang === 'es' ? 'Léxico Pro' : 'Vocab Pro',
    coaching: lang === 'es' ? 'Tutorías' : 'Coaching',
    community: lang === 'es' ? 'Comunidad' : 'Community',
    kids: lang === 'es' ? 'Niños' : 'For Kids',
  };

  useEffect(() => {
    const handleXpGain = async () => {
      setIsAnimating(true);
      await controls.start({
        scale: [1, 1.2, 0.9, 1.1, 1],
        rotate: [0, -5, 5, -3, 3, 0],
        boxShadow: ["0 0 0px rgba(250, 204, 21, 0)", "0 0 30px rgba(250, 204, 21, 0.8)", "0 0 0px rgba(250, 204, 21, 0)"],
        transition: { duration: 0.6, ease: "easeInOut" }
      });
      controls.set({ boxShadow: "none" });
      setIsAnimating(false);
    };

    window.addEventListener('tmc-xp-gain', handleXpGain);
    return () => window.removeEventListener('tmc-xp-gain', handleXpGain);
  }, [controls]);

  const items = [
    { id: AppSection.Home, label: text.welcome, icon: '🏠' },
    { id: AppSection.Lessons, label: text.lessons, icon: '📚' },
    { id: AppSection.Speaking, label: text.speaking, icon: '🎙️' },
    { id: AppSection.Vocab, label: text.vocab, icon: '🔖' },
    { id: AppSection.Coaching, label: text.coaching, icon: '🤝' },
    { id: AppSection.Community, label: text.community, icon: '🌎' },
    { id: AppSection.Kids, label: text.kids, icon: '🎈' },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: '📸', url: 'https://www.instagram.com/tmc_teacher/', color: 'hover:text-pink-400' },
    { name: 'WhatsApp', icon: '💬', url: 'https://wa.link/fhe3xu', color: 'hover:text-emerald-400' }
  ];

  return (
    <aside className="group w-20 hover:w-72 bg-slate-950/40 border-r border-white/5 flex flex-col h-screen sticky top-0 z-50 backdrop-blur-3xl transition-all duration-300 ease-in-out overflow-hidden">
      <div className="p-4 flex items-center gap-4 h-24 relative">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={`w-12 h-12 rounded-2xl ${lang === 'es' ? 'colombia-gradient' : 'usa-gradient'} flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-xl shadow-brand-500/20`}
        >
          C
        </motion.div>
        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <span className="font-black text-xl leading-tight tracking-tighter text-white uppercase italic">
            El Camino
          </span>
          <span className="font-bold text-[9px] text-brand-500 uppercase tracking-[0.25em]">
            with TMC teacher
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-2 overflow-y-auto hide-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center px-3 py-3.5 rounded-2xl transition-all duration-300 relative group/btn overflow-hidden ${
              activeSection === item.id
                ? 'bg-brand-600/10 text-brand-400 font-bold border border-brand-500/20 shadow-sm'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {activeSection === item.id && (
              <motion.div 
                layoutId="activeSideGlow"
                className="absolute left-0 w-1 h-6 bg-brand-500 rounded-full"
              />
            )}
            <span className={`text-2xl transition-transform duration-500 shrink-0 ${activeSection === item.id ? 'scale-110' : 'group-hover/btn:scale-110'}`}>{item.icon}</span>
            <span className="ml-4 text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap delay-75">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-3 mt-auto space-y-4">
        {/* Social Links */}
        <div className="flex flex-col group-hover:flex-row gap-2 transition-all duration-300">
          {socialLinks.map((social) => (
            <a 
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 glass-morphism rounded-2xl flex items-center justify-center text-xl text-slate-400 transition-colors border-white/5 ${social.color} w-full group-hover:w-auto flex-1`}
              aria-label={social.name}
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Level Indicator */}
        <motion.button 
          id="sidebar-level-badge"
          animate={controls}
          onClick={onOpenLevelInfo}
          className="w-full p-3 bg-white/5 rounded-2xl flex items-center justify-center group-hover:justify-between px-3 group-hover:px-4 border border-white/5 hover:border-white/20 transition-all relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-500/10 w-0 transition-all duration-1000" style={{ width: isAnimating ? '100%' : '20%' }} />
          {isAnimating && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />}

          <div className="relative z-10 flex flex-col items-start opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all duration-300 whitespace-nowrap">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{text.levelStatus}</span>
            <span className={`text-xs font-black uppercase tracking-widest ${tmcLevel === 'Pro' ? 'text-amber-400' : tmcLevel === 'Semi Pro' ? 'text-cyan-400' : 'text-slate-300'}`}>
              {tmcLevel}
            </span>
            <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
               <motion.div 
                 className={`h-full ${tmcLevel === 'Pro' ? 'bg-amber-400' : 'bg-brand-500'}`}
                 initial={{ width: "20%" }}
                 animate={isAnimating ? { width: ["20%", "100%", "25%"], backgroundColor: ["#facc15", "#3b82f6"] } : { width: "25%" }}
               />
            </div>
          </div>
          <span className="text-xl shrink-0 relative z-10">{tmcLevel === 'Pro' ? '⚡' : tmcLevel === 'Semi Pro' ? '🚀' : '🌱'}</span>
        </motion.button>

        {/* Compact Switch Language Toggle */}
        <div 
          onClick={onLangToggle}
          className="relative w-full h-12 bg-slate-900 rounded-2xl border border-white/10 cursor-pointer p-1 flex items-center shadow-inner overflow-hidden group/switch hover:border-white/30 transition-colors"
        >
          <motion.div
            layout
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-lg z-10 flex items-center justify-center ${lang === 'es' ? 'bg-gradient-to-br from-yellow-400 to-red-500' : 'bg-gradient-to-br from-blue-600 to-red-600'}`}
            animate={{ 
              left: lang === 'es' ? '4px' : '50%',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Tiny indicator inside thumb */}
             <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </motion.div>
          
          <div className="flex w-full justify-between px-3 text-[10px] font-black z-20 pointer-events-none relative select-none">
             <span className={`flex-1 text-center transition-colors duration-300 ${lang === 'es' ? 'text-white' : 'text-slate-600'}`}>ES</span>
             <span className={`flex-1 text-center transition-colors duration-300 ${lang === 'en' ? 'text-white' : 'text-slate-600'}`}>EN</span>
          </div>
        </div>

        <motion.div 
          whileTap={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="p-2 group-hover:p-5 bg-white/5 rounded-[20px] group-hover:rounded-[28px] border border-white/5 backdrop-blur-sm cursor-pointer select-none relative overflow-hidden group/tomas transition-all duration-300"
        >
          <div className="flex items-center gap-4 relative z-10 justify-center group-hover:justify-start">
            <div className="relative shrink-0">
              <div className="w-10 h-10 group-hover:w-12 group-hover:h-12 rounded-2xl bg-gradient-to-br from-brand-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10 text-xl group-hover:text-2xl group-hover/tomas:scale-110 transition-all">
                🧑🏽‍🏫
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 group-hover:w-4 group-hover:h-4 bg-emerald-500 rounded-full border-4 border-slate-950 shadow-sm animate-pulse"></div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden transition-all duration-300 whitespace-nowrap">
              <p className="text-sm font-black text-slate-100 tracking-tight leading-none group-hover/tomas:text-white transition-colors">Tomas Martinez</p>
              <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">{text.profOnline}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </aside>
  );
};

export default Sidebar;
