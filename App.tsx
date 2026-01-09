import React, { useState, useEffect, Suspense, ReactNode, ErrorInfo, Component, useCallback } from 'react';
import { AppSection, Language, User, PassportStamp } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Home from './components/Home'; 
import AuthModal from './components/AuthModal';
import LevelRequirementsModal from './components/LevelRequirementsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioInitialization } from './hooks/useAudioInitialization';
import { triggerHaptic } from './utils/performance';
import { ChevronLeft } from 'lucide-react';

const Mascot = React.lazy(() => import('./components/Mascot'));
const LessonGenerator = React.lazy(() => import('./components/LessonGenerator'));
const SpeakingPractice = React.lazy(() => import('./components/SpeakingPractice'));
const VocabularyTool = React.lazy(() => import('./components/VocabularyTool'));
const CoachingSessions = React.lazy(() => import('./components/CoachingSessions'));
const Community = React.lazy(() => import('./components/Community'));
const ChatPage = React.lazy(() => import('./components/ChatPage'));
const KidsZone = React.lazy(() => import('./components/KidsZone'));
const WorldsPortal = React.lazy(() => import('./components/WorldsPortal'));
const WorldPage = React.lazy(() => import('./components/WorldPage'));
const LiveClassroom = React.lazy(() => import('./components/LiveClassroom'));
const JobsBoard = React.lazy(() => import('./components/JobsBoard'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const Passport = React.lazy(() => import('./components/Passport'));

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

// Fix: Use the imported Component class directly to ensure proper type resolution of this.props and this.state
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Correct state initialization for Component
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("Uncaught error:", error, errorInfo); 
  }

  public render() {
    // Fix: state property is now properly resolved through Component inheritance
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6">⚠️</div>
          <h2 className="text-2xl font-black mb-4 uppercase italic">Neural Sync Failed</h2>
          <button onClick={() => window.location.reload()} className="px-10 py-4 bg-brand-500 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Reload Pipeline</button>
        </div>
      );
    }
    // Fix: props property is now properly resolved through Component inheritance
    return this.props.children || null;
  }
}

