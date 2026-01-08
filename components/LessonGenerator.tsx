
import React, { useState, useEffect, useRef } from 'react';
import { generateLesson, generateEncouragingFact, evaluateWritingExercise } from '../services/gemini';
import { Lesson, Language, SavedLesson } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import { BookOpen, Star, Plus, CheckCircle, Lock, PlayCircle, RotateCcw, Trash2, PenTool, Lightbulb, Globe } from 'lucide-react';

interface LessonGeneratorProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

const LOADING_LOTTIE = {
  v: "5.5.7", fr: 30, ip: 0, op: 60, w: 100, h: 100, nm: "Loading", ddd: 0, assets: [],
  layers: [
    { ddd: 0, ind: 1, ty: 4, nm: "Circle 1", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [20, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] }, t: 0, s: [0, 0, 100] }, { i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] }, t: 30, s: [100, 100, 100] }, { t: 60, s: [0, 0, 100] }] } }, shapes: [{ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [20, 20] } }, { ty: "fl", c: { a: 0, k: [0.23, 0.51, 0.96, 1] }, o: { a: 0, k: 100 } }] },
    { ddd: 0, ind: 2, ty: 4, nm: "Circle 2", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] }, t: 10, s: [0, 0, 100] }, { i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] }, t: 40, s: [100, 100, 100] }, { t: 70, s: [0, 0, 100] }] } }, shapes: [{ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [20, 20] } }, { ty: "fl", c: { a: 0, k: [0.34, 0.8, 0.95, 1] }, o: { a: 0, k: 100 } }] },
    { ddd: 0, ind: 3, ty: 4, nm: "Circle 3", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [80, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] }, t: 20, s: [0, 0, 100] }, { i: { x: [0.833, 0.833], y: [0.833, 0.833] }, o: { x: [0.167, 0.167], y: [0.167, 0.167] }, t: 50, s: [100, 100, 100] }, { t: 80, s: [0, 0, 100] }] } }, shapes: [{ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [20, 20] } }, { ty: "fl", c: { a: 0, k: [0.5, 0.2, 0.9, 1] }, o: { a: 0, k: 100 } }] }
  ]
};

