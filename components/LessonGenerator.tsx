import React, { useState, useEffect } from 'react';
import { generateLesson, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { SavedLesson, Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BookOpen, Star, CheckCircle, PenTool, Lightbulb, Globe, AlertTriangle, MessageCircle, Music, Coffee, Plane, Briefcase, Smile, Zap, Plus, ArrowLeft, ArrowRight, Volume2, RotateCcw, Award, Rocket, X, Trash2 } from 'lucide-react';
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
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);
  const [questionsToRetry, setQuestionsToRetry] = useState<number[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem('tmc_saved_lessons');
    if (history) {
        try { 
            const parsed = JSON.parse(history);
            setSavedLessons(parsed); 
        } catch (e) {}
    }
    const savedDifficulty = localStorage.getItem('tmc_lesson_difficulty');
    if (savedDifficulty) setDifficulty(parseInt(savedDifficulty, 10));
    if (!localStorage.getItem('tmc_lesson_tutorial_seen')) setShowTutorial(true);
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
          } else { setSpeakingText(null); }
      } catch (e) { setSpeakingText(null); }
  };

  const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLessons.filter(l => l.id !== id);
    setSavedLessons(updated);
    localStorage.setItem('tmc_saved_lessons', JSON.stringify(updated));
    triggerHaptic('medium');
  };

  const handleGenerate = async () => {
    const finalTopic = customTopic.trim() || selectedTopic;
    if (!finalTopic) return;
    setLoading(true);
    try {
      const result = await generateLesson(finalTopic, difficulty, lang, userTier as any);
      const newLesson: SavedLesson = { ...result, id: Date.now().toString(), dateSaved: Date.now(), numericLevel: difficulty, progress: 0, completed: false };
      const updated = [newLesson, ...savedLessons];
      setSavedLessons(updated);
      localStorage.setItem('tmc_saved_lessons', JSON.stringify(updated));
      setActiveLesson(newLesson);
      setQuizAnswers({}); setQuizSubmitted(false); setRetryMode(false); setWrongIndices([]); setQuestionsToRetry([]);
      setViewState('lesson');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmitQuiz = () => {
    if (!activeLesson) return;
    const wrongs: number[] = [];
    activeLesson.quiz.forEach((q, idx) => {
        if (retryMode && !questionsToRetry.includes(idx)) return;
        if (quizAnswers[idx] !== q.answer) wrongs.push(idx);
    });
    setWrongIndices(wrongs);
    setQuizSubmitted(true);
    triggerHaptic(wrongs.length === 0 ? 'success' : 'medium');
    if (wrongs.length === 0) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleRetryMissed = () => {
      setQuestionsToRetry([...wrongIndices]);
      setRetryMode(true);
      setQuizSubmitted(false);
      const newAnswers = { ...quizAnswers };
      wrongIndices.forEach(idx => delete newAnswers[idx]);
      setQuizAnswers(newAnswers);
  };

  const handleNextLevel = async () => {
    if (!activeLesson) return;
    const lessonsWithoutCurrent = savedLessons.filter(l => l.id !== activeLesson.id);
    const currentScore = parseInt(localStorage.getItem('tmc_mastery_level') || '1');
    localStorage.setItem('tmc_mastery_level', (currentScore + 1).toString());
    window.dispatchEvent(new Event('tmc-level-update'));
    const newDifficulty = Math.min(100, difficulty + 1);
    setDifficulty(newDifficulty);
    localStorage.setItem('tmc_lesson_difficulty', newDifficulty.toString());
    const nextTopic = activeLesson.topic;
    setLoading(true);
    try {
        const result = await generateLesson(nextTopic, newDifficulty, lang, userTier as any);
        const newLesson: SavedLesson = { ...result, id: Date.now().toString(), dateSaved: Date.now(), numericLevel: newDifficulty, progress: 0, completed: false };
        const updatedAll = [newLesson, ...lessonsWithoutCurrent];
        setSavedLessons(updatedAll);
        localStorage.setItem('tmc_saved_lessons', JSON.stringify(updatedAll));
        setActiveLesson(newLesson);
        setQuizAnswers({}); setQuizSubmitted(false); setRetryMode(false); setWrongIndices([]); setQuestionsToRetry([]); setViewMode('study');
    } catch(e) { setViewState('dashboard'); } finally { setLoading(false); }
  };

  const text = {
    myLessons: lang === 'es' ? 'Mis Lecciones' : 'My Lessons',
    inProgress: lang === 'es' ? 'activas' : 'active',
    noActive: lang === 'es' ? 'No hay lecciones activas.' : 'No active lessons.',
    create: lang === 'es' ? 'Crear Nueva' : 'Create New',
    pickTopic: lang === 'es' ? 'Elige un Tema' : 'Pick a Topic',
    customPlaceholder: lang === 'es' ? 'O escribe el tuyo...' : 'Or type your own...',
    level: lang === 'es' ? 'Nivel' : 'Level',
    generate: lang === 'es' ? 'Generar Clase' : 'Generate Class',
    generating: lang === 'es' ? 'Escribiendo...' : 'Writing...',
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
    correctAnswer: lang === 'es' ? 'Correcta' : 'Correct',
    yourAnswer: lang === 'es' ? 'Tuya' : 'Yours',
    back: lang === 'es' ? 'Volver' : 'Back',
    beginner: lang === 'es' ? 'Principiante' : 'Beginner',
    native: lang === 'es' ? 'Nativo' : 'Native',
    study: lang === 'es' ? 'Estudiar' : 'Study',
    quiz: lang === 'es' ? 'Prueba' : 'Quiz',
    coreConcept: lang === 'es' ? 'Concepto Clave' : 'Core Concept',
    scenario: lang === 'es' ? 'Escenario' : 'Scenario',
    gotIt: lang === 'es' ? '¡Entendido!' : 'Got it!',
    statusProg: lang === 'es' ? 'En Progreso' : 'In Progress'
  };

  const renderLessonHelpModal = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <button onClick={closeTutorial} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button>
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><BookOpen className="text-blue-400" /> {lang === 'es' ? 'Cómo Usar Lecciones' : 'How to Use Lessons'}</h3>
            <div className="space-y-6">
                <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black border border-blue-500/20 shrink-0">1</div>
                    <div><h4 className="font-bold text-white">{lang === 'es' ? 'Lee el Concepto' : 'Read the Concept'}</h4><p className="text-slate-400 text-sm">{lang === 'es' ? 'Aprende el tema principal. Toca el altavoz para escuchar.' : 'Learn the main topic. Tap the speaker to hear.'}</p></div>
                </div>
                <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-black border border-purple-500/20 shrink-0">2</div>
                    <div><h4 className="font-bold text-white">{lang === 'es' ? 'Estudia el Escenario' : 'Study the Scenario'}</h4><p className="text-slate-400 text-sm">{lang === 'es' ? 'Mira cómo se usa en la vida real.' : 'See how it is used in real life.'}</p></div>
                </div>
                <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-black border border-green-500/20 shrink-0">3</div>
                    <div><h4 className="font-bold text-white">{lang === 'es' ? 'Pasa el Quiz' : 'Pass the Quiz'}</h4><p className="text-slate-400 text-sm">{lang === 'es' ? 'Domina el tema para subir de nivel.' : 'Master the topic to level up.'}</p></div>
                </div>
            </div>
            <button onClick={closeTutorial} className="w-full mt-8 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">{text.gotIt}</button>
        </motion.div>
    </motion.div>
  );

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto pt-6 px-4">
      <div className="flex flex-wrap justify-between items-end mb-12 gap-6">
        <div>
          <h2 className="text-6xl font-black text-white tracking-tighter italic">Linguistic Vault</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">{savedLessons.length} Neural Lessons Engaged</p>
        </div>
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewState('create')} 
            className="bg-brand-500 hover:bg-brand-400 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl transition-all flex items-center gap-3 shadow-brand-500/30"
        >
            <Plus size={20} strokeWidth={3} /> {text.create}
        </motion.button>
      </div>

      {savedLessons.length === 0 ? (
        <div className="text-center py-40 opacity-30 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6"><BookOpen size={48} className="text-slate-500" /></div>
            <p className="text-3xl font-black text-white italic tracking-tighter">{text.noActive}</p>
            <p className="text-sm font-bold uppercase tracking-widest mt-4">Generate your first immersive session above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedLessons.map(l => (
            <motion.div 
                key={l.id} 
                onClick={() => { setActiveLesson(l); setViewState('lesson'); setQuizAnswers({}); setQuizSubmitted(false); setRetryMode(false); setWrongIndices([]); setQuestionsToRetry([]); }} 
                whileHover={{ y: -12, scale: 1.02 }} 
                className="bg-slate-900/40 border border-white/5 p-8 rounded-[48px] cursor-pointer hover:border-brand-500/40 transition-all group relative overflow-hidden glass-panel shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-500/10 text-brand-400 border border-brand-500/20">{text.statusProg}</span>
                <motion.button 
                    whileHover={{ scale: 1.2, color: '#ef4444' }}
                    onClick={(e) => handleDeleteLesson(l.id, e)}
                    className="w-10 h-10 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={18}/>
                </motion.button>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 leading-[1.1] italic tracking-tighter group-hover:text-brand-400 transition-colors line-clamp-2">{l.title}</h3>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">{l.topic} • LVL {l.numericLevel}</p>
              
              <div className="mt-10 flex items-center gap-2 text-[11px] font-black text-brand-500 uppercase tracking-[0.3em]">
                <span>Neural Engage</span>
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto pt-6 px-4 flex flex-col min-h-[80vh] justify-center">
      <button onClick={() => setViewState('dashboard')} className="self-start text-slate-500 font-black uppercase text-[10px] tracking-[0.4em] mb-16 hover:text-white flex items-center gap-3 transition-colors"><ArrowLeft size={18} strokeWidth={3} /> {text.back}</button>
      {loading ? (
        <div className="text-center flex flex-col items-center scale-110">
            <div className="w-28 h-28 bg-brand-500/20 rounded-[40px] flex items-center justify-center mb-10 shadow-2xl shadow-brand-500/10">
                <Zap size={56} className="text-brand-500 animate-pulse" />
            </div>
            <h3 className="text-4xl font-black text-white italic tracking-tighter animate-pulse">{text.generating}</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Synthesizing personalized immersion pipeline...</p>
        </div>
      ) : (
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <h3 className="text-5xl font-black text-white italic tracking-tighter">{text.pickTopic}</h3>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5em] opacity-60">Design the vector of your next mission</p>
            
            <div className="flex flex-wrap justify-center gap-5 py-6">
              {topics.map(t => (
                <motion.button 
                    key={t.id} 
                    whileHover={{ scale: 1.08 }}
                    onClick={() => { setSelectedTopic(t.label); setCustomTopic(''); }} 
                    className={`p-8 rounded-[40px] border-2 flex flex-col items-center gap-5 transition-all w-36 ${selectedTopic === t.label ? `${t.bg} text-white shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-white/20 scale-110` : 'bg-slate-900/50 border-white/5 text-slate-600 hover:border-white/10'}`}
                >
                    <t.icon size={40} className={selectedTopic === t.label ? 'animate-bounce' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                </motion.button>
              ))}
            </div>
            
            <input 
                type="text" 
                placeholder={text.customPlaceholder} 
                value={customTopic} 
                onChange={e => { setCustomTopic(e.target.value); setSelectedTopic(''); }} 
                className="w-full bg-slate-900/50 border-2 border-white/5 rounded-[32px] p-8 text-white text-center font-black text-2xl italic tracking-tighter focus:border-brand-500 outline-none transition-all placeholder:text-slate-800 shadow-inner" 
            />
          </div>

          <div className="bg-slate-900/50 p-12 rounded-[56px] border border-white/5 space-y-10 glass-panel shadow-2xl">
            <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] px-4 opacity-50">
                <span>{text.beginner}</span>
                <span>{text.native}</span>
            </div>
            <div className="relative px-2">
                <input 
                    type="range" min="1" max="100" value={difficulty} 
                    onChange={e => setDifficulty(parseInt(e.target.value))} 
                    className="w-full h-4 bg-slate-800 rounded-full appearance-none cursor-pointer accent-brand-500" 
                />
                <motion.div 
                    layoutId="levelBadge"
                    className="absolute -top-14 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-6 py-2 rounded-2xl text-sm font-black shadow-xl shadow-brand-500/20 italic"
                >
                    LVL {difficulty}
                </motion.div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate} 
            disabled={!selectedTopic && !customTopic} 
            className="w-full py-10 bg-white text-slate-950 rounded-[40px] font-black text-3xl uppercase tracking-tighter shadow-[0_30px_60px_rgba(255,255,255,0.1)] transition-all disabled:opacity-20 disabled:hover:scale-100"
          >
            {text.generate}
          </motion.button>
        </div>
      )}
    </div>
  );

  const renderLesson = () => {
    if (!activeLesson) return null;
    const c = activeLesson.content as any;
    return (
      <div className="max-w-5xl mx-auto pb-40 pt-10 px-4">
        <div className="flex justify-between items-center mb-16 sticky top-6 z-[50] bg-slate-950/80 backdrop-blur-3xl p-5 rounded-[40px] border border-white/10 shadow-2xl">
          <button onClick={() => setViewState('dashboard')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all active:scale-90"><ArrowLeft size={24}/></button>
          <div className="flex bg-slate-900 rounded-[24px] p-2 border border-white/5 shadow-inner">
            <button onClick={() => setViewMode('study')} className={`px-12 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'study' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>{text.study}</button>
            <button onClick={() => setViewMode('quiz')} className={`px-12 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'quiz' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>{text.quiz}</button>
          </div>
          <div className="w-14 h-14 flex items-center justify-center bg-brand-500/20 rounded-[20px] text-brand-400 font-black italic text-xl shadow-lg border border-brand-500/10">
            {activeLesson.numericLevel}
          </div>
        </div>

        <div className="text-center mb-20 space-y-4">
            <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.9]">{activeLesson.title}</h1>
            <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-12 bg-slate-800" />
                <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">{activeLesson.topic}</p>
                <div className="h-[1px] w-12 bg-slate-800" />
            </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'study' ? (
            <motion.div key="study" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-16">
              {/* Core Concept - High Impact */}
              <div className="bg-slate-900/40 border border-white/5 p-16 rounded-[64px] relative overflow-hidden glass-panel group shadow-2xl">
                <div className="absolute top-0 left-0 w-3 h-full bg-brand-500 group-hover:w-6 transition-all duration-700" />
                <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
                    <div className="space-y-4">
                        <h3 className="text-[12px] font-black text-brand-400 uppercase tracking-[0.5em]">{text.coreConcept}</h3>
                        <p className="text-3xl md:text-4xl font-bold text-white leading-[1.3]">{lang === 'es' ? c.concept.es : c.concept.en}</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => playAudio(lang === 'es' ? c.concept.es : c.concept.en)} className="p-8 bg-brand-500 text-white rounded-[32px] shadow-[0_20px_40px_rgba(59,130,246,0.3)] shrink-0 self-center md:self-start"><Volume2 size={32} /></motion.button>
                </div>
                <div className="mt-10 pt-10 border-t border-white/5 opacity-60">
                    <p className="text-slate-400 font-medium italic leading-relaxed text-xl">"{lang === 'es' ? c.concept.en : c.concept.es}"</p>
                </div>
              </div>

              {/* Real World Scenario */}
              <div className="bg-slate-900/40 border border-white/5 p-16 rounded-[64px] relative overflow-hidden glass-panel group shadow-2xl">
                <div className="absolute top-0 left-0 w-3 h-full bg-indigo-500 group-hover:w-6 transition-all duration-700" />
                <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
                    <div className="space-y-4">
                        <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em]">{text.scenario}</h3>
                        <p className="text-3xl font-serif italic text-slate-100 leading-[1.5]">"{lang === 'es' ? c.scenario.es : c.scenario.en}"</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => playAudio(lang === 'es' ? c.scenario.es : c.scenario.en)} className="p-8 bg-indigo-500 text-white rounded-[32px] shadow-[0_20px_40px_rgba(99,102,241,0.3)] shrink-0 self-center md:self-start"><Volume2 size={32} /></motion.button>
                </div>
                <p className="text-slate-500 font-serif italic leading-relaxed text-xl opacity-50 mt-4">"{lang === 'es' ? c.scenario.en : c.scenario.es}"</p>
              </div>

              {/* Vocabulary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {activeLesson.vocabulary.map((v, i) => (
                  <motion.div key={i} whileHover={{ y: -8 }} className="bg-slate-900/50 p-10 rounded-[56px] border border-white/5 hover:border-brand-500/30 transition-all flex justify-between items-center group glass-panel shadow-xl">
                    <div className="space-y-2">
                        <p className="text-3xl font-black text-white italic tracking-tighter">{v.word}</p>
                        <p className="text-brand-500 text-[11px] font-black uppercase tracking-[0.3em]">{v.translation}</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => playAudio(v.word)} className="p-5 bg-white/5 hover:bg-brand-500/10 rounded-2xl text-slate-500 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all"><Volume2 size={24} /></motion.button>
                  </motion.div>
                ))}
              </div>

              <div className="text-center pt-20">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('quiz')} 
                    className="px-20 py-10 bg-brand-500 text-white rounded-[48px] font-black text-3xl uppercase tracking-tighter shadow-[0_40px_80px_rgba(59,130,246,0.4)] flex items-center gap-6 mx-auto group"
                  >
                    {text.readyForQuiz} <ArrowRight size={36} className="group-hover:translate-x-4 transition-transform duration-500" />
                  </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-16">
              {quizSubmitted ? (
                  <div className="space-y-16 pb-40">
                      <div className="bg-slate-900/50 border border-white/10 rounded-[64px] p-20 text-center glass-panel shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                          <h2 className="text-6xl font-black text-white italic tracking-tighter mb-6">{text.results}</h2>
                          <div className="text-[180px] font-black mb-10 italic tracking-tighter leading-none flex items-center justify-center">
                              <span className="text-brand-400 drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]">{activeLesson.quiz.length - wrongIndices.length}</span>
                              <span className="text-slate-800 mx-4">/</span>
                              <span className="text-white">{activeLesson.quiz.length}</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-6">
                              {wrongIndices.length > 0 && !retryMode ? (
                                  <motion.button whileHover={{ scale: 1.05 }} onClick={handleRetryMissed} className="bg-amber-500 hover:bg-amber-400 text-white px-12 py-6 rounded-[32px] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-2xl shadow-amber-500/30"><RotateCcw size={20} /> {text.retry}</motion.button>
                              ) : (
                                  <motion.button whileHover={{ scale: 1.05 }} onClick={handleNextLevel} className="bg-emerald-500 hover:bg-emerald-400 text-white px-16 py-6 rounded-[32px] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-2xl shadow-emerald-500/30"><Award size={20} /> {text.nextLevel}</motion.button>
                              )}
                              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setViewState('dashboard')} className="bg-white/5 hover:bg-white/10 text-slate-300 px-12 py-6 rounded-[32px] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 border border-white/10 italic">{text.finish}</motion.button>
                          </div>
                      </div>
                      
                      <div className="space-y-8">
                          {activeLesson.quiz.map((q, idx) => {
                              if (retryMode && !questionsToRetry.includes(idx)) return null;
                              const isWrong = wrongIndices.includes(idx);
                              return (
                                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`p-12 rounded-[56px] border-2 flex flex-col md:flex-row gap-10 items-center ${isWrong ? 'bg-red-500/5 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/30'} glass-panel shadow-xl`}>
                                      <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center font-black text-3xl shrink-0 shadow-2xl ${isWrong ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                          {isWrong ? <X size={48} strokeWidth={4}/> : <CheckCircle size={48} strokeWidth={4}/>}
                                      </div>
                                      <div className="flex-1 text-center md:text-left space-y-4">
                                          <p className="text-2xl font-black text-white italic tracking-tighter leading-tight">{q.question}</p>
                                          <div className="flex flex-wrap gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
                                              <span className="text-slate-500">{text.yourAnswer}: <span className={isWrong ? 'text-red-400' : 'text-emerald-400'}>{quizAnswers[idx] || '---'}</span></span>
                                              <span className="text-brand-400">{text.correctAnswer}: {q.answer}</span>
                                          </div>
                                      </div>
                                  </motion.div>
                              );
                          })}
                      </div>
                  </div>
              ) : (
                  <>
                    {retryMode && (<motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-amber-500/10 border-2 border-amber-500/40 p-10 rounded-[48px] flex items-center gap-6 text-amber-200 mb-16 shadow-2xl"><AlertTriangle size={48} className="animate-pulse" /><div><p className="font-black text-2xl uppercase tracking-tighter italic">{text.secondChance}</p><p className="text-sm font-bold opacity-70 tracking-widest uppercase">{text.previouslyFailed}</p></div></motion.div>)}
                    
                    <div className="grid gap-16">
                        {activeLesson.quiz.map((q, idx) => {
                            if (retryMode && !questionsToRetry.includes(idx)) return null;
                            return (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`bg-slate-900/60 p-16 rounded-[72px] border-2 backdrop-blur-3xl transition-all shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative group ${retryMode ? 'border-amber-500/20' : 'border-white/5'}`}
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                                        <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center font-black text-5xl italic shadow-2xl shrink-0 group-hover:rotate-12 transition-transform duration-500 ${retryMode ? 'bg-amber-500 text-slate-950' : 'bg-brand-500 text-white'}`}>
                                            {idx + 1}
                                        </div>
                                        <p className="font-black text-3xl md:text-4xl text-white leading-[1.2] italic tracking-tighter text-center md:text-left">{q.question}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {q.options.map(opt => (
                                            <motion.button 
                                                key={opt} 
                                                whileHover={{ scale: 1.03, y: -4 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => { setQuizAnswers({...quizAnswers, [idx]: opt}); triggerHaptic('light'); }} 
                                                className={`p-8 rounded-[36px] text-center font-black text-xl italic border-2 transition-all shadow-2xl ${quizAnswers[idx] === opt ? 'bg-brand-500 border-white/30 text-white ring-[16px] ring-brand-500/10' : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/20 hover:text-white'}`}
                                            >
                                                {opt}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    <div className="text-center pt-24 pb-40">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSubmitQuiz} 
                            className="bg-gradient-to-br from-brand-400 to-indigo-600 text-white px-24 py-10 rounded-[48px] font-black text-4xl uppercase tracking-tighter shadow-[0_30px_70px_rgba(59,130,246,0.5)] transition-all"
                        >
                            {text.submit}
                        </motion.button>
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
      <AnimatePresence>{showTutorial && renderLessonHelpModal()}</AnimatePresence>
      {viewState === 'dashboard' && renderDashboard()}
      {viewState === 'create' && renderCreate()}
      {viewState === 'lesson' && renderLesson()}
    </div>
  );
};

export default LessonGenerator;