
import React, { useState, useEffect, Suspense, ReactNode } from 'react';
import { AppSection, Language } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Home from './components/Home'; // Critical Path
import Mascot from './components/Mascot';
import AuthModal from './components/AuthModal';
import LevelRequirementsModal from './components/LevelRequirementsModal';
import { AuthProvider } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioInitialization } from './hooks/useAudioInitialization';

const LessonGenerator = React.lazy(() => import('./components/LessonGenerator'));
const SpeakingPractice = React.lazy(() => import('./components/SpeakingPractice'));
const VocabularyTool = React.lazy(() => import('./components/VocabularyTool'));
const CoachingSessions = React.lazy(() => import('./components/CoachingSessions'));
const Community = React.lazy(() => import('./components/Community'));
const KidsZone = React.lazy(() => import('./components/KidsZone'));
const ClassesPage = React.lazy(() => import('./components/ClassesPage'));
const WorldsPortal = React.lazy(() => import('./components/WorldsPortal'));
const ChatPage = React.lazy(() => import('./components/ChatPage'));
const WorldPage = React.lazy(() => import('./components/WorldPage'));
const BreakoutRoom = React.lazy(() => import('./components/BreakoutRoom'));
const LiveClassroom = React.lazy(() => import('./components/LiveClassroom'));
const JobsBoard = React.lazy(() => import('./components/JobsBoard'));

