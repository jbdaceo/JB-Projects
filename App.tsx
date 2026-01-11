import React, { useState, useEffect, Suspense, useCallback, ReactNode, Component } from 'react';
import ReactDOM from 'react-dom/client';
import { AppSection, Language, PassportStamp } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Home from './components/Home'; 
import AuthModal from './components/AuthModal';
import LevelRequirementsModal from './components/LevelRequirementsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioInitialization } from './hooks/useAudioInitialization';
import { triggerHaptic } from './utils/performance';
import { ChevronLeft, Globe, Loader2 } from 'lucide-react';
import Mascot from './components/Mascot';
import AIAssistant from './components/AIAssistant';
import './index.css';

// Lazy Load Pages for Performance
const LessonGenerator = React.lazy(() => import('./components/LessonGenerator'));
const SpeakingPractice = React.lazy(() => import('./components/SpeakingPractice'));
const VocabularyTool = React.lazy(() => import('./components/VocabularyTool'));
const Community = React.lazy(() => import('./components/Community'));
const KidsZone = React.lazy(() => import('./components/KidsZone'));
const WorldsPortal = React.lazy(() => import('./components/WorldsPortal'));
const JobsBoard = React.lazy(() => import('./components/JobsBoard'));
const Passport = React.lazy(() => import('./components/Passport'));
const LiveClassroom = React.lazy(() => import('./components/LiveClassroom'));
const SocialFeed = React.lazy(() => import('./components/SocialFeed'));

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any): ErrorBoundaryState { return { hasError: true }; }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
          <h2 className="text-xl font-black text-white italic uppercase tracking-widest mb-4">Neural Link Offline</h2>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-brand-500 rounded-full font-bold uppercase text-xs tracking-widest text-white shadow-lg active:scale-95 transition-transform">Reconnect</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 1.02, filter: "blur(10px)", transition: { duration: 0.3, ease: "easeIn" } }
};

const LoadingSpinner = () => (
  <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 animate-pulse" />
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin relative z-10" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Initializing...</span>
  </div>
);

const AppContent: React.FC = () => {
  useAudioInitialization();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [historyStack, setHistoryStack] = useState<AppSection[]>([AppSection.Home]);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('tmc_preferred_lang') as Language) || 'es');
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [tmcLevel, setTmcLevel] = useState<'Novice' | 'Semi Pro' | 'Pro'>('Novice');
  const [levelProgress, setLevelProgress] = useState(12);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [stamps, setStamps] = useState<PassportStamp[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    localStorage.setItem('tmc_preferred_lang', lang);
    return () => window.removeEventListener('resize', handleResize);
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    triggerHaptic('medium');
    setLang(l => l === 'es' ? 'en' : 'es');
  }, []);

  const refreshProgress = useCallback(() => {
    try {
      const savedStamps = JSON.parse(localStorage.getItem('tmc_passport_stamps_v8') || '[]');
      setStamps(savedStamps);
      const xp = savedStamps.reduce((acc: number, s: PassportStamp) => acc + s.points, 0);
      setLevelProgress(Math.min(100, (xp / 5000) * 100) || 12);
      if (xp > 3000) setTmcLevel('Pro');
      else if (xp > 1000) setTmcLevel('Semi Pro');
      else setTmcLevel('Novice');
    } catch (e) { console.error('Progress sync error', e); }
  }, []);

  useEffect(() => {
    refreshProgress();
    window.addEventListener('tmc-progress-update', refreshProgress);
    return () => window.removeEventListener('tmc-progress-update', refreshProgress);
  }, [refreshProgress]);

  const handleNavigate = useCallback((section: AppSection) => {
    if (section === activeSection) return;
    setHistoryStack(prev => [...prev, section]);
    setActiveSection(section);
    triggerHaptic('light');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const handleBack = useCallback(() => {
    if (historyStack.length <= 1) return handleNavigate(AppSection.Home);
    const newStack = [...historyStack];
    newStack.pop(); 
    setHistoryStack(newStack);
    setActiveSection(newStack[newStack.length - 1]);
    triggerHaptic('medium');
  }, [historyStack, handleNavigate]);

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.Home: return <Home onNavigate={handleNavigate} lang={lang} />;
      case AppSection.SocialFeed: return <SocialFeed lang={lang} />;
      case AppSection.Worlds: return <WorldsPortal lang={lang} onNavigate={handleNavigate} />;
      case AppSection.Lessons: return <LessonGenerator lang={lang} />;
      case AppSection.Speaking: return <SpeakingPractice lang={lang} onExit={handleBack} />;
      case AppSection.Vocab: return <VocabularyTool lang={lang} />;
      case AppSection.Community: return <Community lang={lang} onNavigate={handleNavigate} />;
      case AppSection.Jobs: return <JobsBoard lang={lang} onNavigate={handleNavigate} />;
      case AppSection.Passport: return user ? <Passport lang={lang} user={user} stamps={stamps} /> : null;
      case AppSection.LiveClassroom: return <LiveClassroom lang={lang} />;
      case AppSection.Kids: return <KidsZone lang={lang} />;
      default: return <Home onNavigate={handleNavigate} lang={lang} />;
    }
  };

  return (
    <div className="absolute inset-0 liquid-bg flex overflow-hidden font-sans select-none app-safe-area text-slate-100">
      <AuthModal isOpen={showAuthModal} onLogin={() => setShowAuthModal(false)} onGuest={() => setShowAuthModal(false)} lang={lang} />
      <LevelRequirementsModal isOpen={showLevelModal} onClose={() => setShowLevelModal(false)} lang={lang} currentLevel={tmcLevel} />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          activeSection={activeSection} 
          onNavigate={handleNavigate} 
          lang={lang} 
          onLangToggle={toggleLanguage} 
          tmcLevel={tmcLevel} 
          levelProgress={levelProgress} 
          onOpenLevelInfo={() => setShowLevelModal(true)} 
          onOpenAiAssistant={() => setShowAiAssistant(true)} 
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Mobile Header Controls */}
        <AnimatePresence>
          {isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-[60] p-4 flex justify-between items-center pointer-events-none"
            >
               {historyStack.length > 1 ? (
                 <motion.button 
                   whileTap={{ scale: 0.9 }}
                   onClick={handleBack} 
                   className="pointer-events-auto w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg"
                 >
                   <ChevronLeft size={20} />
                 </motion.button>
               ) : <div />}
               
               <motion.button 
                 whileTap={{ scale: 0.9 }}
                 onClick={toggleLanguage}
                 className="pointer-events-auto px-4 py-2 bg-white/10 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/10 shadow-lg"
               >
                 <Globe size={14} className="text-brand-400" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">{lang.toUpperCase()}</span>
               </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content Container */}
        <div className={`flex-1 overflow-y-auto hide-scrollbar scroll-smooth ${isMobile ? 'pb-32 pt-20 px-4' : 'p-8 lg:p-12'}`}>
          <div className="max-w-[1400px] mx-auto min-h-full">
            <Suspense fallback={<LoadingSpinner />}>
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="h-full"
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </main>
      
      {/* Global Components */}
      <AIAssistant isOpen={showAiAssistant} onClose={() => setShowAiAssistant(false)} lang={lang} currentSection={activeSection} onNavigate={handleNavigate} />
      <Mascot lang={lang} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe">
          <MobileNav activeSection={activeSection} onNavigate={handleNavigate} lang={lang} />
        </div>
      )}
    </div>
  );
};

export default () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);