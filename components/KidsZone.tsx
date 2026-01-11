
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, KidsLand, KidsStats, PassportStamp } from '../types';
import { 
  Map, ArrowLeft, Star, Crown, ShoppingBag, BookText, 
  Gamepad2, Music, Rocket, Trees, ShoppingCart, Play, Check, X, RefreshCw
} from 'lucide-react';
import { triggerHaptic } from '../utils/performance';
import confetti from 'canvas-confetti';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import Passport from './Passport';

// --- GAME DATA & ASSETS ---
const KIDS_LANDS = [
  { 
    id: 'forest', 
    name: { en: 'Word Forest', es: 'Bosque de Palabras' }, 
    icon: <Trees size={48} />, 
    color: 'from-emerald-400 to-green-600',
    gameType: 'BUBBLE_POP',
    description: { en: 'Pop bubbles to learn nature words!', es: '¡Explota burbujas para aprender!' }
  },
  { 
    id: 'market', 
    name: { en: 'Memory Market', es: 'Mercado de Memoria' }, 
    icon: <ShoppingCart size={48} />, 
    color: 'from-orange-400 to-red-500',
    gameType: 'MEMORY',
    description: { en: 'Match the food items!', es: '¡Encuentra las parejas de comida!' }
  },
  { 
    id: 'space', 
    name: { en: 'Galactic Grammar', es: 'Gramática Galáctica' }, 
    icon: <Rocket size={48} />, 
    color: 'from-indigo-500 to-purple-700',
    gameType: 'TRAIN',
    description: { en: 'Build sentences in zero gravity!', es: '¡Construye frases en gravedad cero!' }
  },
  { 
    id: 'studio', 
    name: { en: 'Rhythm Studio', es: 'Estudio de Ritmo' }, 
    icon: <Music size={48} />, 
    color: 'from-pink-400 to-rose-600',
    gameType: 'SIMON',
    description: { en: 'Repeat the beat!', es: '¡Repite el ritmo!' }
  }
];

// --- MINI GAME COMPONENTS ---

// 1. MEMORY MATCH
const MemoryGame = ({ onComplete }: { onComplete: () => void }) => {
    const cards = ['🍎', '🍌', '🍇', '🍊', '🍎', '🍌', '🍇', '🍊'];
    const [shuffled, setShuffled] = useState(() => cards.sort(() => Math.random() - 0.5));
    const [flipped, setFlipped] = useState<number[]>([]);
    const [matched, setMatched] = useState<number[]>([]);

    useEffect(() => {
        if (flipped.length === 2) {
            const [first, second] = flipped;
            if (shuffled[first] === shuffled[second]) {
                setMatched(prev => [...prev, first, second]);
                triggerHaptic('success');
            } else {
                triggerHaptic('error');
            }
            setTimeout(() => setFlipped([]), 1000);
        }
    }, [flipped, shuffled]);

    useEffect(() => {
        if (matched.length === cards.length) setTimeout(onComplete, 500);
    }, [matched, onComplete, cards.length]);

    return (
        <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
            {shuffled.map((emoji, idx) => {
                const isFlipped = flipped.includes(idx) || matched.includes(idx);
                return (
                    <motion.button
                        key={idx}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { if (!isFlipped && flipped.length < 2) setFlipped(prev => [...prev, idx]); }}
                        className={`aspect-square rounded-2xl text-4xl flex items-center justify-center shadow-xl transition-all duration-500 ${isFlipped ? 'bg-white rotate-0' : 'bg-orange-500 rotate-180'}`}
                    >
                        {isFlipped ? emoji : '❓'}
                    </motion.button>
                );
            })}
        </div>
    );
};

