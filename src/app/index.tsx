import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppText } from '@/components/ui/app-text';
import { AppConfig } from '@/constants/app';
import { Radii, Spacing } from '@/constants/theme';
import { useColorMode, useTheme } from '@/hooks/use-theme';
import { hasCompletedOnboarding } from '@/lib/onboarding';

const MIN_SPLASH_TIME = 1900;
const EXIT_TIME = 380;

type Destination = '/onboarding' | '/home';

export default function LaunchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorMode = useColorMode();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const mascotWidth = Math.min(width - 40, 348);

  const mascotOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(0.92);
  const floatY = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkOffset = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const loaderProgress = useSharedValue(0);
  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);

  const destination = useRef<Destination>('/onboarding');

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Already hidden, e.g. after a fast refresh.
    });

    mascotOpacity.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.quad) });
    mascotScale.value = withSpring(1, { damping: 15, stiffness: 110, mass: 0.8 });
    floatY.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    wordmarkOpacity.value = withDelay(260, withTiming(1, { duration: 480 }));
    wordmarkOffset.value = withDelay(260, withSpring(0, { damping: 16, stiffness: 130 }));
    taglineOpacity.value = withDelay(480, withTiming(1, { duration: 480 }));
    loaderProgress.value = withDelay(
      520,
      withRepeat(withTiming(1, { duration: 1150, easing: Easing.inOut(Easing.cubic) }), -1, false),
    );

    const check = hasCompletedOnboarding().catch(() => false);
    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    const timer = setTimeout(async () => {
      const completed = await check;
      if (cancelled) return;

      destination.current = completed ? '/home' : '/onboarding';
      screenOpacity.value = withTiming(0, { duration: EXIT_TIME, easing: Easing.in(Easing.quad) });
      screenScale.value = withTiming(1.035, { duration: EXIT_TIME, easing: Easing.in(Easing.quad) });

      exitTimer = setTimeout(() => {
        if (!cancelled) {
          router.replace(destination.current);
        }
      }, EXIT_TIME - 40);
    }, MIN_SPLASH_TIME);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [
    floatY,
    loaderProgress,
    mascotOpacity,
    mascotScale,
    router,
    screenOpacity,
    screenScale,
    taglineOpacity,
    wordmarkOffset,
    wordmarkOpacity,
  ]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ translateY: floatY.value }, { scale: mascotScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkOffset.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    width: 10 + loaderProgress.value * 128,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
      <AmbientBackground color={theme.background} />
      <Animated.View
        style={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl },
          screenStyle,
        ]}>
        <View style={styles.hero}>
          <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
            <AppText style={styles.wordmark}>
              <Text style={{ color: theme.text }}>Trip</Text>
              <Text style={{ color: theme.primary }}>ede</Text>
            </AppText>
          </Animated.View>

          <Animated.View
            style={[
              styles.mascotWrap,
              { width: mascotWidth, height: mascotWidth / 1.5 },
              mascotStyle,
            ]}>
            <View style={[styles.halo, { backgroundColor: theme.primarySoft }]} />
            <Image
              source={require('@/assets/images/mascot.png')}
              style={styles.mascot}
              contentFit="contain"
              accessibilityLabel="Tripede tricycle mascot"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>

          <Animated.View style={[styles.taglineWrap, taglineStyle, styles.aboveGlow]}>
            <AppText
              variant="body"
              align="center"
              style={[styles.tagline, { color: theme.textSecondary }]}>
              {AppConfig.tagline}
            </AppText>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.loaderTrack, { backgroundColor: theme.primarySoft }]}>
            <Animated.View
              style={[
                styles.loaderBar,
                { backgroundColor: theme.primary, shadowColor: theme.primary },
                loaderStyle,
              ]}
            />
          </View>
          <AppText variant="caption" tone="muted" style={styles.loaderLabel}>
            PREPARING YOUR FARES
          </AppText>
        </View>

        <AppText variant="caption" tone="muted" style={styles.version}>
          V{AppConfig.version}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  wordmark: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  wordmarkWrap: {
    zIndex: 2,
  },
  aboveGlow: {
    zIndex: 2,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  halo: {
    position: 'absolute',
    width: '112%',
    aspectRatio: 1,
    borderRadius: 999,
    transform: [{ rotate: '-14deg' }],
  },
  mascot: {
    width: '100%',
    height: '100%',
  },
  taglineWrap: {
    maxWidth: 280,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  loaderTrack: {
    width: 138,
    height: 3,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  loaderBar: {
    height: 3,
    borderRadius: Radii.pill,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  loaderLabel: {
    fontSize: 9.5,
    letterSpacing: 2,
  },
  version: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.md,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1.4,
  },
});
