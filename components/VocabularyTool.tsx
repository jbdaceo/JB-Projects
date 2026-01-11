
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateSRSBatch, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language, SRSItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, RotateCw, Volume2, Zap, BarChart3, List, 
  ChevronRight, Globe, Database, Fingerprint, Info, X
} from 'lucide-react';
import { triggerHaptic } from '../utils/performance';
import confetti from 'canvas-confetti';

const VocabularyTool: React.FC<{ lang: Language }> = ({ lang }) => {
  const [srsItems, setSrsItems] = useState<SRSItem[]>([]);
  const [doneItems, setDoneItems] = useState<SRSItem[]>([]);
  const [reviewItems, setReviewItems] = useState<SRSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'study' | 'stats'>('study');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);

  const t = useMemo(() => ({
    hub: lang === 'es' ? 'Núcleo Neural' : 'Neural Hub',
    mastered: lang === 'es' ? 'Dominadas' : 'Mastered',
    review: lang === 'es' ? 'Repaso' : 'Review',
    matrix: lang === 'es' ? 'Matriz de Estudio' : 'Study Matrix',
    analytics: lang === 'es' ? 'Analítica Neural' : 'Neural Analytics',
    sync: lang === 'es' ? 'Sincronizar Pack' : 'Sync New Pack',
    loading: lang === 'es' ? 'Accediendo al Núcleo...' : 'Accessing Core...',
    tier: lang === 'es' ? 'Nivel Académico' : 'Academic Tier',
    abstraction: lang === 'es' ? 'Abstracción Global' : 'Global Abstraction',
    anchor: lang === 'es' ? 'Anclaje Conceptual' : 'Conceptual Anchor',
    context: lang === 'es' ? 'Patrón de Contexto' : 'Context Pattern',
    masteredBtn: lang === 'es' ? 'Dominado' : 'Mastered',
    reviewBtn: lang === 'es' ? 'Repaso Neural' : 'Neural Review',
    metrics: lang === 'es' ? 'Métricas de Sinapsis' : 'Synapse Metrics',
    feed: lang === 'es' ? 'Datos de Adquisición' : 'Acquisition Feed',
    retention: lang === 'es' ? 'Coeficiente de Retención' : 'Retention Coefficient',
    velocity: lang === 'es' ? 'Velocidad Cognitiva' : 'Cognitive Velocity',
    consistency: lang === 'es' ? 'Consistencia Sync' : 'Sync Consistency',
    days: lang === 'es' ? 'Días' : 'Days',
    optimal: lang === 'es' ? 'Óptima' : 'Optimal'
  }), [lang]);

  useEffect(() => {
    const savedDone = localStorage.getItem('tmc_vocab_done_v2');
    const savedReview = localStorage.getItem('tmc_vocab_review_v2');
    if (savedDone) setDoneItems(JSON.parse(savedDone));
    if (savedReview) setReviewItems(JSON.parse(savedReview));
    handleGenerateBatch();
  }, []);

  const handleGenerateBatch = async () => {
    setLoading(true);
    triggerHaptic('medium');
    try {
      const newItems = await generateSRSBatch('C1', 'Academic', lang, 12);
      setSrsItems(newItems);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const markDone = (item: SRSItem) => {
    const newDone = [item, ...doneItems.filter(i => i.id !== item.id)];
    setDoneItems(newDone);
    setSrsItems(prev => prev.filter(i => i.id !== item.id));
    setReviewItems(prev => prev.filter(i => i.id !== item.id));
    localStorage.setItem('tmc_vocab_done_v2', JSON.stringify(newDone));
    triggerHaptic('success');
    if (newDone.length % 5 === 0) confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  const markReview = (item: SRSItem) => {
    const newReview = [item, ...reviewItems.filter(i => i.id !== item.id)];
    setReviewItems(newReview);
    setSrsItems(prev => prev.filter(i => i.id !== item.id));
    localStorage.setItem('tmc_vocab_review_v2', JSON.stringify(newReview));
    triggerHaptic('medium');
  };

  const playAudio = async (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(id);
    const base64 = await getPronunciation(text);
    if (base64) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decodeBase64Audio(base64), audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
      source.onended = () => setIsPlaying(null);
    } else { setIsPlaying(null); }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 md:gap-8 p-4 pt-4 pb-40 overflow-hidden font-sans relative">
      
      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[40px] max-w-lg shadow-2xl relative">
                    <button onClick={() => setShowInfo(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
                    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"><Brain size={32}/></div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Neural Vocab System</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        {lang === 'es' 
                         ? 'Este sistema usa repetición espaciada para hackear tu memoria. Toca una tarjeta para expandirla. Si conoces la palabra, desliza a "Dominado". Si no, a "Repaso". El algoritmo se encargará del resto.' 
                         : 'This system uses spaced repetition to hack your memory. Tap a card to expand. If you know it, mark "Mastered". If not, "Review". The algorithm handles the rest.'}
                    </p>
                    <button onClick={() => setShowInfo(false)} className="w-full py-4 bg-brand-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg">Understood</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <aside className="w-full lg:w-80 xl:w-96 flex flex-col gap-6 shrink-0">
        <div className="bg-slate-900 border border-white/10 rounded-[40px] md:rounded-[56px] p-8 md:p-10 space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden facetime-glass">
           <div className="absolute top-0 right-0 p-10 opacity-5"><Brain size={180}/></div>
           <div className="flex items-center gap-5 md:gap-6 relative z-10">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-500 rounded-[24px] md:rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-brand-500/30"><Fingerprint size={28}/></div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-brand-400 uppercase tracking-[0.5em]">{t.hub}</p>
                <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase leading-none tracking-tighter font-display">Vocab Pro</h3>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-emerald-500/10 p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-white/5 text-center">
                 <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">{t.mastered}</span>
                 <span className="text-emerald-400 font-black text-3xl md:text-4xl tracking-tighter">{doneItems.length}</span>
              </div>
              <div className="bg-rose-500/10 p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-white/5 text-center">
                 <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">{t.review}</span>
                 <span className="text-rose-400 font-black text-3xl md:text-4xl tracking-tighter">{reviewItems.length}</span>
              </div>
           </div>
           <div className="space-y-3 relative z-10 pt-2">
             <button onClick={() => setMode(mode === 'stats' ? 'study' : 'stats')} className="w-full py-5 md:py-6 bg-white/5 hover:bg-brand-500/10 border border-white/10 rounded-[24px] md:rounded-[28px] text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 md:gap-4 group">
               {mode === 'stats' ? <List size={16}/> : <BarChart3 size={16}/>} {mode === 'stats' ? t.matrix : t.analytics}
             </button>
             <button onClick={handleGenerateBatch} disabled={loading} className="w-full py-5 md:py-6 bg-brand-500 text-white rounded-[24px] md:rounded-[28px] text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 md:gap-4 shadow-xl disabled:opacity-30 active:scale-95">
               <RotateCw size={16} className={loading ? 'animate-spin' : ''}/> {t.sync}
             </button>
           </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-900/20 border-2 border-white/5 rounded-[48px] md:rounded-[72px] overflow-hidden flex flex-col shadow-2xl relative backdrop-blur-3xl">
        <button onClick={() => setShowInfo(true)} className="absolute top-6 right-6 p-2 text-white/20 hover:text-white z-20"><Info size={24}/></button>
        <AnimatePresence mode="wait">
          {mode === 'study' ? (
            <motion.div key="study" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 md:space-y-6 hide-scrollbar relative z-10">
              {loading && srsItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center space-y-8 md:space-y-10 opacity-20">
                  <Database size={80} className="animate-pulse" />
                  <p className="font-black uppercase tracking-[0.6em] text-[9px] md:text-[11px]">{t.loading}</p>
                </div>
              )}
              {[...srsItems, ...reviewItems].map((item, idx) => (
                <motion.div 
                  key={item.id} layout
                  onClick={() => { setFocusedId(focusedId === item.id ? null : item.id); triggerHaptic('light'); }}
                  className={`p-6 md:p-10 rounded-[40px] md:rounded-[64px] border-2 transition-all cursor-pointer relative overflow-hidden ${focusedId === item.id ? 'bg-white border-white shadow-2xl' : 'bg-slate-950/60 border-white/5 hover:bg-slate-900 shadow-xl'}`}
                >
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6 md:gap-10">
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center text-lg md:text-xl font-black shadow-inner shrink-0 ${focusedId === item.id ? 'bg-slate-950 text-white' : 'bg-white/5 text-slate-700'}`}>{idx + 1}</div>
                        <div className="min-w-0">
                          <p className={`text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tighter leading-none truncate font-display ${focusedId === item.id ? 'text-slate-950' : 'text-white'}`}>{item.term}</p>
                          <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mt-3 md:mt-4 ${focusedId === item.id ? 'text-brand-500' : 'text-slate-600'}`}>{t.tier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                         <button 
                            onClick={(e) => playAudio(item.term, item.id, e)} 
                            className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl transition-all shadow-xl flex items-center justify-center ${focusedId === item.id ? 'bg-slate-950 text-white hover:bg-brand-500' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                         >
                            <Volume2 size={22} className={isPlaying === item.id ? 'animate-pulse' : ''} />
                         </button>
                         <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-transform duration-500 ${focusedId === item.id ? 'rotate-90 bg-slate-100' : 'opacity-10'}`}>
                            <ChevronRight size={24} className={focusedId === item.id ? 'text-slate-950' : 'text-white'}/>
                         </div>
                      </div>
                   </div>
                   
                   <AnimatePresence>
                     {focusedId === item.id && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-8 md:pt-12 mt-8 md:mt-12 border-t-2 border-slate-100 space-y-8 md:space-y-12 text-slate-900">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                             <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white text-[8px] md:text-[10px] font-black shadow-lg uppercase">EN</div>
                                   <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t.abstraction}</p>
                                </div>
                                <h4 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight font-display">{item.definitionEn || 'Specialized terminological meaning.'}</h4>
                             </div>
                             <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white text-[8px] md:text-[10px] font-black shadow-lg uppercase">ES</div>
                                   <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t.anchor}</p>
                                </div>
                                <h4 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight font-display">{item.definitionEs || 'Significado terminológico especializado.'}</h4>
                             </div>
                          </div>
                          
                          <div className="bg-slate-50 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border-2 border-slate-100 shadow-inner space-y-4">
                             <p className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mb-2 flex items-center gap-2 md:gap-3"><Globe size={12}/> {t.context}</p>
                             <div className="text-lg md:text-2xl text-slate-700 italic font-medium leading-relaxed font-serif">"{item.contextEn}"</div>
                             <div className="text-lg md:text-2xl text-slate-500 italic font-medium leading-relaxed font-serif">"{item.contextEs}"</div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-12">
                             <button onClick={(e) => { e.stopPropagation(); markReview(item); setFocusedId(null); }} className="flex-1 py-6 md:py-8 bg-slate-950 text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs hover:bg-rose-700 transition-all shadow-xl active:scale-95">{t.reviewBtn}</button>
                             <button onClick={(e) => { e.stopPropagation(); markDone(item); setFocusedId(null); }} className="flex-1 py-6 md:py-8 bg-brand-500 text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs hover:bg-emerald-600 transition-all shadow-xl active:scale-95">{t.masteredBtn}</button>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-10 md:p-20 space-y-12 md:space-y-16">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-3 md:space-y-4">
                     <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none font-display">{t.metrics}</h2>
                     <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[8px] md:text-[10px]">{t.feed}</p>
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-500/10 rounded-full flex items-center justify-center text-brand-500 border-2 border-brand-500/20"><BarChart3 size={32} /></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {[
                    { label: t.retention, val: '94.8%', icon: <Zap size={22}/>, color: 'text-brand-400' },
                    { label: t.velocity, val: t.optimal, icon: <Brain size={22}/>, color: 'text-emerald-400' },
                    { label: t.consistency, val: `12 ${t.days}`, icon: <Database size={22}/>, color: 'text-amber-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-950 p-8 md:p-12 rounded-[48px] md:rounded-[64px] border border-white/5 shadow-2xl space-y-8 md:space-y-10 relative overflow-hidden group">
                       <div className="flex items-center gap-3 md:gap-4 text-slate-600">
                          {stat.icon} 
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                       </div>
                       <p className={`text-4xl md:text-6xl font-black italic tracking-tighter font-display ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default VocabularyTool;
