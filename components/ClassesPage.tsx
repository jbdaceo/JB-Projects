
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { fetchClassInfo } from '../services/api';

interface ClassesPageProps {
  lang: Language;
}

// EN: Display the live class stream from YouTube.
// ES: Muestra la transmisión en vivo de la clase desde YouTube.
const ClassesPage: React.FC<ClassesPageProps> = ({ lang }) => {
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  
  const text = {
    title: lang === 'es' ? 'Clases En Vivo' : 'Live Classes',
    subtitle: lang === 'es' ? 'Aprende Inglés 24/7' : 'Learn English 24/7',
    liveNow: lang === 'es' ? '🔴 EN VIVO AHORA' : '🔴 LIVE NOW',
    watchPlaylist: lang === 'es' ? 'Repasar Clases Anteriores' : 'Review Past Classes',
    loading: lang === 'es' ? 'Sintonizando canal...' : 'Tuning into channel...',
    chat: lang === 'es' ? 'Chat de Clase' : 'Class Chat',
    notes: lang === 'es' ? 'Apuntes' : 'Notes',
    source: lang === 'es' ? "Fuente: Bri's Practical English" : "Source: Bri's Practical English"
  };

  // EN: Fetch channel status on mount.
  // ES: Obtener estado del canal al montar.
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const data = await fetchClassInfo();
        if (mounted) {
          setClassData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load class info", err);
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [lang]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold animate-pulse">{text.loading}</p>
      </div>
    );
  }

  // EN: Embed Strategy: Use standard youtube.com.
  // ES: Estrategia de incrustación: Usar youtube.com estándar.
  const videoId = 'qKG4YMp9z34';
  
  // EN: Simplified embed URL to avoid origin/policy network errors.
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`;

  return (
    <div className="space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{text.title}</h2>
          <p className="text-slate-400 text-sm md:text-lg font-bold uppercase tracking-widest mt-1">{text.subtitle}</p>
        </div>
        {classData?.isLive && (
          <div className="px-4 py-2 bg-red-600 text-white font-black text-xs rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]">
            {text.liveNow}
          </div>
        )}
      </header>

      {/* Main Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Video Player Area */}
        <div className="lg:col-span-2 bg-black rounded-[32px] overflow-hidden shadow-2xl relative group border border-white/10">
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
             <iframe 
               width="100%" 
               height="100%" 
               src={embedUrl}
               title="YouTube video player" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               referrerPolicy="strict-origin-when-cross-origin"
               allowFullScreen
               loading="eager"
               className="w-full h-full"
             ></iframe>
          </div>
          
          <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 pointer-events-none">
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{text.source}</p>
          </div>
        </div>

        {/* Interactive Side Panel */}
        <div className="hidden lg:flex flex-col bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden">
           <div className="flex border-b border-white/5">
              <button className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-white border-b-2 border-red-500 bg-white/5">{text.chat}</button>
              <button className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">{text.notes}</button>
           </div>
           
           <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="text-center py-4">
                 <p className="text-xs text-slate-500 font-medium">Welcome to Bri's Practical English Stream!</p>
              </div>
              {/* Mock Chat */}
              {[1,2,3,4,5].map(i => (
                 <div key={i} className="flex gap-3 items-start opacity-70">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i%2===0 ? 'bg-blue-600' : 'bg-green-600'}`}>
                       {String.fromCharCode(65+i)}
                    </div>
                    <div>
                       <p className="text-xs font-bold text-slate-300">Student {i}</p>
                       <p className="text-xs text-slate-400">Hi from {['Colombia', 'Mexico', 'Brazil', 'Japan', 'Italy'][i-1]}!</p>
                    </div>
                 </div>
              ))}
           </div>

           <div className="p-4 bg-slate-950/50 border-t border-white/5">
              <input 
                type="text" 
                placeholder="Join the conversation..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500/50 transition-all"
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;
    