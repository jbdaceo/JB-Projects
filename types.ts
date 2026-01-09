
export interface ContentBlock {
  en: string;
  es: string;
}

export interface Lesson {
  title: string;
  topic: string;
  level: string;
  numericLevel?: number;
  content: ContentBlock | string;
  summary: ContentBlock | string;
  vocabulary: { word: string; translation: string; example: string }[];
  quiz: { question: string; options: string[]; answer: string; explanation?: string }[];
}

export interface SavedLesson extends Lesson {
  id: string;
  dateSaved: number;
  numericLevel?: number;
  progress: number;
  completed: boolean;
  quizScore?: number;
  masteryFeedback?: {
    stars: number;
    text: string;
  };
}

export type Language = 'es' | 'en';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'PhD';
export type SpecializationTrack = 'General' | 'Medical' | 'Legal' | 'Academic' | 'Business';

export enum AppSection {
  Home = 'home',
  Worlds = 'worlds',
  WorldHub = 'world_hub',
  Chat = 'chat',
  Classes = 'classes',
  Lessons = 'lessons',
  Speaking = 'speaking',
  Vocab = 'vocab',
  Coaching = 'coaching',
  Community = 'community',
  Kids = 'kids',
  Breakout = 'breakout',
  LiveClassroom = 'live_classroom',
  Jobs = 'jobs',
  Passport = 'passport'
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
  isChild?: boolean;
}

// --- Kids Zone Types ---
export interface KidsLand {
  id: string;
  name: ContentBlock;
  icon: string;
  color: string;
  description: ContentBlock;
  locked?: boolean;
}

export interface KidsStats {
  xp: {
    vocabulary: number;
    listening: number;
    speaking: number;
    reading: number;
  };
  gold: number;
  stars: number;
  streak: number;
  level: number;
}

// --- Passport System ---
export interface PassportStamp {
  id: string;
  category: 'topic' | 'skill' | 'streak' | 'event';
  title: ContentBlock;
  dateEarned: number;
  iconKid: string; // Emoji or asset for kids
  iconAdult: string; // Clean icon for adults
  points: number;
}

// --- Multi-Agent Community Types ---

export interface AIAgent {
  id: string;
  name: string;
  persona: string;
  country: 'US' | 'CO';
  city: string;
  talkativeness: number; // 0-1
  specialties: string[];
  voiceProfileId: string;
  avatarImage: string;
  lastSpokeAt: number;
}

export interface CityData {
  name: string;
  country: 'US' | 'CO';
  skylineImageUrl: string;
  landmarkImageUrls: string[];
}

export interface GameState {
  sentenceEn: string;
  sentenceEs: string;
  missingWordEn: string;
  missingWordEs: string;
  submittedAnswers: Record<string, string>;
  feedback?: string;
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
  personaId?: string;
  shouldSpeakAloud?: boolean;
  learningTrack?: string;
}

export interface RoomState {
  id: string;
  activeAgents?: AIAgent[];
  activeCity?: CityData;
  languageMode?: Language;
  history?: ChatMsg[];
  modality?: 'voice' | 'text';
  activeTopics?: string[];
  roomId?: string;
  participants?: User[];
  currentLevel?: number;
  roundNumber?: number;
  helpUsedThisCycle?: boolean;
  gameState?: GameState;
}

// --- Mission-Based Tutor Types ---

export interface Professor {
  id: string;
  name: string;
  avatar: string;
  voice: string;
  description: { en: string; es: string };
}

export interface SpeakingPhrase {
  id: string;
  target: string;
  translation: string;
  tip: { en: string; es: string };
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SpeakingMission {
  id: string;
  tier: number;
  orderIndex: number;
  title: { en: string; es: string };
  intro: { en: string; es: string };
  phrases: SpeakingPhrase[];
}

export interface MissionStats {
  attempts: number;
  bestScore: number;
  lastAttemptAt: number;
}

export interface SpeakingUserProgress {
  currentMissionId: string;
  highestCompletedId: string;
  missionStats: Record<string, MissionStats>;
  streak: {
    daysActive: number;
    completedToday: number;
    lastDate: number;
  };
}

// --- Mascot Upgraded Types ---

export interface MascotConfig {
  id: string;
  name: string;
  icon: string;
  archetype: string;
  color: string;
  glow: string;
  specialty: string;
  voice: string;
  description: { en: string; es: string };
}

// --- Assistant / Tutor Types ---

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
  audioData?: string;
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
  voice?: string;
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

export interface Invite {
  fromUser: User;
  toUserId: string;
  roomId: string;
  timestamp: number;
}

export interface SRSItem {
  id: string;
  term: string;
  translation: string;
  context: string;
  level: CEFRLevel;
  nextReview: number;
  interval: number;
  repetition: number;
  easeFactor: number;
}
