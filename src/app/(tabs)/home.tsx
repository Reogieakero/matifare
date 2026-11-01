import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { FareMatrixModal } from '@/components/fare-matrix-modal';
import { TabBarClearance } from '@/components/navigation/glass-tab-bar';
import { OfflineMapCard } from '@/components/offline-map-card';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { StorageKeys } from '@/constants/app';
import { FareMatrix, type FareTier } from '@/constants/fare-matrix';
import { Gradients, MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getStoredValue, setStoredValue } from '@/lib/storage';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(FareMatrix[0].id);

  useEffect(() => {
    let active = true;

    getStoredValue(StorageKeys.fareTier).then((value) => {
      if (!active || !value) return;

      const tierId = Number(value);
      if (FareMatrix.some((tier) => tier.id === tierId)) {
        setSelectedTierId(tierId);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const selectTier = (tier: FareTier) => {
    setSelectedTierId(tier.id);
    void setStoredValue(StorageKeys.fareTier, String(tier.id));
  };

  const selectedTier =
    FareMatrix.find((tier) => tier.id === selectedTierId) ?? FareMatrix[0];

  const startCommute = () => {
    router.push('/map');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style="dark" />
      <AmbientBackground color={theme.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + TabBarClearance,
          },
        ]}>
        <View style={styles.topBar}>
          <BrandLogo size={30} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open fare matrix"
            onPress={() => setMatrixOpen(true)}
            style={({ pressed }) => [
              styles.matrixPill,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
              pressed && styles.pressed,
            ]}>
            <Icon name="wallet" size={13} color={theme.primary} />
            <AppText variant="caption" tone="secondary" style={styles.matrixPillText}>
              FARE MATRIX
            </AppText>
          </Pressable>
        </View>

        <View style={[styles.banner, Shadows.card ?? {}]}>
          <View pointerEvents="none" style={styles.bannerGlowLarge} />
          <View pointerEvents="none" style={styles.bannerGlowSmall} />

          <View style={styles.bannerCopy}>
            <View style={styles.bannerGreetingRow}>
              <View style={styles.bannerDot} />
              <AppText style={styles.bannerEyebrow}>{getGreeting().toUpperCase()}</AppText>
            </View>

            <AppText style={styles.bannerTitle}>Ready for a ride?</AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Commute now"
              accessibilityHint="Opens the map and commute meter"
              onPress={startCommute}
              style={({ pressed }) => [styles.rideButton, pressed && styles.ridePressed]}>
              <AppText style={styles.rideButtonText}>Commute now</AppText>
              <View style={styles.rideButtonArrow}>
                <Icon name="arrow-right" size={11} color="#FFFFFF" weight="bold" />
              </View>
            </Pressable>
          </View>

          <Image
            source={require('@/assets/images/Cheerful Calculator Mascot with Cap.png')}
            style={styles.bannerMascot}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Current pricing
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.sectionHint}>
            FROM THE FARE MATRIX
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Active fuel tier ${selectedTier.tier}, ${selectedTier.fuelPrice} per liter. Open fare matrix`}
          onPress={() => setMatrixOpen(true)}
          style={({ pressed }) => [
            styles.tierCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
            pressed && styles.pressed,
          ]}>
          <View style={styles.tierTopRow}>
            <AppText variant="caption" tone="muted" style={styles.tierEyebrow}>
              ACTIVE FUEL TIER
            </AppText>

            <View style={styles.tierTopSpacer} />

            <AppText variant="caption" style={[styles.changeText, { color: theme.primary }]}>
              CHANGE
            </AppText>
            <Icon name="chevron-right" size={12} color={theme.primary} weight="semibold" />
          </View>

          <View style={styles.tierHeadline}>
            <View style={styles.tierHeadlineCopy}>
              <AppText variant="display" style={styles.tierName}>
                {selectedTier.tier}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.tierCaption}>
                MATCHED TO THE CURRENT FUEL PRICE
              </AppText>
            </View>

            <View style={[styles.pricePill, { backgroundColor: theme.primarySoft }]}>
              <AppText variant="caption" style={[styles.pricePillLabel, { color: theme.primary }]}>
                PER LITER
              </AppText>
              <AppText variant="label" style={[styles.pricePillValue, { color: theme.primary }]}>
                {selectedTier.fuelPrice}
              </AppText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statRow}>
            <View style={[styles.statTile, { backgroundColor: theme.backgroundElement }]}>
              <AppText variant="caption" tone="muted" style={styles.statLabel}>
                BASE FARE
              </AppText>
              <AppText variant="subtitle" style={styles.statValue}>
                {selectedTier.baseFare}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.statNote}>
                FIRST 3.0 KM
              </AppText>
            </View>

            <View style={[styles.statTile, { backgroundColor: theme.backgroundElement }]}>
              <AppText variant="caption" tone="muted" style={styles.statLabel}>
                ADDED KM
              </AppText>
              <AppText variant="subtitle" style={styles.statValue}>
                {selectedTier.perKm}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.statNote}>
                PER EXTRA KM
              </AppText>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            You are here
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.sectionHint}>
            OFFLINE · MATI CITY
          </AppText>
        </View>

        <OfflineMapCard />
      </ScrollView>

      <FareMatrixModal
        visible={matrixOpen}
        onClose={() => setMatrixOpen(false)}
        selectedTierId={selectedTierId}
        onSelectTier={selectTier}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matrixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  matrixPillText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.995 }],
  },
  banner: {
    minHeight: 158,
    borderRadius: Radii.xxl,
    padding: Spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundImage: Gradients.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  bannerGlowLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -132,
    left: -76,
  },
  bannerGlowSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -74,
    right: 96,
  },
  bannerCopy: {
    width: '56%',
    gap: Spacing.xs,
    zIndex: 1,
  },
  bannerGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  rideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    height: 40,
    paddingLeft: Spacing.lg,
    paddingRight: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
  },
  ridePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  rideButtonText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  rideButtonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
  },
  bannerMascot: {
    position: 'absolute',
    right: -10,
    bottom: -8,
    width: 162,
    height: 156,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 8,
    letterSpacing: 1,
  },
  tierCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  tierAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierEyebrow: {
    fontSize: 8.5,
    letterSpacing: 1.1,
  },
  tierTopSpacer: {
    flex: 1,
  },
  changeText: {
    fontSize: 8.5,
    letterSpacing: 1,
  },
  tierHeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tierHeadlineCopy: {
    flex: 1,
    gap: 2,
  },
  tierName: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  tierCaption: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  pricePill: {
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
  },
  pricePillLabel: {
    fontSize: 8,
    letterSpacing: 1.1,
  },
  pricePillValue: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statTile: {
    flex: 1,
    gap: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  statNote: {
    fontSize: 8,
    letterSpacing: 0.7,
  },
});
