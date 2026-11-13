import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CharacterCustomization,
  ShopCategory,
  ShopItem,
  SpellerProfile,
} from '../types/spelling';
import { SHOP_ITEM_THUMBNAILS } from '../utils/characterAssets';
import {
  DEFAULT_CUSTOMIZATION,
  MASTER_PREVIEW_CUSTOMIZATION,
  SHOP_CATEGORIES,
  SHOP_ITEMS,
  getOwnedItems,
  getSpendableHoney,
  normalizeCustomization,
} from '../utils/characterShopData';
import { playCorrectSound, triggerHaptic } from '../utils/speechUtils';
import { CharacterAvatar } from './CharacterAvatar';

interface CharacterWardrobeModalProps {
  visible: boolean;
  profile: SpellerProfile;
  onClose: () => void;
  onSaveCustomization: (payload: {
    spentHoney: number;
    ownedItems: string[];
    customization: CharacterCustomization;
  }) => Promise<void>;
}

function applyItemToCustomization(
  base: CharacterCustomization,
  item: ShopItem
): CharacterCustomization {
  const next = { ...base };
  switch (item.category) {
    case 'character':
      next.baseCharacter = item.slotValue as CharacterCustomization['baseCharacter'];
      break;
    case 'hat':
      next.hat = item.slotValue as CharacterCustomization['hat'];
      break;
    case 'eyewear':
      next.eyewear = item.slotValue as CharacterCustomization['eyewear'];
      break;
    case 'outfit':
      next.outfit = item.slotValue as CharacterCustomization['outfit'];
      break;
    case 'prop':
      next.prop = item.slotValue as CharacterCustomization['prop'];
      break;
    case 'bgAura':
      next.bgAura = item.slotValue as CharacterCustomization['bgAura'];
      break;
  }
  return next;
}

function isItemEquipped(cfg: CharacterCustomization, item: ShopItem): boolean {
  switch (item.category) {
    case 'character':
      return cfg.baseCharacter === item.slotValue;
    case 'hat':
      return cfg.hat === item.slotValue;
    case 'eyewear':
      return cfg.eyewear === item.slotValue;
    case 'outfit':
      return cfg.outfit === item.slotValue;
    case 'prop':
      return cfg.prop === item.slotValue;
    case 'bgAura':
      return cfg.bgAura === item.slotValue;
  }
}

