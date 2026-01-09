import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { Volume2, Map, ArrowLeft, Trophy, Gamepad2, Music, Sparkles, ChevronRight, Star } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';
import confetti from 'canvas-confetti';

const VOCAB_100 = [
  { id: 1, en: 'Apple', es: 'Manzana', icon: '🍎', color: 'bg-red-500' },
  { id: 2, en: 'Cat', es: 'Gato', icon: '🐱', color: 'bg-orange-400' },
  { id: 3, en: 'House', es: 'Casa', icon: '🏠', color: 'bg-blue-500' },
  { id: 4, en: 'Sun', es: 'Sol', icon: '☀️', color: 'bg-yellow-400' },
  { id: 5, en: 'Water', es: 'Agua', icon: '💧', color: 'bg-cyan-400' },
  { id: 6, en: 'Tree', es: 'Árbol', icon: '🌳', color: 'bg-emerald-500' },
];

const QUEST_STAGES = [
  { id: 'start', title: 'The Beach', icon: '🏖️', task: 'Say Hello to the Crab', target: 'Hello' },
  { id: 'forest', title: 'Deep Jungle', icon: '🌳', task: 'Find the hidden Fruit', target: 'Apple' },
  { id: 'cave', title: 'Echo Cave', icon: '💎', task: 'Sing to the Bats', target: 'Music' },
  { id: 'peak', title: 'Victory Peak', icon: '🏔️', task: 'Plant the Freedom Flag', target: 'Freedom' }
];

