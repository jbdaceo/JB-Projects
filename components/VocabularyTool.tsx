
import React, { useState, useEffect } from 'react';
import { generateSRSBatch } from '../services/gemini';
import { Language, SRSItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, Clock, X, ThumbsUp, Plus } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface VocabularyToolProps {
  lang: Language;
}

const VocabularyTool: React.FC<VocabularyToolProps> = ({ lang }) => {
  const [srsItems, setSrsItems] = useState<SRSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'review' | 'mastered'>('new');

  useEffect(() => {
    if (srsItems.length === 0) handleGenerateBatch();
  }, [lang]); // Re-fetch if language changes (though ideally we should clear items or handle dual lang)

  const handleGenerateBatch = async () => {
    setLoading(true);
    // Pass lang to ensure we get the right direction (ES->EN or EN->ES)
    const newItems = await generateSRSBatch('B2', 'General', lang, 6);
    setSrsItems(prev => [...newItems, ...prev]);
    setLoading(false);
  };

  const markItem = (id: string, rating: 'hard' | 'good') => {
      // In a real app, this updates the SRS interval
      setSrsItems(prev => prev.map(i => {
          if (i.id === id) {
              return { ...i, repetition: rating === 'good' ? i.repetition + 1 : 0 };
          }
          return i;
      }));
  };

  const filteredItems = srsItems.filter(i => {
      if (activeTab === 'new') return i.repetition === 0;
      if (activeTab === 'review') return i.repetition > 0 && i.repetition < 5;
      return i.repetition >= 5;
  });

  const text = {
      title: lang === 'es' ? 'Léxico Pro' : 'Vocab Pro',
      subtitle: lang === 'es' ? 'Tarjetas Inteligentes' : 'Smart Flashcards',
      genMore: lang === 'es' ? 'Generar más' : 'Generate more',
      hard: lang === 'es' ? 'Difícil' : 'Hard',
      good: lang === 'es' ? 'Bien' : 'Good',
      new: lang === 'es' ? 'Nuevas' : 'New',
      review: lang === 'es' ? 'Repaso' : 'Review',
      done: lang === 'es' ? 'Listo' : 'Done',
      caughtUp: lang === 'es' ? '¡Todo al día!' : 'All caught up!',
  };

  const renderCard = (item: SRSItem) => (
    <motion.div 
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-white/10 p-6 rounded-[32px] relative overflow-hidden group shadow-xl flex flex-col justify-between min-h-[200px]"
    >
      <div className="mb-4">
        <h3 className="text-3xl font-black text-white mb-2 leading-tight">{item.term}</h3>
        <p className="text-blue-400 text-lg font-medium italic font-serif">{item.translation}</p>
      </div>
      
      <div className="bg-black/20 p-4 rounded-2xl mb-6">
         <p className="text-slate-300 text-sm leading-relaxed">"{item.context}"</p>
      </div>
      
      <div className="flex gap-4 mt-auto">
         <Tooltip content={text.hard}>
             <button onClick={() => markItem(item.id, 'hard')} className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-colors">
                 <X size={24} />
             </button>
         </Tooltip>
         <Tooltip content={text.good}>
             <button onClick={() => markItem(item.id, 'good')} className="flex-1 py-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-2xl flex items-center justify-center transition-colors">
                 <ThumbsUp size={24} />
             </button>
         </Tooltip>
      </div>
    </motion.div>
  );

  return (
    <div className="pb-24 px-4 h-full flex flex-col max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{text.title}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{text.subtitle}</p>
        </div>
        <Tooltip content={text.genMore}>
            <button 
                onClick={handleGenerateBatch} 
                disabled={loading}
                className="bg-white text-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
            >
                {loading ? <span className="animate-spin">⚡</span> : <Plus size={24} />}
            </button>
        </Tooltip>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-900 p-1 rounded-2xl self-start">
         {[
             { id: 'new', label: text.new, icon: Brain },
             { id: 'review', label: text.review, icon: Clock },
             { id: 'mastered', label: text.done, icon: CheckCircle }
         ].map(tab => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
                 <tab.icon size={16} />
                 <span className="hidden sm:inline">{tab.label}</span>
             </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 hide-scrollbar pb-20">
         <AnimatePresence>
            {filteredItems.map(renderCard)}
         </AnimatePresence>
         {filteredItems.length === 0 && !loading && (
             <div className="col-span-full text-center py-20 text-slate-500">
                 <p className="text-lg">{text.caughtUp}</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default VocabularyTool;
