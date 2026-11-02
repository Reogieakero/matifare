import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Gradients, Radii, Shadows, Spacing } from '@/constants/theme';

type InsightBannerProps = {
  eyebrow: string;
  value: string;
  caption: string;
  children?: ReactNode;
};

/** Gradient hero banner shared by the analytics detail screens. */
export function InsightBanner({ eyebrow, value, caption, children }: InsightBannerProps) {
  return (
    <View style={[styles.banner, Shadows.card ?? {}]}>
      <View pointerEvents="none" style={styles.glowLarge} />
      <View pointerEvents="none" style={styles.glowSmall} />

      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <View style={styles.dot} />
          <AppText style={styles.eyebrow}>{eyebrow}</AppText>
        </View>

        <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
          {value}
        </AppText>

        <AppText style={styles.caption} numberOfLines={2}>
          {caption}
        </AppText>

        {children}
      </View>

      <Image
        source={require('@/assets/images/Cheerful Calculator Mascot with Cap.png')}
        style={styles.mascot}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 152,
    borderRadius: Radii.xxl,
    padding: Spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundImage: Gradients.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  glowLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -132,
    left: -76,
  },
  glowSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -74,
    right: 96,
  },
  copy: {
    width: '62%',
    gap: 2,
    zIndex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.9,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  caption: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  mascot: {
    position: 'absolute',
    right: -10,
    bottom: -8,
    width: 142,
    height: 136,
  },
});
