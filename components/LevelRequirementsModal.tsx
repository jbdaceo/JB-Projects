
// DO cast score to number to avoid "unknown" type comparison errors
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';

interface LevelRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentLevel: 'Novice' | 'Semi Pro' | 'Pro';
}

const LevelRequirementsModal: React.FC<LevelRequirementsModalProps> = ({ isOpen, onClose, lang, currentLevel }) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [hasBooked, setHasBooked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check Semi Pro Requirements (Games)
      const games = ['voice_voyager', 'trivia_titan', 'match_master', 'word_wizard', 'sonic_scout'];
      const newScores: Record<string, number> = {};
      games.forEach(g => {
        newScores[g] = parseInt(localStorage.getItem(`tmc_game_score_${g}`) || '0');
      });
      setScores(newScores);

      // Check Pro Requirements (Booking)
      setHasBooked(localStorage.getItem('tmc_pro_status_v2') === 'true');
    }
  }, [isOpen]);

  const text = {
    title: lang === 'es' ? 'Tu Camino al Éxito' : 'Your Path to Success',
    yourLevel: lang === 'es' ? 'Tu Nivel Actual' : 'Your Current Level',
    requirements: lang === 'es' ? 'Requisitos para el Siguiente Nivel' : 'Requirements for Next Level',
    novice: 'Novice',
    semiPro: 'Semi Pro',
    pro: 'Pro',
    locked: lang === 'es' ? 'Bloqueado' : 'Locked',
    unlocked: lang === 'es' ? 'Desbloqueado' : 'Unlocked',
    kidsZone: lang === 'es' ? 'Kids Zone: Magic Games' : 'Kids Zone: Magic Games',
    coaching: lang === 'es' ? 'Tutoría: 1-a-1' : 'Coaching: 1-on-1',
    semiProDesc: lang === 'es' ? 'Consigue 100 puntos en los 5 juegos de la Zona de Niños.' : 'Get 100 points in all 5 Kids Zone games.',
    proDesc: lang === 'es' ? 'Agenda tu primera sesión privada con el Profe Tomas.' : 'Book your first private session with Professor Tomas.',
    achieved: lang === 'es' ? '¡Lo lograste!' : 'You did it!',
    close: lang === 'es' ? 'Cerrar' : 'Close'
  };

  const GAME_NAMES: Record<string, string> = {
    'voice_voyager': 'Voice Voyager',
    'trivia_titan': 'Trivia Titan',
    'match_master': 'Match Master',
    'word_wizard': 'Word Wizard',
    'sonic_scout': 'Sonic Scout'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 md:p-10 bg-gradient-to-br from-slate-900 to-slate-950 border-b border-white/5 relative">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2">{text.title}</h2>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">{text.yourLevel}:</span>
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
              currentLevel === 'Pro' ? 'bg-amber-500 text-amber-950' : 
              currentLevel === 'Semi Pro' ? 'bg-cyan-500 text-cyan-950' : 
              'bg-slate-600 text-slate-200'
            }`}>
              {currentLevel}
            </span>
          </div>
        </div>

        <div className="p-8 md:p-10 overflow-y-auto space-y-12">
          {/* Level 1 -> 2 Requirement */}
          <div className={`space-y-4 ${currentLevel !== 'Novice' ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-cyan-400">🚀</span> {text.semiPro} Level
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1">{text.semiProDesc}</p>
              </div>
              {currentLevel !== 'Novice' && <span className="text-emerald-400 font-black text-xl">✓</span>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(scores).map(([gameId, score]) => {
                // Fix: Cast score as number to avoid comparison errors with "unknown" type from Object.entries
                const s = score as number;
                return (
                  <div key={gameId} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{GAME_NAMES[gameId]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${s >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, s)}%` }} />
                      </div>
                      <span className={`text-xs font-black ${s >= 100 ? 'text-emerald-400' : 'text-slate-500'}`}>{s}/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level 2 -> 3 Requirement */}
          <div className={`space-y-4 ${currentLevel === 'Pro' ? 'opacity-50' : currentLevel === 'Novice' ? 'opacity-30 grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-amber-400">⚡</span> {text.pro} Level
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1">{text.proDesc}</p>
              </div>
              {currentLevel === 'Pro' && <span className="text-emerald-400 font-black text-xl">✓</span>}
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${hasBooked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                 {hasBooked ? '🤝' : '🔒'}
               </div>
               <div>
                 <p className="text-sm font-bold text-white">{text.coaching}</p>
                 <p className="text-xs text-slate-500">{hasBooked ? text.achieved : text.locked}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-slate-950/50">
          <button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all">
            {text.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LevelRequirementsModal;
