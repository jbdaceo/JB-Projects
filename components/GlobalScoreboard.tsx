
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { Trophy, Globe2, Zap, Swords, Flame, Sparkles, TrendingUp } from 'lucide-react';

const GlobalScoreboard: React.FC<{ lang: Language, condensed?: boolean }> = ({ lang, condensed }) => {
  const [scores, setScores] = useState({ teamEn: 45200, teamEs: 44890 });
  
  // Fast loop for visual jitter and score creep
  useEffect(() => {
    const interval = setInterval(() => {
        setScores(prev => {
            // More dynamic random changes to simulate active battle
            const surge = Math.random() > 0.9 ? 150 : 10; 
            const deltaEn = Math.floor(Math.random() * 35) + surge;
            const deltaEs = Math.floor(Math.random() * 35) + surge;
            
            return {
                teamEn: prev.teamEn + deltaEn,
                teamEs: prev.teamEs + deltaEs
            };
        });
    }, 600); // 600ms updates for fast-paced feel
    return () => clearInterval(interval);
  }, []);

  const total = scores.teamEn + scores.teamEs;
  const enPercent = (scores.teamEn / total) * 100;
  const leader = scores.teamEn > scores.teamEs ? 'EN' : 'ES';
  
  // Determine intensity of the battle (how close they are)
  const diff = Math.abs(scores.teamEn - scores.teamEs);
  const isClose = diff < 2000;

  return (
    <div className={`flex flex-col gap-3 relative z-10 w-full transition-all duration-500 ${condensed ? 'items-center px-0 mt-2' : 'px-4'}`}>
        
        {/* EXPANDED HEADER - Hidden when condensed */}
        <AnimatePresence>
            {!condensed && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between items-end w-full mb-1"
                >
                    {/* Team Blue Info */}
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-1 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            <Globe2 size={10} className="text-cyan-400 animate-spin-slow"/>
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Team EN</span>
                        </div>
                        <motion.span 
                            key={scores.teamEn}
                            initial={{ scale: 1.1, color: '#fff' }}
                            animate={{ scale: 1, color: '#22d3ee' }}
                            className="text-lg font-display font-black italic tabular-nums text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                        >
                            {(scores.teamEn).toLocaleString()}
                        </motion.span>
                    </div>

                    {/* VS Badge */}
                    <div className="flex flex-col items-center pb-2">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-white/40 blur-lg rounded-full ${isClose ? 'animate-ping' : 'opacity-0'}`}></div>
                            <Swords size={20} className={`text-white relative z-10 ${isClose ? 'animate-pulse' : ''}`} />
                        </div>
                    </div>

                    {/* Team Amber Info */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 mb-1 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/30">
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Team ES</span>
                            <Flame size={10} className="text-amber-400 animate-bounce"/>
                        </div>
                        <motion.span 
                            key={scores.teamEs}
                            initial={{ scale: 1.1, color: '#fff' }}
                            animate={{ scale: 1, color: '#fbbf24' }}
                            className="text-lg font-display font-black italic tabular-nums text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                        >
                            {(scores.teamEs).toLocaleString()}
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* THE BATTLE GAUGE */}
        <div className={`relative rounded-full bg-slate-950 border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-700 ease-in-out ${condensed ? 'w-3 h-28 mx-auto' : 'w-full h-8 flex-row'}`}>
            
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 z-0 mix-blend-overlay" />

            {/* TEAM ES (AMBER) - Background Layer */}
            <div className={`absolute inset-0 z-0 ${condensed ? 'bg-amber-500' : 'bg-gradient-to-l from-red-600 via-orange-500 to-amber-400'}`} />

            {/* TEAM EN (BLUE PLASMA) - Overlay Layer */}
            <motion.div 
                className="absolute z-10 overflow-hidden"
                style={condensed ? { bottom: 0, left: 0, right: 0 } : { left: 0, top: 0, bottom: 0 }}
                animate={condensed ? { height: `${enPercent}%` } : { width: `${enPercent}%` }}
                transition={{ type: "spring", stiffness: 40, damping: 15 }}
            >
                <div className={`absolute inset-0 ${condensed ? 'bg-cyan-500' : 'bg-gradient-to-r from-blue-700 via-cyan-500 to-white'}`} />
                {/* Edge Glow */}
                <div className={`absolute ${condensed ? 'top-0 left-0 right-0 h-4 bg-gradient-to-b' : 'right-0 top-0 bottom-0 w-8 bg-gradient-to-l'} from-white to-transparent opacity-60 mix-blend-overlay`} />
            </motion.div>
            
            {/* CLASH POINT (LIGHTNING CORE) */}
            <motion.div 
                className={`absolute z-20 flex items-center justify-center ${condensed ? 'left-0 right-0 h-1' : 'top-0 bottom-0 w-1.5'}`} 
                style={condensed ? { bottom: `${enPercent}%` } : { left: `${enPercent}%` }}
                animate={condensed ? { bottom: `${enPercent}%` } : { left: `${enPercent}%` }}
                transition={{ type: "spring", stiffness: 40, damping: 15 }}
            >
                {/* The Core Spark Line */}
                <div className={`absolute bg-white shadow-[0_0_20px_#fff,0_0_40px_#cyan] ${condensed ? 'w-full h-0.5' : 'h-full w-1'}`} />
                
                {/* Rotating Spark Energy */}
                <div className="absolute w-24 h-24 flex items-center justify-center pointer-events-none">
                    <div className={`w-full h-full rounded-full border border-white/20 animate-[spin_3s_linear_infinite] ${condensed ? 'scale-[0.2]' : 'scale-100'}`}></div>
                    <div className={`absolute w-2/3 h-2/3 rounded-full border border-white/40 animate-[spin_2s_linear_infinite_reverse] ${condensed ? 'scale-[0.2]' : 'scale-100'}`}></div>
                </div>

                {/* Central Icon - Only visible in expanded mode */}
                {!condensed && (
                    <div className="absolute z-30 drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
                        <Zap size={20} className="text-white fill-white animate-pulse" />
                    </div>
                )}
            </motion.div>
        </div>

        {/* CONDENSED LEADER ICON */}
        {condensed && (
            <motion.div 
                key={leader}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`mt-2 p-1.5 rounded-full bg-slate-900 border-2 ${leader === 'EN' ? 'border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'}`}
            >
                {leader === 'EN' ? <Globe2 size={12} className="animate-spin-slow"/> : <Flame size={12} className="animate-pulse"/>}
            </motion.div>
        )}
    </div>
  );
};

export default GlobalScoreboard;
