import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CharacterAvatar } from './CharacterAvatar';
import { SpellerProfile } from '../types/spelling';
import { AVATAR_OPTIONS, getBeeRank } from '../utils/spellingUtils';

interface ProfileModalProps {
  visible: boolean;
  profiles: SpellerProfile[];
  activeProfileId: number;
  onClose: () => void;
  onSelectProfile: (profileId: number) => void;
  onCreateProfile: (name: string, avatar: string, grade: string) => void;
  onDeleteProfile: (profileId: number) => void;
}

const GRADE_OPTIONS = [
  { label: '🐝 Beginner', value: 'Level 1 • Beginner (One Bee)' },
  { label: '🐝🐝 Intermediate', value: 'Level 2 • Intermediate (Two Bee)' },
  { label: '🐝🐝🐝 Advanced', value: 'Level 3 • Advanced (Three Bee)' }
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  profiles,
  activeProfileId,
  onClose,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐝');
  const [selectedGrade, setSelectedGrade] = useState(GRADE_OPTIONS[1].value);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateProfile(newName.trim(), selectedAvatar, selectedGrade);
    setNewName('');
    setSelectedAvatar('🐝');
    setIsCreating(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerEmoji}>👤</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!isCreating ? (
            <>
              <ScrollView style={styles.listScroll}>
                {profiles.map((prof) => {
                  const isActive = prof.id === activeProfileId;
                  const rank = getBeeRank(prof.honeyPoints);
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={[styles.profileItem, isActive && styles.profileItemActive]}
                      onPress={() => {
                        onSelectProfile(prof.id);
                        onClose();
                      }}
                    >
                      <View style={styles.avatarCircle}>
                        <CharacterAvatar
                          customization={prof.customization}
                          size={42}
                          showBackdrop={false}
                        />
                      </View>
                      <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.profileName}>{prof.name}</Text>
                          {isActive && <Text style={styles.activeCheck}>✅</Text>}
                        </View>
                        <Text style={styles.profileStats}>
                          {rank.emoji}  •  🍯 {prof.honeyPoints}  •  🔥 {prof.bestStreak}  •  ✅{' '}
                          {prof.totalCorrect}
                        </Text>
                      </View>
                      {profiles.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => onDeleteProfile(prof.id)}
                        >
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.addProfileBtn}
                onPress={() => setIsCreating(true)}
              >
                <Text style={styles.addProfileBtnText}>➕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.createForm}>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="👤 Name..."
                placeholderTextColor="#94A3B8"
                autoFocus
              />

              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((av) => (
                  <TouchableOpacity
                    key={av}
                    style={[
                      styles.avatarChoice,
                      selectedAvatar === av && styles.avatarChoiceSelected
                    ]}
                    onPress={() => setSelectedAvatar(av)}
                  >
                    <Text style={styles.avatarChoiceEmoji}>{av}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.gradeList}>
                {GRADE_OPTIONS.map((gr) => (
                  <TouchableOpacity
                    key={gr.value}
                    style={[
                      styles.gradeOption,
                      selectedGrade === gr.value && styles.gradeOptionSelected
                    ]}
                    onPress={() => setSelectedGrade(gr.value)}
                  >
                    <Text
                      style={[
                        styles.gradeOptionText,
                        selectedGrade === gr.value && styles.gradeOptionTextSelected
                      ]}
                    >
                      {gr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.cancelBtnText}>↩️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !newName.trim() && styles.disabledBtn]}
                  disabled={!newName.trim()}
                  onPress={handleCreate}
                >
                  <Text style={styles.saveBtnText}>✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: '#FFC72C',
    borderBottomColor: '#D97706'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  headerEmoji: {
    fontSize: 34
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#475569'
  },
  listScroll: {
    maxHeight: 320,
    marginBottom: 14
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#E2E8F0',
    marginBottom: 10
  },
  profileItemActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderBottomColor: '#D97706'
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#F59E0B'
  },
  avatarEmoji: {
    fontSize: 28
  },
  profileInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A'
  },
  activeCheck: {
    fontSize: 18
  },
  profileStats: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '800'
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 6
  },
  deleteBtnText: {
    fontSize: 20
  },
  addProfileBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#334155'
  },
  addProfileBtnText: {
    fontSize: 24
  },
  createForm: {
    marginTop: 4
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 14
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
    justifyContent: 'center'
  },
  avatarChoice: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarChoiceSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderBottomColor: '#D97706'
  },
  avatarChoiceEmoji: {
    fontSize: 26
  },
  gradeList: {
    gap: 8,
    marginBottom: 16
  },
  gradeOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  gradeOptionSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderBottomColor: '#D97706'
  },
  gradeOptionText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#334155'
  },
  gradeOptionTextSelected: {
    color: '#92400E'
  },
  formActions: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#94A3B8'
  },
  cancelBtnText: {
    fontSize: 22
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#58CC02',
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#46A302'
  },
  saveBtnText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  disabledBtn: {
    opacity: 0.45
  }
});
