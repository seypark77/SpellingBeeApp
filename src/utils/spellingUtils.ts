import { BadgeInfo, BeeRank, SpellerProfile, WordEntry, WordProgress } from '../types/spelling';

export const BEE_RANKS: BeeRank[] = [
  {
    level: 1,
    title: 'Larva Learner',
    emoji: '🥚',
    minHoney: 0,
    nextHoney: 500,
    description: 'Just hatched in the Spelling Hive! Keep buzzing!'
  },
  {
    level: 2,
    title: 'Worker Bee',
    emoji: '🐝',
    minHoney: 500,
    nextHoney: 1500,
    description: 'Busy collecting words and building your hive!'
  },
  {
    level: 3,
    title: 'Nectar Scout',
    emoji: '🌸',
    minHoney: 1500,
    nextHoney: 3500,
    description: 'Exploring new vocabulary across the meadow!'
  },
  {
    level: 4,
    title: 'Hive Guardian',
    emoji: '🛡️',
    minHoney: 3500,
    nextHoney: 7000,
    description: 'Strong speller defending the hive with precision!'
  },
  {
    level: 5,
    title: 'Royal Bee',
    emoji: '👑',
    minHoney: 7000,
    nextHoney: 12000,
    description: 'A regional Spelling Bee contender of royal rank!'
  },
  {
    level: 6,
    title: 'Grand Champion Bee',
    emoji: '🏆',
    minHoney: 12000,
    nextHoney: null,
    description: 'Ultimate Spelling Bee Grand Champion level!'
  }
];

export const BADGES: BadgeInfo[] = [
  {
    id: 'first_buzz',
    title: 'First Buzz',
    emoji: '🐝',
    description: 'Spell your very first word correctly!'
  },
  {
    id: 'streak_5',
    title: 'On Fire (5x)',
    emoji: '🔥',
    description: 'Reach a 5-word correct streak in a row!'
  },
  {
    id: 'streak_10',
    title: 'Unstoppable (10x)',
    emoji: '⚡',
    description: 'Reach a 10-word correct streak in a row!'
  },
  {
    id: 'voice_speller',
    title: 'Stage Mic Pro',
    emoji: '🎤',
    description: 'Spell 5 words using Voice Input mode!'
  },
  {
    id: 'one_bee_25',
    title: 'One Bee Star',
    emoji: '⭐',
    description: 'Master 25 words from the One Bee (Beginner) list!'
  },
  {
    id: 'two_bee_25',
    title: 'Two Bee Explorer',
    emoji: '🌟',
    description: 'Master 25 words from the Two Bee (Intermediate) list!'
  },
  {
    id: 'three_bee_25',
    title: 'Three Bee Scholar',
    emoji: '🎓',
    description: 'Master 25 words from the Three Bee (Advanced) list!'
  },
  {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    emoji: '💪',
    description: 'Master 5 previously missed words in Review Mode!'
  },
  {
    id: 'century_club',
    title: '100 Words Club',
    emoji: '💯',
    description: 'Spell 100 unique words from the study list correctly!'
  },
  {
    id: 'honey_tycoon',
    title: 'Golden Hive',
    emoji: '🍯',
    description: 'Collect 1,000 Honey Points!'
  }
];

export const AVATAR_OPTIONS = ['🐝', '👑', '🦋', '🐞', '🌻', '🍯', '🦊', '🦉', '🚀', '⚡'];

export function getBeeRank(honeyPoints: number): BeeRank {
  let current = BEE_RANKS[0];
  for (const rank of BEE_RANKS) {
    if (honeyPoints >= rank.minHoney) {
      current = rank;
    }
  }
  return current;
}

export function normalizeSpelling(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip accents (ñ -> n, é -> e)
    .replace(/[\s\-]+/g, ''); // Ignore spaces and hyphens for flexible grading
}

export function checkSpellingAnswer(input: string, entry: WordEntry): {
  isCorrect: boolean;
  matchedForm: string;
  exactCaseMatch: boolean;
} {
  const cleanedInput = normalizeSpelling(input);
  if (!cleanedInput) {
    return { isCorrect: false, matchedForm: entry.word, exactCaseMatch: false };
  }

  const validForms = [entry.word, ...(entry.altSpellings || [])];
  for (const form of validForms) {
    if (normalizeSpelling(form) === cleanedInput) {
      return {
        isCorrect: true,
        matchedForm: form,
        exactCaseMatch: input.trim() === form
      };
    }
  }

  return {
    isCorrect: false,
    matchedForm: entry.word,
    exactCaseMatch: false
  };
}

export interface LetterDiffItem {
  char: string;
  status: 'match' | 'wrong' | 'missing';
}

export function computeLetterDiff(attempt: string, target: string): LetterDiffItem[] {
  const cleanAttempt = attempt.trim().toLowerCase();
  const cleanTarget = target.trim().toLowerCase();
  const result: LetterDiffItem[] = [];
  const maxLen = Math.max(cleanAttempt.length, cleanTarget.length);

  for (let i = 0; i < maxLen; i++) {
    const aChar = attempt.trim()[i] || '';
    const tChar = target.trim()[i] || '';
    if (aChar && tChar) {
      const aNorm = normalizeSpelling(aChar);
      const tNorm = normalizeSpelling(tChar);
      if (aNorm === tNorm) {
        result.push({ char: aChar, status: 'match' });
      } else {
        result.push({ char: aChar, status: 'wrong' });
      }
    } else if (aChar && !tChar) {
      result.push({ char: aChar, status: 'wrong' });
    } else if (!aChar && tChar) {
      result.push({ char: '_', status: 'missing' });
    }
  }
  return result;
}

