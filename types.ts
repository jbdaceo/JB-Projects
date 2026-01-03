
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
  suggestion?: {
    section: AppSection;
    label: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AssistantMessage[];
  color: string; // Tailwind class for background
  lastUpdated: number;
}
