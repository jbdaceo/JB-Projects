
import React, { useState, useEffect, useRef } from 'react';
import { generateLesson, generateEncouragingFact } from '../services/gemini';
import { Lesson, Language, SavedLesson } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import confetti from 'https://esm.sh/canvas-confetti@1.9.2';

interface LessonGeneratorProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

interface FlyingParticle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  icon: string;
}

const PERSONAL_QUESTIONS_POOL = [
  { id: 'color', es: 'Color favorito', en: 'Favorite Color' },
  { id: 'musician', es: 'Músico favorito', en: 'Favorite Musician' },
  { id: 'movie', es: 'Película favorita', en: 'Favorite Movie' },
  { id: 'food', es: 'Comida favorita', en: 'Favorite Food' },
  { id: 'hobby', es: 'Pasatiempo favorito', en: 'Favorite Hobby' },
  { id: 'dream_job', es: 'Trabajo soñado', en: 'Dream Job' },
  { id: 'vacation', es: 'Lugar de vacaciones soñado', en: 'Dream Vacation Spot' },
  { id: 'superpower', es: 'Superpoder deseado', en: 'Desired Superpower' },
  { id: 'animal', es: 'Animal favorito', en: 'Favorite Animal' },
  { id: 'season', es: 'Estación del año favorita', en: 'Favorite Season' },
  { id: 'book', es: 'Libro favorito', en: 'Favorite Book' },
  { id: 'sport', es: 'Deporte favorito', en: 'Favorite Sport' },
  { id: 'hero', es: 'Héroe o ídolo', en: 'Hero or Idol' },
  { id: 'morning_night', es: '¿Mañana o Noche?', en: 'Morning or Night Person?' },
  { id: 'fear', es: 'Mayor miedo', en: 'Biggest Fear' },
  { id: 'talent', es: 'Talento oculto', en: 'Hidden Talent' },
  { id: 'coffee_tea', es: '¿Café o Té?', en: 'Coffee or Tea?' },
  { id: 'weekend', es: 'Actividad de fin de semana', en: 'Weekend Activity' },
  { id: 'lang_goal', es: 'Meta con el inglés', en: 'English Goal' },
  { id: 'pet_peeve', es: 'Lo que más te molesta', en: 'Pet Peeve' }
];

