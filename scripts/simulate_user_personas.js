const fs = require('fs');
const path = require('path');

const words = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'words.json'), 'utf8'));

// Exact Bee Ranks from spellingUtils.ts
const BEE_RANKS = [
  { level: 1, title: 'Larva Learner', emoji: '🥚', minHoney: 0, nextHoney: 500 },
  { level: 2, title: 'Worker Bee', emoji: '🐝', minHoney: 500, nextHoney: 1500 },
  { level: 3, title: 'Nectar Scout', emoji: '🌸', minHoney: 1500, nextHoney: 3500 },
  { level: 4, title: 'Hive Guardian', emoji: '🛡️', minHoney: 3500, nextHoney: 7000 },
  { level: 5, title: 'Royal Bee', emoji: '👑', minHoney: 7000, nextHoney: 12000 },
  { level: 6, title: 'Grand Champion Bee', emoji: '🏆', minHoney: 12000, nextHoney: null }
];

function getBeeRank(honey) {
  let current = BEE_RANKS[0];
  for (const r of BEE_RANKS) {
    if (honey >= r.minHoney) current = r;
  }
  return current;
}

// Exact Badge definitions from spellingUtils.ts
const BADGES = [
  { id: 'first_buzz', title: 'First Buzz', emoji: '🐝' },
  { id: 'streak_5', title: 'On Fire (5x)', emoji: '🔥' },
  { id: 'streak_10', title: 'Unstoppable (10x)', emoji: '⚡' },
  { id: 'voice_speller', title: 'Stage Mic Pro', emoji: '🎤' },
  { id: 'one_bee_25', title: 'One Bee Star', emoji: '⭐' },
  { id: 'two_bee_25', title: 'Two Bee Explorer', emoji: '🌟' },
  { id: 'three_bee_25', title: 'Three Bee Scholar', emoji: '🎓' },
  { id: 'comeback_kid', title: 'Comeback Kid', emoji: '💪' },
  { id: 'century_club', title: '100 Words Club', emoji: '💯' },
  { id: 'honey_tycoon', title: 'Golden Hive', emoji: '🍯' }
];

function normalizeSpelling(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-]+/g, '');
}

function checkSpelling(input, entry) {
  const cleaned = normalizeSpelling(input);
  if (!cleaned) return false;
  const forms = [entry.word, ...(entry.altSpellings || [])];
  for (const f of forms) {
    if (normalizeSpelling(f) === cleaned) return true;
  }
  return false;
}

function evaluateBadges(profile, progressMap) {
  const existing = new Set(profile.unlockedBadges);
  const newly = [];
  const unlock = (id) => {
    if (!existing.has(id)) {
      existing.add(id);
      newly.push(id);
    }
  };

  if (profile.totalCorrect >= 1) unlock('first_buzz');
  if (profile.bestStreak >= 5 || profile.currentStreak >= 5) unlock('streak_5');
  if (profile.bestStreak >= 10 || profile.currentStreak >= 10) unlock('streak_10');
  if (profile.voiceSpellsCount >= 5) unlock('voice_speller');
  if (profile.honeyPoints >= 1000) unlock('honey_tycoon');

  let oneBee = 0, twoBee = 0, threeBee = 0, totalUnique = 0, masteredMistakes = 0;
  for (const w of words) {
    const p = progressMap[w.id];
    if (!p) continue;
    if (p.correctCount > 0) {
      totalUnique++;
      if (w.level === 'One Bee') oneBee++;
      if (w.level === 'Two Bee') twoBee++;
      if (w.level === 'Three Bee') threeBee++;
    }
    if (p.status === 'mastered_review') masteredMistakes++;
  }

  if (oneBee >= 25) unlock('one_bee_25');
  if (twoBee >= 25) unlock('two_bee_25');
  if (threeBee >= 25) unlock('three_bee_25');
  if (masteredMistakes >= 5) unlock('comeback_kid');
  if (totalUnique >= 100) unlock('century_club');

  profile.unlockedBadges = Array.from(existing);
  return newly;
}

class VirtualStudentSimulator {
  constructor(name, avatar, accuracyRate, typoTendency = false) {
    this.name = name;
    this.avatar = avatar;
    this.accuracyRate = accuracyRate;
    this.typoTendency = typoTendency;

    this.profile = {
      name,
      avatar,
      honeyPoints: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPracticed: 0,
      totalCorrect: 0,
      voiceSpellsCount: 0,
      unlockedBadges: []
    };

    this.progressMap = {};
    this.milestones = [];
    this.reviewQueue = [];
  }

