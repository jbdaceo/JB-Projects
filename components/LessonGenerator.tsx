
import React, { useState, useEffect } from 'react';
import { generateLesson, generateHardQuizItems, getSocraticHint } from '../services/gemini';
import { Language, PassportStamp, SavedLesson, SRSItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Grid, Crown, ArrowLeft, Loader2, Lock, ArrowRight, Brain, Zap, X, RefreshCw, Volume2, ShieldAlert, BookOpen, GraduationCap, Play, HelpCircle, Book, Layers, ChevronRight, Layout
} from 'lucide-react';
import { triggerHaptic, speakText } from '../utils/performance';
import confetti from 'canvas-confetti';

// --- TYPE DEFINITIONS FOR CURRICULUM ---
interface Module {
    id: string;
    level: number;
    title: string;
    desc: string;
    category: string;
    locked: boolean;
    completed: boolean;
}

interface Tier {
    name: string;
    color: string;
    modules: Module[];
}

type LessonPhase = 'CONCEPT' | 'VOCAB' | 'IMMERSION' | 'QUIZ';

const PHASES: LessonPhase[] = ['CONCEPT', 'VOCAB', 'IMMERSION', 'QUIZ'];

// --- DYNAMIC CURRICULUM GENERATOR ---
const generateCurriculum = (lang: Language): Tier[] => {
    const isEn = lang === 'en'; // User interface is English -> Learning Spanish

    const categories = [
        { 
          id: 'foundations', 
          name: isEn ? 'Foundations' : 'Fundamentos', 
          color: 'from-blue-500 to-cyan-500', 
          topics: isEn 
            ? ['Core Identity', 'Navigation & Space', 'Culinary Basics', 'Family Dynamics', 'Daily Rhythm', 'Modern Commerce', 'Digital Basics', 'Urban Transit', 'Health Essentials', 'Social Etiquette'] 
            : ['Identidad Central', 'Navegación y Espacio', 'Básicos Culinarios', 'Dinámica Familiar', 'Ritmo Diario', 'Comercio Moderno', 'Básicos Digitales', 'Tránsito Urbano', 'Salud Esencial', 'Etiqueta Social'] 
        },
        { 
          id: 'connection', 
          name: isEn ? 'Deep Connection' : 'Conexión Profunda', 
          color: 'from-emerald-500 to-green-600', 
          topics: isEn 
            ? ['Emotional Intelligence', 'Conflict Resolution', 'Global Travel Logic', 'Deep Friendships', 'Wellness & Mindfulness', 'Housing & Lifestyle', 'Cultural Nuances', 'Digital Socializing', 'Crisis Handling', 'Community Building', 'Romantic Relationships', 'Arts & Leisure', 'Storytelling', 'Personal Finance', 'Future Aspirations']
            : ['Inteligencia Emocional', 'Resolución de Conflictos', 'Lógica de Viajes', 'Amistades Profundas', 'Bienestar y Mindfulness', 'Vivienda y Estilo', 'Matices Culturales', 'Socialización Digital', 'Manejo de Crisis', 'Construcción de Comunidad', 'Relaciones Románticas', 'Artes y Ocio', 'Narración de Historias', 'Finanzas Personales', 'Aspiraciones Futuras']
        },
        { 
          id: 'professional', 
          name: isEn ? 'Executive Suite' : 'Suite Ejecutiva', 
          color: 'from-indigo-500 to-purple-600', 
          topics: isEn 
            ? ['Strategic Negotiation', 'Cross-Cultural Mgmt', 'Venture Capital', 'Agile Leadership', 'Crisis Communication', 'Market Analysis', 'Tech Disruption', 'Legal Frameworks', 'Public Speaking', 'Sales Psychology', 'Project Architecture', 'Supply Chain Logic', 'Corporate Ethics', 'Networking Mastery', 'Brand Strategy']
            : ['Negociación Estratégica', 'Gestión Intercultural', 'Capital de Riesgo', 'Liderazgo Ágil', 'Comunicación de Crisis', 'Análisis de Mercado', 'Disrupción Tecnológica', 'Marcos Legales', 'Oratoria Pública', 'Psicología de Ventas', 'Arquitectura de Proyectos', 'Lógica de Suministro', 'Ética Corporativa', 'Maestría en Networking', 'Estrategia de Marca']
        },
        { 
          id: 'mastery', 
          name: isEn ? 'Polymath Mastery' : 'Maestría Polímata', 
          color: 'from-amber-500 to-orange-600', 
          topics: isEn 
            ? ['Advanced Rhetoric', 'Philosophical Debate', 'Sarcasm & Wit', 'Legal Theory', 'Quantum Concepts', 'Literary Analysis', 'Geopolitical Strategy', 'Abstract Expressionism', 'Cognitive Science', 'Historical Context', 'Socio-Economic Theory', 'Linguistic Evolution', 'Ethical Dilemmas', 'Scientific Discourse', 'Existentialism']
            : ['Retórica Avanzada', 'Debate Filosófico', 'Sarcasmo y Ingenio', 'Teoría Legal', 'Conceptos Cuánticos', 'Análisis Literario', 'Estrategia Geopolítica', 'Expresionismo Abstracto', 'Ciencia Cognitiva', 'Contexto Histórico', 'Teoría Socioeconómica', 'Evolución Lingüística', 'Dilemas Éticos', 'Discurso Científico', 'Existencialismo']
        }
    ];

    let globalLevel = 1;
    const completedLevels = parseInt(localStorage.getItem('tmc_user_level_v3') || '1');

    return categories.map(cat => ({
        name: cat.name,
        color: cat.color,
        modules: cat.topics.map((topic, i) => {
            const level = globalLevel++;
            return {
                id: `${cat.id}_${i}`,
                level: level,
                title: topic,
                category: cat.name,
                desc: isEn ? `Master the context of ${topic}` : `Domina el contexto de ${topic}`,
                locked: level > completedLevels,
                completed: level < completedLevels
            };
        })
    }));
};

