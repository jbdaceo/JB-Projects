import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { ChatMsg, Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageCircle, Info } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

interface ChatPageProps {
  lang: Language;
}

const ChatPage: React.FC<ChatPageProps> = ({ lang }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const handleHistory = (history: ChatMsg[]) => {
      setMessages(history);
      setIsConnected(true);
      requestAnimationFrame(scrollToBottom);
    };

    const handleMessage = (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg]);
      requestAnimationFrame(scrollToBottom);
    };

    // Attach listeners BEFORE emitting join to catch initial broadcast
    socket.on('chat:history', handleHistory);
    socket.on('chat:message', handleMessage);
    
    socket.emit('server:chat:join', { user });

    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('chat:message', handleMessage);
    };
  }, [user]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    triggerHaptic('light');
    const msg: ChatMsg = {
      id: Date.now().toString(),
      userId: user.id,
      user: user.displayName,
      state: lang === 'es' ? 'CO' : 'US',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      learningTrack: user.learningTrack
    };

    socket.emit('server:chat:message', msg);
    setInput('');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] bg-slate-900/40 rounded-[40px] border border-white/5 overflow-hidden glass-panel shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Global Pulse</h2>
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               {lang === 'es' ? 'Comunidad Activa' : 'Live Community'}
             </p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full">
              <Users size={12} className="text-brand-400" />
              <span className="text-[10px] font-bold text-slate-400">1.4k</span>
           </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center space-y-4">
            <MessageCircle size={64} />
            <p className="font-bold uppercase tracking-widest text-xs">Syncing neural chat pipeline...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isAi = m.type === 'ai';
              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${m.isUser ? 'text-brand-400' : isAi ? 'text-amber-400' : 'text-slate-500'}`}>
                      {m.user} {m.state && `• ${m.state}`}
                    </span>
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-3xl shadow-xl ${
                    m.isUser 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : isAi 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100 rounded-tl-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                  }`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                    <span className="block text-[8px] opacity-40 mt-2 text-right">{m.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-6 bg-slate-950/80 border-t border-white/5 flex gap-3 backdrop-blur-2xl">
        <input 
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all placeholder:text-slate-700" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder={lang === 'es' ? 'Mensaje a la comunidad...' : 'Message the community...'} 
        />
        <button type="submit" className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
           <Send size={20} fill="currentColor"/>
        </button>
      </form>
    </div>
  );
};

export default ChatPage;