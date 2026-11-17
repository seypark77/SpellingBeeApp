import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { WORD_AUDIO_ASSETS } from './wordAudioMap';

const CORRECT_CHIME_ASSET = require('../../assets/sounds/correct.wav');
let chimeAudioPlayer: any = null;
let nativeAudioPlayer: any = null;
let webAudioElement: any = null;

/**
 * Homograph phonetic overrides so that words with multiple pronunciations
 * match the exact definition in the Spelling Bee word list.
 */
const TTS_PHONETIC_OVERRIDES_BY_ID: Record<number, string> = {
  // #102 "lead" in the list is the metallic element (/led/), not the verb (/li:d/)
  102: 'led'
};

export async function playCorrectSound(): Promise<void> {
  // 1. Web Browser: play bright major arpeggio chime via Web Audio API
  if (Platform.OS === 'web') {
    try {
      const AudioCtx =
        typeof window !== 'undefined'
          ? (window as any).AudioContext || (window as any).webkitAudioContext
          : null;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [
          { freq: 523.25, start: 0.0, dur: 0.35 },
          { freq: 659.25, start: 0.08, dur: 0.35 },
          { freq: 783.99, start: 0.16, dur: 0.35 },
          { freq: 1046.5, start: 0.24, dur: 0.42 }
        ];
        const now = ctx.currentTime;
        for (const n of notes) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, now + n.start);
          gain.gain.setValueAtTime(0.001, now + n.start);
          gain.gain.linearRampToValueAtTime(0.28, now + n.start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        }
        return;
      }
    } catch {
      // ignore
    }
    return;
  }

  // 2. Mobile (iOS / Android): reuse single celebratory chime player
  try {
    await configureAudioSession();
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
      if (!chimeAudioPlayer) {
        chimeAudioPlayer = ExpoAudio.createAudioPlayer(CORRECT_CHIME_ASSET, {
          keepAudioSessionActive: true
        });
      }
      chimeAudioPlayer.volume = 1.0;
      await chimeAudioPlayer.seekTo?.(0);
      chimeAudioPlayer.play();
    }
  } catch (err) {
    console.warn('Correct chime playback warning:', err);
  }
}

export async function configureAudioSession(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && typeof ExpoAudio.setAudioModeAsync === 'function') {
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
  } catch (e) {
    console.warn('Audio session setup warning:', e);
  }
}

export async function resetAudioAfterRecording(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (chimeAudioPlayer) {
      try {
        chimeAudioPlayer.remove?.();
      } catch {
        // ignore
      }
      chimeAudioPlayer = null;
    }
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

async function playBundledWordAsset(asset: any, slow: boolean): Promise<boolean> {
  if (!asset) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof Audio !== 'undefined') {
    try {
      await stopSpeaking();
      const { Asset } = require('expo-asset');
      const resolvedUri =
        typeof asset === 'string'
          ? asset
          : Asset.fromModule(asset).uri || Asset.fromModule(asset).localUri;
      if (!resolvedUri) return false;
      const audio = new Audio(resolvedUri);
      webAudioElement = audio;
      audio.playbackRate = slow ? 0.65 : 1.0;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  try {
    await configureAudioSession();
    await stopSpeaking();
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
      if (nativeAudioPlayer) {
        try {
          nativeAudioPlayer.pause?.();
          nativeAudioPlayer.remove?.();
        } catch {
          // ignore
        }
        nativeAudioPlayer = null;
      }

      nativeAudioPlayer = ExpoAudio.createAudioPlayer(asset, {
        keepAudioSessionActive: true
      });
      nativeAudioPlayer.volume = 1.0;
      if (typeof nativeAudioPlayer.setPlaybackRate === 'function') {
        try {
          nativeAudioPlayer.setPlaybackRate(slow ? 0.65 : 1.0);
        } catch {
          // ignore
        }
      }
      nativeAudioPlayer.play();
      return true;
    }
  } catch (err) {
    console.warn('Bundled word MP3 playback error:', err);
  }
  return false;
}

/**
 * Speaks the target word using the bundled offline MP3 asset in assets/audio/words/<id>.mp3
 * (with automatic fallback to offline OS-native US English TTS).
 */
export async function speakWord(
  entry: { id?: number; word: string; definition?: string; audioUrl?: string },
  slow: boolean = false
): Promise<void> {
  if (!entry || !entry.word) return;

  // 1. Primary: Bundled offline Piper Neural US English MP3 asset
  if (entry.id && WORD_AUDIO_ASSETS[entry.id]) {
    const playedBundled = await playBundledWordAsset(WORD_AUDIO_ASSETS[entry.id], slow);
    if (playedBundled) {
      return;
    }
  }

  // 2. Fallback: Offline OS-native US English TTS
  let spokenWord = entry.word.trim();
  if (entry.id && TTS_PHONETIC_OVERRIDES_BY_ID[entry.id]) {
    spokenWord = TTS_PHONETIC_OVERRIDES_BY_ID[entry.id];
  } else if (
    spokenWord.toLowerCase() === 'lead' &&
    entry.definition?.toLowerCase().includes('metallic')
  ) {
    spokenWord = 'led';
  }
  await speakText(spokenWord, slow);
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
      try {
        webAudioElement.pause();
      } catch {
        // ignore
      }
      webAudioElement = null;
    }
    if (nativeAudioPlayer && typeof nativeAudioPlayer.pause === 'function') {
      try {
        nativeAudioPlayer.pause();
      } catch {
        // ignore
      }
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
