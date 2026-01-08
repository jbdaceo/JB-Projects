
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AppSection, Language, AssistantMessage } from '../types';
import { tutorChat } from '../services/gemini';
import { X, Send, AlertCircle, Sparkles } from 'lucide-react';
import OptimizedImage from '../utils/performance';

interface MascotProps {
  activeSection: AppSection;
  lang: Language;
}

type PetType = 'dog' | 'cat' | 'lion' | 'dragon' | 'shark' | 'frog' | 'man' | 'woman' | 'baby';
type ViewMode = 'hidden' | 'peeking' | 'active';

const PET_ASSETS: Record<PetType, string> = {
  dog: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png',
  cat: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png',
  lion: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Lion.png',
  dragon: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dragon.png',
  shark: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Shark.png',
  frog: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Frog.png',
  baby: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Baby.png',
  man: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Man%20Office%20Worker.png',
  woman: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Woman%20Office%20Worker.png'
};

const PETS: { id: PetType; label: string; icon: string; persona: string }[] = [
  { id: 'dog', label: 'Poco', icon: '🐶', persona: "A friendly, energetic Golden Retriever named Poco. You use simple analogies and are very encouraging." },
  { id: 'cat', label: 'Mish', icon: '🐱', persona: "A sophisticated cat named Mish. You focus on grammar precision and nuances, but you are helpful." },
  { id: 'lion', label: 'Leon', icon: '🦁', persona: "A confident Lion named Leon. You focus on leadership, public speaking confidence, and strength." },
  { id: 'dragon', label: 'Drako', icon: '🦎', persona: "A wise, ancient Dragon named Drako. You know the history of words (etymology) and share deep wisdom." },
  { id: 'shark', label: 'Fin', icon: '🦈', persona: "An efficient Shark named Fin. You prefer direct, business-like communication and results." },
  { id: 'frog', label: 'Pepe', icon: '🐸', persona: "A curious Frog named Pepe. You ask many questions to help the student discover the answer themselves." },
  { id: 'baby', label: 'Baby', icon: '👶', persona: "A curious toddler. You learn alongside the user, asking 'Why?' often to provoke deep thought." },
  { id: 'man', label: 'Pro', icon: '👨‍💼', persona: "A professional mentor. Formal, structured, and focused on career advancement." },
  { id: 'woman', label: 'Exec', icon: '👩‍💼', persona: "An executive coach. Strategic, articulate, and focused on networking skills." },
];

const PET_PHRASES: Record<PetType, string[]> = {
  dog: ["Woof!", "Bark!", "Arf!", "*Pant*"],
  cat: ["Meow.", "Purr...", "Mew!", "Mrrp?"],
  lion: ["Roar!", "Grrr...", "Hmph.", "*Yawn*"],
  dragon: ["*Smoke*", "Hiss...", "Growl.", "*Snort*"],
  shark: ["*Splash*", "Chomp!", "Swish.", "..."],
  frog: ["Ribbit!", "Croak!", "Hop!", "*Blink*"],
  baby: ["Goo-goo!", "Wah!", "Yay!", "*Giggle*"],
  man: ["Hey.", "Ahem.", "Yo.", "So..."],
  woman: ["Hi.", "Hmm.", "Well...", "Look."],
};

const HELP_PROMPTS = {
  en: ["Need a hand?", "Stuck?", "I can help!", "Ask me anything.", "Want a hint?", "Doing okay?", "Psst!"],
  es: ["¿Ayuda?", "¿Atascado?", "¡Puedo ayudar!", "Pregúntame.", "¿Una pista?", "¿Todo bien?", "¡Psst!"]
};

