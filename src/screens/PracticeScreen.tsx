import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { BADGES, checkSpellingAnswer, computeLetterDiff } from '../utils/spellingUtils';
import {
  playCorrectSound,
  speakLettersOutLoud,
  speakText,
  speakWord,
  stopSpeaking,
  triggerHaptic
} from '../utils/speechUtils';
import { WordEntry } from '../types/spelling';

interface PracticeScreenProps {
  sessionTitle: string;
  words: WordEntry[];
  isReviewMode: boolean;
  currentStreak: number;
  honeyPoints: number;
  onRecordAttempt: (params: {
    wordId: number;
    isCorrect: boolean;
    typedAttempt: string;
    usedVoice: boolean;
  }) => Promise<{
    pointsEarned: number;
    newStreak: number;
    newlyUnlockedBadges: string[];
  }>;
  onExit: () => void;
  onRetryMissedWords: (missed: WordEntry[]) => void;
}

type ClueModalType = 'definition' | 'sentence' | 'hint' | null;

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  sessionTitle,
  words,
  isReviewMode,
  currentStreak,
  honeyPoints,
  onRecordAttempt,
  onExit,
  onRetryMissedWords
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedSpelling, setTypedSpelling] = useState('');
  const [usedVoiceForCurrent, setUsedVoiceForCurrent] = useState(false);
  const [isAttempting, setIsAttempting] = useState(false);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Pop-up modal for Definition / Use in a Sentence / Hint (none selected by default)
  const [activeClueModal, setActiveClueModal] = useState<ClueModalType>(null);

  // Submission state
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Session stats
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionHoney, setSessionHoney] = useState(0);
  const [missedInSession, setMissedInSession] = useState<WordEntry[]>([]);
  const [sessionFinished, setSessionFinished] = useState(false);

  const currentWord: WordEntry | undefined = words[currentIndex];

  useEffect(() => {
    if (currentWord && !sessionFinished) {
      setTypedSpelling('');
      setUsedVoiceForCurrent(false);
      setIsAttempting(false);
      setActiveClueModal(null);
      setSubmitted(false);
      setIsCorrect(false);
      setLastPointsEarned(0);
      setUnlockedBadgeIds([]);

      const timer = setTimeout(() => {
        speakWord(currentWord, false);
      }, 300);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentIndex, currentWord, sessionFinished]);

  if (!currentWord) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No words in this session!</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onExit}>
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCheckAnswer = async (overrideSpelling?: string, fromVoice?: boolean) => {
    if (submitted) return;
    const answerToCheck = overrideSpelling !== undefined ? overrideSpelling : typedSpelling;
    if (!answerToCheck.trim()) return;

    Keyboard.dismiss();
    const voiceUsed = fromVoice || usedVoiceForCurrent;
    const check = checkSpellingAnswer(answerToCheck, currentWord);
    setSubmitted(true);
    setIsCorrect(check.isCorrect);

    if (check.isCorrect) {
      triggerHaptic('success');
      playCorrectSound();
      setConfettiTrigger((prev) => prev + 1);
      setSessionCorrect((prev) => prev + 1);
    } else {
      triggerHaptic('error');
      setMissedInSession((prev) =>
        prev.some((w) => w.id === currentWord.id) ? prev : [...prev, currentWord]
      );
    }

    const res = await onRecordAttempt({
      wordId: currentWord.id,
      isCorrect: check.isCorrect,
      typedAttempt: answerToCheck.trim(),
      usedVoice: voiceUsed
    });

    setLastPointsEarned(res.pointsEarned);
    setSessionHoney((prev) => prev + res.pointsEarned);
    setUnlockedBadgeIds(res.newlyUnlockedBadges);
  };

  const handleNextWord = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionFinished(true);
    }
  };

  // End-of-Session Summary Screen
  if (sessionFinished) {
    const accuracy = Math.round((sessionCorrect / words.length) * 100);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.summaryContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>
            {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🐝' : '🍯'}
          </Text>
          <Text style={styles.summaryTitle}>Stage Round Complete!</Text>
          <Text style={styles.summarySubtitle}>{sessionTitle}</Text>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatValue}>
                {sessionCorrect}/{words.length}
              </Text>
              <Text style={styles.summaryStatLabel}>Correct ({accuracy}%)</Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatValue}>+{sessionHoney} 🍯</Text>
              <Text style={styles.summaryStatLabel}>Honey Earned</Text>
            </View>
          </View>

          {missedInSession.length > 0 ? (
            <View style={styles.missedSection}>
              <Text style={styles.missedSectionTitle}>
                📌 Words Saved to Your Wrong Word Bank ({missedInSession.length}):
              </Text>
              {missedInSession.map((w) => (
                <View key={w.id} style={styles.missedItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missedItemWord}>
                      #{w.id} {w.word}
                    </Text>
                    <Text style={styles.missedItemDef} numberOfLines={2}>
                      {w.definition}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.miniAudioBtn}
                    onPress={() => speakWord(w, false)}
                  >
                    <Text style={styles.miniAudioText}>🔊</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.retryMissedBtn}
                onPress={() => {
                  const toRetry = [...missedInSession];
                  setCurrentIndex(0);
                  setSessionCorrect(0);
                  setSessionHoney(0);
                  setMissedInSession([]);
                  setSessionFinished(false);
                  onRetryMissedWords(toRetry);
                }}
              >
                <Text style={styles.retryMissedBtnText}>
                  🔄 Practice These {missedInSession.length} Missed Words Now
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.perfectBox}>
              <Text style={styles.perfectText}>
                🌟 FLAWLESS ROUND! Every single word was spelled correctly!
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={onExit}>
            <Text style={styles.primaryBtnText}>Return to Bee Hive Home</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.adBannerContainer, { width: '100%', maxWidth: 620, marginTop: 16 }]}>
          <View style={styles.adBadgePill}>
            <Text style={styles.adBadgeText}>AD</Text>
          </View>
          <Text style={styles.adBannerTitle}>Google AdMob Banner (Kids Safe • G-Rated)</Text>
          <Text style={styles.adBannerSub}>Non-personalized family-safe ad space</Text>
        </View>
      </ScrollView>
    );
  }

  const hasSpace = currentWord.word.includes(' ');
  const hasHyphen = currentWord.word.includes('-');
  const hasCapital = /[A-Z]/.test(currentWord.word);

  return (
    <View style={styles.outerWrap}>
      <ConfettiBurst triggerKey={confettiTrigger} />

      {/* Top Stage Header */}
      <View style={styles.stageHeader}>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>← Exit</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.stageHeaderTitle}>{sessionTitle}</Text>
          <Text style={styles.stageProgressText}>
            Word {currentIndex + 1} of {words.length} • #{currentWord.id} ({currentWord.level})
          </Text>
        </View>

        <View style={styles.stageStatsRight}>
          <Text style={styles.stageStatPill}>🔥 {currentStreak}</Text>
          <Text style={styles.stageStatPill}>🍯 {honeyPoints}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* STAGE 1: Initial Prompt Card (Before clicking Attempt) */}
        {!isAttempting && !submitted && (
          <>
            <View style={styles.pronouncerCard}>
              <TouchableOpacity
                style={styles.hearSingleMainBtn}
                onPress={() => speakWord(currentWord, false)}
                activeOpacity={0.85}
              >
                <Text style={styles.hearMainEmoji}>🔊</Text>
                <Text style={styles.hearMainTitle}>Hear Word</Text>
              </TouchableOpacity>

              {/* 3 Clue Buttons Row: Definition / Sentence / Hint */}
              <View style={styles.cluePillsRow}>
                <TouchableOpacity
                  style={styles.cluePill}
                  onPress={() => setActiveClueModal('definition')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cluePillText}>📘 Definition</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cluePill}
                  onPress={() => setActiveClueModal('sentence')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cluePillText}>💬 Sentence</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cluePill}
                  onPress={() => setActiveClueModal('hint')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cluePillText}>💡 Hint</Text>
                </TouchableOpacity>
              </View>

              {/* Attempt Button */}
              <TouchableOpacity
                style={styles.attemptTriggerBtn}
                onPress={() => {
                  triggerHaptic('light');
                  setIsAttempting(true);
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 100);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.attemptTriggerText}>✏️ Attempt</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STAGE 2: Native Keyboard Input Mode (After clicking Attempt) */}
        {isAttempting && !submitted && (
          <View style={styles.nativeInputCard}>
            <View style={styles.nativeInputHeaderRow}>
              <Text style={styles.nativeInputPrompt}>
                Type on the keyboard or tap 🎙️
              </Text>
              <TouchableOpacity
                style={styles.backToCluesBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  setIsAttempting(false);
                }}
              >
                <Text style={styles.backToCluesText}>← Back</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.nativeTextInputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.nativeTextInput}
                value={typedSpelling}
                onChangeText={setTypedSpelling}
                placeholder="Type here or tap 🎙️ on keyboard..."
                placeholderTextColor="#94A3B8"
                autoFocus
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                returnKeyType="done"
                onSubmitEditing={() => handleCheckAnswer()}
              />
              {typedSpelling.length > 0 && (
                <TouchableOpacity
                  style={styles.clearInputBtn}
                  onPress={() => setTypedSpelling('')}
                >
                  <Text style={styles.clearInputBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {typedSpelling.length > 0 && (
              <TouchableOpacity
                style={styles.hearMyLettersRow}
                onPress={() => speakLettersOutLoud(typedSpelling)}
              >
                <Text style={styles.hearLettersLink}>🔊 Hear My Letters</Text>
              </TouchableOpacity>
            )}

            {/* Hear Word button right below input box (as in sketch) + Submit button */}
            <View style={styles.inputModeActionsRow}>
              <TouchableOpacity
                style={styles.hearInInputModeBtn}
                onPress={() => speakWord(currentWord, false)}
                activeOpacity={0.85}
              >
                <Text style={styles.hearMainEmoji}>🔊</Text>
                <Text style={styles.hearMainTitle}>Hear Word</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitNativeBtn,
                  !typedSpelling.trim() && styles.submitNativeBtnDisabled
                ]}
                onPress={() => handleCheckAnswer()}
                disabled={!typedSpelling.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.submitNativeBtnText}>Submit ✓</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Clues Row while in Input Mode */}
            <View style={[styles.cluePillsRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.cluePill}
                onPress={() => setActiveClueModal('definition')}
                activeOpacity={0.8}
              >
                <Text style={styles.cluePillText}>📘 Definition</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cluePill}
                onPress={() => setActiveClueModal('sentence')}
                activeOpacity={0.8}
              >
                <Text style={styles.cluePillText}>💬 Sentence</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cluePill}
                onPress={() => setActiveClueModal('hint')}
                activeOpacity={0.8}
              >
                <Text style={styles.cluePillText}>💡 Hint</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STAGE 3: Post-Submission Display & Feedback */}
        {submitted && (
          <View
            style={[
              styles.spellingDisplayCard,
              isCorrect ? styles.displayCardCorrect : styles.displayCardWrong
            ]}
          >
            <View style={styles.displayTopRow}>
              <Text style={styles.displayLabel}>✋ YOUR SPELLING:</Text>
              <TouchableOpacity onPress={() => speakWord(currentWord, false)}>
                <Text style={styles.hearLettersLink}>🔊 Hear Word</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.letterBoxesWrap}>
              {typedSpelling.split('').map((ch, idx) => (
                <View key={idx} style={styles.typedTile}>
                  <Text style={styles.typedTileText}>
                    {ch === ' ' ? '␣' : ch.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Post-Submission Feedback Card */}
        {submitted && (
          <View
            style={[
              styles.feedbackCard,
              isCorrect ? styles.feedbackCorrect : styles.feedbackWrong
            ]}
          >
            <View style={styles.feedbackHeaderRow}>
              <Text style={styles.feedbackTitle}>
                {isCorrect ? '🎉 Correct Spelling!' : '❌ Almost! Keep Practicing!'}
              </Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>+{lastPointsEarned} 🍯</Text>
              </View>
            </View>

            <View style={styles.officialAnswerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.officialWordLabel}>CORRECT SPELLING:</Text>
                <Text style={styles.officialWordText}>{currentWord.word}</Text>
                {currentWord.altSpellings && currentWord.altSpellings.length > 0 && (
                  <Text style={styles.altSpellingNote}>
                    Also accepted: {currentWord.altSpellings.join(', ')}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.hearOfficialBtn}
                onPress={() => speakLettersOutLoud(currentWord.word)}
              >
                <Text style={styles.hearOfficialBtnText}>🔊 Hear Letters</Text>
              </TouchableOpacity>
            </View>

            {/* Letter-by-letter comparison when wrong */}
            {!isCorrect && (
              <View style={styles.diffContainer}>
                <Text style={styles.diffLabel}>LETTER-BY-LETTER COMPARISON:</Text>
                <View style={styles.diffRow}>
                  {computeLetterDiff(typedSpelling, currentWord.word).map((d, i) => (
                    <View
                      key={i}
                      style={[
                        styles.diffTile,
                        d.status === 'match'
                          ? styles.diffTileMatch
                          : d.status === 'wrong'
                          ? styles.diffTileWrong
                          : styles.diffTileMissing
                      ]}
                    >
                      <Text style={styles.diffTileText}>{d.char.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.savedToReviewNote}>
                  📌 Saved to your Wrong Word Bank! Spell it right twice in Review to master it.
                </Text>
              </View>
            )}

            {/* Full Example Sentence & Online Dictionary Search Link */}
            <View style={styles.postAnswerSentenceBox}>
              <Text style={styles.postAnswerSentenceLabel}>EXAMPLE SENTENCE:</Text>
              <Text style={styles.postAnswerSentenceText}>"{currentWord.exampleSentence}"</Text>
              {/* Kids Category Compliance: External web link commented out */}
              {/*
              <TouchableOpacity
                style={styles.mwLinkBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/search?q=define+${encodeURIComponent(currentWord.word)}`
                  )
                }
              >
                <Text style={styles.mwLinkText}>
                  🔗 Look up "{currentWord.word}" in Dictionary ↗
                </Text>
              </TouchableOpacity>
              */}
            </View>

            {/* Newly Unlocked Badges Toast */}
            {unlockedBadgeIds.length > 0 && (
              <View style={styles.badgeUnlockedBanner}>
                {unlockedBadgeIds.map((bid) => {
                  const b = BADGES.find((item) => item.id === bid);
                  if (!b) return null;
                  return (
                    <Text key={bid} style={styles.badgeUnlockedText}>
                      🏅 NEW BADGE UNLOCKED: {b.emoji} {b.title}!
                    </Text>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.nextWordBtn} onPress={handleNextWord}>
              <Text style={styles.nextWordBtnText}>
                {currentIndex + 1 < words.length ? 'Next Word ▸' : 'See Round Results 🏆'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Google Ad Banner Slot (Shown on Initial Screen & Post-Answer Result Screen) */}
        {(!isAttempting || submitted) && (
          <View style={styles.adBannerContainer}>
            <View style={styles.adBadgePill}>
              <Text style={styles.adBadgeText}>AD</Text>
            </View>
            <Text style={styles.adBannerTitle}>Google AdMob Banner (Kids Safe • G-Rated)</Text>
            <Text style={styles.adBannerSub}>Non-personalized family-safe ad space</Text>
          </View>
        )}
      </ScrollView>

      {/* Pop-up Modal for Definition / Use in a Sentence / Hint */}
      <Modal
        visible={activeClueModal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => {
          stopSpeaking();
          setActiveClueModal(null);
        }}
      >
        <View style={styles.clueModalOverlay}>
          <View style={styles.clueModalCard}>
            <View style={styles.clueModalHeader}>
              <Text style={styles.clueModalTitle}>
                {activeClueModal === 'definition'
                  ? '📘 Definition'
                  : activeClueModal === 'sentence'
                  ? '💬 Use in a Sentence'
                  : '💡 Spelling Hint'}
              </Text>
              <TouchableOpacity
                style={styles.clueModalCloseIcon}
                onPress={() => {
                  stopSpeaking();
                  setActiveClueModal(null);
                }}
              >
                <Text style={styles.clueModalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeClueModal === 'definition' && (
              <View style={styles.clueModalContentBox}>
                <Text style={styles.clueModalBodyText}>{currentWord.definition}</Text>
                <TouchableOpacity
                  style={styles.clueModalAudioBtn}
                  onPress={() => speakText(currentWord.definition, false)}
                >
                  <Text style={styles.clueModalAudioBtnText}>🔊 Hear Definition</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeClueModal === 'sentence' && (
              <View style={styles.clueModalContentBox}>
                <Text style={[styles.clueModalBodyText, styles.clueModalItalic]}>
                  "{submitted ? currentWord.exampleSentence : currentWord.blankedSentence}"
                </Text>
                <TouchableOpacity
                  style={styles.clueModalAudioBtn}
                  onPress={() => {
                    const spokenSentence = submitted
                      ? currentWord.exampleSentence
                      : currentWord.blankedSentence.replace(/_{2,}/g, 'blank');
                    speakText(spokenSentence, false);
                  }}
                >
                  <Text style={styles.clueModalAudioBtnText}>🔊 Hear Sentence</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeClueModal === 'hint' && (
              <View style={styles.clueModalContentBox}>
                <Text style={styles.clueModalBodyText}>
                  Starts with the letter{' '}
                  <Text style={styles.clueModalHighlight}>
                    "{currentWord.word[0].toUpperCase()}"
                  </Text>{' '}
                  and has{' '}
                  <Text style={styles.clueModalHighlight}>
                    {currentWord.word.length} characters
                  </Text>
                  .
                </Text>
                {(hasCapital || hasSpace || hasHyphen) && (
                  <View style={styles.hintTagsRow}>
                    {hasCapital && (
                      <View style={styles.noteChip}>
                        <Text style={styles.noteChipText}>Capitalized Word</Text>
                      </View>
                    )}
                    {hasSpace && (
                      <View style={styles.noteChip}>
                        <Text style={styles.noteChipText}>Contains a Space (2 Words)</Text>
                      </View>
                    )}
                    {hasHyphen && (
                      <View style={styles.noteChip}>
                        <Text style={styles.noteChipText}>Contains a Hyphen (-)</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.clueModalDoneBtn}
              onPress={() => {
                stopSpeaking();
                setActiveClueModal(null);
              }}
            >
              <Text style={styles.clueModalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    flex: 1,
    backgroundColor: '#FFFDF7'
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#FFC72C'
  },
  exitBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  exitBtnText: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 14
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  stageHeaderTitle: {
    color: '#FFC72C',
    fontWeight: '900',
    fontSize: 15
  },
  stageProgressText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  stageStatsRight: {
    flexDirection: 'row',
    gap: 6
  },
  stageStatPill: {
    backgroundColor: '#1E293B',
    color: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '800'
  },
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center'
  },
  pronouncerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 16
  },
  hearSingleMainBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC72C',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#D97706',
    marginBottom: 14
  },
  hearMainEmoji: {
    fontSize: 24,
    marginRight: 8
  },
  hearMainTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A'
  },
  attemptTriggerBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 18,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14
  },
  attemptTriggerText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFC72C',
    letterSpacing: 0.5
  },
  adBannerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  adBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8
  },
  adBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569'
  },
  adBannerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2
  },
  nativeInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginBottom: 12
  },
  nativeInputHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  nativeInputPrompt: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  backToCluesBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  backToCluesText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569'
  },
  nativeTextInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  nativeTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    paddingVertical: 14,
    letterSpacing: 1
  },
  clearInputBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  clearInputBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#92400E'
  },
  hearMyLettersRow: {
    alignSelf: 'flex-end',
    marginBottom: 10
  },
  inputModeActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  hearInInputModeBtn: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC72C',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  submitNativeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#059669'
  },
  submitNativeBtnDisabled: {
    backgroundColor: '#CBD5E1',
    borderBottomColor: '#94A3B8'
  },
  submitNativeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  cluePillsRow: {
    flexDirection: 'row',
    gap: 8
  },
  cluePill: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cluePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center'
  },
  spellingDisplayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginBottom: 10
  },
  displayCardCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5'
  },
  displayCardWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  displayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  displayLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4
  },
  hearLettersLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706'
  },
  letterBoxesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 48,
    alignItems: 'center'
  },
  typedTile: {
    minWidth: 38,
    height: 44,
    paddingHorizontal: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  typedTileText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
    fontStyle: 'italic'
  },
  clueModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  clueModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 3,
    borderColor: '#FFC72C'
  },
  clueModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  clueModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  clueModalCloseIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  clueModalCloseIconText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#475569'
  },
  clueModalContentBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 18
  },
  clueModalBodyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 30
  },
  clueModalItalic: {
    fontStyle: 'italic'
  },
  clueModalHighlight: {
    fontWeight: '900',
    color: '#B45309'
  },
  clueModalAudioBtn: {
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center'
  },
  clueModalAudioBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E'
  },
  hintTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  noteChip: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  noteChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9'
  },
  clueModalDoneBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  clueModalDoneBtnText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFC72C'
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    marginTop: 4
  },
  feedbackCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981'
  },
  feedbackWrong: {
    backgroundColor: '#FFF1F2',
    borderColor: '#F43F5E'
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  feedbackTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A'
  },
  pointsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  pointsBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E'
  },
  officialAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10
  },
  officialWordLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B'
  },
  officialWordText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.6
  },
  altSpellingNote: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2
  },
  hearOfficialBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  hearOfficialBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E'
  },
  diffContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10
  },
  diffLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6
  },
  diffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8
  },
  diffTile: {
    width: 32,
    height: 36,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center'
  },
  diffTileMatch: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981'
  },
  diffTileWrong: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  diffTileMissing: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  diffTileText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  savedToReviewNote: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C'
  },
  postAnswerSentenceBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12
  },
  postAnswerSentenceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4
  },
  postAnswerSentenceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 23,
    marginBottom: 8
  },
  mwLinkBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  mwLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1'
  },
  badgeUnlockedBanner: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 12,
    alignItems: 'center'
  },
  badgeUnlockedText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E'
  },
  nextWordBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center'
  },
  nextWordBtnText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFC72C'
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14
  },
  primaryBtn: {
    backgroundColor: '#FFC72C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  summaryContent: {
    padding: 18,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center'
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 3,
    borderColor: '#FFC72C',
    alignItems: 'center'
  },
  summaryEmoji: {
    fontSize: 52,
    marginBottom: 8
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A'
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 18
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 18
  },
  summaryStatBox: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center'
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  summaryStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2
  },
  missedSection: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginBottom: 18
  },
  missedSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
    marginBottom: 10
  },
  missedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8
  },
  missedItemWord: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  missedItemDef: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2
  },
  miniAudioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  miniAudioText: {
    fontSize: 16
  },
  retryMissedBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6
  },
  retryMissedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  perfectBox: {
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 18,
    width: '100%'
  },
  perfectText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    textAlign: 'center'
  }
});
