import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Brand, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STAGE = 136;
const BADGE = 78;

type ParticleConfig = {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
};

const PARTICLE_COLORS = [Brand.blue, Brand.yellow, Brand.blueBright, Brand.yellowDeep];

// A ring of tiny sparks replaces confetti: each one shoots out, shrinks and
// fades, so the celebration stays lightweight and fully offline.
const PARTICLES: ParticleConfig[] = Array.from({ length: 14 }, (_, index) => ({
  angle: (index / 14) * Math.PI * 2 + 0.18,
  distance: index % 2 === 0 ? 58 : 46,
  size: index % 3 === 0 ? 6 : 4.5,
  color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
  delay: 90 + (index % 5) * 24,
}));

function Particle({ config }: { config: ParticleConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
  }, [config.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;

    return {
      opacity: p <= 0 ? 0 : 1 - p,
      transform: [
        { translateX: Math.cos(config.angle) * config.distance * p },
        { translateY: Math.sin(config.angle) * config.distance * p },
        { scale: 0.45 + p * 0.75 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          left: STAGE / 2 - config.size / 2,
          top: STAGE / 2 - config.size / 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

function Ring({ delay, color }: { delay: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 0.45 * (1 - progress.value)),
    transform: [{ scale: 0.7 + progress.value * 1.15 }],
  }));

  return (
    <Animated.View style={[styles.ring, { borderColor: color }, animatedStyle]} />
  );
}

type TripSavedSuccessProps = {
  /** Fare/distance line shown under the success message. */
  summary?: string;
};

export function TripSavedSuccess({ summary }: TripSavedSuccessProps) {
  const theme = useTheme();
  const badgeScale = useSharedValue(0.5);
  const badgeOpacity = useSharedValue(0);

  useEffect(() => {
    badgeOpacity.value = withTiming(1, { duration: 180 });
    badgeScale.value = withSpring(1, { damping: 13, stiffness: 180, mass: 0.8 });
  }, [badgeOpacity, badgeScale]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.root}>
      <View style={styles.stage}>
        <Ring delay={0} color={theme.primary} />
        <Ring delay={170} color={theme.accent} />

        {PARTICLES.map((config, index) => (
          <Particle key={index} config={config} />
        ))}

        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: theme.primary, ...(Shadows.glow ?? {}) },
            badgeStyle,
          ]}>
          <Icon name="check" size={36} color={theme.onPrimary} weight="bold" />
        </Animated.View>
      </View>

      <AppText variant="subtitle" align="center">
        Trip saved!
      </AppText>
      <AppText variant="bodySmall" tone="secondary" align="center" style={styles.summary}>
        {summary ?? 'Added to your trip history.'}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 2,
    left: (STAGE - BADGE) / 2,
    top: (STAGE - BADGE) / 2,
  },
  particle: {
    position: 'absolute',
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    letterSpacing: 0,
  },
});
