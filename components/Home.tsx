
import React from 'react';
import { motion } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import { Language } from '../types';

interface HomeProps {
  onStart: () => void;
  lang: Language;
}

const Home: React.FC<HomeProps> = ({ onStart, lang }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const mindsets = [
    "Vamo' con toda: English is your ticket to freedom.",
    "Bilingüismo = Independence. Speak your truth.",
    "Tomas Martinez: Training the next global generation.",
    "El Camino: From Colombia to the global stage."
  ];

  return (
    <div className="flex flex-col h-full space-y-6 md:space-y-12 pb-12">
      {/* Ticker for Freshness */}
      <div className="w-full overflow-hidden bg-blue-600/10 py-2 border-y border-blue-500/10 rounded-full">
        <motion.div 
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap flex gap-12"
        >
          {mindsets.map((m, i) => (
            <span key={i} className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> {m}
            </span>
          ))}
          {/* Duplicate for seamless scroll */}
          {mindsets.map((m, i) => (
            <span key={i + 'dup'} className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> {m}
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="relative h-[50vh] md:h-[500px] w-full rounded-[48px] overflow-hidden shadow-2xl group active-scale"
      >
        <img 
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" 
          alt="Future of education" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4] transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8 md:p-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl md:text-8xl font-black text-white mb-4 tracking-tighter leading-[1] drop-shadow-2xl">
              El Camino <br className="hidden md:block"/>
              a la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Libertad.</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-2xl max-w-2xl leading-relaxed font-medium">
              Tomas Martinez te entrena para ganar. <span className="text-white font-black underline decoration-blue-500">Inglés real</span> para sueldos globales.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Social / Contact Grid */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <a 
          href="https://wa.link/fhe3xu"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center gap-3 text-emerald-400 active-scale"
        >
          <span className="text-2xl">💬</span>
          <span className="font-black text-xs uppercase tracking-wider">WhatsApp</span>
        </a>
        <a 
          href="https://www.instagram.com/tmc_teacher/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 bg-pink-500/10 border border-pink-500/20 rounded-3xl flex items-center justify-center gap-3 text-pink-400 active-scale"
        >
          <span className="text-2xl">📸</span>
          <span className="font-black text-xs uppercase tracking-wider">Instagram</span>
        </a>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10"
      >
        {[
          { icon: '🚀', title: lang === 'es' ? 'Futuro' : 'Future', desc: lang === 'es' ? 'Carreras internacionales desde Colombia.' : 'International careers from Colombia.' },
          { icon: '🌎', title: lang === 'es' ? 'Sin Límites' : 'Limitless', desc: lang === 'es' ? 'El idioma no será tu obstáculo.' : 'Language will not be an obstacle.' },
          { icon: '🤝', title: '1-a-1', desc: lang === 'es' ? 'Tutorías directas con Tomas.' : 'Direct coaching with Tomas.' }
        ].map((card, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            className="p-6 md:p-10 bg-slate-900/40 rounded-[32px] border border-slate-800 shadow-xl backdrop-blur-sm active-scale"
          >
            <div className="text-3xl mb-4">{card.icon}</div>
            <h3 className="font-black text-xl mb-1 text-white">{card.title}</h3>
            <p className="text-slate-500 text-xs md:text-lg leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex justify-center pt-4 md:pt-8"
      >
        <motion.button 
          onClick={onStart}
          whileTap={{ scale: 0.92 }}
          className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-3xl font-black text-lg md:text-xl shadow-2xl shadow-blue-500/20 active:bg-blue-700 active-scale"
        >
          {lang === 'es' ? '¡Comienza Hoy!' : 'Start Today!'}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Home;
