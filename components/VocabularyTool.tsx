
import React, { useState, useEffect } from 'react';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { Language } from '../types';
import { motion } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface VocabularyToolProps {
  lang: Language;
}

const ALL_WORDS = [
  { word: 'Scholarship', translation: 'Becas', defEn: 'A grant or payment made to support a student\'s education.', defEs: 'Una subvención o pago realizado para apoyar la educación de un estudiante.' },
  { word: 'Remote Work', translation: 'Trabajo Remoto', defEn: 'The practice of working from a location other than an office.', defEs: 'La práctica de trabajar desde un lugar distinto a una oficina.' },
  { word: 'Breakthrough', translation: 'Gran Avance', defEn: 'A sudden, dramatic, and important discovery or development.', defEs: 'Un descubrimiento o desarrollo repentino, dramático e importante.' },
  { word: 'Resilience', translation: 'Resiliencia', defEn: 'The capacity to recover quickly from difficulties.', defEs: 'La capacidad de recuperarse rápidamente de las dificultades.' },
  { word: 'Negotiation', translation: 'Negociación', defEn: 'Discussion aimed at reaching an agreement.', defEs: 'Discusión destinada a llegar a un acuerdo.' },
  { word: 'Accountability', translation: 'Responsabilidad', defEn: 'The fact or condition of being accountable; responsibility.', defEs: 'El hecho o condición de rendir cuentas; responsabilidad.' },
  { word: 'Networking', translation: 'Red de Contactos', defEn: 'The action or process of interacting with others to exchange information and develop professional contacts.', defEs: 'El proceso de interactuar con otros para intercambiar información y desarrollar contactos profesionales.' },
  { word: 'Freelance', translation: 'Independiente', defEn: 'Working for different companies at different times rather than being permanently employed by one company.', defEs: 'Trabajar para diferentes empresas en diferentes momentos en lugar de ser empleado permanente de una sola.' },
  { word: 'Entrepreneur', translation: 'Emprendedor', defEn: 'A person who organizes and operates a business or businesses.', defEs: 'Una persona que organiza y opera un negocio o negocios.' },
  { word: 'Innovation', translation: 'Innovación', defEn: 'A new method, idea, product, etc.', defEs: 'Un nuevo método, idea, producto, etc.' },
  { word: 'Deadline', translation: 'Fecha Límite', defEn: 'The latest time or date by which something should be completed.', defEs: 'La hora o fecha límite en la que algo debe completarse.' },
  { word: 'Skillset', translation: 'Conjunto de Habilidades', defEn: 'A person\'s range of skills or abilities.', defEs: 'El rango de habilidades o capacidades de una persona.' },
  { word: 'Feedback', translation: 'Retroalimentación', defEn: 'Information about reactions to a product, a person\'s performance of a task, etc.', defEs: 'Información sobre reacciones a un producto, desempeño de una persona, etc.' },
  { word: 'Equity', translation: 'Patrimonio/Equidad', defEn: 'The value of the shares issued by a company.', defEs: 'El valor de las acciones emitidas por una empresa.' },
  { word: 'Pitch', translation: 'Discurso de Venta', defEn: 'A form of words used when trying to persuade someone to buy or accept something.', defEs: 'Una forma de palabras usada al intentar persuadir a alguien para comprar o aceptar algo.' },
];

const VocabularyTool: React.FC<VocabularyToolProps> = ({ lang }) => {
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  const [displayWords, setDisplayWords] = useState<typeof ALL_WORDS>([]);
  
  const text = {
    title: lang === 'es' ? 'Léxico del Éxito' : 'Lexicon of Success',
    subtitle: lang === 'es' ? 'Conceptos clave para dominar el mercado global.' : 'Key concepts to master the global market.',
    professional: lang === 'es' ? 'Profesional' : 'Professional',
    growingWithYou: lang === 'es' ? 'Creciendo Contigo' : 'Growing With You',
    growingDesc: lang === 'es' ? 'Agregamos nuevos conceptos cada semana enfocados en Tech, Startups y Finanzas.' : 'We add new concepts every week focused on Tech, Startups, and Finance.'
  };

  useEffect(() => {
    // Shuffle and pick 6 words on mount
    const shuffled = [...ALL_WORDS].sort(() => 0.5 - Math.random());
    setDisplayWords(shuffled.slice(0, 6));
  }, []);

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
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{text.title}</h2>
        <p className="text-slate-400 mt-3 text-lg font-medium">{text.subtitle}</p>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10"
      >
        {displayWords.map((itemObj, idx) => (
          <motion.div 
            key={idx} 
            variants={item}
            whileHover={{ y: -12, backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
            className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden backdrop-blur-sm"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8 relative">
              <span className="px-5 py-2 bg-blue-600/10 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border border-blue-500/20 shadow-inner">
                {text.professional}
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
              {lang === 'es' ? itemObj.defEs : itemObj.defEn}
            </p>
          </motion.div>
        ))}

        <motion.div 
          variants={item}
          className="bg-slate-950/50 p-10 rounded-[40px] border-2 border-dashed border-slate-800 flex flex-col justify-center items-center text-center space-y-8 backdrop-blur-sm md:col-span-2 xl:col-span-1"
        >
          <div className="w-24 h-24 bg-slate-900 rounded-[36px] flex items-center justify-center text-5xl shadow-inner border border-slate-800 animate-pulse">✨</div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-white tracking-tight">{text.growingWithYou}</h3>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed px-4 font-medium">
              {text.growingDesc}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VocabularyTool;
