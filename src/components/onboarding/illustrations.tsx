import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Brand, Gradients, Radii, Shadows } from '@/constants/theme';
import { OfflineMap, type TrackPoint } from '@/lib/offline-map';

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

const previewCenter = OfflineMap.center;

/** Static route and pin so the onboarding map looks like a live commute. */
const previewTrack: TrackPoint[] = [
  { latitude: previewCenter.lat - 0.004, longitude: previewCenter.lng - 0.004 },
  { latitude: previewCenter.lat - 0.0026, longitude: previewCenter.lng - 0.0021 },
  { latitude: previewCenter.lat - 0.001, longitude: previewCenter.lng - 0.0006 },
  { latitude: previewCenter.lat + 0.0004, longitude: previewCenter.lng + 0.001 },
  { latitude: previewCenter.lat + 0.002, longitude: previewCenter.lng + 0.0025 },
];

const previewLocation = {
  ...previewTrack[previewTrack.length - 1],
  accuracy: 9,
  speed: 4,
  timestamp: 0,
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

function FarePreview() {
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
        <AppText style={styles.floatingText}>Estimate ready</AppText>
      </View>

      <View style={styles.mascotFareCard}>
        <View style={{ gap: 1 }}>
          <AppText style={styles.mascotFareLabel}>TRICYCLE FARE</AppText>
          <AppText style={styles.mascotFareValue}>₱25.00</AppText>
        </View>
        <View style={styles.walletBadge}>
          <Icon name="wallet" size={18} color={palette.blue} />
        </View>
      </View>
    </>
  );
}

function MapPreview() {
  return (
    <View style={styles.mapLayout}>
      <View style={styles.mapFrame}>
        <OfflineMapCanvas
          height={170}
          location={previewLocation}
          track={previewTrack}
          status="ready"
          canAskAgain={false}
          error={null}
          onRetry={() => {}}
          onOpenSettings={() => {}}
          initialSpanMeters={3200}
          showChip={false}
          showAttribution={false}
          showLocate={false}
          interactive={false}
          rounded={false}
        />

        <View pointerEvents="none" style={styles.mapBadgeRow}>
          <View style={styles.mapBadge}>
            <Icon name="locate" size={9} color={palette.blue} />
            <AppText style={styles.mapBadgeText}>LIVE GPS</AppText>
          </View>
          <View style={[styles.mapBadge, styles.mapBadgeOffline]}>
            <Icon name="wifi-off" size={9} color={palette.yellowInk} />
            <AppText style={[styles.mapBadgeText, { color: palette.yellowInk }]}>
              OFFLINE
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.meterCard}>
        <View style={styles.meterIcon}>
          <Icon name="route" size={16} color={palette.blue} />
        </View>
        <View style={styles.meterCopy}>
          <AppText style={styles.meterLabel}>COMMUTE METER</AppText>
          <AppText style={styles.meterValue}>2.4 km · ₱27.00</AppText>
        </View>
        <View style={styles.meterPill}>
          <View style={styles.meterDot} />
          <AppText style={styles.meterPillText}>RECORDING</AppText>
        </View>
      </View>
    </View>
  );
}

const featureItems = [
  { icon: 'wifi-off' as const, title: 'Offline map', note: 'No signal needed' },
  { icon: 'wallet' as const, title: 'Fare matrix', note: 'Fuel-tier pricing' },
  { icon: 'trips' as const, title: 'Saved trips', note: 'History on device' },
  { icon: 'analytics' as const, title: 'Insights', note: 'Spend and savings' },
];

function FeaturesPreview() {
  return (
    <View style={styles.featureLayout}>
      <View style={styles.featureBadge}>
        <Icon name="lock" size={10} color={palette.blue} />
        <AppText style={styles.featureBadgeText}>STORED ON THIS PHONE</AppText>
      </View>

      <View style={styles.featureGrid}>
        {featureItems.map((item) => (
          <View key={item.title} style={styles.featureTile}>
            <View style={styles.featureIcon}>
              <Icon name={item.icon} size={18} color={palette.blue} />
            </View>
            <View style={styles.featureCopy}>
              <AppText style={styles.featureTitle}>{item.title}</AppText>
              <AppText style={styles.featureNote}>{item.note}</AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export type SlideArtVariant = 'fare' | 'map' | 'features';

type SlideArtProps = {
  variant: SlideArtVariant;
  height: number;
};

export function SlideArt({ variant, height }: SlideArtProps) {
  return (
    <Stage height={height}>
      {variant === 'fare' ? <FarePreview /> : null}
      {variant === 'map' ? <MapPreview /> : null}
      {variant === 'features' ? <FeaturesPreview /> : null}
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
  mapLayout: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  mapFrame: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.10)',
    ...(Shadows.card ?? {}),
  },
  mapBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  mapBadgeOffline: {
    backgroundColor: 'rgba(255,198,26,0.92)',
  },
  mapBadgeText: {
    color: palette.blue,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  meterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    ...(Shadows.card ?? {}),
  },
  meterIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meterCopy: {
    flex: 1,
    gap: 1,
  },
  meterLabel: {
    color: palette.muted,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
  meterValue: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  meterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(37,99,235,0.10)',
  },
  meterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.blue,
  },
  meterPillText: {
    color: palette.blue,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  featureLayout: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: palette.blueSoft,
  },
  featureBadgeText: {
    color: palette.blue,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: Radii.lg,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    ...(Shadows.card ?? {}),
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    gap: 1,
  },
  featureTitle: {
    color: palette.text,
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: '700',
  },
  featureNote: {
    color: palette.muted,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '500',
  },
});
