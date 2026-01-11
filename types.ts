
export type StampTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Ruby' | 'Sapphire' | 'Emerald';

export interface ContentBlock {
  en: string;
  es: string;
}

export interface Lesson {
  title: string;
  topic: string;
  level: string;
  numericLevel?: number;
  explanation: string;
  content: string;
  contentTranslation?: string; // New field for translation toggle
  summary: string;
  vocabulary: { 
    word: string; 
    translation: string; 
    example: string;
    definitionEn?: string;
    definitionEs?: string;
  }[];
  quiz: { id: string; question: string; options: string[]; answer: string; explanation?: string }[];
}

export interface SavedLesson extends Lesson {
  id: string;
  dateSaved: number;
  progress: number;
  completed: boolean;
  quizScore?: number;
  quizMistakes?: string[];
}

export type Language = 'es' | 'en';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'PhD';
export type SpecializationTrack = 'General' | 'Medical' | 'Legal' | 'Academic' | 'Business';

export enum AppSection {
  Home = 'home',
  Worlds = 'worlds',
  Lessons = 'lessons',
  Speaking = 'speaking',
  Vocab = 'vocab',
  Community = 'community',
  Kids = 'kids',
  Passport = 'passport',
  Jobs = 'jobs',
  LiveClassroom = 'live-classroom',
  SocialFeed = 'social-feed',
}

export interface User {
  id: string;
  displayName: string;
  photoUrl: string;
  email: string;
  role: 'student' | 'professor';
  learningTrack: 'EN_TO_ES' | 'ES_TO_EN';
  preferredUiLanguage: Language;
  isChild?: boolean;
  provider?: string;
}

export interface PassportStamp {
  id: string;
  dateEarned: number;
  points: number;
  country?: string;
  city?: string;
  tier?: StampTier;
  rotation?: number;
  shape?: 'circle' | 'rect' | 'hex';
  category?: string;
  title?: ContentBlock;
  iconKid?: string;
  iconAdult?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  persona: string;
  country: 'US' | 'CO';
  city: string;
  talkativeness: number;
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

export interface ChatMsg {
  id: string;
  userId: string;
  user: string;
  state: string;
  text: string;
  time: string;
  isUser: boolean;
  type?: 'human' | 'ai';
  personaId?: string;
  shouldSpeakAloud?: boolean;
  channelId?: string;
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
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AssistantMessage[];
  color: string;
  lastUpdated: number;
}

export interface SRSItem {
  id: string;
  term: string;
  translation: string;
  definitionEn?: string;
  definitionEs?: string;
  contextEn: string;
  contextEs: string;
  level: CEFRLevel;
  nextReview: number;
  interval: number;
  repetition: number;
  easeFactor: number;
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

export interface JobListing {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url?: string;
  industry?: string;
}

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

export interface GameState {
  sentenceEn: string;
  sentenceEs: string;
  missingWordEn: string;
  missingWordEs: string;
  submittedAnswers: Record<string, string>;
  feedback?: string;
}

export interface RoomState {
  id: string;
  roomId: string;
  participants?: User[];
  currentLevel?: number;
  roundNumber?: number;
  helpUsedThisCycle?: boolean;
  gameState?: GameState;
  activeAgents?: AIAgent[];
  activeCity?: CityData;
  languageMode?: Language;
  history?: ChatMsg[];
  modality?: 'voice' | 'text';
}

export interface Professor {
  id: string;
  name: string;
  avatar: string;
  voice: string;
  description: ContentBlock;
}

export interface SpeakingPhrase {
  id: string;
  target: string;
  translation: string;
  tip: ContentBlock;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SpeakingMission {
  id: string;
  tier: number;
  orderIndex: number;
  title: ContentBlock;
  intro: ContentBlock;
  phrases: SpeakingPhrase[];
}

export interface SpeakingUserProgress {
  currentMissionId: string;
  highestCompletedId: string;
  missionStats: Record<string, any>;
  streak: {
    daysActive: number;
    completedToday: number;
    lastDate: number;
  };
}

export interface MascotConfig {
  id: string;
  name: string;
  icon: string;
  archetype: string;
  color: string;
  glow: string;
  specialty: string;
  voice: string;
  description: ContentBlock;
}

// Social Feed Types
export interface FeedPost {
  id: string;
  author: string;
  authorAvatar: string;
  type: 'video' | 'image' | 'text';
  contentUrl?: string;
  text?: string;
  likes: number;
  topicTag: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}
