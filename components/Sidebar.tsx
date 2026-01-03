
import React from 'react';
import { AppSection, Language } from '../types';
import { motion } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

interface SidebarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
  onLangToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate, lang, onLangToggle }) => {
  const items = [
    { id: AppSection.Home, label: lang === 'es' ? 'Bienvenida' : 'Welcome', icon: '🏠' },
    { id: AppSection.Lessons, label: lang === 'es' ? 'Lecciones' : 'Lessons', icon: '📚' },
    { id: AppSection.Speaking, label: lang === 'es' ? 'Entrenamiento' : 'Speaking', icon: '🎙️' },
    { id: AppSection.Vocab, label: lang === 'es' ? 'Léxico Pro' : 'Vocab Pro', icon: '🔖' },
    { id: AppSection.Coaching, label: lang === 'es' ? 'Tutorías' : 'Coaching', icon: '🤝' },
    { id: AppSection.Community, label: lang === 'es' ? 'Comunidad' : 'Community', icon: '🌎' },
    { id: AppSection.Kids, label: lang === 'es' ? 'Niños' : 'For Kids', icon: '🎈' },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: '📸', url: 'https://www.instagram.com/tmc_teacher/', color: 'hover:text-pink-400' },
    { name: 'WhatsApp', icon: '💬', url: 'https://wa.link/fhe3xu', color: 'hover:text-emerald-400' }
  ];

  return (
    <aside className="w-72 bg-slate-950/40 border-r border-white/5 flex flex-col h-screen sticky top-0 z-50 backdrop-blur-3xl">
      <div className="p-8 flex items-center gap-4">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-12 h-12 rounded-2xl colombia-gradient flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-xl shadow-blue-500/20"
        >
          C
        </motion.div>
        <div className="flex flex-col">
          <span className="font-black text-xl leading-tight tracking-tighter text-white uppercase italic">
            El Camino
          </span>
          <span className="font-bold text-[9px] text-blue-500 uppercase tracking-[0.25em]">
            with TMC teacher
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-6 overflow-y-auto hide-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
              activeSection === item.id
                ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20 shadow-sm'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {activeSection === item.id && (
              <motion.div 
                layoutId="activeSideGlow"
                className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full"
              />
            )}
            <span className={`text-2xl transition-transform duration-500 ${activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
            <span className="text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto space-y-4">
        {/* Social Links */}
        <div className="flex gap-2">
          {socialLinks.map((social) => (
            <a 
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 p-3 glass-morphism rounded-2xl flex items-center justify-center text-xl text-slate-400 transition-colors border-white/5 ${social.color}`}
              aria-label={social.name}
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Language Toggle */}
        <button 
          onClick={onLangToggle}
          className="w-full p-3 glass-morphism rounded-2xl flex items-center justify-between px-5 border-white/5 hover:border-white/20 transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
            {lang === 'es' ? 'Español' : 'English'}
          </span>
          <div className="flex gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${lang === 'es' ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${lang === 'en' ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
          </div>
        </button>

        <div className="p-5 bg-white/5 rounded-[28px] border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10 text-2xl">
                🧑🏽‍🏫
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950 shadow-sm"></div>
            </div>
            <div>
              <p className="text-sm font-black text-slate-100 tracking-tight leading-none">Tomas Martinez</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Professor Online</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