const THEME_CONFIG: Record<AppSection, { hue: number, sat: number }> = {
  [AppSection.Home]: { hue: 220, sat: 90 },
  [AppSection.Worlds]: { hue: 200, sat: 85 },
  [AppSection.WorldHub]: { hue: 170, sat: 80 },
  [AppSection.Chat]: { hue: 280, sat: 85 },
  [AppSection.Classes]: { hue: 0, sat: 95 },
  [AppSection.Lessons]: { hue: 260, sat: 85 },
  [AppSection.Speaking]: { hue: 190, sat: 95 },
  [AppSection.Vocab]: { hue: 160, sat: 80 },
  [AppSection.Coaching]: { hue: 25, sat: 95 },
  [AppSection.Community]: { hue: 290, sat: 85 },
  [AppSection.Kids]: { hue: 330, sat: 90 },
  [AppSection.Breakout]: { hue: 50, sat: 95 },
  [AppSection.LiveClassroom]: { hue: 10, sat: 90 },
  [AppSection.Jobs]: { hue: 210, sat: 90 },
};

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(error: any): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("ErrorBoundary caught error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-6 space-y-4 bg-slate-950 text-white fixed inset-0 z-[9999]">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-5xl mb-2">⚠️</div>
          <h2 className="text-3xl font-black">Something went wrong</h2>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-500 transition-colors mt-4">Reload Application</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  // Initialize audio context on first interaction
  useAudioInitialization();

  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [lang, setLang] = useState<Language>('es');
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [tmcLevel, setTmcLevel] = useState<'Novice' | 'Semi Pro' | 'Pro'>('Novice');
  const [levelProgress, setLevelProgress] = useState(10);
  const [showLevelModal, setShowLevelModal] = useState(false);

  useEffect(() => {
    const base = THEME_CONFIG[activeSection];
    const langHueShift = lang === 'en' ? 180 : 0;
    const randomHueShift = Math.floor(Math.random() * 30) - 15;
    const randomSatShift = Math.floor(Math.random() * 10) - 5;
    const finalHue = (base.hue + langHueShift + randomHueShift) % 360;
    const finalSat = Math.max(50, Math.min(100, base.sat + randomSatShift));
    document.documentElement.style.setProperty('--brand-hue', finalHue.toString());
    document.documentElement.style.setProperty('--brand-sat', `${finalSat}%`);
  }, [activeSection, lang]);

  const checkLevel = () => {
    try {
      const mastery = parseInt(localStorage.getItem('tmc_mastery_level') || '1');
      const speaking = parseInt(localStorage.getItem('tmc_speaking_level') || '1');
      const games = ['voice_voyager', 'trivia_titan', 'match_master', 'word_wizard', 'sonic_scout'];
      const gameScoreTotal = games.reduce((acc, g) => acc + parseInt(localStorage.getItem(`tmc_game_score_${g}`) || '0'), 0);
      let p = 5 + (gameScoreTotal * 0.05) + ((mastery - 1) * 2) + ((speaking - 1) * 3);
      if (p > 100) p = 100;
      const hasPaid = localStorage.getItem('tmc_pro_status_v2') === 'true';
      if (hasPaid) p = 100;
      setLevelProgress(p);
      const allGamesPassed = games.every(g => parseInt(localStorage.getItem(`tmc_game_score_${g}`) || '0') >= 100);
      if (hasPaid) setTmcLevel('Pro');
      else if (allGamesPassed) setTmcLevel('Semi Pro');
      else setTmcLevel('Novice');
    } catch (e) { setLevelProgress(10); setTmcLevel('Novice'); }
  };

  useEffect(() => {
    checkLevel();
    window.addEventListener('tmc-level-update', checkLevel);
    return () => window.removeEventListener('tmc-level-update', checkLevel);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.Home: return <Home onStart={() => setActiveSection(AppSection.Worlds)} onNavigate={setActiveSection} lang={lang} />;
      case AppSection.Worlds: return <WorldPage lang={lang} onNavigate={setActiveSection} />;
      case AppSection.WorldHub: return <WorldsPortal lang={lang} onNavigate={setActiveSection} />;
      case AppSection.Chat: return <ChatPage lang={lang} />;
      case AppSection.Breakout: return <BreakoutRoom lang={lang} />;
      case AppSection.LiveClassroom: return <LiveClassroom lang={lang} />;
      case AppSection.Classes: return <ClassesPage lang={lang} />;
      case AppSection.Lessons: return <LessonGenerator lang={lang} userTier={tmcLevel} />;
      case AppSection.Speaking: return <SpeakingPractice lang={lang} userTier={tmcLevel} />;
      case AppSection.Vocab: return <VocabularyTool lang={lang} />;
      case AppSection.Coaching: return <CoachingSessions lang={lang} />;
      case AppSection.Community: return <Community lang={lang} onNavigate={setActiveSection} />;
      case AppSection.Kids: return <KidsZone lang={lang} />;
      case AppSection.Jobs: return <JobsBoard lang={lang} onNavigate={setActiveSection} />;
      default: return <Home onStart={() => setActiveSection(AppSection.Worlds)} onNavigate={setActiveSection} lang={lang} />;
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30 flex lg:flex-row flex-col overflow-hidden">
      <AuthModal isOpen={showAuthModal} onLogin={() => setShowAuthModal(false)} onGuest={() => setShowAuthModal(false)} lang={lang} />
      <LevelRequirementsModal isOpen={showLevelModal} onClose={() => setShowLevelModal(false)} lang={lang} currentLevel={tmcLevel} />

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-[calc(60px+env(safe-area-inset-top))] pt-safe-top native-glass flex items-center justify-between px-4 transition-all border-b border-white/5">
        <button onClick={() => setLang(l => l === 'es' ? 'en' : 'es')} className="h-8 px-3 bg-white/5 rounded-full flex items-center gap-2 active-scale border border-white/10">
           <div className="flex gap-1"><div className={`w-1.5 h-1.5 rounded-full ${lang === 'es' ? 'bg-brand-500' : 'bg-slate-600'}`}></div><div className={`w-1.5 h-1.5 rounded-full ${lang === 'en' ? 'bg-brand-500' : 'bg-slate-600'}`}></div></div>
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">{lang === 'es' ? 'Spanish' : 'English'}</span>
        </button>
        <button onClick={() => setShowLevelModal(true)} className="h-8 bg-white/5 rounded-full flex items-center justify-center px-4 active-scale relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-brand-500/20" style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}></div>
          <span className={`relative z-10 text-[10px] font-black uppercase tracking-widest ${tmcLevel === 'Pro' ? 'text-amber-400' : tmcLevel === 'Semi Pro' ? 'text-cyan-400' : 'text-slate-400'}`}>{lang === 'es' ? 'Nivel' : 'Level'}: {tmcLevel} {tmcLevel === 'Pro' ? '⚡' : tmcLevel === 'Semi Pro' ? '🚀' : '🌱'}</span>
        </button>
      </div>

      <div className="hidden lg:block h-full relative z-50">
        <Sidebar activeSection={activeSection} onNavigate={setActiveSection} lang={lang} onLangToggle={() => setLang(l => l === 'es' ? 'en' : 'es')} tmcLevel={tmcLevel} levelProgress={levelProgress} onOpenLevelInfo={() => setShowLevelModal(true)} />
      </div>

      <main className="flex-1 relative h-full overflow-y-auto overflow-x-hidden scroll-smooth w-full pt-[calc(70px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] lg:pt-8 lg:pb-8 lg:px-8 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-7xl mx-auto min-h-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-96 w-full">
                    <div className="flex flex-col items-center gap-4">
                      <motion.div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ willChange: 'transform' }} />
                      <motion.p className="text-xs font-black text-brand-500 uppercase tracking-widest" animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>Loading...</motion.p>
                    </div>
                  </motion.div>
                }>
                  {renderContent()}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Mascot activeSection={activeSection} lang={lang} />
      <div className="lg:hidden"><MobileNav activeSection={activeSection} onNavigate={setActiveSection} lang={lang} /></div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