const SPOKEN_LETTER_MAP: Record<string, string> = {
  a: 'a', ay: 'a', eh: 'a', hey: 'a', alpha: 'a',
  b: 'b', bee: 'b', be: 'b', bravo: 'b',
  c: 'c', see: 'c', sea: 'c', cee: 'c', si: 'c', charlie: 'c',
  d: 'd', dee: 'd', de: 'd', delta: 'd',
  e: 'e', ee: 'e', echo: 'e',
  f: 'f', ef: 'f', eff: 'f', foxtrot: 'f',
  g: 'g', gee: 'g', jee: 'g', ji: 'g', golf: 'g',
  h: 'h', aitch: 'h', haitch: 'h', ache: 'h', age: 'h', each: 'h', hotel: 'h',
  i: 'i', eye: 'i', aye: 'i', india: 'i',
  j: 'j', jay: 'j', jai: 'j', juliet: 'j',
  k: 'k', kay: 'k', okay: 'k', kilo: 'k',
  l: 'l', el: 'l', ell: 'l', al: 'l', lima: 'l',
  m: 'm', em: 'm', am: 'm', mike: 'm',
  n: 'n', en: 'n', an: 'n', in: 'n', november: 'n',
  o: 'o', oh: 'o', owe: 'o', oscar: 'o',
  p: 'p', pee: 'p', pea: 'p', pi: 'p', papa: 'p',
  q: 'q', cue: 'q', queue: 'q', kyu: 'q', quebec: 'q',
  r: 'r', ar: 'r', are: 'r', our: 'r', romeo: 'r',
  s: 's', es: 's', ess: 's', as: 's', sierra: 's',
  t: 't', tee: 't', tea: 't', ti: 't', tango: 't',
  u: 'u', you: 'u', yew: 'u', yu: 'u', uniform: 'u',
  v: 'v', vee: 'v', victor: 'v',
  w: 'w', doubleu: 'w', doubleyou: 'w', whiskey: 'w',
  x: 'x', ex: 'x', axe: 'x', xray: 'x',
  y: 'y', why: 'y', wye: 'y', yankee: 'y',
  z: 'z', zee: 'z', zed: 'z', zulu: 'z',
  space: ' ',
  hyphen: '-',
  dash: '-'
};

/**
 * Converts a voice transcript (e.g., "B U N N Y" or "H-E-L-L-O" or "bee you double n why")
 * into a clean letter string for Spelling Bee voice input.
 */
export function parseSpokenSpelling(transcript: string): string {
  if (!transcript || !transcript.trim()) return '';

  // Normalize "double <letter>" e.g. "double n" -> "n n", "double l" -> "l l"
  // Note: replace hyphens/punctuation with spaces so "H-E-L-L-O" parses as "h e l l o"
  let cleaned = transcript
    .toLowerCase()
    .replace(/capital\s+/g, '')
    .replace(/double\s+u\b/g, 'w')
    .replace(/double\s+you\b/g, 'w')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawTokens = cleaned.split(' ');
  const outLetters: string[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (!token) continue;

    if (token === 'double' && i + 1 < rawTokens.length) {
      const nextToken = rawTokens[i + 1];
      const mapped = SPOKEN_LETTER_MAP[nextToken] || (nextToken.length === 1 ? nextToken : '');
      if (mapped) {
        outLetters.push(mapped, mapped);
        i++;
        continue;
      }
    }

    if (SPOKEN_LETTER_MAP[token] !== undefined) {
      outLetters.push(SPOKEN_LETTER_MAP[token]);
    } else if (token.length === 1 && /[a-z]/.test(token)) {
      outLetters.push(token);
    } else {
      // If the STT engine merged spoken letters or heard the word directly, split into characters
      for (const ch of token) {
        if (/[a-z]/.test(ch)) {
          outLetters.push(ch);
        }
      }
    }
  }

  return outLetters.join('');
}

export function evaluateUnlockedBadges(
  profile: SpellerProfile,
  progressMap: Record<number, WordProgress>,
  allWords: WordEntry[]
): string[] {
  const existing = new Set(profile.unlockedBadges || []);
  const newlyUnlocked: string[] = [];

  const unlock = (id: string) => {
    if (!existing.has(id)) {
      existing.add(id);
      newlyUnlocked.push(id);
    }
  };

  if (profile.totalCorrect >= 1) unlock('first_buzz');
  if (profile.bestStreak >= 5 || profile.currentStreak >= 5) unlock('streak_5');
  if (profile.bestStreak >= 10 || profile.currentStreak >= 10) unlock('streak_10');
  if (profile.voiceSpellsCount >= 5) unlock('voice_speller');
  if (profile.honeyPoints >= 1000) unlock('honey_tycoon');

  let oneBeeCorrect = 0;
  let twoBeeCorrect = 0;
  let threeBeeCorrect = 0;
  let totalUniqueCorrect = 0;
  let masteredMistakes = 0;

  for (const w of allWords) {
    const prog = progressMap[w.id];
    if (!prog) continue;
    if (prog.correctCount > 0) {
      totalUniqueCorrect++;
      if (w.level === 'One Bee') oneBeeCorrect++;
      if (w.level === 'Two Bee') twoBeeCorrect++;
      if (w.level === 'Three Bee') threeBeeCorrect++;
    }
    if (prog.status === 'mastered_review') {
      masteredMistakes++;
    }
  }

  if (oneBeeCorrect >= 25) unlock('one_bee_25');
  if (twoBeeCorrect >= 25) unlock('two_bee_25');
  if (threeBeeCorrect >= 25) unlock('three_bee_25');
  if (masteredMistakes >= 5) unlock('comeback_kid');
  if (totalUniqueCorrect >= 100) unlock('century_club');

  return newlyUnlocked;
}
