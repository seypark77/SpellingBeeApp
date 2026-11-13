import React from 'react';
import { Image, Text, View } from 'react-native';
import { CharacterCustomization } from '../types/spelling';
import {
  BASE_CHARACTER_IMAGES,
  EYEWEAR_IMAGES,
  HAT_IMAGES,
  OUTFIT_IMAGES,
  PROP_IMAGES,
} from '../utils/characterAssets';
import { DEFAULT_CUSTOMIZATION, normalizeCustomization } from '../utils/characterShopData';

interface CharacterAvatarProps {
  customization?: Partial<CharacterCustomization> | null;
  size?: number;
  showBackdrop?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  customization,
  size = 120,
  showBackdrop = true,
}) => {
  const cfg = normalizeCustomization(customization || DEFAULT_CUSTOMIZATION);

  const isMasterFullSet =
    cfg.baseCharacter === 'bee' &&
    cfg.hat === 'gold_crown' &&
    cfg.eyewear === 'round_glasses' &&
    cfg.outfit === 'master_cape' &&
    cfg.prop === 'wand_tome' &&
    cfg.bgAura === 'starry_bee';

  const b = size / 120;

  if (showBackdrop && isMasterFullSet) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.24,
          borderWidth: Math.max(1.5, 2.5 * b),
          borderColor: '#6366F1',
          backgroundColor: '#1E1B4B',
          overflow: 'hidden',
        }}
      >
        <Image
          source={BASE_CHARACTER_IMAGES.master_bee_stage}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Virtual 280x280 design space aligned to base_bee.png
  const charScale = showBackdrop ? 0.94 : 1.1;
  const s = (size / 280) * charScale;
  const stageSize = 280 * s;
  const offsetX = (size - stageSize) / 2;
  const offsetY = showBackdrop
    ? (size - stageSize) / 2 + size * 0.03
    : (size - stageSize) / 2 + size * 0.05;

  const bgColor = !showBackdrop
    ? 'transparent'
    : cfg.bgAura === 'starry_bee'
      ? '#1E2563'
      : cfg.bgAura === 'sparkle_gold'
        ? '#FEF3C7'
        : '#FFFBE6';

  const bgBorderColor =
    cfg.bgAura === 'starry_bee'
      ? '#6366F1'
      : cfg.bgAura === 'sparkle_gold'
        ? '#F59E0B'
        : '#FDE68A';

  const baseImageSource =
    cfg.baseCharacter === 'bee'
      ? cfg.prop === 'pencil_card'
        ? BASE_CHARACTER_IMAGES.bee
        : BASE_CHARACTER_IMAGES.bee_clean_props
      : cfg.baseCharacter === 'wizard_girl'
        ? BASE_CHARACTER_IMAGES.wizard_girl
        : BASE_CHARACTER_IMAGES.detective_boy;

  const isBee = cfg.baseCharacter === 'bee';

  const hatSource =
    cfg.hat !== 'none'
      ? HAT_IMAGES[cfg.hat as keyof typeof HAT_IMAGES]
      : undefined;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: showBackdrop ? size * 0.24 : size / 2,
        backgroundColor: bgColor,
        borderWidth: showBackdrop ? Math.max(1.5, 2.5 * b) : 0,
        borderColor: showBackdrop ? bgBorderColor : 'transparent',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* BACKDROP LAYERS */}
      {showBackdrop && cfg.bgAura === 'meadow' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: 14 * b,
              top: 12 * b,
              width: 92 * b,
              height: 92 * b,
              borderRadius: 46 * b,
              backgroundColor: '#FEF9C3',
              opacity: 0.72,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: -8 * b,
              bottom: -14 * b,
              width: 34 * b,
              height: 34 * b,
              borderRadius: 10 * b,
              backgroundColor: '#FDE68A',
              opacity: 0.6,
              transform: [{ rotate: '30deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: -8 * b,
              bottom: -14 * b,
              width: 34 * b,
              height: 34 * b,
              borderRadius: 10 * b,
              backgroundColor: '#FDE68A',
              opacity: 0.6,
              transform: [{ rotate: '30deg' }],
            }}
          />
        </>
      )}

      {showBackdrop && cfg.bgAura === 'sparkle_gold' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: 11 * b,
              top: 11 * b,
              width: 98 * b,
              height: 98 * b,
              borderRadius: 49 * b,
              backgroundColor: '#FDE68A',
              borderWidth: Math.max(1.5, 2 * b),
              borderColor: '#FBBF24',
              opacity: 0.85,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 24 * b,
              top: 24 * b,
              width: 72 * b,
              height: 72 * b,
              borderRadius: 36 * b,
              backgroundColor: '#FFFBEB',
              opacity: 0.85,
            }}
          />
          <Text
            style={{
              position: 'absolute',
              left: 10 * b,
              top: 11 * b,
              fontSize: 13 * b,
              color: '#D97706',
              fontWeight: '900',
            }}
          >
            ✦
          </Text>
          <Text
            style={{
              position: 'absolute',
              right: 11 * b,
              top: 15 * b,
              fontSize: 11 * b,
              color: '#F59E0B',
              fontWeight: '900',
            }}
          >
            ✦
          </Text>
          <Text
            style={{
              position: 'absolute',
              left: 14 * b,
              bottom: 13 * b,
              fontSize: 10 * b,
              color: '#F59E0B',
              fontWeight: '900',
            }}
          >
            ✦
          </Text>
          <Text
            style={{
              position: 'absolute',
              right: 12 * b,
              bottom: 11 * b,
              fontSize: 13 * b,
              color: '#D97706',
              fontWeight: '900',
            }}
          >
            ✦
          </Text>
        </>
      )}

      {showBackdrop && cfg.bgAura === 'starry_bee' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: 10 * b,
              top: 10 * b,
              width: 100 * b,
              height: 100 * b,
              borderRadius: 50 * b,
              backgroundColor: '#2B3A8C',
              borderWidth: Math.max(1, 1.5 * b),
              borderColor: '#818CF8',
              opacity: 0.9,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 22 * b,
              top: 20 * b,
              width: 76 * b,
              height: 76 * b,
              borderRadius: 38 * b,
              backgroundColor: '#3B82F6',
              opacity: 0.25,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -6 * b,
              height: 22 * b,
              borderTopLeftRadius: 30 * b,
              borderTopRightRadius: 30 * b,
              backgroundColor: '#FCD34D',
              opacity: 0.35,
            }}
          />
          <Text style={{ position: 'absolute', left: 26 * b, top: 8 * b, fontSize: 9 * b, color: '#FDE047' }}>
            ★
          </Text>
          <Text style={{ position: 'absolute', right: 24 * b, top: 9 * b, fontSize: 8 * b, color: '#FEF9C3' }}>
            ★
          </Text>
          <Text style={{ position: 'absolute', right: 12 * b, bottom: 26 * b, fontSize: 9 * b, color: '#FDE047' }}>
            ✦
          </Text>

          <View
            style={{
              position: 'absolute',
              left: 6 * b,
              top: 18 * b,
              width: 16 * b,
              height: 16 * b,
              borderRadius: 4 * b,
              backgroundColor: '#FDE68A',
              borderWidth: Math.max(1, 1.4 * b),
              borderColor: '#78350F',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '-12deg' }],
            }}
          >
            <Text style={{ fontSize: 9.5 * b, fontWeight: '900', color: '#451A03' }}>B</Text>
          </View>
          <View
            style={{
              position: 'absolute',
              right: 7 * b,
              top: 20 * b,
              width: 16 * b,
              height: 16 * b,
              borderRadius: 4 * b,
              backgroundColor: '#FDE68A',
              borderWidth: Math.max(1, 1.4 * b),
              borderColor: '#78350F',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '14deg' }],
            }}
          >
            <Text style={{ fontSize: 9.5 * b, fontWeight: '900', color: '#451A03' }}>E</Text>
          </View>
          <View
            style={{
              position: 'absolute',
              left: 10 * b,
              bottom: 11 * b,
              width: 15 * b,
              height: 15 * b,
              borderRadius: 4 * b,
              backgroundColor: '#FDE68A',
              borderWidth: Math.max(1, 1.4 * b),
              borderColor: '#78350F',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '8deg' }],
            }}
          >
            <Text style={{ fontSize: 9 * b, fontWeight: '900', color: '#451A03' }}>E</Text>
          </View>
        </>
      )}

      {/* CHARACTER & ACCESSORY SPRITE LAYERS (calibrated to 280x280 base_bee anchors) */}
      <View
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: stageSize,
          height: stageSize,
        }}
      >
        {/* LAYER 1: BASE CHARACTER BODY */}
        <Image
          source={baseImageSource}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: stageSize,
            height: stageSize,
          }}
          resizeMode="contain"
        />

        {/* LAYER 2: OUTFIT OVERLAYS (Mainly for Bee) */}
        {isBee && cfg.outfit === 'satchel' && (
          <Image
            source={OUTFIT_IMAGES.satchel}
            style={{
              position: 'absolute',
              left: 84 * s,
              top: 192 * s,
              width: 52 * s,
              height: 50 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.outfit === 'bowtie' && (
          <Image
            source={OUTFIT_IMAGES.bowtie}
            style={{
              position: 'absolute',
              left: 110 * s,
              top: 146 * s,
              width: 56 * s,
              height: 52 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.outfit === 'detective_vest' && (
          <Image
            source={OUTFIT_IMAGES.detective_vest}
            style={{
              position: 'absolute',
              left: 88 * s,
              top: 150 * s,
              width: 100 * s,
              height: 92 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.outfit === 'red_cape' && (
          <Image
            source={OUTFIT_IMAGES.red_cape}
            style={{
              position: 'absolute',
              left: 68 * s,
              top: 150 * s,
              width: 140 * s,
              height: 108 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.outfit === 'master_cape' && (
          <Image
            source={OUTFIT_IMAGES.master_cape}
            style={{
              position: 'absolute',
              left: 58 * s,
              top: 147 * s,
              width: 160 * s,
              height: 114 * s,
            }}
            resizeMode="contain"
          />
        )}

        {/* LAYER 3: EYEWEAR (Round Glasses) */}
        {cfg.eyewear === 'round_glasses' && (
          <Image
            source={EYEWEAR_IMAGES.round_glasses}
            style={
              cfg.baseCharacter === 'wizard_girl'
                ? {
                    position: 'absolute',
                    left: 98 * s,
                    top: 106 * s,
                    width: 106 * s,
                    height: 48 * s,
                  }
                : cfg.baseCharacter === 'detective_boy'
                  ? {
                      position: 'absolute',
                      left: 82 * s,
                      top: 102 * s,
                      width: 108 * s,
                      height: 48 * s,
                    }
                  : {
                      position: 'absolute',
                      left: 78 * s,
                      top: 90 * s,
                      width: 114 * s,
                      height: 52 * s,
                    }
            }
            resizeMode="contain"
          />
        )}

        {/* LAYER 4: HATS (When Bee is equipped) */}
        {isBee && hatSource && cfg.hat === 'gold_crown' && (
          <Image
            source={hatSource}
            style={{
              position: 'absolute',
              left: 82 * s,
              top: 1 * s,
              width: 114 * s,
              height: 82 * s,
            }}
            resizeMode="contain"
          />
        )}
        {isBee && hatSource && cfg.hat === 'wizard_hat' && (
          <Image
            source={hatSource}
            style={{
              position: 'absolute',
              left: 58 * s,
              top: -6 * s,
              width: 162 * s,
              height: 96 * s,
            }}
            resizeMode="contain"
          />
        )}
        {isBee && hatSource && cfg.hat === 'detective_fedora' && (
          <Image
            source={hatSource}
            style={{
              position: 'absolute',
              left: 62 * s,
              top: 10 * s,
              width: 154 * s,
              height: 82 * s,
            }}
            resizeMode="contain"
          />
        )}
        {isBee && hatSource && cfg.hat === 'flower_crown' && (
          <Image
            source={hatSource}
            style={{
              position: 'absolute',
              left: 64 * s,
              top: 16 * s,
              width: 150 * s,
              height: 74 * s,
            }}
            resizeMode="contain"
          />
        )}
        {isBee && hatSource && cfg.hat === 'grad_cap' && (
          <Image
            source={hatSource}
            style={{
              position: 'absolute',
              left: 60 * s,
              top: 2 * s,
              width: 156 * s,
              height: 86 * s,
            }}
            resizeMode="contain"
          />
        )}

        {/* LAYER 5: HELD PROPS (When Bee is equipped) */}
        {isBee && (cfg.prop === 'star_wand' || cfg.prop === 'wand_tome') && (
          <Image
            source={PROP_IMAGES.star_wand}
            style={{
              position: 'absolute',
              left: 179 * s,
              top: 108 * s,
              width: 72 * s,
              height: 86 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.prop === 'magnifier' && (
          <Image
            source={PROP_IMAGES.magnifier}
            style={{
              position: 'absolute',
              left: 174 * s,
              top: 116 * s,
              width: 68 * s,
              height: 80 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.prop === 'spelling_tome' && (
          <Image
            source={PROP_IMAGES.spelling_tome}
            style={{
              position: 'absolute',
              left: 34 * s,
              top: 142 * s,
              width: 68 * s,
              height: 70 * s,
            }}
            resizeMode="contain"
          />
        )}

        {isBee && cfg.prop === 'wand_tome' && (
          <Image
            source={PROP_IMAGES.open_tome}
            style={{
              position: 'absolute',
              left: 16 * s,
              top: 146 * s,
              width: 98 * s,
              height: 80 * s,
            }}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
};
