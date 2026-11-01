import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { SlideArt, type SlideArtVariant } from '@/components/onboarding/illustrations';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Brand, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { completeOnboarding } from '@/lib/onboarding';

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  art: SlideArtVariant;
};

const slides: Slide[] = [
  {
    key: 'upfront',
    eyebrow: '01 · UPFRONT PRICING',
    title: 'Know your fare before you ride.',
    description:
      'Get a clear, itemised estimate before you hop in. What you see is what you pay — no surprises when you arrive.',
    art: 'mascot',
  },
  {
    key: 'compare',
    eyebrow: '02 · SMARTER CHOICES',
    title: 'Compare every option in seconds.',
    description:
      'Bike, car or XL — see the fare and pickup time side by side, then choose the ride that fits your day.',
    art: 'compare',
  },
  {
    key: 'confidence',
    eyebrow: '03 · BUILT FOR REAL LIFE',
    title: 'Ride with confidence, every time.',
    description:
      'Estimates that work offline, saved trips for quick repeats, and transparent pricing you can trust.',
    art: 'confidence',
  },
];

type SlidePageProps = {
  slide: Slide;
  width: number;
  height: number;
  stageHeight: number;
  active: boolean;
};

function SlidePage({ slide, width, height, stageHeight, active }: SlidePageProps) {
  const opacity = useSharedValue(active ? 1 : 0.35);
  const translateY = useSharedValue(active ? 0 : 16);

  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0.35, { duration: 320 });
    translateY.value = withSpring(active ? 0 : 16, { damping: 18, stiffness: 140 });
  }, [active, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.slide, { width, height: height || undefined }, animatedStyle]}>
      <SlideArt variant={slide.art} height={stageHeight} />
      <View style={styles.copy}>
        <AppText variant="caption" tone="primary" style={styles.eyebrow}>
          {slide.eyebrow}
        </AppText>
        <AppText variant="display" style={styles.title}>
          {slide.title}
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.description}>
          {slide.description}
        </AppText>
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [pagerHeight, setPagerHeight] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const pageWidth = Math.min(width, MaxContentWidth);
  const stageHeight = Math.min(332, Math.max(238, height * 0.36));
  const isLast = index === slides.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (nextIndex !== index && nextIndex >= 0 && nextIndex < slides.length) {
      setIndex(nextIndex);
    }
  };

  const scrollToIndex = (nextIndex: number) => {
    listRef.current?.scrollToOffset({ offset: nextIndex * pageWidth, animated: true });
    setIndex(nextIndex);
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    await completeOnboarding();
    router.replace('/home');
  };

  const handlePrimaryPress = () => {
    if (isLast) {
      finish();
    } else {
      scrollToIndex(index + 1);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <AmbientBackground color={Brand.white} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BrandLogo size={26} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={finish}
            hitSlop={12}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
            <AppText variant="bodySmall" tone="muted">
              Skip
            </AppText>
            <Icon name="arrow-up-right" size={14} color="rgba(122,136,158,0.9)" />
          </Pressable>
        </View>

        <Animated.View
          style={styles.pagerWrap}
          onLayout={(event) => setPagerHeight(event.nativeEvent.layout.height)}
          entering={FadeIn.duration(450)}>
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(item) => item.key}
            style={{ width: pageWidth }}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            snapToInterval={pageWidth}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            contentContainerStyle={styles.pagerContent}
            getItemLayout={(_, itemIndex) => ({
              length: pageWidth,
              offset: pageWidth * itemIndex,
              index: itemIndex,
            })}
            renderItem={({ item, index: itemIndex }) => (
              <SlidePage
                slide={item}
                width={pageWidth}
                height={pagerHeight}
                stageHeight={stageHeight}
                active={itemIndex === index}
              />
            )}
          />
        </Animated.View>

        <View style={[styles.footer, { width: pageWidth }]}>
          <View style={styles.footerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
              onPress={() => scrollToIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                index === 0 && styles.backButtonHidden,
                pressed && styles.pressed,
              ]}>
              <Icon name="chevron-left" size={18} color={Brand.blue} />
            </Pressable>

            <View style={styles.dots}>
              {slides.map((slide, dotIndex) => (
                <View
                  key={slide.key}
                  style={[styles.dot, dotIndex === index && styles.dotActive]}
                />
              ))}
            </View>

            <View style={styles.footerSpacer} />
          </View>

          <AppButton
            label={isLast ? 'Get started' : 'Continue'}
            onPress={handlePrimaryPress}
            icon="arrow-right"
            loading={finishing}
          />

          <AppText variant="caption" tone="muted" align="center" style={styles.legal}>
            BY CONTINUING YOU AGREE TO OUR TERMS & PRIVACY POLICY
          </AppText>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.white,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  pagerWrap: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  pagerContent: {
    flexGrow: 1,
  },
  copy: {
    gap: Spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    marginBottom: 2,
    color: Brand.blue,
  },
  title: {
    fontSize: 30,
    lineHeight: 35,
    color: Brand.ink,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#475569',
  },
  footer: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F6FF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(15,23,42,0.16)',
  },
  dotActive: {
    width: 24,
    backgroundColor: Brand.yellow,
  },
  footerSpacer: {
    width: 38,
  },
  legal: {
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: 'rgba(122,136,158,0.8)',
  },
});
