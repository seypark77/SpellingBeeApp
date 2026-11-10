export type BeeLevel = 'One Bee' | 'Two Bee' | 'Three Bee';

export interface WordEntry {
  id: number;
  word: string;
  altSpellings: string[];
  partOfSpeech: string;
  definition: string;
  level: BeeLevel;
  gradeLabel: string;
  exampleSentence: string;
  blankedSentence: string;
  mwUrl: string;
  audioUrl?: string;
}

export type WordMasteryStatus = 'unseen' | 'correct' | 'needs_review' | 'mastered_review';

export interface WordProgress {
  profileId: number;
  wordId: number;
  correctCount: number;
  wrongCount: number;
  reviewStreak: number; // 0, 1, or 2+ (2+ means graduated/mastered from wrong words!)
  status: WordMasteryStatus;
  lastPracticedAt: string | null;
  lastTypedAttempt: string | null;
}

export interface SpellerProfile {
  id: number;
  name: string;
  avatar: string;
  grade: string;
  honeyPoints: number;
  currentStreak: number;
  bestStreak: number;
  totalPracticed: number;
  totalCorrect: number;
  voiceSpellsCount: number;
  unlockedBadges: string[]; // JSON array of badge IDs
  createdAt: string;
}

export interface BeeRank {
  level: number;
  title: string;
  emoji: string;
  minHoney: number;
  nextHoney: number | null;
  description: string;
}

export interface BadgeInfo {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

export type QuizOrder = 'sequential' | 'random';
export type QuizCount = 10 | 20 | 50 | 150;

export interface QuizSessionConfig {
  mode: 'level' | 'review_active' | 'review_all';
  level?: BeeLevel | 'All';
  count: QuizCount;
  order: QuizOrder;
  startOffset?: number; // e.g., 0 (#1-50), 50 (#51-100), 100 (#101-150)
  customWords?: WordEntry[];
}
