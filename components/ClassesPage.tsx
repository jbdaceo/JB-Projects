
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, MessageSquare, Users, Settings, ShieldCheck, Activity, Send } from 'lucide-react';

const AI_STUDENTS = [
  { name: "Maria", color: "text-blue-400" },
  { name: "Juan", color: "text-emerald-400" },
  { name: "Kevin", color: "text-amber-400" },
  { name: "Sophie", color: "text-rose-400" },
  { name: "Liam", color: "text-cyan-400" },
  { name: "Alejandro", color: "text-indigo-400" },
  { name: "Kenji", color: "text-pink-400" },
  { name: "Ximena", color: "text-yellow-400" }
];

const AI_COMMENTS = [
  "This verb conjugation is tricky!", "¡Me encanta esta clase!", "Can we see that slide again?",
  "Professor, your explanation is the best.", "El Camino is literally the freedom path.", "Grra-pa-pa-pa! 🚀", 
  "Hello from Bogota!", "Does this work in Business English too?", "Amazing explanation.", 
  "Listening from Medellin!", "Finally, English that makes sense.", "I love the ILS approach.", 
  "Can you repeat the slang part?", "British vs US accents are so different!", 
  "Manuela is teaching great Medellin slang right now.", "I finally understand the context!",
  "Is this on the quiz later?", "The audio quality is perfect today.", "ILS is changing my life."
];

