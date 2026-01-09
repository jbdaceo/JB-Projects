
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { RoomState, Language, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface BreakoutRoomProps {
  lang: Language;
  onNavigate?: (section: AppSection) => void;
}

// NOTE: Added onNavigate prop to fix exit button logic
const BreakoutRoom: React.FC<BreakoutRoomProps> = ({ lang, onNavigate }) => {
  const { user } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [answer, setAnswer] = useState('');
  const [aiHint, setAiHint] = useState<string | null>(null);
  
  // Lobby State
  const [joinInput, setJoinInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Auto-join if ID passed or found in history (mocked)
  useEffect(() => {
     // Check if we have a pending invite acceptance
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
        window.dispatchEvent(new Event('tmc-level-update')); // Trigger Novice Bar Increase
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

  // --- LOBBY VIEW ---
  if (!activeRoomId) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 relative">
              <div className="text-center space-y-4 pt-10">
                  <h2 className="text-4xl font-black text-white">{lang === 'es' ? 'Salas de Ruptura' : 'Breakout Rooms'}</h2>
                  <p className="text-slate-400 max-w-md mx-auto">{lang === 'es' ? 'Crea una sala privada o únete a un amigo para un desafío bilingüe.' : 'Create a private room or join a friend for a bilingual challenge.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                  {/* Create Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center space-y-6 border border-white/10"
                  >
                      <div className="text-6xl">🚀</div>
                      <div>
                          <h3 className="text-2xl font-black text-white mb-2">{lang === 'es' ? 'Crear Sala' : 'Create Room'}</h3>
                          <p className="text-blue-100/80 text-sm">{lang === 'es' ? 'Inicia un nuevo juego y comparte el ID.' : 'Start a new game and share the ID.'}</p>
                      </div>
                      <button 
                        onClick={createRoom}
                        disabled={isCreating}
                        className="w-full py-4 bg-white text-blue-900 font-black rounded-2xl shadow-lg hover:bg-blue-50 transition-colors"
                      >
                          {isCreating ? 'Creating...' : (lang === 'es' ? 'Crear Nueva' : 'Create New')}
                      </button>
                  </motion.div>

                  {/* Join Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-8 rounded-[40px] shadow-2xl flex flex-col items-center text-center space-y-6 border border-white/5"
                  >
                      <div className="text-6xl">🔑</div>
                      <div>
                          <h3 className="text-2xl font-black text-white mb-2">{lang === 'es' ? 'Unirse a Sala' : 'Join Room'}</h3>
                          <p className="text-slate-400 text-sm">{lang === 'es' ? 'Ingresa el ID de la sala de tu amigo.' : 'Enter your friend\'s room ID.'}</p>
                      </div>
                      <div className="w-full space-y-3">
                          <input 
                            type="text" 
                            placeholder="Room ID (e.g. room_1234)"
                            value={joinInput}
                            onChange={e => setJoinInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white text-center font-bold outline-none focus:border-blue-500"
                          />
                          <button 
                            onClick={joinRoom}
                            disabled={!joinInput.trim()}
                            className="w-full py-4 bg-slate-700 text-white font-black rounded-2xl shadow-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                          >
                              {lang === 'es' ? 'Unirse' : 'Join'}
                          </button>
                      </div>
                  </motion.div>
              </div>
          </div>
      );
  }

  // --- GAME VIEW ---
  if (!room) return <div className="text-center text-slate-500 mt-20 animate-pulse">Connecting to Room {activeRoomId}...</div>;

  const isEnToEs = user.learningTrack === 'EN_TO_ES';
  const sentenceDisplay = isEnToEs ? room.gameState.sentenceEs : room.gameState.sentenceEn;
  const targetLanguageName = isEnToEs ? "Spanish" : "English";
  
  const canAskHelp = (room.roundNumber % 2 === 0) && !room.helpUsedThisCycle;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-8 pb-20">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-4 text-xs font-black uppercase tracking-widest text-slate-500">
            <span>Room: {activeRoomId}</span>
            <span>Level {room.currentLevel}</span>
        </div>
      </div>

      <motion.div 
        layout
        className="w-full bg-slate-900/50 border border-white/10 p-12 rounded-[48px] text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-800">
           <div className="h-full bg-blue-500 transition-all" style={{ width: `${(room.roundNumber % 10) * 10}%` }} />
        </div>

        <h3 className="text-3xl md:text-4xl font-serif text-white leading-relaxed mb-10">
          {sentenceDisplay}
        </h3>

        <div className="flex gap-4">
          <input 
            type="text" 
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            placeholder={`Type missing ${targetLanguageName} word...`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-xl text-center text-white outline-none focus:border-blue-500 transition-all"
          />
          <button 
            onClick={submitAnswer}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Check
          </button>
        </div>

        <div className="mt-8 h-6 text-sm font-bold text-slate-400">
           {room.gameState.feedback && <span className="animate-pulse">{room.gameState.feedback}</span>}
        </div>
        
        <AnimatePresence>
            {aiHint && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-yellow-500/20 text-yellow-200 px-4 py-2 rounded-full text-xs font-bold border border-yellow-500/50">
                        💡 {aiHint}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
            <button
                onClick={askHelp}
                disabled={!canAskHelp}
                className={`px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                    canAskHelp 
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/50 cursor-pointer' 
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
            >
                {canAskHelp ? "🤖 AI Help" : "Locked"}
            </button>
            <button
                onClick={askPeerHelp}
                disabled={!canAskHelp}
                className={`px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                    canAskHelp 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/50 cursor-pointer' 
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
            >
                {canAskHelp ? "👥 Peer Help" : "Locked"}
            </button>
        </div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-2">Share Room ID: <span className="text-slate-400 font-bold select-all">{activeRoomId}</span></p>
      </div>
    </div>
  );
};

export default BreakoutRoom;
