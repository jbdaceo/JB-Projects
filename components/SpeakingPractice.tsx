
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encodeAudio, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language, ProfessorPersona } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import OptimizedImage from '../utils/performance';

interface SpeakingPracticeProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

type MainPersona = 'tomas' | 'carolina';

// --- Sound Effects ---
const SFX = {
  SUCCESS: 'https://assets.mixkit.co/sfx/preview/mixkit-audience-light-applause-354.mp3',
  GOAL: 'https://www.myinstants.com/media/sounds/gol-caracol-tv.mp3', 
  BUZZER: 'https://www.myinstants.com/media/sounds/nba-buzzer.mp3', 
  CROWD: 'https://assets.mixkit.co/sfx/preview/mixkit-animated-small-group-applause-523.mp3',
};

// --- Mission Topics Pool (5 Steps Each) ---
const MISSION_TOPICS = [
  { 
    id: 'intro', 
    en: 'Introduction & Greetings', 
    es: 'Introducción y Saludos', 
    steps: ['Say "Hello" & Smile', 'State your name clearly', 'Ask "How are you?"', 'Respond to "Nice to meet you"', 'Say "Goodbye" politely'] 
  },
  { 
    id: 'cafe', 
    en: 'Ordering at a Cafe', 
    es: 'Pidiendo en una Cafetería', 
    steps: ['Greet the barista', 'Order a specific drink', 'Ask for the price', 'Pay and say thank you', 'Wish them a good day'] 
  },
  // ... (Other missions can be added here)
];

// --- Smart Avatar with Lip Sync Visualization (Canvas) ---
interface SmartAvatarProps {
  imageSrc: string;
  isSpeaking: boolean;
  analyser: AnalyserNode | null;
  color: string;
  name: string;
}

