
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { ChatMsg, Language } from '../types';
import { motion } from 'framer-motion';
import { useAnimationVariants } from '../utils/performance';

interface ChatPageProps {
  lang: Language;
}

const ChatPage: React.FC<ChatPageProps> = ({ lang }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationVariants = useAnimationVariants();

  useEffect(() => {
    if (!user) return;

    // Join Chat
    socket.emit('server:chat:join', { user });

    // Listeners
    socket.on('chat:history', (history: ChatMsg[]) => setMessages(history));
    socket.on('chat:message', (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });

    return () => {
      socket.off('chat:history', () => {});
      socket.off('chat:message', () => {});
    };
  }, [user]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const msg: ChatMsg = {
      id: Date.now().toString(),
      userId: user.id,
      user: user.displayName,
      state: lang === 'es' ? 'CO' : 'US',
      text: input,
      time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
      isUser: true,
      learningTrack: user.learningTrack
    };

    socket.emit('server:chat:message', msg);
    setInput('');
  };

  if (!user) {
    return <div className="flex justify-center items-center h-full text-slate-500">Please log in to chat.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900/50 rounded-[32px] border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white">Global Chat</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {lang === 'es' ? 'Comunidad en Vivo' : 'Live Community'}
          </p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-brand-900/50 border border-brand-500/30 rounded-full text-[10px] font-bold text-brand-400">
             @Tomas available
           </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <motion.div 
            variants={animationVariants.slideUp}
            initial="hidden"
            animate="visible"
            key={m.id} 
            className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className={`text-[10px] font