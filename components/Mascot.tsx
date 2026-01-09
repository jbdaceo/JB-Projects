
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, AssistantMessage } from '../types';
import { tutorChat } from '../services/gemini';
import { X, Send, Bot, MessageSquare, ChevronDown, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

interface MascotConfig {
  id: string;
  name: string;
  icon: string;
  archetype: string;
}

const MASCOTS: MascotConfig[] = [
  { id: 'neural_1', name: 'Buddy', icon: '🐕', archetype: 'Loyal Guardian' },
  { id: 'neural_2', name: 'Luna', icon: '🐈', archetype: 'Wise Strategist' },
  { id: 'neural_3', name: 'Pip', icon: '🦜', archetype: 'Mimic Expert' }
];

const Mascot: React.FC<{ lang: Language }> = ({ lang }) => {
  const [activeMascot, setActiveMascot] = useState(MASCOTS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userMsg: AssistantMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    triggerHaptic('light');

    try {
      const systemPrompt = `You are ${activeMascot.name}, a helpful AI companion. Lang: ${lang}. Be concise and friendly. Respond with native flavor.`;
      const res = await tutorChat([...history, userMsg], systemPrompt, lang as any);
      setHistory(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: res.text, timestamp: Date.now() }]);
      triggerHaptic('medium');
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-28 right-8 lg:right-12 z-[100] w-14 h-14 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-[0_20px_50px_rgba(59,130,246,0.3)] border border-white/20 avatar-glow"
          >
            {activeMascot.icon}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </motion.button>
        )}

        {isOpen && (
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[200] w-[calc(100vw-48px)] md:w-[380px] max-h-[500px] h-[70vh] bg-slate-900/90 border border-white/10 rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden facetime-glass"
          >
            <div className="p-5 border-b border-white/5 bg-slate-950/40 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shadow-inner border border-white/5 avatar-glow">
                  {activeMascot.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white leading-tight uppercase tracking-widest">{activeMascot.name}</h4>
                  <p className="text-[9px] text-brand-400 font-bold uppercase tracking-[0.2em] flex items-center gap-1">
                    <Sparkles size={10}/> Neural Core Active
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"><ChevronDown size={20}/></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
               {history.length === 0 && (
                 <div className="text-center py-12 opacity-30 space-y-4">
                    <Bot className="mx-auto text-brand-500 animate-bounce" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">System Ready for Query</p>
                 </div>
               )}
               {history.map(m => (
                 <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-[22px] text-sm leading-relaxed ${
                     m.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-lg' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                   }`}>
                      {m.text}
                   </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex justify-start">
                   <div className="bg-slate-800 p-4 rounded-[20px] rounded-tl-none border border-white/5 flex gap-1.5 items-center">
                     <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></span>
                   </div>
                 </div>
               )}
            </div>

            <form onSubmit={handleSend} className="p-5 bg-slate-950/80 border-t border-white/5 flex gap-3 backdrop-blur-2xl">
              <input 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all placeholder:text-slate-600" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder={lang === 'es' ? 'Pregúntame algo...' : 'Sync neural query...'} 
              />
              <button disabled={!input.trim()} className="w-14 h-14 bg-brand-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30">
                <Send size={18} fill="currentColor"/>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Mascot;