const SmartAvatar: React.FC<SmartAvatarProps> = ({ imageSrc, isSpeaking, analyser, color, name }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isSpeaking || !analyser) {
        if (glowRef.current) {
            glowRef.current.style.transform = 'scale(1)';
            glowRef.current.style.boxShadow = 'none';
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
    }
    
    let animationFrameId: number;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      const binCount = Math.min(dataArray.length, 64); 
      for (let i = 0; i < binCount; i++) sum += dataArray[i];
      const average = sum / binCount;
      const normalize = Math.min(1, average / 128); 

      // 1. "Puppet" Jaw movement & Head Bob simulation
      if (glowRef.current) {
          const scaleY = 1 + (normalize * 0.08); 
          const scaleX = 1 + (normalize * 0.02);
          glowRef.current.style.transform = `scale(${scaleX}, ${scaleY})`;
          
          const shadowOpacity = 0.3 + (normalize * 0.6);
          const shadowSize = 20 + (normalize * 40);
          const shadowColor = color.includes('brand') ? '59,130,246' : '236,72,153';
          glowRef.current.style.boxShadow = `0 0 ${shadowSize}px rgba(${shadowColor}, ${shadowOpacity})`;
      }

      // 2. Digital Voice Waveform on Mouth Area
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (average > 5) { 
                ctx.beginPath();
                const centerY = canvas.height / 2;
                ctx.moveTo(0, centerY);
                
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'white';

                for (let i = 0; i < canvas.width; i++) {
                    const xProgress = i / canvas.width;
                    const envelope = Math.sin(xProgress * Math.PI); 
                    
                    const freq1 = 0.3;
                    const freq2 = 0.7;
                    const phase = Date.now() / 60;
                    
                    const displacement = (
                        Math.sin(i * freq1 + phase) * 0.5 + 
                        Math.sin(i * freq2 - phase * 1.5) * 0.5
                    ) * envelope * normalize * (canvas.height * 0.8);

                    ctx.lineTo(i, centerY + displacement);
                }
                ctx.stroke();
            }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSpeaking, analyser, color]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
       <div 
         ref={glowRef}
         className={`relative w-full h-full rounded-full overflow-hidden border-4 transition-transform duration-75 ease-out will-change-transform ${isSpeaking ? (color === 'bg-brand-600' ? 'border-brand-500' : 'border-pink-500') : 'border-white/20'}`}
         style={{ transformOrigin: 'bottom center' }}
       >
          <OptimizedImage 
            src={imageSrc} 
            alt={name} 
            className="w-full h-full object-cover" 
          />
          {isSpeaking && <div className={`absolute inset-0 opacity-10 mix-blend-overlay ${color}`}></div>}
       </div>
       {isSpeaking && (
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[40%] h-[20%] z-20 pointer-events-none"
         >
            <canvas ref={canvasRef} width={100} height={50} className="w-full h-full" />
         </motion.div>
       )}
    </div>
  );
};

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ lang, userTier = 'Novice' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<MainPersona>('tomas');
  const [missionLevel, setMissionLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const [turnCount, setTurnCount] = useState(0);
  const [activeHelper, setActiveHelper] = useState<ProfessorPersona | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isObjectivesCollapsed, setIsObjectivesCollapsed] = useState(false);
  const objectivesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [realtimeText, setRealtimeText] = useState('');
  const [realtimeSource, setRealtimeSource] = useState<'user' | 'model' | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLevel = localStorage.getItem('tmc_speaking_level');
    if (savedLevel) setMissionLevel(parseInt(savedLevel));
    sfxRef.current = new Audio();
    if (window.innerWidth < 768) setIsObjectivesCollapsed(true);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions, realtimeText]);

  const saveProgress = (newLevel: number) => {
    setMissionLevel(newLevel);
    localStorage.setItem('tmc_speaking_level', newLevel.toString());
    window.dispatchEvent(new Event('tmc-level-update'));
  };

  const playSfx = (url: string) => {
    if (sfxRef.current) {
      sfxRef.current.src = url;
      sfxRef.current.volume = 0.5;
      sfxRef.current.play().catch(e => console.log('SFX block', e));
    }
  };

  const showObjectivesBriefly = () => {
    setIsObjectivesCollapsed(false);
    if (objectivesTimeoutRef.current) clearTimeout(objectivesTimeoutRef.current);
    objectivesTimeoutRef.current = setTimeout(() => setIsObjectivesCollapsed(true), 10000);
  };

  const getMissionConfig = (level: number) => {
    const topicIndex = (level - 1) % MISSION_TOPICS.length;
    const topicObj = MISSION_TOPICS[topicIndex];
    return {
      topic: lang === 'es' ? topicObj.es : topicObj.en,
      steps: topicObj.steps,
      instruction: level <= 5 ? "EASY MODE. Slow speed." : "NORMAL MODE."
    };
  };

  const currentMission = useMemo(() => getMissionConfig(missionLevel), [missionLevel, lang]);

  useEffect(() => {
    const stepsDone = Math.min(5, turnCount);
    if (stepsDone > completedSteps.length) {
       const newCompleted = Array.from({length: stepsDone}, (_, i) => i);
       setCompletedSteps(newCompleted);
       if (stepsDone <= 5 && stepsDone > 0) playSfx(SFX.SUCCESS);
       if (stepsDone === 5 && !showLevelUp && isActive) setTimeout(() => handleLevelComplete(), 1500);
    }
  }, [turnCount, completedSteps.length, isActive, showLevelUp]);

  const handleLevelComplete = () => {
      const newLevel = missionLevel + 1;
      const isMegaMilestone = newLevel % 5 === 0;
      if (isMegaMilestone) {
          playSfx(SFX.GOAL);
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      } else {
          playSfx(SFX.CROWD);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      setShowLevelUp(true);
  };

  const handleContinueNextLevel = () => {
      const newLevel = missionLevel + 1;
      saveProgress(newLevel);
      setCompletedSteps([]);
      setTurnCount(0);
      setShowLevelUp(false);
      setTranscriptions([]);
      const nextConfig = getMissionConfig(newLevel);
      const stepsList = nextConfig.steps.map((s, i) => `${i+1}. ${s}`).join('\n');
      const newInstructions = `SYSTEM: LEVEL UP! New Topic: ${nextConfig.topic}. Objectives: ${stepsList}`;
      sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ text: newInstructions }));
      showObjectivesBriefly();
  };

  const text = {
    title: lang === 'es' ? 'Entrenamiento Guiado' : 'Guided Immersion',
    subtitle: lang === 'es' ? 'Misiones con IA' : 'AI Missions',
    start: lang === 'es' ? 'COMENZAR MISIÓN' : 'START MISSION',
    stop: lang === 'es' ? 'Pausar' : 'Pause',
    level: lang === 'es' ? 'Nivel' : 'Level',
    missionComplete: lang === 'es' ? '¡MISIÓN COMPLETADA!' : 'MISSION COMPLETE!',
    continue: lang === 'es' ? 'Continuar' : 'Continue',
    objectives: lang === 'es' ? 'Objetivos de Misión' : 'Mission Objectives',
  };

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(s => s.close());
      sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close();
    if (objectivesTimeoutRef.current) clearTimeout(objectivesTimeoutRef.current);

    setIsActive(false);
    setIsConnecting(false);
    setTurnCount(0);
    setCompletedSteps([]);
    setActiveHelper(null);
    setIsAiSpeaking(false);
    setRealtimeText('');
    setRealtimeSource(null);
    setAnalyserNode(null);
    analyserRef.current = null;
  }, []);

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encodeAudio(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      
      const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
      if (!apiKey) {
        console.error("API Key missing");
        alert("API Key is missing. Check your configuration.");
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const config = currentMission;
      const stepsList = config.steps.map((s, i) => `${i+1}. ${s}`).join('\n');
      
      const systemInstruction = `You are ${selectedPersona === 'tomas' ? 'Professor Tomas Martinez' : 'Carolina'}. Topic: "${config.topic}". Difficulty: ${config.instruction}. Objectives: ${stepsList}. Speak concise.`;

      // 1. Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;

      // CRITICAL FIX: Resume AudioContext immediately on user interaction
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      // 2. Setup Analyzer for Visuals
      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyser.connect(outputCtx.destination);
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setTurnCount(0);
            showObjectivesBriefly();
            sessionPromise.then(session => session.sendRealtimeInput({ text: `SYSTEM: Start. Level: ${missionLevel}.` }));
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(2048, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (showLevelUp) return; 
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => session.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                sourcesRef.current.forEach((node) => { try { node.stop(); } catch(e) {} });
                sourcesRef.current.clear();
                if (outputAudioContextRef.current) nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
                setIsAiSpeaking(false);
                setRealtimeText('');
                return;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64Audio(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              
              if (analyserRef.current) source.connect(analyserRef.current);
              else source.connect(ctx.destination);
              
              source.onended = () => {
                 sourcesRef.current.delete(source);
                 if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
              };
              setIsAiSpeaking(true);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              setRealtimeSource('user');
              setRealtimeText(prev => prev + message.serverContent?.inputTranscription?.text);
              currentInputTransRef.current += message.serverContent?.inputTranscription?.text;
            }
            if (message.serverContent?.outputTranscription) {
              setRealtimeSource('model');
              setRealtimeText(prev => prev + message.serverContent?.outputTranscription?.text);
              currentOutputTransRef.current += message.serverContent?.outputTranscription?.text;
            }

            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTransRef.current;
              const aiOutput = currentOutputTransRef.current;
              setTranscriptions(prev => {
                  const newHistory = [...prev];
                  if (userInput) newHistory.push({ role: 'user', text: userInput });
                  if (aiOutput) newHistory.push({ role: 'model', text: aiOutput });
                  return newHistory;
              });
              if (userInput) setTurnCount(prev => prev + 1);
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
              setRealtimeText('');
              setRealtimeSource(null);
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => { console.error(e); stopSession(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedPersona === 'tomas' ? 'Puck' : 'Kore' } }
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-8 pb-20 relative font-sans">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md rounded-[32px]">
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border-4 border-yellow-400 w-full max-w-md p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
              <div className="mb-6"><motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-8xl inline-block">🏆</motion.div></div>
              <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-2">{text.missionComplete}</h3>
              <p className="text-yellow-400 font-bold text-lg mb-8">{text.level} {missionLevel} → {missionLevel + 1}</p>
              <button onClick={handleContinueNextLevel} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 text-sm md:text-base relative z-10">{text.continue}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between px-2">
        <div>
           <h2 className="text-2xl md:text-4xl font-display font-black text-white tracking-tighter">{text.title}</h2>
           <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">{text.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{text.level}</span>
                <span className="text-2xl font-black text-yellow-400">{missionLevel}</span>
            </div>
            {!isActive && (
            <div className="flex bg-slate-800 rounded-full p-1 border border-white/10">
                {(['tomas', 'carolina'] as MainPersona[]).map(p => (
                <button key={p} onClick={() => setSelectedPersona(p)} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${selectedPersona === p ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{p}</button>
                ))}
            </div>
            )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 relative">
        <div className="flex-1 bg-slate-900/50 rounded-[40px] border border-white/5 relative overflow-hidden flex flex-col shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/chalkboard.png')] opacity-10 pointer-events-none"></div>
          
          <div className="flex-none p-4 md:p-6 flex flex-col md:flex-row justify-between items-start z-10 gap-4 bg-slate-900/50 backdrop-blur-md rounded-t-[40px] border-b border-white/5">
             <div className="flex items-start gap-4 pointer-events-auto">
                <div className="w-20 h-20 md:w-32 md:h-32 transition-all">
                   <SmartAvatar 
                      imageSrc={selectedPersona === 'tomas' 
                        ? "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop" 
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                      }
                      name={selectedPersona === 'tomas' ? 'Professor Tomas' : 'Carolina'}
                      isSpeaking={isAiSpeaking}
                      analyser={analyserNode}
                      color={selectedPersona === 'tomas' ? 'bg-brand-600' : 'bg-pink-600'}
                   />
                </div>
                <div className="mt-2">
                  <p className="font-black text-white text-base md:text-lg">{selectedPersona === 'tomas' ? 'Profe Tomas' : 'Carolina'}</p>
                  <p className="text-[10px] text-brand-400 uppercase tracking-widest font-bold">
                    {isAiSpeaking ? 'Speaking...' : 'Listening...'}
                  </p>
                </div>
             </div>
             
             {isActive && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl w-full md:w-72 pointer-events-auto transition-all">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2 cursor-pointer" onClick={() => setIsObjectivesCollapsed(!isObjectivesCollapsed)}>
                      <h4 className="text-white font-black uppercase tracking-widest text-[10px]">{text.objectives}</h4>
                      <span className="text-slate-400 text-xs">{isObjectivesCollapsed ? '▼' : '▲'}</span>
                  </div>
                  <AnimatePresence>
                    {!isObjectivesCollapsed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                        {currentMission.steps.map((step, idx) => {
                          const isDone = completedSteps.includes(idx);
                          const isCurrent = !isDone && (completedSteps.length === idx);
                          return (
                            <motion.div key={idx} initial={false} animate={{ opacity: isDone ? 0.7 : 1, x: isDone ? 5 : 0 }} className={`flex items-center gap-3 p-1.5 rounded-lg transition-colors ${isCurrent ? 'bg-white/10 border border-white/5' : ''}`}>
                              <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center border transition-colors ${isDone ? 'bg-green-500 border-green-500' : isCurrent ? 'border-yellow-400 animate-pulse' : 'border-slate-600'}`}>{isDone && <span className="text-white text-[10px] font-bold">✓</span>}</div>
                              <span className={`text-[10px] md:text-xs font-bold leading-tight ${isDone ? 'text-green-400 line-through' : isCurrent ? 'text-yellow-100' : 'text-slate-500'}`}>{step}</span>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             )}
          </div>

          <div className="flex-1 px-4 md:px-8 pb-28 overflow-y-auto space-y-4 hide-scrollbar relative z-0 flex flex-col">
            {transcriptions.map((t, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${t.role === 'model' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl shadow-md text-sm md:text-base font-medium leading-relaxed ${t.role === 'model' ? 'bg-white text-slate-900 rounded-tl-none' : 'bg-brand-600 text-white rounded-tr-none'}`}>{t.text}</div>
                </motion.div>
            ))}
            <AnimatePresence>
              {realtimeText && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`flex ${realtimeSource === 'model' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl shadow-md text-sm md:text-base font-medium leading-relaxed ${realtimeSource === 'model' ? 'bg-white text-slate-900 rounded-tl-none' : 'bg-brand-600 text-white rounded-tr-none'}`}><span>{realtimeText}<span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse align-middle"></span></span></div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} className="h-24"></div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={isActive ? stopSession : startSession} disabled={isConnecting} className={`px-10 py-5 pointer-events-auto rounded-full font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 ${isActive ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-white text-slate-900 shadow-white/20'}`}>
              {isConnecting ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : <><span className="text-xl">{isActive ? '⏹' : '▶'}</span>{isActive ? text.stop : text.start}</>}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;
