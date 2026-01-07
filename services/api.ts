
import { WorldData, AppSection } from '../types';

// Mock Backend Responses

export const fetchClassInfo = async () => {
  // Realtime speed: No delay
  
  // Bri's Practical English YouTube Channel 24/7 Stream
  return {
    channelId: 'brispracticalenglish', 
    channelName: "Bri's Practical English",
    liveStreamId: 'qKG4YMp9z34',
    isLive: true, 
    nextStream: new Date(Date.now() + 86400000).toISOString() // Tomorrow
  };
};

export const fetchWorlds = async (): Promise<WorldData[]> => {
  // Realtime speed: No delay
  
  return [
    {
      id: 'forest',
      nameEn: 'Forest of Words',
      nameEs: 'Bosque de Palabras',
      descEn: 'Grow your vocabulary in a serene environment.',
      descEs: 'Cultiva tu vocabulario en un entorno sereno.',
      activeUsers: 142,
      targetSection: AppSection.Vocab,
      themeColor: 'from-emerald-500 to-green-900',
      icon: '🌿'
    },
    {
      id: 'ocean',
      nameEn: 'Ocean of Fluency',
      nameEs: 'Océano de Fluidez',
      descEn: 'Dive into deep conversations and speaking practice.',
      descEs: 'Sumérgete en conversaciones profundas y práctica oral.',
      activeUsers: 89,
      targetSection: AppSection.Speaking,
      themeColor: 'from-cyan-500 to-blue-900',
      icon: '🌊'
    },
    {
      id: 'mountain',
      nameEn: 'Mountain of Mastery',
      nameEs: 'Montaña de Maestría',
      descEn: 'Climb the levels of grammar and structure.',
      descEs: 'Escala los niveles de gramática y estructura.',
      activeUsers: 215,
      targetSection: AppSection.Lessons,
      themeColor: 'from-indigo-500 to-slate-900',
      icon: '⛰️'
    },
    {
      id: 'city',
      nameEn: 'City of Conversation',
      nameEs: 'Ciudad de Conversación',
      descEn: 'Connect with the global community in real-time.',
      descEs: 'Conecta con la comunidad global en tiempo real.',
      activeUsers: 320,
      targetSection: AppSection.Community,
      themeColor: 'from-fuchsia-500 to-purple-900',
      icon: '🏙️'
    },
    {
      id: 'sky',
      nameEn: 'Starry Sky Studio',
      nameEs: 'Estudio Cielo Estrellado',
      descEn: 'Watch live classes and masterclasses.',
      descEs: 'Mira clases en vivo y lecciones maestras.',
      activeUsers: 56,
      targetSection: AppSection.Classes,
      themeColor: 'from-amber-400 to-red-900',
      icon: '✨'
    },
    {
      id: 'game',
      nameEn: 'Game Realm',
      nameEs: 'Reino de Juegos',
      descEn: 'Magic adventures for the young at heart.',
      descEs: 'Aventuras mágicas para los jóvenes de corazón.',
      activeUsers: 104,
      targetSection: AppSection.Kids,
      themeColor: 'from-pink-500 to-rose-900',
      icon: '🎮'
    }
  ];
};

export const joinWorld = async (worldId: string, userId: string) => {
  // Mock join logic
  console.log(`User ${userId} joining world ${worldId}`);
  return { success: true, timestamp: Date.now() };
};