const AppContent: React.FC = () => {
  useAudioInitialization();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [historyStack, setHistoryStack] = useState<AppSection[]>([AppSection.Home]);
  const [lang, setLang] = useState<Language>('es');
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [tmcLevel, setTmcLevel] = useState<'Novice' | 'Semi Pro' | 'Pro'>('Novice');
  const [levelProgress, setLevelProgress] = useState(10);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [stamps, setStamps] = useState<PassportStamp[]>([]);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshProgress = useCallback(() => {
    const savedStamps = JSON.parse(localStorage.getItem('tmc_passport_stamps') || '[]');
    setStamps(savedStamps);
    
    const xp = savedStamps.reduce((acc: number, s: PassportStamp) => acc + s.points, 0);
    const calculatedLevel = Math.min(100, (xp / 5000) * 100);
    setLevelProgress(calculatedLevel);
    
    if (xp > 3000) setTmcLevel('Pro');
    else if (xp > 1000) setTmcLevel('Semi Pro');
    else setTmcLevel('Novice');
  }, []);

  useEffect(() => {
    refreshProgress();
    window.addEventListener('tmc-progress-update', refreshProgress);
    return () => window.removeEventListener('tmc-progress-update', refreshProgress);
  }, [refreshProgress]);

  const handleNavigate = (section: AppSection) => {
    if (section === activeSection && section !== AppSection.Community) return;
    setHistoryStack(prev => [...prev, section]);
    setActiveSection(section);
    triggerHaptic('light');
  };

  const handleBack = () => {
    if (historyStack.length <= 1) {
      setActiveSection(AppSection.Home);
      return;
    }
    const newStack = [...historyStack];
    newStack.pop(); 
    const prevSection = newStack[newStack.length - 1];
    setHistoryStack(newStack);
    setActiveSection(prevSection);
    triggerHaptic('medium');
  };

  const handleLangToggle = () => {
    setLang(l => l === 'es' ? 'en' : 'es');
    triggerHaptic('medium');
  };

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.Home: return <Home onNavigate={handleNavigate} lang={lang} />;
      case AppSection.Worlds: return <WorldPage lang={lang} onNavigate={handleNavigate} />;
      case AppSection.WorldHub: return <WorldsPortal lang={lang} onNavigate={handleNavigate} />;
      case AppSection.Chat: return <ChatPage lang={lang} />;
      case AppSection.LiveClassroom: return <LiveClassroom lang={lang} />;
      case AppSection.Lessons: return <LessonGenerator lang={lang} userTier={tmcLevel} />;
      case AppSection.Speaking: return <SpeakingPractice lang={lang} onExit={handleBack} />;
      case AppSection.Vocab: return <VocabularyTool lang={lang} />;
      case AppSection.Coaching: return <CoachingSessions lang={lang} />;
      case AppSection.Community: return <Community lang={lang} onNavigate={handleNavigate} />;
      case AppSection.Kids: return <KidsZone lang={lang} />;
      case AppSection.Jobs: return <JobsBoard lang={lang} onNavigate={handleNavigate} />;
      case AppSection.Passport: return user ? <Passport lang={lang} user={user} stamps={stamps} /> : null;
      default: return <Home onNavigate={handleNavigate} lang={lang} />;
    }
  };

  // Condition to hide global back button if component has its own internal navigation or immersive flow
  // Added AppSection.Passport and AppSection.Kids to hide global back since they handle it internally or want no overlap
  const hideGlobalBack = activeSection === AppSection.Home || activeSection === AppSection.Speaking || activeSection === AppSection.Community || activeSection === AppSection.Kids;

  return (
    <div className={`absolute inset-0 bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30 flex overflow-hidden gpu-layer ${isMobile ? 'flex-col' : 'flex-row'}`}>
      <AuthModal isOpen={showAuthModal} onLogin={() => setShowAuthModal(false)} onGuest={() => setShowAuthModal(false)} lang={lang} />
      <LevelRequirementsModal isOpen={showLevelModal} onClose={() => setShowLevelModal(false)} lang={lang} currentLevel={tmcLevel} />

      {!isMobile && (
        <div className="h-full relative z-[50] shrink-0">
          <Sidebar 
            activeSection={activeSection} 
            onNavigate={handleNavigate} 
            lang={lang} 
            onLangToggle={handleLangToggle} 
            tmcLevel={tmcLevel} 
            levelProgress={levelProgress} 
            onOpenLevelInfo={() => setShowLevelModal(true)} 
            onOpenAiAssistant={() => setShowAiAssistant(true)} 
          />
        </div>
      )}

      <main className="flex-1 relative h-full overflow-hidden flex flex-col w-full">
        <AnimatePresence>
          {!hideGlobalBack && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              onClick={handleBack} 
              className={`fixed z-[200] facetime-glass p-4 rounded-[24px] text-white shadow-2xl active:scale-90 transition-all flex items-center justify-center
                ${isMobile ? 'top-[calc(12px+env(safe-area-inset-top))] left-4' : 'top-8 left-8 sm:left-[304px]'}`}
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className={`flex-1 overflow-y-auto hide-scrollbar scroll-smooth w-full 
          ${isMobile ? 'pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] px-4' : (activeSection === AppSection.Kids ? 'pt-0' : 'lg:pt-10 lg:pb-10 lg:px-10 px-6 pt-10')}`}>
          <div className={`${activeSection === AppSection.Kids ? 'max-w-none' : 'max-w-7xl'} mx-auto min-h-full flex flex-col`}>
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="h-full flex flex-col">
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" /></div>}>
                    {renderContent()}
                  </Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Suspense fallback={null}><AIAssistant isOpen={showAiAssistant} onClose={() => setShowAiAssistant(false)} lang={lang} currentSection={activeSection} onNavigate={handleNavigate} /></Suspense>
      <Suspense fallback={null}><Mascot lang={lang} /></Suspense>
      
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe">
          <MobileNav activeSection={activeSection} onNavigate={handleNavigate} lang={lang} />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
