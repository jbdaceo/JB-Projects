
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AppSection, Language, AssistantMessage } from '../types';
import { tutorChat } from '../services/gemini';
import { MessageCircle, X, Send, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import OptimizedImage from '../utils/performance';

interface MascotProps {
  activeSection: AppSection;
  lang: Language;
}

type MascotState = 'idle' | 'walking' | 'sleeping' | 'sitting' | 'pet' | 'eating' | 'drinking' | 'playing' | 'roaming' | 'happy';
type PetType = 'dog' | 'cat' | 'lion' | 'dragon' | 'shark' | 'frog' | 'man' | 'woman' | 'baby';

// High-quality 3D Rendered Assets (Fluent Emojis)
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

const Mascot: React.FC<MascotProps> = ({ activeSection, lang }) => {
  const [petType, setPetType] = useState<PetType>('dog');
  const [state, setState] = useState<MascotState>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isVisible, setIsVisible] = useState(true);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [hearts, setHearts] = useState<{id: number, x: number, y: number}[]>([]);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const defaultDirection = isMobile ? 'right' : 'left';

  useEffect(() => {
    const handleHappy = () => {
      setState('happy');
      setTimeout(() => setState('idle'), 3000);
    };
    window.addEventListener('tmc-mascot-happy', handleHappy);
    return () => window.removeEventListener('tmc-mascot-happy', handleHappy);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('tmc_mascot_type');
    if (saved && PETS.some(p => p.id === saved)) {
      setPetType(saved as PetType);
    }
    
    // Initial Greeting if history empty
    if (chatHistory.length === 0) {
        setChatHistory([{
            id: 'init',
            role: 'assistant',
            text: lang === 'es' 
              ? `¡Hola! Soy tu tutor personal. ¿En qué te puedo ayudar hoy?` 
              : `Hi! I'm your personal tutor. How can I help you today?`,
            timestamp: Date.now()
        }]);
    }
  }, []);

  useEffect(() => {
      if (isChatOpen && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatHistory, isChatOpen, isTyping]);

  const handlePetChange = (type: PetType) => {
    setPetType(type);
    localStorage.setItem('tmc_mascot_type', type);
    setShowPetSelector(false);
    setState('pet');
    setTimeout(() => setState('idle'), 1000);
  };

  const handlePetClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isChatOpen) return; // Do nothing if chat is open, use close button
    
    setIsChatOpen(true);
    setState('happy');
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
          // SAFEGUARD: Ensure we always have a valid pet, default to first if missing
          const currentPet = PETS.find(p => p.id === petType) || PETS[0];
          const response = await tutorChat(chatHistory.concat(userMsg), currentPet.persona, lang);
          
          const aiMsg: AssistantMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              text: response.text,
              type: response.type, // Custom property for card styling
              timestamp: Date.now()
          };
          
          setChatHistory(prev => [...prev, aiMsg]);
      } catch (err) {
          console.error(err);
      } finally {
          setIsTyping(false);
      }
  };

  // Behavior Loop (Only when chat is closed)
  useEffect(() => {
    if (!isVisible || isChatOpen) return;
    
    const behaviorLoop = setInterval(() => {
      if (Math.random() > 0.6) return; 
      if (['roaming', 'eating', 'drinking', 'playing', 'pet', 'happy'].includes(state)) return;

      const r = Math.random();
      let nextAction: MascotState = 'idle';
      
      if (r < 0.15) nextAction = 'eating';
      else if (r < 0.3) nextAction = 'drinking';
      else if (r < 0.45) nextAction = 'playing';
      else if (r < 0.65) nextAction = 'roaming';
      else if (r < 0.85) nextAction = 'sleeping';
      else nextAction = petType === 'shark' ? 'idle' : 'sitting';

      triggerAction(nextAction);
    }, 8000);

    return () => clearInterval(behaviorLoop);
  }, [isVisible, isMobile, state, petType, defaultDirection, isChatOpen]);

  const triggerAction = (action: MascotState) => {
    setState(action);
    if (action === 'roaming') {
        setTimeout(() => {
            setState('walking'); 
            setTimeout(() => {
                setState(petType === 'shark' ? 'idle' : 'sitting');
                setDirection(defaultDirection);
            }, 2000);
        }, 6000);
    } else {
        setTimeout(() => setState('idle'), 4000);
    }
  };

  const getRoamVariants = (): Variants => {
    const roamDistance = isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 100 : 200) : -(typeof window !== 'undefined' ? window.innerWidth - 500 : 500);
    
    return {
      roaming: { 
        x: [0, roamDistance * 0.5, roamDistance, roamDistance, roamDistance * 0.5, 0],
        scaleX: isMobile ? [1, 1, 1, -1, -1, 1] : [1, 1, 1, -1, -1, 1],
        transition: { duration: 6, times: [0, 0.4, 0.45, 0.55, 0.9, 1] }
      },
      idle: { 
        x: 0, 
        scaleX: defaultDirection === 'left' ? 1 : -1,
        y: [0, -5, 0], // Subtle breathing
        transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const }
      },
      happy: {
        y: [0, -20, 0],
        scaleX: defaultDirection === 'left' ? 1 : -1,
        rotate: [0, -10, 10, 0],
        transition: { repeat: Infinity, duration: 0.5 }
      },
      walking: { x: 0, y: [0, -10, 0], rotate: [0, 5, -5, 0], transition: { duration: 0.4, repeat: Infinity } },
      sitting: { x: 0 },
      eating: { x: 0, rotate: [0, 10, -10, 0], transition: { duration: 0.5, repeat: Infinity } },
      drinking: { x: 0, y: [0, 5, 0] },
      playing: { x: 0, rotate: [0, 360], transition: { duration: 1 } },
      sleeping: { x: 0, rotate: 5, y: 5 },
      pet: { x: 0, scale: 1.2 }
    };
  };

  // Safe accessor for current pet label
  const currentPetLabel = PETS.find(p => p.id === petType)?.label || 'Tutor';

  // --- RENDER CHAT UI ---
  const renderChat = () => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 right-4 md:right-8 w-[95vw] md:w-[400px] h-[60vh] md:h-[600px] bg-slate-50 rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 font-sans"
      >
          {/* Header */}
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
                  <button 
                    onClick={() => setShowPetSelector(!showPetSelector)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                      {showPetSelector ? '▲' : '▼'}
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                      <X size={20} />
                  </button>
              </div>
          </div>

          {/* Pet Selector Overlay */}
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

          {/* Messages */}
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
                          
                          <div className={`
                              p-4 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%]
                              ${isUser 
                                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-200' 
                                  : isCorrection 
                                      ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-none'
                                      : isEncouragement
                                          ? 'bg-pink-50 border border-pink-200 text-slate-800 rounded-tl-none'
                                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }
                          `}>
                              <div className="whitespace-pre-wrap font-medium">
                                  {/* Render simple markdown bolding */}
                                  {msg.text.split('**').map((part, i) => 
                                      i % 2 === 1 ? <span key={i} className={`font-black ${isUser ? 'text-white' : 'text-blue-600'}`}>{part}</span> : part
                                  )}
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

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
              <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang === 'es' ? "Pregúntame algo..." : "Ask me anything..."}
                  className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white border-transparent focus:border-blue-500 border rounded-xl px-4 py-3 text-sm outline-none transition-all text-slate-800 font-medium"
              />
              <button 
                  disabled={!input.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                  <Send size={18} />
              </button>
          </form>
      </motion.div>
  );

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-28 left-4 lg:left-auto lg:bottom-6 lg:right-6 z-30 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl shadow-lg backdrop-blur-md hover:bg-white/20 transition-all opacity-50 hover:opacity-100"
        title="Call Pet"
      >
        🐾
      </button>
    );
  }

  return (
    <>
        <AnimatePresence>
            {isChatOpen && renderChat()}
        </AnimatePresence>

        <div 
          className="fixed z-30 bottom-28 left-4 lg:left-auto lg:bottom-8 lg:right-24 pointer-events-none w-32 h-32 lg:w-28 lg:h-28"
        >
          <motion.div
            className="relative w-full h-full cursor-pointer pointer-events-auto"
            onClick={handlePetClick}
            animate={isChatOpen ? { opacity: 0, scale: 0 } : state}
            variants={getRoamVariants()}
            onMouseEnter={() => !isMobile && setShowPetSelector(true)}
            onMouseLeave={() => !isMobile && (hoverTimerRef.current = setTimeout(() => setShowPetSelector(false), 2000))}
          >
            {/* Simple tooltip for non-chat state */}
            {!isChatOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap pointer-events-none"
                >
                    {lang === 'es' ? '¡Click para ayuda!' : 'Click for help!'}
                </motion.div>
            )}

            <PropsLayer state={state} />

            {hearts.map(h => (
              <motion.div
                key={h.id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -60, scale: 1.5 }}
                className="absolute left-1/2 top-0 text-red-500 text-2xl font-black pointer-events-none z-50"
                style={{ x: h.x, y: h.y }}
              >
                ♥
              </motion.div>
            ))}

            <PetRenderer type={petType} defaultDirection={defaultDirection} />

          </motion.div>
        </div>
    </>
  );
};

