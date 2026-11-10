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
      {/* Top Review Summary Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTag}>🎯 PERSONALIZED REVIEW HIVE</Text>
        <Text style={styles.headerTitle}>Wrong Word Bank</Text>
        <Text style={styles.headerSub}>
          Every word you miss is saved here automatically. Spell a tricky word right 2 times in
          Review Mode to graduate it to Mastered!
        </Text>

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
            <Text style={styles.practiceActiveBtnText}>
              🔥 Practice Needs Review ({activeList.length})
            </Text>
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
            <Text style={styles.practiceAllBtnText}>
              🔄 Practice All Past Mistakes ({allMissedList.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text
            style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}
          >
            Needs Practice ({activeList.length})
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
            Mastered ({masteredList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All History ({allMissedList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Word Cards */}
      {displayedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>
            {filter === 'active'
              ? 'No Tricky Words Waiting!'
              : filter === 'mastered'
              ? 'No Mastered Mistakes Yet'
              : 'Your Wrong Word Bank Is Empty!'}
          </Text>
          <Text style={styles.emptyDesc}>
            {filter === 'active'
              ? 'Any word you miss during practice will appear here so you can conquer it!'
              : 'Practice your missed words twice to graduate them to Mastered status!'}
          </Text>
        </View>
      ) : (
        displayedItems.map(({ word, prog }) => {
          const isMastered = prog.status === 'mastered_review';
          const streakProgress = Math.min(2, prog.reviewStreak);
          return (
            <View key={word.id} style={styles.wordCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.wordTitleWrap}>
                  <Text style={styles.wordNumber}>#{word.id}</Text>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{word.level}</Text>
                  </View>
                </View>

                <View style={styles.audioBtns}>
                  <TouchableOpacity
                    style={styles.audioPill}
                    onPress={() => speakWord(word, false)}
                  >
                    <Text style={styles.audioPillText}>🔊 Hear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.audioPillSlow}
                    onPress={() => speakWord(word, true)}
                  >
                    <Text style={styles.audioPillSlowText}>🐢 Slow</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Wrong count & last attempt */}
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
                    {isMastered
                      ? '✅ Mastered (2/2)'
                      : `🎯 Review Progress: ${streakProgress}/2`}
                  </Text>
                </View>

                <Text style={styles.wrongCountText}>
                  Missed {prog.wrongCount} {prog.wrongCount === 1 ? 'time' : 'times'}
                </Text>

                {prog.lastTypedAttempt && (
                  <Text style={styles.lastAttemptText}>
                    Last typed: "{prog.lastTypedAttempt}"
                  </Text>
                )}
              </View>

              <Text style={styles.posAndDef}>
                <Text style={styles.posItalic}>({word.partOfSpeech}) </Text>
                {word.definition}
              </Text>

              <View style={styles.sentenceWrap}>
                <Text style={styles.sentenceText}>"{word.exampleSentence}"</Text>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity onPress={() => Linking.openURL(word.mwUrl)}>
                  <Text style={styles.mwLink}>🔗 Merriam-Webster ↗</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleMasteryBtn}
                  onPress={() => onToggleMastery(word.id, !isMastered)}
                >
                  <Text style={styles.toggleMasteryText}>
                    {isMastered ? '↩ Move Back to Practice' : '✓ Mark as Mastered'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FFC72C',
    marginBottom: 14
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFC72C',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  headerSub: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 19,
    marginBottom: 14
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  practiceActiveBtn: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFC72C',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  practiceActiveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A'
  },
  practiceAllBtn: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#1E293B',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#475569'
  },
  practiceAllBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  disabledBtn: {
    opacity: 0.45
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  filterTabActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569'
  },
  filterTabTextActive: {
    color: '#92400E'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 8
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  wordTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  wordNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B'
  },
  wordText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A'
  },
  levelBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E'
  },
  audioBtns: {
    flexDirection: 'row',
    gap: 6
  },
  audioPill: {
    backgroundColor: '#FFC72C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9
  },
  audioPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A'
  },
  audioPillSlow: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9
  },
  audioPillSlowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusNeedsReview: {
    backgroundColor: '#FEE2E2'
  },
  statusMastered: {
    backgroundColor: '#D1FAE5'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  statusTextNeedsReview: {
    color: '#991B1B'
  },
  statusTextMastered: {
    color: '#065F46'
  },
  wrongCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  lastAttemptText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic'
  },
  posAndDef: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 8
  },
  posItalic: {
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#0284C7'
  },
  sentenceWrap: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC72C',
    marginBottom: 10
  },
  sentenceText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mwLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7'
  },
  toggleMasteryBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  toggleMasteryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  }
});
