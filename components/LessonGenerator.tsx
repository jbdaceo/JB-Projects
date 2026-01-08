
import React, { useState, useEffect } from 'react';
import { generateLesson, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { SavedLesson, Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BookOpen, Star, CheckCircle, PenTool, Lightbulb, Globe, AlertTriangle, MessageCircle, Music, Coffee, Plane, Briefcase, Smile, Zap, Plus, ArrowLeft, ArrowRight, Volume2, RotateCcw, Award, Rocket, X } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { triggerHaptic } from '../utils/performance';

interface LessonGeneratorProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

const LessonGenerator: React.FC<LessonGeneratorProps> = ({ lang, userTier = 'Novice' }) => {
  const [viewState, setViewState] = useState<'dashboard' | 'create' | 'lesson'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<number>(10);
  
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<SavedLesson | null>(null);
  const [viewMode, setViewMode] = useState<'study' | 'quiz'>('study');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  // Quiz State
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);
  const [questionsToRetry, setQuestionsToRetry] = useState<number[]>([]);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem('tmc_saved_lessons');
    if (history) {
        try { 
            const parsed = JSON.parse(history);
            // Only load lessons that are NOT completed (in-progress only)
            const activeOnly = parsed.filter((l: SavedLesson) => !l.completed);
            setSavedLessons(activeOnly); 
        } catch (e) {}
    }
    
    // Load persisted difficulty
    const savedDifficulty = localStorage.getItem('tmc_lesson_difficulty');
    if (savedDifficulty) {
        setDifficulty(parseInt(savedDifficulty, 10));
    }

    // Check Tutorial Status
    const seenTutorial = localStorage.getItem('tmc_lesson_tutorial_seen');
    if (!seenTutorial) {
        setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
      localStorage.setItem('tmc_lesson_tutorial_seen', 'true');
      setShowTutorial(false);
  };

  const getTopics = (l: Language) => [
    { id: 'travel', label: l === 'es' ? 'Viajes' : 'Travel', icon: Plane, bg: 'bg-sky-500' },
    { id: 'business', label: l === 'es' ? 'Negocios' : 'Business', icon: Briefcase, bg: 'bg-slate-600' },
    { id: 'food', label: l === 'es' ? 'Comida' : 'Food', icon: Coffee, bg: 'bg-orange-500' },
    { id: 'social', label: l === 'es' ? 'Social' : 'Social', icon: Smile, bg: 'bg-pink-500' },
    { id: 'tech', label: l === 'es' ? 'Tecnología' : 'Tech', icon: Zap, bg: 'bg-blue-600' },
  ];

  const topics = getTopics(lang);

  const playAudio = async (text: string) => {
      if (speakingText) return;
      setSpeakingText(text);
      try {
          const base64 = await getPronunciation(text);
          if (base64) {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
              const buffer = await decodeAudioData(decodeBase64Audio(base64), audioCtx);
              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              source.start();
              source.onended = () => setSpeakingText(null);
          } else {
              setSpeakingText(null);
          }
      } catch (e) {
          console.error(e);
          setSpeakingText(null);
      }
  };

  const handleGenerate = async () => {
    const finalTopic = customTopic.trim() || selectedTopic;
    if (!finalTopic) return;
    
    setLoading(true);
    try {
      const result = await generateLesson(finalTopic, difficulty, lang, userTier as any);
      const newLesson: SavedLesson = {
        ...result,
        id: Date.now().toString(),
        dateSaved: Date.now(),
        numericLevel: difficulty,
        progress: 0,
        completed: false
      };
      
      const updated = [newLesson, ...savedLessons];
      setSavedLessons(updated);
      localStorage.setItem('tmc_saved_lessons', JSON.stringify(updated));
      setActiveLesson(newLesson);
      
      // Reset quiz state
      setQuizAnswers({});
      setQuizSubmitted(false);
      setRetryMode(false);
      setWrongIndices([]);
      setQuestionsToRetry([]);
      setViewState('lesson');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerMoneyRain = () => {
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors: ['#FFD700', '#DAA520', '#10B981'], // Gold and Green
        shapes: ['square'],
        scalar: 2
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors: ['#FFD700', '#DAA520', '#10B981'],
        shapes: ['square'],
        scalar: 2
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleSubmitQuiz = () => {
    if (!activeLesson) return;
    
    const wrongs: number[] = [];
    activeLesson.quiz.forEach((q, idx) => {
        // Skip indices that aren't part of the current retry set if we are in retry mode
        if (retryMode && !questionsToRetry.includes(idx)) return;

        const userAnswer = quizAnswers[idx];
        if (userAnswer !== q.answer) {
            wrongs.push(idx);
        }
    });

    setWrongIndices(wrongs);
    setQuizSubmitted(true);
    triggerHaptic(wrongs.length === 0 ? 'success' : 'medium');
    
    if (wrongs.length === 0) {
        triggerMoneyRain();
    }
  };

  const handleRetryMissed = () => {
      setQuestionsToRetry([...wrongIndices]); // Snapshot wrongs for retry mode
      setRetryMode(true);
      setQuizSubmitted(false);
      // Clear wrong ones to force re-selection
      const newAnswers = { ...quizAnswers };
      wrongIndices.forEach(idx => delete newAnswers[idx]);
      setQuizAnswers(newAnswers);
  };

  const handleNextLevel = async () => {
    if (!activeLesson) return;

    // 1. Remove current completed lesson from list (Do not save completed ones)
    const lessonsWithoutCurrent = savedLessons.filter(l => l.id !== activeLesson.id);
    
    // 2. Increase Level stats
    const currentScore = parseInt(localStorage.getItem('tmc_mastery_level') || '1');
    localStorage.setItem('tmc_mastery_level', (currentScore + 1).toString());
    window.dispatchEvent(new Event('tmc-level-update'));

    // 3. Increase Difficulty
    const newDifficulty = Math.min(100, difficulty + 1);
    setDifficulty(newDifficulty);
    localStorage.setItem('tmc_lesson_difficulty', newDifficulty.toString());

    // 4. Generate Next Lesson (Cycle)
    const nextTopic = activeLesson.topic;
    
    setLoading(true);
    try {
        // Scroll to top
        const main = document.querySelector('main');
        if(main) main.scrollTo({ top: 0, behavior: 'smooth' });

        const result = await generateLesson(nextTopic, newDifficulty, lang, userTier as any);
        const newLesson: SavedLesson = {
            ...result,
            id: Date.now().toString(),
            dateSaved: Date.now(),
            numericLevel: newDifficulty,
            progress: 0,
            completed: false
        };
        
        // Add new lesson to the list (old one is gone)
        const newHistory = [newLesson, ...lessonsWithoutCurrent];
        setSavedLessons(newHistory);
        localStorage.setItem('tmc_saved_lessons', JSON.stringify(newHistory));
        
        setActiveLesson(newLesson);
        
        // Reset UI
        setQuizAnswers({});
        setQuizSubmitted(false);
        setRetryMode(false);
        setWrongIndices([]);
        setQuestionsToRetry([]);
        setViewMode('study'); // Back to study mode for the new lesson
        
    } catch(e) {
        console.error(e);
        // If error, just go back to dashboard, ensuring old one is removed if we consider it done
        setSavedLessons(lessonsWithoutCurrent);
        localStorage.setItem('tmc_saved_lessons', JSON.stringify(lessonsWithoutCurrent));
        setViewState('dashboard');
    } finally {
        setLoading(false);
    }
  };

  const handleFinishLesson = () => {
      // Manual exit to dashboard
      setViewState('dashboard');
      setActiveLesson(null);
      setQuizAnswers({});
      setViewMode('study');
      setQuizSubmitted(false);
      setRetryMode(false);
      setWrongIndices([]);
      setQuestionsToRetry([]);
  };

  const text = {
    myLessons: lang === 'es' ? 'Mis Lecciones' : 'My Lessons',
    inProgress: lang === 'es' ? 'lecciones en progreso' : 'lessons in progress',
    noActive: lang === 'es' ? 'No hay lecciones activas.' : 'No active lessons.',
    create: lang === 'es' ? 'Crear Nueva' : 'Create New',
    pickTopic: lang === 'es' ? 'Elige un Tema' : 'Pick a Topic',
    customPlaceholder: lang === 'es' ? 'O escribe el tuyo...' : 'Or type your own...',
    level: lang === 'es' ? 'Nivel de Dificultad' : 'Difficulty Level',
    generate: lang === 'es' ? 'Generar Clase' : 'Generate Class',
    generating: lang === 'es' ? 'El Profesor está escribiendo...' : 'Professor is writing...',
    readyForQuiz: lang === 'es' ? '¿Listo para el Quiz?' : 'Ready for Quiz?',
    submit: lang === 'es' ? 'Enviar Respuestas' : 'Submit Answers',
    results: lang === 'es' ? 'Resultados' : 'Results',
    correct: lang === 'es' ? 'Correcto' : 'Correct',
    wrong: lang === 'es' ? 'Incorrecto' : 'Wrong',
    retry: lang === 'es' ? 'Reintentar Fallidas' : 'Retry Missed',
    nextLevel: lang === 'es' ? 'Siguiente Nivel' : 'Next Level',
    finish: lang === 'es' ? 'Salir' : 'Exit',
    secondChance: lang === 'es' ? 'Segunda Oportunidad' : 'Second Opportunity',
    previouslyFailed: lang === 'es' ? 'Preguntas falladas previamente' : 'Previously failed questions',
    explanation: lang === 'es' ? 'Explicación' : 'Explanation',
    correctAnswer: lang === 'es' ? 'Respuesta Correcta' : 'Correct Answer',
    yourAnswer: lang === 'es' ? 'Tu Respuesta' : 'Your Answer',
    back: lang === 'es' ? 'Volver' : 'Back',
    beginner: lang === 'es' ? 'Principiante' : 'Beginner',
    native: lang === 'es' ? 'Nativo' : 'Native',
    study: lang === 'es' ? 'Estudiar' : 'Study',
    quiz: lang === 'es' ? 'Prueba' : 'Quiz',
    coreConcept: lang === 'es' ? 'Concepto Clave' : 'Core Concept',
    scenario: lang === 'es' ? 'Escenario' : 'Scenario',
    step1: lang === 'es' ? '1. Elige un Tema' : '1. Choose a Topic',
    step1Desc: lang === 'es' ? 'Selecciona qué quieres aprender hoy.' : 'Select what you want to learn today.',
    step2: lang === 'es' ? '2. Ajusta tu Nivel' : '2. Adjust Your Level',
    step2Desc: lang === 'es' ? 'Desde Principiante (1) hasta Experto (100).' : 'From Beginner (1) to Expert (100).',
    step3: lang === 'es' ? '3. Generar y Aprender' : '3. Generate & Learn',
    step3Desc: lang === 'es' ? 'La IA creará una clase única para ti.' : 'AI will create a unique class for you.',
    tutorialTitle: lang === 'es' ? 'Cómo funciona' : 'How it works',
    gotIt: lang === 'es' ? '¡Entendido!' : 'Got it!',
    lvl: lang === 'es' ? 'Nvl' : 'Lvl',
    statusProg: lang === 'es' ? 'En Progreso' : 'In Progress'
  };

  // --- Renderers ---

  const renderTutorial = () => (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <button onClick={closeTutorial} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button>
              
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                  <Lightbulb className="text-yellow-400" /> {text.tutorialTitle}
              </h3>
              
              <div className="space-y-6">
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black border border-blue-500/20 shrink-0">1</div>
                      <div>
                          <h4 className="font-bold text-white">{text.step1}</h4>
                          <p className="text-slate-400 text-sm">{text.step1Desc}</p>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-black border border-purple-500/20 shrink-0">2</div>
                      <div>
                          <h4 className="font-bold text-white">{text.step2}</h4>
                          <p className="text-slate-400 text-sm">{text.step2Desc}</p>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-black border border-green-500/20 shrink-0">3</div>
                      <div>
                          <h4 className="font-bold text-white">{text.step3}</h4>
                          <p className="text-slate-400 text-sm">{text.step3Desc}</p>
                      </div>
                  </div>
              </div>

              <button 
                onClick={closeTutorial}
                className="w-full mt-8 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                  {text.gotIt}
              </button>
          </motion.div>
      </motion.div>
  );

  const renderDashboard = () => (
    <div className="max-w-5xl mx-auto pt-6 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">{text.myLessons}</h2>
          <p className="text-slate-400 font-medium mt-1">{savedLessons.length} {text.inProgress}</p>
        </div>
        <button 
          onClick={() => setViewState('create')} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} /> {text.create}
        </button>
      </div>

      {savedLessons.length === 0 ? (
        <div className="text-center py-20 opacity-40">
          <BookOpen size={64} className="mx-auto mb-4 text-slate-500" />
          <p className="text-xl font-bold">{text.noActive}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedLessons.map(l => (
            <motion.div 
              key={l.id}
              onClick={() => { 
                  setActiveLesson(l); 
                  setViewState('lesson'); 
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                  setRetryMode(false);
                  setWrongIndices([]);
                  setQuestionsToRetry([]);
              }}
              whileHover={{ y: -5 }}
              className="bg-slate-900 border border-white/5 p-6 rounded-[32px] cursor-pointer hover:border-blue-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400`}>
                  {text.statusProg}
                </span>
                <span className="text-xs font-bold text-slate-500">{text.lvl} {l.numericLevel}</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{l.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">{l.topic}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto pt-6 px-4 flex flex-col min-h-[80vh] justify-center">
      <button onClick={() => setViewState('dashboard')} className="self-start text-slate-500 font-bold mb-8 hover:text-white flex items-center gap-2">
        <ArrowLeft size={18} /> {text.back}
      </button>

      {loading ? (
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">👨‍🏫</div>
          <h3 className="text-2xl font-black text-white animate-pulse">{text.generating}</h3>
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h3 className="text-2xl font-black text-white mb-6 text-center">{text.pickTopic}</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {topics.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTopic(t.label); setCustomTopic(''); }}
                  className={`p-6 rounded-3xl flex flex-col items-center gap-3 transition-all w-32 ${selectedTopic === t.label ? `${t.bg} text-white shadow-xl scale-105` : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                >
                  <t.icon size={32} />
                  <span className="text-xs font-black uppercase tracking-wide">{t.label}</span>
                </button>
              ))}
            </div>
            <input 
              type="text" 
              placeholder={text.customPlaceholder}
              value={customTopic}
              onChange={e => { setCustomTopic(e.target.value); setSelectedTopic(''); }}
              onKeyDown={e => e.key === 'Enter' && (selectedTopic || customTopic) && handleGenerate()}
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 text-white text-center font-bold focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest px-2">
                <span>{text.beginner}</span>
                <span>{text.native}</span>
            </div>
            <input 
              type="range" 
              min="1" max="100" 
              value={difficulty} 
              onChange={e => setDifficulty(parseInt(e.target.value))}
              className="w-full h-4 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <div className="text-center mt-2 font-black text-blue-400 text-xl">
                {difficulty}
                <span className="text-xs text-slate-500 ml-2 uppercase font-bold tracking-wider">
                    {difficulty < 20 ? 'Novice' : difficulty < 60 ? 'Intermediate' : 'Advanced'}
                </span>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!selectedTopic && !customTopic}
            className="w-full py-5 bg-white text-slate-900 font-black rounded-[24px] text-xl uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {text.generate}
          </button>
        </div>
      )}
    </div>
  );

  const renderLesson = () => {
    if (loading) {
       return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-6 animate-bounce">🚀</div>
            <h3 className="text-2xl font-black text-white animate-pulse">{text.generating}</h3>
          </div>
        </div>
       );
    }

    if (!activeLesson) return null;
    const c = activeLesson.content as any;

    return (
      <div className="max-w-3xl mx-auto pb-24 pt-6 px-4">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-950/90 backdrop-blur p-4 z-20 -mx-4 rounded-b-3xl border-b border-white/5 shadow-xl">
          <button onClick={() => setViewState('dashboard')} className="text-slate-400 font-bold hover:text-white"><ArrowLeft /></button>
          <div className="flex bg-slate-900 rounded-full p-1 border border-white/10">
            <button onClick={() => setViewMode('study')} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'study' ? 'bg-white text-black' : 'text-slate-500'}`}>{text.study}</button>
            <button onClick={() => setViewMode('quiz')} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'quiz' ? 'bg-white text-black' : 'text-slate-500'}`}>{text.quiz} ({activeLesson.quiz.length})</button>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white text-center mb-2">{activeLesson.title}</h1>
        <p className="text-center text-slate-500 font-medium mb-12">{activeLesson.topic} • {text.level} {activeLesson.numericLevel}</p>

        <AnimatePresence mode="wait">
          {viewMode === 'study' ? (
            <motion.div key="study" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Concept Card */}
              <div className="bg-slate-900/50 border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-sm group hover:border-yellow-500/30 transition-colors">
                <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500" />
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Lightbulb className="text-yellow-500" /> {text.coreConcept}
                    </h3>
                    <button onClick={() => playAudio(c.concept.en)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-yellow-400 transition-colors">
                        <Volume2 size={20} />
                    </button>
                </div>
                <p className="text-lg text-slate-200 leading-relaxed mb-6">{c.concept.en}</p>
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-slate-400 italic text-sm">{c.concept.es}</p>
                </div>
              </div>

              {/* Scenario Card */}
              <div className="bg-slate-900/50 border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-sm group hover:border-blue-500/30 transition-colors">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <MessageCircle className="text-blue-500" /> {text.scenario}
                    </h3>
                    <button onClick={() => playAudio(c.scenario.en)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-blue-400 transition-colors">
                        <Volume2 size={20} />
                    </button>
                </div>
                <p className="text-lg text-slate-200 leading-relaxed font-serif italic mb-4">"{c.scenario.en}"</p>
                <p className="text-sm text-slate-500 leading-relaxed font-serif italic mt-2">"{c.scenario.es}"</p>
              </div>

              {/* Vocab Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeLesson.vocabulary.map((v, i) => (
                  <div key={i} className="bg-slate-900 p-5 rounded-[24px] border border-white/5 hover:border-white/20 transition-colors flex justify-between items-center group">
                    <div>
                        <p className="font-black text-white text-xl">{v.word}</p>
                        <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mt-1">{v.translation}</p>
                    </div>
                    <button onClick={() => playAudio(v.word)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                        <Volume2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Ready to Quiz Button */}
              <div className="mt-8 text-center pb-8">
                <button 
                  onClick={() => setViewMode('quiz')}
                  className="bg-brand-600 text-white px-10 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto active:scale-95 shadow-brand-500/20"
                >
                  {text.readyForQuiz} <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              
              {/* RESULTS VIEW */}
              {quizSubmitted ? (
                  <div className="space-y-8">
                      <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 text-center">
                          <h2 className="text-3xl font-black text-white mb-2">{text.results}</h2>
                          
                          {/* Score Display */}
                          <div className="text-5xl font-black mb-4">
                              <span className="text-green-400">
                                  {activeLesson.quiz.length - wrongIndices.length}
                              </span>
                              <span className="text-slate-600"> / </span>
                              <span className="text-white">
                                  {activeLesson.quiz.length}
                              </span>
                          </div>

                          <div className="flex justify-center gap-4">
                              {/* Show Retry ONLY if there are wrongs AND we are not already in retry mode */}
                              {wrongIndices.length > 0 && !retryMode ? (
                                  <button onClick={handleRetryMissed} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                                      <RotateCcw size={18} /> {text.retry}
                                  </button>
                              ) : (
                                  // Success or End of Cycle
                                  <button onClick={handleNextLevel} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20">
                                      <Rocket size={18} /> {text.nextLevel}
                                  </button>
                              )}
                              
                              {/* Exit Option */}
                              <button onClick={handleFinishLesson} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                                  <Award size={18} /> {text.finish}
                              </button>
                          </div>
                      </div>

                      <div className="space-y-6">
                          {activeLesson.quiz.map((q, idx) => {
                              if (retryMode && !questionsToRetry.includes(idx)) return null;

                              const isWrong = wrongIndices.includes(idx);
                              const userAnswer = quizAnswers[idx];
                              
                              return (
                                  <div key={idx} className={`p-6 rounded-3xl border-l-4 ${isWrong ? 'bg-red-500/5 border-red-500' : 'bg-green-500/5 border-green-500'}`}>
                                      <div className="flex justify-between mb-2">
                                          <span className="text-sm font-bold text-slate-400">Question {idx + 1}</span>
                                          <span className={`text-xs font-black uppercase ${isWrong ? 'text-red-400' : 'text-green-400'}`}>
                                              {isWrong ? text.wrong : text.correct}
                                          </span>
                                      </div>
                                      <p className="font-bold text-white text-lg mb-4">{q.question}</p>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                          <div className={`p-3 rounded-xl ${isWrong ? 'bg-red-500/10 text-red-200' : 'bg-green-500/10 text-green-200'}`}>
                                              <span className="block text-[10px] font-bold uppercase opacity-70 mb-1">{text.yourAnswer}</span>
                                              {userAnswer || 'No answer'}
                                          </div>
                                          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-200">
                                              <span className="block text-[10px] font-bold uppercase opacity-70 mb-1">{text.correctAnswer}</span>
                                              {q.answer}
                                          </div>
                                      </div>
                                      
                                      {q.explanation && (
                                          <div className="pt-4 border-t border-white/5 text-slate-300 text-sm italic flex gap-3">
                                              <Lightbulb size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                                              <div>
                                                  <span className="font-bold text-yellow-500 block text-xs uppercase mb-1">{text.explanation}</span>
                                                  {q.explanation}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ) : (
                  <>
                    {retryMode && (
                        <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 text-amber-200 mb-6 animate-pulse">
                            <AlertTriangle size={24} />
                            <div>
                                <p className="font-black text-sm uppercase tracking-wide">{text.secondChance}</p>
                                <p className="text-xs">{text.previouslyFailed}</p>
                            </div>
                        </div>
                    )}

                    {activeLesson.quiz.map((q, idx) => {
                        if (retryMode && !questionsToRetry.includes(idx)) return null;

                        return (
                            <div key={idx} className={`bg-slate-900/80 p-8 rounded-[40px] border backdrop-blur-md transition-colors ${retryMode ? 'border-amber-500/30' : 'border-white/10'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white border ${retryMode ? 'bg-amber-900 border-amber-500' : 'bg-slate-800 border-white/5'}`}>
                                    {idx + 1}
                                </div>
                                <p className="font-bold text-white text-lg leading-tight">{q.question}</p>
                            </div>
                            <div className="grid gap-3 pl-14">
                                {q.options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setQuizAnswers({...quizAnswers, [idx]: opt})}
                                    className={`p-4 rounded-2xl text-left font-medium border-2 transition-all active:scale-[0.99] ${
                                    quizAnswers[idx] === opt 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                                    }`}
                                >
                                    {opt}
                                </button>
                                ))}
                            </div>
                            </div>
                        );
                    })}
                    <div className="text-center pt-8 pb-12">
                        <button 
                        onClick={handleSubmitQuiz}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-12 py-5 rounded-full font-black text-xl shadow-xl hover:scale-105 transition-transform hover:shadow-blue-500/30"
                        >
                        {text.submit}
                        </button>
                    </div>
                  </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-slate-950 font-sans relative">
      <AnimatePresence>
        {showTutorial && renderTutorial()}
      </AnimatePresence>
      {viewState === 'dashboard' && renderDashboard()}
      {viewState === 'create' && renderCreate()}
      {viewState === 'lesson' && renderLesson()}
    </div>
  );
};

export default LessonGenerator;
