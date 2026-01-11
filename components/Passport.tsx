
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, PassportStamp, User, StampTier } from '../types';
import { ShieldCheck, Globe, Fingerprint, Book, Star, MapPin } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

interface PassportProps {
  lang: Language;
  user: User;
  stamps: PassportStamp[];
}

const TIER_STYLES: Record<StampTier, string> = {
  Bronze: 'border-orange-900/50 bg-orange-900/10 text-orange-600',
  Silver: 'border-slate-400/50 bg-slate-400/10 text-slate-300',
  Gold: 'border-amber-400/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
  Platinum: 'border-cyan-300/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
  Diamond: 'border-indigo-400/50 bg-indigo-500/10 text-indigo-300',
  Ruby: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
  Sapphire: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  Emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
};

const ImmigrationStamp: React.FC<{ stamp: PassportStamp }> = ({ stamp }) => {
  const tierClass = TIER_STYLES[stamp.tier || 'Bronze'];
  
  return (
    <motion.div 
      whileHover={{ scale: 1.1, rotate: 0, zIndex: 10 }}
      initial={{ rotate: stamp.rotation || 0 }}
      onClick={() => triggerHaptic('light')}
      className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-sm ${tierClass} transition-all duration-300 cursor-pointer`}
    >
       <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30" />
       <div className="absolute top-1 left-0 right-0 text-[6px] font-black uppercase tracking-widest opacity-70 truncate px-1">{stamp.country || 'Global'}</div>
       <div className="text-3xl filter drop-shadow-md my-1">{stamp.iconAdult || '✈️'}</div>
       <div className="text-[7px] font-bold leading-tight line-clamp-2 px-1">{stamp.title?.en || 'Achievement'}</div>
       <div className="absolute bottom-1 text-[6px] font-mono opacity-50">{new Date(stamp.dateEarned).toLocaleDateString()}</div>
    </motion.div>
  );
};

const Passport: React.FC<PassportProps> = ({ lang, user, stamps }) => {
  const [activeTab, setActiveTab] = useState<'ID' | 'VISAS'>('ID');

  // THEME LOGIC:
  // If lang is 'es' (Spanish Interface) -> User is learning English -> Target: USA Passport
  // If lang is 'en' (English Interface) -> User is learning Spanish -> Target: Colombia Passport
  const theme = lang === 'es' 
    ? { 
        country: 'United States of America', 
        color: 'bg-[#0a192f]', // Deep Navy Blue
        accent: 'text-slate-200',
        gold: 'text-amber-200',
        seal: '🦅',
        texture: 'bg-[url("https://www.transparenttextures.com/patterns/leather.png")]' // Simulated texture class
      }
    : { 
        country: 'República de Colombia', 
        color: 'bg-[#3f0a12]', // Deep Burgundy
        accent: 'text-rose-100',
        gold: 'text-amber-400',
        seal: '🇨🇴', // Or Condor icon
        texture: 'bg-[url("https://www.transparenttextures.com/patterns/leather.png")]'
      };

  return (
    <div className="min-h-full flex items-center justify-center p-4 lg:p-8 pb-32">
      {/* Passport Cover / Book */}
      <motion.div 
        initial={{ rotateX: 10, scale: 0.95 }}
        animate={{ rotateX: 0, scale: 1 }}
        className={`w-full max-w-5xl rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-r-8 border-b-8 border-black/20 relative flex flex-col lg:flex-row min-h-[650px] ${theme.color}`}
      >
         {/* Texture Overlay */}
         <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
         
         {/* Gold Foil Accent Line */}
         <div className="absolute top-8 bottom-8 left-[390px] w-[2px] bg-gradient-to-b from-transparent via-amber-300/50 to-transparent hidden lg:block z-20" />

         {/* Left Page: Identity */}
         <div className="w-full lg:w-[400px] relative flex flex-col p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/10">
            <div className="absolute top-6 left-6 text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em]">Official Document</div>
            
            <div className="mt-10 flex flex-col items-center text-center relative z-10">
               {/* Photo Frame */}
               <div className="w-48 h-48 rounded-[4px] p-2 bg-white/5 border border-amber-500/30 mb-8 relative shadow-2xl">
                  <img src={user.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover grayscale contrast-125 sepia-[.2]" />
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/20 rounded-full blur-xl"></div>
                  <div className="absolute bottom-2 right-2 text-2xl opacity-50 mix-blend-overlay">🛡️</div>
               </div>
               
               <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-wider mb-2">{user.displayName}</h2>
               <p className="text-xs font-mono text-amber-500/70 tracking-widest mb-8">{user.id.toUpperCase().slice(0, 12)}</p>

               <div className="w-full space-y-4 border-t border-white/10 pt-6">
                  <div className="flex justify-between">
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Nationality</span>
                     <span className={`text-xs font-bold ${theme.gold}`}>{theme.country}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Date of Issue</span>
                     <span className="text-xs font-bold text-white/80">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Authority</span>
                     <span className="text-xs font-bold text-white/80">ILS Command</span>
                  </div>
               </div>
            </div>

            <div className="mt-auto pt-8 flex items-center justify-center opacity-30">
               <div className="text-6xl filter drop-shadow-lg grayscale">{theme.seal}</div>
            </div>
         </div>

         {/* Right Page: Content */}
         <div className="flex-1 flex flex-col relative bg-white/[0.02]">
            {/* Paper Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>

            {/* Tabs */}
            <div className="p-8 flex gap-6 border-b border-white/5 relative z-10">
               <button 
                 onClick={() => setActiveTab('ID')} 
                 className={`text-xs font-black uppercase tracking-[0.2em] transition-colors pb-2 border-b-2 ${activeTab === 'ID' ? 'text-amber-400 border-amber-400' : 'text-white/30 border-transparent hover:text-white/60'}`}
               >
                 Status
               </button>
               <button 
                 onClick={() => setActiveTab('VISAS')} 
                 className={`text-xs font-black uppercase tracking-[0.2em] transition-colors pb-2 border-b-2 ${activeTab === 'VISAS' ? 'text-amber-400 border-amber-400' : 'text-white/30 border-transparent hover:text-white/60'}`}
               >
                 Visas & Stamps
               </button>
            </div>

            <div className="flex-1 p-8 lg:p-12 overflow-y-auto hide-scrollbar relative z-10">
               <AnimatePresence mode="wait">
                 {activeTab === 'ID' ? (
                   <motion.div key="id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                      <div className="space-y-4">
                         <h3 className={`text-xl font-serif italic text-white/90`}>
                            "The bearer of this document is granted full diplomatic access to the linguistic territories of {theme.country}."
                         </h3>
                         <div className="h-px w-24 bg-amber-500/50"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-6 border border-white/10 rounded-xl bg-black/20">
                            <div className="flex items-center gap-3 mb-2 text-amber-400">
                               <Star size={18} />
                               <span className="text-[9px] font-black uppercase tracking-widest">Missions</span>
                            </div>
                            <span className="text-3xl font-mono text-white">12</span>
                         </div>
                         <div className="p-6 border border-white/10 rounded-xl bg-black/20">
                            <div className="flex items-center gap-3 mb-2 text-blue-400">
                               <Globe size={18} />
                               <span className="text-[9px] font-black uppercase tracking-widest">Global Rank</span>
                            </div>
                            <span className="text-3xl font-mono text-white">Top 5%</span>
                         </div>
                      </div>
                   </motion.div>
                 ) : (
                   <motion.div key="visas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 auto-rows-min">
                         {stamps.length > 0 ? stamps.map(s => (
                            <ImmigrationStamp key={s.id} stamp={s} />
                         )) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                               <span className="text-4xl opacity-20 block mb-4">🛂</span>
                               <p className="text-xs font-black text-white/30 uppercase tracking-widest">No Visas Yet</p>
                            </div>
                         )}
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </motion.div>
    </div>
  );
};

export default Passport;
