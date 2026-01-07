
import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'framer-motion';

interface MobileNavProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeSection, onNavigate, lang }) => {
  const items = [
    { id: AppSection.Home, label: lang === 'es' ? 'Inicio' : 'Home', icon: '🏠' },
    { id: AppSection.Worlds, label: lang === 'es' ? 'Mundos' : 'Worlds', icon: '🪐' }, 
    { id: AppSection.Classes, label: lang === 'es' ? 'TV' : 'TV', icon: '📺' }, 
    { id: AppSection.Speaking, label: lang === 'es' ? 'Hablar' : 'Speak', icon: '🎙️' },
    { id: AppSection.Coaching, label: lang === 'es' ? 'Tutor' : 'Tutor', icon: '🤝' },
  ];

  return (
    // Docked Bottom Navigation with Safe Area Support
    // Navegación inferior acoplada con soporte de área segura
    <div className="fixed bottom-0 left-0 right-0 z-[100] native-glass border-t border-white/5 pb-safe-bottom">
      <nav className="flex justify-around items-center h-16 w-full max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full active-scale"
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavGlow"
                  className="absolute top-2 w-10 h-8 bg-brand-500/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              
              <span className={`text-2xl transition-all duration-300 z-10 ${isActive ? 'scale-110 -translate-y-1' : 'opacity-50 grayscale scale-100'}`}>
                {item.icon}
              </span>
              
              <span className={`text-[9px] font-black uppercase tracking-tight transition-all duration-300 z-10 mt-0.5 ${isActive ? 'text-brand-400 opacity-100 translate-y-0' : 'text-slate-500 opacity-80 translate-y-1'}`}>
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
