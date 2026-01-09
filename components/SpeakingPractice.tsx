import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, PhoneOff, SwitchCamera, Video, VideoOff, Star, ShieldCheck, ChevronRight, Zap, Camera, Sparkles, X, UserCheck, Volume2, Info, Headphones } from 'lucide-react';
import OptimizedImage, { triggerHaptic } from '../utils/performance';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';

interface MissionStep {
  instruction: string;
  target: string;
  explanation: { en: string; es: string };
}

interface Mission {
  id: string;
  tier: 'Zero' | 'Medallo' | 'Hero';
  goal: string;
  steps: MissionStep[];
}

const CURRICULUM: Mission[] = [
  { 
    id: '1', 
    tier: 'Zero', 
    goal: 'The Airport Greeting', 
    steps: [
      { 
        instruction: 'Greet the customs officer.', 
        target: 'Hello, I am here for a vacation.', 
        explanation: { 
          en: 'Speak clearly and maintain eye contact.', 
          es: 'Saluda con confianza. Recuerda que "vacation" se pronuncia /vei-kei-shon/.' 
        } 
      }
    ]
  },
  { 
    id: '2', 
    tier: 'Medallo', 
    goal: 'Social Paisa Scenarios', 
    steps: [
      { 
        instruction: 'Use local slang with your friends.', 
        target: 'Everything is cool, parce!', 
        explanation: { 
          en: 'Use a relaxed tone for "parce".', 
          es: 'Métele sabor. El "parce" es clave para conectar con la gente en Medellín.' 
        } 
      }
    ]
  }
];

