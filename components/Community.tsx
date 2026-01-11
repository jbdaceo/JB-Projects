
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, AIAgent, CityData, ChatMsg, RoomState, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getRoomAgentResponse, getPronunciation, decodeBase64Audio, decodeAudioData 
} from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, Mic, X, Send, Volume2, Globe2, Zap, Radio, Loader2, ArrowLeft
} from 'lucide-react';
import OptimizedImage, { triggerHaptic } from '../utils/performance';

const CITY_LIBRARY: CityData[] = [
  { name: 'Bogotá', country: 'CO', skylineImageUrl: 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?q=80&w=2070', landmarkImageUrls: ['Monserrate', 'Candelaria'] },
  { name: 'Medellín', country: 'CO', skylineImageUrl: 'https://images.unsplash.com/photo-1599592176462-2775f048d085?q=80&w=1974', landmarkImageUrls: ['Comuna 13', 'Botero Plaza'] },
  { name: 'New York', country: 'US', skylineImageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2070', landmarkImageUrls: ['Times Square', 'Empire State'] },
  { name: 'Miami', country: 'US', skylineImageUrl: 'https://images.unsplash.com/photo-1506104494994-44e08f5146c9?q=80&w=2070', landmarkImageUrls: ['South Beach', 'Wynwood'] }
];

const ALL_CO_AGENTS: AIAgent[] = [
  { id: 'a1', name: 'Santi', city: 'Medellín', persona: 'Paisa nea, fast talker, loves trap.', country: 'CO', talkativeness: 0.8, specialties: ['trap', 'street art'], voiceProfileId: 'Puck', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Santi&gender=male', lastSpokeAt: 0 },
  { id: 'a2', name: 'Tomas', city: 'Bogotá', persona: 'Formal student, political science.', country: 'CO', talkativeness: 0.6, specialties: ['politics', 'history'], voiceProfileId: 'Fenrir', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomas&gender=male', lastSpokeAt: 0 },
  { id: 'a3', name: 'Valeria', city: 'Cali', persona: 'Salsa dancer, very energetic and fast.', country: 'CO', talkativeness: 0.9, specialties: ['dance', 'party'], voiceProfileId: 'Kore', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valeria', lastSpokeAt: 0 },
  { id: 'a4', name: 'Andres', city: 'Cartagena', persona: 'Chill caribbean vibes, slow talker.', country: 'CO', talkativeness: 0.5, specialties: ['food', 'beach'], voiceProfileId: 'Charon', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andres', lastSpokeAt: 0 }
];

const ALL_US_AGENTS: AIAgent[] = [
  { id: 'u1', name: 'Jax', city: 'NYC', persona: 'Brooklyn native, mad hype.', country: 'US', talkativeness: 0.8, specialties: ['sports', 'ball'], voiceProfileId: 'Charon', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jax&gender=male', lastSpokeAt: 0 },
  { id: 'u2', name: 'Emily', city: 'Austin', persona: 'Tech recruiter, friendly and polite.', country: 'US', talkativeness: 0.7, specialties: ['tech', 'career'], voiceProfileId: 'Kore', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', lastSpokeAt: 0 },
  { id: 'u3', name: 'Marcus', city: 'Atlanta', persona: 'Music producer, uses AAVE, creative.', country: 'US', talkativeness: 0.7, specialties: ['music', 'production'], voiceProfileId: 'Fenrir', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', lastSpokeAt: 0 },
  { id: 'u4', name: 'Sarah', city: 'Seattle', persona: 'Coffee nerd, introspective.', country: 'US', talkativeness: 0.4, specialties: ['coffee', 'books'], voiceProfileId: 'Zephyr', avatarImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', lastSpokeAt: 0 }
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
  const [lastUserInteraction, setLastUserInteraction] = useState(Date.now());
  const [micVolume, setMicVolume] = useState(0);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const taskIdRef = useRef(0);

  const cleanupModality = useCallback(() => {
    taskIdRef.current++;
    recognitionRef.current?.stop();
    setIsUserSpeaking(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
  }, []);

  const initRoom = useCallback(async (targetModality: 'voice' | 'text') => {
    cleanupModality();
    const currentTaskId = taskIdRef.current;
    const targetAgentsCountry = lang === 'es' ? 'US' : 'CO';
    
    const agents = targetAgentsCountry === 'CO' ? ALL_CO_AGENTS : ALL_US_AGENTS;
    const cities = CITY_LIBRARY.filter(c => c.country === targetAgentsCountry);
    const city = cities[Math.floor(Math.random() * cities.length)];

    const roomId = `room_${city.name.toLowerCase()}_${Date.now()}`;
    const newRoom: RoomState = {
      id: roomId,
      roomId: roomId,
      activeAgents: agents,
      activeCity: city,
      languageMode: lang,
      history: [], 
      modality: targetModality
    };

    setRoom(newRoom);
    setModality(targetModality);
    setIsTyping(true);
    setLastUserInteraction(Date.now());
    
    try {
        const agentResponses = await getRoomAgentResponse(agents, [], city, lang);
        if (currentTaskId === taskIdRef.current) { deliverAgentReplies(agentResponses, newRoom, targetModality); }
    } catch(e) {
        setIsTyping(false);
    }
  }, [lang, cleanupModality]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = lang === 'es' ? 'en-US' : 'es-CO';
      recognitionRef.current.onresult = (event: any) => handleSendMessage(event.results[0][0].transcript);
      recognitionRef.current.onend = () => { setIsUserSpeaking(false); setMicVolume(0); };
    }
    return cleanupModality;
  }, [lang, cleanupModality]);

  useEffect(() => {
    if (!room || !modality) return;
    const chatterInterval = setInterval(async () => {
        const timeSinceInteraction = Date.now() - lastUserInteraction;
        const isIdle = timeSinceInteraction > 8000;
        if (isIdle && !isTyping && !isUserSpeaking && !currentSpeakerId && Math.random() > 0.6) {
            setIsTyping(true);
            try {
                const agentResponses = await getRoomAgentResponse(room.activeAgents!, room.history || [], room.activeCity!, lang, undefined);
                if (agentResponses.length > 0) deliverAgentReplies(agentResponses, room, modality);
                else setIsTyping(false);
            } catch(e) { setIsTyping(false); }
        }
    }, 5000);
    return () => clearInterval(chatterInterval);
  }, [room, modality, isTyping, isUserSpeaking, currentSpeakerId, lastUserInteraction, lang]);

  const startVisualizer = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
              if (analyserRef.current && dataArrayRef.current) {
                  analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                  const avg = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
                  setMicVolume(avg);
              }
              animationRef.current = requestAnimationFrame(update);
          };
          update();
      } catch(e) { console.error("Mic error", e); }
  };

  const startVoiceInput = () => {
      setIsUserSpeaking(true);
      setLastUserInteraction(Date.now());
      triggerHaptic('heavy');
      recognitionRef.current?.start();
      startVisualizer();
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [room?.history, isTyping]);

  const handleSendMessage = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || !room || !modality) return;
    
    setLastUserInteraction(Date.now());
    triggerHaptic('light');
    const userMsg: ChatMsg = {
      id: Date.now().toString(), userId: user?.id || 'guest', user: user?.displayName || 'Traveler',
      state: lang === 'es' ? 'ES' : 'EN', text: msgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true, channelId: room.id
    };
    const updatedHistory = [...(room.history || []), userMsg];
    setRoom({ ...room, history: updatedHistory });
    setInput('');
    setIsTyping(true);
    try {
        const agentResponses = await getRoomAgentResponse(room.activeAgents!, updatedHistory.slice(-10), room.activeCity!, lang, msgText);
        deliverAgentReplies(agentResponses, room, modality);
    } catch (e) { setIsTyping(false); }
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
        id: `ai_${Date.now()}_${i}`, userId: agent.id, user: agent.name, state: agent.city, text: reply.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: false,
        type: 'ai', personaId: agent.id, shouldSpeakAloud: currentModality === 'voice' || reply.shouldSpeak, channelId: currentRoom.id
      };
      setRoom(prev => { if (prev && prev.id === currentRoom.id) return { ...prev, history: [...(prev.history || []), aiMsg] }; return prev; });
      if (currentModality === 'voice' || reply.shouldSpeak) await speakAgent(agent, reply.text, currentModality);
    }
    setIsTyping(false);
    setLastUserInteraction(Date.now());
  };

  const speakAgent = async (agent: AIAgent, text: string, currentModality: 'voice' | 'text') => {
    if (currentModality === 'text') return;
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
    } finally { setCurrentSpeakerId(null); setTranscriptText(''); }
  };

  if (!modality) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 space-y-12 bg-slate-950 md:rounded-[48px] relative overflow-hidden border border-white/5 shadow-2xl">
         <div className="text-center space-y-4 relative z-10">
            <h2 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">{lang === 'es' ? 'Inmersión Callejera' : 'Street Immersion'}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">{lang === 'es' ? 'AMERICAN URBAN SYNC' : 'COLOMBIAN URBAN SYNC'}</p>
         </div>
         <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative z-10 w-full max-w-lg">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => initRoom('text')} className="flex-1 py-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-500 hover:bg-white/10 transition-all shadow-xl group">
               <MessageSquare size={32} className="text-brand-400 group-hover:scale-110 transition-transform" />
               <span className="font-black text-white uppercase tracking-widest text-xs">Text Chat</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => initRoom('voice')} className="flex-1 py-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-500 hover:bg-white/10 transition-all shadow-xl group">
               <Radio size={32} className="text-brand-400 group-hover:scale-110 transition-transform" />
               <span className="font-black text-white uppercase tracking-widest text-xs">Voice Deep Dive</span>
            </motion.button>
         </div>
         <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full" />
      </div>
    );
  }

  // TEXT MODE UI (Mobile Optimized)
  if (modality === 'text') {
    return (
      <div className="flex flex-col h-[100dvh] font-sans bg-slate-950 md:rounded-[48px] border border-white/5 relative shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="relative z-10 p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setModality(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 active:scale-95"><ArrowLeft size={18}/></button>
            <div>
              <h3 className="text-sm font-black text-white italic leading-none uppercase tracking-wide">{room?.activeCity?.name} Chat</h3>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Live • {room?.activeAgents?.length} Agents</p>
            </div>
          </div>
        </div>
        
        {/* Scrollable Messages */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
            <div ref={scrollRef} className="h-full overflow-y-auto p-4 pb-20 space-y-4 hide-scrollbar relative z-10 scroll-smooth">
               {room?.history?.map((m) => (
                   <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                          {!m.isUser && (
                             <span className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/10">
                                <img src={room.activeAgents?.find(a=>a.id===m.personaId)?.avatarImage} alt={m.user} className="w-full h-full object-cover" />
                             </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${m.isUser ? 'text-brand-300' : 'text-slate-500'}`}>{m.user}</span>
                      </div>
                      <div className={`max-w-[85%] px-5 py-3.5 rounded-[24px] shadow-sm text-[13px] md:text-sm font-medium leading-relaxed ${m.isUser ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-white/5'}`}>
                          {m.text}
                      </div>
                   </motion.div>
               ))}
               {isTyping && (
                  <div className="flex justify-start pl-2">
                     <div className="bg-slate-900/60 px-4 py-3 rounded-2xl border border-white/5 flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"/>
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"/>
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"/>
                     </div>
                  </div>
               )}
            </div>
        </div>

        {/* Fixed Input Area */}
        <div className="p-3 bg-slate-950 border-t border-white/10 backdrop-blur-xl pb-safe">
           <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 items-end">
              <input 
                 className="flex-1 bg-white/5 border border-white/10 rounded-[24px] px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-all placeholder:text-slate-600" 
                 placeholder="Say something..."
                 value={input}
                 onChange={e => setInput(e.target.value)}
              />
              <button disabled={!input.trim()} type="submit" className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 disabled:opacity-50 transition-all hover:bg-brand-400">
                 <Send size={18} className="ml-0.5"/>
              </button>
           </form>
        </div>
      </div>
    );
  }

  // VOICE MODE UI
  return (
    <div className="h-[100dvh] flex flex-col bg-black md:rounded-[48px] overflow-hidden relative">
       {/* Ambient Background */}
       <div className="absolute inset-0">
          <OptimizedImage src={room?.activeCity?.skylineImageUrl || ''} alt="City" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
       </div>

       {/* Top Controls */}
       <div className="relative z-20 p-6 flex justify-between items-start">
          <button onClick={() => setModality(null)} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95"><X size={20}/></button>
          <div className="text-right">
             <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{room?.activeCity?.name}</h2>
             <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em]">Voice Channel Active</p>
          </div>
       </div>

       {/* Center Stage: Speakers */}
       <div className="flex-1 flex items-center justify-center relative z-10 px-6">
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
             {room?.activeAgents?.map(agent => {
                const isSpeaking = currentSpeakerId === agent.id;
                return (
                   <motion.div 
                     key={agent.id} 
                     animate={{ scale: isSpeaking ? 1.05 : 1, borderColor: isSpeaking ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)' }}
                     className="aspect-square rounded-[32px] bg-black/40 backdrop-blur-md border-2 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300"
                   >
                      <img src={agent.avatarImage} className="w-20 h-20 opacity-80" alt={agent.name} />
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                         <p className="text-xs font-black text-white uppercase tracking-wider">{agent.name}</p>
                      </div>
                      {isSpeaking && (
                         <div className="absolute inset-0 bg-brand-500/10 animate-pulse" />
                      )}
                   </motion.div>
                );
             })}
          </div>
       </div>

       {/* Transcript Overlay */}
       <AnimatePresence>
          {transcriptText && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-40 left-6 right-6 z-20 text-center">
                <p className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-xl italic">"{transcriptText}"</p>
             </motion.div>
          )}
       </AnimatePresence>

       {/* Controls */}
       <div className="relative z-30 p-8 pb-12 flex justify-center items-center gap-8">
          <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={startVoiceInput}
             className={`w-24 h-24 rounded-[36px] flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all ${isUserSpeaking ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'bg-white text-black'}`}
          >
             {isUserSpeaking ? (
                <div className="flex gap-1 h-8 items-center">
                   {[1,2,3,4].map(i => (
                      <motion.div key={i} animate={{ height: [10, 32 * (micVolume/10 || 1), 10] }} transition={{ repeat: Infinity, duration: 0.2, delay: i * 0.05 }} className="w-2 bg-white rounded-full" />
                   ))}
                </div>
             ) : (
                <Mic size={32} className="text-slate-900" />
             )}
          </motion.button>
       </div>
    </div>
  );
};

export default Community;
