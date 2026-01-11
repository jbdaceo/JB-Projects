import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Language, AppSection, SavedLesson } from '../types';
import OptimizedImage, { triggerHaptic, speakText } from '../utils/performance';
import { 
  ArrowRight, Volume2, Sparkles, BookMarked, Globe2, Quote, 
  Briefcase, Mic, Trophy, Zap, Clock 
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Home: React.FC<{ onNavigate: (s: AppSection) => void, lang: Language }> = ({ onNavigate, lang }) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [lastLesson, setLastLesson] = useState<SavedLesson | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tmc_saved_lessons_v10');
      if (saved) {
        const lessons: SavedLesson[] = JSON.parse(saved);
        const uncompleted = lessons.filter(l => !l.completed).sort((a,b) => b.dateSaved - a.dateSaved);
        if (uncompleted.length > 0) setLastLesson(uncompleted[0]);
      }
    } catch(e) { console.error(e); }
  }, []);

  const t = useMemo(() => ({
    heroTitle: lang === 'es' ? 'EL CAMINO' : 'FREEDOM PATH',
    heroDesc: lang === 'es' ? 'Domina el inglés real para un futuro global.' : 'Master real English for a global future.',
    resume: lang === 'es' ? 'Continuar' : 'Resume',
    lexicon: lang === 'es' ? 'Palabra del Día' : 'Daily Lexicon',
    sync: lang === 'es' ? 'Sync Voz' : 'Vocal Sync',
    pipeline: lang === 'es' ? 'Pipeline Global' : 'Global Pipeline',
    status: lang === 'es' ? 'Estado de Red' : 'Neural Load',
    noActive: lang === 'es' ? 'Sin Sesiones Activas' : 'No Active Sessions',
    progress: lang === 'es' ? 'Progreso' : 'Progress',
    context: lang === 'es' ? 'Contexto' : 'Context',
    start: lang === 'es' ? 'Iniciar Inmersión' : 'Initialize Immersion',
    nodes: lang === 'es' ? 'Nodos Activos' : 'Active Nodes',
    intensity: lang === 'es' ? 'Intensidad Semanal' : 'Weekly Intensity',
    time: lang === 'es' ? 'Tiempo Sync' : 'Time Sync',
    rank: lang === 'es' ? 'Rango Global' : 'Global Standing',
    rankDesc: lang === 'es' ? 'Top 5% de la Cohorte' : 'Top 5% of Cohort'
  }), [lang]);

  const wordOfTheDay = useMemo(() => {
      if (lang === 'es') {
          return {
              word: "Sovereignty",
              sentence: "Financial sovereignty starts with linguistic mastery.",
              definition: "Autonomía suprema o poder absoluto sobre uno mismo."
          };
      } else {
          return {
              word: "Soberanía",
              sentence: "La soberanía financiera comienza con el dominio lingüístico.",
              definition: "Supreme autonomy or absolute power over oneself."
          };
      }
  }, [lang]);

  const handleSpeak = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    speakText(text, () => setIsPlaying(id), () => setIsPlaying(null));
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 md:gap-8 pb-32"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="space-y-4 pt-4 px-2">
        <h1 className="text-display-xl text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] leading-[0.8]">{t.heroTitle}</h1>
        <p className="text-body text-slate-300 max-w-xl font-medium">{t.heroDesc}</p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Hero Card - Immersion */}
        <motion.div 
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(AppSection.Worlds)} 
          className="md:col-span-2 relative min-h-[320px] md:min-h-[400px] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl group cursor-pointer"
        >
          <div className="absolute inset-0 bg-slate-900 z-0">
             <OptimizedImage src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200" alt="World" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-8 md:p-10 space-y-4 z-10">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center text-white border border-white/20 shadow-lg">
                <Globe2 size={24} className="animate-spin-slow text-blue-300" />
             </div>
             <div>
                <h2 className="text-3xl md:text-5xl font-display font-black italic uppercase text-white drop-shadow-lg leading-none">{t.start}</h2>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-brand-300 mt-3">{t.status}: Optimized • 12k {t.nodes}</p>
             </div>
          </div>
          <div className="absolute top-6 right-6 w-12 h-12 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl z-20">
             <ArrowRight size={24} strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Status / Resume Card */}
        <motion.div variants={itemVariants} className="ios-card p-8 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
           {lastLesson ? (
             <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-center">
               <div>
                 <p className="text-caption text-brand-400 mb-2">{t.resume}</p>
                 <h3 className="text-2xl md:text-3xl font-display font-black italic text-white line-clamp-3 leading-none drop-shadow-md">"{lastLesson.title}"</h3>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-caption text-slate-300">
                   <span>{t.progress}</span>
                   <span>{lastLesson.quizScore || 10}%</span>
                 </div>
                 <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${lastLesson.quizScore || 10}%` }} className="h-full bg-gradient-to-r from-brand-400 to-indigo-500 shadow-[0_0_10px_#60a5fa]" />
                 </div>
               </div>
               <button onClick={() => onNavigate(AppSection.Lessons)} className="w-full py-4 bg-white text-slate-900 rounded-[20px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors shadow-lg active:scale-95">
                  {t.resume}
               </button>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
               <BookMarked size={64} className="text-slate-400 drop-shadow-lg"/>
               <p className="text-caption text-slate-300">{t.noActive}</p>
             </div>
           )}
        </motion.div>

        {/* Word of Day */}
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="ios-card p-8 flex flex-col justify-between min-h-[320px] group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-caption text-emerald-400 mb-1">{t.lexicon}</p>
                  <h3 className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tighter truncate drop-shadow-lg">{wordOfTheDay.word}</h3>
               </div>
               <button onClick={(e) => handleSpeak(`${wordOfTheDay.word}. ${wordOfTheDay.sentence}`, 'wotd', e)} className="p-3 bg-white/5 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-white/10 active:scale-95 shadow-lg">
                  <Volume2 size={20} className={isPlaying === 'wotd' ? 'animate-pulse' : ''} />
               </button>
            </div>
            <div className="space-y-5">
              <p className="text-lg text-slate-100 font-serif italic leading-tight drop-shadow-md">"{wordOfTheDay.sentence}"</p>
              <div className="p-4 bg-black/30 rounded-[20px] border border-white/10 backdrop-blur-md">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.context}</p>
                <p className="text-sm font-medium text-slate-200">{wordOfTheDay.definition}</p>
              </div>
            </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 md:gap-6">
           <button onClick={() => onNavigate(AppSection.Speaking)} className="flex-1 p-6 ios-card flex items-center justify-between group active:scale-[0.98]">
              <div className="text-left">
                <h4 className="text-xl md:text-2xl font-display font-black italic text-white uppercase drop-shadow-md">{t.sync}</h4>
                <p className="text-caption text-slate-300 mt-1">Real-time modulation</p>
              </div>
              <div className="w-14 h-14 bg-white/5 rounded-[18px] flex items-center justify-center text-brand-400 border border-white/10 group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-400 transition-all shadow-xl"><Mic size={24}/></div>
           </button>
           <button onClick={() => onNavigate(AppSection.Jobs)} className="flex-1 p-6 ios-card flex items-center justify-between group active:scale-[0.98]">
              <div className="text-left">
                <h4 className="text-xl md:text-2xl font-display font-black italic text-white uppercase drop-shadow-md">{t.pipeline}</h4>
                <p className="text-caption text-slate-300 mt-1">Global placement</p>
              </div>
              <div className="w-14 h-14 bg-white/5 rounded-[18px] flex items-center justify-center text-emerald-400 border border-white/10 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-all shadow-xl"><Briefcase size={24}/></div>
           </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="md:col-span-2 ios-card p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[24px] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(245,158,11,0.4)] shrink-0 border border-white/20">
                 <Trophy size={32} />
              </div>
              <div>
                 <h4 className="text-2xl md:text-3xl font-display font-black text-white italic uppercase drop-shadow-md">{t.rank}</h4>
                 <p className="text-caption text-slate-300 mt-1 tracking-[0.25em]">{t.rankDesc} • 842 XP</p>
              </div>
           </div>
           <div className="flex gap-8 border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0 sm:pl-8 w-full sm:w-auto justify-around sm:justify-start">
              <div className="text-center">
                 <p className="text-caption mb-2 text-slate-300">{t.intensity}</p>
                 <div className="flex gap-1.5">
                    {[1,2,3,4,5,6,7].map(d => (
                       <div key={d} className={`w-2 h-2 rounded-full shadow-sm ${d <= 5 ? 'bg-brand-500 shadow-[0_0_8px_#3b82f6]' : 'bg-white/10'}`} />
                    ))}
                 </div>
              </div>
              <div className="text-center">
                 <p className="text-caption mb-2 text-slate-300">{t.time}</p>
                 <div className="flex items-center justify-center gap-2 text-xl font-black text-white drop-shadow-md">
                    <Clock size={18} className="text-brand-400" /> 14.2h
                 </div>
              </div>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;