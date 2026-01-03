
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

// --- Types ---

interface ChatMsg {
  id: string;
  userId: string;
  user: string;
  state: string;
  text: string;
  time: string;
  isUser: boolean;
  replyTo?: string; 
}

interface Comment {
  id: string;
  user: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  likes: number;
}

interface CommunityProps {
  lang: Language;
}

interface Persona {
  id: string;
  name: string;
  state: string; // Or Department
  city: string;
  uni: string;
  sportTeam: string;
  food: string;
  slang: string[];
  vibe: string;
  topics: string[];
}

// --- DATA ---
const US_STATES_DATA: Record<string, { cities: string[], uni: string, team: string, food: string, slang: string[], vibe: string }> = {
  AL: { cities: ['Birmingham', 'Mobile'], uni: 'Alabama', team: 'Crimson Tide', food: 'BBQ White Sauce', slang: ['Roll Tide', 'Fixin to', 'Bless your heart'], vibe: 'Southern Hospitality' },
  AK: { cities: ['Anchorage', 'Juneau'], uni: 'UAA', team: 'Seawolves', food: 'King Salmon', slang: ['Sourdough', 'The Lower 48', 'Snow machine'], vibe: 'Rugged Nature' },
  AZ: { cities: ['Phoenix', 'Tucson'], uni: 'Arizona State', team: 'Suns', food: 'Chimichangas', slang: ['Haboob', 'Snowbird', 'Dry heat'], vibe: 'Desert Chill' },
  CA: { cities: ['Los Angeles', 'San Francisco', 'San Diego'], uni: 'UCLA', team: 'Lakers', food: 'Fish Tacos', slang: ['Hella', 'Gnarly', 'Dude', 'For sure'], vibe: 'Laid back & Sunny' },
  CO: { cities: ['Denver', 'Boulder'], uni: 'CU Boulder', team: 'Broncos', food: 'Rocky Mountain Oysters', slang: ['The 14ers', 'Powder day', 'Rad'], vibe: 'Outdoorsy' },
  FL: { cities: ['Miami', 'Orlando', 'Tampa'], uni: 'UF', team: 'Dolphins', food: 'Cuban Sandwich', slang: ['Jit', 'No see ums', 'Dale'], vibe: 'Tropical Chaos' },
  IL: { cities: ['Chicago', 'Springfield'], uni: 'UIUC', team: 'Bulls', food: 'Deep Dish Pizza', slang: ['Ope', 'The L', 'You guys'], vibe: 'Midwest Hustle' },
  NY: { cities: ['NYC', 'Buffalo', 'Albany'], uni: 'NYU', team: 'Knicks', food: 'Pizza Slice', slang: ['Bodega', 'Deadass', 'Brick', 'Mad'], vibe: 'Hustle' },
  TX: { cities: ['Houston', 'Dallas', 'Austin'], uni: 'UT Austin', team: 'Cowboys', food: 'Brisket', slang: ['Howdy', 'Y\'all', 'Fixin to', 'All y\'all'], vibe: 'Big & Bold' },
  WA: { cities: ['Seattle', 'Spokane'], uni: 'UW', team: 'Seahawks', food: 'Salmon', slang: ['The Mountain', 'Filthy', 'Rain'], vibe: 'Rainy & Coffee' },
};

const COL_DEPTS_DATA: Record<string, { cities: string[], uni: string, team: string, food: string, slang: string[], vibe: string }> = {
  ANT: { cities: ['Medellín', 'Envigado'], uni: 'EAFIT', team: 'Atlético Nacional', food: 'Bandeja Paisa', slang: ['Parce', 'Qué más', 'Hágale'], vibe: 'Innovador & Amable' },
  CUN: { cities: ['Bogotá', 'Soacha'], uni: 'Los Andes', team: 'Millonarios', food: 'Ajiaco', slang: ['Ala', 'Carachas', 'Rolos'], vibe: 'Urbano & Frío' },
  VAL: { cities: ['Cali', 'Palmira'], uni: 'Univalle', team: 'América de Cali', food: 'Cholado', slang: ['Ve', 'Mirá', 'Chuspa'], vibe: 'Salsa & Alegría' },
  ATL: { cities: ['Barranquilla', 'Soledad'], uni: 'Uninorte', team: 'Junior', food: 'Arroz de Lisa', slang: ['No joda', 'Cuadro', 'Full'], vibe: 'Carnaval & Playa' },
  BOL: { cities: ['Cartagena'], uni: 'UDC', team: 'Real Cartagena', food: 'Arepa de Huevo', slang: ['Compadre', 'Ajá'], vibe: 'Histórico & Turístico' },
};

const NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
const COL_NAMES = ['Santiago', 'Valentina', 'Mateo', 'Camila', 'Sebastian', 'Mariana', 'Alejandro', 'Isabella', 'Diego', 'Sofia', 'Andres', 'Daniela'];

