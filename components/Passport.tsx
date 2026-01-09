
import React from 'react';
import { motion } from 'framer-motion';
import { Language, PassportStamp, User } from '../types';
import { Award, Star, Globe, ShieldCheck, TrendingUp, History, UserCheck, CheckCircle2 } from 'lucide-react';

interface PassportProps {
  lang: Language;
  user: User;
  stamps: PassportStamp[];
}

const Passport: React.FC<PassportProps> = ({ lang, user, stamps }) => {
  const isChild = user.isChild ?? (user.role === 'student' && stamps.length < 5);
  
  // Theme selection: lang === 'en' -> USA theme, lang === 'es' -> Colombia theme
  const theme = lang === 'en' 
    ? {
        name: 'United States of America',
        bg: 'bg-[#002868]', // Navy Blue
        accent: 'text-[#BF913B]', // Gold
        border: 'border-[#BF913B]/30',
        seal: '🦅',
        heading: 'THE ULTIMATE PASSPORT'
      }
    : {
        name: 'República de Colombia',
        bg: 'bg-[#800020]', // Burgundy / Deep Red
        accent: 'text-[#FCD116]', // Colombia Gold
        border: 'border-[#FCD116]/30',
        seal: '🇨🇴',
        heading: 'EL PASAPORTE DEFINITIVO'
      };

  return (
    <div className="min-h-full flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-slate-950 pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none -z-10" />

      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={`w-full max-w-5xl rounded-[60px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-4 border-white/5 relative flex flex-col lg:flex-row min-h-[700px]`}
      >
        {/* Passport Cover / Side Panel */}
        <div className={`w-full lg:w-[380px] ${theme.bg} p-12 flex flex-col items-center justify-between text-center relative overflow-hidden border-r border-white/10`}>
          {/* Cover Patterns */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
          </div>

          <div className="relative z-10 space-y-8 w-full">
            <div className="flex flex-col items-center gap-2">
               <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme.accent} opacity-80`}>{theme.name}</h3>
               <div className="w-16 h-px bg-current opacity-20" />
            </div>

            <motion.div 
              animate={{ rotateY: [0, 360] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="text-9xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
            >
              {theme.seal}
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white italic tracking-tighter leading-none uppercase drop-shadow-lg">
                {theme.heading}
              </h1>
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-black/20 rounded-full border border-white/10 backdrop-blur-md">
                 <ShieldCheck size={14} className={theme.accent} />
                 <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Valid Learning Document</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full pt-12">
            <div className="bg-black/30 p-6 rounded-[32px] border border-white/10 backdrop-blur-xl space-y-4">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Bearer</span>
                  <span className="text-white">{user.displayName}</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Document No.</span>
                  <span className="text-white">#{user.id.slice(-8).toUpperCase()}</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Status</span>
                  <span className="text-emerald-400">Verified</span>
               </div>
            </div>
          </div>
        </div>

        {/* Content Page */}
        <div className="flex-1 bg-slate-900/50 backdrop-blur-3xl p-8 md:p-12 overflow-y-auto hide-scrollbar space-y-12">
          {/* Header Data */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Official Records</p>
               <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Vocal & Cognitive Sync</h2>
            </div>
            <div className="flex gap-4">
               <div className="bg-slate-950 p-5 rounded-[28px] border border-white/5 text-center min-w-[120px] shadow-inner">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Proficiency</p>
                  <p className={`text-3xl font-black ${theme.accent} italic`}>B2+</p>
               </div>
               <div className="bg-slate-950 p-5 rounded-[28px] border border-white/5 text-center min-w-[120px] shadow-inner">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Stamps</p>
                  <p className="text-3xl font-black text-white italic">{stamps.length}</p>
               </div>
            </div>
          </div>

          {/* Grid Layout for Analytics & Stamps */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Skill Heatmap */}
            <div className="bg-white/5 border border-white/10 rounded-[48px] p-10 space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={120} />
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 shadow-lg"><Globe size={20}/></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Competence</h3>
               </div>

               <div className="space-y-6">
                  {[
                    { label: 'Listening', val: 92, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Speaking', val: 78, color: 'from-emerald-400 to-teal-600' },
                    { label: 'Reading', val: 85, color: 'from-amber-400 to-orange-600' },
                    { label: 'Writing', val: 65, color: 'from-rose-500 to-pink-600' },
                  ].map((skill) => (
                    <div key={skill.label} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">{skill.label}</span>
                          <span className="text-white">{skill.val}%</span>
                       </div>
                       <div className="h-3 bg-black/40 rounded-full border border-white/5 p-0.5 overflow-hidden shadow-inner">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${skill.val}%` }}
                             transition={{ duration: 1, delay: 0.5 }}
                             className={`h-full rounded-full bg-gradient-to-r ${skill.color} shadow-lg`}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Verification Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-[48px] p-10 space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <History size={120} />
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 shadow-lg"><UserCheck size={20}/></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Audit History</h3>
               </div>

               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 hide-scrollbar">
                  {stamps.length === 0 ? (
                    <div className="text-center py-12 opacity-20">
                       <Award size={48} className="mx-auto mb-4" />
                       <p className="font-black uppercase text-[10px] tracking-widest">No entries found in ledger.</p>
                    </div>
                  ) : (
                    stamps.map((stamp, i) => (
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={stamp.id} 
                        className="flex items-center gap-5 p-4 bg-black/20 rounded-3xl border border-white/5 group-hover:border-white/10 transition-all shadow-xl"
                      >
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/5 shrink-0">
                           {isChild ? stamp.iconKid : stamp.iconAdult}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-white truncate uppercase italic">{lang === 'en' ? stamp.title.en : stamp.title.es}</p>
                           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Verified on {new Date(stamp.dateEarned).toLocaleDateString()}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      </motion.div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Stamps Section - Massive Visual Grid */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 shadow-lg"><Star size={20}/></div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Seal Collection</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stamps.map((stamp, i) => (
                <motion.div 
                  key={stamp.id}
                  whileHover={{ scale: 1.1, rotate: Math.random() * 6 - 3 }}
                  className="aspect-square bg-slate-950 border-2 border-dashed border-white/10 rounded-[40px] p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden group cursor-pointer shadow-2xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative">
                    <span className="text-6xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform">
                      {isChild ? stamp.iconKid : stamp.iconAdult}
                    </span>
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: i * 0.5 }}
                      className={`absolute -inset-4 border border-current rounded-full blur-md -z-10 ${theme.accent}`} 
                    />
                  </div>
                  <span className="text-[8px] font-black text-white uppercase text-center tracking-tighter max-w-[80px] opacity-60 group-hover:opacity-100 transition-opacity leading-none">
                    {lang === 'en' ? stamp.title.en : stamp.title.es}
                  </span>
                </motion.div>
              ))}
              {/* Future Slots */}
              {[...Array(Math.max(0, 8 - stamps.length))].map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-[40px] border-2 border-dashed border-white/5 flex items-center justify-center opacity-10">
                   <Globe size={40} className="text-slate-600" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security / Hologram Strip */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 blur-sm pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default Passport;
