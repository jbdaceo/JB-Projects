
export interface Lesson {
  title: string;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string;
  summary: string;
  vocabulary: { word: string; translation: string; example: string }[];
  quiz: { question: string; options: string[]; answer: string }[];
}

export type Language = 'es' | 'en';

export enum AppSection {
  Home = 'home',
  Lessons = 'lessons',
  Speaking = 'speaking',
  Vocab = 'vocab',
  Coaching = 'coaching',
  Community = 'community',
  Kids = 'kids'
}

export interface AssistantMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AssistantMessage[];
  color: string; // Tailwind class for background
  lastUpdated: number;
}