const Mascot: React.FC<MascotProps> = ({ activeSection, lang }) => {
  const [petType, setPetType] = useState<PetType>('dog');
  const [viewMode, setViewMode] = useState<ViewMode>('hidden'); // Default off-screen
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  
  // UI State
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Chat Logic State
  const [chatHistory, setChatHistory] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for timers
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- INITIALIZATION ---

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('tmc_mascot_type');
    if (saved && PETS.some(p => p.id === saved)) {
      setPetType(saved as PetType);
    }
    resetChat();
  }, []);

  const resetChat = useCallback(() => {
    setChatHistory([{
        id: 'init_' + Date.now(),
        role: 'assistant',
        text: lang === 'es' 
          ? `¡Hola! Soy tu tutor personal. ¿En qué te puedo ayudar hoy?` 
          : `Hi! I'm your personal tutor. How can I help you today?`,
        timestamp: Date.now()
    }]);
  }, [lang]);

  useEffect(() => {
      if (isChatOpen && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatHistory, isChatOpen, isTyping]);

  // --- PEEK LOGIC ---

  const schedulePeek = useCallback(() => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    
    // Random interval between 45s and 90s
    const delay = Math.random() * 45000 + 45000;
    
    peekTimerRef.current = setTimeout(() => {
      // Only peek if currently hidden and chat is closed
      if (!isChatOpen && viewMode === 'hidden') {
        triggerPeek();
      } else {
        // Try again later if busy
        schedulePeek();
      }
    }, delay);
  }, [isChatOpen, viewMode]);

  const triggerPeek = () => {
    setViewMode('peeking');
    
    // Generate random message
    const sounds = PET_PHRASES[petType];
    const prompts = HELP_PROMPTS[lang];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    const text = prompts[Math.floor(Math.random() * prompts.length)];
    setSpeechBubble(`${sound} ${text}`);

    // Auto hide after 6 seconds if no interaction
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setSpeechBubble(null);
      setViewMode('hidden');
      schedulePeek(); // Schedule next
    }, 6000);
  };

  // Start loop on mount
  useEffect(() => {
    schedulePeek();
    return () => {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [schedulePeek]);

  // --- INTERACTIONS ---

  const handleMascotClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    setViewMode('active');
    setSpeechBubble(null);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setViewMode('hidden'); // Return to hiding
    schedulePeek(); // Restart loop
  };

  const handleSummon = () => {
    // Manually call pet
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setViewMode('active');
    setSpeechBubble(lang === 'es' ? '¡Aquí estoy!' : 'I\'m here!');
    setTimeout(() => setSpeechBubble(null), 3000);
  };

  const handlePetChange = (type: PetType) => {
    setPetType(type);
    localStorage.setItem('tmc_mascot_type', type);
    setShowPetSelector(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isTyping) return;

      const userMsg: AssistantMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: input,
          timestamp: Date.now()
      };

      setChatHistory(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      try {
          const currentPet = PETS.find(p => p.id === petType) || PETS[0];
          const response = await tutorChat(chatHistory.concat(userMsg), currentPet.persona, lang);
          
          const aiMsg: AssistantMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              text: response.text,
              type: response.type,
              timestamp: Date.now()
          };
          
          setChatHistory(prev => [...prev, aiMsg]);
      } catch (err) {
          console.error(err);
      } finally {
          setIsTyping(false);
      }
  };

  // --- ANIMATION VARIANTS ---

  // Offsets for different modes
  // Mobile (Left aligned) vs Desktop (Right aligned)
  const getVariants = (): Variants => {
    const isRight = !isMobile; 
    
    // X Positions
    const xHidden = isRight ? 200 : -200; // Far off screen
    const xPeeking = isRight ? 70 : -70;  // Just edge visible
    const xActive = 0; // Fully visible in container

    // Rotations (Tilt head when peeking)
    const rPeeking = isRight ? -15 : 15;

    return {
      hidden: { x: xHidden, rotate: 0, opacity: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
      peeking: { x: xPeeking, rotate: rPeeking, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
      active: { x: xActive, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 14 } }
    };
  };

  const currentPetLabel = PETS.find(p => p.id === petType)?.label || 'Tutor';

  // --- RENDERERS ---

  const renderChat = () => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 right-4 md:right-8 w-[95vw] md:w-[400px] h-[60vh] md:h-[600px] bg-slate-50 rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 font-sans"
      >
          <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl shadow-inner relative overflow-hidden">
                      <OptimizedImage src={PET_ASSETS[petType] || PET_ASSETS['dog']} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                      <h3 className="font-black text-slate-800 text-sm">{currentPetLabel} Tutor</h3>
                      <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isTyping ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTyping ? 'Thinking...' : 'Online'}</span>
                      </div>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setShowPetSelector(!showPetSelector)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                      {showPetSelector ? '▲' : '▼'}
                  </button>
                  <button onClick={handleCloseChat} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                      <X size={20} />
                  </button>
              </div>
          </div>

          <AnimatePresence>
            {showPetSelector && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-100 border-b border-slate-200 grid grid-cols-5 gap-2 p-2 overflow-hidden z-20"
                >
                    {PETS.map(p => (
                        <button key={p.id} onClick={() => handlePetChange(p.id)} className={`p-2 rounded-xl text-xl flex justify-center hover:bg-white transition-colors ${petType === p.id ? 'bg-white shadow-sm ring-2 ring-blue-500' : ''}`}>{p.icon}</button>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
              {chatHistory.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isCorrection = msg.type === 'correction';
                  const isEncouragement = msg.type === 'encouragement';
                  return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                      >
                          {!isUser && (
                              <div className="flex items-center gap-2 mb-1 pl-1">
                                  {isCorrection && <AlertCircle size={12} className="text-amber-500" />}
                                  {isEncouragement && <Sparkles size={12} className="text-pink-500" />}
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${isCorrection ? 'text-amber-600' : isEncouragement ? 'text-pink-600' : 'text-slate-400'}`}>
                                      {isCorrection ? 'Correction' : isEncouragement ? 'Great Job!' : 'Tutor'}
                                  </span>
                              </div>
                          )}
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%] ${isUser ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-200' : isCorrection ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-none' : isEncouragement ? 'bg-pink-50 border border-pink-200 text-slate-800 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                              <div className="whitespace-pre-wrap font-medium">
                                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className={`font-black ${isUser ? 'text-white' : 'text-blue-600'}`}>{part}</span> : part)}
                              </div>
                          </div>
                      </motion.div>
                  );
              })}
              {isTyping && (
                  <div className="flex items-start gap-2">
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      </div>
                  </div>
              )}
              <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === 'es' ? "Pregúntame algo..." : "Ask me anything..."} className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white border-transparent focus:border-blue-500 border rounded-xl px-4 py-3 text-sm outline-none transition-all text-slate-800 font-medium" />
              <button disabled={!input.trim() || isTyping} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"><Send size={18} /></button>
          </form>
      </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {isChatOpen && renderChat()}
      </AnimatePresence>

      {/* Manual Summon Button (Always visible if hidden) */}
      <AnimatePresence>
        {viewMode === 'hidden' && !isChatOpen && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={handleSummon}
            className="fixed bottom-28 left-4 lg:left-auto lg:bottom-6 lg:right-6 z-30 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl shadow-lg backdrop-blur-md hover:bg-white/20 transition-all text-white border border-white/20"
            title="Call Tutor"
          >
            🐾
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mascot Container */}
      <div className="fixed z-40 bottom-28 left-4 lg:left-auto lg:bottom-8 lg:right-24 w-32 h-32 lg:w-28 lg:h-28 pointer-events-none">
        
        {/* Speech Bubble (Outside the transform container to avoid clipping/rotation issues if needed, but here we keep it simple) */}
        <AnimatePresence>
          {speechBubble && viewMode !== 'hidden' && !isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-slate-900 px-4 py-2 rounded-2xl rounded-bl-none shadow-xl border-2 border-slate-100 min-w-[120px] text-center z-50 pointer-events-auto cursor-pointer"
              onClick={handleMascotClick}
            >
              <p className="text-xs font-black leading-tight">{speechBubble}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={viewMode}
          variants={getVariants()}
          onClick={handleMascotClick}
          className="w-full h-full cursor-pointer pointer-events-auto relative"
        >
          {/* Use scaleX to flip if on left side (Mobile) so it faces right */}
          <div className="w-full h-full drop-shadow-2xl filter transition-transform duration-300" style={{ transform: isMobile ? 'scaleX(-1)' : 'none' }}>
            <OptimizedImage 
              src={PET_ASSETS[petType] || PET_ASSETS.dog} 
              alt="Mascot" 
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Mascot;
