import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CharacterWardrobeModal } from '../components/CharacterWardrobeModal';
import {
  BadgeInfo,
  BeeLevel,
  BeeRank,
  CharacterCustomization,
  QuizCount,
  QuizOrder,
  QuizPoolFilter,
  QuizSessionConfig,
  SpellerProfile,
  WordEntry,
  WordProgress
} from '../types/spelling';
import { getSpendableHoney } from '../utils/characterShopData';
import { BADGES, BEE_RANKS, getBeeRank } from '../utils/spellingUtils';

interface HomeScreenProps {
  profile: SpellerProfile;
  allWords: WordEntry[];
  progressMap: Record<number, WordProgress>;
  onOpenProfileModal: () => void;
  onStartQuiz: (config: QuizSessionConfig) => void;
  onNavigateTab: (tab: 'home' | 'study' | 'review') => void;
  onSaveCustomization: (payload: {
    spentHoney: number;
    ownedItems: string[];
    customization: CharacterCustomization;
  }) => Promise<void>;
}

const LEVEL_CARDS: {
  level: BeeLevel;
  bees: string;
  title: string;
  grade: string;
  accentColor: string;
  shadowColor: string;
  bgTint: string;
}[] = [
  {
    level: 'One Bee',
    bees: '🐝',
    title: 'One Bee',
    grade: 'Beginner',
    accentColor: '#F59E0B',
    shadowColor: '#B45309',
    bgTint: '#FFFBEB'
  },
  {
    level: 'Two Bee',
    bees: '🐝🐝',
    title: 'Two Bee',
    grade: 'Intermediate',
    accentColor: '#0284C7',
    shadowColor: '#0369A1',
    bgTint: '#F0F9FF'
  },
  {
    level: 'Three Bee',
    bees: '🐝🐝🐝',
    title: 'Three Bee',
    grade: 'Advanced',
    accentColor: '#7C3AED',
    shadowColor: '#5B21B6',
    bgTint: '#F5F3FF'
  }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  allWords,
  progressMap,
  onStartQuiz,
  onSaveCustomization
}) => {
  const [setupLevel, setSetupLevel] = useState<BeeLevel | 'All' | null>(null);
  const [selectedCount, setSelectedCount] = useState<QuizCount>(10);
  const [selectedOrder, setSelectedOrder] = useState<QuizOrder>('random');
  const [selectedOffset, setSelectedOffset] = useState<number>(0);
  const [selectedPoolFilter, setSelectedPoolFilter] = useState<QuizPoolFilter>('unmastered_only');

  // Detail popup state for Evolution Rank and Badge
  const [selectedRankDetail, setSelectedRankDetail] = useState<BeeRank | null>(null);
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<BadgeInfo | null>(null);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);

  const spendableHoney = getSpendableHoney(profile);
  const rank = getBeeRank(profile.honeyPoints);
  const progressPercent = rank.nextHoney
    ? Math.min(
        100,
        Math.round(
          ((profile.honeyPoints - rank.minHoney) / (rank.nextHoney - rank.minHoney)) * 100
        )
      )
    : 100;

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
    setSelectedPoolFilter('unmastered_only');
  };

  const handleConfirmSetup = () => {
    if (!setupLevel) return;
    const cfg: QuizSessionConfig = {
      mode: 'level',
      level: setupLevel,
      count: selectedCount,
      order: selectedOrder,
      poolFilter: selectedPoolFilter,
      startOffset: selectedOrder === 'sequential' ? selectedOffset : 0
    };
    setSetupLevel(null);
    onStartQuiz(cfg);
  };

  const allStats = getLevelStats('All');
  const allPct = Math.round((allStats.mastered / Math.max(1, allStats.total)) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Duolingo-Style Character Showcase & Rank Progress Card */}
      <View style={styles.heroCard}>
        <View style={styles.characterHeroRow}>
          <TouchableOpacity
            style={styles.characterStageTouchable}
            onPress={() => setWardrobeOpen(true)}
            activeOpacity={0.88}
          >
            <CharacterAvatar
              customization={profile.customization}
              size={96}
              showBackdrop={true}
            />
          </TouchableOpacity>

          <View style={styles.characterMetaCol}>
            <View style={styles.rankHeaderRow}>
              <Text style={styles.rankTitle} numberOfLines={1}>
                {rank.emoji} {rank.title}
              </Text>
              <View style={styles.rankPtsBadge}>
                <Text style={styles.rankPtsText}>
                  {rank.nextHoney ? `🍯 ${profile.honeyPoints}/${rank.nextHoney}` : '🏆 MAX'}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.characterShopActionRow}>
              <View style={styles.spendableHoneyPill}>
                <Text style={styles.spendableHoneyLabel}>Shop Honey</Text>
                <Text style={styles.spendableHoneyValue}>🍯 {spendableHoney}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dressUpShopBtn}
              onPress={() => setWardrobeOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.dressUpShopBtnText}>✨ Dress Up & Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Active Wrong Words Quick Play Card */}
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
            <View>
              <Text style={styles.reviewBannerTitle}>
                {activeWrongWordsCount} Tricky {activeWrongWordsCount === 1 ? 'Word' : 'Words'}
              </Text>
              <Text style={styles.reviewBannerSub}>Practice & Master Your Mistakes</Text>
            </View>
          </View>
          <View style={styles.reviewPlayCircle}>
            <Text style={styles.reviewPlayIcon}>▶</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Chunky Duolingo-Style Level Cards */}
      {LEVEL_CARDS.map((card) => {
        const stats = getLevelStats(card.level);
        const pct = Math.round((stats.mastered / stats.total) * 100);
        return (
          <TouchableOpacity
            key={card.level}
            style={[
              styles.levelCard,
              {
                backgroundColor: card.bgTint,
                borderColor: card.accentColor,
                borderBottomColor: card.shadowColor
              }
            ]}
            onPress={() => openLevelSetup(card.level)}
            activeOpacity={0.85}
          >
            <View style={styles.levelCardTop}>
              <View style={styles.levelLeft}>
                <Text style={styles.levelBees}>{card.bees}</Text>
                <View>
                  <Text style={styles.levelTitle}>{card.title}</Text>
                  <View style={[styles.gradePill, { backgroundColor: card.accentColor }]}>
                    <Text style={styles.gradePillText}>{card.grade}</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.playCircleBtn,
                  {
                    backgroundColor: card.accentColor,
                    borderBottomColor: card.shadowColor
                  }
                ]}
              >
                <Text style={styles.playCircleIcon}>▶</Text>
              </View>
            </View>

            <View style={styles.levelProgressSection}>
              <View style={styles.levelBarBg}>
                <View
                  style={[
                    styles.levelBarFill,
                    { width: `${pct}%`, backgroundColor: card.accentColor }
                  ]}
                />
              </View>
              <View style={styles.levelProgressLabels}>
                <Text style={styles.levelProgressText}>
                  ✅ {stats.mastered}/{stats.total}
                </Text>
                {stats.needsReview > 0 && (
                  <Text style={styles.levelNeedsReviewText}>🎯 {stats.needsReview}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* All 450 Words Card */}
      <TouchableOpacity
        style={styles.allWordsCard}
        onPress={() => openLevelSetup('All')}
        activeOpacity={0.85}
      >
        <View style={styles.levelCardTop}>
          <View style={styles.levelLeft}>
            <Text style={styles.allWordsTrophy}>🏆</Text>
            <View>
              <Text style={styles.allWordsTitle}>All 450</Text>
              <Text style={styles.allWordsCount}>✅ {allStats.mastered}/450</Text>
            </View>
          </View>
          <View style={styles.allWordsPlayBtn}>
            <Text style={styles.allWordsPlayIcon}>▶</Text>
          </View>
        </View>
        <View style={styles.allWordsBarBg}>
          <View style={[styles.allWordsBarFill, { width: `${allPct}%` }]} />
        </View>
      </TouchableOpacity>

      {/* Bee Evolution Path (Pure Icon Strip) */}
      <View style={styles.iconSectionHeader}>
        <Text style={styles.iconSectionEmoji}>👑</Text>
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
            <TouchableOpacity
              key={r.level}
              style={[
                styles.rankStepCard,
                unlocked && styles.rankStepUnlocked,
                isCurrent && styles.rankStepCurrent
              ]}
              onPress={() => setSelectedRankDetail(r)}
              activeOpacity={0.8}
            >
              <Text style={styles.rankStepEmoji}>{r.emoji}</Text>
              <Text style={styles.rankStepPts}>🍯 {r.minHoney}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Trophy & Badge Grid (Icon-First) */}
      <View style={styles.iconSectionHeader}>
        <Text style={styles.iconSectionEmoji}>🏅</Text>
        <Text style={styles.iconSectionCount}>
          {profile.unlockedBadges.length}/{BADGES.length}
        </Text>
      </View>

      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const isUnlocked = profile.unlockedBadges.includes(b.id);
          return (
            <TouchableOpacity
              key={b.id}
              style={[styles.badgeCard, isUnlocked && styles.badgeCardUnlocked]}
              onPress={() => setSelectedBadgeDetail(b)}
              activeOpacity={0.8}
            >
              <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>
                {b.emoji}
              </Text>
              <Text style={styles.badgeTitle} numberOfLines={1}>
                {b.title}
              </Text>
              <Text style={styles.badgeLockIcon}>{isUnlocked ? '✅' : '🔒'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Duolingo-Style Session Setup Modal */}
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
                {setupLevel === 'One Bee'
                  ? '🐝 One Bee'
                  : setupLevel === 'Two Bee'
                  ? '🐝🐝 Two Bee'
                  : setupLevel === 'Three Bee'
                  ? '🐝🐝🐝 Three Bee'
                  : '🏆 All 450'}
              </Text>
              <TouchableOpacity
                onPress={() => setSetupLevel(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Pool Filter Toggle (Unmastered vs All) */}
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.filterTile,
                  selectedPoolFilter === 'unmastered_only' && styles.optionBtnActive
                ]}
                onPress={() => setSelectedPoolFilter('unmastered_only')}
              >
                <Text
                  style={[
                    styles.filterTileText,
                    selectedPoolFilter === 'unmastered_only' && styles.optionBtnTextActive
                  ]}
                >
                  🌱 New & Tricky Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTile,
                  selectedPoolFilter === 'all' && styles.optionBtnActive
                ]}
                onPress={() => setSelectedPoolFilter('all')}
              >
                <Text
                  style={[
                    styles.filterTileText,
                    selectedPoolFilter === 'all' && styles.optionBtnTextActive
                  ]}
                >
                  🔄 All Words
                </Text>
              </TouchableOpacity>
            </View>

            {/* Count Selection (Big Number Tiles) */}
            <View style={styles.optionRow}>
              {([10, 20, 50, 150] as QuizCount[]).map((cnt) => (
                <TouchableOpacity
                  key={cnt}
                  style={[
                    styles.countTile,
                    selectedCount === cnt && styles.optionBtnActive
                  ]}
                  onPress={() => setSelectedCount(cnt)}
                >
                  <Text
                    style={[
                      styles.countTileNumber,
                      selectedCount === cnt && styles.optionBtnTextActive
                    ]}
                  >
                    {cnt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Order Selection (Big Icon Toggle) */}
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.orderTile,
                  selectedOrder === 'random' && styles.optionBtnActive
                ]}
                onPress={() => setSelectedOrder('random')}
              >
                <Text style={styles.orderTileEmoji}>🔀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTile,
                  selectedOrder === 'sequential' && styles.optionBtnActive
                ]}
                onPress={() => setSelectedOrder('sequential')}
              >
                <Text style={styles.orderTileEmoji}>🔢</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder === 'sequential' && setupLevel !== 'All' && (
              <View style={styles.optionRow}>
                {[
                  { label: '1–50', offset: 0 },
                  { label: '51–100', offset: 50 },
                  { label: '101–150', offset: 100 }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.offset}
                    style={[
                      styles.rangeTile,
                      selectedOffset === item.offset && styles.optionBtnActive
                    ]}
                    onPress={() => setSelectedOffset(item.offset)}
                  >
                    <Text
                      style={[
                        styles.rangeTileText,
                        selectedOffset === item.offset && styles.optionBtnTextActive
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.launchQuizBtn} onPress={handleConfirmSetup}>
              <Text style={styles.launchQuizBtnText}>▶ Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Character Wardrobe & Shop Modal */}
      <CharacterWardrobeModal
        visible={wardrobeOpen}
        profile={profile}
        onClose={() => setWardrobeOpen(false)}
        onSaveCustomization={onSaveCustomization}
      />

      {/* Rank Detail Popup Modal */}
      <Modal
        visible={selectedRankDetail !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedRankDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailPopupCard}>
            <View style={styles.detailPopupHeader}>
              <Text style={styles.detailPopupEmoji}>{selectedRankDetail?.emoji}</Text>
              <TouchableOpacity
                onPress={() => setSelectedRankDetail(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailPopupTitle}>
              Rank {selectedRankDetail?.level}: {selectedRankDetail?.title}
            </Text>

            <View style={styles.detailPointsPill}>
              <Text style={styles.detailPointsText}>
                🍯 Requires {selectedRankDetail?.minHoney} Honey Points
              </Text>
            </View>

            <Text style={styles.detailPopupDesc}>{selectedRankDetail?.description}</Text>

            <View style={styles.detailStatusRow}>
              {profile.honeyPoints >= (selectedRankDetail?.minHoney || 0) ? (
                <View style={[styles.detailStatusBadge, styles.statusBadgeUnlocked]}>
                  <Text style={styles.statusBadgeTextUnlocked}>✅ UNLOCKED</Text>
                </View>
              ) : (
                <View style={[styles.detailStatusBadge, styles.statusBadgeLocked]}>
                  <Text style={styles.statusBadgeTextLocked}>
                    🔒 Need {(selectedRankDetail?.minHoney || 0) - profile.honeyPoints} more 🍯
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.detailDoneBtn}
              onPress={() => setSelectedRankDetail(null)}
            >
              <Text style={styles.detailDoneBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Badge Detail Popup Modal */}
      <Modal
        visible={selectedBadgeDetail !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedBadgeDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailPopupCard}>
            <View style={styles.detailPopupHeader}>
              <Text style={styles.detailPopupEmoji}>{selectedBadgeDetail?.emoji}</Text>
              <TouchableOpacity
                onPress={() => setSelectedBadgeDetail(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailPopupTitle}>{selectedBadgeDetail?.title}</Text>

            <Text style={styles.detailPopupDesc}>{selectedBadgeDetail?.description}</Text>

            <View style={styles.detailStatusRow}>
              {selectedBadgeDetail && profile.unlockedBadges.includes(selectedBadgeDetail.id) ? (
                <View style={[styles.detailStatusBadge, styles.statusBadgeUnlocked]}>
                  <Text style={styles.statusBadgeTextUnlocked}>✅ UNLOCKED</Text>
                </View>
              ) : (
                <View style={[styles.detailStatusBadge, styles.statusBadgeLocked]}>
                  <Text style={styles.statusBadgeTextLocked}>🔒 LOCKED</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.detailDoneBtn}
              onPress={() => setSelectedBadgeDetail(null)}
            >
              <Text style={styles.detailDoneBtnText}>OK</Text>
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
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#FFC72C'
  },
  rankBox: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#FFC72C'
  },
  rankBigEmoji: {
    fontSize: 34
  },
  rankInfo: {
    flex: 1
  },
  rankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 4
  },
  rankTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFC72C',
    flexShrink: 1
  },
  rankPtsText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FDE68A'
  },
  rankPtsBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    flexShrink: 0
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFC72C',
    borderRadius: 999
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#EF4444',
    borderBottomColor: '#B91C1C',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 16
  },
  reviewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1
  },
  reviewBannerEmoji: {
    fontSize: 36
  },
  reviewBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#991B1B'
  },
  reviewBannerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2
  },
  reviewPlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#991B1B'
  },
  reviewPlayIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  levelCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2.5,
    borderBottomWidth: 6
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  levelBees: {
    fontSize: 32
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4
  },
  gradePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999
  },
  gradePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  },
  playCircleBtn: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4
  },
  playCircleIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900'
  },
  levelProgressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  levelBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
    borderRadius: 999,
    overflow: 'hidden'
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 999
  },
  levelProgressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  levelProgressText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#334155'
  },
  levelNeedsReviewText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626'
  },
  allWordsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2.5,
    borderBottomWidth: 6,
    borderColor: '#FFC72C',
    borderBottomColor: '#D97706'
  },
  allWordsTrophy: {
    fontSize: 38
  },
  allWordsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  allWordsCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE68A',
    marginTop: 2
  },
  allWordsPlayBtn: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFC72C',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#D97706'
  },
  allWordsPlayIcon: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A'
  },
  allWordsBarBg: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden'
  },
  allWordsBarFill: {
    height: '100%',
    backgroundColor: '#FFC72C',
    borderRadius: 999
  },
  iconSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4
  },
  iconSectionEmoji: {
    fontSize: 28
  },
  iconSectionCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A'
  },
  ranksScroll: {
    gap: 10,
    paddingBottom: 18
  },
  rankStepCard: {
    width: 92,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    opacity: 0.55
  },
  rankStepUnlocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    opacity: 1
  },
  rankStepCurrent: {
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7'
  },
  rankStepEmoji: {
    fontSize: 34,
    marginBottom: 6
  },
  rankStepPts: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400E'
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  badgeCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  badgeCardUnlocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderBottomColor: '#D97706'
  },
  badgeEmoji: {
    fontSize: 34,
    marginBottom: 6
  },
  badgeEmojiLocked: {
    opacity: 0.3
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4
  },
  badgeLockIcon: {
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: '#FFC72C',
    borderBottomColor: '#D97706'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A'
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#475569'
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  filterTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterTileText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#334155'
  },
  countTile: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countTileNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#334155'
  },
  orderTile: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orderTileEmoji: {
    fontSize: 30
  },
  rangeTile: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rangeTileText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#334155'
  },
  optionBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderBottomColor: '#D97706'
  },
  optionBtnTextActive: {
    color: '#92400E'
  },
  launchQuizBtn: {
    backgroundColor: '#58CC02',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#46A302',
    marginTop: 4
  },
  launchQuizBtnText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  detailPopupCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: '#FFC72C',
    borderBottomColor: '#D97706',
    alignItems: 'center'
  },
  detailPopupHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  detailPopupEmoji: {
    fontSize: 48
  },
  detailPopupTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8
  },
  detailPointsPill: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 10
  },
  detailPointsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309'
  },
  detailPopupDesc: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 16
  },
  detailStatusRow: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center'
  },
  detailStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5
  },
  statusBadgeUnlocked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981'
  },
  statusBadgeTextUnlocked: {
    fontSize: 13,
    fontWeight: '900',
    color: '#065F46'
  },
  statusBadgeLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  },
  statusBadgeTextLocked: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B'
  },
  detailDoneBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#334155'
  },
  detailDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },
  characterHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  characterStageTouchable: {
    borderRadius: 20,
    shadowColor: '#D97706',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    flexShrink: 0
  },
  characterMetaCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center'
  },
  characterShopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
    flexWrap: 'wrap'
  },
  spendableHoneyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4
  },
  spendableHoneyLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E'
  },
  spendableHoneyValue: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#B45309'
  },
  dressUpShopBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#334155'
  },
  dressUpShopBtnText: {
    color: '#FDE047',
    fontSize: 12.5,
    fontWeight: '900'
  }
});
