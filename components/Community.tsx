
import React, { useState, useRef, useEffect } from 'react';
// Added Language import
import { Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface ChatMsg {
  id: string;
  user: string;
  text: string;
  time: string;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  status: 'pending' | 'approved';
  date: string;
}

// Added CommunityProps
interface CommunityProps {
  lang: Language;
}

const Community: React.FC<CommunityProps> = ({ lang }) => {
  const [tab, setTab] = useState<'chat' | 'comments'>('chat');
  const [isProfessor, setIsProfessor] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: '1', user: 'Sofia R.', text: '¿Alguien quiere practicar el Speaking de la lección 2?', time: '10:05 AM' },
    { id: '2', user: 'Mateo G.', text: '¡Yo! Sofia, hablemos por el canal de voz.', time: '10:06 AM' },
    { id: '3', user: 'Valentina P.', text: 'Tomas, la clase de ayer sobre Remote Work estuvo increíble. Me ayudó mucho a entender cómo funcionan los procesos de selección en empresas de San Francisco.', time: '10:15 AM' }
  ]);
  const [newChatText, setNewChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', user: 'Daniel L.', text: 'Gracias Profe Tomas por ayudarme con mi CV en inglés. ¡Ya tengo mi primera entrevista en una empresa de desarrollo web en Canadá! No lo puedo creer.', status: 'approved', date: 'Hace 2 horas' },
    { id: 'c2', user: 'Camila V.', text: '¿Podríamos hacer una sesión sobre Phrasal Verbs específicos para IT? Siento que en las reuniones técnicas a veces me pierdo con expresiones muy informales.', status: 'pending', date: 'Hace 10 mins' }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (tab === 'chat') scrollToBottom();
  }, [chatMessages, tab]);

  const toggleCommentExpand = (id: string) => {
    setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const msg: ChatMsg = {
      id: Date.now().toString(),
      user: 'Tú',
      text: newChatText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([...chatMessages, msg]);
    setNewChatText('');
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const comm: Comment = {
      id: Date.now().toString(),
      user: 'Tú',
      text: newCommentText,
      status: 'pending',
      date: 'Recién publicado'
    };
    setComments([comm, ...comments]);
    setNewCommentText('');
    alert('Enviado al Profe Tomas.');
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter flex items-center gap-3">
             <span className="text-blue-500">🌎</span> Mundo El Camino
          </h2>
          <p className="text-slate-500 text-[10px] md:text-lg font-bold uppercase tracking-widest mt-1">Chat Global & Feedback</p>
        </div>
        
        <div className="flex glass-morphism p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setTab('chat')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${tab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setTab('comments')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${tab === 'comments' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            Muro
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {tab === 'chat' ? (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col glass-morphism rounded-[40px] overflow-hidden shadow-2xl h-[55svh] md:h-[650px]"
          >
            <div className="flex-1 p-6 overflow-y-auto space-y-6 hide-scrollbar">
              {chatMessages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.user === 'Tú' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{m.user}</span>
                    <span className="text-[8px] text-slate-600 font-bold">{m.time}</span>
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-3xl ${m.user === 'Tú' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>
                    <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-5 bg-black/20 border-t border-white/5 flex gap-3">
              <input 
                type="text" 
                placeholder="Dilo en inglés..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
              />
              <button className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg active-scale">
                🚀
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="comments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {comments.map((c) => (
                  (c.status === 'approved' || isProfessor) && (
                    <div key={c.id} className={`p-8 rounded-[36px] border transition-all duration-300 glass-morphism overflow-hidden relative`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center text-sm font-black text-blue-400 border border-white/5 shadow-inner">
                          {c.user[0]}
                        </div>
                        <div>
                           <p className="font-black text-white text-base">{c.user}</p>
                           <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{c.date}</p>
                        </div>
                      </div>
                      
                      <p className={`text-slate-300 text-sm md:text-lg leading-relaxed font-medium transition-all duration-500 ${!expandedComments[c.id] && c.text.length > 100 ? 'line-clamp-3' : ''}`}>
                        {c.text}
                      </p>
                      {c.text.length > 100 && (
                        <button 
                          onClick={() => toggleCommentExpand(c.id)}
                          className="mt-4 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] hover:text-blue-300"
                        >
                          {expandedComments[c.id] ? 'Cerrar' : 'Leer más'}
                        </button>
                      )}
                    </div>
                  )
                ))}
              </div>

              <div className="space-y-6">
                <form onSubmit={handlePostComment} className="glass-morphism p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6 h-fit">
                  <h3 className="text-2xl font-black text-white tracking-tight">Tu Huella</h3>
                  <textarea 
                    placeholder="Comparte tu progreso..."
                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 min-h-[160px] shadow-inner resize-none font-medium"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                  />
                  <button className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl text-sm shadow-xl shadow-blue-500/20 active-scale">
                    Publicar
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