const BAD_WORDS = ['hate', 'stupid', 'ugly', 'kill', 'attack', 'politics', 'trump', 'biden', 'vote', 'religion', 'god', 'jesus', 'sex', 'nude', 'naked', 'fuck', 'shit', 'ass', 'bitch'];

const generatePersonalities = (lang: Language): Persona[] => {
  const personalities: Persona[] = [];
  const source = lang === 'es' ? US_STATES_DATA : COL_DEPTS_DATA;
  const nameSource = lang === 'es' ? NAMES : COL_NAMES;
  const idPrefix = lang === 'es' ? 'US' : 'COL';
  
  Object.keys(source).forEach((code) => {
    const data = source[code];
    for (let i = 0; i < 3; i++) { 
      const name = nameSource[Math.floor(Math.random() * nameSource.length)];
      personalities.push({
        id: `${idPrefix}-${code}-${i}`,
        name: name,
        state: code,
        city: data.cities[i % data.cities.length],
        uni: data.uni,
        sportTeam: data.team,
        food: data.food,
        slang: data.slang,
        vibe: data.vibe,
        topics: [data.team, data.food, ...data.slang]
      });
    }
  });
  return personalities;
};

// --- Contextual AI Logic ---

// 1. Keyword Extraction
const extractTopic = (text: string): string => {
  const words = text.split(/\s+/);
  // Filter common stop words
  const stopWords = ['what', 'where', 'when', 'why', 'that', 'this', 'have', 'with', 'about', 'from', 'like', 'just', 'know', 'think', 'good', 'bad'];
  const potential = words.filter(w => w.length > 4 && !stopWords.includes(w.toLowerCase()));
  
  if (potential.length > 0) {
    // Return the longest interesting word
    return potential.reduce((a, b) => a.length > b.length ? a : b).replace(/[^a-zA-Z]/g, '');
  }
  return 'that';
};

