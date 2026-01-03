
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import { assistantChat } from '../services/gemini';
import { AssistantMessage, ChatSession, AppSection } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  currentSection: string;
  onNavigate: (section: AppSection) => void;
}

const BUBBLE_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600'
];

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, lang, currentSection, onNavigate }) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tmc_chat_history');
    if (saved) {
      try {
        const parsedChats: ChatSession[] = JSON.parse(saved);
        if (parsedChats.length > 0) {
          setChats(parsedChats);
          // Set the most recently updated chat as active
          const mostRecent = parsedChats.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
          setActiveChatId(mostRecent.id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    // Default initial state if no storage
    createNewChat(true);
  }, []);

  // Save to LocalStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('tmc_chat_history', JSON.stringify(chats));
    }
  }, [chats]);

  // Scroll to bottom when messages in active chat change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chats, activeChatId, loading]);

  const createNewChat = (isInitial = false) => {
    const newId = Date.now().toString();
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const initialMsg: AssistantMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      text: lang === 'es' 
        ? '¡Hola! Soy tu asistente de El Camino. ¿Cómo puedo ayudarte hoy?' 
        : 'Hi! I am your El Camino assistant. How can I help you today?',
      timestamp: Date.now()
    };

    const newChat: ChatSession = {
      id: newId,
      title: lang === 'es' ? 'Nueva Charla' : 'New Chat',
      messages: [initialMsg],
      color: color,
      lastUpdated: Date.now()
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !activeChatId) return;

    const currentInput = input;
    setInput('');
    setLoading(true);

    // Optimistically add user message
    let updatedChats = chats.map(chat => {
      if (chat.id === activeChatId) {
        const userMsg: AssistantMessage = { id: Date.now().toString(), role: 'user', text: currentInput, timestamp: Date.now() };
        // Update title if it's the first user message
        const newTitle = chat.messages.length <= 1 ? (currentInput.slice(0, 15) + (currentInput.length > 15 ? '...' : '')) : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, userMsg],
          lastUpdated: Date.now()
        };
      }
      return chat;
    });
    setChats(updatedChats);

    try {
      // Get the active chat's full history for context
      const activeChat = updatedChats.find(c => c.id === activeChatId);
      const history = activeChat ? activeChat.messages : [];

      const { text, suggestion } = await assistantChat(history, currentSection, lang);
      
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === activeChatId) {
            const aiMsg: AssistantMessage = { 
              id: (Date.now() + 1).toString(), 
              role: 'assistant', 
              text: text, 
              timestamp: Date.now(),
              suggestion: suggestion
            };
            return {
              ...chat,
              messages: [...chat.messages, aiMsg],
              lastUpdated: Date.now()
            };
          }
          return chat;
        });
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: { section: AppSection, label: string }) => {
    onNavigate(suggestion.section);
    onClose();
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 z-[170] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header with Close and Identity */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">🤖</div>
                <div>
                  <p className="font-black text-white text-sm">TMC Assistant</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Context Aware AI</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-lg text-slate-400 transition-colors">✕</button>
            </div>

            {/* Bubble Bar (Navigation) */}
            <div className="px-4 py-3 border-b border-white/5 bg-slate-900/80 overflow-x-auto hide-scrollbar flex items-center gap-3">
              <button
                onClick={() => createNewChat()}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all shrink-0 active:scale-95"
                title={lang === 'es' ? "Nueva Conversación" : "New Chat"}
              >
                <span className="text-xl font-bold">+</span>
              </button>
              
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`h-10 px-4 rounded-full flex items-center gap-2 transition-all shrink-0 max-w-[140px] ${
                    activeChatId === chat.id 
                      ? `${chat.color} text-white ring-2 ring-white shadow-lg` 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate text-xs font-bold">{chat.title}</span>
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar bg-slate-900/50">
              {activeChat ? (
                activeChat.messages.map((m) => (
                  <div key={m.id} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                    {/* Render Suggestion Chip if exists */}
                    {m.suggestion && (
                      <motion.button
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSuggestionClick(m.suggestion!)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 border border-white/10 self-start"
                      >
                        <span>🚀</span> {m.suggestion.label}
                      </motion.button>
                    )}
                  </div>
                ))
              ) : (
                 <div className="flex justify-center items-center h-full text-slate-500 text-sm">
                   {lang === 'es' ? 'Inicia una nueva conversación...' : 'Start a new conversation...'}
                 </div>
              )}
              
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

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 md:p-6 bg-slate-950/80 border-t border-white/10 flex gap-3 backdrop-blur-md">
              <input 
                type="text" 
                placeholder={lang === 'es' ? 'Escribe aquí...' : 'Type here...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button 
                disabled={loading || !input.trim()}
                className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all hover:bg-blue-500"
              >
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
