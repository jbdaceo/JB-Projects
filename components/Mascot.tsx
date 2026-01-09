
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, AssistantMessage, MascotConfig } from '../types';
import { tutorChat, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { 
  X, Send, Bot, MessageSquare, ChevronDown, Sparkles, Mic, Volume2, 
  Settings2, Zap, Brain, ShieldCheck, Globe, HelpCircle 
} from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

const MASCOTS: MascotConfig[] = [
  { 
    id: 'neural_1', 
    name: 'Buddy', 
    icon: '🐕', 
    archetype: 'Street Bridge', 
    color: 'from-blue-500 to-indigo-600',
    glow: 'rgba(59, 130, 246, 0.5)',
    specialty: 'Street Nuance & Slang',
    voice: 'Fenrir',
    description: {
      en: 'The ultimate translator between textbook English and street realness.',
      es: 'El traductor definitivo entre el inglés de libro y la realidad de la calle.'
    }
  },
  { 
    id: 'neural_2', 
    name: 'Luna', 
    icon: '🐈', 
    archetype: 'Linguistic Strategist', 
    color: 'from-purple-500 to-rose-600',
    glow: 'rgba(192, 38, 211, 0.5)',
    specialty: 'Logic & Connection',
    voice: 'Aoede',
    description: {
      en: 'Specializes in connecting your Colombian heritage to global logic.',
      es: 'Se especializa en conectar tu herencia colombiana con la lógica global.'
    }
  },
  { 
    id: 'neural_3', 
    name: 'Pip', 
    icon: '🦜', 
    archetype: 'Hype Mimic', 
    color: 'from-emerald-400 to-teal-600',
    glow: 'rgba(16, 185, 129, 0.5)',
    specialty: 'Accent & Energy',
    voice: 'Kore',
    description: {
      en: 'High energy coach focused on mimicking native speed and flow.',
      es: 'Coach de alta energía enfocado en imitar la velocidad y el flow nativo.'
    }
  }
];

const QUICK_ACTIONS = [
  { label: 'Explain "deadass"', query: 'Explain the NYC slang "deadass" to a Colombian.' },
  { label: 'Street alternative', query: 'Give me a street-smart alternative to "How are you?".' },
  { label: 'Paisa slang help', query: 'Explain "qué chimba" to an English speaker.' },
  { label: 'Practice vibe', query: 'Let\'s have a street-level conversation about music.' }
];

const Mascot: React.FC<{ lang: Language }> = ({ lang }) => {
  const [activeMascot, setActiveMascot] = useState<MascotConfig>(MASCOTS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = lang === 'en' ? 'en-US' : 'es-CO';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(null, transcript);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isTyping]);

  const handleSend = async (e: React.FormEvent | null, textOverride?: string) => {
    e?.preventDefault();
    const finalInput = textOverride || input;
    if (!finalInput.trim() || isTyping) return;
    
    const userMsg: AssistantMessage = { id: Date.now().toString(), role: 'user', text: finalInput, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    triggerHaptic('light');

    try {
      const systemPrompt = `
        You are ${activeMascot.name}, an upgraded AI Guardian. 
        Archetype: ${activeMascot.archetype}. 
        Specialty: ${activeMascot.specialty}.
        Language Context: ${lang}.
        Tone: Street-smart, authentic, direct, and energetic. 
        Mission: Bridge the gap between Colombian street culture and American street vernacular. 
        If asked about slang, give historical context and a usage example. 
        Be concise but impactful.
      `;
      const res = await tutorChat([...history, userMsg], systemPrompt, lang as any);
      const aiMsg: AssistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: res.text, timestamp: Date.now() };
      setHistory(prev => [...prev, aiMsg]);
      
      // Auto-speak the response if it's the upgraded mascot
      speakText(res.text);
      triggerHaptic('medium');
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const base64 = await getPronunciation(text, activeMascot.voice);
      if (base64) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      triggerHaptic('medium');
      recognitionRef.current?.start();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-28 right-8 lg:right-12 z-[100] w-20 h-20 bg-gradient-to-br ${activeMascot.color} rounded-[32px] flex items-center justify-center text-4xl shadow-[0_20px_50px_${activeMascot.glow}] border border-white/20 avatar-glow group`}
          >
            <div className="relative">
              {activeMascot.icon}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -inset-4 bg-white/20 rounded-full blur-xl -z-10"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-4 border-slate-950 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="absolute -top-10 right-0 px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Neural Hub</span>
          </motion.button>
        )}

        {isOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 100, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="fixed bottom-6 right-6 z-[200] w-[calc(100vw-48px)] md:w-[440px] h-[85vh] max-h-[800px] bg-slate-950/90 border border-white/10 rounded-[56px] shadow-[0_60px_150px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden facetime-glass backdrop-blur-3xl"
          >
            {/* Header Stage */}
            <div className="relative p-8 border-b border-white/5 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${activeMascot.color} opacity-10`} />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <motion.div 
                    layoutId="mascot-avatar"
                    onClick={() => setIsSelecting(!isSelecting)}
                    className={`w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center text-4xl shadow-2xl border border-white/10 cursor-pointer hover:scale-105 transition-transform avatar-glow`}
                  >
                    {activeMascot.icon}
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="text-xl font-black text-white italic leading-tight uppercase tracking-tighter">{activeMascot.name}</h4>
                       <span className="px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[8px] font-black uppercase rounded">{activeMascot.archetype}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-brand-500 animate-ping' : 'bg-emerald-500'}`} />
                      {isSpeaking ? 'TRANSMITTING...' : 'CONNECTED'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsSelecting(!isSelecting)} className="p-4 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"><Settings2 size={20}/></button>
                  <button onClick={() => setIsOpen(false)} className="p-4 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"><ChevronDown size={24}/></button>
                </div>
              </div>

              {/* Selector Mode Overlay */}
              <AnimatePresence>
                {isSelecting && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 z-20 bg-slate-950/95 p-8 flex flex-col justify-center gap-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Personality</h3>
                       <button onClick={() => setIsSelecting(false)}><X size={16}/></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {MASCOTS.map(m => (
                        <button 
                          key={m.id} 
                          onClick={() => { setActiveMascot(m); setIsSelecting(false); triggerHaptic('medium'); }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${activeMascot.id === m.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/5 bg-white/5'}`}
                        >
                           <span className="text-3xl">{m.icon}</span>
                           <span className="text-[9px] font-black text-white uppercase">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Pipeline */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 hide-scrollbar relative">
               {history.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-center space-y-10 opacity-60">
                    <div className="relative">
                       <motion.div 
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 4 }}
                          className="w-32 h-32 bg-white/5 rounded-[48px] flex items-center justify-center text-7xl shadow-inner border border-white/5"
                       >
                         {activeMascot.icon}
                       </motion.div>
                       <Zap size={32} className="absolute -top-4 -right-4 text-brand-400 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{lang === 'es' ? 'Núcleo Listo' : 'Neural Core Ready'}</h3>
                       <p className="text-slate-400 text-sm font-medium max-w-[200px] mx-auto leading-relaxed">{activeMascot.description[lang]}</p>
                    </div>
                    
                    {/* Nuance Chips */}
                    <div className="grid grid-cols-2 gap-2 w-full">
                       {QUICK_ACTIONS.map((action, i) => (
                         <button 
                            key={i} 
                            onClick={() => handleSend(null, action.query)}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-300 uppercase tracking-widest hover:bg-brand-500/20 hover:border-brand-500 transition-all text-center"
                         >
                           {action.label}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               {history.map(m => (
                 <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                   <div className="flex flex-col gap-2 max-w-[85%]">
                      {m.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{activeMascot.name} • {activeMascot.archetype}</span>
                        </div>
                      )}
                      <div className={`p-6 rounded-[32px] text-sm leading-relaxed shadow-2xl relative group ${
                        m.role === 'user' 
                         ? 'bg-brand-600 text-white rounded-tr-none border border-white/10' 
                         : 'facetime-glass text-slate-100 rounded-tl-none border border-white/10'
                      }`}>
                         {m.text}
                         {m.role === 'assistant' && (
                           <button onClick={() => speakText(m.text)} className="absolute -right-12 top-0 p-2 text-slate-600 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all"><Volume2 size={16}/></button>
                         )}
                      </div>
                   </div>
                 </motion.div>
               ))}
               
               {isTyping && (
                 <div className="flex justify-start">
                   <div className="bg-slate-900 p-6 rounded-[28px] rounded-tl-none border border-white/5 flex gap-2 items-center shadow-xl">
                     <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                     <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                     <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                   </div>
                 </div>
               )}
            </div>

            {/* Input Cockpit */}
            <div className="p-8 bg-slate-950/80 border-t border-white/5 backdrop-blur-3xl">
              <div className="flex items-center gap-4 mb-4 overflow-x-auto hide-scrollbar">
                 <div className="flex gap-2 shrink-0">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Brain size={10}/> Context High</span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><ShieldCheck size={10}/> Guardrails On</span>
                 </div>
              </div>
              
              <form onSubmit={(e) => handleSend(e)} className="flex gap-4 items-center">
                <div className="relative flex-1 group">
                  <input 
                    className="w-full bg-white/5 border-2 border-white/5 rounded-[32px] px-8 py-6 text-base text-white focus:outline-none focus:border-brand-500/50 transition-all placeholder:text-slate-700 pr-16 shadow-inner" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder={lang === 'es' ? 'Sincroniza tu duda...' : 'Sync neural query...'} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                     <button 
                        type="button" 
                        onClick={toggleRecording}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'}`}
                      >
                        <Mic size={20}/>
                     </button>
                  </div>
                </div>
                <button 
                  disabled={!input.trim() || isTyping} 
                  className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl transition-all active:scale-90 ${input.trim() ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-700'}`}
                >
                  <Send size={28} fill="currentColor" className={isTyping ? 'animate-spin' : ''}/>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Mascot;
