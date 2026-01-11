import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/performance';
import { Home, Globe, BookOpen, Mic, Briefcase } from 'lucide-react';

interface MobileNavProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeSection, onNavigate, lang }) => {
  const items = [
    { id: AppSection.Home, label: 'Home', icon: Home },
    { id: AppSection.Worlds, label: 'Worlds', icon: Globe }, 
    { id: AppSection.Lessons, label: 'Learn', icon: BookOpen }, 
    { id: AppSection.Speaking, label: 'Speak', icon: Mic },
    { id: AppSection.Jobs, label: 'Jobs', icon: Briefcase },
  ];

  return (
    <div className="px-4 pb-4">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        className="mx-auto max-w-sm bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex justify-between items-center p-2 relative overflow-hidden"
      >
        {/* Active Background Indicator */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-500/10 to-transparent pointer-events-none" />

        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => { triggerHaptic('light'); onNavigate(item.id); }} 
              className="relative flex-1 h-14 flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform z-10"
            >
              {isActive && (
                <motion.div 
                  layoutId="mobileNavGlow" 
                  className="absolute inset-0 bg-white/5 rounded-[24px] border border-white/5 shadow-inner"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} 
                />
              )}
              
              <div className="relative">
                <item.icon 
                  className={`transition-all duration-300 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500'}`} 
                  size={isActive ? 24 : 22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavDot"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-400 rounded-full" 
                  />
                )}
              </div>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default MobileNav;