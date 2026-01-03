
import React, { useState } from 'react';
import { generateLesson } from '../services/gemini';
import { Lesson, Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import confetti from 'https://esm.sh/canvas-confetti@1.9.2';

interface LessonGeneratorProps {
  lang: Language;
}

const LessonGenerator: React.FC<LessonGeneratorProps> = ({ lang }) => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<'deep' | 'quick'>('quick');
  const [inputError, setInputError] = useState(false);

  const text = {
    title: lang === 'es' ? 'Maestría Personalizada' : 'Personalized Mastery',
    subtitle: lang === 'es' ? 'Diseña tu propio camino hacia el bilingüismo profesional.' : 'Design your own path to professional bilingualism.',
    quickMission: lang === 'es' ? 'Misión Rápida' : 'Quick Mission',
    deepDive: lang === 'es' ? 'Deep Dive' : 'Deep Dive',
    topicLabel: lang === 'es' ? '¿Qué quieres dominar hoy?' : 'What do you want to master today?',
    topicPlaceholder: lang === 'es' ? 'Ej: Entrevistas en Google, Presentaciones Tech...' : 'Ex: Google Interviews, Tech Presentations...',
    levelLabel: lang === 'es' ? 'Tu Nivel Actual' : 'Your Current Level',
    generateBtn: lang === 'es' ? 'Generar Clase' : 'Generate Lesson',
    preparingBtn: lang === 'es' ? 'Preparando...' : 'Preparing...',
    loadingTitle: lang === 'es' ? 'El Profe Tomas está diseñando tu clase...' : 'Professor Tomas is designing your lesson...',
    loadingQuote: lang === 'es' ? '"Invertir en tu educación es la única inversión con retorno garantizado."' : '"Investing in your education is the only investment with guaranteed returns."',
    missionObjectives: lang === 'es' ? 'Objetivos de la Misión' : 'Mission Objectives',
    viewFull: lang === 'es' ? 'Ver contenido completo →' : 'View full content →',
    challengeTitle: lang === 'es' ? 'Desafío de Comprensión' : 'Comprehension Challenge',
    score: lang === 'es' ? 'Puntaje' : 'Score',
    finishBtn: lang === 'es' ? 'Finalizar Lección' : 'Finish Lesson',
    powerWords: lang === 'es' ? 'Palabras de Poder' : 'Power Words',
    proTipTitle: lang === 'es' ? 'Consejo de Profe Tomas' : 'Pro Tip from Tomas',
    proTipText: lang === 'es' ? '"No solo estudies el idioma, vive el idioma. Si quieres ganar en dólares, debes empezar a pensar en dólares hoy."' : '"Don\'t just study the language, live the language. If you want to earn in dollars, start thinking in dollars today."',
    validationMsg: lang === 'es' ? 'Por favor ingresa un tema para crear tu clase.' : 'Please enter a topic to create your lesson.'
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setLoading(true);
    setLesson(null);
    setQuizScore(null);
    setUserAnswers({});
    try {
      const result = await generateLesson(topic, level);
      setLesson(result);
      setViewMode('quick');
    } catch (error) {
      console.error(error);
      alert(lang === 'es' ? 'Hubo un error al preparar tu clase. Intentémoslo de nuevo.' : 'There was an error preparing your lesson. Let\'s try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkQuiz = () => {
    if (!lesson) return;
    let score = 0;
    lesson.quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) score++;
    });
    setQuizScore(score);

    // Trigger Fireworks if perfect score (3/3 or whatever length)
    if (score === lesson.quiz.length) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h2 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tighter"
          >
            {text.title}
          </motion.h2>
          <p className="text-slate-400 mt-2 text-lg">{text.subtitle}</p>
        </div>
        
        {lesson && (
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
            <button 
              onClick={() => setViewMode('quick')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'quick' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              {text.quickMission}
            </button>
            <button 
              onClick={() => setViewMode('deep')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'deep' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              {text.deepDive}
            </button>
          </div>
        )}
      </header>

      <motion.div 
        layout
        className="bg-slate-900/40 p-8 md:p-10 rounded-[40px] border border-slate-800 shadow-2xl flex flex-col xl:flex-row gap-8 items-end backdrop-blur-md"
      >
        <div className="flex-1 space-y-3 w-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">
            {text.topicLabel} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder={text.topicPlaceholder}
            className={`w-full px-8 py-5 bg-slate-950 border rounded-2xl text-white outline-none transition-all placeholder:text-slate-600 text-lg shadow-inner ${
              inputError 
                ? 'border-red-500 focus:ring-4 focus:ring-red-500/20 animate-pulse' 
                : 'border-slate-700/50 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              if (e.target.value.trim()) setInputError(false);
            }}
          />
          {inputError && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-bold px-2">
              ⚠️ {text.validationMsg}
            </motion.p>
          )}
        </div>
        <div className="w-full xl:w-56 space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">{text.levelLabel}</label>
          <div className="relative">
            <select 
              className="w-full px-8 py-5 bg-slate-950 border border-slate-700/50 rounded-2xl text-white outline-none appearance-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-lg shadow-inner"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
          </div>
        </div>
        <motion.button 
          onClick={handleGenerate}
          disabled={loading}
          whileHover={{ scale: 1.02, backgroundColor: '#3b82f6' }}
          whileTap={{ scale: 0.98 }}
          className="w-full xl:w-auto px-12 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all text-lg active:scale-95"
        >
          {loading ? text.preparingBtn : text.generateBtn}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-40 space-y-10 bg-slate-900/20 rounded-[40px] border border-slate-800/40 backdrop-blur-xl"
          >
            <div className="relative">
              <div className="w-24 h-24 border-[6px] border-blue-600/10 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">✨</div>
            </div>
            <div className="text-center space-y-3 px-6">
              <p className="text-blue-400 font-black text-2xl tracking-tight">{text.loadingTitle}</p>
              <p className="text-slate-500 italic max-w-sm mx-auto">{text.loadingQuote}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {lesson && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10"
        >
          {/* Main Content: Spans 1 col on Tablet, 2 cols on Desktop */}
          <div className="md:col-span-2 space-y-10">
            <div className="bg-slate-900/40 p-8 md:p-14 rounded-[40px] border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewMode === 'quick' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                  {viewMode === 'quick' ? `⚡ ${text.quickMission}` : `📖 ${text.deepDive}`}
                 </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-10 tracking-tight leading-tight">{lesson.title}</h3>
              
              <AnimatePresence mode="wait">
                {viewMode === 'quick' ? (
                  <motion.div
                    key="quick"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                      <p className="text-blue-400 font-black uppercase tracking-widest text-xs mb-6">{text.missionObjectives}</p>
                      <div className="prose prose-invert max-w-none text-slate-300 text-xl font-medium leading-relaxed whitespace-pre-wrap">
                        {lesson.summary}
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewMode('deep')}
                      className="text-blue-400 text-sm font-black hover:underline underline-offset-4"
                    >
                      {text.viewFull}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="deep"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap text-lg md:text-xl font-medium"
                  >
                    {lesson.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-slate-900/40 p-8 md:p-14 rounded-[40px] border border-slate-800 shadow-2xl backdrop-blur-sm">
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-white">
                <span className="p-3 bg-blue-600/20 rounded-2xl text-blue-400 shadow-inner">📝</span> {text.challengeTitle}
              </h3>
              <div className="space-y-12">
                {lesson.quiz.map((q, idx) => (
                  <div key={idx} className="space-y-6">
                    <p className="font-black text-xl md:text-2xl text-slate-100 tracking-tight">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {q.options.map((opt) => (
                        <motion.button
                          key={opt}
                          onClick={() => setUserAnswers({ ...userAnswers, [idx]: opt })}
                          whileHover={{ scale: 1.02, backgroundColor: userAnswers[idx] === opt ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 41, 59, 0.6)' }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-6 rounded-2xl border-2 text-left transition-all text-base font-bold shadow-lg ${
                            userAnswers[idx] === opt
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-16 flex flex-col xl:flex-row items-center justify-between pt-10 border-t border-slate-800 gap-8">
                {quizScore !== null ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-5 bg-slate-800/60 px-8 py-4 rounded-2xl border border-slate-700 shadow-xl w-full xl:w-auto"
                  >
                    <p className="text-xl font-black text-white tracking-tight">{text.score}: {quizScore}/{lesson.quiz.length}</p>
                    <span className="text-4xl">{quizScore === lesson.quiz.length ? '👑' : '💪'}</span>
                  </motion.div>
                ) : <div />}
                <motion.button 
                  onClick={checkQuiz}
                  whileHover={{ scale: 1.05 }}
                  className="w-full xl:w-auto px-16 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-100 transition-all shadow-2xl active:scale-95 text-lg"
                >
                  {text.finishBtn}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Sidebar Content (Vocabulary) */}
          <div className="md:col-span-2 xl:col-span-1 space-y-10">
            <motion.div 
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-700 to-indigo-700 p-8 md:p-10 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/10"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 text-[180px] -mr-16 -mt-16 rotate-12 transition-transform group-hover:rotate-0 pointer-events-none">🔖</div>
              <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-white relative">
                {text.powerWords}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5 relative">
                {lesson.vocabulary.map((v, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ x: 10 }}
                    className="p-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg"
                  >
                    <p className="font-black text-white text-xl leading-tight mb-1">{v.word}</p>
                    <p className="text-blue-100/70 text-sm font-bold italic mb-4">"{v.translation}"</p>
                    <p className="text-white/80 text-xs font-medium leading-relaxed bg-black/20 p-3 rounded-lg">{v.example}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 shadow-2xl text-center backdrop-blur-sm"
            >
              <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 mx-auto mb-8 flex items-center justify-center text-5xl shadow-inner">💡</div>
              <p className="text-slate-100 font-black mb-4 text-xl tracking-tight">{text.proTipTitle}</p>
              <p className="text-slate-400 text-base leading-relaxed font-medium">
                {text.proTipText}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LessonGenerator;
