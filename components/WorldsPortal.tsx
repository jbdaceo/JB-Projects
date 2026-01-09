
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSection, Language, WorldData } from '../types';
import { fetchWorlds } from '../services/api';
// Fixing missing import for ChevronRight
import { ChevronRight } from 'lucide-react';

interface WorldsPortalProps {
  lang: Language;
  onNavigate: (section: AppSection) => void;
}

const WorldsPortal: React.FC<WorldsPortalProps> = ({ lang, onNavigate }) => {
  const [worlds, setWorlds] = useState<WorldData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWorld, setHoveredWorld] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchWorlds();
      setWorlds(data);
      setLoading(false);
    };
    load();
  }, []);

  const text = {
    title: lang === 'es' ? 'Explora Sectores' : 'Explore Sectors',
    subtitle: lang === 'es' ? 'Elige tu entorno de inmersión total.' : 'Choose your total immersion environment.',
    active: lang === 'es' ? 'activos' : 'active',
    enter: lang === 'es' ? 'Iniciar' : 'Initiate'
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, bounce: 0.4 } }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex gap-2">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 bg-brand-500 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 bg-brand-500 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 bg-brand-500 rounded-full" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-full pb-24 relative overflow-hidden">
      {/* Ambient Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(15)].map((_, i) => (
            <motion.div
               key={i}
               className="absolute rounded-full bg-white/5 blur-3xl"
               initial={{ 
                   x: Math.random() * 100 + "%", 
                   y: Math.random() * 100 + "%", 
                   scale: Math.random() * 0.5 + 0.5,
                   opacity: Math.random() * 0.2 
               }}
               animate={{ 
                   y: [null, Math.random() * -200],
                   opacity: [null, 0]
               }}
               transition={{ 
                   duration: Math.random() * 20 + 10, 
                   repeat: Infinity, 
                   ease: "linear" 
               }}
               style={{ width: Math.random() * 400 + "px", height: Math.random() * 400 + "px" }}
            />
         ))}
      </div>

      <header className="relative z-10 mb-12 text-center md:text-left">
        <motion.h2 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg uppercase italic"
        >
            {text.title}
        </motion.h2>
        <motion.p 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="text-slate-500 mt-2 text-lg font-bold uppercase tracking-[0.3em]"
        >
            {text.subtitle}
        </motion.p>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10"
      >
        {worlds.map((world) => (
          <motion.div
            key={world.id}
            variants={item}
            onHoverStart={() => setHoveredWorld(world.id)}
            onHoverEnd={() => setHoveredWorld(null)}
            onClick={() => onNavigate(world.targetSection)}
            className="group relative h-96 rounded-[56px] overflow-hidden cursor-pointer active:scale-95 transition-all shadow-2xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${world.themeColor} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
            <div className="absolute inset-0 backdrop-blur-2xl bg-slate-950/60 border border-white/10 rounded-[56px] group-hover:border-white/30 transition-all" />
            
            <motion.div 
               className={`absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br ${world.themeColor} rounded-full blur-[100px] opacity-30 group-hover:opacity-60 transition-all duration-700`}
               animate={{ scale: hoveredWorld === world.id ? 1.3 : 1 }}
            />

            <div className="absolute inset-0 p-10 flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-5xl shadow-2xl border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                     {world.icon}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full border border-white/10 backdrop-blur-xl shadow-xl">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                     <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">{world.activeUsers} {text.active}</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <h3 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic group-hover:text-brand-400 transition-colors">
                      {lang === 'es' ? world.nameEs : world.nameEn}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed group-hover:text-slate-200 transition-colors">
                      {lang === 'es' ? world.descEs : world.descEn}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-all pt-4">
                     <span>{text.enter}</span>
                     <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" />
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default WorldsPortal;
