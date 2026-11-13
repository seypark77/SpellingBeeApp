export type BeeLevel = 'One Bee' | 'Two Bee' | 'Three Bee';

export interface WordEntry {
  id: number;
  word: string;
  altSpellings: string[];
  partOfSpeech: string;
  definition: string;
  officialDefinition?: string; // Preserved original official Scripps/Merriam-Webster definition
  level: BeeLevel;
  gradeLabel: string;
  exampleSentence: string;
  blankedSentence: string;
  dictionaryUrl: string;
  mwUrl?: string;
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

export type BaseCharacterId = 'bee' | 'wizard_girl' | 'detective_boy';
export type HatItemId =
  | 'none'
  | 'wizard_hat'
  | 'detective_fedora'
  | 'gold_crown'
  | 'flower_crown'
  | 'grad_cap';
export type EyewearItemId = 'none' | 'round_glasses';
export type OutfitItemId =
  | 'none'
  | 'satchel'
  | 'red_cape'
  | 'bowtie'
  | 'detective_vest'
  | 'master_cape';
export type PropItemId =
  | 'none'
  | 'pencil_card'
  | 'star_wand'
  | 'magnifier'
  | 'spelling_tome'
  | 'wand_tome';
export type BgAuraItemId = 'meadow' | 'sparkle_gold' | 'starry_bee';

export interface CharacterCustomization {
  baseCharacter: BaseCharacterId;
  hat: HatItemId;
  eyewear: EyewearItemId;
  outfit: OutfitItemId;
  prop: PropItemId;
  bgAura: BgAuraItemId;
}

export type ShopCategory = 'character' | 'hat' | 'eyewear' | 'outfit' | 'prop' | 'bgAura';

export interface ShopItem {
  id: string;
  slotValue: string;
  category: ShopCategory;
  nameKo: string;
  nameEn: string;
  description: string;
  price: number;
  icon: string;
  accentColor: string;
  isDefault?: boolean;
}

export interface SpellerProfile {
  id: number;
  name: string;
  avatar: string;
  grade: string;
  honeyPoints: number;
  spentHoney?: number;
  ownedItems?: string[];
  customization?: CharacterCustomization;
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
export type QuizPoolFilter = 'unmastered_only' | 'all';

export interface QuizSessionConfig {
  mode: 'level' | 'review_active' | 'review_all';
  level?: BeeLevel | 'All';
  count: QuizCount;
  order: QuizOrder;
  poolFilter?: QuizPoolFilter;
  startOffset?: number; // e.g., 0 (#1-50), 50 (#51-100), 100 (#101-150)
  customWords?: WordEntry[];
}