const LessonGenerator: React.FC<LessonGeneratorProps> = ({ lang, userTier = 'Novice' }) => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [masteryLevel, setMasteryLevel] = useState(1);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Quiz State
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeQuestionIndices, setActiveQuestionIndices] = useState<number[]>([]);
  const [missedIndices, setMissedIndices] = useState<number[]>([]);
  
  const [viewMode, setViewMode] = useState<'deep' | 'quick'>('quick');
  const [inputError, setInputError] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [progressFill, setProgressFill] = useState(0); 
  
  // Interstitial States (Personal Interaction & Upsell)
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [personalQStep, setPersonalQStep] = useState<'ask' | 'response'>('ask');
  const [personalCategory, setPersonalCategory] = useState('');
  const [personalAnswer, setPersonalAnswer] = useState('');
  const [aiPersonalResponse, setAiPersonalResponse] = useState<{text: string, fact: string} | null>(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  
  // Animation State
  const [flyingParticles, setFlyingParticles] = useState<FlyingParticle[]>([]);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tmc_mastery_level');
    if (saved) setMasteryLevel(parseInt(saved));
    
    const history = localStorage.getItem('tmc_saved_lessons');
    if (history) {
      try {
        setSavedLessons(JSON.parse(history));
      } catch (e) { console.error("Error loading history", e); }
    }

    const usedQuestions = localStorage.getItem('tmc_used_personal_questions');
    if (usedQuestions) {
      try {
        setUsedQuestionIds(JSON.parse(usedQuestions));
      } catch (e) { console.error("Error loading used questions", e); }
    }
    
    successAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); 
  }, []);

  const text = {
    title: lang === 'es' ? 'Maestría 4-12 Pro' : 'Mastery 4-12 Pro',
    subtitle: lang === 'es' ? 'Currículo de Grado 4 a 12 adaptado para Negocios, Viajes y Redes.' : 'Grade 4-12 curriculum adapted for Business, Travel & Social Media.',
    quickMission: lang === 'es' ? 'Misión Rápida' : 'Quick Mission',
    deepDive: lang === 'es' ? 'Deep Dive' : 'Deep Dive',
    topicLabel: lang === 'es' ? 'Tu Objetivo Global' : 'Your Global Goal',
    topicPlaceholder: lang === 'es' ? 'Ej: Viaje a Miami, Pitch de Negocios, Ganar Seguidores...' : 'Ex: Trip to Miami, Business Pitch, Gaining Followers...',
    levelLabel: lang === 'es' ? 'Nivel de Maestría' : 'Mastery Level',
    lvl: lang === 'es' ? 'Nvl' : 'Lvl',
    generateBtn: lang === 'es' ? 'Generar Clase' : 'Generate Lesson',
    preparingBtn: lang === 'es' ? 'Diseñando Estrategia...' : 'Designing Strategy...',
    loadingTitle: lang === 'es' ? 'El Profe Tomas está traduciendo tu mundo...' : 'Professor Tomas is translating your world...',
    loadingQuote: lang === 'es' ? '"De Colombia para el mundo. Aprende lo que realmente sirve."' : '"From Colombia to the world. Learn what actually works."',
    missionObjectives: lang === 'es' ? 'Objetivos de la Misión' : 'Mission Objectives',
    viewFull: lang === 'es' ? 'Ver explicación completa →' : 'View full explanation →',
    challengeTitle: lang === 'es' ? 'Desafío Real' : 'Real Challenge',
    score: lang === 'es' ? 'Puntaje' : 'Score',
    finishBtn: lang === 'es' ? 'Validar Respuestas' : 'Validate Answers',
    retryBtn: lang === 'es' ? 'Repetir Errores' : 'Retry Missed',
    retryMsg: lang === 'es' ? '¡Casi! Repitamos las que fallaste para dominar el tema.' : 'Almost! Let\'s retry the ones you missed to master this.',
    powerWords: lang === 'es' ? 'Vocabulario de Alto Valor' : 'High Value Vocabulary',
    proTipTitle: lang === 'es' ? 'Consejo de Profe Tomas' : 'Pro Tip from Tomas',
    proTipText: lang === 'es' ? '"En Estados Unidos no dices \'Me regalas\', dices \'Can I have\'. Pequeños cambios, grandes resultados."' : '"In the US you don\'t say \'Me regalas\', you say \'Can I have\'. Small changes, big results."',
    validationMsg: lang === 'es' ? 'Por favor ingresa un tema (Ej: Viajes, Negocios).' : 'Please enter a topic (Ex: Travel, Business).',
    levelUp: lang === 'es' ? '¡NIVEL COMPLETADO!' : 'LEVEL COMPLETED!',
    nowLevel: lang === 'es' ? 'Ahora eres Nivel' : 'You are now Level',
    nextLevelBtn: lang === 'es' ? 'Continuar' : 'Continue',
    nextLevelDesc: lang === 'es' ? 'Nuevos retos, vocabulario más avanzado.' : 'New challenges, advanced vocabulary.',
    historyBtn: lang === 'es' ? 'Clase Guardada' : 'Saved Class',
    noHistory: lang === 'es' ? 'No hay clase guardada.' : 'No saved class.',
    loadBtn: lang === 'es' ? 'Continuar' : 'Resume',
    personalTitle: lang === 'es' ? 'Conociéndote mejor...' : 'Getting to know you...',
    personalSub: lang === 'es' ? 'Para personalizar tu camino.' : 'To personalize your journey.',
    submit: lang === 'es' ? 'Enviar' : 'Submit',
    upsellTitle: lang === 'es' ? '¡Estás volando!' : 'You are flying!',
    upsellBody: lang === 'es' ? 'Llevas 5 niveles seguidos. Imagina lo que lograrías con clases privadas 1 a 1.' : 'You passed 5 levels in a row. Imagine what you could achieve with 1-on-1 private coaching.',
    upsellCta: lang === 'es' ? 'Ver Tutorías' : 'View Coaching',
    upsellSkip: lang === 'es' ? 'Quizás luego' : 'Maybe later',
    proRequired: lang === 'es' ? 'Requiere Nivel Pro' : 'Pro Level Required',
    collegiate: lang === 'es' ? 'Nivel Universitario' : 'Collegiate Level'
  };

  const changeLevel = (delta: number) => {
    setMasteryLevel(prev => {
      const newVal = Math.max(1, Math.min(120, prev + delta));
      localStorage.setItem('tmc_mastery_level', newVal.toString());
      return newVal;
    });
  };

  const handleGenerate = async (levelOverride?: number) => {
    if (!topic.trim()) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setLoading(true);
    setLesson(null);
    setQuizScore(null);
    setUserAnswers({});
    setActiveQuestionIndices([]);
    setMissedIndices([]);
    setShowLevelUp(false);
    setProgressFill(0);

    const levelToUse = levelOverride || masteryLevel;

    try {
      const result = await generateLesson(topic, levelToUse, lang, userTier);
      
      // Auto-save lesson to history - KEEP ONLY ONE TOPIC (THE LATEST)
      const newSavedLesson: SavedLesson = { 
        ...result, 
        id: Date.now().toString(), 
        dateSaved: Date.now(),
        numericLevel: levelToUse
      };
      // Overwrite history with only the new lesson
      const updatedHistory = [newSavedLesson];
      
      setSavedLessons(updatedHistory);
      localStorage.setItem('tmc_saved_lessons', JSON.stringify(updatedHistory));

      setLesson(result);
      setActiveQuestionIndices(result.quiz.map((_, i) => i));
      setViewMode('quick');
    } catch (error) {
      console.error(error);
      alert(lang === 'es' ? 'Hubo un error al preparar tu clase. Intentémoslo de nuevo.' : 'There was an error preparing your lesson. Let\'s try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = (saved: SavedLesson) => {
    setTopic(saved.topic);
    setLesson(saved);
    setMasteryLevel(saved.numericLevel || 1);
    setQuizScore(null);
    setUserAnswers({});
    setActiveQuestionIndices(saved.quiz.map((_, i) => i));
    setMissedIndices([]);
    setShowLevelUp(false);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkQuiz = () => {
    if (!lesson) return;
    
    let roundScore = 0;
    const currentMissed: number[] = [];

    activeQuestionIndices.forEach((questionIndex) => {
      const q = lesson.quiz[questionIndex];
      if (userAnswers[questionIndex] === q.answer) {
        roundScore++;
      } else {
        currentMissed.push(questionIndex);
      }
    });

    setQuizScore(roundScore);
    setMissedIndices(currentMissed);

    if (roundScore === activeQuestionIndices.length) {
      setProgressFill(100);
      triggerMoneyRain();
      triggerFireworks();
      setShowLevelUp(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        triggerFlyingParticles();
        const nextLevel = masteryLevel + 1;
        setMasteryLevel(nextLevel);
        localStorage.setItem('tmc_mastery_level', nextLevel.toString());
        setTimeout(() => setProgressFill(0), 500);
      }, 1500);
    }
  };

  const startPersonalInteraction = () => {
    setShowLevelUp(false);
    
    // Filter available questions (not in usedQuestionIds)
    const availableQuestions = PERSONAL_QUESTIONS_POOL.filter(q => !usedQuestionIds.includes(q.id));
    
    let selectedQ;
    let newUsedIds = [...usedQuestionIds];

    if (availableQuestions.length === 0) {
      // If pool exhausted, pick random and reset used list (except current one to avoid immediate repeat if possible)
      // Or just clear the list and start fresh.
      const freshStart = PERSONAL_QUESTIONS_POOL;
      selectedQ = freshStart[Math.floor(Math.random() * freshStart.length)];
      newUsedIds = [selectedQ.id];
    } else {
      selectedQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      newUsedIds.push(selectedQ.id);
    }

    // Save persistence
    setUsedQuestionIds(newUsedIds);
    localStorage.setItem('tmc_used_personal_questions', JSON.stringify(newUsedIds));

    // Set UI state
    setPersonalCategory(lang === 'es' ? selectedQ.es : selectedQ.en);
    setPersonalQStep('ask');
    setPersonalAnswer('');
    setShowPersonalModal(true);
  };

  const submitPersonalAnswer = async () => {
    if (!personalAnswer.trim()) return;
    setIsAiResponding(true);
    try {
      const response = await generateEncouragingFact(personalCategory, personalAnswer, lang);
      setAiPersonalResponse(response);
      setPersonalQStep('response');
    } catch (e) {
      console.error(e);
      // Skip if error
      finishPersonalInteraction();
    } finally {
      setIsAiResponding(false);
    }
  };

  const finishPersonalInteraction = () => {
    setShowPersonalModal(false);
    setAiPersonalResponse(null);
    
    // Check for Upsell every 5 levels
    if (masteryLevel > 1 && masteryLevel % 5 === 0) {
      setShowUpsellModal(true);
    } else {
      handleGenerate(masteryLevel);
    }
  };

  const handleRetry = () => {
    setActiveQuestionIndices(missedIndices);
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      missedIndices.forEach(idx => delete newAnswers[idx]);
      return newAnswers;
    });
    setQuizScore(null);
    setMissedIndices([]);
    const quizElement = document.getElementById('quiz-area');
    if(quizElement) quizElement.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerFireworks = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const triggerMoneyRain = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22c55e', '#15803d', '#bbf7d0'], shapes: ['square'], scalar: 1.2 });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#facc15', '#ca8a04'], shapes: ['circle'], scalar: 1.2 });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const triggerFlyingParticles = () => {
    const isMobile = window.innerWidth < 1024;
    const targetId = isMobile ? 'mobile-level-badge' : 'sidebar-level-badge';
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const particles: FlyingParticle[] = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: Date.now() + i,
        x: startX + (Math.random() * 100 - 50),
        y: startY + (Math.random() * 100 - 50),
        targetX: targetX,
        targetY: targetY,
        icon: Math.random() > 0.5 ? '💸' : '⭐'
      });
    }
    setFlyingParticles(particles);
    setTimeout(() => {
      window.dispatchEvent(new Event('tmc-xp-gain'));
      setFlyingParticles([]);
    }, 1000); 
  };

  return (
    <div className="space-y-10 pb-24 relative">
      {/* Particle Effects */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {flyingParticles.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
              animate={{ x: p.targetX, y: p.targetY, scale: [1.5, 0.5], opacity: [1, 1, 0] }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: "easeInOut" }}
              className="absolute text-4xl"
            >
              {p.icon}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
             <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, y: 50 }} className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 rounded-[48px] shadow-2xl border-4 border-yellow-400 text-center relative overflow-hidden max-w-lg w-full">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <motion.h2 animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm mb-4">{text.levelUp}</motion.h2>
                <div className="flex justify-center my-6">
                   <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-yellow-400 flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(250,204,21,0.4)]">⭐</div>
                      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="absolute -bottom-2 -right-2 bg-green-500 text-white font-black px-4 py-1 rounded-full text-lg shadow-lg">+XP</motion.div>
                   </div>
                </div>
                <p className="text-white/90 text-xl font-bold uppercase tracking-widest mb-2">{text.nowLevel}</p>
                <p className="text-6xl font-black text-white mb-8">{masteryLevel}</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startPersonalInteraction} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white text-xl font-black rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all relative overflow-hidden group">
                  <span className="relative z-10">{text.nextLevelBtn} →</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </motion.button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal Question Modal */}
      <AnimatePresence>
        {showPersonalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl">
              {personalQStep === 'ask' ? (
                <>
                   <h3 className="text-2xl font-black text-white mb-2">{text.personalTitle}</h3>
                   <p className="text-slate-400 text-sm mb-6">{text.personalSub}</p>
                   <p className="text-xl text-brand-300 font-bold mb-4">{lang === 'es' ? '¿Cuál es tu' : 'What is your'} {personalCategory}?</p>
                   <input 
                     type="text" 
                     value={personalAnswer} 
                     onChange={e => setPersonalAnswer(e.target.value)} 
                     onKeyDown={e => { if (e.key === 'Enter') submitPersonalAnswer(); }}
                     className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white mb-6 outline-none focus:border-brand-500" 
                     autoFocus 
                   />
                   <button onClick={submitPersonalAnswer} disabled={isAiResponding} className="w-full py-4 bg-brand-600 text-white rounded-xl font-black shadow-lg">
                      {isAiResponding ? '...' : text.submit}
                   </button>
                </>
              ) : (
                <>
                   <div className="w-16 h-16 rounded-full bg-brand-600/20 flex items-center justify-center text-3xl mb-4">🤖</div>
                   <h3 className="text-xl font-black text-white mb-4">"{aiPersonalResponse?.text}"</h3>
                   <div className="bg-white/5 p-4 rounded-xl border-l-4 border-brand-500 mb-6">
                      <p className="text-slate-300 italic text-sm">{aiPersonalResponse?.fact}</p>
                   </div>
                   <button onClick={finishPersonalInteraction} className="w-full py-4 bg-white text-slate-900 rounded-xl font-black shadow-lg">
                      {text.nextLevelBtn}
                   </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upsell Modal */}
      <AnimatePresence>
        {showUpsellModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-blue-900/90 backdrop-blur-md p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white text-slate-900 rounded-[40px] p-8 max-w-md w-full shadow-2xl text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-3xl font-black text-slate-900 mb-2">{text.upsellTitle}</h3>
              <p className="text-slate-600 text-lg mb-8 font-medium">{text.upsellBody}</p>
              <button onClick={() => { setShowUpsellModal(false); /* Ideally navigate to Coaching */ }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl mb-3">
                {text.upsellCta}
              </button>
              <button onClick={() => { setShowUpsellModal(false); handleGenerate(masteryLevel); }} className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                {text.upsellSkip}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-white/10 z-[50] shadow-2xl p-6 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-black text-white">{text.historyBtn}</h3>
               <button onClick={() => setShowHistory(false)} className="w-8 h-8 bg-white/10 rounded-full text-slate-400">✕</button>
             </div>
             <div className="space-y-4">
               {savedLessons.length === 0 ? (
                 <p className="text-slate-500">{text.noHistory}</p>
               ) : (
                 savedLessons.map(sl => (
                   <div key={sl.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                     <p className="font-bold text-white mb-1">{sl.topic}</p>
                     <p className="text-xs text-slate-400 mb-3">{sl.level}</p>
                     <button onClick={() => loadLesson(sl)} className="px-4 py-2 bg-brand-600 text-white text-xs font-black rounded-lg w-full">
                       {text.loadBtn}
                     </button>
                   </div>
                 ))
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h2 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            {text.title}
          </motion.h2>
          <p className="text-slate-400 mt-2 text-lg">{text.subtitle}</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(true)} className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:text-white border border-white/5">
            {text.historyBtn}
          </button>
          {lesson && (
            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
              <button onClick={() => setViewMode('quick')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'quick' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                {text.quickMission}
              </button>
              <button onClick={() => setViewMode('deep')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${viewMode === 'deep' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                {text.deepDive}
              </button>
            </div>
          )}
        </div>
      </header>

      <motion.div layout className="bg-slate-900/40 p-8 md:p-10 rounded-[40px] border border-slate-800 shadow-2xl flex flex-col xl:flex-row gap-8 items-end backdrop-blur-md relative overflow-hidden">
        <div className="flex-1 space-y-3 w-full relative z-10">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">{text.topicLabel} <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder={text.topicPlaceholder}
            className={`w-full px-8 py-5 bg-slate-950 border rounded-2xl text-white outline-none transition-all placeholder:text-slate-600 text-lg shadow-inner ${inputError ? 'border-red-500 focus:ring-4 focus:ring-red-500/20 animate-pulse' : 'border-slate-700/50 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'}`}
            value={topic}
            onChange={(e) => { 
                setTopic(e.target.value); 
                setMasteryLevel(1); // Reset level on manual edit
                if (e.target.value.trim()) setInputError(false); 
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
          />
        </div>
        
        <div className="w-full xl:w-56 space-y-3 relative z-10">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">{text.levelLabel}</label>
          <div className="w-full h-[72px] bg-slate-950 border border-slate-700/50 rounded-2xl relative overflow-hidden shadow-inner flex items-center px-2">
             {/* Collegiate Logic */}
             {masteryLevel > 90 && userTier !== 'Pro' ? (
                <div className="w-full flex flex-col items-center justify-center opacity-50">
                   <span className="text-2xl">🔒</span>
                   <span className="text-[8px] uppercase font-bold text-slate-400">{text.proRequired}</span>
                </div>
             ) : (
                 <>
                   <motion.div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-500/40" initial={{ width: "0%" }} animate={{ width: `${progressFill}%` }} transition={{ duration: 0.8, ease: "circOut" }} />
                   
                   <div className="absolute inset-0 flex items-center justify-between px-3 z-20">
                      <button 
                        onClick={() => changeLevel(-1)} 
                        disabled={masteryLevel <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors font-bold text-lg"
                      >
                        -
                      </button>
                      
                      <div className="flex flex-col items-center relative z-10">
                        <span className="font-bold text-[8px] text-slate-400 uppercase tracking-widest">{text.lvl}</span>
                        <motion.span key={masteryLevel} initial={{ scale: 1.5, color: '#facc15' }} animate={{ scale: 1, color: '#facc15' }} className="font-black text-2xl text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                            {masteryLevel > 90 ? '🏆' : masteryLevel}
                        </motion.span>
                      </div>

                      <button 
                        onClick={() => changeLevel(1)} 
                        disabled={masteryLevel >= 120}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors font-bold text-lg"
                      >
                        +
                      </button>
                   </div>
                 </>
             )}
          </div>
        </div>

        <motion.button 
          onClick={() => handleGenerate()}
          disabled={loading}
          whileHover={{ scale: 1.02, backgroundColor: '#3b82f6' }}
          whileTap={{ scale: 0.98 }}
          className="w-full xl:w-auto px-12 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all text-lg active:scale-95 relative z-10"
        >
          {loading ? text.preparingBtn : text.generateBtn}
        </motion.button>
      </motion.div>

      {/* Existing Lesson Render Logic */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-40 space-y-10 bg-slate-900/20 rounded-[40px] border border-slate-800/40 backdrop-blur-xl">
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
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
          <div className="md:col-span-2 space-y-10">
            <div className="bg-slate-900/40 p-8 md:p-14 rounded-[40px] border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewMode === 'quick' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                  {viewMode === 'quick' ? `⚡ ${text.quickMission}` : `📖 ${text.deepDive}`}
                 </span>
                 <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400">
                    {lesson.level}
                 </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-10 tracking-tight leading-tight">{lesson.title}</h3>
              
              <AnimatePresence mode="wait">
                {viewMode === 'quick' ? (
                  <motion.div key="quick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                      <p className="text-blue-400 font-black uppercase tracking-widest text-xs mb-6">{text.missionObjectives}</p>
                      <div className="prose prose-invert max-w-none text-slate-300 text-xl font-medium leading-relaxed whitespace-pre-wrap">{lesson.summary}</div>
                    </div>
                    <button onClick={() => setViewMode('deep')} className="text-blue-400 text-sm font-black hover:underline underline-offset-4">{text.viewFull}</button>
                  </motion.div>
                ) : (
                  <motion.div key="deep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap text-lg md:text-xl font-medium">{lesson.content}</motion.div>
                )}
              </AnimatePresence>
            </div>

            <div id="quiz-area" className="bg-slate-900/40 p-8 md:p-14 rounded-[40px] border border-slate-800 shadow-2xl backdrop-blur-sm relative overflow-hidden">
               {quizScore === activeQuestionIndices.length && activeQuestionIndices.length > 0 && <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl rotate-12 select-none">💸</div>}
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-white relative z-10">
                <span className="p-3 bg-blue-600/20 rounded-2xl text-blue-400 shadow-inner">📝</span> {text.challengeTitle}
              </h3>
              <div className="space-y-12 relative z-10">
                {activeQuestionIndices.map((qIdx, mapIdx) => {
                  const q = lesson.quiz[qIdx];
                  const isRetryRound = activeQuestionIndices.length < lesson.quiz.length;
                  return (
                    <motion.div key={qIdx} className="space-y-6" initial={isRetryRound ? { opacity: 0, x: -20 } : {}} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-sm">{qIdx + 1}</span>
                        <p className="font-black text-xl md:text-2xl text-slate-100 tracking-tight">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {q.options.map((opt) => (
                          <motion.button
                            key={opt}
                            onClick={() => !quizScore && setUserAnswers({ ...userAnswers, [qIdx]: opt })}
                            whileHover={{ scale: 1.02, backgroundColor: userAnswers[qIdx] === opt ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 41, 59, 0.6)' }}
                            whileTap={{ scale: 0.98 }}
                            disabled={quizScore !== null}
                            className={`p-6 rounded-2xl border-2 text-left transition-all text-base font-bold shadow-lg ${userAnswers[qIdx] === opt ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-600'} ${quizScore !== null && opt === q.answer ? 'border-green-500 text-green-400 bg-green-500/10' : ''} ${quizScore !== null && userAnswers[qIdx] === opt && opt !== q.answer ? 'border-red-500 text-red-400 bg-red-500/10' : ''}`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-16 flex flex-col xl:flex-row items-center justify-between pt-10 border-t border-slate-800 gap-8 relative z-10">
                {quizScore !== null ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-5 bg-slate-800/60 px-8 py-4 rounded-2xl border border-slate-700 shadow-xl w-full xl:w-auto">
                    <p className="text-xl font-black text-white tracking-tight">{text.score}: {quizScore}/{activeQuestionIndices.length}</p>
                    <span className="text-4xl">{quizScore === activeQuestionIndices.length ? '👑' : '💪'}</span>
                  </motion.div>
                ) : <div />}
                
                {quizScore !== null && quizScore < activeQuestionIndices.length ? (
                  <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
                    <p className="text-orange-400 font-bold text-sm">{text.retryMsg}</p>
                    <motion.button onClick={handleRetry} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full xl:w-auto px-16 py-5 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 transition-all text-lg">{text.retryBtn} ↺</motion.button>
                  </div>
                ) : quizScore === activeQuestionIndices.length && activeQuestionIndices.length > 0 ? (
                   <motion.button onClick={() => setShowLevelUp(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full xl:w-auto px-16 py-5 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black rounded-2xl shadow-xl shadow-yellow-400/20 transition-all text-lg">{text.nextLevelBtn} →</motion.button>
                ) : (
                  <motion.button onClick={checkQuiz} whileHover={{ scale: 1.05 }} disabled={quizScore !== null} className="w-full xl:w-auto px-16 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-100 transition-all shadow-2xl active:scale-95 text-lg disabled:opacity-50 disabled:active:scale-100">{text.finishBtn}</motion.button>
                )}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 xl:col-span-1 space-y-10">
            <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-700 to-indigo-700 p-8 md:p-10 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/10">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-[180px] -mr-16 -mt-16 rotate-12 transition-transform group-hover:rotate-0 pointer-events-none">🔖</div>
              <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-white relative">{text.powerWords}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5 relative">
                {lesson.vocabulary.map((v, idx) => (
                  <motion.div key={idx} whileHover={{ x: 10 }} className="p-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
                    <p className="font-black text-white text-xl leading-tight mb-1">{v.word}</p>
                    <p className="text-blue-100/70 text-sm font-bold italic mb-4">"{v.translation}"</p>
                    <p className="text-white/80 text-xs font-medium leading-relaxed bg-black/20 p-3 rounded-lg">{v.example}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LessonGenerator;
