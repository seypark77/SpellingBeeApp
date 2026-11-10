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
import { ProfileModal } from './src/components/ProfileModal';
import {
  createProfile,
  deleteProfile,
  getAllWordsFromDb,
  getProfiles,
  getWordProgressMap,
  initDatabase,
  recordWordAttempt,
  setActiveProfile,
  toggleWordReviewMastery
} from './src/db/database';
import { configureAudioSession } from './src/utils/speechUtils';
import { HomeScreen } from './src/screens/HomeScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { StudyListScreen } from './src/screens/StudyListScreen';
import {
  QuizSessionConfig,
  SpellerProfile,
  WordEntry,
  WordProgress
} from './src/types/spelling';

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
      grade: '4th–6th Grade',
      honeyPoints: 0,
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
    const pool =
      config.level && config.level !== 'All'
        ? allWords.filter((w) => w.level === config.level)
        : allWords;

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

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FFC72C" />
          <Text style={styles.loadingText}>Loading 2026–2027 Spelling Bee Hive...</Text>
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

      {/* Top Brand Bar (inspired by spellingbee.com) */}
      {!activeQuiz && (
        <View style={styles.brandBar}>
          <View style={styles.brandLeft}>
            <View style={styles.beeLogoBadge}>
              <Text style={styles.beeLogoText}>bee🐝</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>2026–2027 Spelling Bee</Text>
              <Text style={styles.brandSub}>Official 450 Study List & Stage Trainer</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchProfileBtn}
            onPress={() => setProfileModalOpen(true)}
          >
            <Text style={styles.switchProfileEmoji}>{activeProfile.avatar}</Text>
            <Text style={styles.switchProfileName} numberOfLines={1}>
              {activeProfile.name}
            </Text>
          </TouchableOpacity>
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
                title: '🔄 Retry Missed Words',
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

      {/* Bottom Navigation Tab Bar */}
      {!activeQuiz && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.tabIcon}>🏠</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Bee Hive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'study' && styles.tabItemActive]}
            onPress={() => setActiveTab('study')}
          >
            <Text style={styles.tabIcon}>📖</Text>
            <Text style={[styles.tabLabel, activeTab === 'study' && styles.tabLabelActive]}>
              Study List (450)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'review' && styles.tabItemActive]}
            onPress={() => setActiveTab('review')}
          >
            <View style={styles.tabIconWrap}>
              <Text style={styles.tabIcon}>🎯</Text>
              {activeWrongCount > 0 && (
                <View style={styles.badgeCountBubble}>
                  <Text style={styles.badgeCountText}>{activeWrongCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'review' && styles.tabLabelActive]}>
              Wrong Words
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setProfileModalOpen(true)}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={styles.tabLabel}>Profiles ({profiles.length})</Text>
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
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12
  },
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1E293B'
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  beeLogoBadge: {
    backgroundColor: '#FFC72C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  beeLogoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  brandSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  switchProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFC72C',
    maxWidth: 140
  },
  switchProfileEmoji: {
    fontSize: 16,
    marginRight: 5
  },
  switchProfileName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FEF3C7'
  },
  mainBody: {
    flex: 1,
    backgroundColor: '#FFFDF7'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 2,
    borderTopColor: '#FFC72C',
    paddingVertical: 8,
    paddingHorizontal: 6
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 12
  },
  tabItemActive: {
    backgroundColor: '#1E293B'
  },
  tabIconWrap: {
    position: 'relative'
  },
  tabIcon: {
    fontSize: 19,
    marginBottom: 2
  },
  badgeCountBubble: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: '#EF4444',
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8'
  },
  tabLabelActive: {
    color: '#FFC72C',
    fontWeight: '900'
  }
});
