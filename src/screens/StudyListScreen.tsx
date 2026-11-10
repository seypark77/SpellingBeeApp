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

interface StudyListScreenProps {
  allWords: WordEntry[];
  progressMap: Record<number, WordProgress>;
}

export const StudyListScreen: React.FC<StudyListScreenProps> = ({
  allWords,
  progressMap
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'All' | BeeLevel>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSpellings, setHideSpellings] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allWords.filter((w) => {
      if (selectedLevel !== 'All' && w.level !== selectedLevel) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        String(w.id) === q.replace('#', '') ||
        w.definition.toLowerCase().includes(q)
      );
    });
  }, [allWords, selectedLevel, searchQuery]);

  const toggleRevealCard = (id: number) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      {/* Top Filter & Search Controls */}
      <View style={styles.topControls}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>📖 2026–2027 Study List</Text>
            <Text style={styles.screenSub}>
              Showing {filteredWords.length} of {allWords.length} official words
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.hideToggleBtn, hideSpellings && styles.hideToggleBtnActive]}
            onPress={() => {
              setHideSpellings((prev) => !prev);
              setRevealedIds({});
            }}
          >
            <Text
              style={[
                styles.hideToggleText,
                hideSpellings && styles.hideToggleTextActive
              ]}
            >
              {hideSpellings ? '👁️ Show Spellings' : '🙈 Flashcard Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search word, #number (e.g. 226), or definition..."
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
        />

        <View style={styles.levelFilterRow}>
          {(['All', 'One Bee', 'Two Bee', 'Three Bee'] as const).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelPill,
                selectedLevel === lvl && styles.levelPillActive
              ]}
              onPress={() => setSelectedLevel(lvl)}
            >
              <Text
                style={[
                  styles.levelPillText,
                  selectedLevel === lvl && styles.levelPillTextActive
                ]}
              >
                {lvl === 'All' ? 'All (450)' : lvl}
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
                      <Text style={styles.hiddenMaskText}>Tap to Reveal Spelling 👀</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text style={styles.wordTitle}>{item.word}</Text>
                      {item.altSpellings && item.altSpellings.length > 0 && (
                        <Text style={styles.altText}>
                          OR {item.altSpellings[0]}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.audioRow}>
                  <TouchableOpacity
                    style={styles.hearBtn}
                    onPress={() => speakWord(item, false)}
                  >
                    <Text style={styles.hearBtnText}>🔊 Word</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.slowBtn}
                    onPress={() => speakWord(item, true)}
                  >
                    <Text style={styles.slowBtnText}>🐢</Text>
                  </TouchableOpacity>
                  {!isHidden && (
                    <TouchableOpacity
                      style={styles.spellBtn}
                      onPress={() => speakLettersOutLoud(item.word)}
                    >
                      <Text style={styles.spellBtnText}>🔤 A-B-C</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.tagsRow}>
                <View style={styles.levelTag}>
                  <Text style={styles.levelTagText}>
                    {item.level} ({item.gradeLabel})
                  </Text>
                </View>
                <View style={styles.posTag}>
                  <Text style={styles.posTagText}>{item.partOfSpeech}</Text>
                </View>
                {isMastered && (
                  <View style={styles.masteredTag}>
                    <Text style={styles.masteredTagText}>✅ Mastered</Text>
                  </View>
                )}
                {isNeedsReview && (
                  <View style={styles.reviewTag}>
                    <Text style={styles.reviewTagText}>🎯 Needs Review</Text>
                  </View>
                )}
              </View>

              <Text style={styles.definitionText}>{item.definition}</Text>

              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>EXAMPLE SENTENCE:</Text>
                <Text style={styles.exampleText}>
                  "{isHidden ? item.blankedSentence : item.exampleSentence}"
                </Text>
              </View>

              <View style={styles.cardBottomRow}>
                <TouchableOpacity onPress={() => speakText(item.exampleSentence, false)}>
                  <Text style={styles.listenSentenceLink}>🔊 Hear Sentence</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Linking.openURL(item.mwUrl)}>
                  <Text style={styles.mwLink}>🔗 Merriam-Webster.com ↗</Text>
                </TouchableOpacity>
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
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#FFC72C'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  screenTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  screenSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600'
  },
  hideToggleBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569'
  },
  hideToggleBtnActive: {
    backgroundColor: '#FFC72C',
    borderColor: '#D97706'
  },
  hideToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  hideToggleTextActive: {
    color: '#0F172A'
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10
  },
  levelFilterRow: {
    flexDirection: 'row',
    gap: 6
  },
  levelPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  levelPillActive: {
    backgroundColor: '#FFC72C',
    borderColor: '#F59E0B'
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '800',
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
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  wordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  numBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  numBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569'
  },
  wordTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A'
  },
  altText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7'
  },
  hiddenMaskBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  hiddenMaskText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E'
  },
  audioRow: {
    flexDirection: 'row',
    gap: 6
  },
  hearBtn: {
    backgroundColor: '#FFC72C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9
  },
  hearBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A'
  },
  slowBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9
  },
  slowBtnText: {
    fontSize: 12
  },
  spellBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9
  },
  spellBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155'
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  levelTag: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  levelTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E'
  },
  posTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  posTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    fontStyle: 'italic'
  },
  masteredTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  masteredTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46'
  },
  reviewTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  reviewTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B'
  },
  definitionText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500'
  },
  exampleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC72C',
    marginBottom: 8
  },
  exampleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2
  },
  exampleText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 18
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listenSentenceLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309'
  },
  mwLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7'
  }
});
