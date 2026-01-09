
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, SpeakingMission, SpeakingUserProgress, Professor } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, ShieldCheck, ChevronRight, Zap, Headphones, X, Volume2, Award, Loader2, Play, Users, Target
} from 'lucide-react';
import OptimizedImage, { triggerHaptic } from '../utils/performance';
import { getPronunciation, decodeBase64Audio, decodeAudioData, evaluatePronunciation } from '../services/gemini';
import confetti from 'canvas-confetti';

// --- DATA: PROFESSORS ---
const PROFESSORS: Professor[] = [
  { id: 'p1', name: 'Profe Tomas', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800', voice: 'Fenrir', description: { en: 'Academic mentor with a Colombian heart.', es: 'Mentor académico con corazón colombiano.' } },
  { id: 'p2', name: 'Carolina', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800', voice: 'Kore', description: { en: 'Global business expert with a sharp accent.', es: 'Experta en negocios globales con un acento nítido.' } },
  { id: 'p3', name: 'Yerson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', voice: 'Charon', description: { en: 'Street-smart rhythm specialist. Urban and deep.', es: 'Especialista en ritmo callejero. Urbano y profundo.' } },
  { id: 'p4', name: 'Manuela', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800', voice: 'Zephyr', description: { en: 'Creative soul, focused on expression.', es: 'Alma creativa, enfocada en la expresión.' } }
];

// --- DATA: MISSIONS ---
const MISSIONS: SpeakingMission[] = [
  { 
    id: 'm1', 
    tier: 1, 
    orderIndex: 1, 
    title: { en: 'Vocal Warm-up', es: 'Calentamiento Vocal' }, 
    intro: { en: 'Synchronize your frequency with a basic greeting.', es: 'Sincroniza tu frecuencia con un saludo básico.' }, 
    phrases: [
      { id: 'p1_1', target: 'Hello, how is your day going?', translation: 'Hola, ¿cómo va tu día?', tip: { en: 'Natural flow is key.', es: 'El flujo natural es clave.' }, difficulty: 'Easy' },
      { id: 'p1_2', target: 'I am ready to learn with you.', translation: 'Estoy listo para aprender contigo.', tip: { en: 'Clear pronunciation on ready.', es: 'Pronunciación clara en ready.' }, difficulty: 'Easy' }
    ] 
  },
  {
    id: 'm2',
    tier: 1,
    orderIndex: 2,
    title: { en: 'City Pulse', es: 'Pulso de Ciudad' },
    intro: { en: 'Adapt to the rhythm of the city.', es: 'Adáptate al ritmo de la ciudad.' },
    phrases: [
      { id: 'p2_1', target: 'Where is the best coffee around here?', translation: '¿Dónde está el mejor café por aquí?', tip: { en: 'Inflect at the end.', es: 'Inflexión al final.' }, difficulty: 'Medium' },
      { id: 'p2_2', target: 'The weather is great for a walk.', translation: 'El clima está genial para caminar.', tip: { en: 'Connect weather and is.', es: 'Conecta weather e is.' }, difficulty: 'Medium' }
    ]
  }
];

const SpeakingPractice: React.FC<{ lang: Language; onExit: () => void }> = ({ lang, onExit }) => {
  const [viewState, setViewState] = useState<'SELECT_PROFESSOR' | 'IDLE' | 'IN_SESSION' | 'EVALUATING' | 'FEEDBACK' | 'SUMMARY'>('SELECT_PROFESSOR');
  const [selectedProf, setSelectedProf] = useState<Professor>(PROFESSORS[0]);
  const [progress, setProgress] = useState<SpeakingUserProgress>({ 
    currentMissionId: 'm1', 
    highestCompletedId: '', 
    missionStats: {}, 
    streak: { daysActive: 1, completedToday: 0, lastDate: Date.now() } 
  });
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [lastEval, setLastEval] = useState<{ score: number; feedback: string; wordScores: any[] } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  // If UI is English (lang=en), user is learning Spanish.
  // If UI is Spanish (lang=es), user is learning English.
  const isLearningSpanish = lang === 'en';

  useEffect(() => {
    const saved = localStorage.getItem('tmc_speaking_progress_v7');
    if (saved) setProgress(JSON.parse(saved));
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      // If learning Spanish, listen for Spanish (es-CO). If learning English, listen for English (en-US).
      recognitionRef.current.lang = isLearningSpanish ? 'es-CO' : 'en-US';
      recognitionRef.current.onresult = (event: any) => handleVoiceResult(event.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [lang, isLearningSpanish]);

  const activeMission = MISSIONS.find(m => m.id === progress.currentMissionId) || MISSIONS[0];
  const activePhrase = activeMission.phrases[currentPhraseIdx];

  const targetText = isLearningSpanish ? activePhrase.translation : activePhrase.target;
  const helperText = isLearningSpanish ? activePhrase.target : activePhrase.translation;

  const speakProfessor = async (text: string, callback?: () => void) => {
    setIsSpeaking(true);
    try {
      const base64 = await getPronunciation(text, selectedProf.voice);
      if (base64) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => { setIsSpeaking(false); callback?.(); };
      } else { setIsSpeaking(false); callback?.(); }
    } catch (e) { setIsSpeaking(false); callback?.(); }
  };

  const handleVoiceResult = async (spoke: string) => {
    setViewState('EVALUATING');
    const result = await evaluatePronunciation(targetText, spoke, lang);
    setLastEval(result);
    setViewState('FEEDBACK');
    speakProfessor(result.feedback);
  };

  const nextAction = () => {
    if (currentPhraseIdx < activeMission.phrases.length - 1) {
      setCurrentPhraseIdx(prev => prev + 1);
      setViewState('IN_SESSION');
      setLastEval(null);
    } else {
      setViewState('SUMMARY');
      saveProgression();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const saveProgression = () => {
    const newProgress = { ...progress, highestCompletedId: activeMission.id };
    setProgress(newProgress);
    localStorage.setItem('tmc_speaking_progress_v7', JSON.stringify(newProgress));
    
    // Award stamp
    const stamps = JSON.parse(localStorage.getItem('tmc_passport_stamps') || '[]');
    const newStamp = {
        id: `speaking_${activeMission.id}_${Date.now()}`,
        category: 'skill',
        title: { en: `Master of ${activeMission.title.en}`, es: `Maestro de ${activeMission.title.es}` },
        dateEarned: Date.now(),
        iconKid: '🎙️',
        iconAdult: '🔊',
        points: 200
    };
    localStorage.setItem('tmc_passport_stamps', JSON.stringify([...stamps, newStamp]));
    window.dispatchEvent(new Event('tmc-progress-update'));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 font-sans h-screen overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_#000000_100%)] opacity-95" />
      
      {/* Header HUD */}
      <div className="relative z-10 w-full px-8 pt-8 flex justify-between items-center max-w-7xl">
        <button onClick={onExit} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 border border-white/5 transition-all active:scale-90 flex items-center gap-2 group">
          <X size={20} className="group-hover:rotate-90 transition-transform"/>
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Exit Studio</span>
        </button>
        
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target Mode</span>
              <span className="text-xs font-black text-brand-400 uppercase">{isLearningSpanish ? 'Spanish Learning' : 'English Learning'}</span>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="text-right">
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center justify-end gap-2">
                <ShieldCheck size={12}/> Mission Tutor
              </p>
              <h2 className="text-white font-black text-xs uppercase tracking-[0.3em]">
                SYNC: {activeMission.title[lang]}
              </h2>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl p-8 flex flex-col lg:flex-row gap-12 items-center justify-center relative z-10 overflow-y-auto hide-scrollbar">
        {/* Mentor Stage */}
        <motion.div layout className="relative w-full lg:w-[400px] aspect-[3/4] shrink-0">
          <div className="absolute inset-0 bg-brand-500/10 rounded-[48px] blur-2xl opacity-30" />
          <div className="relative h-full w-full bg-slate-900 rounded-[48px] border-2 border-white/10 shadow-2xl overflow-hidden">
            <OptimizedImage 
              src={selectedProf.avatar} 
              alt={selectedProf.name} 
              className={`w-full h-full object-cover transition-all duration-700 ${isSpeaking ? 'scale-110 brightness-110' : 'scale-100 brightness-75'}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest">Mentor Sync</p>
                </div>
                <h3 className="text-white font-black italic text-2xl uppercase tracking-tighter leading-none">{selectedProf.name}</h3>
              </div>
              {isSpeaking && (
                <div className="flex gap-1 h-6 items-center px-3 bg-brand-500 rounded-full shadow-lg">
                  {[1,2,3].map(i => (
                    <motion.div key={i} animate={{ height: [2, 14, 2] }} transition={{ repeat: Infinity, duration: 0.3, delay: i*0.1 }} className="w-1 bg-white rounded-full" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Area */}
        <div className="flex-1 w-full max-w-2xl min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {viewState === 'SELECT_PROFESSOR' && (
              <motion.div key="sel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                 <div className="space-y-3">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Your Mentor</h1>
                    <p className="text-slate-400 font-medium">Select who will guide your vocal synchronization.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PROFESSORS.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => { setSelectedProf(p); triggerHaptic('light'); }} 
                        className={`p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 text-left ${selectedProf.id === p.id ? 'bg-brand-600/20 border-brand-500' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}
                      >
                         <img src={p.avatar} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                         <div className="min-w-0">
                            <h4 className="text-md font-black text-white italic truncate">{p.name}</h4>
                            <p className="text-[8px] text-slate-500 leading-snug mt-1 uppercase font-bold tracking-widest">{p.description[lang]}</p>
                         </div>
                      </button>
                    ))}
                 </div>
                 <button onClick={() => { setViewState('IDLE'); triggerHaptic('medium'); }} className="w-full py-6 bg-white text-slate-950 rounded-[24px] font-black text-lg uppercase tracking-tighter shadow-2xl hover:bg-slate-100 transition-all active:scale-95">
                    Connect Mentor
                 </button>
              </motion.div>
            )}

            {viewState === 'IDLE' && (
              <motion.div key="idle" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 text-center lg:text-left">
                <div className="space-y-4">
                  <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none">{activeMission.title[lang]}</h1>
                  <p className="text-slate-400 text-lg font-medium max-w-lg">{activeMission.intro[lang]}</p>
                </div>
                <button 
                  onClick={() => { setViewState('IN_SESSION'); triggerHaptic('heavy'); speakProfessor(isLearningSpanish ? "Let's begin." : "Comencemos."); }} 
                  className="px-12 py-7 bg-brand-500 text-white rounded-[32px] font-black text-xl uppercase tracking-tighter shadow-xl hover:bg-brand-400 transition-all flex items-center gap-4 mx-auto lg:mx-0"
                >
                  Initiate Sync <Play fill="currentColor" size={24}/>
                </button>
              </motion.div>
            )}

            {(viewState === 'IN_SESSION' || viewState === 'EVALUATING' || viewState === 'FEEDBACK') && (
              <motion.div key="sess" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="facetime-glass p-12 rounded-[48px] space-y-8 border-white/10 shadow-2xl">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center opacity-40">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sequence {currentPhraseIdx + 1}/{activeMission.phrases.length}</span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-tight">"{targetText}"</h3>
                      <p className="text-slate-500 text-lg font-bold uppercase tracking-widest">{helperText}</p>
                   </div>
                   <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex gap-4 items-start">
                      <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center text-brand-400 shrink-0 mt-0.5"><Zap fill="currentColor" size={16}/></div>
                      <p className="text-slate-300 font-bold leading-relaxed text-sm">{activePhrase.tip[lang]}</p>
                   </div>
                </div>

                <div className="flex justify-center lg:justify-start gap-6 items-center">
                   {viewState === 'EVALUATING' ? (
                     <div className="flex items-center gap-4 text-brand-400 font-black uppercase tracking-widest text-xs animate-pulse">
                        <Loader2 className="animate-spin" /> Analyzing Voice Signature...
                     </div>
                   ) : viewState === 'FEEDBACK' && lastEval ? (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full flex items-center gap-6 facetime-glass p-6 rounded-[32px] border-brand-500/20 shadow-xl">
                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${lastEval.score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'} text-white shrink-0`}>
                           <span className="text-xl font-black">{lastEval.score}</span>
                           <span className="text-[7px] font-black uppercase">Sync</span>
                        </div>
                        <div className="flex-1 space-y-3">
                           <p className="text-slate-200 font-bold text-md leading-tight">"{lastEval.feedback}"</p>
                           <div className="flex gap-3">
                              <button onClick={() => { setViewState('IN_SESSION'); setLastEval(null); }} className="px-4 py-2 bg-white/10 text-white rounded-lg font-black uppercase text-[8px] tracking-widest">Retry</button>
                              <button onClick={nextAction} className="px-6 py-2 bg-brand-500 text-white rounded-lg font-black uppercase tracking-widest text-[8px] flex items-center gap-2">Continue <ChevronRight size={10}/></button>
                           </div>
                        </div>
                      </motion.div>
                   ) : (
                     <div className="flex items-center gap-6">
                        <button 
                          onClick={() => { setIsRecording(true); triggerHaptic('light'); recognitionRef.current?.start(); setViewState('EVALUATING'); }} 
                          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl ${isRecording ? 'bg-white text-brand-600 scale-105' : 'bg-brand-600 text-white hover:scale-105'}`}
                        >
                           <Mic size={32} className={isRecording ? 'animate-pulse' : ''} />
                           <span className="text-[7px] font-black uppercase tracking-widest mt-2">{isRecording ? 'Listening' : 'Tap to Speak'}</span>
                        </button>
                        <button onClick={() => speakProfessor(targetText)} className="w-14 h-14 bg-white/5 text-white/40 rounded-full flex items-center justify-center border border-white/10 hover:text-white transition-all"><Volume2 size={20} /></button>
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {viewState === 'SUMMARY' && (
              <motion.div key="sum" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
                 <div className="w-24 h-24 bg-brand-500 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl animate-bounce"><Award size={48} /></div>
                 <div className="space-y-2">
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Synchronized</h2>
                    <p className="text-slate-400">You earned a new Passport Stamp and 200 XP.</p>
                 </div>
                 <button onClick={onExit} className="w-full py-6 bg-white text-slate-950 rounded-[24px] font-black text-lg uppercase tracking-tighter shadow-xl hover:bg-slate-100 transition-all">Return to World</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;
