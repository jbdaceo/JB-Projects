
import React, { useState } from 'react';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
// Added Language import
import { Language } from '../types';
import { motion } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

// Added VocabularyToolProps
interface VocabularyToolProps {
  lang: Language;
}

const VocabularyTool: React.FC<VocabularyToolProps> = ({ lang }) => {
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  const words = [
    { word: 'Scholarship', translation: 'Becas', def: 'A grant or payment made to support a student\'s education.' },
    { word: 'Remote Work', translation: 'Trabajo Remoto', def: 'The practice of working from a location other than an office.' },
    { word: 'Breakthrough', translation: 'Gran Avance', def: 'A sudden, dramatic, and important discovery or development.' },
    { word: 'Resilience', translation: 'Resiliencia', def: 'The capacity to recover quickly from difficulties.' },
    { word: 'Negotiation', translation: 'Negociación', def: 'Discussion aimed at reaching an agreement.' },
    { word: 'Accountability', translation: 'Responsabilidad', def: 'The fact or condition of being accountable; responsibility.' },
  ];

  const handlePlay = async (text: string) => {
    try {
      setLoadingWord(text);
      const base64 = await getPronunciation(text);
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
      setLoadingWord(null);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="space-y-12 md:space-y-16 pb-24">
      <header>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Léxico del Éxito</h2>
        <p className="text-slate-400 mt-3 text-lg font-medium">Conceptos clave para dominar el mercado global.</p>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
      >
        {words.map((itemObj, idx) => (
          <motion.div 
            key={idx} 
            variants={item}
            whileHover={{ y: -12, backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
            className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden backdrop-blur-sm"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8 relative">
              <span className="px-5 py-2 bg-blue-600/10 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border border-blue-500/20 shadow-inner">
                Professional
              </span>
              <motion.button 
                onClick={() => handlePlay(itemObj.word)}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-2xl ${
                  loadingWord === itemObj.word 
                    ? 'bg-blue-600 shadow-blue-500/50' 
                    : 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white'
                }`}
              >
                {loadingWord === itemObj.word ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : '🔊'}
              </motion.button>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-3 group-hover:text-blue-400 transition-colors tracking-tight">{itemObj.word}</h3>
            <p className="text-blue-300/60 font-black mb-8 text-base italic leading-tight">"{itemObj.translation}"</p>
            
            <p className="text-slate-400 text-base leading-relaxed border-l-4 border-blue-500/30 pl-5 py-2 font-medium">
              {itemObj.def}
            </p>
          </motion.div>
        ))}

        <motion.div 
          variants={item}
          className="bg-slate-950/50 p-10 rounded-[40px] border-2 border-dashed border-slate-800 flex flex-col justify-center items-center text-center space-y-8 backdrop-blur-sm"
        >
          <div className="w-24 h-24 bg-slate-900 rounded-[36px] flex items-center justify-center text-5xl shadow-inner border border-slate-800 animate-pulse">✨</div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-white tracking-tight">Creciendo Contigo</h3>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed px-4 font-medium">
              Agregamos nuevos conceptos cada semana enfocados en Tech, Startups y Finanzas.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VocabularyTool;
