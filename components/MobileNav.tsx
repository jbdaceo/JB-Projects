import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/performance';
import { Home, Globe, Tv, Mic, Sparkles } from 'lucide-react';

interface MobileNavProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeSection, onNavigate, lang }) => {
  const items = [
    { id: AppSection.Home, label: lang === 'es' ? 'Inicio' : 'Home', icon: Home },
    { id: AppSection.Worlds, label: lang === 'es' ? 'Mundos' : 'Worlds', icon: Globe }, 
    { id: AppSection.Classes, label: 'TV', icon: Tv }, 
    { id: AppSection.Speaking, label: lang === 'es' ? 'Hablar' : 'Speak', icon: Mic },
    { id: AppSection.Coaching, label: lang === 'es' ? 'Tutor' : 'Tutor', icon: Sparkles },
  ];

  const handleNavClick = (id: AppSection) => {
    if (activeSection !== id) {
        triggerHaptic('light'); 
        onNavigate(id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] facetime-glass border-t border-white/5 pb-[env(safe-area-inset-bottom)] gpu-layer shadow-[0_-10px_50px_rgba(0,0,0,0.5)] h-[calc(84px+env(safe-area-inset-bottom))]">
      <nav className="flex justify-around items-center h-20 w-full max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full active:scale-90 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavGlow"
                  className="absolute top-2 w-12 h-10 bg-brand-500/15 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              
              <item.icon 
                className={`transition-all duration-300 ${isActive ? 'text-brand-400 scale-110 -translate-y-1' : 'text-slate-500 opacity-60'}`} 
                size={24} 
              />
              
              <span className={`text-[8px] font-black uppercase tracking-tight mt-1.5 transition-all duration-300 ${isActive ? 'text-brand-400 opacity-100' : 'text-slate-600 opacity-80'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNav;