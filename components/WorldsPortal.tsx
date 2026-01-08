
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSection, Language, WorldData } from '../types';
import { fetchWorlds } from '../services/api';

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
    title: lang === 'es' ? 'Explora Mundos' : 'Explore Worlds',
    subtitle: lang === 'es' ? 'Elige tu entorno de aprendizaje inmersivo.' : 'Choose your immersive learning environment.',
    active: lang === 'es' ? 'activos' : 'active',
    enter: lang === 'es' ? 'Entrar' : 'Enter'
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

  // Routing Logic
  const handleNavigation = (world: WorldData) => {
      if (world.id === 'city') {
          // City -> Global Chat (Original World Chat)
          onNavigate(AppSection.Chat);
      } else if (world.id === 'game') {
          // Game -> Kids Zone
          onNavigate(AppSection.Kids);
      } else if (world.id === 'sky') {
          // Sky -> TV / Classes
          onNavigate(AppSection.Classes);
      } else if (world.id === 'mountain') {
          // Mountain -> Live Classroom (Professor)
          onNavigate(AppSection.LiveClassroom);
      } else {
          // Default fallback to assigned targetSection
          onNavigate(world.targetSection);
      }
  };

  return (
    <div className="min-h-full pb-24 relative overflow-hidden">
      {/* Ambient Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(20)].map((_, i) => (
            <motion.div
               key={i}
               className="absolute rounded-full bg-white/5 blur-xl"
               initial={{ 
                   x: Math.random() * 100 + "%", 
                   y: Math.random() * 100 + "%", 
                   scale: Math.random() * 0.5 + 0.5,
                   opacity: Math.random() * 0.3 
               }}
               animate={{ 
                   y: [null, Math.random() * -100],
                   opacity: [null, 0]
               }}
               transition={{ 
                   duration: Math.random() * 20 + 10, 
                   repeat: Infinity, 
                   ease: "linear" 
               }}
               style={{ width: Math.random() * 300 + "px", height: Math.random() * 300 + "px" }}
            />
         ))}
      </div>

      <header className="relative z-10 mb-12 text-center md:text-left">
        <motion.h2 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg"
        >
            {text.title}
        </motion.h2>
        <motion.p 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="text-slate-400 mt-2 text-lg font-medium"
        >
            {text.subtitle}
        </motion.p>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"
      >
        {worlds.map((world) => (
          <motion.div
            key={world.id}
            variants={item}
            onHoverStart={() => setHoveredWorld(world.id)}
            onHoverEnd={() => setHoveredWorld(null)}
            onClick={() => handleNavigation(world)}
            className="group relative h-80 rounded-[40px] overflow-hidden cursor-pointer active:scale-95 transition-transform"
          >
            {/* Card Background with Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${world.themeColor} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
            <div className="absolute inset-0 backdrop-blur-sm bg-slate-950/40 border border-white/10 rounded-[40px] group-hover:border-white/20 transition-colors" />
            
            {/* Floating Orb Effect */}
            <motion.div 
               className={`absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br ${world.themeColor} rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500`}
               animate={{ scale: hoveredWorld === world.id ? 1.2 : 1 }}
            />

            <div className="absolute inset-0 p-8 flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/10 group-hover:scale-110 transition-transform duration-500">
                     {world.icon}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5 backdrop-blur-sm">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">{world.activeUsers} {text.active}</span>
                  </div>
               </div>

               <div>
                  <h3 className="text-3xl font-black text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                     {lang === 'es' ? world.nameEs : world.nameEn}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
                     {lang === 'es' ? world.descEs : world.descEn}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
                     <span>{text.enter}</span>
                     <span className="group-hover:translate-x-1 transition-transform">→</span>
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
