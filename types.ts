export interface User {
  email: string;
  hasAccessToCommunity: boolean;
  name?: string;
  avatar?: string;
}

export enum ViewState {
  LANDING = 'LANDING',
  QUIZ = 'QUIZ',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  DASHBOARD = 'DASHBOARD',
}

export interface QuizAnswer {
  questionId: number;
  answer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  category: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'PDF' | 'VIDEO';
  description: string;
  url: string;
}

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  time: string;
  type: 'LIVE' | 'DROP';
}

export interface Conversation {
  id: string;
  user: string;
  avatar: string;
  lastMessage: string;
  unread: number;
}

export interface AnalysisResult {
  archetype: string;
  plan: string;
  pdfStack: string; // Specific document stack assigned (e.g., 'Mortgage', 'Repo', 'General')
}