const PERSONAS = [
  { id: 'tomas', name: 'Profe Tomas', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600', voice: 'Fenrir', bio: 'Expert English Mentor', style: 'Encouraging & Academic' },
  { id: 'manuela', name: 'Manuela', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', voice: 'Aoede', bio: 'Slang & Culture Coach', style: 'Dynamic & Urban' }
];

interface SpeakingPracticeProps {
  lang: Language;
  onExit?: () => void;
}

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ lang, onExit }) => {
  const [viewState, setViewState] = useState<'lobby' | 'selection' | 'preflight' | 'briefing' | 'calling'>('lobby');
  const [activePersona, setActivePersona] = useState(PERSONAS[0]);
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeMission = CURRICULUM[currentMissionIdx];
  const activeStep = activeMission.steps[currentStepIdx];

  // CRITICAL: Cleanup all media tracks on unmount (navigation away)
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`[SpeakingPractice] Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    if (userStream) {
      userStream.getTracks().forEach(t => t.stop());
      setUserStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [userStream]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
        audio: true 
      });
      streamRef.current = stream;
      setUserStream(stream);
      setHasCamera(true);
      setHasMic(true);
      triggerHaptic('success');
    } catch (err) {
      console.error("Permissions failed", err);
      alert("Please enable camera and mic to enter the studio.");
    }
  };

  const playProfessorAudio = async (text: string) => {
    setIsSpeaking(true);
    try {
      const base64 = await getPronunciation(text, activePersona.voice);
      if (base64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decodeBase64Audio(base64), audioCtx);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        source.onended = () => setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const startMissionBriefing = () => {
    setViewState('briefing');
    const professorScript = lang === 'es' 
      ? `Hola. Soy ${activePersona.name}. Nuestra misión es: ${activeMission.goal}. ${activeStep.explanation.es}. ¿Listo? Di: "${activeStep.target}"`
      : `Hello. I'm ${activePersona.name}. Our mission is: ${activeMission.goal}. ${activeStep.explanation.en}. Ready? Say: "${activeStep.target}"`;
    playProfessorAudio(professorScript);
  };

  const handleStartRecording = async () => {
    if (!userStream) return;
    setIsRecording(true);
    triggerHaptic('light');
    
    // Simulate real-time volume analysis for visual feedback
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(userStream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!setIsRecording) return;
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setVolume(avg);
      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };
    checkVolume();

    // Auto-stop after 4 seconds and evaluate
    setTimeout(() => {
      setIsRecording(false);
      setShowSuccess(true);
      triggerHaptic('success');
      audioCtx.close();
    }, 4000);
  };

  const nextStep = () => {
    setShowSuccess(false);
    if (currentStepIdx < activeMission.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setViewState('lobby');
      setCurrentMissionIdx(prev => (prev + 1) % CURRICULUM.length);
      setCurrentStepIdx(0);
    }
  };

  const handleExitStudio = () => {
    stopAllMedia();
    onExit?.();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black font-sans overflow-hidden h-[100dvh] flex flex-col">
      <AnimatePresence mode="wait">
        {/* VIEW: LOBBY */}
        {viewState === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 bg-gradient-to-b from-slate-900 to-black relative">
            <button onClick={handleExitStudio} className="absolute top-8 left-8 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 border border-white/5"><X size={24}/></button>
            
            <div className="w-40 h-40 bg-brand-600 rounded-[56px] flex items-center justify-center avatar-glow shadow-2xl relative">
              <Headphones size={64} className="text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Vocal Immersion</h2>
              <p className="text-brand-400 font-bold uppercase tracking-[0.4em] text-[10px]">Neural Fluency Lab 2.5</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] max-w-sm w-full space-y-6">
                <div className="flex justify-between items-center px-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Mission</p>
                   <span className="bg-brand-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">{activeMission.tier} Tier</span>
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter">"{activeMission.goal}"</h3>
                <button onClick={() => setViewState('selection')} className="w-full py-6 bg-white text-slate-950 rounded-[28px] font-black text-xl uppercase tracking-tighter shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                   Select Mentor <ChevronRight size={20}/>
                </button>
            </div>
          </motion.div>
        )}

        {/* VIEW: PROFESSOR SELECTION */}
        {viewState === 'selection' && (
          <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-slate-950 p-8 flex flex-col items-center justify-center space-y-12">
             <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Choose Your Mentor</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Personalized linguistic scaffolding</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {PERSONAS.map(p => (
                  <motion.div 
                    key={p.id} 
                    whileHover={{ scale: 1.02 }}
                    onClick={() => { setActivePersona(p); setViewState('preflight'); }}
                    className="bg-slate-900 border border-white/5 p-8 rounded-[48px] cursor-pointer hover:border-brand-500/50 transition-all group relative overflow-hidden"
                  >
                     <div className="flex gap-6 items-center mb-6">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/5">
                           <OptimizedImage src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <h4 className="text-2xl font-black text-white italic">{p.name}</h4>
                           <p className="text-brand-400 text-[10px] font-black uppercase tracking-widest">{p.style}</p>
                        </div>
                     </div>
                     <p className="text-slate-400 text-sm font-medium leading-relaxed">{p.bio}</p>
                     <div className="mt-8 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Select {p.name.split(' ')[1] || p.name}</span>
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 transition-colors"><ChevronRight size={20}/></div>
                     </div>
                  </motion.div>
                ))}
             </div>
             <button onClick={() => setViewState('lobby')} className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Back</button>
          </motion.div>
        )}

        {/* VIEW: PREFLIGHT */}
        {viewState === 'preflight' && (
          <motion.div key="preflight" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-white space-y-10">
            <div className="w-20 h-20 bg-brand-500/20 rounded-3xl flex items-center justify-center text-brand-400 border border-brand-500/30"><Video size={40}/></div>
            <div className="text-center space-y-4 max-w-sm">
               <h3 className="text-3xl font-black tracking-tighter italic uppercase">Studio Check</h3>
               <p className="text-slate-400 text-sm font-medium leading-relaxed">Mentorship with {activePersona.name} requires your visual presence and audio clarity.</p>
            </div>
            <div className="w-full max-w-xs space-y-4">
               <button onClick={requestPermissions} className={`w-full py-6 rounded-[28px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${hasCamera ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-brand-500 text-white shadow-xl'}`}>
                  {hasCamera ? <ShieldCheck size={20}/> : <Camera size={20}/>} {hasCamera ? "System Ready" : "Sync Media Devices"}
               </button>
               <button disabled={!hasCamera} onClick={startMissionBriefing} className="w-full py-6 bg-white text-slate-900 rounded-[28px] font-black uppercase tracking-widest text-xs disabled:opacity-20 shadow-2xl">Start Briefing</button>
               <button onClick={() => setViewState('selection')} className="w-full text-[10px] font-black text-slate-600 uppercase tracking-widest pt-4">Change Mentor</button>
            </div>
          </motion.div>
        )}

        {/* VIEW: BRIEFING & CALLING */}
        {(viewState === 'briefing' || viewState === 'calling') && (
          <motion.div key="studio-active" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="flex-1 relative flex flex-col overflow-hidden bg-black">
             {/* Professor Feed */}
             <div className="absolute inset-0 z-0">
               <OptimizedImage src={activePersona.avatar} alt={activePersona.name} className={`w-full h-full object-cover transition-all duration-1000 ${isRecording ? 'brightness-50 blur-lg' : 'brightness-90 scale-100'}`} />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
               {isSpeaking && (
                 <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 border-[12px] border-brand-500/20 pointer-events-none" />
               )}
             </div>

             {/* UI: Teleprompter / Briefing */}
             <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
                <AnimatePresence mode="wait">
                  {viewState === 'briefing' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="facetime-glass p-8 rounded-[48px] text-center space-y-6">
                       <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 mx-auto border border-brand-500/10"><Info size={24}/></div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Mission Briefing</h4>
                          <p className="text-xl font-bold text-white leading-relaxed italic">"{lang === 'es' ? activeStep.explanation.es : activeStep.explanation.en}"</p>
                       </div>
                       {!isSpeaking && (
                         <button onClick={() => setViewState('calling')} className="px-10 py-4 bg-brand-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">I'm Ready</button>
                       )}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="facetime-glass p-6 rounded-[32px] flex items-center gap-6">
                       <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white shrink-0"><Volume2 size={28}/></div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Transcription</p>
                          <p className="text-lg font-black text-white italic truncate tracking-tighter">"{activeStep.target}"</p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* UI: Self View */}
             <motion.div drag dragConstraints={{ left: 20, right: 300, top: 100, bottom: 600 }} className="absolute top-40 right-6 w-32 h-44 md:w-40 md:h-56 bg-slate-900 rounded-[40px] border-2 border-white/10 shadow-2xl z-40 overflow-hidden avatar-3d-depth cursor-move">
                {hasCamera ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror transform -scale-x-100" onLoadedMetadata={(e) => { if(userStream) (e.target as HTMLVideoElement).srcObject = userStream; }} /> : <div className="w-full h-full flex items-center justify-center"><VideoOff className="text-slate-800" size={32}/></div>}
             </motion.div>

             {/* UI: Center Recording Indicator */}
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <AnimatePresence>
                   {isRecording && (
                     <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1.1 }} exit={{ opacity: 0, scale: 1.5 }} className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 bg-brand-500 rounded-full opacity-20 blur-3xl" style={{ transform: `scale(${1 + volume / 50})` }} />
                        <Sparkles className="text-brand-400/40 animate-spin-slow" size={80} />
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>

             {/* UI: Controls */}
             <div className="mt-auto p-10 pb-[env(safe-area-inset-bottom)] z-50 flex flex-col items-center gap-8">
                {isRecording && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
                      <p className="text-xs font-black text-white uppercase tracking-widest animate-pulse">{activePersona.name} is listening...</p>
                      <p className="text-slate-400 text-[10px] font-medium italic">Repeat the target phrase above</p>
                   </motion.div>
                )}

                <div className="facetime-glass p-4 rounded-[48px] flex items-center gap-10 shadow-2xl">
                   <button onClick={() => { stopAllMedia(); setViewState('lobby'); }} className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all"><PhoneOff size={24}/></button>
                   
                   <button onClick={handleStartRecording} disabled={isRecording || isSpeaking} className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all ${isRecording ? 'bg-white text-brand-600 scale-110' : 'bg-brand-600 text-white hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-30'}`}>
                      <Mic size={40} />
                      {isRecording && (
                        <div className="flex gap-1 mt-2">
                           {[1,2,3].map(i => <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.3, delay: i*0.1 }} className="w-1 bg-brand-500 rounded-full" />)}
                        </div>
                      )}
                   </button>

                   <button className="w-14 h-14 bg-white/5 text-white/40 rounded-full flex items-center justify-center border border-white/5"><SwitchCamera size={24}/></button>
                </div>
             </div>

             {/* UI: Success Slide-up */}
             <AnimatePresence>
                {showSuccess && (
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-x-0 bottom-0 z-[100] facetime-glass p-12 rounded-t-[64px] text-center space-y-10 shadow-2xl border-t border-white/10">
                     <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
                     <div className="space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20"><Star size={40} fill="currentColor" /></div>
                        <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">Linguistic Sync Complete!</h3>
                        <p className="text-slate-400 text-sm font-medium">Your tone and clarity were excellent. Proceed to the next vector?</p>
                     </div>
                     <div className="flex flex-col gap-4">
                        <button onClick={nextStep} className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 flex items-center justify-center gap-2">Advance Mission <ChevronRight size={18}/></button>
                        <button onClick={() => setShowSuccess(false)} className="w-full py-6 bg-white/5 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">Review Waveform</button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpeakingPractice;