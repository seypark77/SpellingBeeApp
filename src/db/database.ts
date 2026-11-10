import { Platform } from 'react-native';
import wordsData from '../data/words.json';
import { SpellerProfile, WordEntry, WordMasteryStatus, WordProgress } from '../types/spelling';
import { evaluateUnlockedBadges } from '../utils/spellingUtils';

const ALL_WORDS: WordEntry[] = wordsData as WordEntry[];

let sqliteDb: any = null;
let useFallbackStorage = Platform.OS === 'web';

const WEB_STORAGE_KEY = 'beeready_local_sqlite_v1';

interface FallbackState {
  profiles: SpellerProfile[];
  activeProfileId: number;
  progress: Record<string, WordProgress>; // key: `${profileId}_${wordId}`
}

function loadFallbackState(): FallbackState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // ignore
  }
  const defaultProfile: SpellerProfile = {
    id: 1,
    name: 'Speller #1',
    avatar: '🐝',
    grade: '4th–6th Grade',
    honeyPoints: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalPracticed: 0,
    totalCorrect: 0,
    voiceSpellsCount: 0,
    unlockedBadges: [],
    createdAt: new Date().toISOString()
  };
  return {
    profiles: [defaultProfile],
    activeProfileId: 1,
    progress: {}
  };
}

let memoryFallbackState: FallbackState | null = null;

function getFallbackState(): FallbackState {
  if (!memoryFallbackState) {
    memoryFallbackState = loadFallbackState();
  }
  return memoryFallbackState;
}

