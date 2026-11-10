import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TurboModuleRegistry,
  View
} from 'react-native';
import { parseSpokenSpelling } from '../utils/spellingUtils';
import {
  configureAudioSession,
  resetAudioAfterRecording,
  speakLettersOutLoud,
  speakWord,
  stopSpeaking,
  triggerHaptic
} from '../utils/speechUtils';
import { WordEntry } from '../types/spelling';

interface VoiceSpellerModalProps {
  visible: boolean;
  wordEntry: WordEntry;
  initialSpelling: string;
  onClose: () => void;
  onApplySpelling: (spelled: string, submitImmediately: boolean) => void;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  let i = 0;
  while (i < len) {
    const b1 = bytes[i++] ?? 0;
    const hasB2 = i < len;
    const b2 = hasB2 ? (bytes[i++] ?? 0) : 0;
    const hasB3 = i < len;
    const b3 = hasB3 ? (bytes[i++] ?? 0) : 0;

    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += hasB2 ? BASE64_CHARS[(triplet >> 6) & 0x3f] : '=';
    result += hasB3 ? BASE64_CHARS[triplet & 0x3f] : '=';
  }
  return result;
}

function downsampleTo16kMono(
  rawFloat32: Float32Array,
  inputSampleRate: number,
  channels: number
): Float32Array {
  const numFrames = Math.floor(rawFloat32.length / Math.max(1, channels));
  if (numFrames <= 0) return new Float32Array(0);

  // Mix to mono if multi-channel
  let mono: Float32Array;
  if (channels > 1) {
    mono = new Float32Array(numFrames);
    for (let i = 0; i < numFrames; i++) {
      let sum = 0;
      for (let c = 0; c < channels; c++) {
        sum += rawFloat32[i * channels + c] || 0;
      }
      mono[i] = sum / channels;
    }
  } else {
    mono = rawFloat32;
  }

  const targetRate = 16000;
  if (!inputSampleRate || Math.abs(inputSampleRate - targetRate) < 100) {
    return new Float32Array(mono);
  }

  const ratio = inputSampleRate / targetRate;
  const outLength = Math.max(1, Math.floor(mono.length / ratio));
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIdx = Math.min(mono.length - 1, Math.floor(i * ratio));
    out[i] = mono[srcIdx];
  }
  return out;
}

function getMetroServerOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 1. Check expo-constants (works in Expo Go SDK 58 New Architecture / Bridgeless)
  try {
    const ConstantsMod = require('expo-constants');
    const Constants = ConstantsMod?.default || ConstantsMod;
    const hostUri: string | undefined =
      Constants?.expoConfig?.hostUri ||
      Constants?.expoGoConfig?.debuggerHost ||
      Constants?.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const cleanHost = hostUri.replace(/^(exp|https?):\/\//i, '').split('/')[0];
      if (cleanHost && !cleanHost.startsWith('localhost') && !cleanHost.startsWith('127.')) {
        return `http://${cleanHost}`;
      }
    }
    const expUrl: string | undefined = Constants?.experienceUrl || Constants?.linkingUri;
    if (expUrl) {
      const cleanHost = expUrl.replace(/^(exp|https?):\/\//i, '').split('/')[0];
      if (cleanHost && !cleanHost.startsWith('localhost') && !cleanHost.startsWith('127.')) {
        return `http://${cleanHost}`;
      }
    }
  } catch {
    // ignore
  }

  // 2. Check TurboModule SourceCode (React Native 0.88 New Architecture)
  try {
    const sourceCodeMod: any = TurboModuleRegistry.get('SourceCode');
    const scriptURL: string | undefined =
      sourceCodeMod?.getConstants?.()?.scriptURL || NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^(https?:\/\/[^\/]+)/i);
      if (match && match[1] && !match[1].includes('localhost')) {
        return match[1];
      }
    }
  } catch {
    // ignore
  }

  // 3. Check Expo's polyfilled window.location.origin
  try {
    const winOrigin = typeof window !== 'undefined' ? (window as any).location?.origin : undefined;
    if (winOrigin && !winOrigin.includes('localhost') && !winOrigin.includes('127.0.0.1')) {
      return winOrigin;
    }
  } catch {
    // ignore
  }

  return 'http://192.168.1.197:8081';
}