// 2. BUBBLE POP
const BubbleGame = ({ onComplete }: { onComplete: () => void }) => {
    const [bubbles, setBubbles] = useState<{id: number, word: string, x: number, popped: boolean}[]>([
        { id: 1, word: 'Cat', x: 20, popped: false },
        { id: 2, word: 'Dog', x: 50, popped: false },
        { id: 3, word: 'Sun', x: 80, popped: false },
    ]);

    const popBubble = (id: number) => {
        triggerHaptic('light');
        setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    };

    useEffect(() => {
        if (bubbles.every(b => b.popped)) setTimeout(onComplete, 500);
    }, [bubbles, onComplete]);

    return (
        <div className="relative h-80 w-full overflow-hidden bg-sky-900/50 rounded-3xl border-2 border-white/10">
            {bubbles.map(b => !b.popped && (
                <motion.button
                    key={b.id}
                    initial={{ y: 300 }}
                    animate={{ y: -50 }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                    onClick={() => popBubble(b.id)}
                    style={{ left: `${b.x}%` }}
                    className="absolute w-20 h-20 bg-blue-400/80 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold border-2 border-white/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                    {b.word}
                </motion.button>
            ))}
        </div>
    );
};

// 3. SENTENCE TRAIN
const TrainGame = ({ onComplete }: { onComplete: () => void }) => {
    const target = "The cat runs fast";
    const words = ["runs", "The", "fast", "cat"];
    const [slots, setSlots] = useState<string[]>(Array(4).fill(null));

    const fillSlot = (word: string) => {
        const firstEmpty = slots.findIndex(s => s === null);
        if (firstEmpty !== -1) {
            triggerHaptic('light');
            const newSlots = [...slots];
            newSlots[firstEmpty] = word;
            setSlots(newSlots);
        }
    };

    const check = () => {
        if (slots.join(' ') === target) {
            triggerHaptic('success');
            onComplete();
        } else {
            triggerHaptic('error');
            setSlots(Array(4).fill(null)); // Reset on wrong
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-2 justify-center bg-black/20 p-4 rounded-xl min-h-[80px]">
                {slots.map((s, i) => (
                    <div key={i} className="w-20 h-12 bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center text-white font-bold">
                        {s}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
                {words.map((w, i) => (
                    <button key={i} onClick={() => fillSlot(w)} className="px-6 py-3 bg-indigo-500 rounded-full text-white font-bold shadow-lg active:scale-95">
                        {w}
                    </button>
                ))}
            </div>
            <button onClick={check} className="w-full py-4 bg-green-500 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl">
                Check Engine
            </button>
        </div>
    );
};

// 4. RHYTHM STUDIO (Simon)
const RhythmGame = ({ lang, onComplete }: { lang: Language, onComplete: () => void }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<AudioContext | null>(null);

    const playSound = async () => {
        setPlaying(true);
        try {
            const text = lang === 'en' ? "Music makes me happy" : "La música me hace feliz";
            const base64 = await getPronunciation(text, 'Kore');
            if (base64) {
                if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const ctx = audioRef.current;
                const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
                source.onended = () => {
                    setPlaying(false);
                    triggerHaptic('success');
                    onComplete(); // Instant win for demo
                };
            }
        } catch { setPlaying(false); }
    };

    return (
        <div className="flex flex-col items-center gap-8">
            <motion.button
                animate={playing ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
                onClick={playSound}
                disabled={playing}
                className="w-40 h-40 bg-pink-500 rounded-full flex items-center justify-center text-6xl shadow-[0_0_60px_rgba(236,72,153,0.6)] border-8 border-white/20"
            >
                🎵
            </motion.button>
            <p className="text-white font-bold text-center">Tap the beat to listen!</p>
        </div>
    );
};

const KidsZone: React.FC<{ lang: Language }> = ({ lang }) => {
  const [viewState, setViewState] = useState<'MAP' | 'GAME' | 'STORE' | 'PASSPORT'>('MAP');
  const [activeLandId, setActiveLandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<KidsStats>({
    xp: { vocabulary: 100, listening: 50, speaking: 20, reading: 30 },
    gold: 500,
    stars: 5,
    streak: 3,
    level: 2
  });

  const activeLand = KIDS_LANDS.find(l => l.id === activeLandId);

  const handleLandClick = (landId: string) => {
    triggerHaptic('medium');
    setIsLoading(true);
    setActiveLandId(landId);
    setTimeout(() => {
      setIsLoading(false);
      setViewState('GAME');
    }, 1500);
  };

  const handleGameComplete = () => {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      triggerHaptic('success');
      setStats(prev => ({ ...prev, gold: prev.gold + 50, stars: prev.stars + 1 }));
      setTimeout(() => setViewState('MAP'), 3000);
  };

  return (
    <div className="h-full bg-[#0a0a1a] overflow-y-auto hide-scrollbar relative font-sans text-white">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#020617_100%)]" />
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center relative z-20">
             <motion.div 
               animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
               transition={{ duration: 2, repeat: Infinity }}
               className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-6xl border-4 border-white/20"
             >
                {activeLand?.icon}
             </motion.div>
             <h2 className="text-3xl font-black mt-8 uppercase tracking-widest animate-pulse text-center px-4">
               {lang === 'en' ? 'Traveling to ' : 'Viajando a '}<br/>
               <span className="text-brand-400">{lang === 'en' ? activeLand?.name.en : activeLand?.name.es}</span>
             </h2>
          </motion.div>
        ) : viewState === 'MAP' ? (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="relative z-10 p-6 pb-40">
             <header className="flex justify-between items-center mb-8 bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black shadow-lg border-2 border-white">
                      <Crown size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Explorer Level</p>
                      <p className="text-xl font-black text-white">{stats.level}</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-bold">{stats.stars}</span>
                   </div>
                   <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                      <div className="w-4 h-4 bg-amber-500 rounded-full border border-amber-300" />
                      <span className="font-bold">{stats.gold}</span>
                   </div>
                </div>
             </header>

             <h1 className="text-center text-4xl md:text-6xl font-black italic tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-sm">
               {lang === 'en' ? 'Choose Your Adventure' : 'Elige Tu Aventura'}
             </h1>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {KIDS_LANDS.map((land, i) => (
                   <motion.div 
                     key={land.id}
                     whileHover={{ scale: 1.03, y: -5 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleLandClick(land.id)}
                     className={`h-64 rounded-[40px] relative overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.5)] group border-4 border-white/10 bg-gradient-to-br ${land.color}`}
                   >
                      <div className="absolute top-0 right-0 p-6 opacity-20 rotate-12 scale-150 group-hover:scale-125 transition-transform duration-500">{land.icon}</div>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors p-8 flex flex-col justify-end">
                         <div className="bg-white/20 backdrop-blur-md self-start p-4 rounded-2xl mb-4 shadow-lg text-white">
                            {land.icon}
                         </div>
                         <h3 className="text-3xl font-black uppercase tracking-tight drop-shadow-lg leading-none mb-2">{lang === 'en' ? land.name.en : land.name.es}</h3>
                         <p className="text-white/90 text-sm font-bold">{lang === 'en' ? land.description.en : land.description.es}</p>
                      </div>
                   </motion.div>
                ))}
             </div>
          </motion.div>
        ) : viewState === 'GAME' ? (
          <motion.div key="game" className="h-full flex flex-col items-center justify-center relative z-20 p-6 max-w-2xl mx-auto">
             <button onClick={() => setViewState('MAP')} className="absolute top-6 left-6 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all z-50"><ArrowLeft /></button>
             
             <div className={`w-full bg-slate-900/80 backdrop-blur-xl border-4 border-white/10 p-8 rounded-[48px] shadow-2xl relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${activeLand?.color}`} />
                
                <div className="text-center mb-8">
                   <div className="inline-block p-4 bg-white/10 rounded-3xl mb-4 text-brand-400 border border-white/10 shadow-lg">
                      {activeLand?.icon}
                   </div>
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">{lang === 'en' ? activeLand?.name.en : activeLand?.name.es}</h2>
                </div>

                <div className="min-h-[300px] flex items-center justify-center">
                    {activeLand?.gameType === 'MEMORY' && <MemoryGame onComplete={handleGameComplete} />}
                    {activeLand?.gameType === 'BUBBLE_POP' && <BubbleGame onComplete={handleGameComplete} />}
                    {activeLand?.gameType === 'TRAIN' && <TrainGame onComplete={handleGameComplete} />}
                    {activeLand?.gameType === 'SIMON' && <RhythmGame lang={lang} onComplete={handleGameComplete} />}
                </div>
             </div>
          </motion.div>
        ) : viewState === 'PASSPORT' ? (
            <motion.div key="pass" className="h-full pt-20 relative z-20"><Passport lang={lang} user={{ displayName: 'Explorer', photoUrl: '', email: '', role: 'student', learningTrack: 'ES_TO_EN', preferredUiLanguage: 'es', id: 'k1', isChild: true }} stamps={MOCK_STAMPS} /></motion.div>
        ) : (
            <div className="h-full flex items-center justify-center z-20 relative flex-col gap-4">
                <Gamepad2 size={80} className="text-slate-600" />
                <h1 className="text-4xl font-black uppercase tracking-widest">Store Coming Soon</h1>
                <button onClick={() => setViewState('MAP')} className="px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20">Back to Map</button>
            </div>
        )}
      </AnimatePresence>

      {/* Navigation Dock */}
      {viewState !== 'GAME' && !isLoading && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl p-2 rounded-full border border-white/20 flex gap-2 shadow-2xl">
            <button onClick={() => setViewState('MAP')} className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewState === 'MAP' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}><Map size={16}/> Map</button>
            <button onClick={() => setViewState('PASSPORT')} className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewState === 'PASSPORT' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}><BookText size={16}/> Book</button>
            <button onClick={() => setViewState('STORE')} className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewState === 'STORE' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}><ShoppingBag size={16}/> Shop</button>
         </div>
      )}
    </div>
  );
};

const MOCK_STAMPS: PassportStamp[] = [
  { id: 's1', category: 'skill', title: { en: 'First Roar', es: 'Primer Rugido' }, dateEarned: Date.now(), iconKid: '🦁', iconAdult: '🔊', points: 100 },
];

export default KidsZone;
