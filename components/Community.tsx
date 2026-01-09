import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Language, Persona, ChatMsg, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCommunityChat, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { useAnimationVariants } from '../utils/performance';
import { ArrowLeft, MessageSquare, Mic } from 'lucide-react';

// --- Types ---
interface CommunityProps {
  lang: Language;
  onNavigate: (section: AppSection) => void;
}

interface Environment {
  id: string;
  name: string;
  image: string;
  audioUrl: string; 
  type: 'urban' | 'coastal' | 'nature' | 'lounge';
}

const MASCULINE_VOICES = ['Puck', 'Fenrir', 'Charon'];
const FEMININE_VOICES = ['Kore', 'Aoede'];

const US_MALE_NAMES = ["James", "John", "Robert", "Michael"];
const US_FEMALE_NAMES = ["Mary", "Jennifer", "Linda", "Jessica"];

const COL_MALE_NAMES = ["Santiago", "Sebastián", "Mateo", "Alejandro"];
const COL_FEMALE_NAMES = ["Valentina", "Camila", "Mariana", "Valeria"];

const US_PERSONA_TOPICS = ['Tech & AI', 'Movies', 'Sports', 'Music'];
const COL_PERSONA_TOPICS = ['Reggaeton', 'Fútbol', 'Gastronomy', 'Festivals'];

const GRACE_PERIOD = 200; 

// --- EXPERIENCE PRESETS ---
interface Experience {
  id: string;
  title: string;
  desc: string;
  type: 'urban' | 'coastal' | 'nature';
  topic: string;
}

const EXPERIENCES: Experience[] = [
  { id: 'global_cafe', title: 'Global Café', desc: 'Cultural exchange: USA & Colombia', type: 'urban', topic: 'Cultural Differences' },
  { id: 'tech_summit', title: 'Tech Summit', desc: 'Innovators from NY & Medellín', type: 'urban', topic: 'Future of Tech' },
  { id: 'travel_expo', title: 'Travel Expo', desc: 'Discussing Beaches & Cities', type: 'coastal', topic: 'Travel Destinations' }
];

