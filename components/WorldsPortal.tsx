
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppSection, Language } from '../types';
import { ChevronRight, MapPin, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

// DATA POOLS FOR RANDOMIZATION
const LOCATIONS_COLOMBIA = [
  { id: 'comuna13', name: 'Comuna 13', desc: 'Practice street slang and graffiti art history.', icon: '🎨', color: 'from-orange-500 to-rose-600', task: 'Ask about the escalators', targetSection: AppSection.Speaking, btnText: 'Enter Speaking' },
  { id: 'parquearvi', name: 'Parque Arví', desc: 'Learn nature vocabulary in the cloud forest.', icon: '🌲', color: 'from-emerald-500 to-green-700', task: 'Identify 3 birds', targetSection: AppSection.Vocab, btnText: 'Enter Vocab' },
  { id: 'plazabotero', name: 'Plaza Botero', desc: 'Describe statues and artistic shapes.', icon: '🗿', color: 'from-amber-500 to-yellow-600', task: 'Describe a statue', targetSection: AppSection.Community, btnText: 'Enter Chat' },
  { id: 'provenza', name: 'Provenza', desc: 'Order food and drinks in a busy social setting.', icon: '🍹', color: 'from-pink-500 to-purple-600', task: 'Order a michelada', targetSection: AppSection.Speaking, btnText: 'Enter Speaking' },
  { id: 'metro', name: 'Metro de Medellín', desc: 'Navigate public transport directions.', icon: '🚝', color: 'from-slate-500 to-slate-700', task: 'Buy a ticket', targetSection: AppSection.Community, btnText: 'Enter Chat' },
];

const LOCATIONS_USA = [
  { id: 'times_square', name: 'Times Square', desc: 'Navigate chaos and read fast signs.', icon: '🚕', color: 'from-yellow-400 to-orange-500', task: 'Find a Broadway show', targetSection: AppSection.Community, btnText: 'Enter Chat' },
  { id: 'hollywood', name: 'Hollywood', desc: 'Talk about movies and celebrities.', icon: '🎬', color: 'from-purple-500 to-indigo-600', task: 'Find a star', targetSection: AppSection.Speaking, btnText: 'Enter Speaking' },
  { id: 'liberty', name: 'Statue of Liberty', desc: 'Discuss history and freedom concepts.', icon: '🗽', color: 'from-emerald-400 to-teal-600', task: 'Ask for the ferry', targetSection: AppSection.Vocab, btnText: 'Enter Vocab' },
  { id: 'grand_canyon', name: 'Grand Canyon', desc: 'Describe landscapes and vast nature.', icon: '🏜️', color: 'from-orange-600 to-red-700', task: 'Describe the depth', targetSection: AppSection.Speaking, btnText: 'Enter Speaking' },
  { id: 'disney', name: 'Disney World', desc: 'Family fun and fantasy vocabulary.', icon: '🏰', color: 'from-blue-400 to-cyan-500', task: 'Meet a character', targetSection: AppSection.Community, btnText: 'Enter Chat' },
];

const KIDS_REALM = { 
    id: 'kids_realm', 
    name: 'Kids Realm', 
    desc: 'Magical games and easy words for young learners.', 
    icon: '🦄', 
    color: 'from-pink-500 to-purple-600', 
    task: 'Play Games', 
    targetSection: AppSection.Kids, 
    btnText: 'Enter Fun' 
};

const WorldsPortal: React.FC<{ lang: Language, onNavigate: (s: AppSection) => void }> = ({ lang, onNavigate }) => {
  const [activeWorlds, setActiveWorlds] = useState<any[]>([]);

  // Randomize worlds on mount or language change
  useEffect(() => {
    // If interface is English (lang='en'), user learns Spanish -> Show Colombia
    // If interface is Spanish (lang='es'), user learns English -> Show USA
    const pool = lang === 'en' ? LOCATIONS_COLOMBIA : LOCATIONS_USA;
    
    // Shuffle and pick 2 standard locations, and always append Kids Realm as the 3rd option
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setActiveWorlds([...shuffled.slice(0, 2), KIDS_REALM]);
  }, [lang]);

  const text = {
    title: lang === 'es' ? 'Destinos de Inmersión' : 'Immersion Destinations',
    subtitle: lang === 'es' ? 'Viaja virtualmente y practica en situaciones reales.' : 'Travel virtually and practice in real situations.',
    mission: lang === 'es' ? 'Tu Misión:' : 'Your Mission:',
    usa: 'USA',
    col: 'Medellín'
  };

  const handleEnterWorld = (world: any) => {
      triggerHaptic('medium');
      onNavigate(world.targetSection); 
  };

  return (
    <div className="pb-40 pt-10 px-4">
      <header className="relative z-10 mb-16 text-center md:text-left space-y-4">
        <h2 className="text-6xl md:text-8xl font-display font-black text-white tracking-tighter italic uppercase leading-[0.85] drop-shadow-2xl">{text.title}</h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="w-16 h-1 bg-brand-500 hidden md:block" />
           <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">{text.subtitle}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
        {activeWorlds.map((world, idx) => (
          <motion.div
            key={world.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            whileHover={{ y: -12 }}
            onClick={() => handleEnterWorld(world)}
            className="group relative h-[500px] rounded-[64px] overflow-hidden cursor-pointer shadow-2xl"
          >
            {/* Card Background */}
            <div className="absolute inset-0 bg-slate-900 border border-white/10" />
            <div className={`absolute inset-0 bg-gradient-to-br ${world.color} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-700 rotate-12 text-[150px] leading-none select-none">{world.icon}</div>
            
            <div className="absolute inset-0 p-10 flex flex-col justify-between">
               {/* Top Badge */}
               <div className="flex justify-between items-start">
                  <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-md flex items-center justify-center text-5xl shadow-xl border border-white/20 group-hover:scale-110 transition-transform duration-500">
                     {world.icon}
                  </div>
                  <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                     <MapPin size={12} className="text-white"/>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {world.id === 'kids_realm' ? 'MAGIC' : (lang === 'en' ? text.col : text.usa)}
                     </span>
                  </div>
               </div>

               {/* Content */}
               <div className="space-y-6">
                  <div>
                    <h3 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic leading-none mb-3 group-hover:text-amber-300 transition-colors">
                      {world.name}
                    </h3>
                    <p className="text-slate-300 text-base font-medium leading-tight">
                      {world.desc}
                    </p>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                     <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">{text.mission}</p>
                     <p className="text-sm font-bold text-white flex items-center gap-2"><Zap size={14} className="text-yellow-400"/> {world.task}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white pt-4 border-t border-white/10 group-hover:text-brand-400 transition-colors">
                     <span>{world.btnText || 'Enter'}</span>
                     <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:translate-x-2 transition-transform">
                        <ChevronRight size={14} strokeWidth={4}/>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorldsPortal;
