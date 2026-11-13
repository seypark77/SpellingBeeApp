import {
  BgAuraItemId,
  CharacterCustomization,
  EyewearItemId,
  HatItemId,
  OutfitItemId,
  PropItemId,
  BaseCharacterId,
  ShopCategory,
  ShopItem,
  SpellerProfile,
} from '../types/spelling';

export const DEFAULT_CUSTOMIZATION: CharacterCustomization = {
  baseCharacter: 'bee',
  hat: 'none',
  eyewear: 'none',
  outfit: 'satchel',
  prop: 'pencil_card',
  bgAura: 'meadow',
};

export const MASTER_PREVIEW_CUSTOMIZATION: CharacterCustomization = {
  baseCharacter: 'bee',
  hat: 'gold_crown',
  eyewear: 'round_glasses',
  outfit: 'master_cape',
  prop: 'wand_tome',
  bgAura: 'starry_bee',
};

export const DEFAULT_OWNED_ITEMS: string[] = [
  'char:bee',
  'hat:none',
  'eyewear:none',
  'outfit:none',
  'outfit:satchel',
  'prop:none',
  'prop:pencil_card',
  'bgAura:meadow',
];

export const SHOP_CATEGORIES: { key: ShopCategory; label: string; icon: string }[] = [
  { key: 'hat', label: 'Hats', icon: '🎩' },
  { key: 'eyewear', label: 'Glasses', icon: '👓' },
  { key: 'outfit', label: 'Outfits', icon: '🧥' },
  { key: 'prop', label: 'Props', icon: '🪄' },
  { key: 'bgAura', label: 'Backdrops', icon: '✨' },
  { key: 'character', label: 'Characters', icon: '🐝' },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Base Characters
  {
    id: 'char:bee',
    slotValue: 'bee',
    category: 'character',
    nameKo: '아기 꿀벌',
    nameEn: 'Honey Bee',
    description: 'The cheerful mascot of the Spelling Bee! Plump, brave, and buzzing with energy.',
    price: 0,
    icon: '🐝',
    accentColor: '#F59E0B',
    isDefault: true,
  },
  {
    id: 'char:wizard_girl',
    slotValue: 'wizard_girl',
    category: 'character',
    nameKo: '꼬마 여마법사',
    nameEn: 'Little Witch',
    description: 'A magical girl with braided ginger hair who casts spells to master tricky words!',
    price: 600,
    icon: '🧙‍♀️',
    accentColor: '#8B5CF6',
  },
  {
    id: 'char:detective_boy',
    slotValue: 'detective_boy',
    category: 'character',
    nameKo: '꼬마 소년 탐정',
    nameEn: 'Junior Detective',
    description: 'A junior detective hunting down spelling clues and silent letters!',
    price: 600,
    icon: '🕵️‍♂️',
    accentColor: '#B45309',
  },

  // Hats
  {
    id: 'hat:none',
    slotValue: 'none',
    category: 'hat',
    nameKo: '기본 스타일',
    nameEn: 'Natural Look',
    description: 'Clean, hat-free natural hairstyle.',
    price: 0,
    icon: '🌼',
    accentColor: '#94A3B8',
    isDefault: true,
  },
  {
    id: 'hat:flower_crown',
    slotValue: 'flower_crown',
    category: 'hat',
    nameKo: '데이지 화관',
    nameEn: 'Flower Crown',
    description: 'Sweet blooming daisy wreath bursting with spring sunshine.',
    price: 100,
    icon: '🌸',
    accentColor: '#EC4899',
  },
  {
    id: 'hat:wizard_hat',
    slotValue: 'wizard_hat',
    category: 'hat',
    nameKo: '마법사 모자',
    nameEn: 'Wizard Hat',
    description: 'Midnight blue wizard hat sprinkled with glowing golden stars.',
    price: 180,
    icon: '🎩',
    accentColor: '#6366F1',
  },
  {
    id: 'hat:detective_fedora',
    slotValue: 'detective_fedora',
    category: 'hat',
    nameKo: '탐정 페도라',
    nameEn: 'Detective Hat',
    description: 'Classic Sherlock tweed hat for solving tough spelling mysteries.',
    price: 220,
    icon: '🕵️',
    accentColor: '#92400E',
  },
  {
    id: 'hat:grad_cap',
    slotValue: 'grad_cap',
    category: 'hat',
    nameKo: '우등생 학사모',
    nameEn: 'Grad Cap',
    description: 'Scholarly graduation cap with a shiny golden tassel.',
    price: 350,
    icon: '🎓',
    accentColor: '#1E293B',
  },
  {
    id: 'hat:gold_crown',
    slotValue: 'gold_crown',
    category: 'hat',
    nameKo: '챔피언 황금 왕관',
    nameEn: 'Champion Crown',
    description: 'Royal ruby-encrusted golden crown fit for a Spelling Bee champion!',
    price: 500,
    icon: '👑',
    accentColor: '#D97706',
  },

  // Eyewear
  {
    id: 'eyewear:none',
    slotValue: 'none',
    category: 'eyewear',
    nameKo: '맑은 큰 눈',
    nameEn: 'No Glasses',
    description: 'Big, bright, sparkling natural eyes.',
    price: 0,
    icon: '👀',
    accentColor: '#94A3B8',
    isDefault: true,
  },
  {
    id: 'eyewear:round_glasses',
    slotValue: 'round_glasses',
    category: 'eyewear',
    nameKo: '똑똑 금테 안경',
    nameEn: 'Round Glasses',
    description: 'Classic round golden wireframes for maximum spelling smarts!',
    price: 120,
    icon: '👓',
    accentColor: '#B45309',
  },

  // Outfits
  {
    id: 'outfit:satchel',
    slotValue: 'satchel',
    category: 'outfit',
    nameKo: '꼬마 크로스 가방',
    nameEn: 'Honey Satchel',
    description: 'Cute leather crossbody satchel for carrying spelling word cards.',
    price: 0,
    icon: '🎒',
    accentColor: '#B45309',
    isDefault: true,
  },
  {
    id: 'outfit:bowtie',
    slotValue: 'bowtie',
    category: 'outfit',
    nameKo: '레드 나비넥타이',
    nameEn: 'Red Bowtie',
    description: 'Dapper crimson bowtie ready for the big stage spotlight.',
    price: 100,
    icon: '🎀',
    accentColor: '#DC2626',
  },
  {
    id: 'outfit:red_cape',
    slotValue: 'red_cape',
    category: 'outfit',
    nameKo: '스펠링 히어로 망토',
    nameEn: 'Hero Red Cape',
    description: 'Fluttering superhero cape for fearless young spellers.',
    price: 200,
    icon: '🦸',
    accentColor: '#EF4444',
  },
  {
    id: 'outfit:detective_vest',
    slotValue: 'detective_vest',
    category: 'outfit',
    nameKo: '클래식 탐정 조끼',
    nameEn: 'Detective Vest',
    description: 'Tailored tweed vest complete with polished pocket flaps.',
    price: 260,
    icon: '🦺',
    accentColor: '#78350F',
  },
  {
    id: 'outfit:master_cape',
    slotValue: 'master_cape',
    category: 'outfit',
    nameKo: '마스터 골드 망토',
    nameEn: 'Master Gold Cape',
    description: 'Regal cape trimmed with pure gold embroidery and a jewel clasp.',
    price: 650,
    icon: '🧥',
    accentColor: '#92400E',
  },
  {
    id: 'outfit:none',
    slotValue: 'none',
    category: 'outfit',
    nameKo: '가벼운 기본 옷차림',
    nameEn: 'Minimal',
    description: 'Simple and light natural appearance.',
    price: 0,
    icon: '🐝',
    accentColor: '#94A3B8',
    isDefault: true,
  },

  // Held Props
  {
    id: 'prop:pencil_card',
    slotValue: 'pencil_card',
    category: 'prop',
    nameKo: '연필 & A+ 카드',
    nameEn: 'Pencil & A+ Card',
    description: 'Classic yellow #2 pencil and an A+ alphabet flashcard.',
    price: 0,
    icon: '✏️',
    accentColor: '#F59E0B',
    isDefault: true,
  },
  {
    id: 'prop:star_wand',
    slotValue: 'star_wand',
    category: 'prop',
    nameKo: '황금 별 지팡이',
    nameEn: 'Star Wand',
    description: 'Magical golden star wand that twinkles whenever you spell correctly!',
    price: 150,
    icon: '🪄',
    accentColor: '#FBBF24',
  },
  {
    id: 'prop:magnifier',
    slotValue: 'magnifier',
    category: 'prop',
    nameKo: '명탐정 돋보기',
    nameEn: 'Magnifying Glass',
    description: 'Handy glass lens to zoom in and inspect silent vowels and prefixes.',
    price: 200,
    icon: '🔎',
    accentColor: '#0EA5E9',
  },
  {
    id: 'prop:spelling_tome',
    slotValue: 'spelling_tome',
    category: 'prop',
    nameKo: '스펠링 비 마법책',
    nameEn: 'Spelling Bee Tome',
    description: 'Deep royal blue dictionary stamped with the golden Spelling Bee crest.',
    price: 320,
    icon: '📖',
    accentColor: '#2563EB',
  },
  {
    id: 'prop:wand_tome',
    slotValue: 'wand_tome',
    category: 'prop',
    nameKo: '별 지팡이 & 대사전 세트',
    nameEn: 'Wand & Tome Set',
    description: 'Holding the star wand in one hand and the open Spelling Bee grimoire!',
    price: 550,
    icon: '🌟',
    accentColor: '#4F46E5',
  },
  {
    id: 'prop:none',
    slotValue: 'none',
    category: 'prop',
    nameKo: '소품 비우기',
    nameEn: 'Empty Hands',
    description: 'Hands-free and ready to buzz with victory!',
    price: 0,
    icon: '🙌',
    accentColor: '#94A3B8',
    isDefault: true,
  },

  // Backdrops
  {
    id: 'bgAura:meadow',
    slotValue: 'meadow',
    category: 'bgAura',
    nameKo: '햇살 꿀빛 무대',
    nameEn: 'Sunny Honey Meadow',
    description: 'Warm honey cream backdrop with friendly honeycomb tiles.',
    price: 0,
    icon: '☀️',
    accentColor: '#F59E0B',
    isDefault: true,
  },
  {
    id: 'bgAura:sparkle_gold',
    slotValue: 'sparkle_gold',
    category: 'bgAura',
    nameKo: '황금 꿀빛 오라',
    nameEn: 'Golden Honey Aura',
    description: 'Shimmering golden sparkles and stars illuminating your stage.',
    price: 400,
    icon: '✨',
    accentColor: '#D97706',
  },
  {
    id: 'bgAura:starry_bee',
    slotValue: 'starry_bee',
    category: 'bgAura',
    nameKo: '밤하늘 B·E·E 마법진',
    nameEn: 'Starry B-E-E Night',
    description: 'Deep cosmic night sky filled with floating B-E-E alphabet tiles!',
    price: 1200,
    icon: '🌌',
    accentColor: '#312E81',
  },
];

