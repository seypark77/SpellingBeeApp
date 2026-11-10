import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  BeeLevel,
  QuizCount,
  QuizOrder,
  QuizSessionConfig,
  SpellerProfile,
  WordEntry,
  WordProgress
} from '../types/spelling';
import { BADGES, BEE_RANKS, getBeeRank } from '../utils/spellingUtils';

interface HomeScreenProps {
  profile: SpellerProfile;
  allWords: WordEntry[];
  progressMap: Record<number, WordProgress>;
  onOpenProfileModal: () => void;
  onStartQuiz: (config: QuizSessionConfig) => void;
  onNavigateTab: (tab: 'home' | 'study' | 'review') => void;
}

const LEVEL_CARDS: {
  level: BeeLevel;
  bees: string;
  title: string;
  grade: string;
  rangeText: string;
  accentColor: string;
  bgTint: string;
}[] = [
  {
    level: 'One Bee',
    bees: '🐝',
    title: 'One Bee',
    grade: '1st – 3rd Grade',
    rangeText: 'Words #1 – #150',
    accentColor: '#F59E0B',
    bgTint: '#FFFBEB'
  },
  {
    level: 'Two Bee',
    bees: '🐝🐝',
    title: 'Two Bee',
    grade: '4th – 6th Grade',
    rangeText: 'Words #151 – #300',
    accentColor: '#0284C7',
    bgTint: '#F0F9FF'
  },
  {
    level: 'Three Bee',
    bees: '🐝🐝🐝',
    title: 'Three Bee',
    grade: '7th – 8th Grade',
    rangeText: 'Words #301 – #450',
    accentColor: '#7C3AED',
    bgTint: '#F5F3FF'
  }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  allWords,
  progressMap,
  onOpenProfileModal,
  onStartQuiz,
  onNavigateTab
}) => {
  const [setupLevel, setSetupLevel] = useState<BeeLevel | 'All' | null>(null);
  const [selectedCount, setSelectedCount] = useState<QuizCount>(10);
  const [selectedOrder, setSelectedOrder] = useState<QuizOrder>('random');
  const [selectedOffset, setSelectedOffset] = useState<number>(0);

  const rank = getBeeRank(profile.honeyPoints);
  const progressPercent = rank.nextHoney
    ? Math.min(
        100,
        Math.round(
          ((profile.honeyPoints - rank.minHoney) / (rank.nextHoney - rank.minHoney)) * 100
        )
      )
    : 100;

  // Compute level stats
  const getLevelStats = (lvl: BeeLevel | 'All') => {
    const words = lvl === 'All' ? allWords : allWords.filter((w) => w.level === lvl);
    let mastered = 0;
    let needsReview = 0;
    for (const w of words) {
      const p = progressMap[w.id];
      if (!p) continue;
      if (p.status === 'correct' || p.status === 'mastered_review') mastered++;
      if (p.status === 'needs_review') needsReview++;
    }
    return { total: words.length, mastered, needsReview };
  };

  const activeWrongWordsCount = Object.values(progressMap).filter(
    (p) => p.status === 'needs_review'
  ).length;

  const openLevelSetup = (lvl: BeeLevel | 'All') => {
    setSetupLevel(lvl);
    setSelectedCount(10);
    setSelectedOrder('random');
    setSelectedOffset(0);
  };

  const handleConfirmSetup = () => {
    if (!setupLevel) return;
    const cfg: QuizSessionConfig = {
      mode: 'level',
      level: setupLevel,
      count: selectedCount,
      order: selectedOrder,
      startOffset: selectedOrder === 'sequential' ? selectedOffset : 0
    };
    setSetupLevel(null);
    onStartQuiz(cfg);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Official-Style Banner */}
      <View style={styles.heroCard}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.profilePill} onPress={onOpenProfileModal}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarEmoji}>{profile.avatar}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{profile.name} ▾</Text>
              <Text style={styles.profileSub}>{profile.grade}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statsPillRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>🍯 {profile.honeyPoints}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>🔥 {profile.currentStreak}</Text>
            </View>
          </View>
        </View>

        {/* Bee Character Growth Card */}
        <View style={styles.rankBox}>
          <View style={styles.rankIconBox}>
            <Text style={styles.rankBigEmoji}>{rank.emoji}</Text>
          </View>
          <View style={styles.rankInfo}>
            <View style={styles.rankHeaderRow}>
              <Text style={styles.rankTitle}>
                Rank {rank.level}: {rank.title}
              </Text>
              <Text style={styles.rankPtsText}>
                {rank.nextHoney
                  ? `${profile.honeyPoints} / ${rank.nextHoney} 🍯`
                  : 'MAX RANK 🏆'}
              </Text>
            </View>
            <Text style={styles.rankDesc}>{rank.description}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Active Wrong Words Alert Banner */}
      {activeWrongWordsCount > 0 && (
        <TouchableOpacity
          style={styles.reviewBanner}
          onPress={() =>
            onStartQuiz({
              mode: 'review_active',
              count: 20,
              order: 'random'
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.reviewBannerLeft}>
            <Text style={styles.reviewBannerEmoji}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewBannerTitle}>
                {activeWrongWordsCount} Tricky {activeWrongWordsCount === 1 ? 'Word' : 'Words'} to
                Review!
              </Text>
              <Text style={styles.reviewBannerSub}>
                Spell missed words right twice to master them & earn bonus 🍯!
              </Text>
            </View>
          </View>
          <View style={styles.reviewBannerBtn}>
            <Text style={styles.reviewBannerBtnText}>Practice ▸</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Section: 2026-2027 Official Study List Divisions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🐝 2026–2027 Study List Divisions</Text>
        <Text style={styles.sectionSubtitle}>
          Choose a level to practice spelling by ear or voice, just like the real Bee!
        </Text>
      </View>

      {LEVEL_CARDS.map((card) => {
        const stats = getLevelStats(card.level);
        const pct = Math.round((stats.mastered / stats.total) * 100);
        return (
          <TouchableOpacity
            key={card.level}
            style={[
              styles.levelCard,
              { backgroundColor: card.bgTint, borderColor: card.accentColor }
            ]}
            onPress={() => openLevelSetup(card.level)}
            activeOpacity={0.85}
          >
            <View style={styles.levelCardTop}>
              <View>
                <View style={styles.levelBadgeRow}>
                  <Text style={styles.levelBees}>{card.bees}</Text>
                  <View style={[styles.gradePill, { backgroundColor: card.accentColor }]}>
                    <Text style={styles.gradePillText}>{card.grade}</Text>
                  </View>
                </View>
                <Text style={styles.levelTitle}>{card.title}</Text>
                <Text style={styles.levelRange}>{card.rangeText}</Text>
              </View>

              <View style={[styles.startBadge, { backgroundColor: card.accentColor }]}>
                <Text style={styles.startBadgeText}>PRACTICE ▸</Text>
              </View>
            </View>

            <View style={styles.levelProgressSection}>
              <View style={styles.levelProgressLabels}>
                <Text style={styles.levelProgressText}>
                  ✅ {stats.mastered} / {stats.total} Mastered ({pct}%)
                </Text>
                {stats.needsReview > 0 && (
                  <Text style={styles.levelNeedsReviewText}>
                    ⚠️ {stats.needsReview} in Review
                  </Text>
                )}
              </View>
              <View style={styles.levelBarBg}>
                <View
                  style={[
                    styles.levelBarFill,
                    { width: `${pct}%`, backgroundColor: card.accentColor }
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* All 450 Words Championship Card */}
      <TouchableOpacity
        style={styles.allWordsCard}
        onPress={() => openLevelSetup('All')}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.allWordsTag}>🏆 NATIONAL CHAMPIONSHIP MIX</Text>
          <Text style={styles.allWordsTitle}>All 450 Words (Full List)</Text>
          <Text style={styles.allWordsSub}>
            Test yourself across One Bee, Two Bee, and Three Bee combined!
          </Text>
        </View>
        <View style={styles.allWordsAction}>
          <Text style={styles.allWordsActionText}>START ▸</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Study & Review Shortcuts */}
      <View style={styles.shortcutRow}>
        <TouchableOpacity
          style={styles.shortcutCard}
          onPress={() => onNavigateTab('study')}
        >
          <Text style={styles.shortcutEmoji}>📖</Text>
          <Text style={styles.shortcutTitle}>Study List (450)</Text>
          <Text style={styles.shortcutSub}>Definitions, audio & examples</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutCard}
          onPress={() => onNavigateTab('review')}
        >
          <Text style={styles.shortcutEmoji}>🎯</Text>
          <Text style={styles.shortcutTitle}>Wrong Word Bank</Text>
          <Text style={styles.shortcutSub}>Review & master tricky words</Text>
        </TouchableOpacity>
      </View>

      {/* Bee Evolution Ladder Preview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👑 Bee Evolution Path</Text>
        <Text style={styles.sectionSubtitle}>
          Earn Honey Points (🍯) every time you practice and watch your Bee evolve!
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ranksScroll}
      >
        {BEE_RANKS.map((r) => {
          const unlocked = profile.honeyPoints >= r.minHoney;
          const isCurrent = r.level === rank.level;
          return (
            <View
              key={r.level}
              style={[
                styles.rankStepCard,
                unlocked && styles.rankStepUnlocked,
                isCurrent && styles.rankStepCurrent
              ]}
            >
              <Text style={styles.rankStepEmoji}>{r.emoji}</Text>
              <Text style={styles.rankStepTitle}>{r.title}</Text>
              <Text style={styles.rankStepPts}>{r.minHoney} 🍯</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Trophy & Badge Cabinet */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          🏅 Trophy Cabinet ({profile.unlockedBadges.length}/{BADGES.length})
        </Text>
        <Text style={styles.sectionSubtitle}>
          Collect special badges for streaks, voice spelling, and mastering levels!
        </Text>
      </View>

      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const isUnlocked = profile.unlockedBadges.includes(b.id);
          return (
            <View
              key={b.id}
              style={[styles.badgeCard, isUnlocked && styles.badgeCardUnlocked]}
            >
              <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>
                {b.emoji}
              </Text>
              <Text style={styles.badgeTitle}>{b.title}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
              <View
                style={[
                  styles.badgeStatusPill,
                  isUnlocked ? styles.badgePillUnlocked : styles.badgePillLocked
                ]}
              >
                <Text
                  style={[
                    styles.badgeStatusText,
                    isUnlocked ? styles.badgeStatusTextUnlocked : styles.badgeStatusTextLocked
                  ]}
                >
                  {isUnlocked ? 'UNLOCKED ✓' : 'LOCKED 🔒'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Practice Session Setup Modal */}
      <Modal
        visible={setupLevel !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSetupLevel(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                🐝 {setupLevel === 'All' ? 'All 450 Words' : setupLevel} Practice
              </Text>
              <TouchableOpacity
                onPress={() => setSetupLevel(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>1. HOW MANY WORDS IN THIS SESSION?</Text>
            <View style={styles.optionRow}>
              {([10, 20, 50, 150] as QuizCount[]).map((cnt) => (
                <TouchableOpacity
                  key={cnt}
                  style={[
                    styles.optionBtn,
                    selectedCount === cnt && styles.optionBtnActive
                  ]}
                  onPress={() => setSelectedCount(cnt)}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      selectedCount === cnt && styles.optionBtnTextActive
                    ]}
                  >
                    {cnt === 150 ? 'All (150)' : `${cnt} Words`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>2. WORD ORDER</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionBtn,
                  selectedOrder === 'random' && styles.optionBtnActive
                ]}
                onPress={() => setSelectedOrder('random')}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    selectedOrder === 'random' && styles.optionBtnTextActive
                  ]}
                >
                  🔀 Random Shuffle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionBtn,
                  selectedOrder === 'sequential' && styles.optionBtnActive
                ]}
                onPress={() => setSelectedOrder('sequential')}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    selectedOrder === 'sequential' && styles.optionBtnTextActive
                  ]}
                >
                  🔢 Sequential Order
                </Text>
              </TouchableOpacity>
            </View>

            {selectedOrder === 'sequential' && setupLevel !== 'All' && (
              <>
                <Text style={styles.modalLabel}>3. STARTING WORD RANGE</Text>
                <View style={styles.optionRow}>
                  {[
                    { label: '1st 50 (#1–50)', offset: 0 },
                    { label: '2nd 50 (#51–100)', offset: 50 },
                    { label: '3rd 50 (#101–150)', offset: 100 }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.offset}
                      style={[
                        styles.optionBtn,
                        selectedOffset === item.offset && styles.optionBtnActive
                      ]}
                      onPress={() => setSelectedOffset(item.offset)}
                    >
                      <Text
                        style={[
                          styles.optionBtnText,
                          selectedOffset === item.offset && styles.optionBtnTextActive
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.launchQuizBtn} onPress={handleConfirmSetup}>
              <Text style={styles.launchQuizBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7'
  },
  content: {
    padding: 16,
    paddingBottom: 36,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center'
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFC72C'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC72C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  avatarEmoji: {
    fontSize: 20
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  profileSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  statsPillRow: {
    flexDirection: 'row',
    gap: 8
  },
  statChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  statChipText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E'
  },
  rankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12
  },
  rankIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFC72C'
  },
  rankBigEmoji: {
    fontSize: 28
  },
  rankInfo: {
    flex: 1
  },
  rankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  rankTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFC72C'
  },
  rankPtsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A'
  },
  rankDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 8
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFC72C',
    borderRadius: 4
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18
  },
  reviewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  reviewBannerEmoji: {
    fontSize: 28,
    marginRight: 10
  },
  reviewBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#991B1B'
  },
  reviewBannerSub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2
  },
  reviewBannerBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  reviewBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A'
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2
  },
  levelCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  levelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  levelBees: {
    fontSize: 18
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  gradePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  levelRange: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600'
  },
  startBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12
  },
  startBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.4
  },
  levelProgressSection: {
    marginTop: 2
  },
  levelProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  levelProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  },
  levelNeedsReviewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626'
  },
  levelBarBg: {
    height: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4
  },
  allWordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFC72C'
  },
  allWordsTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFC72C',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  allWordsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  allWordsSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2
  },
  allWordsAction: {
    backgroundColor: '#FFC72C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 10
  },
  allWordsActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A'
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  shortcutEmoji: {
    fontSize: 28,
    marginBottom: 6
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center'
  },
  shortcutSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2
  },
  ranksScroll: {
    gap: 10,
    paddingBottom: 16
  },
  rankStepCard: {
    width: 115,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    opacity: 0.6
  },
  rankStepUnlocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    opacity: 1
  },
  rankStepCurrent: {
    borderWidth: 2.5,
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7'
  },
  rankStepEmoji: {
    fontSize: 28,
    marginBottom: 4
  },
  rankStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center'
  },
  rankStepPts: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  badgeCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  badgeCardUnlocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B'
  },
  badgeEmoji: {
    fontSize: 30,
    marginBottom: 6
  },
  badgeEmojiLocked: {
    opacity: 0.35
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center'
  },
  badgeDesc: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 8,
    lineHeight: 15
  },
  badgeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgePillUnlocked: {
    backgroundColor: '#FEF3C7'
  },
  badgePillLocked: {
    backgroundColor: '#E2E8F0'
  },
  badgeStatusText: {
    fontSize: 10,
    fontWeight: '900'
  },
  badgeStatusTextUnlocked: {
    color: '#B45309'
  },
  badgeStatusTextLocked: {
    color: '#64748B'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 3,
    borderColor: '#FFC72C'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569'
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  optionBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  optionBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155'
  },
  optionBtnTextActive: {
    color: '#92400E'
  },
  launchQuizBtn: {
    backgroundColor: '#FFC72C',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706',
    marginTop: 4
  },
  launchQuizBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  }
});