// --- CITY DATA POOLS ---
const ENVIRONMENTS: Record<string, Environment[]> = {
  urban: [
    { id: 'nyc_ts', name: 'Times Square, NYC', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/city_street_traffic.ogg', type: 'urban' },
    { id: 'med_poblado', name: 'El Poblado, Medellín', image: 'https://images.unsplash.com/photo-1599592176462-2775f048d085?q=80&w=1974', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg', type: 'urban' },
  ],
  coastal: [
    { id: 'miami_beach', name: 'South Beach, Miami', image: 'https://images.unsplash.com/photo-1506104494994-44e08f5146c9?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/carnival_atmosphere.ogg', type: 'coastal' },
    { id: 'ctg_walled', name: 'Cartagena Old City', image: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/water/ocean_waves_lapping.ogg', type: 'coastal' },
  ],
  nature: [
    { id: 'central_park', name: 'Central Park, NY', image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/nature/birds_in_forest.ogg', type: 'nature' },
    { id: 'cocora', name: 'Valle de Cocora, COL', image: 'https://images.unsplash.com/photo-1591500330922-3042b1a03a72?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', type: 'nature' },
  ]
};

const generateMixedPersonalities = (): Persona[] => {
  const personalities: Persona[] = [];
  const usedNames = new Set<string>();
  const origins = ['US', 'US', 'COL', 'COL'];
  origins.forEach((origin, i) => {
      const gender = i % 2 === 0 ? 'masculine' : 'feminine';
      let namePool = origin === 'US' ? (gender === 'masculine' ? US_MALE_NAMES : US_FEMALE_NAMES) : (gender === 'masculine' ? COL_MALE_NAMES : COL_FEMALE_NAMES);
      const voicePool = gender === 'masculine' ? MASCULINE_VOICES : FEMININE_VOICES;
      const availableNames = namePool.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)];
      usedNames.add(name);
      personalities.push({
          id: `p-${i}`,
          name: name,
          state: origin === 'US' ? 'USA' : 'Colombia',
          city: origin === 'US' ? 'NY' : 'Medellin',
          uni: 'Uni',
          sportTeam: 'Team',
          food: 'Food',
          slang: origin === 'US' ? ['Cool', 'Awesome'] : ['Parce', 'Chévere'],
          vibe: origin === 'US' ? 'American' : 'Latino',
          topics: [origin === 'US' ? US_PERSONA_TOPICS[i % 4] : COL_PERSONA_TOPICS[i % 4]],
          voice: voicePool[Math.floor(Math.random() * voicePool.length)]
      });
  });
  return personalities.sort(() => Math.random() - 0.5);
};

interface CommunityAvatarProps {
  persona: Persona;
  isSpeaking: boolean;
  isThinking: boolean;
  onScreen: boolean;
  position: { x: number; y: number };
  analyser: AnalyserNode | null;
}

const CommunityAvatar: React.FC<CommunityAvatarProps> = React.memo(({ persona, isSpeaking, isThinking, onScreen, position, analyser }) => {
  const [mouthD, setMouthD] = useState("M40,75 Q50,75 60,75");
  const requestRef = useRef<number>(null);
  const idNum = parseInt(persona.id.split('-')[1] || '0');
  const skinColors = ["#f8d9c0", "#e0ac69", "#8d5524", "#c68642"];
  const hairColors = ["#2d3748", "#4a3025", "#d97706", "#000000"];
  const shirtColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
  const skin = skinColors[idNum % skinColors.length];
  const hair = hairColors[idNum % hairColors.length];
  const shirt = shirtColors[idNum % shirtColors.length];
  
  const animate = useCallback(() => {
    if (isSpeaking && analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 6; i < 60; i++) sum += dataArray[i];
        const average = sum / 54;
        const open = Math.min(15, Math.max(2, average / 8));
        setMouthD(`M40,75 Q50,${75 + open} 60,75 Q50,${75 - (open*0.2)} 40,75`);
    } else {
        setMouthD("M40,75 Q50,77 60,75"); 
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isSpeaking, analyser]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: onScreen ? 1 : 0, scale: isSpeaking ? 1.1 : isThinking ? 1.05 : 1 }}
      className="absolute w-24 h-24 md:w-32 md:h-32 flex flex-col items-center justify-center pointer-events-none"
      style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: isSpeaking ? 50 : 10, transform: 'translate(-50%, -50%)' }}
    >
        <div className={`w-full h-full rounded-full bg-slate-800 border-4 overflow-hidden relative shadow-2xl transition-all duration-300 ${isSpeaking ? 'border-white ring-4 ring-brand-500 ring-opacity-50' : 'border-slate-600'}`}>
             <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" fill="#1e293b" />
                <path d="M20,100 Q50,110 80,100 V120 H20 Z" fill={shirt} />
                <path d="M40,80 L60,80 L60,100 L40,100 Z" fill={skin} />
                <g transform={isSpeaking ? "translate(0, -1)" : "translate(0, 0)"}>
                    <path d="M25,40 Q15,80 30,85 L70,85 Q85,80 75,40 Z" fill={hair} />
                    <rect x="30" y="25" width="40" height="55" rx="18" fill={skin} />
                    <path d="M28,30 Q50,10 72,30 Q72,45 75,35 Q75,15 25,15 Q22,45 22,30 Z" fill={hair} />
                    <circle cx="42" cy="50" r="3" fill="#1f2937" />
                    <circle cx="58" cy="50" r="3" fill="#1f2937" />
                    <path d={mouthD} fill="#9f1239" />
                </g>
             </svg>
        </div>
        <div className="absolute -bottom-6 bg-slate-900 px-3 py-1 rounded-full border border-white/20 shadow-lg z-20 flex flex-col items-center min-w-[80px]">
             <span className="text-[10px] font-black text-white uppercase tracking-widest">{persona.name}</span>
             <span className={`text-[8px] font-bold uppercase tracking-wider ${persona.state === 'USA' ? 'text-blue-400' : 'text-yellow-400'}`}>{persona.state}</span>
        </div>
    </motion.div>
  );
});

