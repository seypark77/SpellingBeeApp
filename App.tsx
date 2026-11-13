import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CharacterAvatar } from './src/components/CharacterAvatar';
import { ProfileModal } from './src/components/ProfileModal';
import {
  createProfile,
  deleteProfile,
  getAllWordsFromDb,
  getProfiles,
  getWordProgressMap,
  initDatabase,
  recordWordAttempt,
  saveProfileCustomization,
  setActiveProfile,
  toggleWordReviewMastery
} from './src/db/database';
import { configureAudioSession } from './src/utils/speechUtils';
import { HomeScreen } from './src/screens/HomeScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { StudyListScreen } from './src/screens/StudyListScreen';
import {
  CharacterCustomization,
  QuizSessionConfig,
  SpellerProfile,
  WordEntry,
  WordProgress
} from './src/types/spelling';
import {
  DEFAULT_CUSTOMIZATION,
  DEFAULT_OWNED_ITEMS
} from './src/utils/characterShopData';

type ActiveTab = 'home' | 'study' | 'review';

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [allWords, setAllWords] = useState<WordEntry[]>([]);
  const [profiles, setProfiles] = useState<SpellerProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<number>(1);
  const [progressMap, setProgressMap] = useState<Record<number, WordProgress>>({});

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Active Practice Session state
  const [activeQuiz, setActiveQuiz] = useState<{
    title: string;
    words: WordEntry[];
    isReviewMode: boolean;
  } | null>(null);

  const refreshData = useCallback(async () => {
    const { profiles: loadedProfiles, activeProfileId: actId } = await getProfiles();
    setProfiles(loadedProfiles);
    setActiveProfileIdState(actId);
    const prog = await getWordProgressMap(actId);
    setProgressMap(prog);
  }, []);

  useEffect(() => {
    (async () => {
      await configureAudioSession();
      await initDatabase();
      const words = await getAllWordsFromDb();
      setAllWords(words);
      await refreshData();
      setIsReady(true);
    })();
  }, [refreshData]);

  const activeProfile: SpellerProfile =
    profiles.find((p) => p.id === activeProfileId) ||
    profiles[0] || {
      id: 1,
      name: 'Speller #1',
      avatar: '🐝',
      grade: 'Level 2 • Intermediate',
      honeyPoints: 0,
      spentHoney: 0,
      ownedItems: DEFAULT_OWNED_ITEMS,
      customization: DEFAULT_CUSTOMIZATION,
      currentStreak: 0,
      bestStreak: 0,
      totalPracticed: 0,
      totalCorrect: 0,
      voiceSpellsCount: 0,
      unlockedBadges: [],
      createdAt: ''
    };

  const handleSelectProfile = async (profileId: number) => {
    await setActiveProfile(profileId);
    await refreshData();
  };

  const handleCreateProfile = async (name: string, avatar: string, grade: string) => {
    await createProfile(name, avatar, grade);
    await refreshData();
  };

  const handleDeleteProfile = async (profileId: number) => {
    await deleteProfile(profileId);
    await refreshData();
  };

  const handleStartQuiz = (config: QuizSessionConfig) => {
    if (config.customWords && config.customWords.length > 0) {
      setActiveQuiz({
        title: 'Retry Missed Words',
        words: config.customWords,
        isReviewMode: true
      });
      return;
    }

    if (config.mode === 'review_active' || config.mode === 'review_all') {
      const reviewWords = allWords.filter((w) => {
        const p = progressMap[w.id];
        if (!p) return false;
        if (config.mode === 'review_active') {
          return p.status === 'needs_review';
        }
        return p.wrongCount > 0 || p.status === 'needs_review' || p.status === 'mastered_review';
      });

      const ordered =
        config.order === 'random' ? shuffleArray(reviewWords) : reviewWords;
      const sliced = ordered.slice(0, config.count);

      setActiveQuiz({
        title:
          config.mode === 'review_active'
            ? '🎯 Wrong Word Review'
            : '🔄 All Past Mistakes Review',
        words: sliced,
        isReviewMode: true
      });
      return;
    }

    // Standard Level Quiz
    let pool =
      config.level && config.level !== 'All'
        ? allWords.filter((w) => w.level === config.level)
        : allWords;

    // Filter out mastered words if poolFilter is 'unmastered_only'
    if (config.poolFilter === 'unmastered_only') {
      const unmastered = pool.filter((w) => {
        const p = progressMap[w.id];
        return !p || (p.status !== 'correct' && p.status !== 'mastered_review');
      });
      // If there are unmastered words, use them; if user finished all words, fall back to pool
      if (unmastered.length > 0) {
        pool = unmastered;
      }
    }

    let selectedWords: WordEntry[] = [];
    if (config.order === 'random') {
      selectedWords = shuffleArray(pool).slice(0, config.count);
    } else {
      const start = config.startOffset || 0;
      selectedWords = pool.slice(start, start + config.count);
      if (selectedWords.length === 0) {
        selectedWords = pool.slice(0, config.count);
      }
    }

    setActiveQuiz({
      title: `${config.level || 'All Levels'} (${selectedWords.length} Words)`,
      words: selectedWords,
      isReviewMode: false
    });
  };

  const handleRecordAttempt = async (params: {
    wordId: number;
    isCorrect: boolean;
    typedAttempt: string;
    usedVoice: boolean;
  }) => {
    const res = await recordWordAttempt({
      profileId: activeProfile.id,
      wordId: params.wordId,
      isCorrect: params.isCorrect,
      typedAttempt: params.typedAttempt,
      usedVoice: params.usedVoice,
      isReviewMode: Boolean(activeQuiz?.isReviewMode)
    });
    await refreshData();
    return {
      pointsEarned: res.pointsEarned,
      newStreak: res.newStreak,
      newlyUnlockedBadges: res.newlyUnlockedBadges
    };
  };

  const handleToggleMastery = async (wordId: number, markMastered: boolean) => {
    await toggleWordReviewMastery(activeProfile.id, wordId, markMastered);
    await refreshData();
  };

  const handleSaveCustomization = async (payload: {
    spentHoney: number;
    ownedItems: string[];
    customization: CharacterCustomization;
  }) => {
    await saveProfileCustomization(activeProfile.id, payload);
    await refreshData();
  };

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FFC72C" />
          <Text style={styles.loadingText}>Loading BeeReady: Spelling Bee Study...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const activeWrongCount = Object.values(progressMap).filter(
    (p) => p.status === 'needs_review'
  ).length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Duolingo-Style Top Status Bar */}
      {!activeQuiz && (
        <View style={styles.brandBar}>
          <TouchableOpacity
            style={styles.switchProfileBtn}
            onPress={() => setProfileModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.beeLogoBadge}>
              <CharacterAvatar
                customization={activeProfile.customization}
                size={32}
                showBackdrop={false}
              />
            </View>
            <Text style={styles.switchProfileName} numberOfLines={1}>
              {activeProfile.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.topStatsRow}>
            <View style={styles.topStatPill}>
              <Text style={styles.topStatIcon}>🔥</Text>
              <Text style={styles.topStatValue}>{activeProfile.currentStreak}</Text>
            </View>
            <View style={styles.topStatPill}>
              <Text style={styles.topStatIcon}>🍯</Text>
              <Text style={styles.topStatValue}>{activeProfile.honeyPoints}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.mainBody}>
        {activeQuiz ? (
          <PracticeScreen
            sessionTitle={activeQuiz.title}
            words={activeQuiz.words}
            isReviewMode={activeQuiz.isReviewMode}
            currentStreak={activeProfile.currentStreak}
            honeyPoints={activeProfile.honeyPoints}
            onRecordAttempt={handleRecordAttempt}
            onExit={() => setActiveQuiz(null)}
            onRetryMissedWords={(missed) =>
              setActiveQuiz({
                title: '🔄',
                words: missed,
                isReviewMode: true
              })
            }
          />
        ) : activeTab === 'home' ? (
          <HomeScreen
            profile={activeProfile}
            allWords={allWords}
            progressMap={progressMap}
            onOpenProfileModal={() => setProfileModalOpen(true)}
            onStartQuiz={handleStartQuiz}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSaveCustomization={handleSaveCustomization}
          />
        ) : activeTab === 'study' ? (
          <StudyListScreen allWords={allWords} progressMap={progressMap} />
        ) : (
          <ReviewScreen
            allWords={allWords}
            progressMap={progressMap}
            onStartReviewQuiz={handleStartQuiz}
            onToggleMastery={handleToggleMastery}
          />
        )}
      </View>

      {/* Duolingo-Style Icon-Only Bottom Navigation Tab Bar */}
      {!activeQuiz && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>🏠</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'study' && styles.tabItemActive]}
            onPress={() => setActiveTab('study')}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>📖</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'review' && styles.tabItemActive]}
            onPress={() => setActiveTab('review')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrap}>
              <Text style={styles.tabIcon}>🎯</Text>
              {activeWrongCount > 0 && (
                <View style={styles.badgeCountBubble}>
                  <Text style={styles.badgeCountText}>{activeWrongCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setProfileModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.tabProfileAvatarCircle}>
              <CharacterAvatar
                customization={activeProfile.customization}
                size={34}
                showBackdrop={false}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Multi-Profile Switcher & Creator Modal */}
      <ProfileModal
        visible={profileModalOpen}
        profiles={profiles}
        activeProfileId={activeProfile.id}
        onClose={() => setProfileModalOpen(false)}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
      />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#FFC72C',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12
  },
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#1E293B'
  },
  beeLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFC72C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  switchProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingRight: 14,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    maxWidth: 190
  },
  switchProfileEmoji: {
    fontSize: 20
  },
  switchProfileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  topStatsRow: {
    flexDirection: 'row',
    gap: 10
  },
  topStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#334155',
    gap: 5
  },
  topStatIcon: {
    fontSize: 18
  },
  topStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFC72C'
  },
  mainBody: {
    flex: 1,
    backgroundColor: '#FFFDF7'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 3,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8
  },
  tabItem: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  tabItemActive: {
    backgroundColor: '#1E293B',
    borderColor: '#FFC72C'
  },
  tabIconWrap: {
    position: 'relative'
  },
  tabIcon: {
    fontSize: 28
  },
  tabProfileAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFC72C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B'
  },
  tabProfileAvatarEmoji: {
    fontSize: 22
  },
  badgeCountBubble: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: '#EF4444',
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A'
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900'
  }
});