export function getShopItemId(category: ShopCategory, slotValue: string): string {
  const prefix = category === 'character' ? 'char' : category;
  return `${prefix}:${slotValue}`;
}

export function getOwnedItems(profile?: Partial<SpellerProfile> | null): string[] {
  const base = new Set<string>(DEFAULT_OWNED_ITEMS);
  if (profile && Array.isArray(profile.ownedItems)) {
    for (const id of profile.ownedItems) {
      if (typeof id === 'string' && id.length > 0) {
        base.add(id);
      }
    }
  }
  return Array.from(base);
}

const VALID_CHARS: BaseCharacterId[] = ['bee', 'wizard_girl', 'detective_boy'];
const VALID_HATS: HatItemId[] = [
  'none',
  'wizard_hat',
  'detective_fedora',
  'gold_crown',
  'flower_crown',
  'grad_cap',
];
const VALID_EYEWEAR: EyewearItemId[] = ['none', 'round_glasses'];
const VALID_OUTFITS: OutfitItemId[] = [
  'none',
  'satchel',
  'red_cape',
  'bowtie',
  'detective_vest',
  'master_cape',
];
const VALID_PROPS: PropItemId[] = [
  'none',
  'pencil_card',
  'star_wand',
  'magnifier',
  'spelling_tome',
  'wand_tome',
];
const VALID_BGS: BgAuraItemId[] = ['meadow', 'sparkle_gold', 'starry_bee'];

