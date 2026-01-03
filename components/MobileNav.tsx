
import React from 'react';
import { AppSection } from '../types';
import { motion } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface MobileNavProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeSection, onNavigate }) => {
  const items = [
    { id: AppSection.Home, label: 'Inicio', icon: '🏠' },
    { id: AppSection.Lessons, label: 'Clases', icon: '📚' },
    { id: AppSection.Speaking, label: 'Hablar', icon: '🎙️' },
    { id: AppSection.Vocab, label: 'Léxico', icon: '🔖' },
    { id: AppSection.Coaching, label: 'Tutor', icon: '🤝' },
    { id: AppSection.Community, label: 'Mundo', icon: '🌎' },
    { id: AppSection.Kids, label: 'Niños', icon: '🎈' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] flex justify-center">
      <nav className="glass-morphism px-2 py-3 rounded-[32px] shadow-2xl flex items-center w-full max-w-md border border-white/10 overflow-x-auto hide-scrollbar gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="relative flex flex-col items-center justify-center p-2 rounded-2xl active-scale min-w-[60px] flex-1"
          >
            {activeSection === item.id && (
              <motion.div
                layoutId="navGlow"
                className="absolute inset-0 bg-blue-500/10 rounded-2xl border border-blue-500/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`text-2xl transition-all duration-300 ${activeSection === item.id ? 'scale-110 mb-0.5' : 'opacity-40 scale-90'}`}>
              {item.icon}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-tighter transition-all duration-300 ${activeSection === item.id ? 'text-blue-400 opacity-100' : 'opacity-0 h-0'}`}>
              {item.label}
            </span>
            {activeSection === item.id && (
              <motion.div
                layoutId="activeDot"
                className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MobileNav;