  recordAttempt(word, isCorrect, usedVoice = false) {
    const p = this.profile;
    const wid = word.id;
    const existing = this.progressMap[wid] || {
      wordId: wid,
      correctCount: 0,
      wrongCount: 0,
      reviewStreak: 0,
      status: 'unseen'
    };

    let newStatus = existing.status;
    let newReviewStreak = existing.reviewStreak;

    if (isCorrect) {
      existing.correctCount += 1;
      if (existing.wrongCount > 0 || existing.status === 'needs_review' || existing.status === 'mastered_review') {
        newReviewStreak += 1;
        newStatus = newReviewStreak >= 2 ? 'mastered_review' : 'needs_review';
        if (newStatus === 'mastered_review' && existing.status !== 'mastered_review') {
          this.milestones.push(`🎓 Mastered tricky word #${wid} "${word.word}" from Wrong Word Bank!`);
        }
      } else {
        newStatus = 'correct';
      }
    } else {
      existing.wrongCount += 1;
      newReviewStreak = 0;
      newStatus = 'needs_review';
      if (!this.reviewQueue.includes(wid)) {
        this.reviewQueue.push(wid);
      }
    }

    existing.status = newStatus;
    existing.reviewStreak = newReviewStreak;
    this.progressMap[wid] = existing;

    const oldRank = getBeeRank(p.honeyPoints);

    // Scoring formula: base 10 + streak bonus (up to +10) or +2 effort
    const newStreak = isCorrect ? p.currentStreak + 1 : 0;
    const bestStreak = Math.max(p.bestStreak, newStreak);
    const streakBonus = isCorrect ? Math.min(10, Math.max(0, newStreak - 1)) : 0;
    const pointsEarned = isCorrect ? 10 + streakBonus : 2;

    p.honeyPoints += pointsEarned;
    p.currentStreak = newStreak;
    p.bestStreak = bestStreak;
    p.totalPracticed += 1;
    if (isCorrect) p.totalCorrect += 1;
    if (usedVoice && isCorrect) p.voiceSpellsCount += 1;

    // Check rank evolution
    const newRank = getBeeRank(p.honeyPoints);
    if (newRank.level > oldRank.level) {
      this.milestones.push(
        `⭐ EVOLUTION: Promoted to ${newRank.emoji} ${newRank.title} (Level ${newRank.level}) at ${p.honeyPoints} 🍯 (Attempt #${p.totalPracticed})`
      );
    }

    // Check badges
    const newBadges = evaluateBadges(p, this.progressMap);
    for (const bid of newBadges) {
      const b = BADGES.find((x) => x.id === bid);
      this.milestones.push(`🏅 BADGE UNLOCKED: ${b ? b.emoji + ' ' + b.title : bid} (Attempt #${p.totalPracticed})`);
    }
  }

  simulateRound(wordSubset, isReview = false) {
    for (const w of wordSubset) {
      let isCorrect = false;
      const roll = Math.random();

      if (this.typoTendency) {
        // Test edge cases: 75% intention, with variations like accents or hyphens
        if (roll < this.accuracyRate) {
          let testInput = w.word;
          // Sub-cases
          if (w.word.includes('ñ')) testInput = w.word.replace('ñ', 'n'); // pinata
          else if (w.word.includes('é')) testInput = w.word.replace('é', 'e'); // eclair
          else if (w.word.includes('-')) testInput = w.word.replace('-', ' '); // space instead of hyphen
          else if (Math.random() < 0.2) testInput = w.word.toUpperCase(); // uppercase typing

          isCorrect = checkSpelling(testInput, w);
        } else {
          isCorrect = false;
        }
      } else {
        isCorrect = roll < this.accuracyRate;
      }

      // 10% chance of using voice input
      const usedVoice = Math.random() < 0.1;
      this.recordAttempt(w, isCorrect, usedVoice);
    }
  }

  simulateStudyJourney(totalAttempts = 500) {
    let attemptsDone = 0;
    while (attemptsDone < totalAttempts) {
      // If student has review words and rolls review chance, practice missed words!
      if (this.reviewQueue.length >= 5 && Math.random() < 0.35) {
        const reviewWordObjs = this.reviewQueue.slice(0, 10).map((id) => words.find((x) => x.id === id));
        this.simulateRound(reviewWordObjs, true);
        attemptsDone += reviewWordObjs.length;
        // Clean up reviewQueue if mastered
        this.reviewQueue = this.reviewQueue.filter((id) => this.progressMap[id].status !== 'mastered_review');
      } else {
        // Practice a random batch of 10 words from 450
        const startIdx = Math.floor(Math.random() * (words.length - 10));
        const batch = words.slice(startIdx, startIdx + 10);
        this.simulateRound(batch, false);
        attemptsDone += 10;
      }
    }
  }

