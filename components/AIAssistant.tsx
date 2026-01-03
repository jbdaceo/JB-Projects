
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import { assistantChat } from '../services/gemini';
import { AssistantMessage } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  currentSection: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, lang, currentSection }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: '1', role: 'assistant', text: lang === 'es' ? '¡Hola! Soy tu asistente de El Camino. ¿Cómo puedo ayudarte hoy?' : 'Hi! I am your El Camino assistant. How can I help you today?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: AssistantMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await assistantChat(input, currentSection);
      const aiMsg: AssistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 z-[70] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl">🤖</div>
                <div>
                  <p className="font-black text-white text-sm">TMC Assistant</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Context Aware AI</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-xl text-slate-400">✕</button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl animate-pulse flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-6 bg-slate-950/50 border-t border-white/10 flex gap-3">
              <input 
                type="text" 
                placeholder={lang === 'es' ? 'Pregúntame algo...' : 'Ask me anything...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg active-scale">
                🚀
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIAssistant;
