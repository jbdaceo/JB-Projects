
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AppSection, Language } from '../types';
import { motion, useAnimation, Variants } from 'framer-motion';
import { 
  Home, Gamepad2, Globe, Tv, BookOpen, Mic, Languages, Sparkles, Instagram, MessageCircle, Briefcase, Bot
} from 'lucide-react';
import { Tooltip } from './Tooltip';

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
  const controls = useAnimation();

  // Auto-collapse timer (Updated to 35 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialOpen(false);
    }, 35000); // 35 seconds
    return () => clearTimeout(timer);
  }, []);

  const isOpen = isInitialOpen || isHovered;

  const sidebarVariants: Variants = {
    open: { 
      x: 0, 
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: { 
      x: "calc(-100% + 24px)", // 24px visible strip
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  // Content opacity variants to ensure nothing is visible when closed
  const contentVariants: Variants = {
    open: { opacity: 1, pointerEvents: "auto" as const, transition: { delay: 0.1, duration: 0.2 } },
    closed: { opacity: 0, pointerEvents: "none" as const, transition: { duration: 0.1 } }
  };

  // Memoize text objects
  const text = useMemo(() => ({
    levelStatus: lang === 'es' ? 'Estado del Nivel' : 'Level Status',
    profOnline: lang === 'es' ? 'Profesor En Línea' : 'Professor Online',
    welcome: lang === 'es' ? 'Bienvenida' : 'Welcome',
    worlds: lang === 'es' ? 'Mundos' : 'Worlds',
    classes: lang === 'es' ? 'Clases TV' : 'Classes TV',
    lessons: lang === 'es' ? 'Lecciones' : 'Lessons',
    speaking: lang === 'es' ? 'Entrenamiento' : 'Speaking',
    vocab: lang === 'es' ? 'Léxico Pro' : 'Vocab Pro',
    coaching: lang === 'es' ? 'Tutorías' : 'Coaching',
    kids: lang === 'es' ? 'Niños' : 'For Kids',
    jobs: lang === 'es' ? 'Trabajos' : 'Jobs',
    assistant: lang === 'es' ? 'Asistente IA' : 'AI Assistant',
    // Tooltips
    descHome: lang === 'es' ? 'Tu panel principal de control' : 'Your main dashboard',
    descWorlds: lang === 'es' ? 'Explora entornos 3D de aprendizaje' : 'Explore 3D learning environments',
    descClasses: lang === 'es' ? 'Clases en vivo 24/7 y repeticiones' : '24/7 Live classes and replays',
    descLessons: lang === 'es' ? 'Genera lecciones personalizadas con IA' : 'Generate custom AI lessons',
    descSpeaking: lang === 'es' ? 'Práctica de pronunciación en tiempo real' : 'Real-time pronunciation practice',
    descVocab: lang === 'es' ? 'Aprende vocabulario de noticias actuales' : 'Learn vocabulary from current news',
    descCoaching: lang === 'es' ? 'Agenda sesiones privadas 1-a-1' : 'Book private 1-on-1 sessions',
    descKids: lang === 'es' ? 'Juegos educativos y diversión' : 'Educational games and fun',
    descJobs: lang === 'es' ? 'Encuentra trabajos bilingües' : 'Find bilingual jobs',
    descLang: lang === 'es' ? 'Cambiar idioma de la interfaz' : 'Switch interface language',
    descLevel: lang === 'es' ? 'Ver detalles de tu progreso' : 'View your progress details',
    descAssistant: lang === 'es' ? 'Ayuda inteligente contextual' : 'Context-aware smart help',
  }), [lang]);

  const items = useMemo(() => [
    { id: AppSection.Home, label: text.welcome, icon: Home, desc: text.descHome },
    { id: AppSection.Worlds, label: text.worlds, icon: Globe, desc: text.descWorlds },
    { id: AppSection.Classes, label: text.classes, icon: Tv, desc: text.descClasses },
    { id: AppSection.Lessons, label: text.lessons, icon: BookOpen, desc: text.descLessons },
    { id: AppSection.Speaking, label: text.speaking, icon: Mic, desc: text.descSpeaking },
    { id: AppSection.Vocab, label: text.vocab, icon: Languages, desc: text.descVocab },
    { id: AppSection.Coaching, label: text.coaching, icon: Sparkles, desc: text.descCoaching },
    { id: AppSection.Kids, label: text.kids, icon: Gamepad2, desc: text.descKids },
    { id: AppSection.Jobs, label: text.jobs, icon: Briefcase, desc: text.descJobs },
  ], [text]);

  const handleNavClick = useCallback((id: AppSection) => {
    onNavigate(id);
  }, [onNavigate]);

  // SVG Chart Calculation
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(100, Math.max(0, isNaN(levelProgress) ? 0 : levelProgress));
  const strokeDashoffset = circumference - (Math.max(5, safeProgress) / 100) * circumference;

  return (
    <motion.aside 
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-0 top-0 z-[100] h-screen w-72 bg-slate-950/95 border-r border-white/10 flex flex-col backdrop-blur-3xl shadow-2xl overflow-hidden font-sans"
    >
      {/* Interaction Handle / Strip */}
      <div className={`absolute right-0 top-0 bottom-0 w-[24px] bg-white/5 border-l border-white/5 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         <div className="w-1 h-1 bg-white/30 rounded-full" />
         <div className="w-1 h-12 bg-white/20 rounded-full" />
         <div className="w-1 h-1 bg-white/30 rounded-full" />
      </div>

      <motion.div 
        className="p-6 flex flex-col gap-6 relative flex-1 min-w-[18rem]"
        animate={isOpen ? "open" : "closed"}
        variants={contentVariants}
      >
        <div className="flex items-center gap-4 h-16">
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className={`w-12 h-12 rounded-2xl ${lang === 'es' ? 'colombia-gradient' : 'usa-gradient'} flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-xl shadow-brand-500/20 font-display gpu-accelerated`}>C</motion.div>
            <div className="flex flex-col whitespace-nowrap">
                <span className="font-display font-black text-xl leading-tight tracking-tighter text-white uppercase italic">El Camino</span>
                <span className="font-sans font-bold text-[9px] text-brand-500 uppercase tracking-[0.25em]">IMS</span>
            </div>
        </div>

        <Tooltip content={text.descLang} position="right">
          <div onClick={onLangToggle} className="relative w-full h-10 bg-slate-900 rounded-xl border border-white/10 cursor-pointer p-1 flex items-center shadow-inner overflow-hidden group/switch hover:border-white/30 transition-colors">
            <motion.div layout className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-lg z-10 flex items-center justify-center ${lang === 'es' ? 'bg-gradient-to-br from-yellow-400 to-red-500' : 'bg-gradient-to-br from-blue-600 to-red-600'}`} animate={{ left: lang === 'es' ? '4px' : '50%' }} transition={{ type: "spring", stiffness: 400, damping: 30 }}><div className="w-1.5 h-1.5 rounded-full bg-white/50" /></motion.div>
            <div className="flex w-full justify-between px-3 text-[9px] font-black z-20 pointer-events-none relative select-none uppercase tracking-wider">
              <span className={`flex-1 text-center transition-colors duration-300 ${lang === 'es' ? 'text-white' : 'text-slate-600 group-hover/switch:text-slate-400'}`}>SPANISH</span>
              <span className={`flex-1 text-center transition-colors duration-300 ${lang === 'en' ? 'text-white' : 'text-slate-600 group-hover/switch:text-slate-400'}`}>ENGLISH</span>
            </div>
          </div>
        </Tooltip>

        <motion.nav className="flex-1 space-y-1 overflow-y-auto hide-scrollbar -mx-2 px-2" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}>
            {items.map((item) => (
            <Tooltip key={item.id} content={item.desc} position="right">
              <motion.button variants={{ hidden: { x: -10, opacity: 0 }, visible: { x: 0, opacity: 1 } }} onClick={() => handleNavClick(item.id)} whileHover={{ scale: 1.02, x: 4, backgroundColor: activeSection === item.id ? "rgba(37, 99, 235, 0.15)" : "rgba(255, 255, 255, 0.08)" }} whileTap={{ scale: 0.98 }} className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 relative group/btn overflow-hidden ${activeSection === item.id ? 'bg-brand-600/10 text-brand-400 font-bold border border-brand-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}>
                  {activeSection === item.id && <motion.div layoutId="activeSideGlow" className="absolute left-0 w-1 h-6 bg-brand-500 rounded-full" />}
                  <item.icon size={22} strokeWidth={activeSection === item.id ? 2.5 : 2} className={`transition-transform duration-300 shrink-0 ${activeSection === item.id ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                  <span className="ml-4 text-sm tracking-tight font-bold whitespace-nowrap">{item.label}</span>
              </motion.button>
            </Tooltip>
            ))}
        </motion.nav>

        <div className="space-y-4 mt-auto">
            {/* AI Assistant Toggle */}
            <Tooltip content={text.descAssistant} position="right">
                <motion.button 
                    onClick={onOpenAiAssistant}
                    className="w-full p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center gap-3 text-indigo-300 hover:text-indigo-200 transition-colors group/ai"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Bot size={20} className="group-hover/ai:animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-widest">{text.assistant}</span>
                </motion.button>
            </Tooltip>

            <div className="flex gap-2">
                <Tooltip content="Instagram @tmc_teacher" position="top">
                  <motion.a href="https://www.instagram.com/tmc_teacher/" target="_blank" rel="noopener noreferrer" className="flex-1 p-3 glass-morphism rounded-2xl flex items-center justify-center text-slate-400 hover:text-pink-400 transition-colors border-white/5" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Instagram size={20} /></motion.a>
                </Tooltip>
                <Tooltip content="WhatsApp Group" position="top">
                  <motion.a href="https://wa.link/fhe3xu" target="_blank" rel="noopener noreferrer" className="flex-1 p-3 glass-morphism rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors border-white/5" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><MessageCircle size={20} /></motion.a>
                </Tooltip>
            </div>
            
            <Tooltip content={text.descLevel} position="right">
              <motion.button animate={controls} onClick={onOpenLevelInfo} className="w-full p-3 bg-white/5 rounded-2xl flex items-center gap-4 px-4 border border-white/5 hover:border-white/20 transition-all relative overflow-hidden group/level" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                          <motion.circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1, ease: "easeOut" }} strokeLinecap="round" className={tmcLevel === 'Pro' ? 'text-amber-400' : 'text-brand-500'} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">{Math.round(safeProgress)}%</div>
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate w-full">{text.levelStatus}</span>
                      <span className={`text-sm font-black uppercase tracking-widest truncate w-full ${tmcLevel === 'Pro' ? 'text-amber-400' : tmcLevel === 'Semi Pro' ? 'text-cyan-400' : 'text-white'}`}>{tmcLevel} {tmcLevel === 'Pro' ? '⚡' : tmcLevel === 'Semi Pro' ? '🚀' : '🌱'}</span>
                  </div>
              </motion.button>
            </Tooltip>
        </div>
      </motion.div>
    </motion.aside>
  );
}, (prev, next) => prev.activeSection === next.activeSection && prev.lang === next.lang && prev.tmcLevel === next.tmcLevel && prev.levelProgress === next.levelProgress);

Sidebar.displayName = 'Sidebar';
export default Sidebar;