const LessonGenerator: React.FC<LessonGeneratorProps> = ({ lang, userTier = 'Novice' }) => {
  const [viewState, setViewState] = useState<'dashboard' | 'generator' | 'lesson'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [masteryLevel, setMasteryLevel] = useState(1);
  const [activeLesson, setActiveLesson] = useState<SavedLesson | null>(null);
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<'quick' | 'deep' | 'mastery'>('quick');
  const [masteryInput, setMasteryInput] = useState('');
  const [masteryFeedback, setMasteryFeedback] = useState<{stars:number, text:string} | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Dashboard Metrics
  const totalXP = savedLessons.reduce((acc, l) => acc + (l.completed ? (l.numericLevel || 1) * 10 : 0), 0);
  const completedCount = savedLessons.filter(l => l.completed).length;
  const wordsLearned = savedLessons.filter(l => l.completed).reduce((acc, l) => acc + l.vocabulary.length, 0);

  useEffect(() => {
    const saved = localStorage.getItem('tmc_mastery_level');
    if (saved) setMasteryLevel(parseInt(saved));
    const history = localStorage.getItem('tmc_saved_lessons');
    if (history) {
      try { 
        const parsed = JSON.parse(history);
        setSavedLessons(parsed); 
      } catch (e) { console.error("Error loading history", e); }
    }
  }, []);

  const saveLessonState = (updatedLesson: SavedLesson) => {
    const updatedList = savedLessons.map(l => l.id === updatedLesson.id ? updatedLesson : l);
    // If it's a new lesson not in list yet
    if (!savedLessons.find(l => l.id === updatedLesson.id)) {
        updatedList.unshift(updatedLesson);
    }
    setSavedLessons(updatedList);
    localStorage.setItem('tmc_saved_lessons', JSON.stringify(updatedList));
    setActiveLesson(updatedLesson);
  };

  const text = {
    dashboardTitle: lang === 'es' ? 'Centro de Aprendizaje' : 'Learning Hub',
    createBtn: lang === 'es' ? 'Crear Nueva Lección' : 'Create New Lesson',
    resume: lang === 'es' ? 'Continuar' : 'Resume',
    review: lang === 'es' ? 'Repasar' : 'Review',
    completed: lang === 'es' ? 'Completado' : 'Completed',
    inProgress: lang === 'es' ? 'En Progreso' : 'In Progress',
    statsXP: lang === 'es' ? 'XP Total' : 'Total XP',
    statsLessons: lang === 'es' ? 'Lecciones' : 'Lessons',
    statsWords: lang === 'es' ? 'Palabras' : 'Words',
    masteryMode: lang === 'es' ? 'Modo Maestría' : 'Mastery Mode',
    masteryPrompt: lang === 'es' ? 'Usa tu vocabulario en un contexto real.' : 'Use your vocabulary in a real context.',
    writePrompt: lang === 'es' ? 'Escribe un párrafo corto usando al menos 3 palabras de esta lección.' : 'Write a short paragraph using at least 3 words from this lesson.',
    submitMastery: lang === 'es' ? 'Evaluar Escritura' : 'Evaluate Writing',
    lockedMastery: lang === 'es' ? 'Desbloquea completando el Quiz' : 'Unlock by passing the Quiz',
    delete: lang === 'es' ? 'Borrar' : 'Delete',
    backToDash: lang === 'es' ? '← Volver al Panel' : '← Back to Dashboard',
    generating: lang === 'es' ? 'Generando tu clase personalizada...' : 'Generating your custom lesson...',
    topicLabel: lang === 'es' ? 'Tema de Interés' : 'Topic of Interest',
    levelLabel: lang === 'es' ? 'Nivel' : 'Level',
    startBtn: lang === 'es' ? 'Comenzar Lección' : 'Start Lesson',
    
    // Intro Section
    welcomeTitle: lang === 'es' ? 'Tu Panel de Control' : 'Your Dashboard',
    welcomeSteps: lang === 'es' 
        ? [
            '1. Crea lecciones sobre temas que te apasionen.',
            '2. Completa los quizzes para ganar XP y subir de nivel.',
            '3. Desbloquea el "Modo Maestría" para recibir feedback personal.'
          ]
        : [
            '1. Create lessons on topics you are passionate about.',
            '2. Complete quizzes to earn XP and level up.',
            '3. Unlock "Mastery Mode" to receive personal feedback.'
          ],
    welcomeSubtitle: lang === 'es' ? '¡Tu camino hacia la fluidez comienza aquí!' : 'Your path to fluency starts here!',
    
    // Generator instructions
    genTitle: lang === 'es' ? 'Diseña tu Clase' : 'Design Your Class',
    genDesc: lang === 'es' 
        ? 'Aquí tienes el control total. Escribe cualquier tema que te interese (fútbol, cocina, tecnología...) y nuestra IA construirá una lección bilingüe personalizada solo para ti.' 
        : 'Here you have total control. Type any topic you are interested in (football, cooking, tech...) and our AI will build a personalized bilingual lesson just for you.'
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const result = await generateLesson(topic, masteryLevel, lang, userTier as any);
      const newLesson: SavedLesson = {
        ...result,
        id: Date.now().toString(),
        dateSaved: Date.now(),
        numericLevel: masteryLevel,
        progress: 0,
        completed: false
      };
      
      const updatedList = [newLesson, ...savedLessons];
      setSavedLessons(updatedList);
      localStorage.setItem('tmc_saved_lessons', JSON.stringify(updatedList));
      
      loadLesson(newLesson);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = (lesson: SavedLesson) => {
    setActiveLesson(lesson);
    setQuizScore(lesson.quizScore ?? null);
    setUserAnswers({}); 
    setMasteryFeedback(lesson.masteryFeedback ?? null);
    setMasteryInput('');
    setViewState('lesson');
    setViewMode(lesson.completed ? 'mastery' : 'quick');
  };

  const deleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLessons.filter(l => l.id !== id);
    setSavedLessons(updated);
    localStorage.setItem('tmc_saved_lessons', JSON.stringify(updated));
  };

  const checkQuiz = () => {
    if (!activeLesson) return;
    let roundScore = 0;
    activeLesson.quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) roundScore++;
    });
    setQuizScore(roundScore);
    
    const passed = roundScore === activeLesson.quiz.length;
    const newProgress = passed ? 100 : Math.floor((roundScore / activeLesson.quiz.length) * 90);
    
    const updated: SavedLesson = {
        ...activeLesson,
        quizScore: roundScore,
        progress: Math.max(activeLesson.progress, newProgress),
        completed: passed ? true : activeLesson.completed
    };
    saveLessonState(updated);

    if (passed) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setViewMode('mastery');
    }
  };

  const submitMastery = async () => {
    if (!masteryInput.trim() || !activeLesson) return;
    setIsEvaluating(true);
    const vocabList = activeLesson.vocabulary.map(v => v.word);
    
    try {
        const result = await evaluateWritingExercise(masteryInput, vocabList, activeLesson.topic, lang);
        setMasteryFeedback(result);
        const updated: SavedLesson = {
            ...activeLesson,
            masteryFeedback: result
        };
        saveLessonState(updated);
        if (result.stars >= 4) {
            confetti({ particleCount: 200, spread: 100, colors: ['#facc15', '#ffffff'] });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsEvaluating(false);
    }
  };

  const renderBilingualBlock = (data: any) => {
      if (typeof data === 'string') {
          return <div className="prose prose-invert max-w-none text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">{data}</div>;
      }
      return (
          <div className="space-y-6">
              <div className="bg-blue-900/20 p-6 rounded-2xl border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
                      <Globe size={14} /> English (Target)
                  </div>
                  <p className="text-white text-lg leading-relaxed">{data.en}</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border-l-4 border-slate-600">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <Globe size={14} /> Español (Apoyo)
                  </div>
                  <p className="text-indigo-200 text-lg leading-relaxed">{data.es}</p>
              </div>
          </div>
      );
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Welcome Header */}
        <div className="bg-slate-900/80 border border-white/10 rounded-[32px] p-8 relative overflow-hidden backdrop-blur-md shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-500/20 rounded-xl text-brand-400">
                            <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            {text.welcomeTitle}
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {text.welcomeSteps.map((step, i) => (
                            <p key={i} className="text-slate-300 text-sm md:text-base font-medium leading-relaxed flex items-start gap-2">
                                <span className="text-brand-500 font-bold">•</span> {step}
                            </p>
                        ))}
                    </div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest pt-2">
                        {text.welcomeSubtitle}
                    </p>
                </div>
                <div className="hidden md:block opacity-20 rotate-12">
                    <BookOpen size={140} className="text-white" />
                </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚡</div>
                <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">{text.statsXP}</p>
                <p className="text-4xl font-black mt-1">{totalXP}</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl text-white border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">📚</div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{text.statsLessons}</p>
                <p className="text-4xl font-black mt-1">{completedCount} <span className="text-lg text-slate-500 font-bold">/ {savedLessons.length}</span></p>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl text-white border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">🧠</div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{text.statsWords}</p>
                <p className="text-4xl font-black mt-1">{wordsLearned}</p>
            </div>
        </div>

        {/* Create Button */}
        <button 
            onClick={() => setViewState('generator')}
            className="w-full py-6 rounded-[32px] border-4 border-dashed border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
        >
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform"><Plus /></div>
            <span className="text-slate-400 font-bold group-hover:text-brand-400 transition-colors">{text.createBtn}</span>
        </button>

        {/* Lesson Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedLessons.map(lesson => (
                <div 
                    key={lesson.id}
                    onClick={() => loadLesson(lesson)}
                    className="bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-white/20 p-6 rounded-[32px] transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">Lvl {lesson.numericLevel}</span>
                        <div className="flex gap-2">
                            {lesson.completed && <span className="text-emerald-400"><CheckCircle size={18} /></span>}
                            <button onClick={(e) => deleteLesson(lesson.id, e)} className="text-slate-600 hover:text-red-400"><Trash2 size={18} /></button>
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-brand-400 transition-colors">{lesson.topic}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-6 h-8">
                        {typeof lesson.summary === 'string' ? lesson.summary.substring(0, 60) : lesson.summary.en.substring(0, 60)}...
                    </p>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span>{text.inProgress}</span>
                            <span>{lesson.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${lesson.progress}%` }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderGenerator = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in zoom-in-95 duration-300">
        <button onClick={() => setViewState('dashboard')} className="self-start text-slate-500 hover:text-white font-bold text-sm uppercase tracking-widest">{text.backToDash}</button>
        <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            {loading ? (
                <div className="flex flex-col items-center py-10">
                    <div className="w-32 h-32"><Lottie animationData={LOADING_LOTTIE} loop={true} /></div>
                    <p className="text-brand-400 font-bold animate-pulse mt-4">{text.generating}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-black text-white">{text.genTitle}</h2>
                        <div className="bg-blue-900/30 p-4 rounded-2xl border border-blue-500/20">
                            <p className="text-blue-100 text-sm font-medium leading-relaxed">
                                {text.genDesc}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{text.topicLabel}</label>
                        <input 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-brand-500 transition-all"
                            placeholder="e.g. Ordering Coffee, Job Interview..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{text.levelLabel} ({masteryLevel})</label>
                        <input 
                            type="range" min="1" max="100" 
                            value={masteryLevel} 
                            onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
                            className="w-full accent-brand-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={!topic.trim()}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {text.startBtn}
                    </button>
                </div>
            )}
        </div>
    </div>
  );

  const renderLessonView = () => {
      if (!activeLesson) return null;
      
      return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
                <button onClick={() => setViewState('dashboard')} className="text-slate-500 hover:text-white font-bold text-sm uppercase tracking-widest">{text.backToDash}</button>
                <div className="flex bg-slate-800 p-1 rounded-xl">
                    {(['quick', 'deep', 'mastery'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            disabled={mode === 'mastery' && !activeLesson.completed}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'} ${mode === 'mastery' && !activeLesson.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {mode === 'mastery' ? (activeLesson.completed ? text.masteryMode : <span className="flex items-center gap-1"><Lock size={12}/> Mastery</span>) : mode === 'quick' ? 'Summary' : 'Deep Dive'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden min-h-[60vh]">
                <h1 className="text-4xl font-black text-white mb-8 tracking-tight">{activeLesson.title}</h1>
                
                <AnimatePresence mode="wait">
                    {viewMode === 'quick' && (
                        <motion.div key="quick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            {renderBilingualBlock(activeLesson.summary)}
                            
                            {/* Vocab Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-white/10">
                                {activeLesson.vocabulary.map((v, i) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="font-black text-white text-lg">{v.word}</p>
                                        <p className="text-brand-400 text-sm italic mb-2">{v.translation}</p>
                                        <p className="text-slate-400 text-xs">{v.example}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Quiz Preview */}
                            {!activeLesson.completed && (
                                <div className="mt-8 p-6 bg-indigo-900/20 rounded-3xl border border-indigo-500/30 text-center">
                                    <h3 className="text-xl font-black text-white mb-2">Ready to master this?</h3>
                                    <p className="text-indigo-200 text-sm mb-4">Complete the quiz below to unlock Mastery Mode.</p>
                                    <div className="space-y-4 text-left">
                                        {activeLesson.quiz.map((q, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <p className="font-bold text-white">{idx + 1}. {q.question}</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {q.options.map(opt => (
                                                        <button 
                                                            key={opt}
                                                            onClick={() => !activeLesson.completed && setUserAnswers({...userAnswers, [idx]: opt})}
                                                            className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                                                                userAnswers[idx] === opt 
                                                                ? 'bg-brand-600 border-brand-500 text-white' 
                                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                                            } ${activeLesson.completed && opt === q.answer ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : ''}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={checkQuiz}
                                        disabled={activeLesson.completed}
                                        className="mt-8 px-8 py-3 bg-white text-indigo-900 font-black rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        {activeLesson.completed ? 'Quiz Passed!' : 'Submit Quiz'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {viewMode === 'deep' && (
                        <motion.div key="deep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {renderBilingualBlock(activeLesson.content)}
                        </motion.div>
                    )}

                    {viewMode === 'mastery' && (
                        <motion.div key="mastery" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full">
                            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 p-8 rounded-[32px] border border-amber-500/30 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-amber-500 rounded-xl text-white"><PenTool /></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{text.masteryMode}</h3>
                                        <p className="text-amber-200/80 text-sm font-bold">{text.masteryPrompt}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-950/50 p-6 rounded-2xl mb-6 border border-white/5">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Challenge:</p>
                                    <p className="text-white text-lg font-medium">"{text.writePrompt}"</p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {activeLesson.vocabulary.map((v,i) => (
                                            <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300 font-mono">{v.word}</span>
                                        ))}
                                    </div>
                                </div>

                                {masteryFeedback ? (
                                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10 text-center animate-in zoom-in">
                                        <div className="flex justify-center gap-2 mb-4 text-3xl text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} fill={i < masteryFeedback.stars ? "currentColor" : "none"} />
                                            ))}
                                        </div>
                                        <p className="text-white text-lg font-medium italic">"{masteryFeedback.text}"</p>
                                        <button onClick={() => setMasteryFeedback(null)} className="mt-6 text-slate-400 hover:text-white text-sm font-bold underline">Try Again</button>
                                    </div>
                                ) : (
                                    <>
                                        <textarea 
                                            value={masteryInput}
                                            onChange={e => setMasteryInput(e.target.value)}
                                            className="w-full flex-1 bg-slate-900 border border-white/10 rounded-2xl p-6 text-white text-lg outline-none focus:border-amber-500 transition-all resize-none min-h-[200px]"
                                            placeholder="Start writing here..."
                                        />
                                        <button 
                                            onClick={submitMastery}
                                            disabled={isEvaluating || !masteryInput.trim()}
                                            className="mt-6 w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isEvaluating ? 'Professor Tomas is reading...' : text.submitMastery}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full overflow-y-auto pb-20 px-2 font-sans hide-scrollbar">
        {viewState === 'dashboard' && renderDashboard()}
        {viewState === 'generator' && renderGenerator()}
        {viewState === 'lesson' && renderLessonView()}
    </div>
  );
};

export default LessonGenerator;
