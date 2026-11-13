import React, { useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { QuizSessionConfig, WordEntry, WordProgress } from '../types/spelling';
import { speakWord } from '../utils/speechUtils';

interface ReviewScreenProps {
  allWords: WordEntry[];
  progressMap: Record<number, WordProgress>;
  onStartReviewQuiz: (config: QuizSessionConfig) => void;
  onToggleMastery: (wordId: number, markMastered: boolean) => void;
}

type ReviewFilter = 'active' | 'mastered' | 'all';

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  allWords,
  progressMap,
  onStartReviewQuiz,
  onToggleMastery
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('active');

  const { activeList, masteredList, allMissedList } = useMemo(() => {
    const active: { word: WordEntry; prog: WordProgress }[] = [];
    const mastered: { word: WordEntry; prog: WordProgress }[] = [];
    const allMissed: { word: WordEntry; prog: WordProgress }[] = [];

    for (const w of allWords) {
      const p = progressMap[w.id];
      if (!p) continue;
      if (p.wrongCount > 0 || p.status === 'needs_review' || p.status === 'mastered_review') {
        allMissed.push({ word: w, prog: p });
        if (p.status === 'needs_review') {
          active.push({ word: w, prog: p });
        } else if (p.status === 'mastered_review') {
          mastered.push({ word: w, prog: p });
        }
      }
    }
    return { activeList: active, masteredList: mastered, allMissedList: allMissed };
  }, [allWords, progressMap]);

  const displayedItems =
    filter === 'active'
      ? activeList
      : filter === 'mastered'
      ? masteredList
      : allMissedList;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Big Chunky Play Buttons for Review */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.practiceActiveBtn,
            activeList.length === 0 && styles.disabledBtn
          ]}
          disabled={activeList.length === 0}
          onPress={() =>
            onStartReviewQuiz({
              mode: 'review_active',
              count: 50,
              order: 'random'
            })
          }
        >
          <Text style={styles.bigBtnEmoji}>🎯</Text>
          <Text style={styles.practiceActiveBtnText}>▶ ({activeList.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.practiceAllBtn,
            allMissedList.length === 0 && styles.disabledBtn
          ]}
          disabled={allMissedList.length === 0}
          onPress={() =>
            onStartReviewQuiz({
              mode: 'review_all',
              count: 50,
              order: 'random'
            })
          }
        >
          <Text style={styles.bigBtnEmoji}>🔄</Text>
          <Text style={styles.practiceAllBtnText}>▶ ({allMissedList.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Visual Icon Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            🎯 {activeList.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'mastered' && styles.filterTabActive]}
          onPress={() => setFilter('mastered')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'mastered' && styles.filterTabTextActive
            ]}
          >
            ✅ {masteredList.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            📚 {allMissedList.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Word Cards */}
      {displayedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎉</Text>
        </View>
      ) : (
        displayedItems.map(({ word, prog }) => {
          const isMastered = prog.status === 'mastered_review';
          const streakProgress = Math.min(2, prog.reviewStreak);
          return (
            <View key={word.id} style={styles.wordCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.wordTitleWrap}>
                  <View style={styles.numBadge}>
                    <Text style={styles.wordNumber}>#{word.id}</Text>
                  </View>
                  <Text style={styles.wordText}>{word.word}</Text>
                </View>

                <View style={styles.audioBtns}>
                  <TouchableOpacity
                    style={styles.audioPill}
                    onPress={() => speakWord(word, false)}
                  >
                    <Text style={styles.actionEmoji}>🔊</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.audioPillSlow}
                    onPress={() => speakWord(word, true)}
                  >
                    <Text style={styles.actionEmoji}>🐢</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Visual Progress Dots & Actions */}
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.statusBadge,
                    isMastered ? styles.statusMastered : styles.statusNeedsReview
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isMastered ? styles.statusTextMastered : styles.statusTextNeedsReview
                    ]}
                  >
                    {isMastered ? '✅ 2/2' : `🎯 ${streakProgress}/2`}
                  </Text>
                </View>

                <View style={styles.cardFooterRight}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/search?q=define+${encodeURIComponent(word.word)}`
                      )
                    }
                  >
                    <Text style={styles.iconBtnText}>🔗</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleMasteryBtn}
                    onPress={() => onToggleMastery(word.id, !isMastered)}
                  >
                    <Text style={styles.toggleMasteryText}>{isMastered ? '↩️' : '✅'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.posAndDef}>{word.definition}</Text>
            </View>
          );
        })
      )}
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  practiceActiveBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: '#B91C1C',
    flexDirection: 'row',
    gap: 10
  },
  practiceActiveBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22
  },
  practiceAllBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: '#FFC72C',
    borderBottomColor: '#D97706',
    flexDirection: 'row',
    gap: 10
  },
  practiceAllBtnText: {
    color: '#FFC72C',
    fontWeight: '900',
    fontSize: 22
  },
  bigBtnEmoji: {
    fontSize: 28
  },
  disabledBtn: {
    opacity: 0.4
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
    padding: 5,
    marginBottom: 16,
    gap: 6
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1'
  },
  filterTabText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#64748B'
  },
  filterTabTextActive: {
    color: '#0F172A'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#E2E8F0'
  },
  emptyEmoji: {
    fontSize: 64
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#E2E8F0'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  wordTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  numBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  wordNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFC72C'
  },
  wordText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A'
  },
  audioBtns: {
    flexDirection: 'row',
    gap: 8
  },
  audioPill: {
    width: 46,
    height: 46,
    backgroundColor: '#FFC72C',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#D97706'
  },
  audioPillSlow: {
    width: 46,
    height: 46,
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: '#38BDF8',
    borderBottomColor: '#0284C7'
  },
  actionEmoji: {
    fontSize: 20
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusNeedsReview: {
    backgroundColor: '#FEE2E2'
  },
  statusMastered: {
    backgroundColor: '#DCFCE7'
  },
  statusBadgeText: {
    fontSize: 15,
    fontWeight: '900'
  },
  statusTextNeedsReview: {
    color: '#B91C1C'
  },
  statusTextMastered: {
    color: '#15803D'
  },
  cardFooterRight: {
    flexDirection: 'row',
    gap: 8
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#CBD5E1'
  },
  iconBtnText: {
    fontSize: 18
  },
  toggleMasteryBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#CBD5E1'
  },
  toggleMasteryText: {
    fontSize: 18
  },
  posAndDef: {
    fontSize: 17,
    color: '#1E293B',
    lineHeight: 24,
    fontWeight: '600'
  }
});
