
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, AIAgent, CityData, ChatMsg, RoomState, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getRoomAgentResponse, getPronunciation, decodeBase64Audio, decodeAudioData 
} from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, Mic, Globe, Send, Volume2, Globe2, X, Plus
} from 'lucide-react';
import OptimizedImage, { triggerHaptic } from '../utils/performance';

// --- DATA: CITY LIBRARY ---
const CITY_LIBRARY: CityData[] = [
  { name: 'Bogotá', country: 'CO', skylineImageUrl: 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?q=80&w=2070', landmarkImageUrls: ['Monserrate', 'Candelaria'] },
  { name: 'Medellín', country: 'CO', skylineImageUrl: 'https://images.unsplash.com/photo-1599592176462-2775f048d085?q=80&w=1974', landmarkImageUrls: ['Comuna 13', 'Botero Plaza'] },
  { name: 'New York', country: 'US', skylineImageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2070', landmarkImageUrls: ['Times Square', 'Empire State'] },
  { name: 'Miami', country: 'US', skylineImageUrl: 'https://images.unsplash.com/photo-1506104494994-44e08f5146c9?q=80&w=2070', landmarkImageUrls: ['South Beach', 'Wynwood'] }
];

// --- DATA: AGENT LIBRARY (STRICT MASCULINE CONSISTENCY + REQUESTED CAROLINA) ---
const ALL_CO_AGENTS: AIAgent[] = [
  { id: 'a1', name: 'Santi', city: 'Medellín', persona: 'Paisa nea, fast talker, loves trap and street art.', country: 'CO', talkativeness: 0.8, specialties: ['trap', 'street art'], voiceProfileId: 'Puck', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Santi&gender=male', lastSpokeAt: 0 },
  { id: 'a2', name: 'Tomas', city: 'Bogotá', persona: 'Paisa student, loves reggaeton, direct and funny.', country: 'CO', talkativeness: 0.6, specialties: ['music', 'slang'], voiceProfileId: 'Fenrir', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomas&gender=male', lastSpokeAt: 0 },
  { id: 'a3', name: 'Mateo', city: 'Cali', persona: 'Salsa lover, energetic, street-smart mentor.', country: 'CO', talkativeness: 0.5, specialties: ['dance', 'vibes'], voiceProfileId: 'Charon', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo&gender=male', lastSpokeAt: 0 },
  { id: 'a4', name: 'Carolina', city: 'Medellín', persona: 'Sophisticated paisa, entrepreneur, mentor.', country: 'CO', talkativeness: 0.4, specialties: ['business', 'culture'], voiceProfileId: 'Kore', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carolina&gender=female', lastSpokeAt: 0 }
];

const ALL_US_AGENTS: AIAgent[] = [
  { id: 'u1', name: 'Jax', city: 'NYC', persona: 'Brooklyn native, mad hype, uses "deadass" constantly.', country: 'US', talkativeness: 0.8, specialties: ['sports', 'ball'], voiceProfileId: 'Charon', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jax&gender=male', lastSpokeAt: 0 },
  { id: 'u2', name: 'Leo', city: 'LA', persona: 'Street influencer, uses Gen Z slang like "no cap", "bet".', country: 'US', talkativeness: 0.6, specialties: ['tech', 'tiktok'], voiceProfileId: 'Puck', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&gender=male', lastSpokeAt: 0 },
  { id: 'u3', name: 'Caleb', city: 'Miami', persona: 'Street hustler, speaks Spanglish, high energy.', country: 'US', talkativeness: 0.4, specialties: ['crypto', 'clubs'], voiceProfileId: 'Fenrir', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&gender=male', lastSpokeAt: 0 }
];

const Community: React.FC<{ lang: Language; onNavigate: (s: AppSection) => void }> = ({ lang, onNavigate }) => {
  const { user } = useAuth();
  const [modality, setModality] = useState<'voice' | 'text' | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const taskIdRef = useRef(0);

  const cleanupModality = useCallback(() => {
    taskIdRef.current++;
    recognitionRef.current?.stop();
    setIsUserSpeaking(false);
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
  }, []);

  const initRoom = useCallback(async (targetModality: 'voice' | 'text') => {
    cleanupModality();
    const currentTaskId = taskIdRef.current;
    const activeCountry = lang === 'en' ? 'CO' : 'US';
    const agents = activeCountry === 'CO' ? ALL_CO_AGENTS : ALL_US_AGENTS;
    const cities = CITY_LIBRARY.filter(c => c.country === activeCountry);
    const city = cities[Math.floor(Math.random() * cities.length)];

    const newRoom: RoomState = {
      id: `room_${Date.now()}`,
      activeAgents: agents,
      activeCity: city,
      languageMode: lang,
      history: [],
      modality: targetModality
    };

    setRoom(newRoom);
    setModality(targetModality);
    setIsTyping(true);
    const agentResponses = await getRoomAgentResponse(agents, [], city, lang);
    if (currentTaskId === taskIdRef.current) { deliverAgentReplies(agentResponses, newRoom, targetModality); }
  }, [lang, cleanupModality]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = lang === 'en' ? 'es-CO' : 'en-US';
      recognitionRef.current.onresult = (event: any) => handleSendMessage(event.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsUserSpeaking(false);
    }
    return cleanupModality;
  }, [lang, cleanupModality]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [room?.history, isTyping]);

  const handleSendMessage = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || !room || !modality) return;
    triggerHaptic('light');
    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
      user: user?.displayName || 'Traveler',
      state: lang === 'en' ? 'EN' : 'ES',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };
    const updatedHistory = [...(room.history || []), userMsg];
    setRoom({ ...room, history: updatedHistory });
    setInput('');
    setIsTyping(true);
    const agentResponses = await getRoomAgentResponse(room.activeAgents!, updatedHistory.slice(-10), room.activeCity!, lang, msgText);
    deliverAgentReplies(agentResponses, room, modality);
  };

  const deliverAgentReplies = async (replies: any[], currentRoom: RoomState, currentModality: 'voice' | 'text') => {
    const currentTaskId = taskIdRef.current;
    for (let i = 0; i < replies.length; i++) {
      if (currentTaskId !== taskIdRef.current) return;
      const reply = replies[i];
      const agent = currentRoom.activeAgents!.find(a => a.id === reply.personaId);
      if (!agent) continue;
      await new Promise(r => setTimeout(r, i === 0 ? 800 : modality === 'voice' ? 400 : 1500));
      if (currentTaskId !== taskIdRef.current) return;
      const aiMsg: ChatMsg = {
        id: `ai_${Date.now()}_${i}`,
        userId: agent.id,
        user: agent.name,
        state: agent.city,
        text: reply.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false,
        type: 'ai',
        personaId: agent.id,
        shouldSpeakAloud: currentModality === 'voice' || reply.shouldSpeak
      };
      setRoom(prev => prev ? { ...prev, history: [...(prev.history || []), aiMsg] } : null);
      if (currentModality === 'voice' || reply.shouldSpeak) await speakAgent(agent, reply.text, currentModality);
    }
    setIsTyping(false);
  };

  const speakAgent = async (agent: AIAgent, text: string, currentModality: 'voice' | 'text') => {
    setCurrentSpeakerId(agent.id);
    setTranscriptText(text);
    try {
      const base64 = await getPronunciation(text, agent.voiceProfileId);
      if (base64 && modality === currentModality) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        await new Promise(r => setTimeout(r, buffer.duration * 1000 + 300));
      }
    } finally {
      setCurrentSpeakerId(null);
      setTranscriptText('');
    }
  };

  if (!modality) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 space-y-12 bg-slate-950 rounded-[48px] relative overflow-hidden border border-white/5">
         <div className="text-center space-y-4 relative z-10">
            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">{lang === 'en' ? 'Street Immersion' : 'Inmersión Callejera'}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">{lang === 'en' ? 'COLOMBIAN URBAN SYNC' : 'AMERICAN URBAN SYNC'}</p>
         </div>
         <div className="flex gap-8 relative z-10">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => initRoom('text')} className="w-56 h-56 rounded-[48px] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-500 transition-all shadow-2xl">
               <MessageSquare size={64} className="text-brand-400" />
               <span className="font-black text-white uppercase tracking-widest text-xs">Text Chat</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => initRoom('voice')} className="w-56 h-56 rounded-[48px] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-500 transition-all shadow-2xl">
               <Mic size={64} className="text-brand-400" />
               <span className="font-black text-white uppercase tracking-widest text-xs">Voice Deep Dive</span>
            </motion.button>
         </div>
         <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-black rounded-[48px] border border-white/5 relative shadow-2xl">
      <div className="absolute inset-0 z-0">
        <OptimizedImage src={room?.activeCity?.skylineImageUrl || ''} alt="Skyline" className="w-full h-full object-cover brightness-[0.2] blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>
      <div className="relative z-10 p-6 flex justify-between items-center bg-black/40 backdrop-blur-3xl border-b border-white/10">
        <div className="flex items-center gap-6">
          <button onClick={() => setModality(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"><X size={20}/></button>
          <div>
            <h3 className="text-xl font-black text-white italic leading-tight uppercase tracking-tighter">{room?.activeCity?.name} Pulse</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{room?.activeAgents?.length} COHORTS LIVE</p>
          </div>
        </div>
        <div className="flex bg-slate-900/60 p-1 rounded-full border border-white/10">
             <button onClick={() => initRoom('text')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all ${modality === 'text' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>Text</button>
             <button onClick={() => initRoom('voice')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all ${modality === 'voice' ? 'bg-brand-500 text-white shadow-xl' : 'text-slate-500'}`}>Voice</button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {modality === 'text' ? (
          <div ref={scrollRef} className="h-full overflow-y-auto p-8 space-y-6 hide-scrollbar relative z-10 pb-32">
             {room?.history?.map((m) => (
                 <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {!m.isUser && (
                           <span className="w-6 h-6 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                              <img src={room.activeAgents?.find(a=>a.id===m.personaId)?.avatarImage} alt={m.user} />
                           </span>
                        )}
                        <span className={`text-[8px] font-black uppercase tracking-widest ${m.isUser ? 'text-brand-400' : 'text-slate-500'}`}>{m.user} • {m.state}</span>
                    </div>
                    <div className={`max-w-[85%] p-5 rounded-[28px] shadow-2xl ${m.isUser ? 'bg-brand-600 text-white rounded-tr-none' : 'facetime-glass text-slate-200 rounded-tl-none'}`}>
                        <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    </div>
                 </motion.div>
             ))}
             {isTyping && <div className="flex gap-2 p-4"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.1s]" /></div>}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
             <AnimatePresence mode="wait">
                {currentSpeakerId ? (
                  <motion.div key={currentSpeakerId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-10">
                     <div className="relative mx-auto">
                        <motion.img 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          src={room?.activeAgents?.find(a=>a.id===currentSpeakerId)?.avatarImage} 
                          className="w-56 h-56 rounded-full border-4 border-brand-500 shadow-[0_0_60px_rgba(59,130,246,0.6)] mx-auto avatar-glow object-cover" 
                        />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-xl tracking-widest">Speaking</div>
                     </div>
                     <div className="facetime-glass p-10 rounded-[56px] max-w-2xl mx-auto shadow-2xl border border-white/10">
                        <p className="text-3xl font-black text-white italic leading-relaxed tracking-tighter">"{transcriptText}"</p>
                        <div className="mt-8 flex items-center justify-center gap-4">
                           <div className="w-10 h-px bg-white/10" />
                           <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">
                              {room?.activeAgents?.find(a=>a.id===currentSpeakerId)?.name} • {room?.activeAgents?.find(a=>a.id===currentSpeakerId)?.city}
                           </p>
                           <div className="w-10 h-px bg-white/10" />
                        </div>
                     </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 opacity-40">
                     <Globe2 size={80} className="animate-spin-slow mx-auto text-slate-500" />
                     <div className="space-y-2">
                        <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-xs">Waiting for Deep Immersion Input...</p>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Synchronizing city frequencies</p>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        )}
      </div>
      <div className="relative z-20 p-8 bg-black/60 backdrop-blur-3xl border-t border-white/10">
         <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="max-w-4xl mx-auto flex gap-5">
            <div className="relative flex-1 group">
               <input className="w-full bg-white/5 border border-white/10 rounded-[32px] px-8 py-6 text-base text-white focus:outline-none focus:border-brand-500 pr-20 shadow-inner" value={input} onChange={e => setInput(e.target.value)} placeholder={modality === 'text' ? (lang === 'en' ? 'Immersion Chat (ES)...' : 'Inmersión Chat (EN)...') : 'Speaking Mode Active'} disabled={modality === 'voice'} />
               <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {modality === 'voice' && (
                    <button type="button" onClick={() => { setIsUserSpeaking(true); triggerHaptic('light'); recognitionRef.current?.start(); }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isUserSpeaking ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'}`}><Mic size={20}/></button>
                  )}
               </div>
            </div>
            {modality === 'text' && <button type="submit" className="w-20 h-20 bg-brand-500 rounded-[28px] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"><Send size={28}/></button>}
         </form>
      </div>
    </div>
  );
};

export default Community;