export const VoiceSpellerModal: React.FC<VoiceSpellerModalProps> = ({
  visible,
  wordEntry,
  initialSpelling,
  onClose,
  onApplySpelling
}) => {
  const [rawTranscript, setRawTranscript] = useState('');
  const [parsedLetters, setParsedLetters] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [statusNote, setStatusNote] = useState(
    'Tap "Start Voice Mic", say each letter clearly (e.g., "B - U - N - N - Y"), then tap "Stop & Recognize"!'
  );

  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<any>(null);
  const streamListenerRef = useRef<any>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const dictationInputRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setRawTranscript(initialSpelling);
      setParsedLetters(initialSpelling);
      setIsListening(false);
      setIsTranscribing(false);
      setMicLevel(0);
      setStatusNote(
        'Tap "Start Voice Mic", speak the letters clearly ("B - U - N - N - Y"), then tap "Stop & Recognize"!'
      );
    } else {
      cleanupAllVoiceCapture();
    }
    return () => {
      cleanupAllVoiceCapture();
    };
  }, [visible, initialSpelling]);

  const cleanupAllVoiceCapture = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (streamListenerRef.current) {
      try {
        streamListenerRef.current.remove();
      } catch {
        // ignore
      }
      streamListenerRef.current = null;
    }
    let hadStream = false;
    if (audioStreamRef.current) {
      hadStream = true;
      try {
        audioStreamRef.current.stop();
      } catch {
        // ignore
      }
      audioStreamRef.current = null;
    }
    pcmChunksRef.current = [];
    setIsListening(false);
    setMicLevel(0);
    if (hadStream) {
      resetAudioAfterRecording().catch(() => {});
    } else {
      configureAudioSession().catch(() => {});
    }
  };

  const startMobileAudioStream = async () => {
    try {
      const ExpoAudio = require('expo-audio');
      const perm = await ExpoAudio.requestRecordingPermissionsAsync();
      if (!perm?.granted) {
        setStatusNote(
          '⚠️ Microphone permission is required. Please enable Microphone access for Expo Go in your phone Settings.'
        );
        return;
      }

      await stopSpeaking();
      await ExpoAudio.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false
      });

      pcmChunksRef.current = [];
      const stream = new ExpoAudio.AudioModule.AudioStream({
        sampleRate: 16000,
        channels: 1,
        encoding: 'float32'
      });

      streamListenerRef.current = stream.addListener('audioStreamBuffer', (buffer: any) => {
        if (!buffer || !buffer.data) return;
        const rawFloats = new Float32Array(buffer.data);
        if (rawFloats.length === 0) return;

        // Calculate RMS level for visual microphone bar
        let sumSq = 0;
        const step = Math.max(1, Math.floor(rawFloats.length / 64));
        let count = 0;
        for (let i = 0; i < rawFloats.length; i += step) {
          const v = rawFloats[i] || 0;
          sumSq += v * v;
          count++;
        }
        const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
        const normalizedLevel = Math.min(1, Math.max(0.06, rms * 6.5));
        setMicLevel(normalizedLevel);

        const mono16k = downsampleTo16kMono(
          rawFloats,
          buffer.sampleRate || 16000,
          buffer.channels || 1
        );
        if (mono16k.length > 0) {
          pcmChunksRef.current.push(mono16k);
        }
      });

      audioStreamRef.current = stream;
      await stream.start();
      setIsListening(true);
      setStatusNote(
        '🔴 Recording your voice! Speak the letters clearly ("B - U - N - N - Y"), then tap "Stop & Recognize"!'
      );
    } catch (err: any) {
      console.warn('Mobile audio stream start error:', err);
      setIsListening(false);
      setStatusNote(
        '⚠️ Could not start microphone recording. Check microphone permissions and try again.'
      );
    }
  };

  const stopAndTranscribeMobileStream = async () => {
    setIsListening(false);
    setMicLevel(0);

    if (streamListenerRef.current) {
      try {
        streamListenerRef.current.remove();
      } catch {
        // ignore
      }
      streamListenerRef.current = null;
    }

    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.stop();
      } catch {
        // ignore
      }
      audioStreamRef.current = null;
    }

    // Restore playback session & clear iOS .measurement mode so "Hear Word" plays at 100% loud speaker volume
    await resetAudioAfterRecording();

    const chunks = pcmChunksRef.current;
    pcmChunksRef.current = [];

    let totalSamples = 0;
    for (const c of chunks) {
      totalSamples += c.length;
    }

    if (totalSamples < 1600) {
      setStatusNote('⚠️ Recording was too short. Tap "Start Voice Mic" and speak the letters!');
      return;
    }

    setIsTranscribing(true);
    setStatusNote('🐝 Recognizing your spoken letters...');

    try {
      const merged = new Float32Array(totalSamples);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }

      // Normalize peak volume so quiet voices are still recognized accurately
      let peak = 0;
      for (let i = 0; i < merged.length; i++) {
        const abs = Math.abs(merged[i]);
        if (abs > peak) peak = abs;
      }
      const gain = peak > 0.01 && peak < 0.8 ? Math.min(4.0, 0.85 / peak) : 1.0;

      const int16 = new Int16Array(merged.length);
      for (let i = 0; i < merged.length; i++) {
        const s = Math.max(-1, Math.min(1, merged[i] * gain));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
      const pcmBase64 = uint8ArrayToBase64(bytes);
      const origin = getMetroServerOrigin();

      const res = await fetch(`${origin}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pcmBase64,
          sampleRate: 16000,
          targetWord: wordEntry.word
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const transcript = (data?.transcript || '').trim();

      if (transcript) {
        setRawTranscript(transcript);
        const parsed = parseSpokenSpelling(transcript);
        setParsedLetters(parsed);
        triggerHaptic('success');
        setStatusNote(
          `✅ Heard: "${transcript}" → ${parsed.toUpperCase() || '(no letters)'}. Check below or tap Submit!`
        );
      } else {
        setStatusNote(
          '🤔 Could not hear any clear letters. Tap "Start Voice Mic" and speak louder!'
        );
      }
    } catch (err: any) {
      console.warn('Voice transcription request failed:', err);
      setStatusNote(
        '📱 Standalone Mode: Tap your phone keyboard’s 🎤 microphone icon below to dictate letters!'
      );
      setTimeout(() => {
        dictationInputRef.current?.focus();
      }, 150);
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleListening = async () => {
    triggerHaptic('light');
    if (isTranscribing) return;

    // 1. Mobile (iOS / Android): use native microphone PCM stream + Whisper transcription
    if (Platform.OS !== 'web') {
      if (isListening) {
        await stopAndTranscribeMobileStream();
      } else {
        await startMobileAudioStream();
      }
      return;
    }

    // 2. Web Browser: use Web Speech API
    if (isListening) {
      cleanupAllVoiceCapture();
      setStatusNote('Microphone stopped. Check your recognized letters below!');
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusNote('🎙️ Listening... Say each letter clearly ("B - U - N - N - Y")');
        };

        recognition.onresult = (event: any) => {
          let combined = '';
          for (let i = 0; i < event.results.length; i++) {
            combined += event.results[i][0].transcript + ' ';
          }
          setRawTranscript(combined.trim());
          const parsed = parseSpokenSpelling(combined);
          setParsedLetters(parsed);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setStatusNote('⚠️ Browser microphone permission was blocked or unavailable.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // ignore
      }
    }

    setStatusNote('⚠️ Web Speech Recognition is not supported in this browser.');
  };

  const handleTranscriptChange = (text: string) => {
    setRawTranscript(text);
    const parsed = parseSpokenSpelling(text);
    setParsedLetters(parsed);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>🎤 STAGE MICROPHONE</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                cleanupAllVoiceCapture();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Spell Out Loud</Text>
          <Text style={styles.subtitle}>{statusNote}</Text>

          {/* Top quick actions: Hear Word again or Start/Stop Mic */}
          <View style={styles.micControlsRow}>
            <TouchableOpacity
              style={styles.hearWordBtn}
              disabled={isListening || isTranscribing}
              onPress={() => speakWord(wordEntry, false)}
            >
              <Text style={styles.hearWordBtnText}>🔊 Hear Word</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.micBtn,
                isListening && styles.micBtnActive,
                isTranscribing && styles.disabledBtn
              ]}
              disabled={isTranscribing}
              onPress={toggleListening}
            >
              {isTranscribing ? (
                <View style={styles.transcribingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.micBtnText}>Recognizing...</Text>
                </View>
              ) : (
                <Text style={styles.micBtnText}>
                  {isListening ? '⏹️ Stop & Recognize' : '🎙️ Start Voice Mic'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Live Microphone Level Meter when recording on mobile */}
          {isListening && (
            <View style={styles.meterBox}>
              <View style={styles.meterHeaderRow}>
                <Text style={styles.meterLabel}>🔴 MIC LISTENING — SPEAK NOW</Text>
                <Text style={styles.meterHint}>Tap "Stop & Recognize" when done</Text>
              </View>
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    { width: `${Math.round(Math.max(8, micLevel * 100))}%` }
                  ]}
                />
              </View>
            </View>
          )}

          {/* Voice Transcript Box (Optional manual edit) */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>HEARD TRANSCRIPT (OPTIONAL EDIT):</Text>
            <TextInput
              ref={dictationInputRef}
              style={styles.transcriptInput}
              value={rawTranscript}
              onChangeText={handleTranscriptChange}
              placeholder='Tap "Start Voice Mic" above and speak letters...'
              placeholderTextColor="#94A3B8"
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
            />
          </View>

          {/* Parsed Letter Tiles Preview */}
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>RECOGNIZED LETTERS ({parsedLetters.length}):</Text>
              {parsedLetters.length > 0 && (
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.smallActionBtn}
                    onPress={() => speakLettersOutLoud(parsedLetters)}
                  >
                    <Text style={styles.smallActionText}>🔊 Hear Letters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallActionBtn, styles.clearSmallBtn]}
                    onPress={() => {
                      setRawTranscript('');
                      setParsedLetters('');
                    }}
                  >
                    <Text style={styles.clearSmallText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.tilesWrap}>
              {parsedLetters ? (
                parsedLetters.split('').map((ch, idx) => (
                  <View key={idx} style={styles.letterTile}>
                    <Text style={styles.letterTileText}>
                      {ch === ' ' ? '␣' : ch.toUpperCase()}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyPreviewText}>
                  No letters spoken yet — tap "Start Voice Mic" and speak!
                </Text>
              )}
            </View>
          </View>

          {/* Submit / Apply Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, (!parsedLetters || isListening) && styles.disabledBtn]}
              disabled={!parsedLetters || isListening}
              onPress={() => {
                cleanupAllVoiceCapture();
                onApplySpelling(parsedLetters, false);
              }}
            >
              <Text style={styles.secondaryBtnText}>Edit on Keypad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, (!parsedLetters || isListening) && styles.disabledBtn]}
              disabled={!parsedLetters || isListening}
              onPress={() => {
                cleanupAllVoiceCapture();
                onApplySpelling(parsedLetters, true);
              }}
            >
              <Text style={styles.primaryBtnText}>Submit Spelling ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 3,
    borderColor: '#FFC72C'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  stageBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569'
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14
  },
  micControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  hearWordBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  hearWordBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B'
  },
  micBtn: {
    flex: 1.4,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  micBtnActive: {
    backgroundColor: '#EF4444'
  },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  micBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  meterBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14
  },
  meterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  meterLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626'
  },
  meterHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B'
  },
  meterTrack: {
    height: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    overflow: 'hidden'
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 999
  },
  inputSection: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.4
  },
  transcriptInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600'
  },
  previewBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 16
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E'
  },
  previewActions: {
    flexDirection: 'row',
    gap: 6
  },
  smallActionBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  smallActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  clearSmallBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5'
  },
  clearSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C'
  },
  tilesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 42,
    alignItems: 'center'
  },
  letterTile: {
    width: 34,
    height: 38,
    backgroundColor: '#FFC72C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D97706'
  },
  letterTileText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A'
  },
  emptyPreviewText: {
    fontSize: 13,
    color: '#B45309',
    fontStyle: 'italic'
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B'
  },
  primaryBtn: {
    flex: 1.3,
    backgroundColor: '#FFC72C',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A'
  },
  disabledBtn: {
    opacity: 0.45
  }
});
