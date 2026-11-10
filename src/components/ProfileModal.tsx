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

const GRADE_OPTIONS = ['1st–3rd Grade (One Bee)', '4th–6th Grade (Two Bee)', '7th–8th Grade (Three Bee)'];

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
  const [selectedGrade, setSelectedGrade] = useState(GRADE_OPTIONS[0]);

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
            <Text style={styles.title}>🐝 Speller Profiles</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Switch between siblings or family members! Each speller has their own Honey Points,
            Bee Rank, and Wrong Word Bank saved on this device.
          </Text>

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
                        <Text style={styles.avatarEmoji}>{prof.avatar}</Text>
                      </View>
                      <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.profileName}>{prof.name}</Text>
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.profileMeta}>
                          {rank.emoji} {rank.title} • {prof.grade}
                        </Text>
                        <Text style={styles.profileStats}>
                          🍯 {prof.honeyPoints} pts • 🔥 Best Streak: {prof.bestStreak} • ✅{' '}
                          {prof.totalCorrect} words
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
                <Text style={styles.addProfileBtnText}>+ Add Another Speller Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.formLabel}>SPELLER NAME</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter child's name (e.g., Emma, Noah)"
                placeholderTextColor="#94A3B8"
                autoFocus
              />

              <Text style={styles.formLabel}>CHOOSE BEE AVATAR</Text>
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

              <Text style={styles.formLabel}>SELECT GRADE DIVISION</Text>
              <View style={styles.gradeList}>
                {GRADE_OPTIONS.map((gr) => (
                  <TouchableOpacity
                    key={gr}
                    style={[
                      styles.gradeOption,
                      selectedGrade === gr && styles.gradeOptionSelected
                    ]}
                    onPress={() => setSelectedGrade(gr)}
                  >
                    <Text
                      style={[
                        styles.gradeOptionText,
                        selectedGrade === gr && styles.gradeOptionTextSelected
                      ]}
                    >
                      {gr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !newName.trim() && styles.disabledBtn]}
                  disabled={!newName.trim()}
                  onPress={handleCreate}
                >
                  <Text style={styles.saveBtnText}>Create Speller ✓</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
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
    marginBottom: 6
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
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
  subtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14
  },
  listScroll: {
    maxHeight: 310,
    marginBottom: 14
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10
  },
  profileItemActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 2
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B'
  },
  avatarEmoji: {
    fontSize: 24
  },
  profileInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  activeBadge: {
    backgroundColor: '#FFC72C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A'
  },
  profileMeta: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 2
  },
  profileStats: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '700'
  },
  deleteBtn: {
    padding: 8
  },
  deleteBtnText: {
    fontSize: 16
  },
  addProfileBtn: {
    backgroundColor: '#FFC72C',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  addProfileBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A'
  },
  createForm: {
    marginTop: 4
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  avatarChoice: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  avatarChoiceSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2
  },
  avatarChoiceEmoji: {
    fontSize: 22
  },
  gradeList: {
    gap: 6,
    marginBottom: 16
  },
  gradeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  gradeOptionSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  gradeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  gradeOptionTextSelected: {
    color: '#92400E',
    fontWeight: '800'
  },
  formActions: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155'
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#FFC72C',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706'
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A'
  },
  disabledBtn: {
    opacity: 0.45
  }
});
