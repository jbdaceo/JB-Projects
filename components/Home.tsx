import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Language, AppSection } from '../types';
import OptimizedImage from '../utils/performance';
import { Clock, Zap, ArrowRight, Target, Flame, Play } from 'lucide-react';

const Home: React.FC<{ onNavigate: (s: AppSection) => void, lang: Language }> = ({ onNavigate, lang }) => {
  const [hasPending, setHasPending] = useState(false);
  const [mastery, setMastery] = useState(12);

  useEffect(() => {
    setHasPending(localStorage.getItem('tmc_pending_session') === 'true');
    const savedMastery = localStorage.getItem('tmc_mastery_level');
    if (savedMastery) setMastery(parseInt(savedMastery));
  }, []);

  const text = useMemo(() => ({
    coachingStatus: lang === 'es' ? 'ESTADO' : 'COACHING',
    pendingReview: lang === 'es' ? 'Cita con Tomas' : 'Tomas Session',
    liveLab: lang === 'es' ? 'Laboratorio Neural' : 'Neural Lab',
    heroTitle1: lang === 'es' ? 'EL CAMINO' : 'THE FREEDOM',
    heroTitle2: lang === 'es' ? 'DE LIBERTAD' : 'PATH',
    heroDesc: lang === 'es' ? 'Conecta tu cultura con la riqueza global. Inglés real, intensidad nativa.' : 'Connect your culture with global wealth. Real English, native intensity.',
    begin: lang === 'es' ? 'COMENZAR' : 'BEGIN',
    streak: lang === 'es' ? 'RACHA' : 'STREAK',
    masteryLabel: lang === 'es' ? 'MAESTRÍA' : 'MASTERY'
  }), [lang]);

  return (
    <div className="flex flex-col gap-6 pb-12 relative overflow-x-hidden font-sans">
      {/* Dynamic Dashboard - Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
        {hasPending && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="col-span-2 md:col-span-1 bg-brand-500/10 border border-brand-500/30 p-4 md:p-5 rounded-[28px] md:rounded-[32px] flex items-center justify-between facetime-glass"
          >
            <div className="flex items-center gap-4 overflow-hidden">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"><Clock size={20}/></div>
               <div className="truncate">
                  <p className="text-[8px] md:text-[10px] font-black text-brand-400 uppercase tracking-widest">{text.coachingStatus}</p>
                  <p className="text-xs md:text-sm text-white font-black uppercase truncate tracking-tight">{text.pendingReview}</p>
               </div>
            </div>
            <button onClick={() => onNavigate(AppSection.Coaching)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ArrowRight className="text-brand-400" size={18}/></button>
          </motion.div>
        )}
        
        <div className="bg-slate-900/40 border border-white/5 p-4 md:p-5 rounded-[28px] md:rounded-[32px] flex items-center gap-3 md:gap-4 facetime-glass hover:bg-white/5 transition-all">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg"><Flame size={20}/></div>
           <div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{text.streak}</p>
              <p className="text-lg md:text-xl font-black text-white italic leading-none">05 Days</p>
           </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-4 md:p-5 rounded-[28px] md:rounded-[32px] flex items-center gap-3 md:gap-4 facetime-glass hover:bg-white/5 transition-all">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg"><Target size={20}/></div>
           <div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{text.masteryLabel}</p>
              <p className="text-lg md:text-xl font-black text-white italic leading-none">LVL {mastery}</p>
           </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[400px] md:min-h-[500px] lg:h-[600px] w-full rounded-[40px] md:rounded-[64px] overflow-hidden border border-white/10 shadow-2xl group">
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=90" 
            alt="Future Immersion" 
            priority 
            className="w-full h-full object-cover brightness-[0.35] group-hover:scale-105 transition-transform duration-[10s] ease-out" 
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-6 md:p-20 space-y-4 md:space-y-6">
           <div className="space-y-3 md:space-y-4">
              <span className="inline-block px-3 py-1 bg-brand-600 text-white rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">{text.liveLab}</span>
              
              <h1 className="text-4xl md:text-8xl font-display font-black text-white tracking-tighter italic leading-[0.85] drop-shadow-2xl">
                {text.heroTitle1}<br/>
                <span className="text-brand-500">{text.heroTitle2}</span>
              </h1>
              
              <p className="text-slate-300 max-w-sm md:max-w-lg text-base md:text-xl font-medium leading-relaxed opacity-80">
                {text.heroDesc}
              </p>
           </div>
           
           <div className="flex flex-wrap gap-4 pt-2 md:pt-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate(AppSection.Worlds)} 
                className="px-8 py-5 md:px-10 md:py-6 bg-white text-slate-950 rounded-[24px] md:rounded-[28px] font-black text-lg md:text-xl uppercase tracking-tighter shadow-2xl flex items-center gap-3 md:gap-4 transition-all"
              >
                {text.begin} <Play className="fill-current" size={20}/>
              </motion.button>
           </div>
        </div>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: '🌍', label: 'Worlds', sub: 'Portal', section: AppSection.Worlds, color: 'from-blue-600/20 to-blue-900/40' },
          { icon: '🧬', label: 'Lessons', sub: 'AI Gen', section: AppSection.Lessons, color: 'from-purple-600/20 to-purple-900/40' },
          { icon: '🤝', label: 'Coaching', sub: 'Private', section: AppSection.Coaching, color: 'from-amber-600/20 to-amber-900/40' },
          { icon: '🎙️', label: 'Vocal', sub: 'Immersion', section: AppSection.Speaking, color: 'from-emerald-600/20 to-emerald-900/40' }
        ].map((w, idx) => (
          <motion.button 
            key={idx} 
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={() => onNavigate(w.section)} 
            className={`group p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/10 bg-gradient-to-br ${w.color} flex flex-col items-center justify-center gap-3 md:gap-4 transition-all shadow-xl h-36 md:h-44 relative overflow-hidden facetime-glass`}
          >
            <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-500">{w.icon}</span>
            <div className="text-center">
              <p className="font-black text-[10px] md:text-xs uppercase tracking-widest text-white">{w.label}</p>
              <p className="text-[7px] md:text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{w.sub}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default Home;