function saveFallbackState(state: FallbackState): void {
  memoryFallbackState = state;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore
  }
}

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    useFallbackStorage = true;
    const state = getFallbackState();
    saveFallbackState(state);
    return;
  }

  try {
    const SQLite = require('expo-sqlite');
    sqliteDb = await SQLite.openDatabaseAsync('spelling_bee_2026_2027.db');

    await sqliteDb.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY NOT NULL,
        word TEXT NOT NULL,
        alt_spellings TEXT NOT NULL,
        part_of_speech TEXT NOT NULL,
        definition TEXT NOT NULL,
        level TEXT NOT NULL,
        grade_label TEXT NOT NULL,
        example_sentence TEXT NOT NULL,
        blanked_sentence TEXT NOT NULL,
        mw_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        grade TEXT NOT NULL,
        honey_points INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        total_practiced INTEGER NOT NULL DEFAULT 0,
        total_correct INTEGER NOT NULL DEFAULT 0,
        voice_spells_count INTEGER NOT NULL DEFAULT 0,
        unlocked_badges TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS word_progress (
        profile_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        correct_count INTEGER NOT NULL DEFAULT 0,
        wrong_count INTEGER NOT NULL DEFAULT 0,
        review_streak INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'unseen',
        last_practiced_at TEXT,
        last_typed_attempt TEXT,
        PRIMARY KEY (profile_id, word_id)
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    // Seed all 450 words into SQLite if not yet populated
    const countRow = await sqliteDb.getFirstAsync('SELECT COUNT(*) as cnt FROM words');
    if (!countRow || countRow.cnt < ALL_WORDS.length) {
      await sqliteDb.withTransactionAsync(async () => {
        for (const w of ALL_WORDS) {
          await sqliteDb.runAsync(
            `INSERT OR REPLACE INTO words
              (id, word, alt_spellings, part_of_speech, definition, level, grade_label, example_sentence, blanked_sentence, mw_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              w.id,
              w.word,
              JSON.stringify(w.altSpellings || []),
              w.partOfSpeech,
              w.definition,
              w.level,
              w.gradeLabel,
              w.exampleSentence,
              w.blankedSentence,
              w.mwUrl
            ]
          );
        }
      });
    }

    // Ensure at least one default Speller Profile exists
    const profileCount = await sqliteDb.getFirstAsync('SELECT COUNT(*) as cnt FROM profiles');
    if (!profileCount || profileCount.cnt === 0) {
      const now = new Date().toISOString();
      const res = await sqliteDb.runAsync(
        `INSERT INTO profiles (name, avatar, grade, honey_points, current_streak, best_streak, total_practiced, total_correct, voice_spells_count, unlocked_badges, created_at)
         VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, '[]', ?)`,
        ['Speller #1', '🐝', '4th–6th Grade', now]
      );
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('active_profile_id', ?)`,
        [String(res.lastInsertRowId || 1)]
      );
    }
  } catch (err) {
    console.warn('SQLite initialization fell back to local storage:', err);
    useFallbackStorage = true;
    const state = getFallbackState();
    saveFallbackState(state);
  }
}

export async function getAllWordsFromDb(): Promise<WordEntry[]> {
  if (useFallbackStorage || !sqliteDb) {
    return ALL_WORDS;
  }
  try {
    const rows = await sqliteDb.getAllAsync('SELECT * FROM words ORDER BY id ASC');
    if (!rows || rows.length === 0) return ALL_WORDS;
    const audioById: Record<number, string | undefined> = {};
    for (const w of ALL_WORDS) {
      audioById[w.id] = w.audioUrl;
    }
    return rows.map((r: any) => ({
      id: r.id,
      word: r.word,
      altSpellings: JSON.parse(r.alt_spellings || '[]'),
      partOfSpeech: r.part_of_speech,
      definition: r.definition,
      level: r.level,
      gradeLabel: r.grade_label,
      exampleSentence: r.example_sentence,
      blankedSentence: r.blanked_sentence,
      mwUrl: r.mw_url,
      audioUrl: audioById[r.id] || ''
    }));
  } catch {
    return ALL_WORDS;
  }
}

function mapProfileRow(r: any): SpellerProfile {
  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    grade: r.grade,
    honeyPoints: r.honey_points,
    currentStreak: r.current_streak,
    bestStreak: r.best_streak,
    totalPracticed: r.total_practiced,
    totalCorrect: r.total_correct,
    voiceSpellsCount: r.voice_spells_count || 0,
    unlockedBadges: JSON.parse(r.unlocked_badges || '[]'),
    createdAt: r.created_at
  };
}

export async function getProfiles(): Promise<{
  profiles: SpellerProfile[];
  activeProfileId: number;
}> {
  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    return {
      profiles: state.profiles,
      activeProfileId: state.activeProfileId
    };
  }

  const rows = await sqliteDb.getAllAsync('SELECT * FROM profiles ORDER BY id ASC');
  const profiles = rows.map(mapProfileRow);
  const setting = await sqliteDb.getFirstAsync(
    `SELECT value FROM app_settings WHERE key = 'active_profile_id'`
  );
  let activeId = setting ? Number(setting.value) : profiles[0]?.id || 1;
  if (!profiles.some((p: SpellerProfile) => p.id === activeId) && profiles.length > 0) {
    activeId = profiles[0].id;
  }
  return { profiles, activeProfileId: activeId };
}

