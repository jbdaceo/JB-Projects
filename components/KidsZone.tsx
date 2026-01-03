
import React from 'react';
import { motion } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import { Language } from '../types';

interface KidsZoneProps {
  lang: Language;
}

const KidsZone: React.FC<KidsZoneProps> = ({ lang }) => {
  const content = {
    title: lang === 'es' ? 'Zona de Niños' : 'Kids Zone',
    subtitle: lang === 'es' ? '¡Aprende Jugando!' : 'Learn & Play!',
    sections: [
      {
        id: 'play',
        title: lang === 'es' ? 'Jugar' : 'Play',
        icon: '🎮',
        color: 'bg-yellow-400',
        text: 'text-yellow-900',
        desc: lang === 'es' ? 'Juegos divertidos' : 'Fun games'
      },
      {
        id: 'learn',
        title: lang === 'es' ? 'Aprender' : 'Learn',
        icon: '🦁',
        color: 'bg-cyan-400',
        text: 'text-cyan-900',
        desc: lang === 'es' ? 'Palabras nuevas' : 'New words'
      },
      {
        id: 'watch',
        title: lang === 'es' ? 'Ver' : 'Watch',
        icon: '📺',
        color: 'bg-pink-400',
        text: 'text-pink-900',
        desc: lang === 'es' ? 'Videos mágicos' : 'Magic videos'
      }
    ]
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-32">
      <header className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 rounded-full bg-white/10 backdrop-blur-md mb-4"
        >
          <span className="text-6xl">🎈</span>
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-xl font-sans">
          {content.title}
        </h2>
        <p className="text-2xl md:text-3xl font-bold text-blue-300">
          {content.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
        {content.sections.map((section, idx) => (
          <motion.button
            key={section.id}
            whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`${section.color} ${section.text} p-8 md:p-12 rounded-[48px] shadow-2xl flex flex-col items-center justify-center gap-6 group relative overflow-hidden`}
          >
            <div className="text-7xl md:text-8xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">
              {section.icon}
            </div>
            <div className="text-center z-10">
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-wide mb-2">
                {section.title}
              </h3>
              <p className="text-lg md:text-xl font-bold opacity-80">
                {section.desc}
              </p>
            </div>
            {/* Playful background decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          </motion.button>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-[40px] p-8 md:p-12 text-center border-4 border-dashed border-white/20 mx-4"
      >
        <div className="text-6xl mb-6">🌟</div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
          {lang === 'es' ? '¿Listo para empezar?' : 'Ready to start?'}
        </h3>
        <p className="text-xl text-slate-200 font-medium mb-8 max-w-lg mx-auto">
          {lang === 'es' ? 'Dile a tus papás que te ayuden.' : 'Ask your parents to help you.'}
        </p>
        <button className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-xl shadow-lg transform transition active:scale-95">
          GO! 🚀
        </button>
      </motion.div>
    </div>
  );
};

export default KidsZone;