  getSummary() {
    const p = this.profile;
    const rank = getBeeRank(p.honeyPoints);
    const accuracy = Math.round((p.totalCorrect / Math.max(1, p.totalPracticed)) * 100);

    let masteredReviewCount = 0;
    let needsReviewCount = 0;
    let correctCount = 0;

    Object.values(this.progressMap).forEach((pm) => {
      if (pm.status === 'mastered_review') masteredReviewCount++;
      else if (pm.status === 'needs_review') needsReviewCount++;
      else if (pm.status === 'correct') correctCount++;
    });

    return {
      name: this.name,
      avatar: this.avatar,
      totalPracticed: p.totalPracticed,
      totalCorrect: p.totalCorrect,
      accuracy: `${accuracy}%`,
      honeyPoints: p.honeyPoints,
      bestStreak: p.bestStreak,
      finalRank: `${rank.emoji} ${rank.title} (Lv ${rank.level})`,
      badgesCount: `${p.unlockedBadges.length} / 10`,
      badgesList: p.unlockedBadges.map((id) => BADGES.find((b) => b.id === id)?.title).join(', '),
      uniqueWordsCovered: Object.keys(this.progressMap).length,
      firstTryMastered: correctCount,
      activeNeedsReview: needsReviewCount,
      graduatedFromWrongWords: masteredReviewCount,
      milestones: this.milestones
    };
  }
}

// RUN THE SIMULATION
console.log('====================================================');
console.log('🤖 AI Student Persona 500-Attempt Simulation (Test 2)');
console.log('====================================================\n');

// Persona 1: Alex (Honor Student - 92% Accuracy)
const alex = new VirtualStudentSimulator('Alex (모범생 봇)', '🐝', 0.92);
alex.simulateStudyJourney(500);
const alexRes = alex.getSummary();

// Persona 2: Bella (Beginner Student - 52% Accuracy, Heavy Review)
const bella = new VirtualStudentSimulator('Bella (초보 학생 봇)', '🌸', 0.52);
bella.simulateStudyJourney(500);
const bellaRes = bella.getSummary();

// Persona 3: Charlie (Typo & Edge Case Tester - 75% + Accents/Hyphens/Case)
const charlie = new VirtualStudentSimulator('Charlie (오타/엣지케이스 봇)', '🦊', 0.75, true);
charlie.simulateStudyJourney(500);
const charlieRes = charlie.getSummary();

function printPersonaResult(res) {
  console.log(`----------------------------------------------------`);
  console.log(`👤 ${res.avatar} ${res.name}`);
  console.log(`----------------------------------------------------`);
  console.log(`• 문제 풀이 수: ${res.totalPracticed}회 (정답률: ${res.accuracy})`);
  console.log(`• 최종 획득 꿀: 🍯 ${res.honeyPoints} points`);
  console.log(`• 최고 연속 정답(Streak): 🔥 ${res.bestStreak}연속`);
  console.log(`• 최종 진화 계급: ${res.finalRank}`);
  console.log(`• 획득 배지 수: 🏅 ${res.badgesCount}`);
  console.log(`• 언락된 배지 목록: [ ${res.badgesList} ]`);
  console.log(`• 학습한 고유 단어 수: ${res.uniqueWordsCovered}/450 단어`);
  console.log(`• 단어 마스터리 상태:`);
  console.log(`    - 한 번에 맞힘 (Clean Master): ${res.firstTryMastered}개`);
  console.log(`    - 오답노트에서 극복 졸업 (Graduated): ${res.graduatedFromWrongWords}개`);
  console.log(`    - 현재 복습 대기 중 (Needs Review): ${res.activeNeedsReview}개`);
  console.log(`\n• 주요 성장 마일스톤 로그 (타임라인):`);
  res.milestones.slice(0, 10).forEach((m) => console.log(`   ${m}`));
  if (res.milestones.length > 10) {
    console.log(`   ... 외 ${res.milestones.length - 10}개의 마일스톤 달성!`);
  }
  console.log('\n');
}

printPersonaResult(alexRes);
printPersonaResult(bellaRes);
printPersonaResult(charlieRes);

console.log('====================================================');
console.log('🏁 3인 AI 가상 사용자 1,500회 풀이 시뮬레이션 완료!');
console.log('====================================================');
