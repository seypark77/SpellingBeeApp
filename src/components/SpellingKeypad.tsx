import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { triggerHaptic } from '../utils/speechUtils';

interface SpellingKeypadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const SpellingKeypad: React.FC<SpellingKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false
}) => {
  const handleKeyPress = (char: string) => {
    if (disabled) return;
    triggerHaptic('light');
    onChange(value + char.toLowerCase());
  };

  const handleBackspace = () => {
    if (disabled || !value) return;
    triggerHaptic('light');
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || !value) return;
    triggerHaptic('light');
    onChange('');
  };

  // Support physical keyboard typing on Web / iPad hardware keyboards
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        onChange(value.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (value.trim().length > 0) {
          onSubmit();
        }
      } else if (e.key === ' ' || e.key === '-') {
        e.preventDefault();
        onChange(value + e.key);
      } else if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onChange(value + e.key.toLowerCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, disabled, onChange, onSubmit]);

  return (
    <View style={styles.container}>
      {KEY_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[styles.key, disabled && styles.keyDisabled]}
              onPress={() => handleKeyPress(letter)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <Text style={styles.keyText}>{letter}</Text>
            </TouchableOpacity>
          ))}
          {rowIndex === 2 && (
            <TouchableOpacity
              style={[styles.key, styles.backspaceKey, disabled && styles.keyDisabled]}
              onPress={handleBackspace}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <Text style={styles.backspaceText}>⌫</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.specialKey, disabled && styles.keyDisabled]}
          onPress={handleClear}
          disabled={disabled}
        >
          <Text style={styles.specialKeyText}>CLEAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.specialKey, disabled && styles.keyDisabled]}
          onPress={() => handleKeyPress('-')}
          disabled={disabled}
        >
          <Text style={styles.specialKeyText}>HYPHEN (-)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.specialKey, styles.spaceKey, disabled && styles.keyDisabled]}
          onPress={() => handleKeyPress(' ')}
          disabled={disabled}
        >
          <Text style={styles.specialKeyText}>SPACE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitKey,
            (disabled || !value.trim()) && styles.submitKeyDisabled
          ]}
          onPress={onSubmit}
          disabled={disabled || !value.trim()}
        >
          <Text style={styles.submitKeyText}>CHECK ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 7
  },
  key: {
    flex: 1,
    maxWidth: 42,
    height: 44,
    marginHorizontal: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1'
  },
  keyDisabled: {
    opacity: 0.5
  },
  keyText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  backspaceKey: {
    maxWidth: 54,
    flex: 1.3,
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#F59E0B'
  },
  backspaceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
    gap: 6
  },
  specialKey: {
    flex: 1,
    height: 42,
    backgroundColor: '#334155',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A'
  },
  spaceKey: {
    flex: 1.2
  },
  specialKeyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.4
  },
  submitKey: {
    flex: 1.5,
    height: 42,
    backgroundColor: '#FFC72C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  submitKeyDisabled: {
    backgroundColor: '#475569',
    borderBottomColor: '#334155'
  },
  submitKeyText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5
  }
});
