
import React, { Component, useState, useEffect, Suspense, ReactNode, ErrorInfo } from 'react';
import { AppSection, Language } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Home from './components/Home'; 
import AuthModal from './components/AuthModal';
import LevelRequirementsModal from './components/LevelRequirementsModal';
import { AuthProvider } from './contexts/AuthContext';
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

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

// Fix Error: Property 'props' does not exist on type 'ErrorBoundary'
// Explicitly extending React.Component ensures that TypeScript recognizes inherited members like 'props' and 'state'
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6">⚠️</div>
          <h2 className="text-2xl font-black mb-4 uppercase italic">Neural Sync Failed</h2>
          <button onClick={() => window.location.reload()} className="px-10 py-4 bg-brand-500 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Reload Pipeline</button>
        </div>
      );
    }
    // Return children or null if undefined to satisfy React expectations
    return this.props.children || null;
  }
}

const AppContent: React.FC = () => {
  useAudioInitialization();
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [historyStack, setHistoryStack] = useState<AppSection[]>([AppSection.Home]);
  const [lang, setLang] = useState<Language>('es');
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [tmcLevel, setTmcLevel] = useState<'Novice' | 'Semi Pro' | 'Pro'>('Novice');
  const [levelProgress, setLevelProgress] = useState(10);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (section: AppSection) => {
    if (section === activeSection) return;
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
      default: return <Home onNavigate={handleNavigate} lang={lang} />;
    }
  };

  const sectionTitles: Record<AppSection, string> = {
    [AppSection.Home]: 'Dashboard',
    [AppSection.Worlds]: lang === 'es' ? 'Mundos' : 'Worlds',
    [AppSection.WorldHub]: lang === 'es' ? 'Portal' : 'Portal',
    [AppSection.Chat]: 'Global Pulse',
    [AppSection.Classes]: 'ILS TV',
    [AppSection.Lessons]: lang === 'es' ? 'Lecciones' : 'Lessons',
    [AppSection.Speaking]: lang === 'es' ? 'Voz' : 'Voice',
    [AppSection.Vocab]: 'Vocab Pro',
    [AppSection.Coaching]: lang === 'es' ? 'Tutoría' : 'Coaching',
    [AppSection.Community]: 'Community',
    [AppSection.Kids]: 'Kids Zone',
    [AppSection.LiveClassroom]: 'Studio',
    [AppSection.Jobs]: 'Careers',
    [AppSection.Breakout]: 'Breakout'
  };

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
            onLangToggle={() => setLang(l => l === 'es' ? 'en' : 'es')} 
            tmcLevel={tmcLevel} 
            levelProgress={levelProgress} 
            onOpenLevelInfo={() => setShowLevelModal(true)} 
            onOpenAiAssistant={() => setShowAiAssistant(true)} 
          />
        </div>
      )}

      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-[calc(60px+env(safe-area-inset-top))] glass-header z-[60] flex items-end justify-center px-6 pb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{sectionTitles[activeSection]}</span>
        </div>
      )}

      <main className={`flex-1 relative h-full overflow-hidden flex flex-col w-full`}>
        <AnimatePresence>
          {activeSection !== AppSection.Home && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              onClick={handleBack} 
              className={`fixed z-[200] facetime-glass p-3 rounded-2xl text-white shadow-2xl active:scale-90 transition-all flex items-center justify-center
                ${isMobile ? 'top-[calc(14px+env(safe-area-inset-top))] left-4' : 'top-8 left-8 sm:left-[304px]'}`}
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className={`flex-1 overflow-y-auto hide-scrollbar scroll-smooth w-full 
          ${isMobile ? 'pt-[calc(80px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] px-4' : 'lg:pt-10 lg:pb-10 lg:px-10 px-6 pt-10'}`}>
          
          <div className="max-w-7xl mx-auto min-h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeSection} 
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 1.02, y: -10 }} 
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="h-full flex flex-col"
              >
                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
                    </div>
                  }>
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
