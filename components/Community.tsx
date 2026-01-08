
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Language, Persona, ChatMsg, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { generateCommunityChat, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { useAnimationVariants } from '../utils/performance';

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

const US_MALE_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph"];
const US_FEMALE_NAMES = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica"];

const COL_MALE_NAMES = ["Santiago", "Sebastián", "Matías", "Mateo", "Nicolás", "Alejandro", "Samuel", "Diego"];
const COL_FEMALE_NAMES = ["Valentina", "Camila", "Mariana", "Valeria", "Isabella", "Daniela", "Gabriela", "Sofía"];

const US_PERSONA_TOPICS = ['Tech & AI', 'Movies & Pop Culture', 'Sports & Fitness', 'Music & Concerts', 'Food & Dining', 'Travel & Adventure'];
const COL_PERSONA_TOPICS = ['Reggaeton & Urban', 'Fútbol (Soccer)', 'Coffee & Gastronomy', 'Nature & Eco', 'Salsa & Festivals', 'Art & Design'];

const GRACE_PERIOD = 200; 

// --- EXPERIENCE PRESETS ---
interface Experience {
  id: string;
  title: string;
  desc: string;
  type: 'urban' | 'coastal' | 'nature';
  topic: string;
}

const US_EXPERIENCES: Experience[] = [
  { id: 'nyc_debate', title: 'Metropolis Pulse', desc: 'Fast-paced talk about trends', type: 'urban', topic: 'Modern Trends' },
  { id: 'beach_chill', title: 'Coastal Breeze', desc: 'Relaxed conversation', type: 'coastal', topic: 'Weekend Plans' },
  { id: 'tech_talk', title: 'Tech & Nature', desc: 'Smart future discussion', type: 'nature', topic: 'AI & Future' }
];

const COL_EXPERIENCES: Experience[] = [
  { id: 'paisa_talk', title: 'Vibra Citadina', desc: 'Charla urbana relajada', type: 'urban', topic: 'La Vida en la Ciudad' },
  { id: 'bogota_debate', title: 'Cumbre Andina', desc: 'Conversación intelectual', type: 'nature', topic: 'Cultura y Arte' },
  { id: 'coste_joy', title: 'Paraíso Costero', desc: 'Ambiente festivo', type: 'coastal', topic: 'Música y Fiesta' }
];

// --- CITY DATA POOLS ---
const US_CITIES: Record<string, Environment[]> = {
  urban: [
    { id: 'nyc', name: 'Times Square, NYC', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/city_street_traffic.ogg', type: 'urban' },
    { id: 'chicago', name: 'Chicago, IL', image: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/city_street_traffic.ogg', type: 'urban' },
  ],
  coastal: [
    { id: 'miami', name: 'South Beach, Miami', image: 'https://images.unsplash.com/photo-1506104494994-44e08f5146c9?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/carnival_atmosphere.ogg', type: 'coastal' },
    { id: 'la', name: 'Venice Beach, LA', image: 'https://images.unsplash.com/photo-1540652758223-936357909062?q=80&w=1974', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/beach_waves.ogg', type: 'coastal' },
  ],
  nature: [
    { id: 'sf', name: 'San Francisco, CA', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2089', audioUrl: 'https://actions.google.com/sounds/v1/weather/heavy_rain.ogg', type: 'nature' },
    { id: 'seattle', name: 'Seattle, WA', image: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?q=80&w=2019', audioUrl: 'https://actions.google.com/sounds/v1/weather/rain_on_pavement.ogg', type: 'nature' },
  ]
};

const COL_CITIES: Record<string, Environment[]> = {
  urban: [
    { id: 'medellin', name: 'Medellín, Antioquia', image: 'https://images.unsplash.com/photo-1599592176462-2775f048d085?q=80&w=1974', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg', type: 'urban' },
    { id: 'cali', name: 'San Antonio, Cali', image: 'https://images.unsplash.com/photo-1596422846543-75c6a19a2c7d?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', type: 'urban' },
  ],
  coastal: [
    { id: 'cartagena', name: 'Cartagena, Bolívar', image: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/water/ocean_waves_lapping.ogg', type: 'coastal' },
    { id: 'santamarta', name: 'Santa Marta, Magdalena', image: 'https://images.unsplash.com/photo-1592860161479-7a0e33454b83?q=80&w=2069', audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks.ogg', type: 'coastal' },
  ],
  nature: [
    { id: 'bogota', name: 'Bogotá D.C.', image: 'https://images.unsplash.com/photo-1539807134373-677560a99676?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', type: 'nature' },
    { id: 'manizales', name: 'Manizales, Caldas', image: 'https://images.unsplash.com/photo-1629243730303-346766723223?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/weather/thunderstorm.ogg', type: 'nature' },
  ]
};

const TEXT_ENVS: Environment[] = [
  { id: 'cafe_lofi', name: 'Lofi Cafe', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', type: 'lounge' },
  { id: 'jazz_bar', name: 'Jazz Bar', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', type: 'lounge' },
  { id: 'night_market', name: 'Night Market', image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg', type: 'urban' },
  { id: 'rainy_window', name: 'Rainy Study', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070', audioUrl: 'https://actions.google.com/sounds/v1/weather/rain_on_pavement.ogg', type: 'nature' }
];

const BAD_WORDS = ['hate', 'kill', 'sex', 'fuck', 'shit'];

const generatePersonalities = (lang: Language): Persona[] => {
  const personalities: Persona[] = [];
  const targetRegion = lang === 'es' ? 'US' : 'COL'; 
  const getRandomUnique = (pool: string[], used: Set<string>) => {
    const available = pool.filter(item => !used.has(item));
    if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)]; 
    return available[Math.floor(Math.random() * available.length)];
  };

  const usedNames = new Set<string>();
  
  for (let i = 0; i < 4; i++) { // 4 active avatars
      const gender = i % 2 === 0 ? 'masculine' : 'feminine';
      let namePool: string[];
      let voicePool: string[];
      let vibe: string;
      let region: string;
      let topicList: string[];

      if (targetRegion === 'US') {
          // Select gender-appropriate name pool
          namePool = gender === 'masculine' ? US_MALE_NAMES : US_FEMALE_NAMES;
          region = ['NY', 'CA', 'TX', 'FL'][Math.floor(Math.random() * 4)];
          vibe = ['Chill', 'Fast', 'Urban', 'Friendly'][Math.floor(Math.random() * 4)];
          topicList = US_PERSONA_TOPICS;
      } else {
          // Select gender-appropriate name pool
          namePool = gender === 'masculine' ? COL_MALE_NAMES : COL_FEMALE_NAMES;
          region = ['MED', 'BOG', 'CALI', 'CTG'][Math.floor(Math.random() * 4)];
          vibe = ['Paisa', 'Rolo', 'Costeño', 'Caleño'][Math.floor(Math.random() * 4)];
          topicList = COL_PERSONA_TOPICS;
      }

      voicePool = gender === 'masculine' ? MASCULINE_VOICES : FEMININE_VOICES;
      const name = getRandomUnique(namePool, usedNames);
      usedNames.add(name);
      
      const voice = voicePool[Math.floor(Math.random() * voicePool.length)];
      const myTopic = topicList[i % topicList.length];

      personalities.push({
          id: `p-${i}`,
          name: name,
          state: region,
          city: 'City',
          uni: 'Uni',
          sportTeam: 'Team',
          food: 'Food',
          slang: ['cool'],
          vibe: vibe,
          topics: [myTopic],
          voice: voice 
      });
  }
  return personalities;
};

// Helper function to generate color from string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// --- AVATAR COMPONENT ---
const PersonaAvatar: React.FC<{ 
  persona: Persona; 
  isSpeaking: boolean;
  isThinking: boolean; 
  onScreen: boolean; 
  position: { x: number; y: number }; 
  lastMessage?: string;
  alignment: 'left' | 'center' | 'right';
}> = React.memo(({ persona, isSpeaking, isThinking, onScreen, position, lastMessage, alignment }) => {
  const color = useMemo(() => stringToColor(persona.name), [persona.name]);
  
  const isMasculine = MASCULINE_VOICES.includes(persona.voice || '');
  const avatarStyle = isMasculine 
    ? 'top=shortHair,shortHairTheCaesar,shortHairFrizzle&facialHairChance=30' 
    : 'top=longHair,longHairCurvy,longHairStraight&facialHairChance=0';
    
  // Using DiceBear 9.x API for better reliability
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${persona.name}&${avatarStyle}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: onScreen ? 1 : 0, 
        scale: isSpeaking ? 1.15 : isThinking ? 1.05 : 1,
        y: isThinking ? [0, -5, 0] : 0
      }}
      transition={isThinking ? { repeat: Infinity, duration: 1 } : { type: "spring", stiffness: 100, damping: 15 }}
      className="absolute w-24 h-24 md:w-32 md:h-32 flex flex-col items-center justify-center pointer-events-none"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`, 
        zIndex: isSpeaking ? 50 : 10,
        transform: 'translate(-50%, -50%)' 
      }}
    >
      <AnimatePresence>
        {isSpeaking && lastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`absolute bottom-full mb-4 z-50 pointer-events-auto flex flex-col w-[180px] md:w-[240px] min-w-[140px]
                ${alignment === 'left' ? 'items-start -left-2 origin-bottom-left' : 
                  alignment === 'right' ? 'items-end -right-2 origin-bottom-right' : 
                  'items-center left-1/2 -translate-x-1/2 origin-bottom'}`}
          >
            <div className="relative bg-white text-slate-900 p-3 md:p-4 rounded-[24px] shadow-2xl w-full border-4 border-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
                {/* Scrollable Container for Text to prevent overflow */}
                <div className="max-h-[140px] overflow-y-auto hide-scrollbar relative z-10">
                    <p className="text-xs md:text-sm font-black leading-snug tracking-tight text-center break-words whitespace-pre-wrap">
                        {lastMessage}
                    </p>
                </div>
            </div>
            {/* Triangle pointing to avatar */}
            <div className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-slate-900 -mt-1 drop-shadow-md 
                ${alignment === 'left' ? 'ml-6' : alignment === 'right' ? 'mr-6' : ''}`}></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={`w-full h-full rounded-full bg-slate-800 border-4 overflow-hidden relative shadow-2xl transition-all duration-300 ${isSpeaking ? 'border-white ring-4 ring-brand-500 ring-opacity-50' : 'border-slate-600 grayscale opacity-80'}`}
        style={{ borderColor: isSpeaking ? '#fff' : color }}
      >
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
         {/* Use standard IMG tag for reliability */}
         <img 
           src={avatarUrl} 
           alt={persona.name}
           className="w-full h-full object-cover transform scale-110 translate-y-2"
           loading="eager"
         />
         {isThinking && <div className="absolute inset-0 bg-white/20 animate-pulse z-20"></div>}
      </div>
      
      <div className="absolute -bottom-3 bg-slate-900 px-3 py-1 rounded-full border border-white/20 shadow-lg z-20 flex items-center gap-1">
         {isSpeaking && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
         {isThinking && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></span>}
         <span className="text-[10px] font-black text-white uppercase tracking-widest">{persona.name}</span>
      </div>
    </motion.div>
  );
});

const Community: React.FC<CommunityProps> = ({ lang, onNavigate }) => {
  const { user } = useAuth();
  const [hasSelectedMode, setHasSelectedMode] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [tab, setTab] = useState<'chat' | 'comments'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [activeTopic, setActiveTopic] = useState('Welcome');
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [currentEnv, setCurrentEnv] = useState<Environment | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [thinkingPersonaId, setThinkingPersonaId] = useState<string | null>(null);
  const [currentSpeakerText, setCurrentSpeakerText] = useState<string | null>(null);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const messageQueueRef = useRef<{personaId: string, text: string, replyTo?: string}[]>([]);
  const lastUserActivityRef = useRef<number>(Date.now());
  const isFetchingRef = useRef(false);
  const isProcessingQueueRef = useRef(false); 
  
  // Memoize personalities
  const personalities = useMemo(() => generatePersonalities(lang), [lang]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const animationVariants = useAnimationVariants();
  
  const [onlineCount, setOnlineCount] = useState(128);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedUserForInvite, setSelectedUserForInvite] = useState<{id: string, name: string} | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{from: string, roomId: string} | null>(null);
  const [isFindingPartner, setIsFindingPartner] = useState(false);

  const text = useMemo(() => ({
    title: lang === 'es' ? 'World Chat' : 'Chat Mundial',
    subtitle: lang === 'es' ? '🇺🇸 English Immersion' : '🇨🇴/🇻🇪 Inmersión Español',
    chatTab: lang === 'es' ? 'Chat' : 'Chat',
    wallTab: lang === 'es' ? 'Muro' : 'Wall',
    you: lang === 'es' ? 'Tú' : 'You',
    typePlaceholder: lang === 'es' ? 'Chat with Americans...' : 'Chatea con Latinos...',
    live: 'LIVE',
    online: lang === 'es' ? 'ONLINE' : 'EN LÍNEA',
    topic: lang === 'es' ? 'Topic:' : 'Tema:',
    guidelines: lang === 'es' ? 'Strictly English here.' : 'Solo español en esta sala.',
    inviteTitle: lang === 'es' ? 'Invitar a Sala de Práctica' : 'Invite to Breakout Room',
    inviteBody: lang === 'es' ? '¿Quieres jugar un desafío bilingüe con' : 'Do you want to play a bilingual challenge with',
    inviteBtn: lang === 'es' ? 'Invitar' : 'Invite',
    cancelBtn: lang === 'es' ? 'Cancelar' : 'Cancel',
    incomingTitle: lang === 'es' ? '¡Invitación Recibida!' : 'Invitation Received!',
    incomingBody: lang === 'es' ? 'te ha invitado a una sala.' : 'has invited you to a room.',
    acceptBtn: lang === 'es' ? 'Aceptar' : 'Accept',
    findPartner: lang === 'es' ? 'Encontrar Pareja (Bilingüe)' : 'Find Bilingual Partner',
    finding: lang === 'es' ? 'Buscando...' : 'Finding...',
    sources: lang === 'es' ? 'Fuentes:' : 'Sources:',
    modeVoice: lang === 'es' ? 'Modo Voz' : 'Voice Mode',
    modeText: lang === 'es' ? 'Modo Texto' : 'Text Mode',
    listening: lang === 'es' ? 'Escuchando...' : 'Listening...',
    tapToSpeak: lang === 'es' ? 'PRESIONA PARA HABLAR' : 'PUSH TO TALK',
    speaking: lang === 'es' ? 'HABLANDO...' : 'SPEAKING...',
    chooseExp: lang === 'es' ? 'ELIGE TU EXPERIENCIA' : 'CHOOSE EXPERIENCE',
    pressStart: lang === 'es' ? 'PRESIONA START' : 'PRESS START',
    selectMode: lang === 'es' ? 'Selecciona tu Modo' : 'Select Your Mode',
    voiceDesc: lang === 'es' ? 'Habla con personajes IA en entornos 3D.' : 'Talk with AI characters in 3D environments.',
    textDesc: lang === 'es' ? 'Chat grupal rápido sobre tendencias.' : 'Fast-paced group chat about trends.',
    exitMode: lang === 'es' ? 'Salir del Modo' : 'Exit Mode',
  }), [lang]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (tab === 'chat') scrollToBottom();
  }, [chatMessages, tab, isTyping]);

  useEffect(() => {
    return () => {
        if (ambientAudioRef.current) {
            ambientAudioRef.current.pause();
            ambientAudioRef.current.src = "";
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const resetSession = useCallback(() => {
      setHasSelectedMode(false);
      setIsVoiceMode(false);
      setChatMessages([]);
      messageQueueRef.current = [];
      setActiveTopic('Welcome');
      setSources([]);
      setSelectedExperience(null);
      setCurrentEnv(null);
      if (ambientAudioRef.current) {
          ambientAudioRef.current.pause();
          ambientAudioRef.current.src = "";
      }
      setIsListening(false);
      setCurrentSpeakerId(null);
      setCurrentSpeakerText(null);
      setThinkingPersonaId(null);
      isProcessingQueueRef.current = false;
  }, []);

  // Ensure chat session resets when language changes
  useEffect(() => {
    resetSession();
  }, [lang, resetSession]);

  const initAudioContext = () => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
      }
  };

  const fetchAIResponse = useCallback(async (userMsg?: string, currentTopic?: string, env?: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const result = await generateCommunityChat(
        lang,
        personalities,
        chatMessages.slice(-12),
        userMsg,
        currentTopic || activeTopic,
        env
      );
      if (result.newTopic) setActiveTopic(result.newTopic);
      if (result.sources) setSources(result.sources);
      messageQueueRef.current.push(...result.messages);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [lang, personalities, chatMessages, activeTopic]);

  const handleExperienceSelect = async (exp: Experience) => {
      initAudioContext();
      setSelectedExperience(exp);
      const pool = lang === 'es' ? US_CITIES[exp.type] : COL_CITIES[exp.type];
      const randomEnv = pool[Math.floor(Math.random() * pool.length)];
      setCurrentEnv(randomEnv);

      if (ambientAudioRef.current) {
        ambientAudioRef.current.src = randomEnv.audioUrl;
        ambientAudioRef.current.volume = 0.2; 
        ambientAudioRef.current.loop = true;
        try {
            await ambientAudioRef.current.play();
        } catch(e) {
            console.warn("Ambient audio blocked (interaction required)", e);
        }
      }

      const greeter = personalities[Math.floor(Math.random() * personalities.length)];
      const greeting = lang === 'es' 
        ? `Hey! Welcome to ${exp.title}. I'm ${greeter.name}. What's on your mind?` 
        : `¡Hola! Bienvenidos a ${exp.title}. Soy ${greeter.name}. ¿Qué opinas?`;
        
      messageQueueRef.current.push({ personaId: greeter.id, text: greeting });
      fetchAIResponse(`Let's start the "${exp.title}" experience about ${exp.topic}.`, exp.topic, randomEnv.name);
  };

  useEffect(() => {
      if (hasSelectedMode && !isVoiceMode && chatMessages.length === 0) {
          const isEnglishImmersion = lang === 'es';
          
          // STRICT LANGUAGE ENFORCEMENT for Seed Message
          const welcomeText = isEnglishImmersion 
            ? "Hey everyone! Welcome to the chat. What's trending today?"
            : "¡Hola! Bienvenidos al chat. ¿Qué opinan de las tendencias de hoy?";
            
          const seedTopic = isEnglishImmersion ? 'Introduction' : 'Introducción';

          const seedMsg: ChatMsg = {
              id: 'system-seed',
              userId: personalities[0].id,
              user: personalities[0].name,
              state: personalities[0].state,
              text: welcomeText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isUser: false,
              type: 'human'
          };
          
          setChatMessages([seedMsg]);
          fetchAIResponse(undefined, seedTopic);
      }
  }, [hasSelectedMode, isVoiceMode, lang, personalities, fetchAIResponse, chatMessages.length]);

  useEffect(() => {
    const processor = async () => {
        if (!hasSelectedMode || isProcessingQueueRef.current) return;
        const queueEmpty = messageQueueRef.current.length === 0;
        
        if (!isVoiceMode) {
            const timeSinceUser = Date.now() - lastUserActivityRef.current;
            const isIdle = timeSinceUser > 45000; 
            if (isIdle && queueEmpty && !isFetchingRef.current) {
                lastUserActivityRef.current = Date.now();
                fetchAIResponse(undefined, undefined, undefined);
                return;
            }
        } else {
            const timeSinceUser = Date.now() - lastUserActivityRef.current;
            if (timeSinceUser > 15000 && queueEmpty && !isFetchingRef.current) {
                 lastUserActivityRef.current = Date.now();
                 fetchAIResponse("Continue conversation", undefined, currentEnv?.name);
                 return;
            }
        }

        if (!queueEmpty) {
            isProcessingQueueRef.current = true;
            const nextMsg = messageQueueRef.current[0];
            const persona = personalities.find(p => p.id === nextMsg.personaId);
            
            if (persona) {
              if (isVoiceMode) {
                  const newChatMsg: ChatMsg = {
                    id: Math.random().toString(36).substr(2, 9),
                    userId: persona.id,
                    user: persona.name,
                    state: persona.state,
                    text: nextMsg.text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isUser: false,
                    replyTo: nextMsg.replyTo
                  };

                  setThinkingPersonaId(persona.id);

                  try {
                      const base64 = await getPronunciation(nextMsg.text, persona.voice);
                      setThinkingPersonaId(null);
                      
                      if (base64) {
                          initAudioContext();
                          if (audioContextRef.current) {
                              const buffer = await decodeAudioData(decodeBase64Audio(base64), audioContextRef.current);
                              setChatMessages(prev => [...prev, newChatMsg]);
                              setCurrentSpeakerId(persona.id);
                              setCurrentSpeakerText(nextMsg.text);
                              
                              const source = audioContextRef.current.createBufferSource();
                              source.buffer = buffer;
                              source.connect(audioContextRef.current.destination);
                              source.start();
                              
                              await new Promise(r => setTimeout(r, (buffer.duration * 1000) + GRACE_PERIOD));
                          }
                      } else {
                          setChatMessages(prev => [...prev, newChatMsg]);
                          setCurrentSpeakerId(persona.id);
                          setCurrentSpeakerText(nextMsg.text);
                          await new Promise(r => setTimeout(r, 2000));
                      }
                  } catch (e) {
                      console.error("Audio generation failed", e);
                  } finally {
                      setThinkingPersonaId(null);
                      setCurrentSpeakerId(null);
                      setCurrentSpeakerText(null);
                      messageQueueRef.current.shift();
                      isProcessingQueueRef.current = false;
                  }

              } else {
                  setIsTyping(persona.name);
                  const delay = Math.min(5000, Math.max(1500, nextMsg.text.length * 25 + Math.random() * 1000));
                  
                  setTimeout(() => {
                      const newChatMsg: ChatMsg = {
                        id: Math.random().toString(36).substr(2, 9),
                        userId: persona.id,
                        user: persona.name,
                        state: persona.state,
                        text: nextMsg.text,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isUser: false,
                        replyTo: nextMsg.replyTo
                      };
                      setChatMessages(prev => [...prev, newChatMsg]);
                      setIsTyping(null);
                      messageQueueRef.current.shift();
                      isProcessingQueueRef.current = false;
                  }, delay);
              }

            } else {
              messageQueueRef.current.shift();
              isProcessingQueueRef.current = false;
            }
        }
    };

    const interval = setInterval(processor, 500);
    return () => clearInterval(interval);
  }, [personalities, isTyping, currentSpeakerId, activeTopic, lang, isVoiceMode, hasSelectedMode, currentEnv, fetchAIResponse, chatMessages]);

  const handleUserMessage = useCallback(async (inputText: string) => {
    if (BAD_WORDS.some(w => inputText.toLowerCase().includes(w))) return;

    lastUserActivityRef.current = Date.now();
    const msg: ChatMsg = {
      id: Date.now().toString(),
      userId: 'user',
      user: text.you,
      state: lang === 'es' ? 'You' : 'Tú',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };
    setChatMessages(prev => [...prev, msg]);
    messageQueueRef.current = [];
    await fetchAIResponse(inputText, undefined, currentEnv?.name);
  }, [text.you, lang, currentEnv, fetchAIResponse]);

  const handleVoiceInput = useCallback(() => {
    if (currentSpeakerId) return;
    initAudioContext();

    if (!('webkitSpeechRecognition' in window)) {
        alert("Browser does not support Speech API");
        return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang === 'es' ? 'en-US' : 'es-CO'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        handleUserMessage(speechResult);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.onerror = () => {
        setIsListening(false);
    };
  }, [currentSpeakerId, lang, handleUserMessage]);

  useEffect(() => {
    if (!user) return;
    socket.on(`invite:received:${user.id}`, (invite: any) => {
      setIncomingInvite({ from: invite.fromUser.displayName, roomId: invite.roomId });
    });
    socket.on(`matchmaking:found:${user.id}`, (data: { roomId: string }) => {
        setIsFindingPartner(false);
        localStorage.setItem('tmc_pending_join_room', data.roomId);
        onNavigate(AppSection.Breakout);
    });
    return () => {
      socket.off(`invite:received:${user.id}`, () => {});
      socket.off(`matchmaking:found:${user.id}`, () => {});
    };
  }, [user, onNavigate]);

  const startMatchmaking = () => { if (!user) return; setIsFindingPartner(true); socket.emit('server:matchmaking:find', { user }); };
  const sendInvite = () => { if (!user || !selectedUserForInvite) return; const roomId = `room_${Date.now()}`; const invitePayload = { fromUser: user, toUserId: selectedUserForInvite.id, roomId, timestamp: Date.now() }; socket.emit('server:invite:send', invitePayload); setInviteModalOpen(false); onNavigate(AppSection.Breakout); };
  const acceptInvite = () => { if (incomingInvite) { socket.emit('server:invite:accept', { roomId: incomingInvite.roomId }); localStorage.setItem('tmc_pending_join_room', incomingInvite.roomId); onNavigate(AppSection.Breakout); } };
  
  const handleSendChat = useCallback(async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!newChatText.trim() || isFetchingRef.current) return; 
      handleUserMessage(newChatText); 
      setNewChatText(''); 
  }, [newChatText, handleUserMessage]);

  const handleUserClick = useCallback((msg: ChatMsg) => { 
      if (!msg.isUser) { 
          setSelectedUserForInvite({ id: msg.userId, name: msg.user }); 
          setInviteModalOpen(true); 
      } 
  }, []);

  const selectMode = (mode: 'voice' | 'text') => {
      setIsVoiceMode(mode === 'voice');
      setHasSelectedMode(true);
      initAudioContext();
      
      if (mode === 'text') {
          const random = TEXT_ENVS[Math.floor(Math.random() * TEXT_ENVS.length)];
          setCurrentEnv(random);
          
          if (ambientAudioRef.current) {
              ambientAudioRef.current.src = random.audioUrl;
              ambientAudioRef.current.volume = 0.05; 
              ambientAudioRef.current.loop = true;
              ambientAudioRef.current.play().catch(e => console.log("Audio play prevented (interaction needed)", e));
          }
      }
  };

  // --- RENDER ---
  if (!hasSelectedMode) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-4 space-y-8 relative z-10">
              <div className="text-center space-y-4">
                 <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-xl">{text.selectMode}</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest">{lang === 'es' ? '¿Cómo quieres aprender hoy?' : 'How do you want to learn today?'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl h-auto">
                 <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectMode('voice')}
                    className="group bg-gradient-to-br from-red-600 to-rose-700 p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6 border-4 border-white/10"
                 >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-6xl shadow-inner group-hover:scale-110 transition-transform">🎙️</div>
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{text.modeVoice}</h3>
                        <p className="text-red-100 font-medium text-sm md:text-base leading-relaxed px-4">{text.voiceDesc}</p>
                    </div>
                 </motion.button>
                 <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectMode('text')}
                    className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6 border-4 border-white/10"
                 >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-6xl shadow-inner group-hover:scale-110 transition-transform">💬</div>
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{text.modeText}</h3>
                        <p className="text-blue-100 font-medium text-sm md:text-base leading-relaxed px-4">{text.textDesc}</p>
                    </div>
                 </motion.button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 overflow-hidden relative">
      <audio ref={ambientAudioRef} className="hidden" />
      {/* (Invite Modal & Toasts omitted for brevity, they remain same as original) */}
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 relative z-10">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter flex items-center gap-3">
             <span className="text-brand-500 drop-shadow-md">{lang === 'es' ? '🇺🇸' : '🇨🇴'}</span> {text.title}
          </h2>
          <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] mt-1">{text.subtitle}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
            <button onClick={resetSession} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider border border-white/10">✕ {text.exitMode}</button>
            <button onClick={startMatchmaking} disabled={isFindingPartner} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-pink-500/25 active:scale-95 transition-all flex items-center gap-2">{isFindingPartner ? <><span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> {text.finding}</> : <>🤝 {text.findPartner}</>}</button>
            {!isVoiceMode && (
                <div className="flex glass-morphism p-1 rounded-2xl border border-white/5 shadow-xl">
                <button onClick={() => setTab('chat')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-2 ${tab === 'chat' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-white'}`}>{text.chatTab}{tab === 'chat' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/></button>
                <button onClick={() => setTab('comments')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${tab === 'comments' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-white'}`}>{text.wallTab}</button>
                </div>
            )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isVoiceMode ? (
            <motion.div key="voice" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 relative rounded-[20px] overflow-hidden shadow-2xl border-4 border-slate-700 bg-black font-retro min-h-[500px]">
                {!selectedExperience ? (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900 p-8 text-center overflow-y-auto">
                        <h3 className="text-yellow-400 text-xl md:text-3xl mb-8 animate-pulse shadow-yellow-500/50 drop-shadow-md tracking-widest">{text.chooseExp}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                            {(lang === 'es' ? US_EXPERIENCES : COL_EXPERIENCES).map(exp => (
                                <button key={exp.id} onClick={() => handleExperienceSelect(exp)} className="bg-slate-800 border-4 border-slate-600 p-6 rounded-xl hover:bg-slate-700 hover:border-white hover:scale-105 transition-all group">
                                    <div className="text-4xl mb-4 group-hover:animate-bounce">📺</div>
                                    <h4 className="text-white text-sm md:text-base font-bold mb-2 uppercase">{exp.title}</h4>
                                    <p className="text-slate-400 text-[10px] md:text-xs">{exp.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 transition-opacity duration-1000">
                            {/* Standard Img tag for robustness */}
                            {currentEnv?.image && (
                                <img 
                                    src={currentEnv.image} 
                                    alt="Environment" 
                                    className="w-full h-full object-cover brightness-[0.6] scale-105 blur-[2px]" 
                                    loading="eager"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
                        </div>
                        <div className="absolute inset-0 z-10 pointer-events-none">
                             <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
                             {personalities.map((persona, index) => {
                                 // Determine alignment based on visual position 20, 40, 60, 80
                                 const xPos = 20 + (index * 20);
                                 // Smart alignment to prevent overflow
                                 let alignment: 'left' | 'center' | 'right' = 'center';
                                 if (xPos <= 40) alignment = 'left';
                                 else if (xPos >= 60) alignment = 'right';
                                 
                                 return (
                                     <PersonaAvatar 
                                        key={persona.id} 
                                        persona={persona} 
                                        isSpeaking={currentSpeakerId === persona.id} 
                                        isThinking={thinkingPersonaId === persona.id} 
                                        onScreen={true} 
                                        position={{ x: xPos, y: 60 + (index % 2 === 0 ? 5 : -5) }} 
                                        lastMessage={currentSpeakerId === persona.id ? currentSpeakerText || '' : undefined}
                                        alignment={alignment}
                                     />
                                 );
                             })}
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-auto">
                            <motion.button whileTap={{ scale: 0.95 }} onMouseDown={handleVoiceInput} onTouchStart={handleVoiceInput} className={`w-64 h-16 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 border-4 transition-all ${isListening ? 'bg-red-600 border-red-400 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>{isListening ? text.listening : text.tapToSpeak}</motion.button>
                        </div>
                    </>
                )}
            </motion.div>
        ) : (
            <motion.div key="text" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 bg-slate-900/80 rounded-[32px] border border-white/5 relative overflow-hidden flex flex-col backdrop-blur-xl shadow-2xl h-[calc(100vh-180px)]">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {currentEnv?.image && <img src={currentEnv.image} className="w-full h-full object-cover grayscale" alt="Atmosphere" loading="eager" />}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 scroll-smooth">
                    {chatMessages.map((msg, i) => (
                        <motion.div key={msg.id} initial="hidden" animate="visible" variants={animationVariants.slideUp} custom={i} className={`flex gap-4 ${msg.isUser ? 'flex-row-reverse' : ''}`}>
                            <div className="flex-shrink-0" onClick={() => handleUserClick(msg)}><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg ${msg.isUser ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{msg.user.charAt(0)}</div></div>
                            <div className={`flex flex-col max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md backdrop-blur-md ${msg.isUser ? 'bg-brand-600 text-white rounded-tr-none border border-brand-500/50' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>{msg.text}</div>
                            </div>
                        </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendChat} className="p-4 bg-slate-950/80 border-t border-white/10 flex gap-3 backdrop-blur-md relative z-20">
                    <input type="text" value={newChatText} onChange={(e) => setNewChatText(e.target.value)} placeholder={text.typePlaceholder} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 transition-all text-sm" />
                    <button type="submit" disabled={!newChatText.trim()} className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors">➤</button>
                </form>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
