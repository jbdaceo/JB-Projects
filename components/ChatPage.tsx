
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { ChatMsg, Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageCircle, Sparkles, Globe, Shield, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

interface ChatPageProps {
  lang: Language;
}

const CHANNELS = [
  { id: 'global', name: 'Global Hub', icon: '🌐', color: 'border-blue-500/30' },
  { id: 'business', name: 'Business Sector', icon: '💼', color: 'border-emerald-500/30' },
  { id: 'slang', name: 'Street Slang', icon: '🔥', color: 'border-amber-500/30' },
  { id: 'tech', name: 'Tech Pipeline', icon: '💻', color: 'border-indigo-500/30' }
];

const ChatPage: React.FC<ChatPageProps> = ({ lang }) => {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
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
      if (msg.channelId === activeChannel.id) {
        setMessages(prev => [...prev, msg]);
        requestAnimationFrame(scrollToBottom);
      }
    };

    // Use namespaced events from mockBackend
    socket.on(`chat:history:${activeChannel.id}`, handleHistory);
    socket.on(`chat:message:${activeChannel.id}`, handleMessage);
    
    socket.emit('server:chat:join', { user, channelId: activeChannel.id });

    return () => {
      socket.off(`chat:history:${activeChannel.id}`, handleHistory);
      socket.off(`chat:message:${activeChannel.id}`, handleMessage);
    };
  }, [user, activeChannel]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
      channelId: activeChannel.id
    };

    socket.emit('server:chat:message', msg);
    setInput('');
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] gap-6 font-sans">
      {/* Sector Navigation */}
      <aside className="w-20 md:w-64 flex flex-col gap-4 shrink-0 overflow-y-auto hide-scrollbar">
         {CHANNELS.map(ch => (
           <button 
             key={ch.id} 
             onClick={() => { setActiveChannel(ch); triggerHaptic('medium'); }}
             className={`p-6 rounded-[32px] border-2 transition-all text-left flex items-center gap-4 relative overflow-hidden group ${activeChannel.id === ch.id ? 'bg-slate-900 border-brand-500 shadow-2xl' : 'bg-slate-950 border-white/5 opacity-60 hover:opacity-100 hover:bg-slate-900'}`}
           >
             <span className="text-2xl group-hover:scale-110 transition-transform">{ch.icon}</span>
             <span className="hidden md:block font-black text-white uppercase text-[10px] tracking-widest">{ch.name}</span>
             {activeChannel.id === ch.id && <ChevronRight className="hidden md:block ml-auto text-brand-500" size={14}/>}
           </button>
         ))}
      </aside>

      {/* Chat Arena */}
      <div className="flex-1 flex flex-col bg-slate-900/40 rounded-[48px] border border-white/5 overflow-hidden glass-panel shadow-2xl relative">
        <div className="p-8 border-b border-white/5 bg-slate-950/50 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">{activeChannel.icon}</div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{activeChannel.name}</h2>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Isolated Synchronous Link</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full shadow-inner">
                <Users size={14} className="text-brand-400" />
                <span className="text-[9px] font-black text-slate-200">24 COHORTS LIVE</span>
             </div>
             <Shield size={20} className="text-slate-600"/>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 hide-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isAi = m.type === 'ai';
              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-center gap-2 mb-1 px-2 ${m.isUser ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${m.isUser ? 'text-brand-400' : isAi ? 'text-amber-400' : 'text-slate-500'}`}>
                      {m.user} {m.state && `• ${m.state}`}
                    </span>
                    <span className="text-[7px] font-bold text-slate-600">{m.time}</span>
                  </div>
                  <div className={`max-w-[80%] p-5 rounded-[28px] shadow-2xl border ${
                    m.isUser 
                      ? 'bg-brand-600 text-white border-brand-500/50 rounded-tr-none' 
                      : isAi 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 rounded-tl-none facetime-glass'
                        : 'bg-slate-800/80 text-slate-200 border-white/5 rounded-tl-none'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-950/80 border-t border-white/5 relative z-10 backdrop-blur-3xl">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-4">
            <div className="relative flex-1 group">
              <input 
                className="w-full bg-white/5 border-2 border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-all placeholder:text-slate-700 shadow-inner pr-16" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder={`Message ${activeChannel.name}...`} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
              />
            </div>
            <button type="submit" disabled={!input.trim()} className="w-20 h-20 bg-brand-500 rounded-[28px] flex items-center justify-center text-white shadow-2xl active:scale-95 disabled:opacity-30 transition-all hover:bg-brand-400 group">
               <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
