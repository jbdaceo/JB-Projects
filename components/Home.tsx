
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Language, AppSection } from '../types';
import OptimizedImage from '../utils/performance';

interface HomeProps {
  onStart: () => void;
  onNavigate: (section: AppSection) => void;
  lang: Language;
}

const Home: React.FC<HomeProps> = ({ onStart, onNavigate, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas Particle Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    let h = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    
    const particles: {x: number, y: number, vx: number, vy: number}[] = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

        for (let i = 0; i < count; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Connect nearby
            for (let j = i + 1; j < count; j++) {
                let p2 = particles[j];
                let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    };

    const handleResize = () => {
        w = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        h = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    const animId = requestAnimationFrame(animate);
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-col h-full space-y-6 md:space-y-8 pb-12 font-sans relative">
      <div className="w-full overflow-hidden bg-white/5 py-2 border-y border-white/5 backdrop-blur-sm -mx-4 md:mx-0 px-4 md:rounded-2xl">
        <motion.div animate={{ x: ["100%", "-100%"] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="whitespace-nowrap flex gap-12">
          {["Vamo' con toda: English is your ticket to freedom.", "Bilingüismo = Independence. Speak your truth.", "Tomas Martinez: Training the next global generation.", "El Camino: From Colombia to the global stage."].map((m, i) => (
            <span key={i} className="text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-400 rounded-full"></span> {m}</span>
          ))}
        </motion.div>
      </div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: "circOut" }} className="relative h-[45vh] min-h-[400px] w-full rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl group active-scale border border-white/10">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-50" />
        <div className="absolute inset-0 z-[-1]">
            <OptimizedImage src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" alt="Future of education" priority={true} className="w-full h-full object-cover brightness-[0.4]" />
        </div>
        <div className="absolute bottom-6 right-6 z-20">
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} onClick={onStart} whileHover={{ scale: 1.1, rotate: 5, boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)" }} whileTap={{ scale: 0.9, rotate: -5 }} className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-3xl shadow-xl shadow-brand-500/30 border-2 border-white/20 text-white">🚀</motion.button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8 md:p-12 pointer-events-none">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-brand-300 border border-white/10 mb-4 inline-block">{lang === 'es' ? 'Bienvenido Estudiante' : 'Welcome Student'}</span>
            <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-2 tracking-tighter leading-[1.1] drop-shadow-lg">El Camino <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">Libertad.</span></h1>
            <p className="text-slate-300 text-sm md:text-lg max-w-lg leading-relaxed font-medium line-clamp-3">Tomas Martinez te entrena para ganar. <span className="text-white font-black">Inglés real</span> para sueldos globales.</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Action Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
            { icon: '💬', label: 'WhatsApp', sub: 'Group', color: 'bg-emerald-500/10 text-emerald-400', link: 'https://wa.link/fhe3xu' },
            { icon: '📸', label: 'Instagram', sub: '@immersive_learning', color: 'bg-pink-500/10 text-pink-400', link: 'https://www.instagram.com/tmc_teacher/' },
            { icon: '🤝', label: 'Coaching', sub: '1-on-1', color: 'bg-amber-500/10 text-amber-400', action: AppSection.Coaching },
            { icon: '🎙️', label: 'Speaking', sub: 'Practice', color: 'bg-cyan-500/10 text-cyan-400', action: AppSection.Speaking },
        ].map((item, idx) => {
            const isExternal = !!item.link;
            const handleClick = () => item.action && onNavigate(item.action);
            const content = (<><span className="text-3xl filter drop-shadow-md">{item.icon}</span><div><p className="font-black text-xs uppercase tracking-wider font-display">{item.label}</p><p className="text-[9px] opacity-70 font-bold uppercase">{item.sub}</p></div></>);
            const cardClass = `p-4 rounded-[24px] ${item.color} border border-white/5 flex flex-col items-center justify-center gap-2 text-center h-32 backdrop-blur-md`;
            
            return isExternal ? (
                <motion.a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className={cardClass} whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>{content}</motion.a>
            ) : (
                <motion.button key={idx} onClick={handleClick} className={cardClass} whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>{content}</motion.button>
            );
        })}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
        <h3 className="text-lg font-black text-white px-2 mt-4 font-display">{lang === 'es' ? 'Destacado' : 'Featured'}</h3>
        {[
          { icon: '🚀', title: lang === 'es' ? 'Futuro Global' : 'Global Future', desc: lang === 'es' ? 'Bolsa de Trabajo Bilingüe (0-3 Años).' : 'Bilingual Job Board (0-3 Years).', action: AppSection.Jobs }, 
          { icon: '🌎', title: lang === 'es' ? 'Sin Límites' : 'Limitless', desc: lang === 'es' ? 'El idioma no será obstáculo.' : 'No barriers.', action: AppSection.Worlds }
        ].map((card, idx) => (
          <motion.div 
            key={idx} 
            variants={item} 
            onClick={() => onNavigate(card.action)}
            whileHover={{ scale: 1.02, x: 5, backgroundColor: "rgba(15, 23, 42, 0.8)" }} 
            whileTap={{ scale: 0.98 }} 
            className="flex items-center gap-4 p-5 bg-slate-900/60 rounded-[28px] border border-white/5 backdrop-blur-sm cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shadow-inner border border-white/5">{card.icon}</div>
            <div><h3 className="font-black text-base text-white font-display">{card.title}</h3><p className="text-slate-500 text-xs font-medium">{card.desc}</p></div>
            <div className="ml-auto opacity-30 text-xl">→</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Home;
