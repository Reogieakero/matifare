import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Brand, Gradients, Radii, Shadows } from '@/constants/theme';

const palette = {
  stage: '#F3F8FF',
  card: '#FFFFFF',
  line: 'rgba(15,23,42,0.08)',
  text: '#0F172A',
  secondary: '#475569',
  muted: '#7A889E',
  blue: Brand.blue,
  blueSoft: 'rgba(37,99,235,0.10)',
  yellow: Brand.yellow,
  yellowInk: Brand.yellowInk,
};

type StageProps = {
  height: number;
  children: ReactNode;
};

function Stage({ height, children }: StageProps) {
  return (
    <View style={[styles.stage, { height }]}>
      <View style={[styles.stageGlow, { backgroundImage: Gradients.blueGlow }]} />
      <View style={styles.stageRing} />
      <View style={styles.stageDotRow}>
        <View style={[styles.stageDot, { backgroundColor: Brand.blue }]} />
        <View style={[styles.stageDot, { backgroundColor: Brand.yellow }]} />
        <View style={[styles.stageDot, { backgroundColor: 'rgba(15,23,42,0.16)' }]} />
      </View>
      {children}
    </View>
  );
}

function MascotPreview() {
  return (
    <>
      <View style={styles.mascotHalo} />
      <Image
        source={require('@/assets/images/mascot.png')}
        style={styles.mascotImage}
        contentFit="contain"
        accessibilityLabel="Tripede tricycle mascot"
        accessibilityIgnoresInvertColors
      />

      <View style={styles.floatingBadge}>
        <View style={styles.floatingIcon}>
          <Icon name="check" size={12} color={palette.blue} weight="bold" />
        </View>
        <AppText style={styles.floatingText}>Fare locked</AppText>
      </View>

      <View style={styles.mascotFareCard}>
        <View style={{ gap: 1 }}>
          <AppText style={styles.mascotFareLabel}>ESTIMATED FARE</AppText>
          <AppText style={styles.mascotFareValue}>$12.40</AppText>
        </View>
        <View style={styles.walletBadge}>
          <Icon name="wallet" size={18} color={palette.blue} />
        </View>
      </View>
    </>
  );
}

const options = [
  { label: 'Car', sub: '3 min away', price: '$8.40', icon: 'car' as const },
  { label: 'Bike', sub: '1 min away', price: '$4.20', icon: 'bike' as const },
  { label: 'XL', sub: '5 min away', price: '$12.60', icon: 'van' as const },
];

function ComparePreview() {
  return (
    <>
      <View style={styles.bestValue}>
        <Icon name="sparkles" size={12} color={Brand.yellowDeep} />
        <AppText style={styles.bestValueText}>Best value</AppText>
      </View>

      <View style={styles.optionStack}>
        {options.map((option, index) => {
          const selected = index === 0;
          return (
            <View
              key={option.label}
              style={[
                styles.optionCard,
                selected && styles.optionCardSelected,
                index > 0 && { opacity: index === 1 ? 0.92 : 0.76, transform: [{ scale: 1 - index * 0.025 }] },
              ]}>
              <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                <Icon name={option.icon} size={20} color={selected ? '#FFFFFF' : palette.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.optionLabel}>{option.label}</AppText>
                <AppText style={styles.optionSub}>{option.sub}</AppText>
              </View>
              <AppText style={styles.optionPrice}>{option.price}</AppText>
              <View style={[styles.check, selected && styles.checkSelected]}>
                {selected ? <Icon name="check" size={11} color="#FFFFFF" weight="bold" /> : null}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

const confidenceItems = [
  { icon: 'wifi-off' as const, label: 'Offline\nready' },
  { icon: 'wallet' as const, label: 'No hidden\ncharges' },
  { icon: 'clock' as const, label: 'Trips\nsaved' },
];

function ConfidencePreview() {
  return (
    <>
      <View style={styles.shieldOuter}>
        <View style={styles.shieldMid}>
          <View style={styles.shieldCore}>
            <Icon name="shield" size={54} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View style={styles.confidenceGrid}>
        {confidenceItems.map((item) => (
          <View key={item.label} style={styles.confidenceTile}>
            <View style={styles.confidenceIcon}>
              <Icon name={item.icon} size={17} color={palette.blue} />
            </View>
            <AppText style={styles.confidenceLabel}>{item.label}</AppText>
          </View>
        ))}
      </View>
    </>
  );
}

export type SlideArtVariant = 'mascot' | 'compare' | 'confidence';

type SlideArtProps = {
  variant: SlideArtVariant;
  height: number;
};

export function SlideArt({ variant, height }: SlideArtProps) {
  return (
    <Stage height={height}>
      {variant === 'mascot' ? <MascotPreview /> : null}
      {variant === 'compare' ? <ComparePreview /> : null}
      {variant === 'confidence' ? <ConfidencePreview /> : null}
    </Stage>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    borderRadius: Radii.xxl,
    backgroundColor: palette.stage,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Shadows.card ?? {}),
  },
  stageGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 360,
    top: -190,
    right: -120,
    transform: [{ rotate: '-12deg' }],
  },
  stageRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.12)',
    bottom: -170,
    left: -90,
  },
  stageDotRow: {
    position: 'absolute',
    top: 18,
    left: 20,
    flexDirection: 'row',
    gap: 6,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floatingBadge: {
    position: 'absolute',
    top: 26,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.28)',
    transform: [{ rotate: '5deg' }],
    zIndex: 2,
    ...(Shadows.card ?? {}),
  },
  floatingIcon: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingText: {
    color: palette.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  mascotHalo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37,99,235,0.06)',
    transform: [{ rotate: '-14deg' }],
  },
  mascotImage: {
    width: '94%',
    height: '84%',
  },
  mascotFareCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: palette.line,
    ...(Shadows.card ?? {}),
  },
  mascotFareLabel: {
    color: palette.muted,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mascotFareValue: {
    color: palette.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  walletBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestValue: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,198,26,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(229,169,0,0.40)',
    transform: [{ rotate: '4deg' }],
    zIndex: 2,
  },
  bestValueText: {
    color: palette.yellowInk,
    fontSize: 10.5,
    fontWeight: '700',
  },
  optionStack: {
    width: 284,
    gap: 8,
    paddingTop: 22,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    ...(Shadows.card ?? {}),
  },
  optionCardSelected: {
    backgroundColor: '#F2F7FF',
    borderColor: 'rgba(37,99,235,0.45)',
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: palette.blue,
  },
  optionLabel: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
  },
  optionSub: {
    color: palette.muted,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '500',
  },
  optionPrice: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: palette.blue,
    borderColor: palette.blue,
  },
  shieldOuter: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  shieldMid: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.blueSoft,
  },
  shieldCore: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: Gradients.brand,
    ...(Shadows.glow ?? {}),
  },
  confidenceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  confidenceTile: {
    width: 86,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    gap: 7,
    ...(Shadows.card ?? {}),
  },
  confidenceIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceLabel: {
    color: palette.secondary,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
