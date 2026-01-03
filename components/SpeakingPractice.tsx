
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encodeAudio, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface SpeakingPracticeProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

type Persona = 'tomas' | 'carolina';

interface Challenge {
  id: number;
  text: string;
  difficulty: number;
}

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ lang, userTier = 'Novice' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>('tomas');
  const [showMobileChallenges, setShowMobileChallenges] = useState(false);
  
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null); // Keep track of the session
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  // --- Dynamic Challenge System ---
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [missionCounter, setMissionCounter] = useState(1);

  // Challenge Generator
  const generateChallenge = (missionNum: number, lang: Language): string => {
    const isEnglishTarget = lang === 'es'; // User speaks Spanish (Native), learns English (Target)
    const level = missionNum;

    // Topics: Travel, Food, Dating, Money, Social Media
    const topicsEn = [
      'Budget Backpacking Strategies',      // Travel
      'Local Street Food Hygiene',          // Food
      'First Date Etiquette abroad',        // Dating
      'Passive Income Streams',             // Money
      'Going Viral on TikTok',              // Social Media
      'Navigating Airport Customs',         // Travel
      'Ordering in Fine Dining',            // Food
      'Long Distance Relationships',        // Dating
      'Salary Negotiation Tips',            // Money
      'Building a Personal Brand',          // Social Media
      'Digital Nomad Visas',                // Travel
      'Dietary Restrictions',               // Food
      'Flirting in a Second Language',      // Dating
      'Cryptocurrency Basics',              // Money
      'Influencer Marketing'                // Social Media
    ];

    const topicsEs = [
      'Estrategias de Mochilero Económico', // Viajes
      'Higiene de Comida Callejera',        // Comida
      'Etiqueta de Primera Cita',           // Citas
      'Flujos de Ingresos Pasivos',         // Dinero
      'Hacerse Viral en TikTok',            // Redes
      'Navegar Aduanas del Aeropuerto',     // Viajes
      'Pedir en Restaurantes de Lujo',      // Comida
      'Relaciones a Larga Distancia',       // Citas
      'Tips de Negociación Salarial',       // Dinero
      'Construir Marca Personal',           // Redes
      'Visas para Nómadas Digitales',       // Viajes
      'Restricciones Dietéticas',           // Comida
      'Coquetear en Otro Idioma',           // Citas
      'Conceptos Básicos de Cripto',        // Dinero
      'Marketing de Influencers'            // Redes
    ];
    
    const verbsEn = ['explain', 'debate', 'critique', 'pitch', 'ask advice on', 'share a story about'];
    const verbsEs = ['explicar', 'debatir', 'criticar', 'vender/pitch', 'pedir consejo sobre', 'contar historia sobre'];

    const constraintsEn = ['using slang', 'politely', 'with confidence', 'asking 2 questions', 'using financial vocabulary', 'like an influencer'];
    const constraintsEs = ['usando jerga', 'cortésmente', 'con confianza', 'haciendo 2 preguntas', 'usando vocabulario financiero', 'como un influencer'];

    // Fixed Intro Levels
    if (level === 1) {
        // Spanish User -> Show Spanish Instruction -> Ask for English
        if (isEnglishTarget) return `Misión 1: Preséntate y menciona tu destino de viaje soñado (en Inglés).`;
        // English User -> Show English Instruction -> Ask for Spanish
        else return `Mission 1: Introduce yourself and name your dream travel destination (in Spanish).`;
    }
    if (level === 2) {
        if (isEnglishTarget) return `Misión 2: Describe tu plato local favorito y sus ingredientes (en Inglés).`;
        else return `Mission 2: Describe your favorite local dish and its ingredients (in Spanish).`;
    }
    if (level === 3) {
        if (isEnglishTarget) return `Misión 3: Pregúntale al coach cómo ganar dinero online en 2024 (en Inglés).`;
        else return `Mission 3: Ask the coach how to make money online in 2024 (in Spanish).`;
    }

    // Procedural Generation for infinite levels
    const topicIndex = level % topicsEn.length;
    const verbIndex = level % verbsEn.length;
    const constraintIndex = level % constraintsEn.length;

    if (isEnglishTarget) {
        // User is Spanish. Instructions should be in Spanish. Task is English.
        let text = `Misión ${level}: Intenta ${verbsEs[verbIndex]} ${topicsEs[topicIndex]}`;
        if (level > 5) text += ` ${constraintsEs[constraintIndex]}`;
        return text + " (en Inglés)";
    } else {
        // User is English. Instructions should be in English. Task is Spanish.
        let text = `Mission ${level}: Attempt to ${verbsEn[verbIndex]} ${topicsEn[topicIndex]}`;
        if (level > 5) text += ` ${constraintsEn[constraintIndex]}`;
        return text + " (in Spanish)";
    }
  };

  // Initialize Challenges
  useEffect(() => {
    const initial: Challenge[] = [];
    for(let i=1; i<=3; i++) {
        initial.push({ id: i, text: generateChallenge(i, lang), difficulty: i });
    }
    setChallenges(initial);
    setMissionCounter(4);
  }, [lang]);

  const activeChallengeText = challenges.length > 0 ? challenges[0].text : '';

  const handleCompleteChallenge = (id: number) => {
    // 1. Update State
    let nextMissionText = '';
    setChallenges(prev => {
        const filtered = prev.filter(c => c.id !== id);
        const nextId = missionCounter;
        nextMissionText = generateChallenge(nextId, lang);
        const newChallenge = {
            id: nextId,
            text: nextMissionText,
            difficulty: nextId
        };
        return [...filtered, newChallenge];
    });
    setMissionCounter(prev => Math.min(prev + 1, 1000));
    setShowMobileChallenges(false); 

    // 2. Notify AI if session is active
    if (isActive && sessionPromiseRef.current) {
        // We use a text input to simulate a "System update" or a user context injection
        sessionPromiseRef.current.then(session => {
             // We format this as a system prompt injected via the data channel (simulated as text)
             // This tells the model the context has shifted.
             const updatePrompt = `SYSTEM UPDATE: The user has successfully completed the previous mission! 
             The NEW MISSION is: "${challenges.length > 0 ? challenges[1]?.text : nextMissionText}". 
             Congratulate them warmly.
             IMPORTANT: The user's mission instructions are in their NATIVE language, but they must perform it in the TARGET language.
             Guide them to complete this new mission in the TARGET language immediately.
             READ THE NEW MISSION OUT LOUD NOW.`;
             
             session.sendRealtimeInput({ text: updatePrompt });
        });
    }
  };

  const text = {
    title: lang === 'es' ? 'Entrenamiento' : 'Immersion Training',
    subtitle: lang === 'es' ? 'Feedback Real-Time' : 'Real-Time Feedback',
    you: lang === 'es' ? 'Tú' : 'You',
    start: lang === 'es' ? 'CONVERSAR' : 'START CHAT',
    stop: lang === 'es' ? 'Terminar' : 'Stop',
    micError: lang === 'es' ? 'Activa el micrófono.' : 'Please enable your microphone.',
    quote: lang === 'es' ? '"Habla para crear tu futuro."' : '"Speak to open new worlds."',
    challengesTitle: lang === 'es' ? 'Próximos Retos' : 'Upcoming Challenges',
    mission: lang === 'es' ? 'Misión' : 'Mission',
    activeMission: lang === 'es' ? 'Misión Activa' : 'Active Mission',
    live: lang === 'es' ? 'En Vivo' : 'Live',
    tomasRole: lang === 'es' ? 'El Profe Paisa (Español/Inglés)' : 'The Immersion Coach (Spanish Native)',
    carolinaRole: lang === 'es' ? 'American (Urban/Slang)' : 'The Heritage Guide (Spanglish)',
    viewMissions: lang === 'es' ? 'Ver Misiones' : 'View Missions',
    close: lang === 'es' ? 'Cerrar' : 'Close'
  };

  // Dynamic Persona Configuration based on Language
  const personasConfig = useMemo(() => {
    const currentMissionContext = activeChallengeText 
      ? `CURRENT ACTIVE MISSION: "${activeChallengeText}". Your absolute priority is to help the user complete this specific mission in the TARGET language.` 
      : `CURRENT ACTIVE MISSION: Encourage the user to pick a topic (Travel, Food, Dating, Money, Social Media).`;

    if (lang === 'es') {
       // --- USER IS SPANISH SPEAKER LEARNING ENGLISH ---
       return {
        tomas: {
          name: 'Tomas',
          voice: 'Puck', // Deep Male
          emoji: '🇨🇴', // Explicit Colombian Flag
          color: 'bg-brand-600',
          description: 'El Profe Paisa',
          systemPrompt: `You are Professor Tomas Martinez, a native Colombian from Medellín. 
          GOAL: Teach the user ENGLISH.
          ${currentMissionContext}
          
          CORE PERSONALITY: Warm, fatherly, down-to-earth mentor. Very encouraging.
          SAFETY: IGNORE politics, religion, sex (except dating etiquette). Pivot immediately to learning.
          
          BEHAVIOR:
          1. **STARTING**: Read the mission "${activeChallengeText}" out loud to the user in Spanish, then ask them to perform it in ENGLISH.
          2. **GUIDING**: If they speak Spanish, remind them gently: "Inténtalo en inglés (Try in English)".
          3. **HELPING**: If they struggle, give them the English vocabulary they need. "Puedes decir..."
          4. **COMPLETING**: If they do well, say "¡Misión cumplida!" and ask them to mark it as done.

          CORRECTION STYLE (The Sandwich Method):
          1. **Praise first:** "¡Buen intento!"
          2. **Gentle Correction:** Explain the error simply.
          3. **Demonstrate:** Speak the correct English phrase.
          `
        },
        carolina: {
          name: 'Carolina',
          voice: 'Kore', // Female
          emoji: '🇺🇸', // Explicit American Flag
          color: 'bg-pink-600',
          description: 'American Peer',
          systemPrompt: `You are Carolina, a cool American from Miami.
          GOAL: Help the user with CASUAL ENGLISH.
          ${currentMissionContext}

          CORE PERSONALITY: Chill, vibey, supportive friend.
          BEHAVIOR:
          1. **HYPE**: Say "Hey! Let's do this mission: ${activeChallengeText}. Ready to try it in English?"
          2. **ENGAGE**: Ask questions related to the mission (Travel, Dating, Money, Food).
          3. **SUPPORT**: If they don't know a word, just tell them. "Oh, in the US we say..."
          `
        }
       };
    } else {
       // --- USER IS ENGLISH SPEAKER LEARNING SPANISH ---
       return {
        tomas: {
          name: 'Tomas',
          voice: 'Puck',
          emoji: '🇨🇴',
          color: 'bg-yellow-600',
          description: 'Immersion Coach',
          systemPrompt: `You are Professor Tomas Martinez, a native Colombian from Medellín.
          GOAL: Teach the user SPANISH (Colombian Dialect).
          ${currentMissionContext}
          
          CORE PERSONALITY: You are the "Immersion Coach". Patient, persistent, but extremely polite.
          BEHAVIOR:
          1. **STARTING**: Read the mission "${activeChallengeText}" out loud in English, then tell them to do it in SPANISH.
          2. **GUIDING**: If they speak English, say "En español, por favor."
          3. **HELPING**: Provide the Spanish translation if they are stuck.
          `
        },
        carolina: {
          name: 'Carolina',
          voice: 'Kore',
          emoji: '🇺🇸',
          color: 'bg-purple-600',
          description: 'Heritage Friend',
          systemPrompt: `You are Carolina, a bilingual American-Colombian.
          GOAL: Help the user understand Colombian Culture and "Street Spanish".
          ${currentMissionContext}
          
          CORE PERSONALITY: Bridge between cultures. Supportive and fun.
          BEHAVIOR:
          1. **BUDDY**: "Let's crush this mission: ${activeChallengeText}. Give it a shot in Spanish!"
          2. **CONTEXT**: Explain why locals say things a certain way.
          `
        }
       };
    }
  }, [lang, activeChallengeText]);

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

  // Helper to render challenge list
  const renderChallengeList = () => (
    <div className="space-y-4 pr-2">
        <AnimatePresence mode="popLayout">
        {challenges.map((c, idx) => (
            <motion.div 
            key={c.id} 
            layout
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -50 }}
            onClick={() => handleCompleteChallenge(c.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer active:scale-95 group relative overflow-hidden ${
              idx === 0 
                ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            >
            {idx === 0 && <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none" />}
            <div className="flex justify-between items-start mb-1 relative z-10">
                <p className={`text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'text-yellow-400' : (selectedPersona === 'tomas' ? 'text-brand-400' : 'text-pink-400')}`}>
                  {idx === 0 ? '★ ' + text.activeMission : text.mission + ' #' + c.id}
                </p>
                <span className="text-[10px] text-slate-500">+{c.difficulty * 10} XP</span>
            </div>
            <p className={`font-bold text-sm leading-relaxed relative z-10 ${idx === 0 ? 'text-white' : 'text-slate-300'}`}>{c.text}</p>
            <div className="flex justify-end mt-2">
               <span className="text-[9px] bg-white/10 px-2 py-1 rounded text-white font-bold group-hover:bg-green-500 transition-colors">
                 {lang === 'es' ? 'Completar' : 'Complete'} ✓
               </span>
            </div>
            </motion.div>
        ))}
        </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-10 pb-20">
      <style>{`
        @keyframes rgbPulse {
          0% { box-shadow: 0 0 15px rgba(255, 0, 0, 0.5), inset 0 0 10px rgba(255, 0, 0, 0.2); border-color: rgba(255,0,0,0.8); }
          25% { box-shadow: 0 0 15px rgba(0, 255, 0, 0.5), inset 0 0 10px rgba(0, 255, 0, 0.2); border-color: rgba(0,255,0,0.8); }
          50% { box-shadow: 0 0 15px rgba(0, 0, 255, 0.5), inset 0 0 10px rgba(0, 0, 255, 0.2); border-color: rgba(0,0,255,0.8); }
          75% { box-shadow: 0 0 15px rgba(255, 255, 0, 0.5), inset 0 0 10px rgba(255, 255, 0, 0.2); border-color: rgba(255,255,0,0.8); }
          100% { box-shadow: 0 0 15px rgba(255, 0, 0, 0.5), inset 0 0 10px rgba(255, 0, 0, 0.2); border-color: rgba(255,0,0,0.8); }
        }
        .rgb-box {
          animation: rgbPulse 4s infinite linear;
        }
      `}</style>
      
      {/* Mobile Challenges Modal */}
      <AnimatePresence>
        {showMobileChallenges && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md lg:hidden"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[80vh]"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-white flex items-center gap-2">
                             <span className="animate-pulse">🔴</span> {text.challengesTitle}
                        </h3>
                        <button onClick={() => setShowMobileChallenges(false)} className="p-2 bg-white/10 rounded-full text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        {renderChallengeList()}
                    </div>
                    <button onClick={() => setShowMobileChallenges(false)} className="mt-6 w-full py-4 bg-slate-800 rounded-2xl font-black text-white">
                        {text.close}
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
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

      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative">
        <div className="flex-1 flex flex-col glass-morphism rounded-[40px] md:rounded-[56px] overflow-hidden shadow-2xl relative">
          
          {/* Mobile Challenges Toggle - Only visible on small screens inside container */}
          <button 
            onClick={() => setShowMobileChallenges(true)}
            className="lg:hidden absolute top-4 right-4 z-20 px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <span className="animate-pulse text-red-500">🔴</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{text.viewMissions}</span>
          </button>

          {/* Sticky Active Mission Banner (Visible on all screens) */}
          {activeChallengeText && (
             <motion.div 
               initial={{ y: -50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               key={activeChallengeText}
               className="sticky top-0 z-10 bg-gradient-to-r from-yellow-500/90 to-amber-600/90 backdrop-blur-md border-b border-white/10 p-3 shadow-lg flex flex-col items-center justify-center text-center"
             >
                <div className="flex items-center gap-2">
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-950 bg-white/20 px-2 py-0.5 rounded">{text.activeMission}</span>
                   {isActive && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
                <p className="text-white text-sm md:text-base font-bold leading-tight mt-1 px-4 drop-shadow-sm line-clamp-2">
                   {activeChallengeText}
                </p>
                {isActive && (
                    <button 
                        onClick={() => handleCompleteChallenge(challenges[0]?.id)}
                        className="mt-2 text-[10px] font-black bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-white transition-colors border border-white/20"
                    >
                        {lang === 'es' ? 'Completar' : 'Complete'} ✓
                    </button>
                )}
             </motion.div>
          )}

          <div className="flex-1 p-6 md:p-12 overflow-y-auto space-y-6 hide-scrollbar relative">
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

        {/* Desktop Challenges Sidebar - Hidden on mobile/tablet portrait */}
        <div className="hidden lg:flex flex-col w-96 space-y-6">
           <div className="glass-morphism p-8 rounded-[40px] border-2 border-white/10 rgb-box relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-black/40 -z-10"></div>
              <h3 className="font-black text-white text-xl mb-6 flex items-center gap-2">
                <span className="animate-pulse">🔴</span> {text.challengesTitle}
              </h3>
              <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
                 {renderChallengeList()}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;
