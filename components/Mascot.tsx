
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Language, AssistantMessage } from '../types';
import { tutorChat } from '../services/gemini';
import { ChevronDown, Send, Sparkles, Zap, CloudLightning } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

const Mascot: React.FC<{ lang: Language }> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<'idle' | 'happy' | 'thinking' | 'excited' | 'talking' | 'shock'>('idle');
  // New state for variable shock intensity
  const [shockLevel, setShockLevel] = useState<'none' | 'mild' | 'medium' | 'terror'>('none');
  const [randomTip, setRandomTip] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- PUPPET RIGGING ---
  const SparkPuppet = ({ state, size = 'md' }: { state: string, size?: 'sm' | 'md' | 'lg' }) => {
      const controls = useAnimation();
      
      // Scale config
      const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.4 : 1;

      // Eye Blinking Logic
      const [blink, setBlink] = useState(false);
      useEffect(() => {
          const loop = setInterval(() => {
              if (Math.random() > 0.8) {
                  setBlink(true);
                  setTimeout(() => setBlink(false), 200);
              }
          }, 3000);
          return () => clearInterval(loop);
      }, []);

      // Mouth Animation for "Talking"
      const mouthVariant = {
          idle: { height: 4, width: 10, borderRadius: 10 },
          happy: { height: 8, width: 14, borderRadius: "0 0 14px 14px" },
          talking: { height: [4, 10, 4, 8], width: [10, 8, 12, 10], transition: { repeat: Infinity, duration: 0.3 } },
          thinking: { height: 4, width: 6, borderRadius: 10, x: 2 },
          excited: { height: 12, width: 16, borderRadius: "0 0 16px 16px" },
          shock: { height: 20, width: 20, borderRadius: "50%" } // Wide open mouth
      };

      // Body Physics based on shock level
      const getShockVariant = () => {
          if (shockLevel === 'terror') {
              // Terror: Violent shaking, erratic rotation, massive scaling
              return {
                  x: [-30, 30, -20, 40, -10, 10, 0],
                  y: [-30, 30, -40, 20, 0],
                  scale: [1, 2.5, 0.4, 3.0, 1],
                  rotate: [-60, 60, -120, 120, 0],
                  filter: ["brightness(1)", "brightness(5)", "invert(1)", "brightness(1)"],
                  transition: { duration: 0.2, repeat: 12 }
              };
          } else if (shockLevel === 'medium') {
              return {
                  x: [-10, 10, -5, 5, 0],
                  y: [-5, 5, -5, 5, 0],
                  scale: [1, 1.3, 0.9, 1.1, 1],
                  rotate: [-15, 15, -10, 10, 0],
                  transition: { duration: 0.25, repeat: 4 }
              };
          } else {
              return {
                  x: [-5, 5, -3, 3, 0],
                  scale: [1, 1.1, 1],
                  transition: { duration: 0.15, repeat: 3 }
              };
          }
      };

      const bodyVariant = {
          idle: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
          happy: { y: [0, -10, 0], rotate: [0, 5, -5, 0], transition: { repeat: Infinity, duration: 0.8 } },
          excited: { y: [0, -5, 0], scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.4 } },
          thinking: { rotate: [0, 5, 0], transition: { repeat: Infinity, duration: 2 } },
          talking: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 0.5 } },
          shock: getShockVariant()
      };

      return (
          <div className="relative w-24 h-24 flex items-center justify-center select-none pointer-events-none" style={{ transform: `scale(${scale})` }}>
              {/* Main Body Shape */}
              <motion.div 
                variants={bodyVariant}
                animate={state}
                className={`relative z-10 w-16 h-16 bg-gradient-to-tr from-yellow-300 to-amber-500 rounded-[24px] shadow-[inset_-4px_-4px_10px_rgba(217,119,6,0.5),0_10px_20px_rgba(0,0,0,0.2)] border-2 border-white/50 flex flex-col items-center justify-center overflow-hidden ${state === 'shock' ? 'brightness-200 contrast-150 border-white' : ''}`}
              >
                  {/* Face Container */}
                  <div className="relative z-20 flex flex-col items-center gap-1.5 mt-2">
                      {/* Eyes */}
                      <div className="flex gap-2">
                          <motion.div 
                             animate={{ 
                                 scaleY: blink ? 0.1 : 1, 
                                 height: state === 'happy' ? 4 : state === 'shock' ? (shockLevel === 'terror' ? 16 : 12) : 10,
                                 width: state === 'shock' ? (shockLevel === 'terror' ? 16 : 12) : 12 
                             }}
                             className={`w-3 rounded-full shadow-sm ${state === 'shock' ? 'bg-white' : 'bg-slate-900'}`}
                          />
                          <motion.div 
                             animate={{ 
                                 scaleY: blink ? 0.1 : 1, 
                                 height: state === 'happy' ? 4 : state === 'shock' ? (shockLevel === 'terror' ? 16 : 12) : 10,
                                 width: state === 'shock' ? (shockLevel === 'terror' ? 16 : 12) : 12 
                             }}
                             className={`w-3 rounded-full shadow-sm ${state === 'shock' ? 'bg-white' : 'bg-slate-900'}`}
                          />
                      </div>
                      
                      {/* Cheeks */}
                      {(state === 'happy' || state === 'excited') && (
                          <div className="absolute top-3 w-full flex justify-between px-1 opacity-40">
                              <div className="w-2 h-1 bg-rose-500 rounded-full blur-[1px]" />
                              <div className="w-2 h-1 bg-rose-500 rounded-full blur-[1px]" />
                          </div>
                      )}

                      {/* Mouth */}
                      <motion.div 
                         variants={mouthVariant}
                         animate={state}
                         className="bg-slate-900"
                      />
                  </div>

                  {/* Reflection/Sheen */}
                  <div className="absolute top-0 right-0 w-10 h-10 bg-white/20 rounded-full blur-md -mr-2 -mt-2" />
              </motion.div>

              {/* Floating Bolt Accessory */}
              <motion.div 
                animate={{ 
                    y: state === 'thinking' ? [-5, -10, -5] : [0, -3, 0],
                    rotate: state === 'excited' ? [0, 15, -15, 0] : [0, 5, 0]
                }}
                transition={{ repeat: Infinity, duration: state === 'excited' ? 0.2 : 2 }}
                className="absolute -top-4 -right-2 z-20 text-3xl drop-shadow-md"
              >
                  ⚡
              </motion.div>
          </div>
      );
  };

  // --- BEHAVIOR LOGIC ---
  useEffect(() => {
    // Listen for global shock triggers (e.g., failed quiz)
    const handleShockEvent = (e: CustomEvent) => {
        const level = e.detail?.level || 'medium'; // 'mild' | 'medium' | 'terror'
        setShockLevel(level);
        setMood('shock');
        if (level === 'mild') triggerHaptic('light');
        else if (level === 'medium') triggerHaptic('medium');
        else triggerHaptic('error');

        setTimeout(() => {
            setMood('idle');
            setShockLevel('none');
        }, level === 'terror' ? 3000 : 1500);
    };

    window.addEventListener('tmc-mascot-trigger', handleShockEvent as EventListener);

    // Random proactive tips
    const tipInterval = setInterval(() => {
        if (!isOpen && Math.random() > 0.85 && mood !== 'shock') {
            const tips = lang === 'es' 
                ? ["¡Mantén la racha!", "¿5 minutos más?", "¡Vas genial!", "¡Aprende una palabra!"]
                : ["Keep the streak!", "5 more mins?", "Doing great!", "Learn a word!"];
            setRandomTip(tips[Math.floor(Math.random() * tips.length)]);
            setMood('excited');
            triggerHaptic('light');
            setTimeout(() => { setRandomTip(null); setMood('idle'); }, 4000);
        }
    }, 15000);

    // Random Electric Shocks - DYNAMIC LEVELS - INCREASED TERROR
    const shockInterval = setInterval(() => {
        if (!isOpen && Math.random() > 0.85 && mood !== 'shock') { // Slightly reduced chance
            // Determine Intensity
            const rand = Math.random();
            let level: 'mild' | 'medium' | 'terror' = 'mild';
            if (rand > 0.90) level = 'terror';      // 10% chance of TERROR (increased)
            else if (rand > 0.65) level = 'medium';  // 25% chance of Medium

            setShockLevel(level);
            setMood('shock');
            
            // Haptic feedback scales with intensity
            if (level === 'mild') triggerHaptic('light');
            else if (level === 'medium') triggerHaptic('medium');
            else triggerHaptic('error'); // Heavy vibration

            // Duration scales with intensity
            const duration = level === 'terror' ? 3000 : level === 'medium' ? 1500 : 800;
            
            setTimeout(() => {
                setMood('idle');
                setShockLevel('none');
            }, duration);
        }
    }, 12000);

    return () => {
        clearInterval(tipInterval);
        clearInterval(shockInterval);
        window.removeEventListener('tmc-mascot-trigger', handleShockEvent as EventListener);
    };
  }, [isOpen, lang, mood]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userMsg: AssistantMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setMood('thinking');
    triggerHaptic('light');

    try {
      const systemPrompt = `You are Spark, a hyper-energetic yellow lightning bolt mascot. User Language: ${lang === 'es' ? 'Spanish' : 'English'}. Target: ${lang === 'es' ? 'English' : 'Spanish'}. Be short, punchy, use emojis.`;
      const res = await tutorChat([...history, userMsg], systemPrompt, lang as any);
      const aiMsg: AssistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: res.text, timestamp: Date.now() };
      setHistory(prev => [...prev, aiMsg]);
      triggerHaptic('medium');
      setMood('talking');
      setTimeout(() => setMood('idle'), 3000);
    } catch (e) {
      setMood('idle');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* GLOBAL SCREEN FLICKER & LIGHTNING EFFECTS FOR SHOCK */}
      <AnimatePresence>
        {mood === 'shock' && (
            <motion.div 
                className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* 1. White Flash Overlay (Strobe) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ 
                        opacity: shockLevel === 'terror' ? [0, 1, 0, 1, 0.5, 1, 0] : [0, 0.6, 0, 0.3, 0] 
                    }}
                    transition={{ duration: shockLevel === 'terror' ? 0.8 : 0.5, repeat: shockLevel === 'terror' ? 2 : 0 }}
                    className="absolute inset-0 bg-white mix-blend-overlay"
                />

                {/* 2. Invert/Glitch Effect (Terror Only) */}
                {shockLevel === 'terror' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0, 1, 0] }}
                        transition={{ duration: 0.2, repeat: 4, repeatType: "mirror" }}
                        className="absolute inset-0 bg-white mix-blend-difference"
                    />
                )}

                {/* 3. SVG Lightning Bolt (Terror Only) */}
                {shockLevel === 'terror' && (
                    <motion.svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 w-full h-full text-yellow-300 drop-shadow-[0_0_50px_rgba(253,224,71,1)]"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.3, repeat: 3 }}
                    >
                        <motion.path
                            d="M50 0 L60 40 L90 40 L40 100 L50 60 L20 60 Z"
                            fill="currentColor"
                            stroke="white"
                            strokeWidth="2"
                        />
                    </motion.svg>
                )}

                {/* 4. Screen Shake (Container Transform) */}
                {shockLevel === 'terror' && (
                    <motion.div 
                        initial={{ x: 0, y: 0 }}
                        animate={{ 
                            x: [-50, 50, -30, 30, -10, 10, 0], 
                            y: [-50, 50, -30, 30, -10, 10, 0],
                            rotate: [-5, 5, -3, 3, 0]
                        }}
                        transition={{ duration: 0.4, repeat: 2 }}
                        className="absolute inset-0 border-[40px] border-yellow-500 opacity-50"
                    />
                )}
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          // Adjusted bottom position for mobile navigation dock clearance
          <div className="fixed bottom-24 md:bottom-12 right-6 z-[100] flex flex-col items-end pointer-events-none transition-all duration-300">
             {/* Random Tip Bubble */}
             <AnimatePresence>
                {randomTip && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white text-slate-900 px-4 py-3 rounded-2xl rounded-br-sm shadow-xl border-2 border-slate-100 font-bold text-xs mb-2 relative max-w-[150px] pointer-events-auto origin-bottom-right text-center"
                    >
                        {randomTip}
                        <div className="absolute -bottom-2 -right-[2px] w-4 h-4 bg-white border-b-2 border-r-2 border-slate-100 transform rotate-45 clip-path-polygon" />
                    </motion.div>
                )}
             </AnimatePresence>

             {/* Trigger Button */}
             <motion.button 
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setIsOpen(true); setMood('happy'); }}
                className="relative cursor-pointer group pointer-events-auto"
             >
                <SparkPuppet state={mood} />
                {/* Notification Badge */}
                <div className="absolute bottom-2 right-2 bg-red-500 w-4 h-4 rounded-full border-2 border-slate-900 animate-ping" />
             </motion.button>
          </div>
        )}

        {isOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="fixed bottom-0 md:bottom-6 right-0 md:right-4 z-[200] w-full md:w-[380px] h-[85vh] md:h-[550px] bg-slate-900 border border-white/10 rounded-t-[32px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden backdrop-blur-3xl ring-1 ring-white/10"
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-r from-amber-400 to-orange-500 relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
               <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 rounded-full p-1"><SparkPuppet state={mood === 'idle' ? 'happy' : mood} size="sm" /></div>
                  <div>
                     <h3 className="font-black text-white text-lg drop-shadow-md leading-none">Spark</h3>
                     <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest">Level 12 Guide</p>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white transition-all relative z-10"><ChevronDown size={20}/></button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar bg-slate-950/50 pb-safe">
               {history.length === 0 && (
                  <div className="text-center text-slate-400 text-sm mt-12 space-y-6 flex flex-col items-center">
                     <SparkPuppet state="happy" size="lg" />
                     <p className="font-medium px-8 leading-relaxed max-w-xs text-center">
                        {lang === 'es' ? '¡Hola! Soy Spark. ¿Qué aprendemos hoy?' : 'Hi! I am Spark. What shall we learn today?'}
                     </p>
                  </div>
               )}
               {history.map(m => (
                 <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3.5 rounded-[20px] text-sm max-w-[85%] font-medium leading-relaxed shadow-lg ${m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white text-slate-900 rounded-tl-sm'}`}>
                       {m.text}
                    </div>
                 </div>
               ))}
               {isTyping && (
                   <div className="flex justify-start">
                       <div className="bg-white/10 p-4 rounded-[20px] rounded-tl-sm flex gap-1.5 items-center">
                           <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                           <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-100" />
                           <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-200" />
                       </div>
                   </div>
               )}
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-900 border-t border-white/5 shrink-0 pb-safe">
               <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-5 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500" 
                    placeholder={lang === 'es' ? 'Pregunta algo...' : 'Ask something...'}
                    value={input}
                    onChange={e => { setInput(e.target.value); setMood('thinking'); }}
                    onBlur={() => setMood('idle')}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                  />
                  <button type="submit" disabled={!input.trim()} className="w-12 h-12 bg-amber-400 hover:bg-amber-500 rounded-[20px] flex items-center justify-center text-amber-950 disabled:opacity-50 shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Mascot;
