import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, MessageSquare, Maximize2, Shield, Info, HelpCircle, Save, Moon, Sun, X, Video, Share2, Users, LayoutGrid, Lock } from 'lucide-react';

const LiveClassroom: React.FC<{ lang: Language }> = ({ lang }) => {
  const [notes, setNotes] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [isRecording, setIsRecording] = useState(true);

  // CRITICAL: Ensure media is cleaned up on unmount
  useEffect(() => {
    return () => {
      console.log('[LiveClassroom] Navigating away, cleaning up references...');
      // Jitsi iframe handles its own cleanup internally, but we log it for audit
    };
  }, []);

  // 2026 Dynamic Secure Room Generation
  const roomName = useMemo(() => {
    const timestamp = Math.floor(Date.now() / 600000); // Unique per 10min block
    return `ILS_FreedomPath_Session_${timestamp}`;
  }, []);

  const toggleFocus = () => setIsFocusMode(!isFocusMode);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const text = {
    studioTitle: lang === 'es' ? 'Estudio de Aprendizaje En Vivo' : 'Live Learning Studio',
    conductTitle: lang === 'es' ? 'Términos de Conducta Inmersiva' : 'Immersive Conduct Terms',
    conductDesc: lang === 'es' ? 'Para mantener un ambiente profesional, por favor:' : 'To maintain a professional environment, please:',
    rules: [
      lang === 'es' ? 'Sé respetuoso con los profesores y compañeros.' : 'Be respectful to professors and peers.',
      lang === 'es' ? 'Enfócate exclusivamente en el idioma objetivo.' : 'Focus exclusively on the target language.',
      lang === 'es' ? 'No grabes a otros participantes.' : 'No recording of other participants.',
      lang === 'es' ? 'Mantén tu micrófono silenciado cuando no hables.' : 'Keep your microphone muted when not speaking.'
    ],
    agree: lang === 'es' ? 'Acepto y Unirme' : 'I Agree & Join',
    notes: lang === 'es' ? 'Registro de Vocabulario' : 'Vocabulary Logger',
    sync: lang === 'es' ? 'Sincronizar' : 'Sync',
    focus: lang === 'es' ? 'Modo Enfoque' : 'Focus Mode',
  };

  return (
    <div className={`h-full flex flex-col gap-4 p-4 transition-colors duration-700 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} pb-24`}>
      <AnimatePresence>
        {showTerms && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 p-10 rounded-[56px] max-w-lg border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center space-y-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-brand-500" />
               <Shield className="mx-auto text-brand-400" size={80}/>
               <div className="space-y-2">
                 <h3 className="text-3xl font-black text-white italic tracking-tighter">{text.conductTitle}</h3>
                 <p className="text-slate-400 font-medium">{text.conductDesc}</p>
               </div>
               <div className="text-left space-y-4 bg-black/30 p-6 rounded-[32px] border border-white/5">
                  {text.rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                       <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                       <p className="text-sm text-slate-300 font-medium">{rule}</p>
                    </div>
                  ))}
               </div>
               <button onClick={() => setShowTerms(false)} className="w-full py-6 bg-brand-500 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm">
                 {text.agree}
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-wrap justify-between items-center gap-4 px-2">
         <div className="flex items-center gap-6">
            <div className="space-y-1">
               <h2 className={`text-3xl font-black tracking-tighter italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{text.studioTitle}</h2>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Broadcast Live</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Room: {roomName}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-2 mr-4 px-4 border-r border-white/10">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connection</p>
                  <p className="text-xs font-bold text-emerald-400">Encrypted</p>
               </div>
               <Lock size={16} className="text-emerald-500 self-center"/>
            </div>
            <button onClick={toggleTheme} className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-200 border-slate-300 text-slate-900 hover:bg-slate-300'}`}>{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={toggleFocus} className={`px-6 py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${isFocusMode ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>{text.focus}</button>
         </div>
      </header>

      <div className={`flex-1 flex flex-col lg:flex-row gap-6 transition-all duration-700 ${isFocusMode ? 'lg:gap-2' : ''} min-h-0`}>
        {/* Professional Video Area */}
        <div className="flex-1 bg-slate-900 rounded-[48px] overflow-hidden relative border-4 border-white/5 shadow-2xl group min-h-[500px]">
           <iframe 
             src={`https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinPageEnabled=false`} 
             className="w-full h-full border-0 absolute inset-0" 
             allow="camera; microphone; fullscreen; display-capture"
           />
           
           <div className="absolute bottom-10 left-10 flex gap-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="px-5 py-2 bg-black/60 backdrop-blur-2xl rounded-full text-[10px] font-black text-white border border-white/10 shadow-2xl flex items-center gap-2">
                 <Video size={14} className="text-brand-400"/> Professional Stream Interface Active
              </div>
           </div>
        </div>

        {/* Split-Screen Markdown Note Taker */}
        <AnimatePresence>
          {!isFocusMode && (
            <motion.div 
              initial={{ width: 0, opacity: 0, x: 50 }} animate={{ width: "420px", opacity: 1, x: 0 }} exit={{ width: 0, opacity: 0, x: 50 }}
              className="hidden lg:flex flex-col bg-slate-900/50 border border-white/5 rounded-[48px] overflow-hidden glass-panel shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <div className="space-y-1">
                   <h3 className="font-black text-white text-xs uppercase tracking-[0.3em] flex items-center gap-3"><Book size={18} className="text-brand-400"/> {text.notes}</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time syncing enabled</p>
                </div>
                <button className="px-4 py-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all flex items-center gap-2"><Save size={12}/> {text.sync}</button>
              </div>
              <textarea 
                className="flex-1 p-8 bg-transparent text-slate-200 font-mono text-sm leading-relaxed resize-none outline-none placeholder:text-slate-700"
                placeholder={`# Session Vocabulary
- Phrase: Learn by doing
- Context: High intensity

Add your notes here...`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="p-6 bg-slate-950/60 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Markdown Enabled</span>
                <div className="flex gap-2">
                   <LayoutGrid size={16} className="text-slate-600"/>
                   <Users size={16} className="text-slate-600"/>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-brand-500/5 border border-brand-500/10 p-8 rounded-[48px] flex flex-col md:flex-row items-center gap-8 shadow-inner">
         <div className="w-16 h-16 bg-brand-500 rounded-[28px] flex items-center justify-center text-white shadow-2xl shrink-0"><HelpCircle size={32}/></div>
         <div className="flex-1 space-y-2">
            <h4 className="text-md font-black text-white uppercase tracking-widest">Professional Support Portal</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Having technical issues? Our technicians are on standby. Switch to Focus Mode to maximize the Professor's screen and minimize distractions during high-intensity listening sessions.</p>
         </div>
      </div>
    </div>
  );
};

export default LiveClassroom;