const LessonGenerator: React.FC<{ lang: Language }> = ({ lang }) => {
  const [curriculum, setCurriculum] = useState<Tier[]>([]);
  const [view, setView] = useState<'GRID' | 'LESSON' | 'CREATIVE'>('GRID');
  
  // Lesson Logic State
  const [lessonData, setLessonData] = useState<any | null>(null);
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>('CONCEPT');
  const [quizStep, setQuizStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [missedQuestions, setMissedQuestions] = useState<any[]>([]);
  
  // Advanced Flow States
  const [isRedemptionRound, setIsRedemptionRound] = useState(false);
  const [isUltimateRound, setIsUltimateRound] = useState(false);
  const [showUltimateIntro, setShowUltimateIntro] = useState(false);
  const [showUltimateFail, setShowUltimateFail] = useState(false);
  
  // Feedback & Hints
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  
  // Audio State
  const [isPlayingContent, setIsPlayingContent] = useState(false);

  // Creative Mode State
  const [topicInput, setTopicInput] = useState('');

  // Mobile/Side Reference Modal
  const [showReference, setShowReference] = useState(false);

  useEffect(() => {
      setCurriculum(generateCurriculum(lang));
  }, [lang]);

  const saveLessonState = (data: any, completed: boolean, currentScore: number) => {
      if (!data) return;
      const history: SavedLesson[] = JSON.parse(localStorage.getItem('tmc_saved_lessons_v10') || '[]');
      // Remove existing entry for this specific lesson ID if it exists
      const filtered = history.filter(l => l.title !== data.title); 
      
      const entry: SavedLesson = {
          ...data,
          id: data.id || `lesson_${Date.now()}`,
          dateSaved: Date.now(),
          progress: Math.floor((quizStep / (data.quiz?.length || 1)) * 100),
          completed: completed,
          quizScore: Math.floor((currentScore / (data.quiz?.length || 1)) * 100)
      };
      
      localStorage.setItem('tmc_saved_lessons_v10', JSON.stringify([entry, ...filtered]));
  };

  const startLesson = (data: any, moduleContext?: Module) => {
      setLessonData(data);
      setCurrentModule(moduleContext || null);
      setQuizStep(0);
      setScore(0);
      setMissedQuestions([]);
      setIsRedemptionRound(false);
      setIsUltimateRound(false);
      setShowUltimateIntro(false);
      setShowUltimateFail(false);
      setQuizFeedback(null);
      setCurrentHint(null);
      setIsPlayingContent(false);
      
      // Start Phase 1
      setCurrentPhase('CONCEPT');
      setView('LESSON');
      
      // Save immediately as "In Progress" for Home screen
      saveLessonState(data, false, 0);
  };

  const handleLevelSelect = async (module: Module) => {
      if (module.locked) {
          triggerHaptic('error');
          return; 
      }
      triggerHaptic('medium');
      setLoading(true);
      setView('LESSON'); // Show loader immediately
      
      try {
          const promptTopic = `${module.title} (${module.category})`;
          const data = await generateLesson(promptTopic, module.level, lang, 'Standard');
          startLesson(data, module);
      } catch (e) {
          console.error(e);
          const mockData = {
              title: `${module.title} - Alpha Protocol`,
              explanation: "System synchronization active. We are loading the neural patterns. Please try again.",
              content: `System synchronization active. We are loading the neural patterns for ${module.title}. Please review your vocabulary list manually or try again for AI generation.`,
              vocabulary: [],
              quiz: []
          };
          startLesson(mockData, module);
      } finally {
          setLoading(false);
      }
  };

  const handleCreativeSubmit = async () => {
      if (!topicInput.trim()) return;
      triggerHaptic('heavy');
      setLoading(true);
      
      try {
          const generatedData = await generateLesson(topicInput, 999, lang, 'Creative');
          startLesson(generatedData);
      } catch (e) {
          alert("Neural link failed. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const nextPhase = () => {
      const idx = PHASES.indexOf(currentPhase);
      if (idx < PHASES.length - 1) {
          setCurrentPhase(PHASES[idx + 1]);
          triggerHaptic('light');
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const prevPhase = () => {
      const idx = PHASES.indexOf(currentPhase);
      if (idx > 0) {
          setCurrentPhase(PHASES[idx - 1]);
          triggerHaptic('light');
      }
  };

  const startRedemptionRound = () => {
      triggerHaptic('heavy');
      setIsRedemptionRound(true);
      setLessonData(prev => ({ ...prev, quiz: missedQuestions }));
      setMissedQuestions([]);
      setQuizStep(0);
      setScore(0); 
  };

  const startUltimateRound = async () => {
      triggerHaptic('heavy');
      setLoading(true);
      setShowUltimateIntro(false);
      
      try {
          const hardQuestions = await generateHardQuizItems(lessonData.content, lang);
          const combinedQuiz = [...missedQuestions, ...hardQuestions];
          setLessonData(prev => ({ ...prev, quiz: combinedQuiz }));
          setIsRedemptionRound(false);
          setIsUltimateRound(true);
          setMissedQuestions([]);
          setQuizStep(0);
          setScore(0);
      } catch (e) {
          finishLesson(true, score); 
      } finally {
          setLoading(false);
      }
  };

  const addMissedToVocabPro = (correctAnswer: string, question: string) => {
      const existingReviews: SRSItem[] = JSON.parse(localStorage.getItem('tmc_vocab_review_v2') || '[]');
      if (existingReviews.some(item => item.term === correctAnswer)) return;

      const newItem: SRSItem = {
          id: `review_${Date.now()}`,
          term: correctAnswer,
          translation: 'Review Required',
          definitionEn: `Missed in question: ${question.substring(0, 30)}...`,
          definitionEs: `Fallaste en: ${question.substring(0, 30)}...`,
          contextEn: `Context from lesson: ${lessonData.title}`,
          contextEs: `Contexto de la lección: ${lessonData.title}`,
          level: 'A2', 
          nextReview: Date.now(),
          interval: 0,
          repetition: 0,
          easeFactor: 2.5
      };
      
      localStorage.setItem('tmc_vocab_review_v2', JSON.stringify([newItem, ...existingReviews]));
  };

  const handleRequestHint = async () => {
      if (hintLoading || currentHint) return;
      setHintLoading(true);
      triggerHaptic('medium');
      const currentQ = lessonData.quiz[quizStep];
      const correct = currentQ.a || currentQ.answer;
      try {
          const hint = await getSocraticHint(currentQ.q || currentQ.question, correct, lessonData.content, lang);
          setCurrentHint(hint);
      } catch (e) {
          setCurrentHint(lang === 'es' ? "Intenta leer el texto nuevamente con cuidado." : "Try reading the text again carefully.");
      } finally {
          setHintLoading(false);
      }
  };

  const handleQuizAnswer = (answer: string) => {
      if (!lessonData || quizFeedback) return; 
      
      const currentQ = lessonData.quiz[quizStep];
      const correct = currentQ.a || currentQ.answer;
      const isCorrect = answer.trim().toLowerCase() === correct.trim().toLowerCase();
      const nextScore = isCorrect ? score + 1 : score;

      if (isCorrect) {
          triggerHaptic('success');
          setScore(s => s + 1);
      } else {
          triggerHaptic('error');
          window.dispatchEvent(new CustomEvent('tmc-mascot-trigger', { detail: { level: 'medium' } }));
          addMissedToVocabPro(correct, currentQ.q || currentQ.question);
          setMissedQuestions(prev => [...prev, currentQ]);
      }

      setQuizFeedback({
          isCorrect,
          text: currentQ.explanation || (isCorrect ? (lang === 'es' ? '¡Excelente trabajo!' : 'Great job!') : (lang === 'es' ? `La respuesta correcta es: ${correct}` : `The correct answer is: ${correct}`))
      });

      setTimeout(() => {
          setQuizFeedback(null);
          setCurrentHint(null);
          if (quizStep < lessonData.quiz.length - 1) {
              setQuizStep(prev => prev + 1);
          } else {
              finishLesson(false, nextScore);
          }
      }, 3500); 
  };

  const finishLesson = (forceSuccess = false, finalScore: number) => {
      const totalQs = lessonData.quiz.length;
      const passingThreshold = isRedemptionRound ? totalQs : Math.ceil(totalQs * 0.8);
      const passed = forceSuccess || finalScore >= passingThreshold;
      
      if (passed) {
          handleSuccess();
          return;
      }

      window.dispatchEvent(new CustomEvent('tmc-mascot-trigger', { detail: { level: 'terror' } }));

      if (!isRedemptionRound && !isUltimateRound) {
          return; 
      }

      if (isRedemptionRound && !isUltimateRound) {
          setShowUltimateIntro(true);
          return;
      }

      if (isUltimateRound) {
          setShowUltimateFail(true);
          return;
      }
  };

  const handleSuccess = () => {
      triggerHaptic('success');
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      
      if (view !== 'CREATIVE' && currentModule && !currentModule.completed) {
          const nextLevel = currentModule.level + 1;
          localStorage.setItem('tmc_user_level_v3', nextLevel.toString());
          setCurriculum(generateCurriculum(lang)); 
      }

      let tier = 'Gold';
      if (isUltimateRound) tier = 'Platinum';
      else if (score === lessonData.quiz.length) tier = 'Diamond';

      const newStamp: PassportStamp = {
          id: `lesson_${Date.now()}`,
          category: 'academic',
          title: { en: lessonData.title, es: lessonData.title },
          tier: tier as any,
          dateEarned: Date.now(),
          points: score * 50 + (isUltimateRound ? 500 : 100),
          iconAdult: '🎓',
          rotation: Math.random() * 20 - 10,
          country: lang === 'es' ? 'USA' : 'Colombia'
      };
      
      const existingStamps = JSON.parse(localStorage.getItem('tmc_passport_stamps_v8') || '[]');
      localStorage.setItem('tmc_passport_stamps_v8', JSON.stringify([...existingStamps, newStamp]));
      
      saveLessonState(lessonData, true, score);
      window.dispatchEvent(new Event('tmc-progress-update'));

      setTimeout(() => {
          setView('GRID');
          setLessonData(null);
          setCurrentModule(null);
          setIsRedemptionRound(false);
          setIsUltimateRound(false);
          setMissedQuestions([]);
      }, 2500);
  };

  const returnToGrid = () => {
      setView('GRID');
      setLessonData(null);
      setCurrentModule(null);
      setIsRedemptionRound(false);
      setIsUltimateRound(false);
      setShowUltimateFail(false);
      setMissedQuestions([]);
  };

  // --- CONTENT FORMATTING ---
  const renderFormattedContent = (text: string, vocabList?: any[]) => {
      if (!text) return null;
      let regex: RegExp | null = null;
      if (vocabList && vocabList.length > 0) {
          try {
              const pattern = `\\b(${vocabList.map(v => v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`;
              regex = new RegExp(pattern, 'gi');
          } catch(e) {}
      }

      return text.split('\n').map((paragraph, idx) => {
          if (!paragraph.trim()) return null;
          if (!regex) return <p key={idx} className="mb-4 last:mb-0 leading-relaxed text-lg">{paragraph}</p>;

          const parts = paragraph.split(regex);
          return (
              <p key={idx} className="mb-4 last:mb-0 leading-relaxed text-lg">
                  {parts.map((part, i) => {
                      const isVocab = vocabList.some(v => v.word.toLowerCase() === part.toLowerCase());
                      if (isVocab) {
                          return <span key={i} className="font-black text-amber-400 italic px-1">{part}</span>;
                      }
                      return <span key={i}>{part}</span>;
                  })}
              </p>
          );
      });
  };

  const handlePlayContent = () => {
      if (isPlayingContent) return; 
      const textToSpeak = lessonData.contentTranslation || lessonData.content;
      setIsPlayingContent(true);
      speakText(textToSpeak, () => setIsPlayingContent(true), () => setIsPlayingContent(false));
  };

  // --- PHASE COLORS & TITLES ---
  const getPhaseStyles = (phase: LessonPhase) => {
      switch (phase) {
          case 'CONCEPT': return { bg: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900', border: 'border-blue-500/30', title: lang === 'es' ? 'Fase 1: Concepto' : 'Phase 1: Concept' };
          case 'VOCAB': return { bg: 'bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900', border: 'border-amber-500/30', title: lang === 'es' ? 'Fase 2: Vocabulario' : 'Phase 2: Vocabulary' };
          case 'IMMERSION': return { bg: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900', border: 'border-emerald-500/30', title: lang === 'es' ? 'Fase 3: Inmersión' : 'Phase 3: Immersion' };
          case 'QUIZ': return { bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-black', border: 'border-white/10', title: lang === 'es' ? 'Fase 4: Verificación' : 'Phase 4: Verification' };
      }
  };

  const currentStyles = getPhaseStyles(currentPhase);
  const canRetry = lessonData && quizStep === lessonData.quiz.length - 1 && quizFeedback === null && score < (isRedemptionRound ? lessonData.quiz.length : Math.ceil(lessonData.quiz.length * 0.8));

  // --- REFERENCE PANEL CONTENT ---
  const ReferenceContent = () => (
      <div className="space-y-8 h-full overflow-y-auto p-6 bg-slate-900">
          <div className="space-y-4">
              <h3 className="text-xl font-black text-white border-b border-white/10 pb-2">{lang === 'es' ? 'Concepto' : 'Concept'}</h3>
              <div className="text-slate-300 text-sm leading-relaxed">{renderFormattedContent(lessonData.explanation, lessonData.vocabulary)}</div>
          </div>
          <div className="space-y-4">
              <h3 className="text-xl font-black text-white border-b border-white/10 pb-2">{lang === 'es' ? 'Historia' : 'Story'}</h3>
              <div className="text-slate-300 text-sm leading-relaxed font-serif">{renderFormattedContent(lessonData.contentTranslation || lessonData.content, lessonData.vocabulary)}</div>
          </div>
          <div className="space-y-4 pb-20">
              <h3 className="text-xl font-black text-white border-b border-white/10 pb-2">{lang === 'es' ? 'Vocabulario' : 'Vocabulary'}</h3>
              {lessonData.vocabulary?.map((v: any, i: number) => (
                  <div key={i} className="bg-white/5 p-3 rounded-lg">
                      <p className="font-bold text-amber-400">{v.word}</p>
                      <p className="text-xs text-white">{v.translation}</p>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="pb-32 pt-6 px-4 max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-6">
            <div>
                <h1 className="text-display-lg text-white drop-shadow-xl">
                    {lang === 'es' ? 'Arquitecto' : 'The Architect'}
                </h1>
                <p className="text-body text-slate-300 mt-2 font-medium">
                    {lang === 'es' ? 'Currículo Neuronal Adaptativo' : 'Adaptive Neural Curriculum'}
                </p>
            </div>
            {view === 'GRID' && (
                <div className="flex ios-glass p-2 rounded-[24px]">
                    <button onClick={() => setView('GRID')} className={`px-8 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'GRID' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Grid size={16}/> {lang === 'es' ? 'Currículo' : 'Curriculum'}
                    </button>
                    <button onClick={() => setView('CREATIVE')} className={`px-8 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'CREATIVE' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Sparkles size={16}/> {lang === 'es' ? 'Crear' : 'Create'}
                    </button>
                </div>
            )}
        </header>

        <AnimatePresence mode="wait">
            {/* GRID VIEW */}
            {view === 'GRID' && (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16 pb-20">
                    {curriculum.map((tier, tIdx) => (
                        <div key={tIdx} className="relative">
                            <div className="flex items-center gap-6 mb-8">
                                <div className={`h-px flex-1 bg-gradient-to-r ${tier.color} opacity-50`}/>
                                <h3 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${tier.color} uppercase italic tracking-tighter drop-shadow-sm`}>{tier.name}</h3>
                                <div className={`h-px flex-1 bg-gradient-to-l ${tier.color} opacity-50`}/>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {tier.modules.map((mod) => (
                                    <button key={mod.id} onClick={() => handleLevelSelect(mod)} disabled={mod.locked} className={`aspect-square rounded-[40px] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300 group border-2 ${mod.locked ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed grayscale' : mod.completed ? 'bg-white/[0.05] border-emerald-500/50 hover:bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : `bg-gradient-to-br ${tier.color} border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:scale-105 z-10`}`}>
                                        {mod.completed && <div className="absolute top-4 right-4 text-emerald-400 drop-shadow-md"><CheckCircle2 size={24}/></div>}
                                        {mod.locked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock size={28} className="text-white/30"/></div>}
                                        {!mod.locked && !mod.completed && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"/>}
                                        <span className={`text-5xl font-black mb-3 leading-none drop-shadow-md ${mod.locked ? 'text-slate-600' : 'text-white'}`}>{mod.completed ? <Crown size={40} className="text-emerald-300"/> : mod.level}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest text-center leading-tight line-clamp-2 drop-shadow-md ${mod.locked ? 'text-slate-500' : 'text-white'}`}>{mod.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* CREATIVE VIEW */}
            {view === 'CREATIVE' && !lessonData && !loading && (
                <motion.div key="creative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 text-center max-w-2xl mx-auto">
                    <button onClick={() => setView('GRID')} className="absolute top-0 left-0 flex items-center gap-2 text-slate-400 hover:text-white uppercase text-xs font-black tracking-widest"><ArrowLeft size={16}/> Back</button>
                    <div className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_80px_rgba(99,102,241,0.4)] animate-pulse backdrop-blur-xl">
                        <Brain size={64} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-display-lg text-white drop-shadow-xl">AI Architect</h2>
                        <p className="text-body text-slate-300 mt-4 text-lg">{lang === 'es' ? 'Diseña una unidad de inmersión personalizada instantáneamente. Escribe cualquier tema.' : 'Design a custom immersion unit instantly. Enter any topic.'}</p>
                    </div>
                    <div className="w-full relative group">
                        <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreativeSubmit()} placeholder={lang === 'es' ? 'Ej: Negociación de contratos, Pedir café...' : 'e.g. Legal Negotiations, Ordering Coffee...'} className="ios-input w-full py-8 pl-10 pr-24 text-xl font-bold shadow-2xl rounded-[32px]" />
                        <button onClick={handleCreativeSubmit} disabled={!topicInput.trim()} className="absolute right-4 top-4 bottom-4 aspect-square bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"><ArrowRight size={28} /></button>
                    </div>
                </motion.div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                    <div className="relative"><div className="absolute inset-0 bg-brand-500 blur-[60px] opacity-30 animate-pulse"/><Loader2 className="animate-spin text-brand-400 relative z-10 drop-shadow-[0_0_20px_#60a5fa]" size={100} /></div>
                    <div className="text-center space-y-2"><p className="font-black uppercase tracking-[0.3em] text-sm text-white drop-shadow-md">{isUltimateRound ? 'Synthesizing Elite Protocols' : 'Synthesizing Neural Content'}</p><p className="text-xs text-slate-400 font-mono">Connecting to Gemini 3...</p></div>
                </motion.div>
            )}

            {/* NEW PAGINATED LESSON VIEW */}
            {view === 'LESSON' && lessonData && !loading && (
                <motion.div key="lesson" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col relative">
                    {/* Navigation Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => { setView('GRID'); setLessonData(null); }} className="flex items-center gap-3 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest ios-glass px-6 py-3 rounded-full transition-all hover:pl-4">
                            <ArrowLeft size={14}/> {lang === 'es' ? 'Abortar' : 'Abort'}
                        </button>
                        <div className="flex gap-1.5">
                            {PHASES.map((p, i) => (
                                <div key={p} className={`w-3 h-3 rounded-full transition-all duration-500 ${PHASES.indexOf(currentPhase) >= i ? 'bg-white scale-110 shadow-lg' : 'bg-white/10'}`} />
                            ))}
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{currentStyles.title}</p>
                        </div>
                    </div>

                    {/* Main Content Card - FULL WIDTH/HEIGHT */}
                    <motion.div 
                        key={currentPhase}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`flex-1 ${currentStyles.bg} border-2 ${currentStyles.border} rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col`}
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"/>
                        
                        {/* PHASE 1: CONCEPT */}
                        {currentPhase === 'CONCEPT' && (
                            <div className="p-10 md:p-16 flex flex-col justify-center h-full overflow-y-auto">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20"><GraduationCap size={32}/></div>
                                    <div>
                                        <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{lessonData.title}</h2>
                                        <div className="h-1.5 w-24 bg-blue-400 mt-3 rounded-full"/>
                                    </div>
                                </div>
                                <div className="text-xl md:text-2xl text-slate-200 font-medium leading-relaxed max-w-4xl">
                                    {renderFormattedContent(lessonData.explanation, lessonData.vocabulary)}
                                </div>
                                <div className="mt-12">
                                    <button onClick={nextPhase} className="px-10 py-5 bg-white text-blue-900 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                        {lang === 'es' ? 'Siguiente: Vocabulario' : 'Next: Vocabulary'} <ArrowRight size={20}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PHASE 2: VOCABULARY */}
                        {currentPhase === 'VOCAB' && (
                            <div className="p-8 md:p-12 flex flex-col h-full overflow-y-auto">
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-8 flex items-center gap-3">
                                    <Book size={32} className="text-amber-400"/> {lang === 'es' ? 'Adquisición de Vocabulario' : 'Vocabulary Acquisition'}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                                    {lessonData.vocabulary?.map((v: any, i: number) => (
                                        <div key={i} className="bg-black/20 border border-white/10 p-6 rounded-3xl hover:bg-black/40 transition-colors">
                                            <p className="text-2xl font-black text-amber-400 mb-2">{v.word}</p>
                                            <p className="text-sm font-medium text-slate-300 mb-4">{v.translation}</p>
                                            <p className="text-xs text-slate-400 italic border-l-2 border-amber-500/30 pl-3">"{v.example}"</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-8 right-8 flex gap-4">
                                    <button onClick={prevPhase} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"><ArrowLeft/></button>
                                    <button onClick={nextPhase} className="px-8 py-4 bg-amber-500 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">
                                        {lang === 'es' ? 'Siguiente: Inmersión' : 'Next: Immersion'} <ArrowRight size={16}/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PHASE 3: IMMERSION */}
                        {currentPhase === 'IMMERSION' && (
                            <div className="p-10 md:p-16 flex flex-col h-full overflow-y-auto relative">
                                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30"><BookOpen size={28}/></div>
                                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{lang === 'es' ? 'Inmersión Contextual' : 'Contextual Immersion'}</h2>
                                    </div>
                                    <button onClick={handlePlayContent} disabled={isPlayingContent} className={`flex items-center gap-2 px-5 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all ${isPlayingContent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-emerald-900 hover:scale-105'}`}>
                                        {isPlayingContent ? <span className="animate-pulse flex items-center gap-2"><Volume2 size={16}/> Playing...</span> : <span className="flex items-center gap-2"><Play size={16} fill="currentColor"/> Listen</span>}
                                    </button>
                                </div>
                                <div className="text-lg md:text-2xl text-white/90 font-serif leading-loose tracking-wide pb-32 max-w-5xl mx-auto">
                                    {renderFormattedContent(lessonData.contentTranslation || lessonData.content, lessonData.vocabulary)}
                                </div>
                                <div className="absolute bottom-8 right-8 flex gap-4">
                                    <button onClick={prevPhase} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"><ArrowLeft/></button>
                                    <button onClick={nextPhase} className="px-10 py-5 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-3 hover:scale-105 transition-transform">
                                        {lang === 'es' ? 'Iniciar Verificación' : 'Start Verification'} <Zap size={20} fill="currentColor"/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PHASE 4: QUIZ */}
                        {currentPhase === 'QUIZ' && (
                            <div className="flex-1 flex flex-col relative h-full">
                                {/* Quiz Header */}
                                <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-black/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white"><ShieldAlert size={24}/></div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-widest">Protocol Verification</h2>
                                            <p className="text-xs text-slate-400 font-mono">Question {quizStep + 1} / {lessonData.quiz.length}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowReference(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20 border border-white/5 transition-all">
                                        <Layout size={14}/> {lang === 'es' ? 'Material Fuente' : 'Source Material'}
                                    </button>
                                </div>

                                {/* Main Quiz Area */}
                                <div className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col justify-center items-center relative">
                                    {/* Progress Bar */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                                        <motion.div animate={{ width: `${((quizStep)/lessonData.quiz.length)*100}%` }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                                    </div>

                                    {/* Question */}
                                    <div className="w-full max-w-3xl space-y-10">
                                        <h3 className="text-2xl md:text-4xl font-black text-white text-center leading-tight drop-shadow-xl">{lessonData.quiz[quizStep].q || lessonData.quiz[quizStep].question}</h3>
                                        
                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {lessonData.quiz[quizStep].options.map((opt: string, i: number) => (
                                                <button key={i} onClick={() => handleQuizAnswer(opt)} className="p-6 bg-white/5 hover:bg-blue-600 hover:border-blue-500 rounded-2xl border-2 border-white/10 text-left transition-all group active:scale-95 flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-white group-hover:text-blue-600">{String.fromCharCode(65+i)}</div>
                                                    <span className="text-lg font-bold text-slate-200 group-hover:text-white">{opt}</span>
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Hint & Retry UI */}
                                        <div className="flex justify-between items-center pt-8 border-t border-white/5">
                                            <button onClick={handleRequestHint} disabled={hintLoading || currentHint !== null} className="flex items-center gap-2 text-yellow-400 text-xs font-black uppercase tracking-widest hover:text-yellow-300 disabled:opacity-50">
                                                {hintLoading ? <Loader2 size={14} className="animate-spin"/> : <HelpCircle size={14}/>} {lang === 'es' ? 'Solicitar Pista' : 'Request Hint'}
                                            </button>
                                            {canRetry && (
                                                <button onClick={startRedemptionRound} className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-widest hover:text-red-300">
                                                    <RefreshCw size={14}/> {lang === 'es' ? 'Reiniciar Ronda' : 'Retry Round'}
                                                </button>
                                            )}
                                        </div>
                                        {currentHint && <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-yellow-200 text-sm italic text-center animate-pulse">"{currentHint}"</div>}
                                    </div>
                                </div>

                                {/* Feedback Overlay */}
                                <AnimatePresence>
                                    {quizFeedback && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl ${quizFeedback.isCorrect ? 'bg-emerald-900/90' : 'bg-rose-900/90'}`}>
                                            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl ${quizFeedback.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                {quizFeedback.isCorrect ? <CheckCircle2 size={48}/> : <X size={48}/>}
                                            </motion.div>
                                            <h4 className="text-4xl font-black text-white italic uppercase mb-4">{quizFeedback.isCorrect ? (lang === 'es' ? '¡Correcto!' : 'Correct!') : (lang === 'es' ? 'Incorrecto' : 'Incorrect')}</h4>
                                            <p className="text-white/90 text-xl font-medium leading-relaxed max-w-2xl">{quizFeedback.text}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Side Reference Drawer */}
                                <AnimatePresence>
                                    {showReference && (
                                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-y-0 right-0 w-full md:w-[450px] bg-slate-900 border-l border-white/10 z-30 shadow-2xl flex flex-col">
                                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                                                <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2"><Layers size={16}/> {lang === 'es' ? 'Material de Referencia' : 'Reference Material'}</h3>
                                                <button onClick={() => setShowReference(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={16}/></button>
                                            </div>
                                            <ReferenceContent />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        
                        {/* Ultimate/Fail States Overlay */}
                        {(showUltimateIntro || showUltimateFail) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
                                {showUltimateIntro ? (
                                    <>
                                        <ShieldAlert size={80} className="text-purple-500 mb-6 animate-pulse"/>
                                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">{lang === 'es' ? 'Desafío Definitivo' : 'Ultimate Challenge'}</h3>
                                        <p className="text-slate-400 max-w-md mb-8">{lang === 'es' ? 'Has fallado la recuperación. Supera el desafío final para avanzar.' : 'Recovery failed. Pass the ultimate challenge to advance.'}</p>
                                        <button onClick={startUltimateRound} className="px-10 py-4 bg-purple-600 text-white rounded-full font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Start Ultimate Round</button>
                                    </>
                                ) : (
                                    <>
                                        <Brain size={80} className="text-slate-600 mb-6"/>
                                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">{lang === 'es' ? 'Módulo Fallido' : 'Module Failed'}</h3>
                                        <p className="text-slate-400 max-w-md mb-8">{lang === 'es' ? 'El aprendizaje requiere paciencia. Inténtalo de nuevo más tarde.' : 'Learning requires patience. Try again later.'}</p>
                                        <button onClick={returnToGrid} className="px-10 py-4 bg-slate-800 text-white rounded-full font-black uppercase tracking-widest shadow-xl hover:bg-slate-700 transition-all">Return to Grid</button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default LessonGenerator;