export const CharacterWardrobeModal: React.FC<CharacterWardrobeModalProps> = ({
  visible,
  profile,
  onClose,
  onSaveCustomization,
}) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('hat');
  const [masterPreviewOn, setMasterPreviewOn] = useState(false);
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const equippedCustomization = useMemo(
    () => normalizeCustomization(profile.customization || DEFAULT_CUSTOMIZATION),
    [profile.customization]
  );

  const ownedItems = useMemo(() => getOwnedItems(profile), [profile]);
  const spendableHoney = getSpendableHoney(profile);

  const displayCustomization = useMemo(() => {
    if (masterPreviewOn) {
      return MASTER_PREVIEW_CUSTOMIZATION;
    }
    if (previewItem) {
      return applyItemToCustomization(equippedCustomization, previewItem);
    }
    return equippedCustomization;
  }, [masterPreviewOn, previewItem, equippedCustomization]);

  const categoryItems = useMemo(
    () => SHOP_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const handleEquipOrBuy = async (item: ShopItem) => {
    if (busy) return;
    const isOwned = item.isDefault || item.price === 0 || ownedItems.includes(item.id);

    if (isOwned) {
      setMasterPreviewOn(false);
      setPreviewItem(null);
      setStatusNotice(`Equipped "${item.nameEn}"!`);
      setBusy(true);
      try {
        triggerHaptic('light');
        const nextCustom = applyItemToCustomization(equippedCustomization, item);
        await onSaveCustomization({
          spentHoney: profile.spentHoney || 0,
          ownedItems,
          customization: nextCustom,
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    if (spendableHoney < item.price) {
      triggerHaptic('error');
      setMasterPreviewOn(false);
      setPreviewItem(item);
      const diff = item.price - spendableHoney;
      setStatusNotice(`Previewing! You need ${diff} more 🍯 to unlock.`);
      return;
    }

    // Purchase & Equip immediately
    setMasterPreviewOn(false);
    setPreviewItem(null);
    setBusy(true);
    try {
      await triggerHaptic('success');
      await playCorrectSound();
      const nextOwned = Array.from(new Set([...ownedItems, item.id]));
      const nextSpent = (profile.spentHoney || 0) + item.price;
      const nextCustom = applyItemToCustomization(equippedCustomization, item);
      await onSaveCustomization({
        spentHoney: nextSpent,
        ownedItems: nextOwned,
        customization: nextCustom,
      });
      setStatusNotice(`🎉 Unlocked & equipped "${item.nameEn}"!`);
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setMasterPreviewOn(false);
    setPreviewItem(null);
    setStatusNotice(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>✨ Bee Wardrobe & Shop</Text>
            <Text style={styles.headerSub}>
              Rank XP: {profile.honeyPoints} 🍯 • Shopping never lowers your Rank!
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.honeyPill}>
              <Text style={styles.honeyPillIcon}>🍯</Text>
              <Text style={styles.honeyPillText}>{spendableHoney}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Character Stage */}
        <View style={styles.stageCard}>
          <CharacterAvatar customization={displayCustomization} size={172} showBackdrop={true} />

          <View style={styles.stageControlsRow}>
            <TouchableOpacity
              style={[
                styles.masterPreviewBtn,
                masterPreviewOn && styles.masterPreviewBtnActive,
              ]}
              onPress={() => {
                triggerHaptic('light');
                setPreviewItem(null);
                setMasterPreviewOn((prev) => {
                  const next = !prev;
                  setStatusNotice(
                    next ? '👑 Previewing Master Bee set!' : null
                  );
                  return next;
                });
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.masterPreviewBtnText,
                  masterPreviewOn && styles.masterPreviewBtnTextActive,
                ]}
              >
                {masterPreviewOn ? '↩ Back to My Bee' : '👑 Preview Master Bee'}
              </Text>
            </TouchableOpacity>

            {(masterPreviewOn || previewItem) && (
              <TouchableOpacity
                style={styles.resetPreviewBtn}
                onPress={() => {
                  setMasterPreviewOn(false);
                  setPreviewItem(null);
                  setStatusNotice(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.resetPreviewText}>Reset Preview</Text>
              </TouchableOpacity>
            )}
          </View>

          {statusNotice && (
            <View style={styles.noticePill}>
              <Text style={styles.noticePillText}>{statusNotice}</Text>
            </View>
          )}
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {SHOP_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catTab, active && styles.catTabActive]}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catTabIcon}>{cat.icon}</Text>
                  <Text style={[styles.catTabLabel, active && styles.catTabLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Shop Item Grid */}
        <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContent}>
          <View style={styles.gridRow}>
            {categoryItems.map((item) => {
              const isOwned =
                item.isDefault || item.price === 0 || ownedItems.includes(item.id);
              const equipped = isItemEquipped(equippedCustomization, item);
              const isPreviewing = previewItem?.id === item.id;
              const canAfford = spendableHoney >= item.price;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    equipped && styles.itemCardEquipped,
                    isPreviewing && !equipped && styles.itemCardPreviewing,
                  ]}
                  onPress={() => handleEquipOrBuy(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.itemTopRow}>
                    <View
                      style={[
                        styles.itemIconCircle,
                        { backgroundColor: `${item.accentColor}20` },
                      ]}
                    >
                      {SHOP_ITEM_THUMBNAILS[item.id] ? (
                        <Image
                          source={SHOP_ITEM_THUMBNAILS[item.id]}
                          style={styles.itemThumbnail}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.itemIconText}>{item.icon}</Text>
                      )}
                    </View>
                    {equipped ? (
                      <View style={styles.equippedTag}>
                        <Text style={styles.equippedTagText}>✓ Equipped</Text>
                      </View>
                    ) : isOwned ? (
                      <View style={styles.ownedTag}>
                        <Text style={styles.ownedTagText}>Owned</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.priceTag,
                          !canAfford && styles.priceTagLocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priceTagText,
                            !canAfford && styles.priceTagTextLocked,
                          ]}
                        >
                          🍯 {item.price}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.nameEn}
                  </Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View
                    style={[
                      styles.actionBtn,
                      equipped
                        ? styles.actionBtnEquipped
                        : isOwned
                          ? styles.actionBtnOwned
                          : canAfford
                            ? styles.actionBtnBuy
                            : styles.actionBtnLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        equipped
                          ? styles.actionBtnTextEquipped
                          : isOwned
                            ? styles.actionBtnTextOwned
                            : canAfford
                              ? styles.actionBtnTextBuy
                              : styles.actionBtnTextLocked,
                      ]}
                    >
                      {equipped
                        ? 'Equipped'
                        : isOwned
                          ? 'Equip'
                          : canAfford
                            ? `🍯 ${item.price} Unlock`
                            : `🔒 Preview (${item.price} 🍯)`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  honeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  honeyPillIcon: {
    fontSize: 15,
  },
  honeyPillText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFC72C',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  stageCard: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FEF9C3',
    borderBottomWidth: 3,
    borderBottomColor: '#FDE047',
  },
  stageControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  masterPreviewBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  masterPreviewBtnActive: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  masterPreviewBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  masterPreviewBtnTextActive: {
    color: '#FEF08A',
  },
  resetPreviewBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  resetPreviewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  noticePill: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  noticePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE047',
  },
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  tabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  catTabActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  catTabIcon: {
    fontSize: 15,
  },
  catTabLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  catTabLabelActive: {
    color: '#92400E',
    fontWeight: '900',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    padding: 14,
    paddingBottom: 30,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    padding: 12,
    justifyContent: 'space-between',
  },
  itemCardEquipped: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderBottomColor: '#059669',
  },
  itemCardPreviewing: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderBottomColor: '#4338CA',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  itemThumbnail: {
    width: 34,
    height: 34,
  },
  itemIconText: {
    fontSize: 22,
  },
  equippedTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  equippedTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  ownedTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ownedTagText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
  },
  priceTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priceTagLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  priceTagText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '900',
  },
  priceTagTextLocked: {
    color: '#64748B',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 3,
  },
  itemDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 10,
    minHeight: 30,
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  actionBtnEquipped: {
    backgroundColor: '#D1FAE5',
    borderBottomColor: '#10B981',
  },
  actionBtnOwned: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#334155',
  },
  actionBtnBuy: {
    backgroundColor: '#F59E0B',
    borderBottomColor: '#B45309',
  },
  actionBtnLocked: {
    backgroundColor: '#F1F5F9',
    borderBottomColor: '#CBD5E1',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  actionBtnTextEquipped: {
    color: '#065F46',
  },
  actionBtnTextOwned: {
    color: '#FFFFFF',
  },
  actionBtnTextBuy: {
    color: '#FFFFFF',
  },
  actionBtnTextLocked: {
    color: '#475569',
  },
});