const KidsZone: React.FC<{ lang: Language }> = ({ lang }) => {
  const [activeMode, setActiveMode] = useState<'hub' | 'vocab' | 'quest'>('hub');
  const [questStep, setQuestStep] = useState(0);
  const [coins, setCoins] = useState(120);
  const [matchingWord, setMatchingWord] = useState<string | null>(null);

  const text = {
    title: lang === 'es' ? 'Zona Mágica' : 'Magic Kids Zone',
    play: lang === 'es' ? '¡A Jugar!' : 'Play Now',
    back: lang === 'es' ? 'Volver' : 'Back'
  };

  const handleQuestAction = () => {
    triggerHaptic('success');
    if (questStep < QUEST_STAGES.length - 1) {
      setQuestStep(prev => prev + 1);
      setCoins(prev => prev + 50);
      confetti({ particleCount: 30, origin: { x: 0.8, y: 0.8 } });
    } else {
      alert("Quest Complete! You are a language explorer!");
      setActiveMode('hub');
      setQuestStep(0);
    }
  };

  const renderBentoHub = () => (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 p-6 h-full font-sans pb-32">
      <div className="md:col-span-4 bg-brand-500/10 border border-brand-500/20 p-8 rounded-[48px] flex flex-col md:flex-row items-center gap-6 shadow-xl mb-4">
         <div className="w-20 h-20 bg-brand-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl shrink-0"><Gamepad2 size={40}/></div>
         <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{text.title}</h2>
            <p className="text-slate-300 font-medium leading-relaxed">Level up by playing games. Every win gets you gold!</p>
         </div>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} onClick={() => setActiveMode('quest')} className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[56px] p-12 flex flex-col justify-between text-white shadow-2xl cursor-pointer relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity"><Map size={200} /></div>
        <div className="space-y-6 relative z-10">
          <span className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-[12px] font-black uppercase tracking-[0.2em] border border-white/20">Active Story</span>
          <h2 className="text-6xl font-black italic tracking-tighter leading-[0.9]">Jungle Island<br/>Secret</h2>
          <p className="text-indigo-100 font-bold text-lg opacity-90 max-w-sm">Stage {questStep + 1}: {QUEST_STAGES[questStep].title}</p>
        </div>
        <div className="flex items-center gap-4 relative z-10 pt-8">
          <span className="text-sm font-black uppercase tracking-widest bg-white text-indigo-900 px-8 py-3 rounded-2xl">{text.play}</span>
        </div>
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} onClick={() => setActiveMode('vocab')} className="md:col-span-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-[56px] p-10 flex items-center justify-between text-white shadow-2xl cursor-pointer group">
         <div className="space-y-3">
            <h3 className="text-4xl font-black tracking-tight italic leading-none">Word Safari</h3>
            <p className="text-emerald-500 bg-white/90 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest inline-block">100 Visual Words</p>
         </div>
         <div className="text-8xl group-hover:rotate-12 transition-transform duration-500">📚</div>
      </motion.div>

      <div className="md:col-span-1 bg-slate-900 border border-white/10 rounded-[56px] p-8 flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-16 h-16 bg-amber-500/20 rounded-[28px] flex items-center justify-center text-amber-500 text-4xl shadow-inner">🪙</div>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Treasure</p>
          <p className="text-3xl font-black text-white italic tracking-tighter">{coins} Gold</p>
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} className="md:col-span-1 bg-slate-900 border border-white/10 rounded-[56px] p-8 flex flex-col items-center justify-center text-center gap-4 shadow-xl cursor-pointer group">
        <div className="w-16 h-16 bg-brand-500 rounded-[28px] flex items-center justify-center text-white text-3xl shadow-2xl group-hover:scale-110 transition-transform">⭐</div>
        <p className="text-[12px] font-black text-white uppercase tracking-widest">Achievements</p>
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} className="md:col-span-2 bg-slate-900 border border-white/10 rounded-[56px] p-10 flex items-center gap-8 shadow-2xl cursor-pointer group relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors" />
        <div className="w-24 h-24 bg-brand-500 rounded-[32px] flex items-center justify-center text-6xl group-hover:scale-110 transition-transform shadow-2xl text-white relative z-10">🎵</div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tune Lab</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Learning with Beats</p>
        </div>
        <Sparkles className="absolute top-6 right-6 text-brand-400 opacity-20 group-hover:animate-spin" size={40} />
      </motion.div>
    </div>
  );

  const renderVocabMode = () => (
    <div className="max-w-5xl mx-auto p-8 space-y-12 h-full pb-32">
      <button onClick={() => setActiveMode('hub')} className="flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-2xl text-slate-400 font-black uppercase text-xs hover:text-white border border-white/10 transition-all active:scale-95"><ArrowLeft size={20}/> {text.back}</button>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {VOCAB_100.map((v) => (
          <motion.div key={v.id} whileHover={{ scale: 1.08 }} className={`aspect-square ${v.color} rounded-[48px] shadow-2xl flex flex-col items-center justify-center text-center p-8 text-white cursor-pointer group relative overflow-hidden`}>
            <span className="text-8xl mb-6 group-hover:scale-125 transition-transform duration-500 drop-shadow-2xl">{v.icon}</span>
            <h4 className="text-3xl font-black tracking-tighter uppercase italic drop-shadow-lg">{v.en}</h4>
            <p className="text-sm font-bold opacity-80 mt-2 uppercase tracking-widest">{v.es}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderQuestMode = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-12 bg-slate-950 font-sans pb-32">
       <div className="w-full max-w-2xl flex justify-between items-center">
          <button onClick={() => setActiveMode('hub')} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><ArrowLeft size={24}/></button>
          <div className="flex gap-4">
             {QUEST_STAGES.map((s, idx) => (
                <div key={s.id} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${idx <= questStep ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-900 text-slate-700'}`}>{s.icon}</div>
             ))}
          </div>
       </div>

       <motion.div key={questStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[56px] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500 opacity-20" />
          <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center text-7xl mx-auto shadow-inner">{QUEST_STAGES[questStep].icon}</div>
          <div>
             <h2 className="text-5xl font-black text-white italic tracking-tighter">{QUEST_STAGES[questStep].title}</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-4">The Challenge: {QUEST_STAGES[questStep].task}</p>
          </div>
          
          <div className="bg-slate-950 p-8 rounded-[32px] border border-white/5">
             <p className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-4">Magic Phrase</p>
             <h4 className="text-4xl font-black text-white italic tracking-tighter">"{QUEST_STAGES[questStep].target}"</h4>
          </div>

          <button onClick={handleQuestAction} className="w-full py-6 bg-white text-slate-950 rounded-[28px] font-black text-xl uppercase tracking-tighter shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
             Complete Task <ChevronRight size={24}/>
          </button>
       </motion.div>
    </div>
  );

  return (
    <div className="h-full bg-slate-950 overflow-y-auto hide-scrollbar">
      <AnimatePresence mode="wait">
        {activeMode === 'hub' && renderBentoHub()}
        {activeMode === 'vocab' && renderVocabMode()}
        {activeMode === 'quest' && renderQuestMode()}
      </AnimatePresence>
    </div>
  );
};

export default KidsZone;