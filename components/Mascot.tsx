
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import { AppSection, Language } from '../types';

interface MascotProps {
  activeSection: AppSection;
  lang: Language;
}

type MascotState = 'idle' | 'walking' | 'sleeping' | 'sitting' | 'pet' | 'eating' | 'drinking' | 'playing' | 'roaming';
type PetType = 'dog' | 'cat' | 'lion' | 'dragon' | 'shark' | 'frog';

const PETS: { id: PetType; label: string; icon: string }[] = [
  { id: 'dog', label: 'Poco', icon: '🐶' },
  { id: 'cat', label: 'Mish', icon: '🐱' },
  { id: 'lion', label: 'Leon', icon: '🦁' },
  { id: 'dragon', label: 'Drako', icon: '🦎' },
  { id: 'shark', label: 'Fin', icon: '🦈' },
  { id: 'frog', label: 'Pepe', icon: '🐸' },
];

const Mascot: React.FC<MascotProps> = ({ activeSection, lang }) => {
  const [petType, setPetType] = useState<PetType>('dog');
  const [state, setState] = useState<MascotState>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isVisible, setIsVisible] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [hearts, setHearts] = useState<{id: number, x: number, y: number}[]>([]);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const defaultDirection = isMobile ? 'right' : 'left';

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem('tmc_mascot_type');
    if (saved && PETS.some(p => p.id === saved)) {
      setPetType(saved as PetType);
    }
  }, []);

  const handlePetChange = (type: PetType) => {
    setPetType(type);
    localStorage.setItem('tmc_mascot_type', type);
    setShowPetSelector(false);
    setState('pet');
    setTimeout(() => setState('idle'), 1000);
  };

  // Behavior Loop
  useEffect(() => {
    if (!isVisible) return;
    
    // Initial state setup
    if (state === 'idle') {
       // Start idle breathing
    }

    const behaviorLoop = setInterval(() => {
      if (Math.random() > 0.6) return; 
      if (['roaming', 'eating', 'drinking', 'playing', 'pet'].includes(state)) return;

      const r = Math.random();
      let nextAction: MascotState = 'idle';
      
      if (r < 0.15) nextAction = 'eating';
      else if (r < 0.3) nextAction = 'drinking';
      else if (r < 0.45) nextAction = 'playing';
      else if (r < 0.65) nextAction = 'roaming';
      else if (r < 0.85) nextAction = 'sleeping';
      else nextAction = petType === 'shark' ? 'idle' : 'sitting';

      triggerAction(nextAction);
    }, 8000);

    return () => clearInterval(behaviorLoop);
  }, [isVisible, isMobile, state, petType, defaultDirection]);

  const triggerAction = (action: MascotState) => {
    setState(action);
    if (action === 'roaming') {
        setTimeout(() => {
            setState('walking'); 
            setTimeout(() => {
                setState(petType === 'shark' ? 'idle' : 'sitting');
                setDirection(defaultDirection);
            }, 2000);
        }, 6000);
    } else {
        setTimeout(() => setState('idle'), 4000);
    }
  };

  const handlePet = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isVisible) return;
    setState('pet');
    const newHeart = { id: Date.now(), x: Math.random() * 40 - 20, y: Math.random() * -40 - 20 };
    setHearts(prev => [...prev, newHeart]);
    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== newHeart.id)), 1000);
    setTimeout(() => setState('idle'), 800);
  };

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setShowPetSelector(false);
    }, 400); 
  };

  const uiText = {
    swap: lang === 'es' ? '🔄 Cambiar' : '🔄 Swap',
    hide: lang === 'es' ? 'Ocultar' : 'Hide',
    call: lang === 'es' ? 'Llamar Mascota' : 'Call Mascot',
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-28 left-4 lg:left-auto lg:bottom-6 lg:right-6 z-30 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl shadow-lg backdrop-blur-md hover:bg-white/20 transition-all opacity-50 hover:opacity-100"
        title={uiText.call}
      >
        🐾
      </button>
    );
  }

  // Animation Variants
  const getRoamVariants = () => {
    const roamDistance = isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 100 : 200) : -(typeof window !== 'undefined' ? window.innerWidth - 500 : 500);
    
    return {
      roaming: { 
        x: [0, roamDistance * 0.5, roamDistance, roamDistance, roamDistance * 0.5, 0],
        scaleX: isMobile ? [1, 1, 1, -1, -1, 1] : [1, 1, 1, -1, -1, 1],
        transition: { duration: 6, times: [0, 0.4, 0.45, 0.55, 0.9, 1] }
      },
      idle: { 
        x: 0, 
        scaleX: defaultDirection === 'left' ? 1 : -1,
        // Lifelike breathing
        scaleY: [1, 1.03, 1],
        transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      },
      walking: { x: 0 },
      sitting: { x: 0 },
      eating: { x: 0 },
      drinking: { x: 0 },
      playing: { x: 0 },
      sleeping: { x: 0, scaleY: 0.9 },
      pet: { x: 0, scale: 1.1 }
    };
  };

  return (
    <div 
      className="fixed z-30 bottom-28 left-4 lg:left-auto lg:bottom-8 lg:right-24 pointer-events-none w-24 h-24 lg:w-32 lg:h-32"
    >
      <motion.div
        className="relative w-full h-full cursor-pointer pointer-events-auto"
        onClick={handlePet}
        animate={state}
        variants={getRoamVariants()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 mb-4 flex flex-col gap-2 items-start min-w-[120px]"
            >
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPetSelector(!showPetSelector); }}
                  className="bg-slate-900/90 text-white text-[10px] px-3 py-1.5 rounded-xl border border-white/10 hover:bg-brand-600/50 backdrop-blur-md font-bold shadow-lg whitespace-nowrap"
                >
                  {uiText.swap}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                  className="bg-slate-900/90 text-slate-400 text-[10px] px-3 py-1.5 rounded-xl border border-white/10 hover:text-white hover:bg-red-500/20 backdrop-blur-md font-bold shadow-lg whitespace-nowrap"
                >
                  {uiText.hide}
                </button>
              </div>
              
              {showPetSelector && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-900/95 border border-white/10 rounded-xl p-2 grid grid-cols-3 gap-1 shadow-xl backdrop-blur-md w-40 mt-2"
                >
                  {PETS.map(p => (
                    <button
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); handlePetChange(p.id); }}
                      className={`p-2 rounded-lg text-lg flex flex-col items-center justify-center hover:bg-white/10 transition-colors ${petType === p.id ? 'bg-brand-500/20 ring-1 ring-brand-500' : ''}`}
                      title={p.label}
                    >
                      <span>{p.icon}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <PropsLayer state={state} />

        {hearts.map(h => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -60, scale: 1.5 }}
            className="absolute left-1/2 top-0 text-red-500 text-2xl font-black pointer-events-none z-50"
            style={{ x: h.x, y: h.y }}
          >
            ♥
          </motion.div>
        ))}

        {state === 'sleeping' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-6 right-0 z-20">
             {[0, 1].map(i => (
               <motion.span
                key={i}
                animate={{ x: [0, 10, 20], y: [0, -20, -40], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: i * 1.2, ease: "easeOut" }}
                className="absolute text-slate-400 font-black text-xs block"
               >
                 Zzz
               </motion.span>
             ))}
           </motion.div>
        )}

        <PetRenderer type={petType} state={state} defaultDirection={defaultDirection} />

      </motion.div>
    </div>
  );
};