export function normalizeCustomization(
  raw?: Partial<CharacterCustomization> | null
): CharacterCustomization {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_CUSTOMIZATION };
  }
  return {
    baseCharacter: VALID_CHARS.includes(raw.baseCharacter as BaseCharacterId)
      ? (raw.baseCharacter as BaseCharacterId)
      : DEFAULT_CUSTOMIZATION.baseCharacter,
    hat: VALID_HATS.includes(raw.hat as HatItemId)
      ? (raw.hat as HatItemId)
      : DEFAULT_CUSTOMIZATION.hat,
    eyewear: VALID_EYEWEAR.includes(raw.eyewear as EyewearItemId)
      ? (raw.eyewear as EyewearItemId)
      : DEFAULT_CUSTOMIZATION.eyewear,
    outfit: VALID_OUTFITS.includes(raw.outfit as OutfitItemId)
      ? (raw.outfit as OutfitItemId)
      : DEFAULT_CUSTOMIZATION.outfit,
    prop: VALID_PROPS.includes(raw.prop as PropItemId)
      ? (raw.prop as PropItemId)
      : DEFAULT_CUSTOMIZATION.prop,
    bgAura: VALID_BGS.includes(raw.bgAura as BgAuraItemId)
      ? (raw.bgAura as BgAuraItemId)
      : DEFAULT_CUSTOMIZATION.bgAura,
  };
}

export function getSpendableHoney(profile?: Partial<SpellerProfile> | null): number {
  if (!profile) return 0;
  const total = typeof profile.honeyPoints === 'number' ? profile.honeyPoints : 0;
  const spent = typeof profile.spentHoney === 'number' ? profile.spentHoney : 0;
  return Math.max(0, total - spent);
}

export function normalizeProfileCustomization(profile: SpellerProfile): SpellerProfile {
  return {
    ...profile,
    spentHoney: typeof profile.spentHoney === 'number' && profile.spentHoney >= 0 ? profile.spentHoney : 0,
    ownedItems: getOwnedItems(profile),
    customization: normalizeCustomization(profile.customization),
  };
}