export async function setActiveProfile(profileId: number): Promise<void> {
  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    state.activeProfileId = profileId;
    saveFallbackState(state);
    return;
  }
  await sqliteDb.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('active_profile_id', ?)`,
    [String(profileId)]
  );
}

export async function createProfile(
  name: string,
  avatar: string,
  grade: string
): Promise<SpellerProfile> {
  const cleanName = name.trim() || 'New Speller';
  const now = new Date().toISOString();

  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    const nextId = state.profiles.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const newProfile: SpellerProfile = {
      id: nextId,
      name: cleanName,
      avatar,
      grade,
      honeyPoints: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPracticed: 0,
      totalCorrect: 0,
      voiceSpellsCount: 0,
      unlockedBadges: [],
      createdAt: now
    };
    state.profiles.push(newProfile);
    state.activeProfileId = nextId;
    saveFallbackState(state);
    return newProfile;
  }

  const res = await sqliteDb.runAsync(
    `INSERT INTO profiles (name, avatar, grade, honey_points, current_streak, best_streak, total_practiced, total_correct, voice_spells_count, unlocked_badges, created_at)
     VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, '[]', ?)`,
    [cleanName, avatar, grade, now]
  );
  const newId = Number(res.lastInsertRowId);
  await setActiveProfile(newId);
  const row = await sqliteDb.getFirstAsync('SELECT * FROM profiles WHERE id = ?', [newId]);
  return mapProfileRow(row);
}

export async function updateProfileInfo(
  profileId: number,
  name: string,
  avatar: string,
  grade: string
): Promise<void> {
  const cleanName = name.trim() || 'Speller';
  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    const target = state.profiles.find((p) => p.id === profileId);
    if (target) {
      target.name = cleanName;
      target.avatar = avatar;
      target.grade = grade;
      saveFallbackState(state);
    }
    return;
  }
  await sqliteDb.runAsync(
    `UPDATE profiles SET name = ?, avatar = ?, grade = ? WHERE id = ?`,
    [cleanName, avatar, grade, profileId]
  );
}

export async function deleteProfile(profileId: number): Promise<void> {
  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    if (state.profiles.length <= 1) return; // Keep at least 1 profile
    state.profiles = state.profiles.filter((p) => p.id !== profileId);
    Object.keys(state.progress).forEach((k) => {
      if (k.startsWith(`${profileId}_`)) {
        delete state.progress[k];
      }
    });
    if (state.activeProfileId === profileId) {
      state.activeProfileId = state.profiles[0].id;
    }
    saveFallbackState(state);
    return;
  }

  const countRow = await sqliteDb.getFirstAsync('SELECT COUNT(*) as cnt FROM profiles');
  if (countRow && countRow.cnt <= 1) return;
  await sqliteDb.runAsync('DELETE FROM word_progress WHERE profile_id = ?', [profileId]);
  await sqliteDb.runAsync('DELETE FROM profiles WHERE id = ?', [profileId]);
  const remaining = await sqliteDb.getFirstAsync('SELECT id FROM profiles ORDER BY id ASC LIMIT 1');
  if (remaining) {
    await setActiveProfile(remaining.id);
  }
}

export async function getWordProgressMap(
  profileId: number
): Promise<Record<number, WordProgress>> {
  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    const map: Record<number, WordProgress> = {};
    Object.values(state.progress).forEach((wp) => {
      if (wp.profileId === profileId) {
        map[wp.wordId] = wp;
      }
    });
    return map;
  }

  const rows = await sqliteDb.getAllAsync(
    'SELECT * FROM word_progress WHERE profile_id = ?',
    [profileId]
  );
  const map: Record<number, WordProgress> = {};
  for (const r of rows) {
    map[r.word_id] = {
      profileId: r.profile_id,
      wordId: r.word_id,
      correctCount: r.correct_count,
      wrongCount: r.wrong_count,
      reviewStreak: r.review_streak,
      status: r.status as WordMasteryStatus,
      lastPracticedAt: r.last_practiced_at,
      lastTypedAttempt: r.last_typed_attempt
    };
  }
  return map;
}

export async function recordWordAttempt(params: {
  profileId: number;
  wordId: number;
  isCorrect: boolean;
  typedAttempt: string;
  usedVoice: boolean;
  isReviewMode: boolean;
}): Promise<{
  pointsEarned: number;
  newStreak: number;
  newlyUnlockedBadges: string[];
  updatedWordProgress: WordProgress;
}> {
  const { profileId, wordId, isCorrect, typedAttempt, usedVoice } = params;
  const now = new Date().toISOString();

  const progressMap = await getWordProgressMap(profileId);
  const existing: WordProgress = progressMap[wordId] || {
    profileId,
    wordId,
    correctCount: 0,
    wrongCount: 0,
    reviewStreak: 0,
    status: 'unseen',
    lastPracticedAt: null,
    lastTypedAttempt: null
  };

  let newStatus: WordMasteryStatus = existing.status;
  let newReviewStreak = existing.reviewStreak;
  let newCorrectCount = existing.correctCount;
  let newWrongCount = existing.wrongCount;

  if (isCorrect) {
    newCorrectCount += 1;
    if (existing.wrongCount > 0 || existing.status === 'needs_review' || existing.status === 'mastered_review') {
      newReviewStreak += 1;
      // Requires 2 correct attempts in review/practice after missing to reach 'mastered_review'
      newStatus = newReviewStreak >= 2 ? 'mastered_review' : 'needs_review';
    } else {
      newStatus = 'correct';
    }
  } else {
    newWrongCount += 1;
    newReviewStreak = 0;
    newStatus = 'needs_review';
  }

  const updatedWordProgress: WordProgress = {
    profileId,
    wordId,
    correctCount: newCorrectCount,
    wrongCount: newWrongCount,
    reviewStreak: newReviewStreak,
    status: newStatus,
    lastPracticedAt: now,
    lastTypedAttempt: typedAttempt
  };

  progressMap[wordId] = updatedWordProgress;

  // Update Profile stats & Honey Points
  const { profiles } = await getProfiles();
  const profile = profiles.find((p) => p.id === profileId) || profiles[0];

  const newStreak = isCorrect ? profile.currentStreak + 1 : 0;
  const bestStreak = Math.max(profile.bestStreak, newStreak);
  // Base 10 honey points per correct answer + streak bonus (up to +25 bonus per word!)
  const streakBonus = isCorrect ? Math.min(25, Math.floor(newStreak / 2) * 5) : 0;
  const pointsEarned = isCorrect ? 10 + streakBonus : 2; // +2 effort honey even when learning from a mistake!

  const updatedProfile: SpellerProfile = {
    ...profile,
    honeyPoints: profile.honeyPoints + pointsEarned,
    currentStreak: newStreak,
    bestStreak,
    totalPracticed: profile.totalPracticed + 1,
    totalCorrect: profile.totalCorrect + (isCorrect ? 1 : 0),
    voiceSpellsCount: profile.voiceSpellsCount + (usedVoice && isCorrect ? 1 : 0)
  };

  const newlyUnlockedBadges = evaluateUnlockedBadges(updatedProfile, progressMap, ALL_WORDS);
  if (newlyUnlockedBadges.length > 0) {
    updatedProfile.unlockedBadges = Array.from(
      new Set([...updatedProfile.unlockedBadges, ...newlyUnlockedBadges])
    );
  }

  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    state.progress[`${profileId}_${wordId}`] = updatedWordProgress;
    const idx = state.profiles.findIndex((p) => p.id === profileId);
    if (idx !== -1) {
      state.profiles[idx] = updatedProfile;
    }
    saveFallbackState(state);
  } else {
    await sqliteDb.runAsync(
      `INSERT OR REPLACE INTO word_progress
        (profile_id, word_id, correct_count, wrong_count, review_streak, status, last_practiced_at, last_typed_attempt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        wordId,
        updatedWordProgress.correctCount,
        updatedWordProgress.wrongCount,
        updatedWordProgress.reviewStreak,
        updatedWordProgress.status,
        updatedWordProgress.lastPracticedAt,
        updatedWordProgress.lastTypedAttempt
      ]
    );

    await sqliteDb.runAsync(
      `UPDATE profiles
       SET honey_points = ?, current_streak = ?, best_streak = ?, total_practiced = ?, total_correct = ?, voice_spells_count = ?, unlocked_badges = ?
       WHERE id = ?`,
      [
        updatedProfile.honeyPoints,
        updatedProfile.currentStreak,
        updatedProfile.bestStreak,
        updatedProfile.totalPracticed,
        updatedProfile.totalCorrect,
        updatedProfile.voiceSpellsCount,
        JSON.stringify(updatedProfile.unlockedBadges),
        profileId
      ]
    );
  }

  return {
    pointsEarned,
    newStreak,
    newlyUnlockedBadges,
    updatedWordProgress
  };
}

export async function toggleWordReviewMastery(
  profileId: number,
  wordId: number,
  markMastered: boolean
): Promise<void> {
  const progressMap = await getWordProgressMap(profileId);
  const existing = progressMap[wordId];
  if (!existing) return;

  const newStatus: WordMasteryStatus = markMastered ? 'mastered_review' : 'needs_review';
  const newStreak = markMastered ? Math.max(2, existing.reviewStreak) : 0;

  if (useFallbackStorage || !sqliteDb) {
    const state = getFallbackState();
    const target = state.progress[`${profileId}_${wordId}`];
    if (target) {
      target.status = newStatus;
      target.reviewStreak = newStreak;
      saveFallbackState(state);
    }
    return;
  }

  await sqliteDb.runAsync(
    `UPDATE word_progress SET status = ?, review_streak = ? WHERE profile_id = ? AND word_id = ?`,
    [newStatus, newStreak, profileId, wordId]
  );
}
