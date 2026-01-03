
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';
import confetti from 'https://esm.sh/canvas-confetti@1.9.2';
import { Language } from '../types';
import { getPronunciation, decodeBase64Audio, decodeAudioData } from '../services/gemini';

interface KidsZoneProps {
  lang: Language;
}

// --- Data Structures ---

interface WordItem {
  id: number;
  word: string;
  translation: string;
  emoji: string;
  level: number;
  hintEn: string;
  hintEs: string;
  factEn: string;
  factEs: string;
}

interface ConversationItem {
  id: number;
  level: number;
  scenarioEn: string;
  scenarioEs: string;
  botEn: string;
  botEs: string;
  optionsEn: string[];
  optionsEs: string[];
  answerEn: string;
  answerEs: string;
}

interface GameShow {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  gradient: string;
  icon: string;
  type: 'conversation' | 'quiz' | 'match' | 'spell' | 'listen';
}

// --- Content Pools ---

const GAME_SHOWS: GameShow[] = [
  { id: 'voice_voyager', titleEn: 'Chat Champion', titleEs: 'Campeón de Chat', descriptionEn: 'Pick the right reply!', descriptionEs: '¡Elige la respuesta!', gradient: 'from-cyan-400 to-blue-600', icon: '💬', type: 'conversation' },
  { id: 'trivia_titan', titleEn: 'Trivia Titan', titleEs: 'Titán de Trivia', descriptionEn: 'Choose the best answer.', descriptionEs: 'Elige la mejor respuesta.', gradient: 'from-violet-500 to-purple-700', icon: '🧠', type: 'quiz' },
  { id: 'match_master', titleEn: 'Match Master', titleEs: 'Maestro de Parejas', descriptionEn: 'Find the translation.', descriptionEs: 'Encuentra la traducción.', gradient: 'from-emerald-400 to-green-600', icon: '🧩', type: 'match' },
  { id: 'word_wizard', titleEn: 'Word Wizard', titleEs: 'Mago de Letras', descriptionEn: 'Unscramble the magic.', descriptionEs: 'Ordena la magia.', gradient: 'from-amber-400 to-orange-600', icon: '🧙‍♂️', type: 'spell' },
  { id: 'sonic_scout', titleEn: 'Sonic Scout', titleEs: 'Explorador Sónico', descriptionEn: 'Listen and choose.', descriptionEs: 'Escucha y elige.', gradient: 'from-pink-500 to-rose-600', icon: '🎧', type: 'listen' },
];

