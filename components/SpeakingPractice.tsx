
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encodeAudio, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface SpeakingPracticeProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

type Persona = 'tomas' | 'carolina';

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ lang, userTier = 'Novice' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>('tomas');
  
  // Store roles as 'user' | 'model' to allow dynamic translation on render
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  // Localized Challenges
  const challengesData = {
    es: {
        Novice: ['Pedir un Café', 'Preséntate', 'Pedir Direcciones'],
        'Semi Pro': ['Entrevista de Trabajo', 'Queja de Viaje', 'Explicar Pasatiempos'],
        Pro: ['Negociación Salarial', 'Pitch de Proyecto', 'Debate: Ética IA']
    },
    en: {
        Novice: ['Order Coffee', 'Introduce Yourself', 'Ask Directions'],
        'Semi Pro': ['Job Interview Basic', 'Travel Complaint', 'Explain Your Hobbies'],
        Pro: ['Salary Negotiation', 'Tech Project Pitch', 'Debate: AI Ethics']
    }
  };

  const currentChallenges = challengesData[lang][userTier] || challengesData[lang].Novice;

  const text = {
    title: lang === 'es' ? 'Entrenamiento' : 'Training',
    subtitle: lang === 'es' ? 'Feedback Real-Time' : 'Real-Time Feedback',
    you: lang === 'es' ? 'Tú' : 'You',
    start: lang === 'es' ? 'CONVERSAR' : 'START CHAT',
    stop: lang === 'es' ? 'Terminar' : 'Stop',
    micError: lang === 'es' ? 'Activa el micrófono.' : 'Please enable your microphone.',
    quote: lang === 'es' ? '"Habla para crear tu futuro."' : '"Speak your future into existence."',
    challengesTitle: lang === 'es' ? 'Próximos Retos' : 'Upcoming Challenges',
    mission: lang === 'es' ? 'Misión' : 'Mission',
    live: lang === 'es' ? 'En Vivo' : 'Live',
    tomasRole: lang === 'es' ? 'El Profe Paisa (Español/Inglés)' : 'The Paisa Teacher (Spanish/English)',
    carolinaRole: lang === 'es' ? '2nd Gen American (Urban/Slang)' : '2nd Gen American (Urban/Slang)'
  };

  const personasConfig = {
    tomas: {
      name: 'Tomas',
      voice: 'Puck', // Deep Male
      emoji: '🧑🏽‍🏫',
      color: 'bg-brand-600',
      description: text.tomasRole,
      systemPrompt: `You are Professor Tomas Martinez, a native Colombian from Medellín (Paisa). 
      
      ROLE & LANGUAGE PREFERENCE:
      - You prefer to speak primarily in **Spanish (Colombian Paisa dialect)** to explain concepts clearly.
      - You act as a teacher correcting a student.
      - Use Paisa slang naturally: "Parce", "Oiga", "Mijo", "Hágale", "Vamo' con toda", "Qué más pues".
      
      INTERACTION STYLE:
      1. Listen to the student's English.
      2. If their English is incorrect, explain the mistake in **Spanish** (Paisa accent).
      3. Then, demonstrate the correct **English** pronunciation clearly and ask them to repeat it.
      4. Be warm, fatherly, and encouraging. You want them to have a better life through English.
      
      Example: "Oiga mijo, no se dice 'I have 20 years'. En inglés usamos el verbo 'to be'. Diga conmigo: 'I am 20 years old'. ¡Hágale pues!"`
    },
    carolina: {
      name: 'Carolina',
      voice: 'Kore', // Female
      emoji: '🎧',
      color: 'bg-pink-600',
      description: text.carolinaRole,
      systemPrompt: `You are Carolina, a cool, urban 2nd-generation American Latina (20s) with Colombian parents. You are fully American.

      ROLE & LANGUAGE PREFERENCE:
      - You speak perfect **American English** with the latest Gen Z/Urban slang ("no cap", "bet", "slay", "drip", "lit", "vibes").
      - You act like a cool friend, not a formal teacher.
      
      INTERACTION STYLE:
      1. Chat in English naturally. Keep it fast and urban.
      2. If the user makes a mistake, correct them.
      3. CRITICAL: When you explain the correction, switch to a **Colombian Paisa Spanish** accent (which you learned from your parents) to help them understand, then switch back to English immediately.
      4. STRICTLY NO CURSE WORDS. NO INSULTS.
      
      Example: "Yo that vibe is immaculate, no cap. But hey, wait... *switches to Paisa Spanish* Oye parce, pilas pues, no digas 'people is', la gente es plural, ¿si pilla? *switches back to English* So you gotta say 'people are'. Bet?"`
    }
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
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encodeAudio(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const activePersonaConfig = personasConfig[selectedPersona];

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64Audio(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTransRef.current;
              const modelOutput = currentOutputTransRef.current;
              if (userInput || modelOutput) {
                setTranscriptions(prev => [
                  ...prev, 
                  { role: 'user', text: userInput },
                  { role: 'model', text: modelOutput }
                ]);
              }
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: activePersonaConfig.systemPrompt,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activePersonaConfig.voice } }
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      alert(text.micError);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  const activeConfig = personasConfig[selectedPersona];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter">{text.title}</h2>
           <p className="text-slate-500 text-[10px] md:text-lg font-bold uppercase tracking-widest">{text.subtitle}</p>
        </div>
        {isActive && (
          <motion.div 
            layoutId="statusIsland"
            className={`px-4 py-2 bg-slate-800 border border-white/10 rounded-full flex items-center gap-2`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${selectedPersona === 'tomas' ? 'bg-brand-500' : 'bg-pink-500'}`}></span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPersona === 'tomas' ? 'text-brand-400' : 'text-pink-400'}`}>
               {text.live}: {personasConfig[selectedPersona].name}
            </span>
          </motion.div>
        )}
      </header>

      {/* Persona Selector */}
      {!isActive && (
        <div className="grid grid-cols-2 gap-4">
          {(['tomas', 'carolina'] as Persona[]).map((p) => {
            const config = personasConfig[p];
            const isSelected = selectedPersona === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPersona(p)}
                className={`p-4 rounded-3xl border transition-all duration-300 flex items-center gap-4 relative overflow-hidden group ${
                  isSelected 
                    ? `${config.color} border-transparent shadow-lg scale-[1.02]` 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                  {config.emoji}
                </div>
                <div className="text-left relative z-10">
                  <p className={`font-black text-lg leading-none ${isSelected ? 'text-white' : 'text-slate-200'}`}>{config.name}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{config.description}</p>
                </div>
                {isSelected && <div className="absolute inset-0 bg-white/10" />}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col glass-morphism rounded-[40px] md:rounded-[56px] overflow-hidden shadow-2xl relative">
          <div className="flex-1 p-6 md:p-12 overflow-y-auto space-y-6 hide-scrollbar">
            {transcriptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-8">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 6 }}
                  className={`w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-[40px] flex items-center justify-center text-5xl md:text-7xl border border-white/10 shadow-inner ${isActive ? (selectedPersona === 'tomas' ? 'shadow-brand-500/20' : 'shadow-pink-500/20') : ''}`}
                >
                  {activeConfig.emoji}
                </motion.div>
                <p className="text-slate-400 text-sm md:text-xl font-medium max-w-xs leading-relaxed italic">
                  {text.quote}
                </p>
              </div>
            ) : (
              transcriptions.map((t, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${t.role === 'model' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-5 md:p-8 rounded-[32px] ${
                    t.role === 'model' 
                      ? 'bg-white/5 text-slate-100 rounded-tl-none border border-white/5' 
                      : `${activeConfig.color} text-white rounded-tr-none shadow-lg`
                  }`}>
                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${t.role === 'model' ? 'text-slate-400' : 'text-white/60'}`}>
                      {t.role === 'user' ? text.you : activeConfig.name}
                    </p>
                    <p className="text-sm md:text-lg leading-relaxed font-bold">{t.text || '...'}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="p-8 md:p-12 bg-black/20 border-t border-white/5">
            <div className="flex flex-col items-center gap-8">
              {isActive ? (
                <div className="flex flex-col items-center gap-8 w-full">
                  <div className="flex gap-2 h-12 items-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((i, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.05, ease: "linear" }}
                        className={`w-1.5 rounded-full shadow-[0_0_15px_currentColor] ${selectedPersona === 'tomas' ? 'bg-brand-500/60' : 'bg-pink-500/60'}`}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={stopSession}
                    className="px-12 py-4 bg-red-500/20 text-red-500 border border-red-500/30 font-black rounded-3xl text-sm active-scale uppercase tracking-widest"
                  >
                    {text.stop}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startSession}
                  disabled={isConnecting}
                  className={`w-full md:w-auto px-16 py-6 text-white font-black rounded-[32px] shadow-2xl flex items-center justify-center gap-4 text-xl active-scale transition-colors ${selectedPersona === 'tomas' ? 'bg-brand-600 shadow-brand-500/20' : 'bg-pink-600 shadow-pink-500/20'}`}
                >
                  {isConnecting ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-2xl">⚡</span>
                      {text.start}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col w-96 space-y-6">
           <div className="glass-morphism p-8 rounded-[40px] border border-white/5">
              <h3 className="font-black text-white text-xl mb-6">{text.challengesTitle}</h3>
              <div className="space-y-4">
                 {currentChallenges.map((r, i) => (
                   <div key={i} className={`p-4 bg-white/5 rounded-2xl border border-white/5 transition-all cursor-pointer ${selectedPersona === 'tomas' ? 'hover:border-brand-500/30' : 'hover:border-pink-500/30'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedPersona === 'tomas' ? 'text-brand-400' : 'text-pink-400'}`}>{text.mission} {i+1}</p>
                      <p className="text-slate-100 font-bold text-sm">{r}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;
