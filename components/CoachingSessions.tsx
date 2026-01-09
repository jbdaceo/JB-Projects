import React, { useState } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Briefcase, Calendar, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

const CoachingSessions: React.FC<{ lang: Language }> = ({ lang }) => {
  const [step, setStep] = useState(1);
  const [setting, setSetting] = useState<'office' | 'social' | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const confirmSession = () => {
    localStorage.setItem('tmc_pending_session', 'true');
    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 max-w-lg mx-auto">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4"><ShieldCheck size={64}/></div>
        <h2 className="text-4xl font-black text-white italic">Session Requested!</h2>
        <p className="text-slate-400 font-medium">Tomas is reviewing your request. Check your Home dashboard for status updates. Get ready for immersion.</p>
        <button className="w-full py-4 bg-brand-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Back to Training</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-24">
      <header className="text-center space-y-2">
        <h2 className="text-5xl font-black text-white tracking-tighter italic">Personal Coaching</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">1-on-1 High Intensity Mentorship</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          onClick={() => setSetting('office')}
          className={`p-10 rounded-[40px] border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-6 ${setting === 'office' ? 'border-brand-500 bg-brand-500/10 shadow-2xl' : 'border-white/5 bg-slate-900/50 opacity-60'}`}
        >
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-4xl shadow-inner"><Briefcase size={40} className="text-blue-400" /></div>
          <div>
            <h3 className="text-2xl font-black text-white italic">Office Setting</h3>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Professional Immersion</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          onClick={() => setSetting('social')}
          className={`p-10 rounded-[40px] border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-6 ${setting === 'social' ? 'border-brand-500 bg-brand-500/10 shadow-2xl' : 'border-white/5 bg-slate-900/50 opacity-60'}`}
        >
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-4xl shadow-inner"><Coffee size={40} className="text-orange-400" /></div>
          <div>
            <h3 className="text-2xl font-black text-white italic">Social Setting</h3>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Casual Fluency</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-slate-900/80 border border-white/5 p-8 rounded-[40px] space-y-8 glass-panel shadow-2xl">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Preferred Date</label>
               <div className="relative">
                  <input type="date" className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold" />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Preferred Time</label>
               <div className="relative">
                  <input type="time" className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold" />
               </div>
            </div>
         </div>
         <button onClick={confirmSession} disabled={!setting} className="w-full py-6 bg-white text-slate-950 rounded-[28px] font-black text-xl uppercase tracking-tighter shadow-2xl disabled:opacity-30 transition-all flex items-center justify-center gap-3">Confirm Appointment <ArrowRight/></button>
      </div>
    </div>
  );
};

export default CoachingSessions;