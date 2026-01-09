
import React, { useState, useEffect } from 'react';
import { generateLesson, getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';
import { SavedLesson, Language, AppSection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BookOpen, CheckCircle, Zap, Plus, ArrowLeft, Volume2, Award, Rocket, X, Loader2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

interface LessonGeneratorProps {
  lang: Language;
  userTier?: 'Novice' | 'Semi Pro' | 'Pro';
}

const LessonGenerator: React.FC<LessonGeneratorProps> = ({ lang, userTier = 'Novice' }) => {
  const [viewState, setViewState] = useState<'dashboard' | 'create' | 'lesson'>('dashboard');
  const [viewMode, setViewMode] = useState<'study' | 'quiz'>('study');
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<SavedLesson | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  
  // Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tmc_saved_lessons_v7');
    if (saved) setSavedLessons(JSON.parse(saved));
  }, []);

  const handleCreateLesson = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    triggerHaptic('medium');
    try {
      const lessonData = await generateLesson(topicInput, 1, lang, userTier);
      const newLesson: SavedLesson = {
        ...lessonData,
        id: `lesson_${Date.now()}`,
        dateSaved: Date.now(),
        progress: 0,
        completed: false
      };
      const updated = [newLesson, ...savedLessons];
      setSavedLessons(updated);
      localStorage.setItem('tmc_saved_lessons_v7', JSON.stringify(updated));
      setActiveLesson(newLesson);
      setViewState('lesson');
      setViewMode('study');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setTopicInput('');
    }
  };

  const completeLesson = () => {
    if (!activeLesson) return;
    const updated = savedLessons.map(l => l.id === activeLesson.id ? { ...l, completed: true, quizScore } : l);
    setSavedLessons(updated);
    localStorage.setItem('tmc_saved_lessons_v7', JSON.stringify(updated));
    
    // Award stamp
    const stamps = JSON.parse(localStorage.getItem('tmc_passport_stamps') || '[]');
    const newStamp = {
        id: `lesson_${activeLesson.id}_${Date.now()}`,
        category: 'topic',
        title: { en: `Master of ${activeLesson.topic}`, es: `Maestro de ${activeLesson.topic}` },
        dateEarned: Date.now(),
        iconKid: '🧬',
        iconAdult: '📚',
        points: 300
    };
    localStorage.setItem('tmc_passport_stamps', JSON.stringify([...stamps, newStamp]));
    window.dispatchEvent(new Event('tmc-progress-update'));
    
    confetti({ particleCount: 150, spread: 80 });
    setViewState('dashboard');
  };

  const handleQuizAnswer = (option: string) => {
    setSelectedOption(option);
    if (option === activeLesson?.quiz[currentQuizIdx].answer) {
      setQuizScore(prev => prev + 1);
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
    
    setTimeout(() => {
      if (currentQuizIdx < (activeLesson?.quiz.length || 0) - 1) {
        setCurrentQuizIdx(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setShowQuizResult(true);
      }
    }, 1000);
  };

  const playTTS = async (text: string) => {
    const base64 = await getPronunciation(text);
    if (base64) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decodeBase64Audio(base64), ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto pt-10 px-4 pb-32">
        <header className="flex justify-between items-end mb-12">
            <div>
                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Lessons</h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">Progression & AI Synchronization</p>
            </div>
            <button onClick={() => setViewState('create')} className="bg-brand-500 text-white p-5 rounded-[28px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <Plus size={24} />
                <span className="font-black text-xs uppercase tracking-widest hidden md:inline">Sync New Topic</span>
            </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLessons.map((lesson) => (
                <motion.div 
                    key={lesson.id}
                    whileHover={{ y: -5 }}
                    onClick={() => { setActiveLesson(lesson); setViewState('lesson'); setViewMode('study'); setCurrentQuizIdx(0); setQuizScore(0); setShowQuizResult(false); }}
                    className={`bg-slate-900/50 border ${lesson.completed ? 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-white/5'} p-8 rounded-[48px] cursor-pointer hover:border-white/20 transition-all group relative overflow-hidden`}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 ${lesson.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-brand-400'} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner`}>🧬</div>
                        {lesson.completed && <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase">Complete</div>}
                    </div>
                    <h3 className="text-2xl font-black text-white italic mb-2 tracking-tight truncate">{lesson.title}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lesson.topic} • {lesson.level}</p>
                    {lesson.completed && (
                        <div className="mt-4 flex gap-4 text-[9px] font-black text-emerald-500/60 uppercase">
                            <span>Score: {lesson.quizScore}/5</span>
                            <span>Stamp Earned</span>
                        </div>
                    )}
                </motion.div>
            ))}
            {savedLessons.length === 0 && (
                <div className="col-span-full py-32 text-center opacity-20 space-y-4">
                    <Rocket size={64} className="mx-auto" />
                    <p className="font-black uppercase tracking-widest">Connect your first neural co-topic.</p>
                </div>
            )}
        </div>
    </div>
  );

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto pt-6 px-4 flex flex-col min-h-[70vh] justify-center">
      <button onClick={() => setViewState('dashboard')} className="self-start text-slate-500 font-black uppercase text-[10px] tracking-[0.4em] mb-12 hover:text-white flex items-center gap-3 transition-colors">
        <ArrowLeft size={18} strokeWidth={3} /> {lang === 'es' ? 'Volver' : 'Back'}
      </button>
      <div className="bg-slate-900 p-12 rounded-[56px] border border-white/5 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-brand-500/10 rounded-[32px] flex items-center justify-center text-brand-400 mx-auto shadow-inner">
             {isGenerating ? <Loader2 className="animate-spin" size={40}/> : <BookOpen size={40}/>}
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">Ready to Deep Sync?</h2>
          <p className="text-slate-400 font-medium">Define a topic to generate a custom neural language co-path.</p>
          <div className="space-y-4">
              <input 
                type="text" 
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Topic (e.g. Colombian Coffee, NYC Hustle)" 
                className="w-full bg-slate-950 border border-white/10 rounded-[28px] p-6 text-white font-bold outline-none focus:border-brand-500 transition-all placeholder:text-slate-700"
              />
              <button 
                onClick={handleCreateLesson}
                disabled={isGenerating || !topicInput.trim()}
                className="w-full py-6 bg-brand-500 text-white rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all disabled:opacity-30"
              >
                {isGenerating ? 'Synthesizing...' : 'Generate Neural Lesson'}
              </button>
          </div>
      </div>
    </div>
  );

  const renderLesson = () => {
    if (!activeLesson) return null;
    return (
      <div className="max-w-5xl mx-auto pb-40 pt-10 px-4">
        <div className="flex justify-between items-center mb-16 sticky top-20 z-[50] bg-slate-950/80 backdrop-blur-3xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
          <div className="flex bg-slate-900 rounded-[20px] p-1.5 border border-white/5">
            <button onClick={() => setViewMode('study')} className={`px-8 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'study' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>Study Phase</button>
            <button onClick={() => setViewMode('quiz')} className={`px-8 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'quiz' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>Quiz Phase</button>
          </div>
          <button onClick={() => setViewState('dashboard')} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><X size={20}/></button>
        </div>
        
        <AnimatePresence mode="wait">
        {viewMode === 'study' ? (
            <motion.div key="study" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">Lesson Focus</span>
                        <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none">{activeLesson.title}</h1>
                    </div>
                    <div className="facetime-glass p-12 rounded-[56px] border border-white/10 shadow-2xl text-slate-200 text-lg leading-relaxed space-y-6">
                        <p className="first-letter:text-5xl first-letter:font-black first-letter:text-brand-500 first-letter:mr-3 first-letter:float-left">
                            {typeof activeLesson.content === 'string' ? activeLesson.content : (lang === 'es' ? activeLesson.content.es : activeLesson.content.en)}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3"><Sparkles size={20} className="text-brand-400"/> Key Vocabulary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeLesson.vocabulary.map((v, i) => (
                            <div key={i} className="bg-slate-900 p-6 rounded-[32px] border border-white/5 flex justify-between items-center group hover:border-brand-500/40 transition-all">
                                <div>
                                    <p className="text-xl font-black text-white tracking-tight">{v.word}</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-widest">{v.translation}</p>
                                </div>
                                <button onClick={() => playTTS(v.word)} className="p-3 bg-white/5 rounded-xl text-slate-500 group-hover:text-brand-400 transition-colors"><Volume2 size={20}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        ) : (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10">
                {showQuizResult ? (
                    <div className="text-center space-y-8 bg-slate-900 p-16 rounded-[64px] border border-white/5 shadow-2xl max-w-xl">
                        <Award size={80} className="mx-auto text-brand-500 animate-bounce" />
                        <div className="space-y-2">
                           <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Synchronization Result</h2>
                           <p className="text-slate-400 text-lg font-medium">Neural Match: <span className="text-white font-black">{quizScore}/{activeLesson.quiz.length}</span></p>
                        </div>
                        <button onClick={completeLesson} className="w-full py-6 bg-brand-500 text-white rounded-[32px] font-black text-xl uppercase tracking-tighter shadow-xl hover:bg-brand-400 transition-all active:scale-95">Complete Sync & Claim Stamp</button>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl space-y-10">
                        <div className="text-center space-y-6">
                            <div className="px-6 py-2.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] inline-block">Question {currentQuizIdx + 1}/{activeLesson.quiz.length}</div>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter leading-tight">{activeLesson.quiz[currentQuizIdx].question}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {activeLesson.quiz[currentQuizIdx].options.map((opt, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleQuizAnswer(opt)}
                                    className={`p-6 rounded-[28px] border-2 text-left font-bold transition-all flex justify-between items-center ${selectedOption === opt ? (opt === activeLesson.quiz[currentQuizIdx].answer ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-rose-500/20 border-rose-500 text-white') : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'}`}
                                >
                                    <span>{opt}</span>
                                    {selectedOption === opt && (opt === activeLesson.quiz[currentQuizIdx].answer ? <CheckCircle size={20}/> : <X size={20}/>)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-slate-950 font-sans relative">
      <AnimatePresence mode="wait">
        {viewState === 'dashboard' && <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderDashboard()}</motion.div>}
        {viewState === 'create' && <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{renderCreate()}</motion.div>}
        {viewState === 'lesson' && <motion.div key="lesson" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>{renderLesson()}</motion.div>}
      </AnimatePresence>
    </div>
  );
};

export default LessonGenerator;
