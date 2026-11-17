import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
  MaxAdContentRating,
  TestIds,
} from 'react-native-google-mobile-ads';

interface AdBannerProps {
  variant?: 'sticky' | 'card';
  style?: ViewStyle;
}

let isAdMobConfigured = false;

/**
 * Configure AdMob globally with strict COPPA / Kids Category compliance:
 * - MaxAdContentRating.G: Only G-rated (General audience / all ages) ads
 * - tagForChildDirectedTreatment: true (COPPA compliant)
 * - tagForUnderAgeOfConsent: true (GDPR-K / under age of consent compliant)
 */
export function configureAdMob() {
  if (isAdMobConfigured || Platform.OS === 'web') return;
  try {
    mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
      })
      .then(() => mobileAds().initialize())
      .then(() => {
        isAdMobConfigured = true;
      })
      .catch((err) => {
        console.warn('AdMob configuration warning:', err);
      });
  } catch (err) {
    console.log('AdMob native module not available in this environment (e.g. Expo Go or Web)');
  }
}

/**
 * Official Google AdMob Test Banner Component
 * Uses Google's official Test Unit ID (TestIds.BANNER)
 * Displays live Google test ads on iOS/Android native builds,
 * and falls back cleanly on Web or Expo Go without crashing.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ variant = 'card', style }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    configureAdMob();
  }, []);

  // Web environment fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[variant === 'sticky' ? styles.stickyAdBar : styles.cardAdContainer, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>GOOGLE TEST AD (WEB)</Text>
        </View>
        <Text style={styles.cardAdTitle}>Google AdMob Test Banner</Text>
        <Text style={styles.cardAdSub}>Unit ID: {TestIds.BANNER} (320x50)</Text>
      </View>
    );
  }

  // If the test ad failed to load (e.g. in Expo Go without native build, or offline)
  if (adError) {
    if (!__DEV__) return null;
    return (
      <View style={[variant === 'sticky' ? styles.stickyAdBar : styles.cardAdContainer, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>TEST AD (EXPO GO / DEV)</Text>
        </View>
        <Text style={styles.cardAdTitle}>Google AdMob Test Banner Slot</Text>
        <Text style={styles.cardAdSub}>Test ID: {TestIds.BANNER} (Ready for Native Dev Build)</Text>
      </View>
    );
  }

  const banner = (
    <View style={styles.bannerCenterWrap}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
          setAdError(null);
        }}
        onAdFailedToLoad={(error) => {
          console.warn('AdMob test ad load error:', error);
          setAdError(error?.message || 'Failed to load');
        }}
      />
    </View>
  );

  if (variant === 'sticky') {
    return (
      <View style={[styles.stickyAdBar, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>GOOGLE TEST AD</Text>
        </View>
        {banner}
      </View>
    );
  }

  return (
    <View style={[styles.cardAdContainer, style]}>
      <View style={styles.adBadgePill}>
        <Text style={styles.adBadgeText}>GOOGLE TEST AD</Text>
      </View>
      {banner}
    </View>
  );
};

const styles = StyleSheet.create({
  stickyAdBar: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardAdContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  bannerCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4
  },
  adBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8
  },
  cardAdTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2
  },
  cardAdSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2
  }
});