const Community: React.FC<CommunityProps> = ({ lang, onNavigate }) => {
  const [hasSelectedMode, setHasSelectedMode] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); 
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [activeTopic, setActiveTopic] = useState('Welcome');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [currentEnv, setCurrentEnv] = useState<Environment | null>(null);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [thinkingPersonaId, setThinkingPersonaId] = useState<string | null>(null);
  const [currentSpeakerText, setCurrentSpeakerText] = useState<string | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const messageQueueRef = useRef<{personaId: string, text: string}[]>([]);
  const lastUserActivityRef = useRef<number>(Date.now());
  const isFetchingRef = useRef(false);
  const isProcessingQueueRef = useRef(false); 
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const personalities = useMemo(() => generateMixedPersonalities(), []);
  const animationVariants = useAnimationVariants();

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    return () => {
        if (ambientAudioRef.current) { ambientAudioRef.current.pause(); ambientAudioRef.current.src = ""; }
        if (audioContextRef.current) { audioContextRef.current.close(); }
    };
  }, []);

  const initAudioContext = useCallback(() => {
      if (!audioContextRef.current) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          setAudioAnalyser(analyser);
      }
      if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
      }
  }, []);

  const fetchAIResponse = useCallback(async (userMsg?: string, currentTopic?: string, env?: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const result = await generateCommunityChat(lang, personalities, chatMessages.slice(-12), userMsg, currentTopic || activeTopic, env);
      if (result.newTopic) setActiveTopic(result.newTopic);
      if (Array.isArray(result.messages)) {
          messageQueueRef.current.push(...result.messages);
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [lang, personalities, chatMessages, activeTopic]);

  const handleExperienceSelect = async (exp: Experience) => {
      setSelectedExperience(exp);
      const pool = ENVIRONMENTS[exp.type] || ENVIRONMENTS['urban'];
      const randomEnv = pool[Math.floor(Math.random() * pool.length)];
      setCurrentEnv(randomEnv);

      if (isVoiceMode) {
          initAudioContext();
          if (ambientAudioRef.current) {
            ambientAudioRef.current.src = randomEnv.audioUrl;
            ambientAudioRef.current.volume = 0.2; 
            ambientAudioRef.current.loop = true;
            try { await ambientAudioRef.current.play(); } catch(e) {}
          }
      }

      const greeter = personalities[Math.floor(Math.random() * personalities.length)];
      const greeting = lang === 'es' ? `¡Hola! Bienvenidos a ${exp.title}. Soy ${greeter.name} de ${greeter.state}.` : `Hey! Welcome to ${exp.title}. I'm ${greeter.name} from ${greeter.state}.`;
      messageQueueRef.current.push({ personaId: greeter.id, text: greeting });
      
      await new Promise(r => setTimeout(r, 150));
      fetchAIResponse(`Start a conversation about ${exp.topic}. Characters should interact with each other (US & COL).`, exp.topic, randomEnv.name);
  };

  useEffect(() => {
    if (!hasSelectedMode || !selectedExperience) return;

    const processor = async () => {
        if (isProcessingQueueRef.current) return;
        if (messageQueueRef.current.length === 0) {
             if (!isFetchingRef.current && Date.now() - lastUserActivityRef.current > 3000) {
                 lastUserActivityRef.current = Date.now();
                 fetchAIResponse("Continue natural conversation", undefined, currentEnv?.name);
             }
             return;
        }
        isProcessingQueueRef.current = true;
        const nextMsg = messageQueueRef.current[0];
        const persona = personalities.find(p => p.id === nextMsg.personaId);
        if (!persona) { messageQueueRef.current.shift(); isProcessingQueueRef.current = false; return; }

        if (!isVoiceMode) {
             await new Promise(r => setTimeout(r, 1500)); 
             setChatMessages(prev => [...prev, {
                  id: Math.random().toString(36).substr(2, 9),
                  userId: persona.id,
                  user: persona.name,
                  state: persona.state,
                  text: nextMsg.text,
                  time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  isUser: false
             }]);
             messageQueueRef.current.shift();
             isProcessingQueueRef.current = false;
        } else {
            setThinkingPersonaId(persona.id);
            try {
                const base64 = await getPronunciation(nextMsg.text, persona.voice);
                setThinkingPersonaId(null);
                if (base64) {
                    initAudioContext();
                    if (audioContextRef.current) {
                        const buffer = await decodeAudioData(decodeBase64Audio(base64), audioContextRef.current);
                        setCurrentSpeakerId(persona.id);
                        setCurrentSpeakerText(nextMsg.text);
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = buffer;
                        if (analyserRef.current) { source.connect(analyserRef.current); analyserRef.current.connect(audioContextRef.current.destination); } 
                        else { source.connect(audioContextRef.current.destination); }
                        source.start();
                        await new Promise(r => setTimeout(r, (buffer.duration * 1000) + GRACE_PERIOD));
                    }
                }
            } catch (e) {} finally {
                setThinkingPersonaId(null); setCurrentSpeakerId(null); setCurrentSpeakerText(null);
                messageQueueRef.current.shift(); isProcessingQueueRef.current = false;
            }
        }
    };
    
    const interval = setInterval(processor, 500);
    return () => clearInterval(interval);
  }, [hasSelectedMode, isVoiceMode, selectedExperience, currentEnv, fetchAIResponse, personalities, initAudioContext]);

  const handleStartVoice = useCallback(() => {
    setIsVoiceMode(true);
    setHasSelectedMode(true);
  }, []);

  const handleStartText = useCallback(() => {
    setIsVoiceMode(false);
    setHasSelectedMode(true);
  }, []);

  const renderExperienceSelector = () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-50">
          <h3 className="text-white font-black text-2xl mb-8 uppercase tracking-widest">{lang === 'es' ? 'ELIGE TU EXPERIENCIA' : 'CHOOSE EXPERIENCE'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
              {EXPERIENCES.map(exp => (
                  <motion.button 
                    key={exp.id} 
                    onClick={() => handleExperienceSelect(exp)} 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="bg-slate-800 p-8 rounded-[40px] border border-slate-600 hover:border-brand-500 transition-all text-white flex flex-col items-center gap-4 cursor-pointer shadow-2xl"
                  >
                      <div className="text-5xl">🌎</div>
                      <div>
                          <div className="font-black text-xl mb-1">{exp.title}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{exp.desc}</div>
                      </div>
                  </motion.button>
              ))}
          </div>
          <button 
            onClick={() => { setHasSelectedMode(false); }}
            className="mt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            Go Back
          </button>
      </div>
  );

  const renderTextMode = () => (
      <div className="flex-1 flex flex-col bg-slate-900 rounded-[40px] overflow-hidden border border-white/5 relative h-full">
          {!selectedExperience ? renderExperienceSelector() : (
              <>
                 <div className="bg-slate-950 p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                         <button 
                            onClick={() => { setSelectedExperience(null); messageQueueRef.current = []; setChatMessages([]); }}
                            className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                         >
                            <ArrowLeft size={16} />
                         </button>
                         <div>
                             <h3 className="font-black text-white text-xl">{selectedExperience.title}</h3>
                             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{currentEnv?.name}</p>
                         </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded uppercase tracking-widest">
                            {isFetchingRef.current ? (lang === 'es' ? 'Generando...' : 'Generating...') : 'Live'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            {chatMessages.length} {chatMessages.length === 1 ? 'msg' : 'msgs'}
                        </span>
                     </div>
                 </div>
                 <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                     {chatMessages.length === 0 && (
                         <div className="text-center text-slate-500 mt-10 italic flex flex-col gap-2">
                             <p>{lang === 'es' ? 'Conectando con la comunidad...' : 'Connecting to community...'}</p>
                         </div>
                     )}
                     {chatMessages.map((msg, i) => (
                         <motion.div key={i} variants={animationVariants.slideUp} initial="hidden" animate="visible" className="flex gap-3">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border-2 shrink-0 ${msg.state === 'USA' ? 'border-blue-500 bg-blue-900' : 'border-yellow-500 bg-yellow-900'}`}>{msg.user.charAt(0)}</div>
                             <div className="flex flex-col max-w-[80%]">
                                 <div className="flex items-baseline gap-2 mb-1"><span className="text-xs font-black text-slate-300 uppercase tracking-widest">{msg.user}</span><span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{msg.state}</span></div>
                                 <div className="bg-slate-800 p-4 rounded-[24px] rounded-tl-none border border-white/5 text-sm text-slate-200 leading-relaxed shadow-lg">{msg.text}</div>
                             </div>
                         </motion.div>
                     ))}
                 </div>
              </>
          )}
      </div>
  );
  
  const renderVoiceMode = () => (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 relative bg-black rounded-[40px] overflow-hidden border-4 border-slate-800 h-full">
          {!selectedExperience ? renderExperienceSelector() : (
              <>
                  <div className="absolute inset-0">{currentEnv?.image && <img src={currentEnv.image} className="w-full h-full object-cover opacity-40 blur-sm" alt="BG" />}</div>
                  <div className="absolute top-6 left-6 z-30">
                     <button 
                        onClick={() => { setSelectedExperience(null); messageQueueRef.current = []; setChatMessages([]); }}
                        className="p-3 bg-black/50 backdrop-blur-xl rounded-2xl text-white hover:bg-black/70 transition-all border border-white/10"
                     >
                        <ArrowLeft size={20} />
                     </button>
                  </div>
                  <div className="absolute inset-0 z-10">
                       {personalities.map((persona, index) => (
                           <CommunityAvatar key={persona.id} persona={persona} isSpeaking={currentSpeakerId === persona.id} isThinking={thinkingPersonaId === persona.id} onScreen={true} position={{ x: 20 + (index * 20), y: 60 }} analyser={audioAnalyser} />
                       ))}
                  </div>
                  {currentSpeakerText && (
                      <div className="absolute bottom-10 left-4 right-4 bg-black/70 p-6 rounded-3xl backdrop-blur-md border border-white/10 text-center z-20 shadow-2xl">
                          <p className="text-white font-medium text-lg leading-relaxed italic"><span className="text-brand-400 font-black mr-2 uppercase tracking-tighter not-italic">{personalities.find(p=>p.id === currentSpeakerId)?.name}:</span>"{currentSpeakerText}"</p>
                      </div>
                  )}
              </>
          )}
      </motion.div>
  );

  return (
    <div className="h-full flex flex-col pb-20 overflow-hidden">
      <audio ref={ambientAudioRef} className="hidden" />
      <header className="flex justify-between items-center p-6 shrink-0">
          <div>
            <h2 className="text-white font-black text-4xl tracking-tighter italic">World Community</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{lang === 'es' ? 'Cultura en Tiempo Real' : 'Real-time Culture'}</p>
          </div>
      </header>
      <div className="flex-1 overflow-hidden relative p-4 lg:p-0">
        {!hasSelectedMode ? (
            <div className="flex flex-col items-center justify-center gap-8 p-4 h-full">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{lang === 'es' ? 'Selecciona Modo' : 'Select Entry Mode'}</h3>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">How do you want to learn today?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                  <button onClick={handleStartVoice} className="p-10 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-[48px] shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/10 flex flex-col items-center group text-center">
                      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform"><Mic size={40}/></div>
                      <span className="text-3xl font-black italic tracking-tighter mb-2">Voice Immersion</span>
                      <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Listen, Speak & Visualize</span>
                  </button>
                  <button onClick={handleStartText} className="p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[48px] shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/10 flex flex-col items-center group text-center">
                      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform"><MessageSquare size={40}/></div>
                      <span className="text-3xl font-black italic tracking-tighter mb-2">Text Studio</span>
                      <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Read, Write & Analyze</span>
                  </button>
                </div>
            </div>
        ) : (
            isVoiceMode ? renderVoiceMode() : renderTextMode()
        )}
      </div>
    </div>
  );
};

export default Community;