const LEARN_POOL: WordItem[] = [
  { id: 1, level: 1, emoji: '🍎', word: 'Apple', translation: 'Manzana', hintEn: 'I am a red fruit that grows on trees. Snow White ate me. What am I?', hintEs: 'Soy una fruta roja que crece en los árboles. Blancanieves me comió. ¿Qué soy?', factEn: 'Apples float in water because they are 25% air.', factEs: 'Las manzanas flotan porque son 25% aire.' },
  { id: 2, level: 1, emoji: '🐶', word: 'Dog', translation: 'Perro', hintEn: 'I bark, chase my tail, and I am known as your best friend. What am I?', hintEs: 'Ladro, persigo mi cola y soy tu mejor amigo. ¿Qué soy?', factEn: 'Dogs have a sense of time!', factEs: '¡Los perros tienen sentido del tiempo!' },
  { id: 3, level: 1, emoji: '🐱', word: 'Cat', translation: 'Gato', hintEn: 'I have whiskers, say "Meow", and love to chase laser pointers. Who am I?', hintEs: 'Tengo bigotes, digo "Miau" y persigo láseres. ¿Quién soy?', factEn: 'Cats sleep for 70% of their lives.', factEs: 'Los gatos duermen el 70% de sus vidas.' },
  { id: 4, level: 2, emoji: '🚗', word: 'Car', translation: 'Carro', hintEn: 'I have four wheels, an engine, and take you places fast. What am I?', hintEs: 'Tengo cuatro ruedas, un motor y te llevo rápido. ¿Qué soy?', factEn: 'The first cars didn’t have steering wheels.', factEs: 'Los primeros carros no tenían volante.' },
  { id: 5, level: 2, emoji: '🏠', word: 'House', translation: 'Casa', hintEn: 'I have a roof, windows, and doors. You sleep inside me. What am I?', hintEs: 'Tengo techo, ventanas y puertas. Duermes dentro de mí. ¿Qué soy?', factEn: 'Some houses are made of ice!', factEs: '¡Algunas casas están hechas de hielo!' },
  { id: 6, level: 3, emoji: '🌞', word: 'Sun', translation: 'Sol', hintEn: 'I am a giant hot star that gives you light during the day. What am I?', hintEs: 'Soy una estrella gigante y caliente que te da luz de día. ¿Qué soy?', factEn: 'The sun is a star found at the center of the Solar System.', factEs: 'El sol es una estrella en el centro del sistema solar.' },
  { id: 7, level: 3, emoji: '🥛', word: 'Milk', translation: 'Leche', hintEn: 'I am white, liquid, and come from a cow. You put me in cereal. What am I?', hintEs: 'Soy blanca, líquida y vengo de la vaca. Me pones en el cereal. ¿Qué soy?', factEn: 'Milk builds strong bones.', factEs: 'La leche fortalece los huesos.' },
  { id: 8, level: 4, emoji: '🦁', word: 'Lion', translation: 'León', hintEn: 'I have a big mane, I roar loud, and I rule the jungle. Who am I?', hintEs: 'Tengo una gran melena, rujo fuerte y mando en la selva. ¿Quién soy?', factEn: 'A lion’s roar can be heard from 5 miles away.', factEs: 'El rugido de un león se escucha a 8 km.' },
  { id: 9, level: 4, emoji: '🚀', word: 'Rocket', translation: 'Cohete', hintEn: 'I blast off with fire and take astronauts to the moon. What am I?', hintEs: 'Despego con fuego y llevo astronautas a la luna. ¿Qué soy?', factEn: 'Rockets help astronauts reach the moon.', factEs: 'Los cohetes llevan astronautas a la luna.' },
  { id: 10, level: 5, emoji: '🌈', word: 'Rainbow', translation: 'Arcoíris', hintEn: 'I appear after rain with many colors in the sky. I am not solid. What am I?', hintEs: 'Salgo después de la lluvia con muchos colores. ¿Qué soy?', factEn: 'No two people see the exact same rainbow.', factEs: 'Nadie ve el mismo arcoíris exactamente igual.' },
  { id: 11, level: 5, emoji: '🦋', word: 'Butterfly', translation: 'Mariposa', hintEn: 'I used to be a crawling caterpillar, but now I fly with colorful wings. What am I?', hintEs: 'Antes era una oruga, ahora vuelo con alas de colores. ¿Qué soy?', factEn: 'Butterflies taste with their feet.', factEs: 'Las mariposas saborean con sus patas.' },
  { id: 12, level: 6, emoji: '🍦', word: 'Ice Cream', translation: 'Helado', hintEn: 'I am cold, sweet, scoopable, and melt in the sun. What am I?', hintEs: 'Soy frío, dulce y me derrito al sol. ¿Qué soy?', factEn: 'The most popular flavor is vanilla.', factEs: 'El sabor más popular es vainilla.' },
  { id: 13, level: 6, emoji: '🐘', word: 'Elephant', translation: 'Elefante', hintEn: 'I am huge, gray, and have a very long nose called a trunk. Who am I?', hintEs: 'Soy enorme, gris y tengo una nariz muy larga. ¿Quién soy?', factEn: 'Elephants are the only mammals that can’t jump.', factEs: 'Los elefantes no pueden saltar.' },
  { id: 14, level: 7, emoji: '🎸', word: 'Guitar', translation: 'Guitarra', hintEn: 'I have strings and a body. Strum me to make music. What am I?', hintEs: 'Tengo cuerdas y cuerpo. Tócame para hacer música. ¿Qué soy?', factEn: 'The smallest guitar is only 10 microns long.', factEs: 'La guitarra más pequeña mide solo 10 micras.' },
  { id: 15, level: 7, emoji: '🚂', word: 'Train', translation: 'Tren', hintEn: 'I run on tracks, say "Choo Choo", and pull many cars. What am I?', hintEs: 'Corro sobre rieles, digo "Chu Chu" y jalo vagones. ¿Qué soy?', factEn: 'Some trains float on magnets.', factEs: 'Algunos trenes flotan sobre imanes.' },
  { id: 16, level: 8, emoji: '🌋', word: 'Volcano', translation: 'Volcán', hintEn: 'I look like a mountain but I can erupt with hot lava. What am I?', hintEs: 'Parezco montaña pero hago erupción con lava. ¿Qué soy?', factEn: 'There are volcanoes under the ocean.', factEs: 'Hay volcanes bajo el océano.' },
  { id: 17, level: 8, emoji: '🦖', word: 'Dinosaur', translation: 'Dinosaurio', hintEn: 'I am a giant reptile from millions of years ago. I am extinct. Who am I?', hintEs: 'Soy un reptil gigante de hace millones de años. Estoy extinto. ¿Quién soy?', factEn: 'Birds evolved from dinosaurs.', factEs: 'Las aves evolucionaron de los dinosaurios.' },
  { id: 18, level: 9, emoji: '👨‍🚀', word: 'Astronaut', translation: 'Astronauta', hintEn: 'I wear a helmet and float in zero gravity. Who am I?', hintEs: 'Uso casco y floto en gravedad cero. ¿Quién soy?', factEn: 'Astronauts can grow taller in space.', factEs: 'Los astronautas pueden crecer en el espacio.' },
  { id: 19, level: 9, emoji: '💎', word: 'Diamond', translation: 'Diamante', hintEn: 'I am the hardest stone on earth, clear and sparkly. What am I?', hintEs: 'Soy la piedra más dura, clara y brillante. ¿Qué soy?', factEn: 'Diamonds are made of carbon.', factEs: 'Los diamantes están hechos de carbono.' },
  { id: 20, level: 10, emoji: '🤖', word: 'Robot', translation: 'Robot', hintEn: 'I am made of metal, have wires, and act like a human. What am I?', hintEs: 'Hecho de metal, tengo cables y actúo como humano. ¿Qué soy?', factEn: 'The word robot comes from "robota" meaning work.', factEs: 'La palabra robot viene de "trabajo".' },
];

