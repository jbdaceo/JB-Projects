
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { RoomState, Language, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Zap, ShieldAlert, Users, MessageSquare, Loader2, X } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

interface BreakoutRoomProps {
  lang: Language;
  onNavigate?: (section: AppSection) => void;
}

const BreakoutRoom: React.FC<BreakoutRoomProps> = ({ lang, onNavigate }) => {
  const { user } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [answer, setAnswer] = useState('');
  const [aiHint, setAiHint] = useState<string | null>(null);
  
  const [joinInput, setJoinInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
     const pendingRoom = localStorage.getItem('tmc_pending_join_room');
     if (pendingRoom) {
         setActiveRoomId(pendingRoom);
         localStorage.removeItem('tmc_pending_join_room');
     }
  }, []);

  useEffect(() => {
    if (!user || !activeRoomId) return;
    
    socket.emit('server:room:join', { roomId: activeRoomId, user });
    socket.on(`room:${activeRoomId}:update`, (updatedRoom: RoomState) => setRoom(updatedRoom));
    socket.on(`game:${activeRoomId}:help`, ({ hint }: { hint: string }) => {
        setAiHint(hint);
        setTimeout(() => setAiHint(null), 8000);
    });
    socket.on(`game:${activeRoomId}:success`, () => {
        window.dispatchEvent(new Event('tmc-progress-update'));
    });

    return () => {
        socket.off(`room:${activeRoomId}:update`, () => {});
        socket.off(`game:${activeRoomId}:help`, () => {});
        socket.off(`game:${activeRoomId}:success`, () => {});
    };
  }, [user, activeRoomId]);

  const createRoom = () => {
      setIsCreating(true);
      setTimeout(() => {
          const newId = `room_${Math.floor(Math.random() * 9000) + 1000}`;
          setActiveRoomId(newId);
          setIsCreating(false);
      }, 800);
  };

  const joinRoom = () => {
      if (joinInput.trim()) {
          setActiveRoomId(joinInput.trim());
      }
  };

  const submitAnswer = () => {
    if (!room || !user || !answer.trim()) return;
    socket.emit('server:game:submit_answer', { roomId: room.roomId, userId: user.id, answer });
    setAnswer('');
  };

  const askHelp = () => {
    if (!room) return;
    socket.emit('server:game:ask_help', { roomId: room.roomId });
  };

  const askPeerHelp = () => {
    if (!room || !user) return;
    socket.emit('server:game:peer_help', { roomId: room.roomId, userId: user.id });
  };

  if (!user) return <div className="text-center mt-20 text-slate-400">Please log in to play.</div>;

  if (!activeRoomId) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 relative pb-32">
              <div className="text-center space-y-4 pt-10">
                  <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">{lang === 'es' ? 'Salas de Ruptura' : 'Breakout Game'}</h2>
                  <p className="text-slate-400 max-w-md mx-auto font-medium">{lang === 'es' ? 'Crea una sala privada o únete a un amigo para un desafío bilingüe.' : 'Create a private room or join a friend for a high-speed bilingual challenge.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-brand-600 to-indigo-700 p-10 rounded-[48px] shadow-2xl flex flex-col items-center text-center space-y-8 border-4 border-white/10 relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={80}/></div>
                      <div className="text-7xl">🚀</div>
                      <div>
                          <h3 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tighter">{lang === 'es' ? 'Crear' : 'Create'}</h3>
                          <p className="text-blue-100/70 text-sm font-medium">{lang === 'es' ? 'Inicia un nuevo juego y comparte el ID.' : 'Start a new session and share your unique Room ID.'}</p>
                      </div>
                      <button 
                        onClick={createRoom}
                        disabled={isCreating}
                        className="w-full py-6 bg-white text-blue-900 font-black rounded-3xl shadow-xl hover:bg-blue-50 transition-all active:scale-95 uppercase tracking-widest text-xs"
                      >
                          {isCreating ? 'Warping...' : (lang === 'es' ? 'Iniciar Nueva' : 'Initiate New')}
                      </button>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-slate-900 p-10 rounded-[48px] shadow-2xl flex flex-col items-center text-center space-y-8 border-4 border-white/5 relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={80}/></div>
                      <div className="text-7xl">🔑</div>
                      <div>
                          <h3 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tighter">{lang === 'es' ? 'Unirse' : 'Join'}</h3>
                          <p className="text-slate-400 text-sm font-medium">{lang === 'es' ? 'Ingresa el ID de la sala de tu amigo.' : 'Enter a friends shared Room ID to link cohorts.'}</p>
                      </div>
                      <div className="w-full space-y-4">
                          <input 
                            type="text" 
                            placeholder="Room ID (e.g. room_1234)"
                            value={joinInput}
                            onChange={e => setJoinInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && joinRoom()}
                            className="w-full bg-slate-950 border border-white/10 rounded-3xl px-6 py-5 text-white text-center font-black outline-none focus:border-brand-500 shadow-inner"
                          />
                          <button 
                            onClick={joinRoom}
                            disabled={!joinInput.trim()}
                            className="w-full py-6 bg-slate-800 text-white font-black rounded-3xl shadow-xl hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-30 uppercase tracking-widest text-xs"
                          >
                              {lang === 'es' ? 'Vincular' : 'Link Frequency'}
                          </button>
                      </div>
                  </motion.div>
              </div>
          </div>
      );
  }

  if (!room) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <Loader2 className="animate-spin text-brand-500" size={64} />
        <p className="text-white font-black uppercase tracking-[0.4em] text-xs animate-pulse">Synchronizing Cohorts: {activeRoomId}...</p>
     </div>
  );

  const isEnToEs = user.learningTrack === 'EN_TO_ES';
  const sentenceDisplay = isEnToEs ? room.gameState.sentenceEs : room.gameState.sentenceEn;
  const targetLanguageName = isEnToEs ? "Spanish" : "English";
  
  const canAskHelp = (room.roundNumber % 2 === 0) && !room.helpUsedThisCycle;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-8 pb-32">
      <div className="w-full flex justify-between items-center px-4">
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">Room: <span className="text-brand-400">{activeRoomId}</span></span>
            <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">Level: <span className="text-brand-400">{room.currentLevel}</span></span>
        </div>
        <button onClick={() => onNavigate?.(AppSection.Worlds)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={18}/></button>
      </div>

      <motion.div 
        layout
        className="w-full bg-slate-900/60 border-2 border-white/10 p-12 rounded-[56px] text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden facetime-glass"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
           <motion.div 
             className="h-full bg-brand-500 shadow-[0_0_15px_#3b82f6]" 
             animate={{ width: `${(room.roundNumber % 10) * 10}%` }} 
             transition={{ type: "spring", stiffness: 100 }}
           />
        </div>
        
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 border border-brand-500/20 shadow-inner">
              <MessageSquare size={32}/>
           </div>
        </div>

        <h3 className="text-3xl md:text-5xl font-serif text-white leading-relaxed mb-12 italic tracking-tight px-4 drop-shadow-xl">
          {sentenceDisplay}
        </h3>

        <div className="flex gap-4 max-w-lg mx-auto">
          <input 
            type="text" 
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            placeholder={`${targetLanguageName} word...`}
            className="flex-1 bg-slate-950 border-2 border-white/10 rounded-[28px] px-8 py-6 text-2xl text-center text-white outline-none focus:border-brand-500 shadow-inner transition-all focus:ring-4 focus:ring-brand-500/5 placeholder:opacity-30"
          />
          <button 
            onClick={() => { submitAnswer(); triggerHaptic('medium'); }}
            className="bg-brand-500 hover:bg-brand-400 text-white px-10 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
          >
            Check
          </button>
        </div>

        <div className="mt-10 h-8">
           <AnimatePresence mode="wait">
             {room.gameState.feedback && (
               <motion.span 
                 key={room.gameState.feedback}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className={`text-sm font-black uppercase tracking-[0.3em] ${room.gameState.feedback.includes('Correct') ? 'text-emerald-400' : 'text-rose-400 animate-shake'}`}
               >
                 {room.gameState.feedback}
               </motion.span>
             )}
           </AnimatePresence>
        </div>
        
        <AnimatePresence>
            {aiHint && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 left-0 right-0 text-center px-8">
                    <span className="bg-yellow-400 text-slate-950 px-8 py-4 rounded-3xl text-sm font-black border border-yellow-500 shadow-2xl inline-block italic">
                       {aiHint}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex gap-4">
            <button
                onClick={() => { askHelp(); triggerHaptic('medium'); }}
                disabled={!canAskHelp}
                className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${
                    canAskHelp 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer active:scale-95' 
                    : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                }`}
            >
                <Zap size={14} fill={canAskHelp ? "currentColor" : "none"}/> {canAskHelp ? "AI Frequency" : "Sync Required"}
            </button>
            <button
                onClick={() => { askPeerHelp(); triggerHaptic('medium'); }}
                disabled={!canAskHelp}
                className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${
                    canAskHelp 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95' 
                    : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                }`}
            >
                <Users size={14}/> {canAskHelp ? "Peer Cohort" : "Link Locked"}
            </button>
        </div>
        
        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Node Address</p>
           <span className="bg-white/5 px-6 py-2 rounded-xl text-brand-400 font-mono text-sm border border-white/5 select-all">{activeRoomId}</span>
        </div>
      </div>
    </div>
  );
};

export default BreakoutRoom;