const PropsLayer = ({ state }: { state: MascotState }) => (
  <AnimatePresence>
    {['eating', 'drinking'].includes(state) && (
      <motion.div 
        initial={{ opacity: 0, scale: 0 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0 }}
        className="absolute bottom-0 -left-6 w-10 h-6 z-10"
      >
        <svg viewBox="0 0 40 20" className="drop-shadow-lg">
          <path d="M0 0 Q 20 20 40 0 Z" fill={state === 'eating' ? "#78350f" : "#1e3a8a"} /> 
          <ellipse cx="20" cy="5" rx="15" ry="3" fill={state === 'eating' ? "#92400e" : "#3b82f6"} />
        </svg>
      </motion.div>
    )}
    {state === 'playing' && (
      <motion.div 
        initial={{ x: -20, y: -50, opacity: 0 }} 
        animate={{ x: [0, -40, -10, -50], y: [0, -30, 0, -10], opacity: 1 }} 
        exit={{ opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="absolute bottom-2 left-0 w-6 h-6 z-20"
      >
        <svg viewBox="0 0 20 20" className="drop-shadow-md">
          <circle cx="10" cy="10" r="10" fill="#ef4444" />
          <path d="M10 0 L10 20 M0 10 L20 10" stroke="#b91c1c" strokeWidth="2" />
        </svg>
      </motion.div>
    )}
  </AnimatePresence>
);

const PetRenderer = ({ type, state, defaultDirection }: { type: PetType, state: MascotState, defaultDirection: string }) => {
  const isWalking = ['walking', 'roaming'].includes(state);
  const isShark = type === 'shark';
  const isFrog = type === 'frog';

  const bodyAnim = isShark 
    ? { y: [0, -5, 0], rotate: [0, 2, 0] }
    : isFrog && isWalking
    ? { y: [0, -15, 0], scaleY: [0.8, 1.1, 0.8] }
    : isWalking
    ? { y: [0, -3, 0], rotate: [0, 1, -1, 0] }
    : state === 'playing'
    ? { y: [0, -15, 0], rotate: [0, -5, 5, 0] }
    : state === 'eating' || state === 'drinking'
    ? { y: 15, rotate: -15 }
    : { }; // Idle handled in parent variant

  const animDuration = isShark ? 1.5 : (isFrog && isWalking) ? 0.5 : isWalking ? 0.3 : 2;

  const renderInner = () => {
    switch(type) {
      case 'cat': return <CatSVG state={state} />;
      case 'lion': return <LionSVG state={state} />;
      case 'dragon': return <DragonSVG state={state} />;
      case 'shark': return <SharkSVG state={state} />;
      case 'frog': return <FrogSVG state={state} />;
      default: return <DogSVG state={state} />;
    }
  };

  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-full h-full drop-shadow-2xl" 
      style={{ transform: defaultDirection === 'right' ? 'scaleX(-1)' : 'none' }}
    >
      <motion.g animate={bodyAnim} transition={{ repeat: Infinity, duration: animDuration, ease: "easeInOut" }}>
        {renderInner()}
      </motion.g>
    </svg>
  );
};

// --- Individual Pet SVGs ---
// Key Fix: Tails are rendered BEFORE the body (lower in SVG stack) so they look attached behind.

const Bandana = ({ type = "neck" }: { type?: "neck" | "fin" | "bowtie" }) => {
  const dynamicColor = "hsl(var(--brand-hue) var(--brand-sat) 50%)";
  if (type === "fin") {
    return <path d="M45 55 L55 55 L50 70 Z" className="transition-colors duration-1000" fill={dynamicColor} stroke="none" />;
  }
  if (type === "bowtie") {
    return (
      <g className="transition-colors duration-1000" fill={dynamicColor}>
        <path d="M40 70 L25 65 L25 75 Z" />
        <path d="M40 70 L55 65 L55 75 Z" />
        <circle cx="40" cy="70" r="3" />
      </g>
    );
  }
  return <path d="M35 60 L50 75 L65 60" className="transition-colors duration-1000" fill={dynamicColor} stroke="none" />;
};

const DogSVG = ({ state }: { state: MascotState }) => (
  <>
    {/* Tail - Behind body, anchored deep at 50,60 */}
    <motion.path 
      d="M50 60 Q 30 50 25 35" 
      stroke="white" 
      strokeWidth="6" 
      strokeLinecap="round" 
      fill="none" 
      animate={['walking', 'roaming', 'playing'].includes(state) ? { rotate: [-10, 10, -10], d: "M50 60 Q 25 50 20 30" } : { rotate: [-2, 2, -2] }} 
      transition={{ repeat: Infinity, duration: 0.5 }} 
      style={{ originX: 0.5, originY: 0.6 }} // Relative to bounding box, approximates 50,60
    />
    {/* Legs */}
    <motion.path d="M65 85 L65 95" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M40 85 L40 95" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    {/* Body */}
    <ellipse cx="50" cy="70" rx="30" ry="20" fill="#f8fafc" />
    <motion.path d="M60 85 L60 95" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M35 85 L35 95" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <Bandana />
    {/* Head */}
    <g transform="translate(25, 35)">
      <motion.g animate={['eating', 'drinking'].includes(state) ? { rotate: 10 } : {}}>
        <ellipse cx="10" cy="10" rx="6" ry="12" fill="#e2e8f0" transform="rotate(-20 10 10)" />
        <ellipse cx="40" cy="10" rx="6" ry="12" fill="#e2e8f0" transform="rotate(20 40 10)" />
        <rect x="5" y="5" width="40" height="35" rx="15" fill="#f8fafc" />
        <Eyes state={state} cx1={18} cx2={32} cy={20} />
        <ellipse cx="25" cy="28" rx="8" ry="6" fill="#cbd5e1" opacity="0.5" />
        <circle cx="25" cy="26" r="3" fill="#0f172a" />
        {['eating', 'drinking', 'pet'].includes(state) && <path d="M22 32 Q 25 38 28 32" fill="#fda4af" stroke="#be123c" strokeWidth="1" />}
      </motion.g>
    </g>
  </>
);

const CatSVG = ({ state }: { state: MascotState }) => (
  <>
    {/* Tail - Behind body */}
    <motion.path d="M50 65 C 30 65, 30 25, 50 20" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" animate={{ rotate: [0, 5, 0], d: ["M50 65 C 30 65, 30 25, 50 20", "M50 65 C 25 65, 35 20, 55 15", "M50 65 C 30 65, 30 25, 50 20"] }} transition={{ repeat: Infinity, duration: 2 }} style={{ originX: 0.5, originY: 0.65 }} />
    <motion.path d="M65 85 L65 95" stroke="white" strokeWidth="6" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M40 85 L40 95" stroke="white" strokeWidth="6" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <ellipse cx="50" cy="70" rx="28" ry="18" fill="#f8fafc" />
    <motion.path d="M60 85 L60 95" stroke="white" strokeWidth="6" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M35 85 L35 95" stroke="white" strokeWidth="6" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <Bandana />
    <g transform="translate(25, 40)">
      <motion.g animate={['eating', 'drinking'].includes(state) ? { rotate: 10 } : {}}>
        <path d="M5 10 L15 0 L25 10" fill="#f8fafc" />
        <path d="M25 10 L35 0 L45 10" fill="#f8fafc" />
        <rect x="5" y="10" width="40" height="30" rx="15" fill="#f8fafc" />
        <Eyes state={state} cx1={15} cx2={35} cy={20} />
        <path d="M25 25 L20 28 L25 28 L30 28 Z" fill="#pink-300" />
        <path d="M10 25 L5 22 M10 28 L2 28 M30 25 L45 22 M30 28 L48 28" stroke="#cbd5e1" strokeWidth="1" />
        {['eating', 'drinking', 'pet'].includes(state) && <path d="M22 32 Q 25 38 28 32" fill="#fda4af" stroke="#be123c" strokeWidth="1" />}
      </motion.g>
    </g>
  </>
);

const LionSVG = ({ state }: { state: MascotState }) => (
  <>
    <motion.g animate={{ rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ originX: 0.5, originY: 0.65 }}>
      <path d="M50 65 Q 30 55 25 40" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="40" r="4" fill="white" />
    </motion.g>
    <motion.path d="M65 85 L65 95" stroke="white" strokeWidth="9" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M40 85 L40 95" stroke="white" strokeWidth="9" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <ellipse cx="50" cy="70" rx="32" ry="22" fill="#f8fafc" />
    <motion.path d="M60 85 L60 95" stroke="white" strokeWidth="9" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M35 85 L35 95" stroke="white" strokeWidth="9" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { y: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <Bandana />
    <g transform="translate(15, 25)">
      <motion.g animate={['eating', 'drinking'].includes(state) ? { rotate: 10 } : {}}>
        <circle cx="30" cy="25" r="28" fill="#e2e8f0" /> 
        <circle cx="30" cy="25" r="22" fill="#f8fafc" />
        <circle cx="15" cy="10" r="5" fill="#e2e8f0" />
        <circle cx="45" cy="10" r="5" fill="#e2e8f0" />
        <Eyes state={state} cx1={20} cx2={40} cy={22} />
        <path d="M25 30 Q 30 35 35 30" fill="none" stroke="#0f172a" strokeWidth="2" />
        <circle cx="30" cy="28" r="3" fill="#0f172a" />
        {['eating', 'drinking', 'pet'].includes(state) && <path d="M25 35 Q 30 40 35 35" fill="#fda4af" stroke="#be123c" strokeWidth="1" />}
      </motion.g>
    </g>
  </>
);

const DragonSVG = ({ state }: { state: MascotState }) => (
  <>
    <motion.path d="M50 70 Q 25 65 20 45" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" animate={{ rotate: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ originX: 0.5, originY: 0.7 }} />
    <motion.path d="M65 80 L70 90" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { x: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M40 80 L35 90" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { x: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <ellipse cx="55" cy="75" rx="35" ry="15" fill="#f8fafc" />
    <motion.path d="M60 80 L65 90" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { x: [2, -2, 2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <motion.path d="M30 80 L25 90" stroke="white" strokeWidth="8" strokeLinecap="round" animate={['walking', 'roaming'].includes(state) ? { x: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 0.3 }}/>
    <Bandana />
    <g transform="translate(5, 50)">
      <motion.g animate={['eating', 'drinking'].includes(state) ? { rotate: 10 } : {}}>
        <ellipse cx="20" cy="15" rx="20" ry="12" fill="#f8fafc" />
        <Eyes state={state} cx1={15} cx2={25} cy={10} />
        {['eating', 'drinking', 'pet', 'idle'].includes(state) && (
           <motion.path d="M2 18 L-5 15 L-5 21 Z" fill="#ef4444" animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} /> 
        )}
      </motion.g>
    </g>
  </>
);

const SharkSVG = ({ state }: { state: MascotState }) => (
  <>
    <motion.g transform="translate(80, 50)" animate={{ rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
       <path d="M0 0 L15 -15 L15 15 Z" fill="#e2e8f0" />
    </motion.g>
    <path d="M45 40 L55 15 L65 40 Z" fill="#e2e8f0" />
    <ellipse cx="50" cy="50" rx="40" ry="20" fill="#f8fafc" />
    <path d="M40 60 L35 75 L55 65 Z" fill="#e2e8f0" />
    <Bandana type="fin" />
    <g transform="translate(15, 45)">
       <Eyes state={state} cx1={5} cx2={5} cy={0} />
       <circle cx="5" cy="0" r="3" fill="#1e293b" />
       <path d="M15 -5 L15 5 M20 -5 L20 5" stroke="#cbd5e1" strokeWidth="2" />
    </g>
  </>
);

const FrogSVG = ({ state }: { state: MascotState }) => (
  <>
    <path d="M65 75 Q 80 65 80 85 L 70 85" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
    <ellipse cx="50" cy="70" rx="25" ry="20" fill="#f8fafc" />
    <path d="M35 80 L30 90" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path d="M65 80 L70 90" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <Bandana type="bowtie" />
    <g transform="translate(25, 40)">
      <circle cx="10" cy="10" r="8" fill="#f8fafc" />
      <circle cx="40" cy="10" r="8" fill="#f8fafc" />
      <Eyes state={state} cx1={10} cx2={40} cy={10} />
      <path d="M15 25 Q 25 30 35 25" fill="none" stroke="#0f172a" strokeWidth="2" />
      {['eating', 'drinking', 'pet'].includes(state) && <path d="M25 25 Q 30 35 25 35" fill="#fda4af" stroke="#be123c" strokeWidth="1" />}
    </g>
  </>
);

// Added random blinking logic to Eyes
const Eyes = ({ state, cx1, cx2, cy }: { state: MascotState, cx1: number, cx2: number, cy: number }) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, Math.random() * 4000 + 2000);
    return () => clearInterval(timer);
  }, []);

  const eyeScale = state === 'sleeping' ? 0.1 : blink ? 0.1 : 1;
  const eyeVariants = {
    normal: { scaleY: eyeScale },
    pet: { scaleX: 1.1, scaleY: 1.2 }
  };

  return (
    <motion.g 
      animate={state === 'pet' ? 'pet' : 'normal'}
      variants={eyeVariants}
      transition={{ duration: 0.1 }}
    >
      <circle cx={cx1} cy={cy} r="3" fill="#1e293b" />
      <circle cx={cx2} cy={cy} r="3" fill="#1e293b" />
    </motion.g>
  );
};

export default Mascot;