const CONVERSATION_POOL: ConversationItem[] = [
  { id: 1, level: 1, scenarioEn: "Greeting", scenarioEs: "Saludo", botEn: "Hello! How are you today?", botEs: "¡Hola! ¿Cómo estás hoy?", optionsEn: ["I am happy!", "I am a table.", "Goodbye."], optionsEs: ["¡Estoy feliz!", "Soy una mesa.", "Adiós."], answerEn: "I am happy!", answerEs: "¡Estoy feliz!" },
  { id: 2, level: 1, scenarioEn: "Name", scenarioEs: "Nombre", botEn: "What is your name?", botEs: "¿Cómo te llamas?", optionsEn: ["My name is Sam.", "Yes, please.", "Red."], optionsEs: ["Me llamo Sam.", "Sí, por favor.", "Rojo."], answerEn: "My name is Sam.", answerEs: "Me llamo Sam." },
  { id: 3, level: 2, scenarioEn: "Food", scenarioEs: "Comida", botEn: "Do you like pizza?", botEs: "¿Te gusta la pizza?", optionsEn: ["Yes, it is yummy!", "I am pizza.", "Wall."], optionsEs: ["¡Sí, es rica!", "Soy pizza.", "Pared."], answerEn: "Yes, it is yummy!", answerEs: "¡Sí, es rica!" },
  { id: 4, level: 2, scenarioEn: "Activity", scenarioEs: "Actividad", botEn: "Let's play soccer!", botEs: "¡Juguemos fútbol!", optionsEn: ["Okay, let's go!", "I am sleeping.", "Yellow."], optionsEs: ["¡Ok, vamos!", "Estoy durmiendo.", "Amarillo."], answerEn: "Okay, let's go!", answerEs: "¡Ok, vamos!" },
  { id: 5, level: 3, scenarioEn: "Color", scenarioEs: "Color", botEn: "What is your favorite color?", botEs: "¿Cuál es tu color favorito?", optionsEn: ["I like blue.", "Apple.", "Run."], optionsEs: ["Me gusta el azul.", "Manzana.", "Correr."], answerEn: "I like blue.", answerEs: "Me gusta el azul." },
  { id: 6, level: 4, scenarioEn: "Time", scenarioEs: "Hora", botEn: "Is it time for lunch?", botEs: "¿Es hora del almuerzo?", optionsEn: ["Yes, I am hungry.", "My cat is flying.", "Chair."], optionsEs: ["Sí, tengo hambre.", "Mi gato vuela.", "Silla."], answerEn: "Yes, I am hungry.", answerEs: "Sí, tengo hambre." },
  { id: 7, level: 5, scenarioEn: "Pets", scenarioEs: "Mascotas", botEn: "Do you have a dog?", botEs: "¿Tienes un perro?", optionsEn: ["No, I have a cat.", "I like clouds.", "Tuesday."], optionsEs: ["No, tengo un gato.", "Me gustan las nubes.", "Martes."], answerEn: "No, I have a cat.", answerEs: "No, tengo un gato." },
  { id: 8, level: 6, scenarioEn: "Feelings", scenarioEs: "Sentimientos", botEn: "Why are you crying?", botEs: "¿Por qué lloras?", optionsEn: ["I am sad.", "I am happy.", "I am a banana."], optionsEs: ["Estoy triste.", "Estoy feliz.", "Soy una banana."], answerEn: "I am sad.", answerEs: "Estoy triste." },
  { id: 9, level: 7, scenarioEn: "Directions", scenarioEs: "Direcciones", botEn: "Where is the library?", botEs: "¿Dónde está la biblioteca?", optionsEn: ["Down the street.", "Up the sky.", "In my shoe."], optionsEs: ["Al final de la calle.", "En el cielo.", "En mi zapato."], answerEn: "Down the street.", answerEs: "Al final de la calle." },
  { id: 10, level: 8, scenarioEn: "Future", scenarioEs: "Futuro", botEn: "What will you be when you grow up?", botEs: "¿Qué serás cuando crezcas?", optionsEn: ["An astronaut.", "A baby.", "Yesterday."], optionsEs: ["Un astronauta.", "Un bebé.", "Ayer."], answerEn: "An astronaut.", answerEs: "Un astronauta." },
];

const SUPPORT_MESSAGES = [
  "Almost there!",
  "Try again!",
  "Keep going!",
  "You can do it!",
  "So close!"
];

const UPLIFTING_PHRASES = [
  { en: "You are a genius!", es: "¡Eres un genio!" },
  { en: "Amazing job!", es: "¡Trabajo increíble!" },
  { en: "You shine so bright!", es: "¡Brillas mucho!" },
  { en: "Superstar performance!", es: "¡Actuación de superestrella!" },
  { en: "You are unstoppable!", es: "¡Eres imparable!" },
  { en: "Fantastic!", es: "¡Fantástico!" },
  { en: "So smart!", es: "¡Qué inteligente!" },
  { en: "You've got the power!", es: "¡Tienes el poder!" }
];

// --- Helper Functions ---
const t = (en: string, es: string, lang: Language) => lang === 'es' ? es : en;

const triggerFireworks = () => {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  
  const fire = (particleRatio: number, opts: any) => {
    confetti({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio),
      zIndex: 200,
    });
  };

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    
    confetti({ 
      particleCount: 2, 
      angle: 60, 
      spread: 55, 
      origin: { x: 0 },
      colors: ['#22d3ee', '#34d399', '#f472b6']
    });
    confetti({ 
      particleCount: 2, 
      angle: 120, 
      spread: 55, 
      origin: { x: 1 },
      colors: ['#22d3ee', '#34d399', '#f472b6']
    });
  }, 50);
};

