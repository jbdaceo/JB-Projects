import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSRSBatch, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language, SRSItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, Clock, X, ThumbsUp, Plus, RotateCw, Volume2, Zap, Flame, Trophy, ChevronRight, BarChart3 } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';
import confetti from 'canvas-confetti';

const VocabularyTool: React.FC<{ lang: Language }> = ({ lang }) => {
  const [srsItems, setSrsItems] = useState<SRSItem[]>([]);
  const [doneItems, setDoneItems] = useState<SRSItem[]>([]);
  const [reviewItems, setReviewItems] = useState<SRSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'study' | 'quiz'>('study');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [quizState, setQuizState] = useState({ currentIndex: 0, score: 0, isFinished: false, options: [] as string[] });

  useEffect(() => {
    const savedDone = localStorage.getItem('tmc_vocab_done');
    const savedReview = localStorage.getItem('tmc_vocab_review');
    if (savedDone) setDoneItems(JSON.parse(savedDone));
    if (savedReview) setReviewItems(JSON.parse(savedReview));
    handleGenerateBatch();
  }, []);

  const handleGenerateBatch = async () => {
    setLoading(true);
    try {
      const newItems = await generateSRSBatch('B2', 'General', lang, 12);
      setSrsItems(newItems);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const markDone = (item: SRSItem) => {
    const newDone = [item, ...doneItems];
    setDoneItems(newDone);
    setSrsItems(prev => prev.filter(i => i.id !== item.id));
    setReviewItems(prev => prev.filter(i => i.id !== item.id));
    localStorage.setItem('tmc_vocab_done', JSON.stringify(newDone));
    triggerHaptic('success');
  };

  const markReview = (item: SRSItem) => {
    const newReview = [item, ...reviewItems.filter(i => i.id !== item.id)];
    setReviewItems(newReview);
    setSrsItems(prev => prev.filter(i => i.id !== item.id));
    localStorage.setItem('tmc_vocab_review', JSON.stringify(newReview));
    triggerHaptic('medium');
  };

  const playAudio = async (text: string) => {
    const base64 = await getPronunciation(text);
    if (base64) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decodeBase64Audio(base64), audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  };

  const startQuiz = () => {
    const pool = [...srsItems, ...reviewItems];
    if (pool.length < 4) return;
    setQuizState({ currentIndex: 0, score: 0, isFinished: false, options: generateOptions(0, pool) });
    setMode('quiz');
  };

  const generateOptions = (idx: number, pool: SRSItem[]) => {
    const correct = pool[idx].translation;
    const others = pool.filter((_, i) => i !== idx).map(p => p.translation);
    return [...others.sort(() => 0.5 - Math.random()).slice(0, 3), correct].sort(() => 0.5 - Math.random());
  };

  const handleQuizAnswer = (choice: string) => {
    const pool = [...srsItems, ...reviewItems];
    const current = pool[quizState.currentIndex];
    if (choice === current.translation) {
      setQuizState(prev => ({ ...prev, score: prev.score + 10 }));
      markDone(current);
    } else {
      markReview(current);
    }

    if (quizState.currentIndex >= pool.length - 1) {
      setQuizState(prev => ({ ...prev, isFinished: true }));
      confetti({ particleCount: 100 });
    } else {
      const nextIdx = quizState.currentIndex + 1;
      setQuizState(prev => ({ ...prev, currentIndex: nextIdx, options: generateOptions(nextIdx, pool) }));
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 pb-24">
      {/* Mini Stats Sidebar */}
      <aside className="w-full md:w-64 flex flex-col gap-4">
        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 space-y-6 shadow-xl">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Brain size={20}/></div>
              <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Mastery</p><h3 className="text-xl font-black text-white italic">Vocab Pro</h3></div>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mastered</span>
                <span className="text-emerald-400 font-black text-sm">{doneItems.length}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                <span className="text-amber-400 font-black text-sm">{srsItems.length}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Review</span>
                <span className="text-rose-400 font-black text-sm">{reviewItems.length}</span>
              </div>
           </div>
           <button onClick={startQuiz} className="w-full py-4 bg-brand-500 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Zap size={16}/> Start Quiz</button>
        </div>
        <button onClick={handleGenerateBatch} disabled={loading} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest transition-all flex items-center justify-center gap-2">
          <RotateCw size={14} className={loading ? 'animate-spin' : ''}/> Sync New Batch
        </button>
      </aside>

      {/* Main Action Area */}
      <main className="flex-1 bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden flex flex-col glass-panel">
        <AnimatePresence mode="wait">
          {mode === 'study' ? (
            <motion.div key="study" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-6 space-y-3 hide-scrollbar">
              {[...srsItems, ...reviewItems].map(item => (
                <motion.div 
                  key={item.id} 
                  layout
                  onClick={() => setFocusedId(focusedId === item.id ? null : item.id)}
                  className={`group p-6 rounded-[24px] border transition-all cursor-pointer ${focusedId === item.id ? 'bg-white border-white shadow-2xl scale-[1.02]' : 'bg-slate-950/50 border-white/5 hover:border-white/10'}`}
                >
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <p className={`text-2xl font-black italic tracking-tighter ${focusedId === item.id ? 'text-slate-950' : 'text-white'}`}>{item.term}</p>
                        {focusedId === item.id && <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Active Focus</span>}
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={(e) => { e.stopPropagation(); playAudio(item.term); }} className={`p-2 rounded-xl transition-all ${focusedId === item.id ? 'bg-slate-900 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}><Volume2 size={16}/></button>
                         <ChevronRight size={16} className={`transition-transform ${focusedId === item.id ? 'rotate-90 text-slate-950' : 'text-slate-700'}`}/>
                      </div>
                   </div>
                   
                   <AnimatePresence>
                     {focusedId === item.id && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-6 mt-6 border-t border-slate-200">
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Translation & Context</p>
                          <h4 className="text-xl font-bold text-slate-900 mb-4">{item.translation}</h4>
                          <div className="bg-slate-100 p-4 rounded-xl mb-6 italic text-slate-700 text-sm">"{item.context}"</div>
                          <div className="flex gap-3">
                             <button onClick={(e) => { e.stopPropagation(); markReview(item); setFocusedId(null); }} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Hard (Review)</button>
                             <button onClick={(e) => { e.stopPropagation(); markDone(item); setFocusedId(null); }} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Easy (Mastered)</button>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </motion.div>
              ))}
              {[...srsItems, ...reviewItems].length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                  <BarChart3 size={64} className="mb-6"/>
                  <h3 className="text-2xl font-black uppercase italic">Deck Empty</h3>
                  <p className="text-sm font-medium">Sync a new batch to continue training.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center">
               {quizState.isFinished ? (
                 <div className="space-y-6">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-2xl"><Trophy size={48}/></div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">Class Over</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Score: <span className="text-brand-400">{quizState.score} XP</span></p>
                    <button onClick={() => setMode('study')} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl">Return to Studio</button>
                 </div>
               ) : (
                 <div className="w-full max-w-lg space-y-12">
                    <div className="space-y-4">
                       <span className="px-4 py-1.5 bg-brand-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Question {quizState.currentIndex + 1}</span>
                       <h3 className="text-6xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl">{([...srsItems, ...reviewItems])[quizState.currentIndex]?.term}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {quizState.options.map((opt, i) => (
                         <button key={i} onClick={() => handleQuizAnswer(opt)} className="p-6 bg-slate-950/80 border-2 border-slate-800 hover:border-brand-500 hover:bg-brand-500/10 rounded-2xl text-white font-bold transition-all shadow-xl">{opt}</button>
                       ))}
                    </div>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default VocabularyTool;