
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, KidsLand, KidsStats, PassportStamp, User, AppSection } from '../types';
import { 
  Volume2, Map, ArrowLeft, Trophy, Gamepad2, Music, Sparkles, 
  ChevronRight, Star, Clock, Heart, Zap, Brain, Mic, 
  Hand, Play, RefreshCw, Crown, ShoppingBag, BookOpen, BookText, Puzzle
} from 'lucide-react';
import { triggerHaptic } from '../utils/performance';
import confetti from 'canvas-confetti';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import Passport from './Passport';

// --- DATA: MINI WORLD LANDS ---
const KIDS_LANDS: KidsLand[] = [
  { 
    id: 'forest', 
    name: { en: 'Animal Park', es: 'Parque Animal' }, 
    icon: '🦁', 
    color: 'from-emerald-400 to-green-600',
    description: { en: 'Discover furry friends in English and Spanish!', es: '¡Descubre amigos peludos en inglés y español!' }
  },
  { 
    id: 'market', 
    name: { en: 'Food Market', es: 'Mercado de Comida' }, 
    icon: '🍎', 
    color: 'from-orange-400 to-red-500',
    description: { en: 'Learn tasty words while you shop!', es: '¡Aprende palabras sabrosas mientras compras!' }
  },
  { 
    id: 'space', 
    name: { en: 'Space Station', es: 'Estación Espacial' }, 
    icon: '🚀', 
    color: 'from-indigo-500 to-purple-700',
    description: { en: 'Out of this world grammar and patterns!', es: '¡Gramática y patrones fuera de este mundo!' }
  },
  { 
    id: 'studio', 
    name: { en: 'Sound Studio', es: 'Estudio de Sonido' }, 
    icon: '🎵', 
    color: 'from-pink-400 to-rose-600',
    description: { en: 'Sing and repeat with the cool beats.', es: 'Canta y repite con ritmos geniales.' }
  }
];

const SYSTEM_ALERTS = [
  "Buddy is hiding a new word in the Forest! 🌳",
  "Luna is preparing a special song in the Studio! 🎤",
  "New daily mission: Say 'Apple' 5 times! 🍎",
  "Secret treasure detected in the Space Station! 💎",
  "Pip just finished a new drawing for you! 🎨",
];

const FUN_FACTS = [
  { en: "Did you know? 'Gato' means 'Cat'!", es: "¿Sabías que? 'Cat' significa 'Gato'!" },
  { en: "Try this: Say 'Hola' to a friend!", es: "Prueba esto: ¡Dile 'Hello' a un amigo!" },
  { en: "Fact: Birds fly high, in Spanish they 'Vuelan'!", es: "Dato: Los pájaros vuelan alto, en inglés 'Fly'!" }
];

const MOCK_STAMPS: PassportStamp[] = [
  { id: 's1', category: 'skill', title: { en: 'First Roar', es: 'Primer Rugido' }, dateEarned: Date.now(), iconKid: '🦁', iconAdult: '🔊', points: 100 },
  { id: 's2', category: 'topic', title: { en: 'Apple Expert', es: 'Experto en Manzanas' }, dateEarned: Date.now() - 86400000, iconKid: '🍎', iconAdult: '🍎', points: 50 },
];

// --- SUB-COMPONENTS ---

const XPBar: React.FC<{ label: string; icon: any; color: string; value: number }> = ({ label, icon: Icon, color, value }) => (
  <div className="space-y-1 w-full">
    <div className="flex justify-between items-center px-1">
       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Icon size={12}/> {label}</span>
       <span className="text-[9px] font-black text-white/60">{value}%</span>
    </div>
    <div className="h-2.5 w-full bg-black/40 rounded-full border border-white/5 p-0.5 overflow-hidden">
       <motion.div 
         initial={{ width: 0 }}
         animate={{ width: `${value}%` }}
         className={`h-full rounded-full bg-gradient-to-r ${color} shadow-lg shadow-white/5`}
       />
    </div>
  </div>
);