const PropsLayer = ({ state }: { state: MascotState }) => (
  <AnimatePresence>
    {['eating', 'drinking'].includes(state) && (
      <motion.div 
        initial={{ opacity: 0, scale: 0 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0 }}
        className="absolute bottom-0 -left-6 w-12 h-8 z-10"
      >
        <svg viewBox="0 0 40 20" className="drop-shadow-lg">
          <defs>
             <linearGradient id="bowlGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#1e3a8a" />
               <stop offset="100%" stopColor="#172554" />
             </linearGradient>
          </defs>
          <path d="M0 5 Q 20 30 40 5 L 35 18 Q 20 22 5 18 Z" fill="url(#bowlGrad)" /> 
          <ellipse cx="20" cy="5" rx="18" ry="4" fill={state === 'eating' ? "#92400e" : "#60a5fa"} opacity="0.9" />
        </svg>
      </motion.div>
    )}
    {state === 'playing' && (
      <motion.div 
        initial={{ x: -20, y: -50, opacity: 0 }} 
        animate={{ x: [0, -40, -10, -50], y: [0, -30, 0, -10], opacity: 1 }} 
        exit={{ opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="absolute bottom-2 left-0 w-8 h-8 z-20"
      >
        <svg viewBox="0 0 20 20" className="drop-shadow-md">
          <circle cx="10" cy="10" r="10" fill="#ef4444" />
          <circle cx="7" cy="7" r="2" fill="white" opacity="0.5" />
          <path d="M10 0 L10 20 M0 10 L20 10" stroke="#b91c1c" strokeWidth="2" />
        </svg>
      </motion.div>
    )}
  </AnimatePresence>
);

const PetRenderer = ({ type, defaultDirection }: { type: PetType, defaultDirection: string }) => {
  // Defensive check: ensure type exists in map, else fallback to dog
  const assetSrc = PET_ASSETS[type] || PET_ASSETS['dog'];
  
  return (
    <div 
      className="w-full h-full drop-shadow-2xl filter" 
      style={{ transform: defaultDirection === 'right' ? 'scaleX(-1)' : 'none' }}
    >
      <OptimizedImage 
        src={assetSrc} 
        alt={type} 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default Mascot;
