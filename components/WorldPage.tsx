
import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'framer-motion';
// Fixing missing import for LayoutGrid
import { LayoutGrid } from 'lucide-react';

interface WorldPageProps {
  lang: Language;
  onNavigate: (section: AppSection) => void;
}

const WorldPage: React.FC<WorldPageProps> = ({ lang, onNavigate }) => {
  const activities = [
    { 
      id: 'lessons', 
      title: lang === 'es' ? 'Clase IA' : 'AI Lesson', 
      icon: '🧬', 
      section: AppSection.Lessons, 
      color: 'from-violet-600 to-indigo-600',
      desc: lang === 'es' ? 'Generador & Quiz' : 'Generator & Quiz',
      colSpan: 'md:col-span-1'
    },
    { 
      id: 'community', 
      title: lang === 'es' ? 'Comunidad Global' : 'Global Community', 
      icon: '🌎', 
      section: AppSection.Community, 
      color: 'from-blue-500 to-cyan-500',
      desc: lang === 'es' ? 'Inmersión de Texto' : 'Text Immersion',
      colSpan: 'md:col-span-1'
    },
    { 
      id: 'voice', 
      title: lang === 'es' ? 'Inmersión Vocal' : 'Vocal Immersion', 
      icon: '🎙️', 
      section: AppSection.Community, // Shares the component but we can pass a state or the App handles it
      color: 'from-brand-500 to-indigo-600',
      desc: lang === 'es' ? 'Deep Multi-Agent' : 'Deep Multi-Agent',
      colSpan: 'md:col-span-1'
    },
    {
      id: 'live',
      title: lang === 'es' ? 'Sala En Vivo' : 'Live Classroom',
      icon: '🎥',
      section: AppSection.LiveClassroom,
      color: 'from-purple-500 to-indigo-600',
      desc: lang === 'es' ? 'Video Conferencia con Profe' : 'Video Conference with Professor',
      colSpan: 'md:col-span-3'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 relative pb-32">
      <header className="text-center space-y-3 relative z-10">
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase">{lang === 'es' ? 'Centro Mundial' : 'World Hub'}</h2>
        <p className="text-slate-500 uppercase tracking-[0.5em] text-xs font-black">{lang === 'es' ? 'Sincronización de Cohortes' : 'Cohort Synchronization'}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-6 relative z-10">
        {activities.map((act) => (
          <motion.button
            key={act.id}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(act.section)}
            className={`h-72 ${act.colSpan} rounded-[56px] bg-gradient-to-br ${act.color} p-1 shadow-2xl relative group overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0.5 bg-slate-950/90 rounded-[54px] flex flex-col items-center justify-center p-8 transition-all group-hover:bg-slate-950/80 backdrop-blur-3xl">
              <span className="text-7xl mb-6 filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{act.icon}</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 italic">{act.title}</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">{act.desc}</p>
              
              {act.id === 'live' && (
                  <div className="mt-5 flex gap-2 items-center bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
                     <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></span>
                     <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Broadcast Active</span>
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
        className="px-10 py-5 bg-slate-900 border border-white/10 rounded-full text-slate-400 font-black uppercase tracking-widest text-xs hover:text-white hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-4 relative z-10 active:scale-95"
      >
         <LayoutGrid size={18}/>
         {lang === 'es' ? 'Explorar Otros Sectores' : 'Explore Other Sectors'}
      </motion.button>
    </div>
  );
};

export default WorldPage;
