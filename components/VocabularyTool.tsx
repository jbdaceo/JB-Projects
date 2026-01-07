
import React, { useState, useEffect, useCallback } from 'react';
import { getPronunciation, decodeBase64Audio, decodeAudioData, generateNewsVocabulary, NewsWord } from '../services/gemini';
import { Language } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface VocabularyToolProps {
  lang: Language;
}

const VocabularyTool: React.FC<VocabularyToolProps> = ({ lang }) => {
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const [newsWords, setNewsWords] = useState<NewsWord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [refreshCount, setRefreshCount] = useState(0);

  const text = {
    title: lang === 'es' ? 'Léxico Real' : 'Real-Time Lexicon',
    subtitle: lang === 'es' ? 'Vocabulario avanzado de las noticias de HOY.' : 'Advanced vocabulary from TODAY\'S news headlines.',
    clickToFlip: lang === 'es' ? 'Click para girar' : 'Click to flip',
    nextSet: lang === 'es' ? 'Siguiente Set' : 'Next Daily Set',
    refreshing: lang === 'es' ? 'Buscando noticias...' : 'Scanning news...',
    pronounce: lang === 'es' ? 'Pronunciar' : 'Pronounce'
  };

  const fetchNewsWords = useCallback(async () => {
    setLoadingData(true);
    setFlippedCards(new Set()); // Reset flips
    try {
        const words = await generateNewsVocabulary(lang);
        setNewsWords(words);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingData(false);
    }
  }, [lang, refreshCount]);

  useEffect(() => {
    fetchNewsWords();
  }, [fetchNewsWords]);

  const handleFlip = (index: number) => {
      setFlippedCards(prev => {
          const newSet = new Set(prev);
          if (newSet.has(index)) newSet.delete(index);
          else newSet.add(index);
          return newSet;
      });
  };

  const handlePlay = async (textToSpeak: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent flip when clicking audio
    try {
      setLoadingAudio(textToSpeak);
      const base64 = await getPronunciation(textToSpeak);
      if (base64) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decodeBase64Audio(base64), audioContext);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAudio(null);
    }
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemAnim: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
  };

  return (
    <div className="space-y-10 pb-24 px-2">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{text.title}</span>
          </h2>
          <p className="text-slate-400 mt-2 text-lg font-medium max-w-xl leading-relaxed">{text.subtitle}</p>
        </div>
        
        <button 
            onClick={() => setRefreshCount(c => c + 1)}
            disabled={loadingData}
            className="group flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
            <span className={`text-xl ${loadingData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>↻</span>
            <span className="font-bold text-white uppercase tracking-widest text-xs">
                {loadingData ? text.refreshing : text.nextSet}
            </span>
        </button>
      </header>

      {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 h-96">
              {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-slate-900/30 rounded-[32px] border border-white/5 animate-pulse h-64 w-full"></div>
              ))}
          </div>
      ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 perspective-1000"
          >
            {newsWords.map((item, idx) => {
                const isFlipped = flippedCards.has(idx);
                
                return (
                  <motion.div 
                    key={idx} 
                    variants={itemAnim}
                    className="relative h-80 w-full cursor-pointer group perspective-1000"
                    onClick={() => handleFlip(idx)}
                  >
                    <motion.div 
                        className="w-full h-full relative preserve-3d transition-transform duration-700"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* FRONT OF CARD */}
                        <div 
                            className="absolute inset-0 w-full h-full backface-hidden" 
                            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[32px] p-6 flex flex-col shadow-2xl relative overflow-hidden group-hover:border-blue-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-6 opacity-10 text-9xl font-serif pointer-events-none select-none">Aa</div>
                                
                                <div className="flex justify-between items-start z-10 w-full mb-2">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                        {item.category || "News"}
                                    </span>
                                    <button 
                                        onClick={(e) => handlePlay(item.word, e)}
                                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center transition-colors shadow-lg active:scale-90 border border-white/10"
                                        title={text.pronounce}
                                    >
                                        {loadingAudio === item.word ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : '🔊'}
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-2">
                                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight break-words w-full">
                                        {item.word}
                                    </h3>
                                    <p className="text-slate-500 font-medium text-sm animate-pulse mt-2">{text.clickToFlip}</p>
                                </div>

                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-blue-500 w-1/3 group-hover:w-full transition-all duration-700"></div>
                                </div>
                            </div>
                        </div>

                        {/* BACK OF CARD */}
                        <div 
                            className="absolute inset-0 w-full h-full backface-hidden" 
                            style={{ 
                                transform: 'rotateY(180deg)', 
                                backfaceVisibility: 'hidden', 
                                WebkitBackfaceVisibility: 'hidden' 
                            }}
                        >
                            <div className="w-full h-full bg-blue-900/20 backdrop-blur-xl border border-blue-500/30 rounded-[32px] p-8 flex flex-col justify-between shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/90 pointer-events-none"></div>
                                
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                                        <div className="flex flex-col gap-1 mb-4">
                                            <h3 className="text-2xl font-black text-white">{item.word}</h3>
                                            <span className="text-blue-300 font-serif italic text-lg">"{item.translation}"</span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed mb-4 font-medium">
                                            {item.definition}
                                        </p>
                                    </div>

                                    <div className="bg-black/30 p-4 rounded-xl border-l-4 border-blue-500 mt-auto">
                                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">IN THE NEWS</p>
                                        <p className="text-white text-xs italic leading-relaxed line-clamp-3">
                                            "{item.newsContext}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                  </motion.div>
                );
            })}
          </motion.div>
      )}
    </div>
  );
};

export default VocabularyTool;