// 2. Response Templates
const generateContextualResponse = (
  persona: Persona, 
  userText: string, 
  keyword: string, 
  type: 'direct_reply' | 'group_piggyback' | 'clarify',
  lastSpeakerName: string | null,
  lang: Language
): string => {

  const isEnglish = lang === 'es'; // Bots speak English if User is Spanish
  const targetUser = lang === 'es' ? 'You' : 'Tú';

  if (isEnglish) {
    // --- ENGLISH RESPONSES (User is Spanish Speaker) ---
    if (type === 'direct_reply') {
      const templates = [
        `That's a fascinating point about ${keyword}! ${persona.slang[0]}! How long have you been interested in that?`,
        `I totally agree with what you said about ${keyword}. Do you think it varies by culture?`,
        `Wait, regarding ${keyword} - have you experienced that personally here in the US?`,
        `I love that perspective on ${keyword}. What made you think of that?`,
        `${persona.slang[0]}! ${keyword} is a huge topic here in ${persona.city}. What's your favorite thing about it?`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
    
    if (type === 'clarify') {
       const templates = [
        `Sorry to interrupt, but when you mention ${keyword}, do you mean generally or specifically?`,
        `That's cool! But helps us understand, how does ${keyword} fit into your daily life?`,
        `Just to clarify, are you saying ${keyword} is positive or negative?`,
        `I am curious, what exactly do you mean by ${keyword} in this context?`
       ];
       return templates[Math.floor(Math.random() * templates.length)];
    }

    if (type === 'group_piggyback') {
      const templates = [
        `@${lastSpeakerName} makes a good point, but I think ${keyword} is even more complex. What do you think ${targetUser}?`,
        `Yeah @${lastSpeakerName}, I was thinking the same thing about ${keyword}. ${targetUser}, do you agree with us?`,
        `I see @${lastSpeakerName}'s logic, but here in ${persona.state}, ${keyword} works differently. How is it for you ${targetUser}?`,
        `That is funny @${lastSpeakerName}! But seriously, ${keyword} is key. ${targetUser}, any other thoughts?`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
  } else {
    // --- SPANISH RESPONSES (User is English Speaker) ---
    if (type === 'direct_reply') {
      const templates = [
        `¡Ese es un punto fascinante sobre ${keyword}! ¡${persona.slang[0]}! ¿Por cuánto tiempo te ha interesado eso?`,
        `Estoy totalmente de acuerdo con lo que dices de ${keyword}. ¿Crees que varía según la cultura?`,
        `Espera, sobre ${keyword} - ¿has vivido eso personalmente aquí en Colombia?`,
        `Me encanta esa perspectiva sobre ${keyword}. ¿Qué te hizo pensar en eso?`,
        `¡${persona.slang[0]}! ${keyword} es un tema enorme aquí en ${persona.city}. ¿Qué es lo que más te gusta?`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
    
    if (type === 'clarify') {
       const templates = [
        `Perdón la interrupción, pero cuando mencionas ${keyword}, ¿te refieres en general o específicamente?`,
        `¡Qué bacano! Pero ayúdanos a entender, ¿cómo encaja ${keyword} en tu vida diaria?`,
        `Solo para aclarar, ¿estás diciendo que ${keyword} es positivo o negativo?`,
        `Tengo curiosidad, ¿qué quieres decir exactamente con ${keyword} en este contexto?`
       ];
       return templates[Math.floor(Math.random() * templates.length)];
    }

    if (type === 'group_piggyback') {
      const templates = [
        `@${lastSpeakerName} tiene buen punto, pero creo que ${keyword} es más complejo. ¿Qué piensas ${targetUser}?`,
        `Sí @${lastSpeakerName}, estaba pensando lo mismo sobre ${keyword}. ${targetUser}, ¿estás de acuerdo con nosotros?`,
        `Entiendo a @${lastSpeakerName}, pero aquí en ${persona.state}, ${keyword} funciona diferente. ¿Cómo es para ti ${targetUser}?`,
        `¡Qué chistoso @${lastSpeakerName}! Pero en serio, ${keyword} es clave. ${targetUser}, ¿alguna otra idea?`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
  }
  return "...";
};

const Community: React.FC<CommunityProps> = ({ lang }) => {
  const [tab, setTab] = useState<'chat' | 'comments'>('chat');
  
  // --- Persistent State ---
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [newChatText, setNewChatText] = useState('');
  
  // --- Simulation State ---
  const personalities = useMemo(() => generatePersonalities(lang), [lang]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Conversation Context
  const [userContext, setUserContext] = useState<{
    text: string;
    keyword: string;
    timestamp: number;
    lastSpeaker: string | null;
  } | null>(null);

  const [onlineCount, setOnlineCount] = useState(128);

  const text = {
    title: lang === 'es' ? 'Mundo El Camino' : 'El Camino World',
    subtitle: lang === 'es' ? 'Conecta con USA' : 'Connect with Colombia',
    chatTab: lang === 'es' ? 'Chat USA 🇺🇸' : 'Chat Colombia 🇨🇴',
    wallTab: lang === 'es' ? 'Muro' : 'Wall',
    you: lang === 'es' ? 'Tú' : 'You',
    typePlaceholder: lang === 'es' ? 'Habla con ellos en inglés...' : 'Chat with them in Spanish...',
    wallPlaceholder: lang === 'es' ? 'Comparte tu progreso (Inglés)...' : 'Share your progress (Spanish)...',
    live: 'LIVE',
    online: lang === 'es' ? 'AMERICANS ONLINE' : 'COLOMBIANS ONLINE',
    guidelines: lang === 'es' ? 'Guía: Solo inglés, amabilidad.' : 'Guidelines: Spanish only, be kind.',
    moderationError: lang === 'es' ? 'Mensaje bloqueado.' : 'Message blocked.'
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (tab === 'chat') scrollToBottom();
  }, [chatMessages, tab]);

  // Reset chat on lang change
  useEffect(() => {
    setChatMessages([]);
    setUserContext(null);
  }, [lang]);

  // Online Count Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => Math.max(80, prev + (Math.floor(Math.random() * 5) - 2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Main Chat Loop (Ambient + Contextual) ---
  useEffect(() => {
    const loop = setInterval(() => {
      // 1. If context exists and is recent (< 60 seconds), maintain the "Group Chat" vibe
      const isContextActive = userContext && (Date.now() - userContext.timestamp < 60000);
      
      // Chance to speak: Higher if context is active
      const shouldSpeak = Math.random() > (isContextActive ? 0.4 : 0.7);
      
      if (!shouldSpeak) return;

      const speaker = personalities[Math.floor(Math.random() * personalities.length)];
      
      // Don't let the same person speak twice in a row if possible (checked via context.lastSpeaker)
      if (userContext?.lastSpeaker === speaker.name) return;

      let msgText = '';
      
      if (isContextActive && userContext) {
        // --- GROUP CONTEXT MODE ---
        // Decide: Piggyback off last speaker OR Clarify with User
        const mode = Math.random() > 0.6 ? 'clarify' : 'group_piggyback';
        
        msgText = generateContextualResponse(
          speaker, 
          userContext.text, 
          userContext.keyword, 
          mode, 
          userContext.lastSpeaker || 'someone',
          lang
        );
        
        // Update context last speaker
        setUserContext(prev => prev ? ({ ...prev, lastSpeaker: speaker.name }) : null);

      } else {
        // --- IDLE AMBIENT MODE ---
        // Generic chatter
        if (lang === 'es') {
          msgText = `Anyone watching the ${speaker.sportTeam} game tonight?`;
          if (Math.random() > 0.5) msgText = `I am craving some ${speaker.food} right now.`;
        } else {
          msgText = `¿Alguien viendo el partido del ${speaker.sportTeam}?`;
          if (Math.random() > 0.5) msgText = `Tengo ganas de comer ${speaker.food}.`;
        }
      }

      const newMsg: ChatMsg = {
        id: Date.now().toString() + Math.random(),
        userId: speaker.id,
        user: speaker.name,
        state: speaker.state,
        text: msgText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false
      };

      setChatMessages(prev => [...prev, newMsg]);

    }, 4000);

    return () => clearInterval(loop);
  }, [userContext, personalities, lang]);


  // --- User Interaction Handler ---
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    
    // Safety check
    if (BAD_WORDS.some(w => newChatText.toLowerCase().includes(w))) {
      alert(text.moderationError);
      return;
    }

    const userText = newChatText;
    const keyword = extractTopic(userText);
    
    // 1. Post User Message
    const msg: ChatMsg = {
      id: Date.now().toString(),
      userId: 'user',
      user: text.you,
      state: lang === 'es' ? 'CO' : 'US',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, msg]);
    setNewChatText('');

    // 2. Set Context (Triggers the Group Chat Mode)
    setUserContext({
      text: userText,
      keyword: keyword,
      timestamp: Date.now(),
      lastSpeaker: text.you
    });

    // 3. Trigger Immediate Responses (Direct engagement)
    const respondersCount = Math.floor(Math.random() * 2) + 2; // 2-3 immediate responders
    const usedIndices: number[] = [];

    for (let i = 0; i < respondersCount; i++) {
        let idx = Math.floor(Math.random() * personalities.length);
        while (usedIndices.includes(idx)) idx = Math.floor(Math.random() * personalities.length);
        usedIndices.push(idx);
        
        const responder = personalities[idx];
        const delay = 800 + (i * 1500) + (Math.random() * 500);

        setTimeout(() => {
          const replyText = generateContextualResponse(
            responder, 
            userText, 
            keyword, 
            'direct_reply', 
            null, 
            lang
          );
          
          const replyMsg: ChatMsg = {
            id: Date.now().toString() + 'r' + i,
            userId: responder.id,
            user: responder.name,
            state: responder.state,
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: false
          };
          
          setChatMessages(prev => [...prev, replyMsg]);
          
          // Update last speaker so ambient loop picks it up
          setUserContext(prev => prev ? ({ ...prev, lastSpeaker: responder.name }) : null);

        }, delay);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter flex items-center gap-3">
             <span className="text-blue-500">{lang === 'es' ? '🇺🇸' : '🇨🇴'}</span> {text.title}
          </h2>
          <p className="text-slate-500 text-[10px] md:text-lg font-bold uppercase tracking-widest mt-1">{text.subtitle}</p>
        </div>
        
        <div className="flex glass-morphism p-1 rounded-2xl border border-white/5 shadow-lg">
          <button 
            onClick={() => setTab('chat')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-2 ${tab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            {text.chatTab}
            {tab === 'chat' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}
          </button>
          <button 
            onClick={() => setTab('comments')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${tab === 'comments' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            {text.wallTab}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {tab === 'chat' ? (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col glass-morphism rounded-[40px] overflow-hidden shadow-2xl h-[55svh] md:h-[650px] border border-white/10"
          >
            <div className="bg-slate-950/50 p-4 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                 <motion.span 
                   key={onlineCount}
                   initial={{ scale: 1.2, color: '#4ade80' }}
                   animate={{ scale: 1, color: '#94a3b8' }}
                   className="text-[10px] font-black uppercase tracking-widest"
                 >
                    {text.live} - {onlineCount} {text.online}
                 </motion.span>
               </div>
               <p className="text-[10px] text-slate-600 hidden md:block">{text.guidelines}</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 hide-scrollbar bg-slate-900/30">
              {chatMessages.map((m) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.isUser ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={m.id} 
                  className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-2">
                    {!m.isUser && (
                       <span className="bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-700">
                         {m.state}
                       </span>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-wider ${m.isUser ? 'text-blue-400' : 'text-slate-400'}`}>{m.user}</span>
                    <span className="text-[9px] text-slate-600 font-bold">{m.time}</span>
                  </div>
                  <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-md backdrop-blur-sm ${m.isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5'}`}>
                    <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-4 bg-slate-950/50 border-t border-white/10 flex gap-3 backdrop-blur-md">
              <input 
                type="text" 
                placeholder={text.typePlaceholder}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
              />
              <button className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all">
                {lang === 'es' ? '🇺🇸' : '🇨🇴'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="comments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
             <div className="flex items-center justify-center h-48 text-slate-500 font-bold">
               {text.wallPlaceholder}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
