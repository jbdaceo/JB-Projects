
import React, { useState } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Briefcase, Calendar, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

const CoachingSessions: React.FC<{ lang: Language }> = ({ lang }) => {
  const [step, setStep] = useState(1);
  const [setting, setSetting] = useState<'office' | 'social' | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const confirmSession = () => {
    triggerHaptic('success');
    localStorage.setItem('tmc_pending_session', 'true');
    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8 max-w-lg mx-auto pb-48">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 bg-emerald-500/20 rounded-[40px] border-4 border-emerald-500/40 flex items-center justify-center text-emerald-500 mb-4 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
        >
          <ShieldCheck size={80}/>
        </motion.div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">Transmission Reserved</h2>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">Professor Tomas is reviewing your request. Check your Home dashboard for status updates. Get ready for immersion.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-7 bg-white text-slate-950 rounded-[32px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 text-sm"
        >
          Return to Neural Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-48 pt-10">
      <header className="text-center space-y-4">
        <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase drop-shadow-xl leading-none">Mentorship Sync</h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px]">1-on-1 Deep Neural Coaching</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }} 
          onClick={() => { setSetting('office'); triggerHaptic('light'); }}
          className={`p-12 rounded-[56px] border-4 cursor-pointer transition-all flex flex-col items-center text-center gap-8 relative overflow-hidden group ${setting === 'office' ? 'border-brand-500 bg-brand-500/10 shadow-[0_30px_80px_rgba(59,130,246,0.2)]' : 'border-white/5 bg-slate-900/40 opacity-40 hover:opacity-80'}`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Briefcase size={120} /></div>
          <div className="w-24 h-24 bg-slate-800 rounded-[32px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform"><Briefcase size={48} className="text-blue-400" /></div>
          <div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Corporate Sync</h3>
            <p className="text-[10px] font-black text-brand-400 uppercase mt-3 tracking-widest">Professional Immersion</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }} 
          onClick={() => { setSetting('social'); triggerHaptic('light'); }}
          className={`p-12 rounded-[56px] border-4 cursor-pointer transition-all flex flex-col items-center text-center gap-8 relative overflow-hidden group ${setting === 'social' ? 'border-brand-500 bg-brand-500/10 shadow-[0_30px_80px_rgba(59,130,246,0.2)]' : 'border-white/5 bg-slate-900/40 opacity-40 hover:opacity-80'}`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Coffee size={120} /></div>
          <div className="w-24 h-24 bg-slate-800 rounded-[32px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform"><Coffee size={48} className="text-orange-400" /></div>
          <div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Urban Vibe</h3>
            <p className="text-[10px] font-black text-brand-400 uppercase mt-3 tracking-widest">Street-Level Fluency</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-slate-900/80 border-2 border-white/5 p-12 rounded-[64px] space-y-10 facetime-glass shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-500/20" />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4 flex items-center gap-2"><Calendar size={14}/> Preferred Date</label>
               <input 
                  type="date" 
                  className="w-full bg-slate-950/80 border-2 border-white/10 rounded-[28px] p-6 text-white font-black outline-none focus:border-brand-500 transition-all shadow-inner" 
                  onKeyDown={(e) => e.key === 'Enter' && setting && confirmSession()}
               />
            </div>
            <div className="space-y-4">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4 flex items-center gap-2"><Clock size={14}/> Preferred Time</label>
               <input 
                  type="time" 
                  className="w-full bg-slate-950/80 border-2 border-white/10 rounded-[28px] p-6 text-white font-black outline-none focus:border-brand-500 transition-all shadow-inner" 
                  onKeyDown={(e) => e.key === 'Enter' && setting && confirmSession()}
               />
            </div>
         </div>
         <div className="pt-4">
            <button 
               onClick={confirmSession} 
               disabled={!setting} 
               className="group w-full py-8 bg-white text-slate-950 rounded-[32px] font-black text-2xl uppercase tracking-tighter shadow-2xl disabled:opacity-20 transition-all flex items-center justify-center gap-4 active:scale-95"
            >
               Initiate Link Request <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </button>
            {!setting && <p className="text-center text-[9px] font-black text-brand-500 uppercase tracking-[0.3em] mt-6 animate-pulse">Select Environment to Unlock</p>}
         </div>
      </div>
    </div>
  );
};

export default CoachingSessions;
