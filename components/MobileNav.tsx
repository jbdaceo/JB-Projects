
import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/performance';

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

  const handleNavClick = (id: AppSection) => {
    if (activeSection !== id) {
        triggerHaptic('light'); // Native feel on tap
        onNavigate(id);
    }
  };

  return (
    // Docked Bottom Navigation with Safe Area Support
    <div className="fixed bottom-0 left-0 right-0 z-[100] native-glass border-t border-white/5 pb-safe-bottom gpu-layer">
      <nav className="flex justify-around items-center h-16 w-full max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full active-scale"
              style={{ touchAction: 'manipulation' }}
            >
              {/* Active Indicator Glow - Optimized with LayoutId */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavGlow"
                  className="absolute top-2 w-12 h-9 bg-brand-500/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              
              <span className={`text-2xl transition-transform duration-200 z-10 ${isActive ? 'scale-110 -translate-y-1' : 'opacity-60 grayscale scale-100'}`}>
                {item.icon}
              </span>
              
              <span className={`text-[9px] font-black uppercase tracking-tight transition-all duration-200 z-10 mt-0.5 ${isActive ? 'text-brand-400 opacity-100 translate-y-0' : 'text-slate-500 opacity-80 translate-y-1'}`}>
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
