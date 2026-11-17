import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TurboModuleRegistry,
  View,
  ViewStyle,
} from 'react-native';

interface AdBannerProps {
  variant?: 'sticky' | 'card';
  style?: ViewStyle;
}

// Google Official Test Banner IDs (Safe fallback when native module is not loaded)
const OFFICIAL_TEST_BANNER_ID = Platform.select({
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
  default: 'ca-app-pub-3940256099942544/6300978111',
});

let isAdMobConfigured = false;

/**
 * Check whether the native Google Mobile Ads module is actually compiled
 * into the current binary.
 * In standard Expo Go or Web, this returns FALSE so we NEVER execute
 * `TurboModuleRegistry.getEnforcing('RNGoogleMobileAdsModule')`.
 */
export function isAdMobSupported(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const turbo =
      typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry.get
        ? TurboModuleRegistry.get('RNGoogleMobileAdsModule')
        : null;
    const legacy =
      typeof NativeModules !== 'undefined'
        ? NativeModules.RNGoogleMobileAdsModule
        : null;
    return turbo != null || legacy != null;
  } catch {
    return false;
  }
}

/**
 * Configure AdMob globally with COPPA / Kids Category compliance:
 * - MaxAdContentRating.G: Only G-rated (General audience) ads
 * - tagForChildDirectedTreatment: true (COPPA compliant)
 * - tagForUnderAgeOfConsent: true (GDPR-K compliant)
 */
export function configureAdMob() {
  if (isAdMobConfigured || !isAdMobSupported()) return;

  try {
    // Dynamic require so Expo Go never evaluates the native module
    const googleAds = require('react-native-google-mobile-ads');
    const mobileAds = googleAds.default || googleAds;
    const MaxAdContentRating = googleAds.MaxAdContentRating;

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
      .catch((err: any) => {
        console.warn('AdMob configuration warning:', err);
      });
  } catch (err) {
    console.log('AdMob native module could not be initialized');
  }
}

/**
 * Google AdMob Banner Component
 * - In Development Build / Standalone binary (where native module exists):
 *   Loads and renders the real live Google test banner (`TestIds.BANNER`).
 * - In Expo Go or Web:
 *   Safely falls back to a preview banner placeholder so the app NEVER crashes.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ variant = 'card', style }) => {
  const [adError, setAdError] = useState<string | null>(null);
  const supported = isAdMobSupported();

  useEffect(() => {
    if (supported) {
      configureAdMob();
    }
  }, [supported]);

  // In Expo Go or Web or if native module is not compiled into binary:
  // Render clean preview card so developers and testers can see where ads live without crashing
  if (!supported) {
    return (
      <View style={[variant === 'sticky' ? styles.stickyAdBar : styles.cardAdContainer, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>
            {Platform.OS === 'web' ? 'GOOGLE TEST AD (WEB)' : 'GOOGLE TEST AD (EXPO GO)'}
          </Text>
        </View>
        <Text style={styles.cardAdTitle}>Google AdMob Test Banner</Text>
        <Text style={styles.cardAdSub}>
          Unit ID: {OFFICIAL_TEST_BANNER_ID} (320x50)
        </Text>
      </View>
    );
  }

  // If live ad failed to load on native build:
  if (adError) {
    if (!__DEV__) return null;
    return (
      <View style={[variant === 'sticky' ? styles.stickyAdBar : styles.cardAdContainer, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>TEST AD (OFFLINE / FAILED)</Text>
        </View>
        <Text style={styles.cardAdTitle}>Google AdMob Test Banner Slot</Text>
        <Text style={styles.cardAdSub}>{adError}</Text>
      </View>
    );
  }

  // Live Native Banner Ad (Development Build / Standalone IPA or APK)
  try {
    const googleAds = require('react-native-google-mobile-ads');
    const BannerAd = googleAds.BannerAd;
    const BannerAdSize = googleAds.BannerAdSize;
    const TestIds = googleAds.TestIds;

    const unitId = TestIds?.BANNER || OFFICIAL_TEST_BANNER_ID;

    const bannerElement = (
      <View style={styles.bannerCenterWrap}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdError(null);
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('AdMob test ad load error:', error);
            setAdError(error?.message || 'Failed to load test ad');
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
          {bannerElement}
        </View>
      );
    }

    return (
      <View style={[styles.cardAdContainer, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>GOOGLE TEST AD</Text>
        </View>
        {bannerElement}
      </View>
    );
  } catch (err: any) {
    return (
      <View style={[variant === 'sticky' ? styles.stickyAdBar : styles.cardAdContainer, style]}>
        <View style={styles.adBadgePill}>
          <Text style={styles.adBadgeText}>GOOGLE TEST AD</Text>
        </View>
        <Text style={styles.cardAdTitle}>Google AdMob Test Banner</Text>
        <Text style={styles.cardAdSub}>Unit ID: {OFFICIAL_TEST_BANNER_ID}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  stickyAdBar: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 10,
  },
  bannerCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  adBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  cardAdTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2,
  },
  cardAdSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
});
