export enum AppMode {
  IDLE = 'IDLE',
  SCENARIO_SETUP = 'SCENARIO_SETUP', // Generating image
  SCENARIO_LIVE = 'SCENARIO_LIVE',   // In call
  INTERVIEW_SETUP = 'INTERVIEW_SETUP',
  INTERVIEW_LIVE = 'INTERVIEW_LIVE',
  REPORT = 'REPORT',
  HISTORY_LIST = 'HISTORY_LIST'
}

export interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface VocabularyItem {
  word: string;
  type: string; // 'Substantivo' | 'Verbo'
  definition: string; // Chinese definition
  example: string; // Portuguese example
}

export interface TranslatedSentence {
  portuguese: string;
  chinese: string;
}

export interface SessionReport {
  summary: TranslatedSentence[]; // Array of translated sentences
  corrections: string[];
  vocabulary: VocabularyItem[];
  score: number; // 1-10
  feedback: string; // General syntax/expression advice
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  mode: 'SCENARIO' | 'INTERVIEW';
  messages: Message[];
  report: SessionReport;
}

export interface AudioConfig {
  sampleRate: number;
}