
export interface Lesson {
  title: string;
  topic: string;
  level: string; // The academic grade string (e.g. "Grade 10")
  numericLevel?: number; // Internal numeric tracker
  content: string;
  summary: string;
  vocabulary: { word: string; translation: string; example: string }[];
  quiz: { question: string; options: string[]; answer: string }[];
}

export interface SavedLesson extends Lesson {
  id: string;
  dateSaved: number;
}

export type Language = 'es' | 'en';

export enum AppSection {
  Home = 'home',
  Worlds = 'worlds', // Zen Portal
  WorldHub = 'world_hub', // Interactive Hub
  Chat = 'chat', // Restored Global Chat
  Classes = 'classes', // Live YouTube Classes
  Lessons = 'lessons',
  Speaking = 'speaking',
  Vocab = 'vocab',
  Coaching = 'coaching',
  Community = 'community',
  Kids = 'kids',
  Breakout = 'breakout',
  LiveClassroom = 'live_classroom'
}

export interface User {
  id: string;
  displayName: string;
  photoUrl: string;
  email: string;
  role: 'student' | 'professor';
  learningTrack: 'EN_TO_ES' | 'ES_TO_EN';
  preferredUiLanguage: Language;
  provider?: 'google' | 'apple' | 'facebook';
}

export interface AssistantMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: number;
  suggestion?: {
    section: AppSection;
    label: string;
  };
  type?: 'explanation' | 'correction' | 'encouragement';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AssistantMessage[];
  color: string;
  lastUpdated: number;
}

export interface Persona {
  id: string;
  name: string;
  state: string;
  city: string;
  uni: string;
  sportTeam: string;
  food: string;
  slang: string[];
  vibe: string;
  topics: string[];
  voice?: string; // Voice name for TTS
}

export interface ChatMsg {
  id: string;
  userId: string;
  user: string;
  state: string;
  text: string;
  time: string;
  isUser: boolean;
  replyTo?: string;
  type?: 'human' | 'ai';
  learningTrack?: 'EN_TO_ES' | 'ES_TO_EN';
}

export interface WorldData {
  id: string;
  nameEn: string;
  nameEs: string;
  descEn: string;
  descEs: string;
  activeUsers: number;
  targetSection: AppSection;
  themeColor: string;
  icon: string;
}

// --- Game & Room Types ---

export interface Invite {
  fromUser: User;
  toUserId: string;
  roomId: string;
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  participants: User[];
  currentLevel: number;
  roundNumber: number;
  helpUsedThisCycle: boolean;
  gameState: GameState;
}

export interface GameState {
  sentenceEn: string;
  sentenceEs: string;
  missingWordEn: string;
  missingWordEs: string;
  submittedAnswers: Record<string, string>; // userId -> answer
  feedback?: string;
}

// --- Immersion Training Types ---

export interface ProfessorPersona {
  id: string;
  name: string;
  role: string;
  tone: string;
  specialty: string;
  emoji: string;
  color: string;
  systemPromptAddon: string;
}

export interface KnowledgeCheckItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ImmersionMission {
  id: string;
  title: string;
  objective: string;
  steps: string[];
  knowledgeChecks: KnowledgeCheckItem[];
}