
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { socket } from '../services/mockBackend';
import { Language } from '../types';
import { motion } from 'framer-motion';

interface LiveClassroomProps {
  lang: Language;
}

const LiveClassroom: React.FC<LiveClassroomProps> = ({ lang }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{sender:string, text:string}[]>([]);
  const [status, setStatus] = useState('Connecting to live stream...');
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (!user) return;
    const roomId = 'live_1';
    
    socket.emit('server:classroom:join', { roomId, user });
    
    socket.on(`classroom:${roomId}:status`, (data: any) => setStatus(data.message));
    socket.on(`classroom:${roomId}:message`, (msg: any) => setMessages(prev => [...prev, msg]));

    return () => {
        socket.off(`classroom:${roomId}:status`, () => {});
        socket.off(`classroom:${roomId}:message`, () => {});
    };
  }, [user]);

  const sendMsg = (text: string) => {
      socket.emit('server:classroom:message', { roomId: 'live_1', text, sender: user?.displayName });
  };

  if (!user) return <div className="flex items-center justify-center h-full">Please log in to join class.</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 pb-20">
      {/* Video Grid Section */}
      <div className="flex-1 flex flex-col gap-4">
         {/* Main Professor Feed */}
         <div className="flex-1 bg-slate-900 rounded-[32px] border border-white/10 relative overflow-hidden shadow-2xl group">
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                 <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-5xl mb-4 border-2 border-brand-500 animate-pulse">👨‍🏫</div>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Professor Tomas (Live)</p>
             </div>
             
             <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black text-white animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
             </div>
             <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md">
                <p className="text-white font-bold text-sm">Unit 4: Advanced Negotiation</p>
             </div>
         </div>

         {/* Students Grid */}
         <div className="h-48 grid grid-cols-3 md:grid-cols-4 gap-4">
             {/* Self */}
             <div className="bg-slate-800 rounded-2xl relative overflow-hidden border border-white/5 flex items-center justify-center">
                 {camOn ? (
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl">😊</div>
                 ) : (
                    <div className="text-slate-500 text-xs font-bold uppercase">Cam Off</div>
                 )}
                 <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded">{user.displayName} (You)</div>
                 <div className="absolute top-2 right-2">
                     {!micOn && <span className="text-red-500 text-xs">🔇</span>}
                 </div>
             </div>
             
             {/* Mock Students */}
             {[1,2,3].map(i => (
                 <div key={i} className="bg-slate-800 rounded-2xl relative overflow-hidden border border-white/5 flex items-center justify-center opacity-70">
                     <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">👤</div>
                     <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded">Student {i}</div>
                 </div>
             ))}
             
             <div className="bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                 +12 Others
             </div>
         </div>
         
         {/* Controls */}
         <div className="flex justify-center gap-4">
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setMicOn(!micOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg border border-white/10 ${micOn ? 'bg-slate-700 text-white' : 'bg-red-500 text-white'}`}
             >
                {micOn ? '🎙️' : '🔇'}
             </motion.button>
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setCamOn(!camOn)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg border border-white/10 ${camOn ? 'bg-slate-700 text-white' : 'bg-red-500 text-white'}`}
             >
                {camOn ? '📷' : '🚫'}
             </motion.button>
             <motion.button 
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-xl shadow-lg border border-white/10"
             >
                📞
             </motion.button>
         </div>
      </div>
      
      {/* Side Chat */}
      <div className="w-full lg:w-96 bg-slate-900/50 rounded-[32px] border border-white/5 flex flex-col p-6 backdrop-blur-md shadow-xl h-[500px] lg:h-auto">
         <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Classroom Chat</h3>
            <span className="text-[10px] text-green-400 font-bold">{status}</span>
         </div>
         <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
            {messages.map((m, i) => (
                <div key={i} className="text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="font-bold text-brand-400 text-xs block mb-1">{m.sender}</span> 
                    <span className="text-slate-300">{m.text}</span>
                </div>
            ))}
         </div>
         <div className="relative">
            <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full bg-slate-950 p-4 rounded-2xl text-sm text-white outline-none border border-slate-800 focus:border-brand-500 transition-colors pr-10"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        sendMsg((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                    }
                }}
            />
            <button className="absolute right-3 top-3 text-slate-400 hover:text-white">➤</button>
         </div>
      </div>
    </div>
  );
};

export default LiveClassroom;
