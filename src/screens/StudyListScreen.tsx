import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BeeLevel, WordEntry, WordProgress } from '../types/spelling';
import { speakLettersOutLoud, speakText, speakWord } from '../utils/speechUtils';

type StudyFilterKey = 'All' | BeeLevel | 'Mastered';

interface StudyListScreenProps {
  allWords: WordEntry[];
  progressMap: Record<number, WordProgress>;
}

export const StudyListScreen: React.FC<StudyListScreenProps> = ({
  allWords,
  progressMap
}) => {
  const [selectedLevel, setSelectedLevel] = useState<StudyFilterKey>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSpellings, setHideSpellings] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  const masteredCount = useMemo(() => {
    return allWords.filter((w) => {
      const p = progressMap[w.id];
      return p && (p.status === 'correct' || p.status === 'mastered_review');
    }).length;
  }, [allWords, progressMap]);

  const levelTabs: { key: StudyFilterKey; icon: string }[] = useMemo(() => [
    { key: 'All', icon: '🏆 450' },
    { key: 'Mastered', icon: `✅ ${masteredCount}` },
    { key: 'One Bee', icon: '🐝' },
    { key: 'Two Bee', icon: '🐝🐝' },
    { key: 'Three Bee', icon: '🐝🐝🐝' }
  ], [masteredCount]);

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allWords.filter((w) => {
      const p = progressMap[w.id];
      const isMastered = p && (p.status === 'correct' || p.status === 'mastered_review');

      if (selectedLevel === 'Mastered') {
        if (!isMastered) return false;
      } else if (selectedLevel !== 'All' && w.level !== selectedLevel) {
        return false;
      }

      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        String(w.id) === q.replace('#', '') ||
        w.definition.toLowerCase().includes(q)
      );
    });
  }, [allWords, selectedLevel, searchQuery, progressMap]);

  const toggleRevealCard = (id: number) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      {/* Duolingo-Style Search & Icon Filter Bar */}
      <View style={styles.topControls}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="🔍  #1–450..."
            placeholderTextColor="#94A3B8"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.hideToggleBtn, hideSpellings && styles.hideToggleBtnActive]}
            onPress={() => {
              setHideSpellings((prev) => !prev);
              setRevealedIds({});
            }}
          >
            <Text style={styles.hideToggleEmoji}>{hideSpellings ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.levelFilterRow}>
          {levelTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.levelPill,
                selectedLevel === tab.key && styles.levelPillActive
              ]}
              onPress={() => setSelectedLevel(tab.key)}
            >
              <Text
                style={[
                  styles.levelPillText,
                  selectedLevel === tab.key && styles.levelPillTextActive
                ]}
              >
                {tab.icon}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Virtualized List of 450 Words */}
      <FlatList
        data={filteredWords}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={7}
        renderItem={({ item }) => {
          const prog = progressMap[item.id];
          const isHidden = hideSpellings && !revealedIds[item.id];
          const isMastered =
            prog?.status === 'correct' || prog?.status === 'mastered_review';
          const isNeedsReview = prog?.status === 'needs_review';

          return (
            <View style={styles.wordCard}>
              <View style={styles.cardHeader}>
                <View style={styles.wordLeft}>
                  <View style={styles.numBadge}>
                    <Text style={styles.numBadgeText}>#{item.id}</Text>
                  </View>

                  {isHidden ? (
                    <TouchableOpacity
                      style={styles.hiddenMaskBtn}
                      onPress={() => toggleRevealCard(item.id)}
                    >
                      <Text style={styles.hiddenMaskText}>👀</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.wordNameRow}>
                      <Text style={styles.wordTitle}>{item.word}</Text>
                      {isMastered && <Text style={styles.statusEmoji}>✅</Text>}
                      {isNeedsReview && <Text style={styles.statusEmoji}>🎯</Text>}
                    </View>
                  )}
                </View>

                <View style={styles.audioRow}>
                  <TouchableOpacity
                    style={styles.hearBtn}
                    onPress={() => speakWord(item, false)}
                  >
                    <Text style={styles.actionEmoji}>🔊</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.slowBtn}
                    onPress={() => speakWord(item, true)}
                  >
                    <Text style={styles.actionEmoji}>🐢</Text>
                  </TouchableOpacity>
                  {!isHidden && (
                    <TouchableOpacity
                      style={styles.spellBtn}
                      onPress={() => speakLettersOutLoud(item.word)}
                    >
                      <Text style={styles.actionEmoji}>🔤</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.definitionText}>{item.definition}</Text>

              <View style={styles.exampleBox}>
                <Text style={styles.exampleText}>
                  "{isHidden ? item.blankedSentence : item.exampleSentence}"
                </Text>
                <View style={styles.cardBottomRow}>
                  <TouchableOpacity
                    style={styles.miniIconBtn}
                    onPress={() => speakText(item.exampleSentence, false)}
                  >
                    <Text style={styles.miniIconEmoji}>💬🔊</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.miniIconBtn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/search?q=define+${encodeURIComponent(item.word)}`
                      )
                    }
                  >
                    <Text style={styles.miniIconEmoji}>🔗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7'
  },
  topControls: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#1E293B'
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    borderWidth: 2,
    borderColor: '#334155'
  },
  hideToggleBtn: {
    width: 52,
    height: 50,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#334155'
  },
  hideToggleBtnActive: {
    backgroundColor: '#FFC72C',
    borderColor: '#D97706'
  },
  hideToggleEmoji: {
    fontSize: 24
  },
  levelFilterRow: {
    flexDirection: 'row',
    gap: 8
  },
  levelPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#334155'
  },
  levelPillActive: {
    backgroundColor: '#FFC72C',
    borderColor: '#D97706'
  },
  levelPillText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#CBD5E1'
  },
  levelPillTextActive: {
    color: '#0F172A'
  },
  listContent: {
    padding: 14,
    paddingBottom: 32,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center'
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  wordLeft: {
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
  numBadgeText: {
    color: '#FFC72C',
    fontSize: 13,
    fontWeight: '900'
  },
  wordNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  wordTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A'
  },
  statusEmoji: {
    fontSize: 18
  },
  hiddenMaskBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#F59E0B'
  },
  hiddenMaskText: {
    fontSize: 22
  },
  audioRow: {
    flexDirection: 'row',
    gap: 8
  },
  hearBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#FFC72C',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#D97706'
  },
  slowBtn: {
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
  spellBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1'
  },
  actionEmoji: {
    fontSize: 20
  },
  definitionText: {
    fontSize: 17,
    color: '#1E293B',
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 10
  },
  exampleBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC72C'
  },
  exampleText: {
    fontSize: 15,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  miniIconBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#CBD5E1'
  },
  miniIconEmoji: {
    fontSize: 16
  }
});