const triggerScreenShake = (type: 'success' | 'error') => {
  const body = document.body;
  if (type === 'success') {
    body.style.animation = 'shake-vertical 0.5s ease-in-out';
  } else {
    body.style.animation = 'shake-horizontal 0.4s ease-in-out';
  }
  
  // Create styles if not exist
  if (!document.getElementById('shake-styles')) {
    const style = document.createElement('style');
    style.id = 'shake-styles';
    style.innerHTML = `
      @keyframes shake-horizontal {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        50% { transform: translateX(10px); }
        75% { transform: translateX(-10px); }
      }
      @keyframes shake-vertical {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-15px); }
        50% { transform: translateY(5px); }
        75% { transform: translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    body.style.animation = '';
  }, 500);
};

// --- Components ---

const CuteDragon = ({ state }: { state: 'idle' | 'talking' | 'happy' | 'listening' | 'supporting' }) => {
  const bodyVariants = {
    idle: { y: [0, -3, 0], rotate: [0, 1, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    happy: { y: [0, -20, 0], rotate: [0, -5, 5, 0], scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.6 } },
    supporting: { rotate: [0, 5, -5, 0], y: [0, 2, 0], transition: { duration: 2, repeat: Infinity } }, 
    talking: { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 0.3 } },
    listening: { rotate: 5, x: 5, transition: { duration: 0.5 } }
  };

  const armVariants = {
    idle: { rotate: 0 },
    happy: { rotate: -140, y: -10 }, 
    supporting: { rotate: -45, x: 5, y: -5 },
    talking: { rotate: -20, y: -2 },
    listening: { rotate: -100, x: 10, y: -15 }
  };

  return (
    <motion.svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-2xl overflow-visible pointer-events-none">
      <motion.g animate={state} variants={bodyVariants} style={{ originX: 0.5, originY: 0.8 }}>
        <path d="M150 180 Q 190 180 190 140 Q 190 100 160 120" stroke="#a855f7" strokeWidth="20" strokeLinecap="round" fill="none" />
        <ellipse cx="70" cy="190" rx="15" ry="10" fill="#9333ea" />
        <ellipse cx="130" cy="190" rx="15" ry="10" fill="#9333ea" />
        <ellipse cx="100" cy="140" rx="55" ry="65" fill="#a855f7" />
        <ellipse cx="100" cy="145" rx="35" ry="45" fill="#4ade80" />
        <motion.g variants={armVariants}>
           <path d="M55 130 Q 30 150 40 160" stroke="#a855f7" strokeWidth="15" strokeLinecap="round" fill="none" />
        </motion.g>
        <motion.g variants={armVariants} style={{ scaleX: -1, originX: 0.5 }}>
           <path d="M145 130 Q 170 150 160 160" stroke="#a855f7" strokeWidth="15" strokeLinecap="round" fill="none" />
        </motion.g>
        <g transform="translate(100, 70)">
           <circle cx="0" cy="0" r="45" fill="#a855f7" />
           <ellipse cx="0" cy="15" rx="25" ry="15" fill="#d8b4fe" />
           <circle cx="-10" cy="10" r="3" fill="#6b21a8" opacity="0.5" />
           <circle cx="10" cy="10" r="3" fill="#6b21a8" opacity="0.5" />
           <g transform="translate(0, -10)">
             <circle cx="-15" cy="0" r="10" fill="white" />
             <circle cx="15" cy="0" r="10" fill="white" />
             <motion.circle 
                cx="-13" cy="0" r="4" fill="black" 
                animate={state === 'listening' ? { cx: -11 } : { cx: -13 }}
             />
             <motion.circle 
                cx="13" cy="0" r="4" fill="black" 
                animate={state === 'listening' ? { cx: 15 } : { cx: 13 }}
             />
           </g>
           <motion.path 
             stroke="#6b21a8" 
             strokeWidth="3" 
             strokeLinecap="round" 
             fill="none"
             animate={
               state === 'happy' ? { d: "M-15 25 Q 0 40 15 25" } : 
               state === 'supporting' ? { d: "M-10 30 Q 0 35 10 30" } : 
               state === 'talking' ? { d: ["M-10 25 Q 0 35 10 25", "M-10 30 Q 0 20 10 30"] } :
               { d: "M-10 25 Q 0 30 10 25" } 
             }
           />
           <path d="M0 -45 L-5 -55 L5 -55 Z" fill="#facc15" />
           <path d="M-20 -40 L-25 -50 L-15 -50 Z" fill="#facc15" transform="rotate(-20)" />
           <path d="M20 -40 L15 -50 L25 -50 Z" fill="#facc15" transform="rotate(20)" />
        </g>
      </motion.g>
    </motion.svg>
  );
};

const KidsZone: React.FC<KidsZoneProps> = ({ lang }) => {
  const [view, setView] = useState<'menu' | 'learn' | 'gameshow'>('menu');
  
  // --- Shared State ---
  const [userLevel, setUserLevel] = useState(1);
  const [dragonState, setDragonState] = useState<'idle' | 'talking' | 'happy' | 'listening' | 'supporting'>('idle');
  const [dragonMessage, setDragonMessage] = useState<string>('');
  
  // --- Learn Mode State ---
  const [learnIndex, setLearnIndex] = useState(0);
  
  // --- Game Show State ---
  const [selectedShow, setSelectedShow] = useState<GameShow | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameLevel, setGameLevel] = useState(1);
  const [gameQuestion, setGameQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState<number[]>([]);
  
  // --- Help State ---
  const [highlightedAnswer, setHighlightedAnswer] = useState<string | null>(null);
  const [robotMessage, setRobotMessage] = useState<string | null>(null);
  const [petMessage, setPetMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tmc_kids_level');
    if (saved) setUserLevel(parseInt(saved));
  }, []);

  useEffect(() => {
    const handleHelpRequest = (e: CustomEvent) => {
      if (view === 'gameshow' && selectedShow) {
        handleHelp(e.detail.source);
      } else if (view === 'learn') {
        handleHelp(e.detail.source);
      }
    };
    
    window.addEventListener('tmc-help-request', handleHelpRequest as EventListener);
    return () => window.removeEventListener('tmc-help-request', handleHelpRequest as EventListener);
  }, [view, selectedShow, gameQuestion, learnIndex]);

  // Audio helper for listening game
  useEffect(() => {
    if (view === 'gameshow' && selectedShow?.type === 'listen' && gameQuestion?.rawItem?.word) {
        // Auto play on new question
        setTimeout(() => {
            playAudio(gameQuestion.rawItem.word);
        }, 800);
    }
  }, [gameQuestion, selectedShow, view]);

  const speak = useCallback((text: string) => {
    setDragonMessage(text);
    setDragonState('talking');
    setTimeout(() => {
        setDragonState('idle');
    }, 4000);
  }, []);

  const playAudio = async (text: string) => {
    try {
      setDragonState('talking');
      const base64 = await getPronunciation(text); 
      if (!base64) {
        setDragonState('idle');
        return;
      }
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decodeBase64Audio(base64), audioContext);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      source.onended = () => setDragonState('idle');
    } catch (e) {
      console.error(e);
      setDragonState('idle');
    }
  };

  const playRewardSequence = async (word: string, translation: string) => {
    setDragonState('happy');
    window.dispatchEvent(new Event('tmc-mascot-happy'));
    await playAudio(word);
    setDragonState('idle');
  };

  // --- Game Show Logic ---
  const startGameShow = (show: GameShow) => {
    setSelectedShow(show);
    setGameScore(0);
    setGameLevel(1);
    setHighlightedAnswer(null);
    setDragonMessage('');
    setUsedQuestionIds([]); // Reset session tracking
    generateGameQuestion(show, []); // Pass empty list initially
  };

  const getOptions = (correctItem: WordItem, count: number, mode: 'english_words') => {
    // Get unique distractors excluding current item
    const distractors = LEARN_POOL.filter(i => i.id !== correctItem.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
    
    // IF lang is 'en', we want to learn SPANISH, so options should be Spanish
    const isEnglishUser = lang === 'en';
    const correctVal = isEnglishUser ? correctItem.translation : correctItem.word;
    const options = distractors.map(d => isEnglishUser ? d.translation : d.word);
    
    // Shuffle all
    return [...options, correctVal].sort(() => 0.5 - Math.random());
  };

  const generateGameQuestion = (show: GameShow, currentUsedIds: number[] = usedQuestionIds) => {
    let questionData: any = {};
    const difficultyTier = Math.min(10, Math.ceil(userLevel / 10));

    // For simplicity in this logic, we assume English User -> Learns Spanish
    const isEnglishUser = lang === 'en';

    if (show.type === 'conversation') {
      let availablePool = CONVERSATION_POOL.filter(p => !currentUsedIds.includes(p.id) && p.level <= difficultyTier);
      
      if (availablePool.length === 0) {
        availablePool = CONVERSATION_POOL;
        setUsedQuestionIds([]);
        currentUsedIds = [];
      }
      
      const poolIndex = Math.floor(Math.random() * availablePool.length);
      const poolItem = availablePool[poolIndex];
      setUsedQuestionIds(prev => [...prev, poolItem.id]);

      // If user is Spanish -> Bot speaks English.
      // If user is English -> Bot speaks Spanish.
      const botText = isEnglishUser ? poolItem.botEs : poolItem.botEn;
      const answer = isEnglishUser ? poolItem.answerEs : poolItem.answerEn;
      const options = isEnglishUser ? poolItem.optionsEs : poolItem.optionsEn;
      
      questionData = {
        type: 'conversation',
        text: botText,
        answer: answer,
        options: [...options].sort(() => 0.5 - Math.random()) // Shuffle
      };

    } else {
      let availablePool = LEARN_POOL.filter(p => !currentUsedIds.includes(p.id) && p.level <= difficultyTier);
      if (availablePool.length === 0) {
        availablePool = LEARN_POOL;
        setUsedQuestionIds([]);
        currentUsedIds = [];
      }

      const poolIndex = Math.floor(Math.random() * availablePool.length);
      const poolItem = availablePool[poolIndex];
      setUsedQuestionIds(prev => [...prev, poolItem.id]);

      questionData = { rawItem: poolItem };
      
      const showType = show.type;
      // Target word is what we are learning
      const targetWord = isEnglishUser ? poolItem.translation : poolItem.word;
      const sourceWord = isEnglishUser ? poolItem.word : poolItem.translation;

      if (showType === 'spell') {
         const scrambled = targetWord.split('').sort(() => 0.5 - Math.random()).join('');
         questionData = {
           type: 'input',
           text: t(`Unscramble: ${scrambled}`, `Ordena: ${scrambled}`, lang),
           answer: targetWord,
           hint: t(`It means: ${sourceWord}`, `Significa: ${sourceWord}`, lang)
         };
      } else if (showType === 'match') {
         questionData = {
           type: 'options',
           text: t(`Select translation for: "${sourceWord}"`, `Traduce: "${sourceWord}"`, lang),
           answer: targetWord,
           options: getOptions(poolItem, 3, 'english_words')
         };
      } else if (showType === 'listen') {
         questionData = {
           type: 'options',
           text: t("Listen and select", "Escucha y selecciona", lang),
           answer: targetWord,
           options: getOptions(poolItem, 2, 'english_words') 
         };
      } else {
         // Default Quiz (Trivia)
         questionData = {
           type: 'options',
           text: t(`What is this? ${poolItem.emoji}`, `¿Qué es esto? ${poolItem.emoji}`, lang),
           answer: targetWord,
           options: getOptions(poolItem, 3, 'english_words')
         };
      }
    }

    setGameQuestion(questionData);
  };

  const handleGameAnswer = (ans: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(ans);
    setHighlightedAnswer(null);

    const isCorrect = ans.toLowerCase() === gameQuestion.answer.toLowerCase();

    if (isCorrect) {
      setAnswerStatus('correct');
      const points = 100;
      const newScore = gameScore + points;
      setGameScore(newScore);
      setGameLevel(l => l + 1);
      
      if (selectedShow) {
          localStorage.setItem(`tmc_game_score_${selectedShow.id}`, newScore.toString());
          checkMiddleLevelStatus();
      }

      setDragonState('happy');
      window.dispatchEvent(new Event('tmc-mascot-happy'));
      
      const phrase = UPLIFTING_PHRASES[Math.floor(Math.random() * UPLIFTING_PHRASES.length)];
      setDragonMessage(`${t(phrase.en, phrase.es, lang)} +${points} ${t('Points', 'Puntos', lang)}!`);
      
      triggerFireworks();
      triggerScreenShake('success');
      
      setTimeout(() => {
        setSelectedAnswer(null);
        setAnswerStatus(null);
        generateGameQuestion(selectedShow!);
      }, 2500);
    } else {
      setAnswerStatus('wrong');
      triggerScreenShake('error');
      setDragonState('supporting');
      setDragonMessage(t("Not quite, try again!", "¡Casi, intenta de nuevo!", lang));
      setTimeout(() => {
        setSelectedAnswer(null);
        setAnswerStatus(null);
      }, 1500);
    }
  };

  const checkMiddleLevelStatus = () => {
      const allPassed = GAME_SHOWS.every(game => {
          const score = parseInt(localStorage.getItem(`tmc_game_score_${game.id}`) || '0');
          return score >= 100;
      });
      if (allPassed) {
          window.dispatchEvent(new Event('tmc-level-update'));
      }
  };

  const handleHelp = (source: 'draco' | 'robot' | 'pet') => {
    let hint = "";
    let fact = "";
    
    if (view === 'learn') {
       const item = LEARN_POOL[learnIndex % LEARN_POOL.length];
       hint = lang === 'es' ? item.hintEs : item.hintEn;
       fact = lang === 'es' ? item.factEs : item.factEn;
    } else if (gameQuestion?.rawItem) {
       const item = gameQuestion.rawItem as WordItem;
       hint = lang === 'es' ? item.hintEs : item.hintEn;
       fact = lang === 'es' ? item.factEs : item.factEn;
    } else {
       hint = t("Pick the response that fits best!", "¡Elige la respuesta que mejor encaje!", lang);
       fact = t("Conversations are about listening!", "¡Conversar es escuchar!", lang);
    }

    if (source === 'draco') {
      setDragonState('happy');
      setDragonMessage(`💡 ${hint}`);
    } else if (source === 'robot') {
      setRobotMessage(`🤖 ${fact}`);
      setTimeout(() => setRobotMessage(null), 5000);
    } else if (source === 'pet') {
      if (view === 'gameshow' && gameQuestion?.answer) {
          setHighlightedAnswer(gameQuestion.answer);
          setPetMessage(t("Over here!", "¡Por aquí!", lang));
          setTimeout(() => { 
              setHighlightedAnswer(null);
              setPetMessage(null);
          }, 3000);
      } else {
          setPetMessage(t("You can do it!", "¡Tú puedes!", lang));
          setTimeout(() => setPetMessage(null), 3000);
      }
    }
  };

  const nextLearnCard = () => {
    setLearnIndex(prev => prev + 1);
    if (userLevel < 100) {
        setUserLevel(prev => {
          const newLevel = prev + 1;
          localStorage.setItem('tmc_kids_level', newLevel.toString());
          return newLevel;
        });
    }
  };

  // --- Renderers ---

  const renderDragon = () => (
    <div className="flex flex-col items-center justify-center relative h-64 w-full mx-auto mb-4 z-10 pointer-events-none">
      <AnimatePresence>
        {dragonMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.8 }} 
            className="absolute -top-12 bg-white text-slate-900 font-bold text-lg px-6 py-4 rounded-[32px] rounded-bl-none shadow-2xl border-4 border-purple-500 z-20 max-w-xs text-center leading-tight pointer-events-auto"
          >
            {dragonMessage}
          </motion.div>
        )}
      </AnimatePresence>
      <div 
        className="w-56 h-56 cursor-pointer active:scale-95 transition-transform pointer-events-auto relative z-30" 
        onClick={(e) => { e.stopPropagation(); handleHelp('draco'); }}
      >
          <CuteDragon state={dragonState} />
      </div>
      <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-2">{t("Tap Draco for a Hint!", "¡Toca a Draco para una pista!", lang)}</p>
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-8 md:space-y-12 pb-32">
      <header className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-xl font-sans">
          Kids Zone
        </h2>
        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
           <span className="text-slate-300 font-bold uppercase tracking-widest text-xs">{t("Total Level", "Nivel Total", lang)}</span>
           <span className="text-yellow-400 font-black text-lg">{userLevel}</span>
        </div>
      </header>
      
      {renderDragon()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 max-w-4xl mx-auto">
        <motion.button
          onClick={() => setView('learn')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-cyan-400 to-blue-500 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border-4 border-white/20"
        >
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <span className="text-7xl drop-shadow-md">🗣️</span>
            <h3 className="text-3xl font-black text-white uppercase tracking-wide">{t("Learn Words", "Aprende Palabras", lang)}</h3>
            <p className="text-white/90 font-bold text-lg">{t("Flashcards • Pronunciation", "Tarjetas • Pronunciación", lang)}</p>
          </div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>

        <motion.button
          onClick={() => setView('gameshow')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border-4 border-white/20"
        >
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <span className="text-7xl drop-shadow-md">📺</span>
            <h3 className="text-3xl font-black text-white uppercase tracking-wide">{t("Magic Game Shows", "Concursos Mágicos", lang)}</h3>
            <p className="text-white/90 font-bold text-lg">{t("5 Games • Win Trophies", "5 Juegos • Gana Trofeos", lang)}</p>
          </div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>
      </div>
    </div>
  );

  const renderLearn = () => {
    const currentWord = LEARN_POOL[learnIndex % LEARN_POOL.length];
    const progress = (userLevel % 100);
    
    // Logic Flip: If lang='en', we learn Spanish. So displayWord = Spanish, targetWord = English
    const isEnglishUser = lang === 'en';
    const displayWord = isEnglishUser ? currentWord.translation : currentWord.word;
    const targetWord = isEnglishUser ? currentWord.word : currentWord.translation;
    const displaySubtitle = isEnglishUser ? "En Español" : "In English";
    
    // NOTE: For 'Learn' mode, we often show the TARGET language first so they learn it. 
    // If English User -> Show Spanish Word -> Reveal English Meaning.
    // If Spanish User -> Show English Word -> Reveal Spanish Meaning.

    return (
      <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col h-full">
        <button onClick={() => setView('menu')} className="self-start text-slate-400 hover:text-white font-bold mb-4">
           ← {t("Exit", "Salir", lang)}
        </button>
        
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative">
          <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t("Level", "Nivel", lang)} {userLevel} / 100</p>

          {renderDragon()}

          <motion.div 
            key={currentWord.word + learnIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-md p-10 rounded-[48px] border-4 border-white/20 text-center w-full shadow-2xl relative"
          >
            <div className="text-9xl mb-6 drop-shadow-2xl">{currentWord.emoji}</div>
            <h2 className="text-5xl font-black text-white mb-2">{isEnglishUser ? currentWord.translation : currentWord.word}</h2>
            <p className="text-xl text-blue-300 font-bold opacity-60">{isEnglishUser ? "Español" : "English"}</p>
            <div className="mt-6 p-4 bg-black/20 rounded-2xl">
               <p className="text-white font-bold text-lg mb-1">{t("Meaning:", "Significa:", lang)}</p>
               <p className="text-yellow-400 font-black text-3xl">{isEnglishUser ? currentWord.word : currentWord.translation}</p>
            </div>
          </motion.div>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => playAudio(isEnglishUser ? currentWord.translation : currentWord.word)}
              className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 border-white/20"
            >
              🔊
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextLearnCard}
              className="h-20 px-8 bg-green-500 rounded-full flex items-center justify-center text-xl font-black text-white shadow-xl border-4 border-white/20 uppercase tracking-wide"
            >
              {t("Next →", "Siguiente →", lang)}
            </motion.button>
          </div>
        </div>
        
        <AnimatePresence>
            {robotMessage && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed bottom-32 right-8 bg-blue-600 text-white p-4 rounded-2xl max-w-xs shadow-xl z-50 border border-white/20">
                    {robotMessage}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-blue-600 rotate-45"></div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    );
  };

  const renderGameShows = () => {
    if (selectedShow) {
      return (
        <div className="max-w-4xl mx-auto py-6 px-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setSelectedShow(null)} className="text-slate-400 hover:text-white font-bold">
               ← {t("Back", "Volver", lang)}
            </button>
            <div className="flex gap-4">
              <span className="bg-white/10 px-4 py-2 rounded-full font-black text-white text-xs">{t("Lvl", "Nivel", lang)} {gameLevel}</span>
              <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-xs">{t("Pts", "Pts", lang)} {gameScore}</span>
            </div>
          </div>

          <div className={`flex-1 rounded-[48px] bg-gradient-to-br ${selectedShow.gradient} p-8 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center border-4 border-white/20`}>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             
             {renderDragon()}

             <div className="relative z-10 w-full max-w-md bg-white/90 rounded-[32px] p-8 text-center shadow-2xl text-slate-900 mt-4">
                
                {/* Conversation Game Layout */}
                {selectedShow.type === 'conversation' ? (
                   <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl shrink-0">🦎</div>
                         <div className="bg-purple-100 p-4 rounded-2xl rounded-tl-none relative">
                            <p className="font-bold text-lg text-purple-900">{gameQuestion?.text}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 mt-4">
                         {gameQuestion?.options?.map((opt: string) => {
                            const isSelected = selectedAnswer === opt;
                            const isCorrect = answerStatus === 'correct';
                            const isWrong = answerStatus === 'wrong';
                            let btnClass = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200";
                            
                            if (isSelected) {
                                if (isCorrect) btnClass = "bg-green-500 text-white border-green-600";
                                else if (isWrong) btnClass = "bg-red-500 text-white border-red-600";
                            } 

                            return (
                              <button 
                                key={opt}
                                onClick={() => handleGameAnswer(opt)}
                                className={`p-4 rounded-xl font-bold text-left transition-all active:scale-95 ${btnClass}`}
                                disabled={!!selectedAnswer}
                              >
                                {opt}
                              </button>
                            );
                         })}
                      </div>
                   </div>
                ) : (
                   /* Default Quiz Layout */
                   <>
                    <h3 className="text-2xl font-black mb-6 uppercase tracking-tight text-slate-800">{gameQuestion?.text}</h3>
                    
                    {selectedShow.type === 'listen' && gameQuestion?.rawItem && (
                      <button 
                        onClick={() => playAudio(lang === 'en' ? gameQuestion.rawItem.translation : gameQuestion.rawItem.word)}
                        className="mb-6 w-16 h-16 bg-blue-600 rounded-full text-white text-2xl shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center mx-auto"
                      >
                        🔊
                      </button>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                       {gameQuestion?.options ? (
                          gameQuestion.options.map((opt: string) => {
                            const isSelected = selectedAnswer === opt;
                            const isCorrect = answerStatus === 'correct';
                            const isWrong = answerStatus === 'wrong';
                            
                            let btnClass = "bg-blue-600 text-white border-transparent";
                            
                            if (isSelected) {
                                if (isCorrect) btnClass = "bg-green-500 text-white border-green-400 scale-105 shadow-green-500/50";
                                else if (isWrong) btnClass = "bg-red-500 text-white border-red-400 shake";
                                else btnClass = "bg-yellow-400 text-yellow-900 border-yellow-500 scale-105";
                            } else if (highlightedAnswer === opt) {
                                btnClass = "bg-yellow-400 text-yellow-900 border-yellow-500 scale-110 animate-bounce";
                            }

                            return (
                              <button 
                                key={opt}
                                onClick={() => handleGameAnswer(opt)}
                                className={`font-bold py-4 rounded-xl shadow-lg transition-all border-4 hover:scale-105 active:scale-95 ${btnClass}`}
                                disabled={!!selectedAnswer}
                              >
                                {opt}
                              </button>
                            );
                          })
                       ) : (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder={t("Type answer...", "Escribe...", lang)}
                              className="flex-1 bg-slate-200 p-4 rounded-xl text-center text-2xl font-bold uppercase outline-none focus:ring-4 ring-blue-500/30"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   const val = (e.target as HTMLInputElement).value;
                                   handleGameAnswer(val);
                                   (e.target as HTMLInputElement).value = '';
                                 }
                              }}
                            />
                            <button className="bg-blue-600 text-white p-4 rounded-xl font-bold">↵</button>
                          </div>
                       )}
                    </div>
                   </>
                )}
             </div>
             
            <AnimatePresence>
                {robotMessage && (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed bottom-32 right-8 bg-blue-600 text-white p-4 rounded-2xl max-w-xs shadow-xl z-50 border border-white/20">
                        {robotMessage}
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-blue-600 rotate-45"></div>
                    </motion.div>
                )}
                {petMessage && (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed bottom-32 left-8 lg:left-auto lg:right-32 bg-yellow-500 text-black font-bold p-4 rounded-2xl max-w-xs shadow-xl z-50 border border-white/20">
                        {petMessage}
                        <div className="absolute -bottom-2 right-6 lg:right-auto lg:left-6 w-4 h-4 bg-yellow-500 rotate-45"></div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
           <button onClick={() => setView('menu')} className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold">←</button>
           <h2 className="text-4xl font-black text-white">{t("Magic TV Channels", "Canales Mágicos", lang)}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_SHOWS.map((show) => {
            const score = typeof window !== 'undefined' ? parseInt(localStorage.getItem(`tmc_game_score_${show.id}`) || '0') : 0;
            const completed = score >= 100;
            return (
              <motion.button
                key={show.id}
                onClick={() => startGameShow(show)}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`aspect-[4/3] rounded-[32px] bg-gradient-to-br ${show.gradient} p-6 relative overflow-hidden shadow-xl border-4 border-white/10 group`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-30 text-9xl grayscale group-hover:grayscale-0 transition-all duration-500 scale-125">{show.icon}</div>
                {completed && <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-black px-3 py-1 rounded-full text-xs shadow-lg">⭐ {score}</div>}
                <div className="relative z-10 flex flex-col h-full justify-end text-left">
                  <h3 className="text-2xl font-black text-white leading-none mb-1 drop-shadow-md">
                    {lang === 'es' ? show.titleEs : show.titleEn}
                  </h3>
                  <p className="text-white/80 text-sm font-bold leading-tight">
                    {lang === 'es' ? show.descriptionEs : show.descriptionEn}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="min-h-full"
        >
          {view === 'menu' && renderMenu()}
          {view === 'learn' && renderLearn()}
          {view === 'gameshow' && renderGameShows()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default KidsZone;
