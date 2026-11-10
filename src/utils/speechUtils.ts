import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import wordsData from '../data/words.json';

const LATEST_AUDIO_BY_WORD: Record<string, string> = {};
for (const item of wordsData as any[]) {
  if (item && item.word) {
    LATEST_AUDIO_BY_WORD[String(item.word).toLowerCase()] = item.audioUrl || '';
  }
}

let isAudioConfigured = false;
let nativeAudioPlayer: any = null;
let webAudioElement: any = null;

export async function configureAudioSession(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && typeof ExpoAudio.setAudioModeAsync === 'function') {
      // IMPORTANT: interruptionMode: 'doNotMix' with allowsRecording: false makes sessionOptions empty in ExpoAudio,
      // which forces AVAudioSession.setCategory(.playback, mode: .default) and clears AudioStream's quiet .measurement mode!
      await ExpoAudio.setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false
      });
    }
    if (ExpoAudio && typeof ExpoAudio.setIsAudioActiveAsync === 'function') {
      await ExpoAudio.setIsAudioActiveAsync(true);
    }
    isAudioConfigured = true;
  } catch (e) {
    console.warn('Audio session setup warning:', e);
  }
}

export async function resetAudioAfterRecording(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (nativeAudioPlayer) {
      try {
        nativeAudioPlayer.remove?.();
      } catch {
        // ignore
      }
      nativeAudioPlayer = null;
    }
    // Wait past ExpoAudio's internal 100ms deactivateSession() timer after stream.stop()
    await new Promise((resolve) => setTimeout(resolve, 150));
    await configureAudioSession();
  } catch {
    // ignore
  }
}

/**
 * Plays the real human dictionary MP3 pronunciation (Merriam-Webster / US Dictionary audio)
 * when available, and falls back to TTS if offline or if no MP3 exists for an entry.
 */
export async function speakWord(
  entry: { word: string; audioUrl?: string },
  slow: boolean = false
): Promise<void> {
  if (!entry || !entry.word) return;

  const latestUrl = LATEST_AUDIO_BY_WORD[entry.word.toLowerCase()];
  const audioUrl = (latestUrl !== undefined ? latestUrl : entry.audioUrl || '').trim();
  if (!audioUrl) {
    await speakText(entry.word, slow);
    return;
  }

  // 1. Web Browser HTML5 Audio playback
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof Audio !== 'undefined') {
    try {
      await stopSpeaking();
      const audio = new Audio(audioUrl);
      webAudioElement = audio;
      audio.playbackRate = slow ? 0.65 : 1.0;
      await audio.play();
      return;
    } catch {
      await speakText(entry.word, slow);
      return;
    }
  }

  // 2. Mobile (iOS / Android) Native AudioPlayer via expo-audio
  try {
    await configureAudioSession();
    await stopSpeaking();

    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
      if (!nativeAudioPlayer) {
        nativeAudioPlayer = ExpoAudio.createAudioPlayer(
          { uri: audioUrl },
          { keepAudioSessionActive: true }
        );
      } else {
        nativeAudioPlayer.replace({ uri: audioUrl });
      }
      nativeAudioPlayer.volume = 1.0;
      if (typeof nativeAudioPlayer.setPlaybackRate === 'function') {
        nativeAudioPlayer.setPlaybackRate(slow ? 0.65 : 1.0);
      }
      nativeAudioPlayer.play();
      return;
    }
  } catch (err) {
    console.warn('Native MP3 audio playback fell back to TTS:', err);
  }

  await speakText(entry.word, slow);
}

export async function speakText(text: string, slow: boolean = false): Promise<void> {
  if (!text || !text.trim()) return;

  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = slow ? 0.6 : 0.92;
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      // fall through
    }
  }

  try {
    await configureAudioSession();

    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
    }

    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: slow ? 0.52 : 0.9,
      volume: 1.0,
      useApplicationAudioSession: true,
      onError: () => {
        Speech.speak(text, {
          pitch: 1.0,
          rate: slow ? 0.52 : 0.9,
          volume: 1.0,
          useApplicationAudioSession: true
        });
      }
    });
  } catch (err) {
    console.warn('speakText fallback error:', err);
  }
}

export async function speakLettersOutLoud(text: string): Promise<void> {
  const letters = text
    .trim()
    .split('')
    .map((ch) => (ch === ' ' ? 'space' : ch === '-' ? 'hyphen' : ch.toUpperCase()))
    .join(', ');
  if (letters) {
    await speakText(letters, false);
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    if (webAudioElement) {
      webAudioElement.pause();
      webAudioElement = null;
    }
    if (nativeAudioPlayer && typeof nativeAudioPlayer.pause === 'function') {
      nativeAudioPlayer.pause();
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      return;
    }
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
    }
  } catch {
    // ignore
  }
}

export async function triggerHaptic(type: 'success' | 'error' | 'light'): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // ignore
  }
}
