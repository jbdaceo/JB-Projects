
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encodeAudio, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mic, MicOff, Volume2, ArrowRight, Play, Trophy, RotateCcw, Info, MessageSquare, StopCircle, Zap, User, Flag, CheckCircle, Lock, Coffee } from 'lucide-react';
import OptimizedImage, { triggerHaptic } from '../utils/performance';
import { Tooltip } from './Tooltip';

interface SpeakingPracticeProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

const TOMAS_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop";
const CAROLINA_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop";

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ lang, userTier = 'Novice' }) => {
  // --- STATE ---
  const [currentLevel, setCurrentLevel] = useState(1);
  const [professor, setProfessor] = useState<'tomas' | 'carolina'>('tomas');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Real-time Data
  const [currentChallenge, setCurrentChallenge] = useState<string>(''); 
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'model' | 'system', text: string}[]>([]);
  const [realtimeText, setRealtimeText] = useState('');

  // 5-Mission Block Logic
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestLevelRef = useRef(1); // To track level inside callbacks without closure staleness
  const nextStartTimeRef = useRef<number>(0);
  const isConnectedRef = useRef(false); // Ref for immediate access in loops

  // Load Level and Progress on Mount
  useEffect(() => {
    const savedLevel = localStorage.getItem('tmc_speaking_level_v2');
    const savedMission = localStorage.getItem('tmc_speaking_mission_progress');
    
    if (savedLevel) {
        const lvl = parseInt(savedLevel);
        setCurrentLevel(lvl);
        latestLevelRef.current = lvl;
    }
    
    if (savedMission) {
        setMissionsCompleted(parseInt(savedMission));
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcriptions, realtimeText]);

  // --- AUDIO VISUALIZER ---
  const Visualizer = ({ isSpeaking }: { isSpeaking: boolean }) => (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full opacity-90">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: isSpeaking ? [12, Math.random() * 40 + 16, 12] : [8, 12, 8],
            backgroundColor: isSpeaking ? '#60a5fa' : '#334155' 
          }}
          transition={{ duration: isSpeaking ? 0.15 : 1.5, repeat: Infinity, repeatDelay: isSpeaking ? 0 : 0.1 * i }}
          className="w-3 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.3)]"
        />
      ))}
    </div>
  );

  // --- SESSION MANAGEMENT ---

  const stopSession = useCallback(() => {
    isConnectedRef.current = false;
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current
        .then(s => {
            if (s && typeof s.close === 'function') s.close();
        })
        .catch(() => {}); // Ignore errors on close
      sessionPromiseRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    try {
        if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
    } catch(e) { console.error("Audio cleanup error", e); }
    
    setIsSessionActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    // Do NOT reset missionsCompleted here to preserve "Pick up where left off" state
    setIsBreakTime(false);
  }, []);

  const handleMissionComplete = () => {
      triggerHaptic('success');
      
      setMissionsCompleted(prev => {
          const newVal = prev + 1;
          localStorage.setItem('tmc_speaking_mission_progress', newVal.toString());
          
          // Check if this completes the block of 5
          if (newVal >= 5) {
              setTimeout(() => {
                  setIsBreakTime(true);
                  triggerLevelUp(); // Actually level up now
              }, 1500);
          }
          return newVal;
      });

      setTranscriptions(prev => [...prev, { role: 'system', text: `✨ Mission Complete.` }]);
  };

  const triggerLevelUp = () => {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#10b981'] });
      
      const nextLevel = latestLevelRef.current + 1;
      setCurrentLevel(nextLevel);
      latestLevelRef.current = nextLevel;
      localStorage.setItem('tmc_speaking_level_v2', nextLevel.toString());
      
      // Reset missions for the new level
      setMissionsCompleted(5); // Keep at 5 visually until they click Continue
  };

  const handleContinueAfterBreak = () => {
      setMissionsCompleted(0);
      localStorage.setItem('tmc_speaking_mission_progress', '0');
      setIsBreakTime(false);
      
      // Re-trigger the AI to start the next block
      if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => 
              session.sendRealtimeInput([{ parts: [{ text: `SYSTEM: User is starting Level ${latestLevelRef.current}. Start Mission 1 of 5 for Level ${latestLevelRef.current} immediately.` }] }])
          );
      }
  };

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
    triggerHaptic('heavy');
    setIsSessionActive(true);
    setIsConnecting(true);
    setTranscriptions([]);
    setErrorMsg(null);
    setIsBreakTime(false);
    setCurrentChallenge(lang === 'es' ? 'Conectando...' : 'Connecting...');
    isConnectedRef.current = false;

    // Timeout fail-safe (8 seconds)
    const timeoutId = setTimeout(() => {
        if (isConnecting && !isConnectedRef.current) {
            setErrorMsg(lang === 'es' ? 'Tiempo de espera agotado. Reintentar.' : 'Connection timed out. Retry.');
            stopSession();
        }
    }, 8000);

    try {
      const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
      if (!apiKey) throw new Error("API Key missing");

      // 1. Initialize Audio Contexts immediately
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      // 2. Parallelize Stream & AI Connection
      const ai = new GoogleGenAI({ apiKey });
      
      const targetLang = lang === 'es' ? 'English' : 'Spanish';
      const explainLang = professor === 'tomas' ? 'Spanish' : 'English';
      const voiceName = professor === 'tomas' ? 'Fenrir' : 'Kore';
      const professorName = professor === 'tomas' ? 'Professor Tomas' : 'Carolina';

      // UPDATED PROMPT: Strict 5-mission cycle for the specific level
      const systemInstruction = `
        IDENTITY: You are ${professorName}.
        ORIGIN: ${professor === 'tomas' ? 'Colombia' : 'USA'}.
        CURRENT LEVEL: ${currentLevel} / 500.
        CURRENT MISSION PROGRESS: ${missionsCompleted} / 5.
        TARGET LANGUAGE: ${targetLang} (The language the student must speak).
        EXPLANATION LANGUAGE: ${explainLang} (Your dominant language).

        FORMAT:
        We are doing a cycle of 5 speaking missions appropriate for Level ${currentLevel}.
        If Current Mission Progress is 0, start with Mission 1.
        If Current Mission Progress is 3, start immediately with Mission 4.

        PROTOCOL FOR EVERY TURN:
        1. EXPLAIN: Briefly explain what the student needs to say in ${explainLang}.
        2. DEMONSTRATE: Speak the target phrase clearly in ${targetLang}.
        3. ASK: Ask the student to repeat it (in ${explainLang}).
        
        CRITICAL OUTPUT FORMAT:
        Every time you present a new challenge, you MUST prefix the phrase with "MISSION: ".
        Example: "MISSION: Say 'Good Morning'. ${explainLang === 'Spanish' ? "Para saludar..." : "To greet..."} Good Morning."
        
        VERIFICATION:
        4. Listen to the user's response.
        5. IF CORRECT: Say "CORRECT." or "MUY BIEN." immediately, then move to the next numbered mission.
        6. IF INCORRECT: Explain the mistake in ${explainLang}, say the phrase correctly again in ${targetLang}, and ask them to try again.
        
        Structure: Complete the remaining missions up to 5. Be encouraging.
      `;

      // Start Stream Promise with Noise Cancellation
      const streamPromise = navigator.mediaDevices.getUserMedia({ 
          audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1
          } 
      });

      // Start AI Promise
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            clearTimeout(timeoutId);
            setIsConnecting(false); 
            isConnectedRef.current = true;
            // Send trigger message immediately
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => 
                    session.sendRealtimeInput([{ parts: [{ text: `SYSTEM_TRIGGER: User is at Mission ${missionsCompleted + 1} of 5 for Level ${currentLevel}. Start immediately.` }] }])
                ).catch((e) => console.error("Trigger error", e));
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              const buffer = await decodeAudioData(decodeBase64Audio(base64Audio), ctx);
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              const currentTime = ctx.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                  nextStartTimeRef.current = currentTime;
              }
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              setIsAiSpeaking(true);
              source.onended = () => {
                  if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                      setIsAiSpeaking(false);
                  }
              };
            }

            // Text / Logic Handling
            if (message.serverContent?.outputTranscription) {
              setRealtimeText(prev => prev + message.serverContent?.outputTranscription?.text);
            }
            
            if (message.serverContent?.turnComplete) {
               setRealtimeText((fullText) => {
                   if (fullText) {
                       setTranscriptions(prev => [...prev, { role: 'model', text: fullText }]);
                       
                       // Detect success keywords to increment mission count
                       // "CORRECT" or "MUY BIEN" or "EXCELLENT"
                       if (fullText.match(/(CORRECT|MUY BIEN|EXCELLENT|PERFECT|GENIAL)/i)) {
                           handleMissionComplete();
                       }
                       
                       const missionMatch = fullText.match(/MISSION:\s*([^.!?\n]+[.!?]?)/i);
                       if (missionMatch && missionMatch[1]) {
                           setCurrentChallenge(missionMatch[1].trim());
                       }
                   }
                   return '';
               });
            }
          },
          onclose: () => {
              console.log("Session closed");
              stopSession();
          },
          onerror: (e) => { 
              console.error("Session error:", e);
              setErrorMsg(lang === 'es' ? "Error de conexión." : "Connection error.");
              stopSession(); 
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
          systemInstruction: systemInstruction,
          outputAudioTranscription: { }
        }
      });

      sessionPromiseRef.current = sessionPromise;

      // 3. Connect Stream to Processor only after stream is ready
      const stream = await streamPromise;
      streamRef.current = stream;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        // Use ref to check connection status to avoid closure staleness
        // Also pause sending audio if on break
        if (isConnectedRef.current && sessionPromiseRef.current && !isBreakTime) { 
            const inputData = e.inputBuffer.getChannelData(0);
            sessionPromiseRef.current.then(session => {
                if (session) {
                    session.sendRealtimeInput({ media: createBlob(inputData) });
                }
            }).catch(() => {}); // Silent catch for send errors
        }
      };
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      await sessionPromise; 

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(error);
      setIsConnecting(false);
      setIsSessionActive(false);
      setErrorMsg(error.message || (lang === 'es' ? 'Error al conectar' : 'Failed to connect'));
    }
  };

  // --- RENDER ---

  const currentAvatar = professor === 'tomas' ? TOMAS_AVATAR : CAROLINA_AVATAR;

  return (
    <div className="h-full bg-slate-950 font-sans flex flex-col relative overflow-hidden">
      
      {/* 1. Header / Status Bar */}
      <div className="flex-none p-4 md:p-6 flex items-center justify-between z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
          <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-display flex items-center gap-2">
                  <Trophy className="text-yellow-400" />
                  Level {currentLevel} <span className="text-slate-600 text-sm">/ 500</span>
              </h2>
              {/* Global Progress Bar */}
              <div className="w-48 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-600 transition-all duration-500" style={{ width: `${(currentLevel / 500) * 100}%` }} />
              </div>
          </div>
          
          {isSessionActive && (
              <button 
                onClick={stopSession}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-red-500/30 transition-all flex items-center gap-2"
              >
                  <StopCircle size={16} /> {lang === 'es' ? 'Terminar' : 'End'}
              </button>
          )}
      </div>

      {/* 2. Main Active Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
          
          {/* Start Screen (If not active) */}
          {!isSessionActive && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 max-w-md w-full"
              >
                  <div className="flex justify-center gap-6 mb-4">
                      {/* Tomas Selector */}
                      <button onClick={() => setProfessor('tomas')} className={`relative group transition-all ${professor === 'tomas' ? 'scale-110' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-95'}`}>
                          <div className={`w-28 h-28 rounded-full p-1 ${professor === 'tomas' ? 'bg-gradient-to-br from-yellow-400 to-blue-600 shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'bg-slate-700'}`}>
                              <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-950 bg-slate-800">
                                  <OptimizedImage src={TOMAS_AVATAR} alt="Tomas" className="w-full h-full object-cover" />
                              </div>
                          </div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1 shadow-lg">
                              <span className="text-[10px] font-black uppercase text-yellow-400">Tomas</span>
                              <span className="text-[8px]">🇨🇴</span>
                          </div>
                      </button>

                      {/* Carolina Selector */}
                      <button onClick={() => setProfessor('carolina')} className={`relative group transition-all ${professor === 'carolina' ? 'scale-110' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-95'}`}>
                          <div className={`w-28 h-28 rounded-full p-1 ${professor === 'carolina' ? 'bg-gradient-to-br from-blue-500 to-red-600 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'bg-slate-700'}`}>
                              <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-950 bg-slate-800">
                                  <OptimizedImage src={CAROLINA_AVATAR} alt="Carolina" className="w-full h-full object-cover" />
                              </div>
                          </div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1 shadow-lg">
                              <span className="text-[10px] font-black uppercase text-blue-400">Carolina</span>
                              <span className="text-[8px]">🇺🇸</span>
                          </div>
                      </button>
                  </div>
                  
                  <div>
                      <h3 className="text-3xl font-black text-white mb-2">{professor === 'tomas' ? 'Professor Tomas' : 'Carolina'}</h3>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
                          {professor === 'tomas' 
                            ? (lang === 'es' ? 'Nativo de Colombia. Explica en ESPAÑOL.' : 'Native Colombian. Explains in SPANISH.')
                            : (lang === 'es' ? 'Nativa de USA. Explica en INGLÉS.' : 'Native American. Explains in ENGLISH.')}
                      </p>
                      {/* Resume Progress Indicator */}
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-4">
                          {missionsCompleted > 0 ? 
                              (lang === 'es' ? `Continuar Misión ${missionsCompleted + 1}` : `Continue Mission ${missionsCompleted + 1}`) : 
                              (lang === 'es' ? 'Empezar Misión 1' : 'Start Mission 1')}
                      </p>
                  </div>

                  {errorMsg && (
                      <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-400 text-sm font-bold">
                          {errorMsg}
                      </div>
                  )}

                  <button 
                    onClick={startSession}
                    className="w-full py-5 bg-white text-slate-900 rounded-[20px] font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-3"
                  >
                      <Zap className="text-yellow-500 fill-yellow-500" /> {lang === 'es' ? 'Conectar Rápido' : 'Fast Connect'}
                  </button>
              </motion.div>
          )}

          {/* Active Session UI */}
          {isSessionActive && (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                  
                  {/* Break Modal Overlay */}
                  <AnimatePresence>
                      {isBreakTime && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg"
                          >
                              <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                                      <Coffee className="text-yellow-400" size={32} />
                                  </div>
                                  <h3 className="text-2xl font-black text-white mb-2">{lang === 'es' ? '¡5 Misiones Completas!' : '5 Missions Complete!'}</h3>
                                  <p className="text-green-400 font-bold mb-2 uppercase tracking-wider">{lang === 'es' ? '¡Nivel Subido!' : 'Level Up!'}</p>
                                  <p className="text-slate-400 mb-8">{lang === 'es' ? 'Toma un respiro. Lo estás haciendo genial.' : 'Take a breath. You are doing great.'}</p>
                                  
                                  <button 
                                    onClick={handleContinueAfterBreak}
                                    className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                  >
                                      {lang === 'es' ? 'Siguiente Nivel' : 'Next Level'} <ArrowRight size={20} />
                                  </button>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>

                  {/* Mission Roadmap (Left Side or Top Mobile) */}
                  <div className="absolute left-0 top-0 md:left-4 md:top-1/2 md:-translate-y-1/2 flex flex-row md:flex-col gap-2 z-30 p-2 md:p-0 w-full md:w-auto justify-center">
                      {[1, 2, 3, 4, 5].map((num) => {
                          const isCompleted = num <= missionsCompleted;
                          const isCurrent = num === missionsCompleted + 1;
                          const isLocked = num > missionsCompleted + 1;
                          
                          return (
                              <div key={num} className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${isCurrent ? 'bg-slate-800 border border-white/20 scale-110 shadow-lg' : 'opacity-60'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                                      isCompleted ? 'bg-green-500 text-white' : 
                                      isCurrent ? 'bg-blue-500 text-white animate-pulse' : 
                                      'bg-slate-700 text-slate-500'
                                  }`}>
                                      {isCompleted ? <CheckCircle size={14} /> : isLocked ? <Lock size={12} /> : num}
                                  </div>
                                  <span className="hidden md:block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                      {lang === 'es' ? 'Misión' : 'Mission'} {num}
                                  </span>
                              </div>
                          );
                      })}
                  </div>

                  {/* Connecting Overlay */}
                  {isConnecting && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-[32px]">
                          <div className="animate-spin text-4xl mb-4 text-blue-500">⚡</div>
                          <p className="text-white font-bold animate-pulse text-lg tracking-wide">{lang === 'es' ? 'Conectando...' : 'Connecting...'}</p>
                          <p className="text-slate-400 text-xs mt-2 uppercase tracking-wider">AI Noise Cancellation Active</p>
                      </div>
                  )}

                  <div className="w-full max-w-xl flex flex-col items-center gap-8 relative z-10">
                      {/* Challenge Card (Embedded Prompt) */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl text-center relative overflow-hidden min-h-[160px] flex flex-col justify-center"
                      >
                          {/* Pulse effect behind card if speaking */}
                          {isAiSpeaking && <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />}
                          
                          <div className="flex justify-center mb-4">
                              <span className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase text-white tracking-widest shadow-lg shadow-blue-600/20">
                                  {lang === 'es' ? `Misión ${Math.min(5, missionsCompleted + 1)}` : `Mission ${Math.min(5, missionsCompleted + 1)}`}
                              </span>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-serif text-white leading-tight font-medium">
                              "{currentChallenge || (lang === 'es' ? 'Escucha al profesor...' : 'Listen to the professor...')}"
                          </h3>
                      </motion.div>

                      {/* Avatar & Visualizer */}
                      <div className="relative">
                          <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${isAiSpeaking ? 'border-blue-400 shadow-[0_0_40px_rgba(96,165,250,0.4)] scale-105' : 'border-slate-700'}`}>
                              <OptimizedImage src={currentAvatar} alt="AI" className="w-full h-full object-cover" />
                          </div>
                          {/* Status Badge */}
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-900 shadow-lg flex items-center gap-1 ${isAiSpeaking ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}>
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                  {isAiSpeaking ? 'Speaking' : 'Listening'}
                              </span>
                          </div>
                      </div>

                      <Visualizer isSpeaking={isAiSpeaking} />
                  </div>

              </div>
          )}
      </div>

      {/* 3. Transcript Log (Bottom Anchored) */}
      {isSessionActive && (
          <div className="h-1/3 min-h-[200px] bg-slate-900 border-t border-white/10 flex flex-col">
              <div className="px-6 py-2 bg-slate-950/50 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <MessageSquare size={12} /> Transcript
                  </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth" ref={scrollRef}>
                  {transcriptions.map((t, i) => {
                      const isSystem = t.role === 'system';
                      const isUser = t.role === 'user';
                      const displayText = t.text.replace(/MISSION:\s*/, '');

                      return (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                              {isSystem ? (
                                  <div className="w-full text-center py-2">
                                      <span className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-200 px-4 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                                          {displayText}
                                      </span>
                                  </div>
                              ) : (
                                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium ${
                                      isUser 
                                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                                  }`}>
                                      {displayText}
                                  </div>
                              )}
                          </motion.div>
                      );
                  })}
                  {realtimeText && (
                      <div className="flex justify-start">
                          <div className="max-w-[85%] p-3 rounded-2xl text-sm font-medium bg-slate-800/50 text-slate-400 rounded-tl-none border border-white/5 italic">
                              {realtimeText} <span className="animate-pulse">|</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default SpeakingPractice;