const ClassesPage: React.FC<{ lang: Language }> = ({ lang }) => {
  const [comments, setComments] = useState<{ id: number, user: string, text: string, color: string }[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [userNote, setUserNote] = useState("");
  const commentIdRef = useRef(0);

  // Real-time AI student simulation
  useEffect(() => {
    const generateComment = () => {
      const student = AI_STUDENTS[Math.floor(Math.random() * AI_STUDENTS.length)];
      const text = AI_COMMENTS[Math.floor(Math.random() * AI_COMMENTS.length)];
      const newComment = {
        id: ++commentIdRef.current,
        user: student.name,
        text: text,
        color: student.color
      };
      setComments(prev => [newComment, ...prev].slice(0, 15));
    };

    const intervalTime = isPaused ? 15000 : 3000;
    const interval = setInterval(generateComment, intervalTime);
    return () => clearInterval(interval);
  }, [isPaused]);

  const text = {
    title: lang === 'es' ? 'Transmisión ILS' : 'ILS Global Broadcast',
    desc: lang === 'es' ? 'Clases maestras 24/7. Inmersión total.' : '24/7 Masterclasses. Total Immersion.',
    diagnostic: lang === 'es' ? 'Panel de Diagnóstico' : 'Diagnostic Panel',
    slow: lang === 'es' ? 'Pausar Comentarios' : 'Slow Down Chat',
    resume: lang === 'es' ? 'Resumir Chat' : 'Resume Normal Chat',
    notes: lang === 'es' ? 'Mis Notas' : 'My Notes',
    howTo: lang === 'es' ? 'Mira las clases magistrales en vivo. El chat a la derecha es una comunidad de estudiantes reales y AI. Toma notas personales abajo.' : 'Watch live masterclasses. The chat on the right features real and AI students. Take your own personal notes below.'
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-slate-950 font-sans pb-32">
      {/* Intro Header */}
      <div className="bg-brand-500/10 border border-brand-500/20 p-8 rounded-[48px] flex flex-col md:flex-row items-center gap-6 shadow-xl mb-2">
         <div className="w-16 h-16 bg-brand-500 rounded-[28px] flex items-center justify-center text-white shadow-2xl shrink-0"><Tv size={32}/></div>
         <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{text.title}</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">{text.howTo}</p>
         </div>
      </div>

      <header className="flex flex-wrap justify-between items-end gap-6 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
             <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">{text.desc}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-slate-500 text-[10px] font-black uppercase tracking-widest">
           <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><Users size={14} className="text-brand-400"/> 12.4k tuned in</span>
           <button onClick={() => setShowDiagnostics(!showDiagnostics)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><Settings size={18}/></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="flex-[3] bg-black rounded-[56px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-4 border-white/5 relative group">
           {/* Fallback to Vimeo for stable background playback, fixing YouTube Error 153 */}
           <iframe 
             src="https://player.vimeo.com/video/424876690?autoplay=1&loop=1&autopause=0&background=1" 
             className="w-full h-full absolute inset-0 pointer-events-none scale-105"
             frameBorder="0" 
             allow="autoplay; fullscreen"
             allowFullScreen
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
           
           <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={() => setIsPaused(!isPaused)} 
                className="bg-white/10 backdrop-blur-3xl px-6 py-4 rounded-[24px] border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all shadow-2xl"
              >
                {isPaused ? text.resume : text.slow}
              </button>
           </div>

           {showDiagnostics && (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl p-12 z-50 flex flex-col justify-center items-center text-center space-y-8">
                <Activity size={64} className="text-brand-400 animate-pulse" />
                <h3 className="text-3xl font-black text-white italic">{text.diagnostic}</h3>
                <div className="grid grid-cols-2 gap-4 w-full max-w-lg text-left">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] text-slate-500 uppercase font-black">Feed Health</p><p className="text-emerald-400 font-bold">100% Stable</p></div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] text-slate-500 uppercase font-black">Latency</p><p className="text-brand-400 font-bold">12ms</p></div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] text-slate-500 uppercase font-black">CDN Region</p><p className="text-white font-bold">Global Optimized</p></div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] text-slate-500 uppercase font-black">Config Error 153</p><p className="text-emerald-400 font-bold">Patched</p></div>
                </div>
                <button onClick={() => setShowDiagnostics(false)} className="px-10 py-4 bg-brand-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl">Close Panel</button>
             </motion.div>
           )}
        </div>

        <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-[56px] flex flex-col overflow-hidden glass-panel max-h-[600px] lg:max-h-none shadow-2xl">
           <div className="p-8 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                 <MessageSquare size={20} className="text-brand-400"/>
                 <h3 className="font-black text-white text-xs uppercase tracking-[0.3em]">Live Community</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-500/10 rounded-full border border-brand-500/20">
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-ping" />
                 <span className="text-[8px] font-black text-brand-500 uppercase tracking-widest">Real-time</span>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-8 space-y-6 hide-scrollbar bg-slate-950/20">
              <AnimatePresence initial={false}>
                {comments.map((c) => (
                  <motion.div 
                    key={c.id} 
                    initial={{ opacity: 0, x: 30, scale: 0.9 }} 
                    animate={{ opacity: 1, x: 0, scale: 1 }} 
                    className="flex flex-col gap-1.5"
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest ${c.color}`}>{c.user}</p>
                    <div className="p-4 bg-white/5 rounded-2xl rounded-tl-none border border-white/5 shadow-lg">
                       <p className="text-sm text-slate-200 font-medium leading-relaxed">{c.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>

           <div className="p-6 bg-slate-950/60 border-t border-white/5 backdrop-blur-2xl">
              <div className="relative group">
                 <input 
                    className="w-full bg-white/5 border-2 border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-brand-500/50 pr-16 transition-all placeholder:text-slate-700" 
                    placeholder="Contribute to discussion..." 
                 />
                 <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"><Send size={18}/></button>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-brand-500/10 border-2 border-brand-500/20 p-10 rounded-[48px] flex flex-col md:flex-row items-center gap-10 shadow-2xl">
         <div className="w-20 h-20 bg-brand-500 rounded-[32px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(59,130,246,0.4)] shrink-0"><ShieldCheck size={40}/></div>
         <div className="flex-1 space-y-4">
            <h4 className="text-lg font-black text-white uppercase tracking-[0.2em] italic">{text.notes}</h4>
            <textarea 
               value={userNote}
               onChange={(e) => setUserNote(e.target.value)}
               className="w-full bg-slate-950/50 border border-white/10 rounded-[28px] p-6 text-sm text-slate-300 min-h-[120px] focus:outline-none focus:border-brand-500 transition-all placeholder:text-slate-700"
               placeholder="Write your vocabulary notes or comments about the current masterclass here..."
            />
         </div>
      </div>
    </div>
  );
};

export default ClassesPage;
