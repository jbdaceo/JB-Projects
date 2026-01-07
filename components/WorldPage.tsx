
import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'framer-motion';

interface WorldPageProps {
  lang: Language;
  onNavigate: (section: AppSection) => void;
}

const WorldPage: React.FC<WorldPageProps> = ({ lang, onNavigate }) => {
  const activities = [
    { 
      id: 'lessons', 
      title: lang === 'es' ? 'Crear Lección' : 'Create Lesson', 
      icon: '🧬', 
      section: AppSection.Lessons, 
      color: 'from-violet-600 to-indigo-600',
      desc: lang === 'es' ? 'Generador IA & Quiz' : 'AI Generator & Quiz',
      colSpan: 'md:col-span-1'
    },
    { 
      id: 'classes', 
      title: lang === 'es' ? 'Clases TV' : 'TV Classes', 
      icon: '📺', 
      section: AppSection.Classes, 
      color: 'from-red-500 to-orange-500',
      desc: lang === 'es' ? 'En Vivo 24/7' : 'Live 24/7',
      colSpan: 'md:col-span-1'
    },
    { 
      id: 'community', 
      title: lang === 'es' ? 'Chat Mundial' : 'World Chat', 
      icon: '🌎', 
      section: AppSection.Community, 
      color: 'from-blue-500 to-cyan-500',
      desc: lang === 'es' ? 'Comunidad Global' : 'Global Community',
      colSpan: 'md:col-span-1'
    },
    {
      id: 'breakout',
      title: lang === 'es' ? 'Sala En Vivo' : 'Live Classroom',
      icon: '🎥',
      section: AppSection.LiveClassroom,
      color: 'from-purple-500 to-indigo-600',
      desc: lang === 'es' ? 'Video Conferencia con Profe y Estudiantes' : 'Video Conference with Prof & Students',
      colSpan: 'md:col-span-3' // Full width card
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10 relative">
      <header className="text-center space-y-2 relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{lang === 'es' ? 'Centro Mundial' : 'World Hub'}</h2>
        <p className="text-slate-400 uppercase tracking-widest text-sm font-bold">{lang === 'es' ? 'Conecta y Aprende' : 'Connect & Learn'}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4 relative z-10">
        {activities.map((act) => (
          <motion.button
            key={act.id}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(act.section)}
            className={`h-64 ${act.colSpan} rounded-[40px] bg-gradient-to-br ${act.color} p-1 shadow-2xl relative group overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0.5 bg-slate-950/90 rounded-[38px] flex flex-col items-center justify-center p-6 transition-colors group-hover:bg-slate-950/80 backdrop-blur-sm">
              <span className="text-6xl mb-4 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{act.icon}</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-1">{act.title}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{act.desc}</p>
              
              {act.id === 'breakout' && (
                  <div className="mt-4 flex gap-2">
                     <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                     <span className="text-red-400 text-xs font-black uppercase">Live Now</span>
                  </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNavigate(AppSection.WorldHub)}
        className="px-8 py-4 bg-slate-800 rounded-full border border-white/10 text-slate-300 font-bold hover:text-white hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-3 relative z-10"
      >
         <span>🪐</span>
         {lang === 'es' ? 'Explorar Más Mundos (Vocab, Speaking...)' : 'Explore More Worlds (Vocab, Speaking...)'}
      </motion.button>
    </div>
  );
};

export default WorldPage;
