import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface AdBannerProps {
  variant?: 'sticky' | 'card';
  style?: ViewStyle;
}

/**
 * Centralized COPPA / Kids-Category Safe Google AdMob Banner slot.
 * - In development (__DEV__), renders a visible layout preview banner so placement can be verified.
 * - In production builds without a live AdMob SDK configured yet, hides the placeholder cleanly
 *   so App Store / Google Play reviewers never see a mock ad box.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ variant = 'card', style }) => {
  // When react-native-google-mobile-ads is installed & configured with your production Ad Unit ID,
  // replace this return block with <BannerAd unitId={...} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  // requestOptions={{ requestNonPersonalizedAdsOnly: true }} />.
  if (!__DEV__) {
    return null;
  }

  if (variant === 'sticky') {
    return (
      <View style={[styles.stickyAdBar, style]}>
        <View style={styles.stickyAdInner}>
          <View style={styles.adBadgePill}>
            <Text style={styles.adBadgeText}>AD</Text>
          </View>
          <View style={styles.stickyAdTextCol}>
            <Text style={styles.stickyAdTitle}>Google AdMob Banner (Kids Safe • G-Rated)</Text>
            <Text style={styles.stickyAdSub}>Non-personalized family-safe ad space</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cardAdContainer, style]}>
      <View style={styles.adBadgePill}>
        <Text style={styles.adBadgeText}>AD</Text>
      </View>
      <Text style={styles.cardAdTitle}>Google AdMob Banner (Kids Safe • G-Rated)</Text>
      <Text style={styles.cardAdSub}>Non-personalized family-safe ad space</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyAdBar: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stickyAdInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    maxWidth: 680,
    width: '100%',
    gap: 10
  },
  adBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8
  },
  stickyAdTextCol: {
    alignItems: 'flex-start'
  },
  stickyAdTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569'
  },
  stickyAdSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8'
  },
  cardAdContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  cardAdTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: 4
  },
  cardAdSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2
  }
});