const KidsZone: React.FC<{ lang: Language }> = ({ lang }) => {
  const [viewState, setViewState] = useState<'MAP' | 'GAME' | 'STORE' | 'PASSPORT'>('MAP');
  const [activeLand, setActiveLand] = useState<KidsLand | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(0);
  
  const [stats, setStats] = useState<KidsStats>({
    xp: { vocabulary: 45, listening: 30, speaking: 20, reading: 15 },
    gold: 240,
    stars: 12,
    streak: 3,
    level: 4
  });

  const [simonTarget, setSimonTarget] = useState({ en: 'Jump', es: 'Salta', icon: '🏃' });
  const [isSimonPlaying, setIsSimonPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const ticker = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % SYSTEM_ALERTS.length);
      setLastRefreshed(0);
    }, 6000);
    const factCycle = setInterval(() => {
      setFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 12000);
    const refreshTimer = setInterval(() => {
      setLastRefreshed(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(ticker);
      clearInterval(factCycle);
      clearInterval(refreshTimer);
    };
  }, []);

  const handleLandClick = (land: KidsLand) => {
    if (land.locked) return;
    triggerHaptic('medium');
    setIsLoading(true);
    setActiveLand(land);
    setTimeout(() => {
      setIsLoading(false);
      setViewState('GAME' as any);
    }, 1800);
  };

  const playSimonAction = async () => {
    setIsSimonPlaying(true);
    const textToSpeak = lang === 'en' ? `Simon says: ${simonTarget.en}!` : `Simón dice: ¡${simonTarget.es}!`;
    try {
      const base64 = await getPronunciation(textToSpeak, 'Kore');
      if (base64) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => setIsSimonPlaying(false);
      } else { setIsSimonPlaying(false); }
    } catch (e) { setIsSimonPlaying(false); }
  };

  const completeSimon = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#facc15', '#ef4444', '#3b82f6'] });
    triggerHaptic('success');
    setStats(prev => ({ 
      ...prev, 
      gold: prev.gold + 10,
      stars: prev.stars + 1,
      xp: { ...prev.xp, listening: Math.min(100, prev.xp.listening + 5) }
    }));
  };

  const renderHUD = () => (
    <div className="fixed top-28 left-8 right-8 z-[150] flex flex-col md:flex-row justify-between items-start gap-4 pointer-events-none">
       <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 rounded-[32px] flex items-center gap-4 shadow-2xl">
             <div className="flex items-center gap-2 px-2">
                <div className="w-9 h-9 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">🪙</div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-500 uppercase">Gold</span>
                   <span className="text-xs font-black text-white">{stats.gold}</span>
                </div>
             </div>
             <div className="flex items-center gap-2 px-2">
                <div className="w-9 h-9 bg-yellow-400 rounded-2xl flex items-center justify-center text-white shadow-lg">⭐</div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-500 uppercase">Stars</span>
                   <span className="text-xs font-black text-white">{stats.stars}</span>
                </div>
             </div>
             <div className="flex items-center gap-2 px-2">
                <div className="w-9 h-9 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg">🔥</div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-500 uppercase">Streak</span>
                   <span className="text-xs font-black text-white">{stats.streak}</span>
                </div>
             </div>
          </div>
       </motion.div>

       <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 rounded-[40px] w-full md:w-64 space-y-4 shadow-2xl pointer-events-auto relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-brand-500/10 blur-3xl rounded-full" />
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-brand-400 uppercase tracking-widest">Level {stats.level}</span>
                <span className="text-sm font-black text-white italic tracking-tighter uppercase leading-none">Explorer</span>
             </div>
             <Crown size={20} className="text-brand-400 animate-bounce" />
          </div>
          <div className="space-y-2.5">
             <XPBar label="Vocab" icon={Brain} color="from-emerald-400 to-green-500" value={stats.xp.vocabulary} />
             <XPBar label="Listen" icon={Volume2} color="from-blue-400 to-indigo-500" value={stats.xp.listening} />
          </div>
       </motion.div>
    </div>
  );

  return (
    <div className="h-full bg-slate-950 overflow-y-auto hide-scrollbar relative font-sans">
      {/* Background Motion */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <motion.div animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ repeat: Infinity, duration: 25 }} className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-500 rounded-full blur-[140px]" />
         <motion.div animate={{ x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ repeat: Infinity, duration: 20 }} className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      {/* Ticker HUD */}
      <div className="fixed top-12 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-8 pointer-events-none">
         <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="facetime-glass h-11 px-8 rounded-full flex items-center gap-4 border border-white/10 shadow-2xl pointer-events-auto overflow-hidden min-w-[340px]">
            <Sparkles size={16} className="text-brand-400 shrink-0" />
            <AnimatePresence mode="wait">
               <motion.p key={tickerIndex} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }} className="text-[10px] font-black text-slate-200 uppercase tracking-widest whitespace-nowrap">
                 {SYSTEM_ALERTS[tickerIndex]}
               </motion.p>
            </AnimatePresence>
            <div className="ml-auto flex items-center gap-3">
               <div className="flex flex-col items-end">
                  <span className="text-[6px] font-black text-slate-500 uppercase leading-none">Last Update</span>
                  <span className="text-[8px] font-black text-brand-400 uppercase leading-none">{lastRefreshed}s ago</span>
               </div>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            </div>
         </motion.div>
      </div>

      {viewState === 'MAP' && renderHUD()}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-12 text-center space-y-10 animate-shimmer">
             <div className="relative w-48 h-48">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 border-8 border-brand-500/10 border-t-brand-500 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center text-7xl">{activeLand?.icon}</div>
             </div>
             <div className="space-y-3">
                <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{lang === 'en' ? 'Warping to...' : 'Viajando a...'}</h3>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">{activeLand?.name[lang]}</p>
             </div>
          </motion.div>
        ) : viewState === 'MAP' ? (
          <motion.div key="map" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} className="h-full pt-64 pb-48 flex flex-col items-center">
             <div className="text-center space-y-4 mb-16 relative z-10 px-8">
                <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center text-5xl mx-auto shadow-2xl border border-white/10">🗺️</div>
                <div className="space-y-1">
                  <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{lang === 'en' ? 'Magic World' : 'Mundo Mágico'}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Tap a Land to Explore</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-8 relative z-10">
                {KIDS_LANDS.map(land => (
                   <motion.div key={land.id} whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.97 }} onClick={() => handleLandClick(land)} className={`group relative h-64 rounded-[56px] overflow-hidden cursor-pointer shadow-2xl border-4 border-white/5 bg-gradient-to-br ${land.color}`}>
                      <div className="absolute inset-3 bg-white/10 backdrop-blur-md rounded-[48px] border border-white/20 flex flex-col items-center justify-center p-6 text-center space-y-3">
                         <span className="text-7xl filter drop-shadow-2xl hover-wiggle">{land.icon}</span>
                         <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{lang === 'en' ? land.name.en : land.name.es}</h3>
                         <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest leading-tight px-4">{land.description[lang]}</p>
                      </div>
                      <div className="absolute bottom-6 right-8 w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} strokeWidth={3}/></div>
                   </motion.div>
                ))}
             </div>
             <div className="mt-16 w-full max-w-2xl px-8 relative z-10">
                <div className="facetime-glass p-6 rounded-[32px] border border-white/10 flex items-start gap-4">
                   <Sparkles size={20} className="text-brand-400 shrink-0 mt-1" />
                   <AnimatePresence mode="wait">
                      <motion.div key={factIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-1">
                         <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest">Fun Fact • Tip</p>
                         <p className="text-sm font-bold text-slate-200">{FUN_FACTS[factIndex][lang]}</p>
                      </motion.div>
                   </AnimatePresence>
                </div>
             </div>
          </motion.div>
        ) : viewState === 'PASSPORT' ? (
          <motion.div key="passport" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="h-full pt-40 pb-40">
             <Passport lang={lang} user={{ displayName: 'Kid', photoUrl: '', email: '', role: 'student', learningTrack: 'ES_TO_EN', preferredUiLanguage: 'es', id: 'k1', isChild: true }} stamps={MOCK_STAMPS} />
          </motion.div>
        ) : viewState === ('GAME' as any) ? (
          <motion.div key="game" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="h-full flex flex-col items-center justify-center p-10 space-y-12">
             <button onClick={() => setViewState('MAP')} className="absolute top-10 left-10 p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl text-slate-400 hover:text-white transition-all z-[210] flex items-center gap-3">
                <ArrowLeft size={20}/><span className="text-[10px] font-black uppercase">Back to Map</span>
             </button>
             <div className="text-center space-y-8 max-w-xl">
                <div className="flex justify-center gap-4">
                   <div className="px-6 py-2.5 bg-brand-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Simon Says</div>
                </div>
                <motion.div key={simonTarget.icon} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-64 h-64 bg-slate-900 rounded-[80px] border-4 border-white/10 flex items-center justify-center text-9xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] mx-auto relative group">
                   <span className="group-hover:scale-110 transition-transform">{simonTarget.icon}</span>
                   {isSimonPlaying && <motion.div animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 border-[12px] border-brand-500 rounded-[80px] blur-xl" />}
                </motion.div>
                <div className="space-y-2">
                   <h2 className="text-6xl md:text-7xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">{simonTarget.en}</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-2xl opacity-70">¡{simonTarget.es}!</p>
                </div>
             </div>
             <div className="flex gap-8 items-center">
                <button onClick={playSimonAction} disabled={isSimonPlaying} className={`w-24 h-24 rounded-full flex items-center justify-center text-white border-2 shadow-2xl ${isSimonPlaying ? 'bg-brand-500/20 border-brand-500' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}><Volume2 size={40} /></button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={completeSimon} className="px-14 py-8 bg-brand-500 text-white rounded-[40px] font-black text-3xl uppercase tracking-tighter shadow-2xl flex items-center gap-5 hover:bg-brand-400 transition-colors">Done! <Zap fill="currentColor" size={28}/></motion.button>
             </div>
          </motion.div>
        ) : viewState === 'STORE' ? (
          <motion.div key="store" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center p-12 text-center space-y-12">
             <ShoppingBag size={80} className="text-indigo-500 animate-bounce" />
             <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase">Magic Store</h2>
             <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">Spend Gold on Stickers!</p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
                {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-slate-900/50 rounded-[40px] border-2 border-dashed border-white/10 flex items-center justify-center opacity-40">🎁</div>)}
             </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isLoading && viewState !== ('GAME' as any) && (
        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] flex gap-4 p-2 bg-slate-900/80 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl">
           <button onClick={() => setViewState('MAP')} className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${viewState === 'MAP' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}><Map size={14}/> Map</button>
           <button onClick={() => setViewState('PASSPORT')} className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${viewState === 'PASSPORT' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}><BookText size={14}/> Passport</button>
           <button onClick={() => setViewState('STORE')} className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${viewState === 'STORE' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}><ShoppingBag size={14}/> Store</button>
        </motion.div>
      )}
    </div>
  );
};

export default KidsZone;
