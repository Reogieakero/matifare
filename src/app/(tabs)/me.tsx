import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { FareMatrixModal } from '@/components/fare-matrix-modal';
import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { TabBarClearance } from '@/components/navigation/glass-tab-bar';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppConfig } from '@/constants/app';
import type { MapStyleId } from '@/constants/map-style';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useMapPreference } from '@/hooks/use-map-preference';
import {
  useColorMode,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@/hooks/use-theme';
import { useTripPreferences } from '@/hooks/use-trip-session';
import { clearSavedTrips, getSavedTripsSummary } from '@/lib/trips';

const themeOptions: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'system', label: 'System', icon: 'device' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

const mapStyleOptions: {
  value: MapStyleId;
  label: string;
  icon: IconName;
  note: string;
}[] = [
  {
    value: 'standard',
    label: 'Standard',
    icon: 'route',
    note: 'Balanced colours for everyday reading',
  },
  { value: 'dark', label: 'Dark', icon: 'moon', note: 'Dim map colours for night rides' },
  {
    value: 'contrast',
    label: 'Contrast',
    icon: 'sparkles',
    note: 'Bold outlines and brighter roads',
  },
];

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorMode = useColorMode();
  const insets = useSafeAreaInsets();
  const { preference, setPreference } = useThemePreference();
  const { mapStyle, setMapStyle } = useMapPreference();
  const selectedMapStyle = mapStyleOptions.find((option) => option.value === mapStyle);

  const {
    tier: selectedTier,
    selectedTierId: tierId,
    selectTier,
    discountApplied: discount,
    toggleDiscount,
  } = useTripPreferences();

  const [storage, setStorage] = useState({ count: 0, bytes: 0 });
  const [storageReady, setStorageReady] = useState(false);
  const [tierSheetOpen, setTierSheetOpen] = useState(false);
  const [clearSheetOpen, setClearSheetOpen] = useState(false);
  const [clearingTrips, setClearingTrips] = useState(false);

  const refreshStorage = useCallback(async () => {
    const summary = await getSavedTripsSummary();
    setStorage(summary);
    setStorageReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getSavedTripsSummary().then((summary) => {
        if (!active) return;
        setStorage(summary);
        setStorageReady(true);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const confirmClearTrips = () => {
    setClearSheetOpen(true);
  };

  const clearTrips = async () => {
    setClearingTrips(true);

    try {
      await clearSavedTrips();
      await refreshStorage();
      setClearSheetOpen(false);
    } finally {
      setClearingTrips(false);
    }
  };

  const dangerSoft =
    colorMode === 'dark' ? 'rgba(255,99,105,0.14)' : 'rgba(217,45,32,0.09)';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
      <AmbientBackground color={theme.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + TabBarClearance },
        ]}>
        <View style={styles.topBar}>
          <BrandLogo size={30} />
          <View
            style={[
              styles.localPill,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}>
            <Icon name="lock" size={12} color={theme.textMuted} />
            <AppText variant="caption" tone="secondary" style={styles.localPillText}>
              LOCAL PROFILE
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
            APPEARANCE
          </AppText>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <View style={styles.cardHeading}>
              <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="settings" size={16} color={theme.primary} />
              </View>
              <View style={styles.cardHeadingCopy}>
                <AppText variant="label">Theme</AppText>
                <AppText variant="caption" tone="muted" style={styles.cardHeadingNote}>
                  {preference === 'system'
                    ? `Following your device · ${colorMode === 'dark' ? 'dark' : 'light'}`
                    : `Always ${preference}`}
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.segmented,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              {themeOptions.map((option) => {
                const selected = option.value === preference;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${option.label} theme`}
                    onPress={() => setPreference(option.value)}
                    style={({ pressed }) => [
                      styles.segment,
                      selected && { backgroundColor: theme.primary },
                      pressed && !selected && styles.pressed,
                    ]}>
                    <Icon
                      name={option.icon}
                      size={15}
                      color={selected ? theme.onPrimary : theme.textMuted}
                    />
                    <AppText
                      variant="caption"
                      style={[
                        styles.segmentLabel,
                        { color: selected ? theme.onPrimary : theme.textSecondary },
                      ]}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="caption" tone="muted" style={styles.hint}>
              System follows the light or dark appearance set on your phone.
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
            MAP
          </AppText>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <View style={styles.cardHeading}>
              <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="route" size={16} color={theme.primary} />
              </View>
              <View style={styles.cardHeadingCopy}>
                <AppText variant="label">Offline map style</AppText>
                <AppText variant="caption" tone="muted" style={styles.cardHeadingNote}>
                  {selectedMapStyle?.note ?? 'Balanced colours for everyday reading'}
                </AppText>
              </View>
            </View>

            <View
              style={styles.mapPreview}
              accessible
              accessibilityLabel={`Map style preview, ${selectedMapStyle?.label ?? 'Standard'}`}>
              <OfflineMapCanvas
                height={132}
                location={null}
                status="ready"
                canAskAgain={false}
                error={null}
                onRetry={() => {}}
                onOpenSettings={() => {}}
                initialSpanMeters={3600}
                showChip={false}
                showAttribution={false}
                showLocate={false}
                interactive={false}
              />

              <View style={styles.previewChip}>
                <Icon name="route" size={9} color={theme.primary} />
                <AppText
                  variant="caption"
                  style={[styles.previewChipText, { color: theme.primary }]}>
                  {(selectedMapStyle?.label ?? 'Standard').toUpperCase()} PREVIEW
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.segmented,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              {mapStyleOptions.map((option) => {
                const selected = option.value === mapStyle;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${option.label} map style`}
                    onPress={() => setMapStyle(option.value)}
                    style={({ pressed }) => [
                      styles.segment,
                      selected && { backgroundColor: theme.primary },
                      pressed && !selected && styles.pressed,
                    ]}>
                    <Icon
                      name={option.icon}
                      size={15}
                      color={selected ? theme.onPrimary : theme.textMuted}
                    />
                    <AppText
                      variant="caption"
                      style={[
                        styles.segmentLabel,
                        { color: selected ? theme.onPrimary : theme.textSecondary },
                      ]}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="caption" tone="muted" style={styles.hint}>
              Changes every map: the home preview, live map, and saved route snapshots.
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
            RIDE DEFAULTS
          </AppText>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <View style={styles.cardHeading}>
              <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="wallet" size={16} color={theme.primary} />
              </View>
              <View style={styles.cardHeadingCopy}>
                <AppText variant="label">New commute</AppText>
                <AppText variant="caption" tone="muted" style={styles.cardHeadingNote}>
                  Starting values for every ride on this phone
                </AppText>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Default fuel tier, ${selectedTier.tier}`}
              accessibilityHint="Opens the fuel tier list"
              onPress={() => setTierSheetOpen(true)}
              style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}>
              <View style={styles.actionCopy}>
                <AppText variant="label">Default fuel tier</AppText>
                <AppText variant="caption" tone="muted" style={styles.actionNote}>
                  {selectedTier.tier} · {selectedTier.fuelPrice} / L
                </AppText>
              </View>
              <Icon name="chevron-down" size={14} color={theme.textMuted} weight="semibold" />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: discount }}
              accessibilityLabel="Apply the 20 percent senior, PWD and student discount by default"
              onPress={toggleDiscount}
              style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}>
              <View style={styles.actionCopy}>
                <AppText variant="label">Senior · PWD · Student</AppText>
                <AppText variant="caption" tone="muted" style={styles.actionNote}>
                  Turn the 20% discount on for every new commute
                </AppText>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: discount ? theme.primary : 'transparent',
                    borderColor: discount ? theme.primary : theme.borderStrong,
                  },
                ]}>
                {discount ? (
                  <Icon name="check" size={12} color={theme.onPrimary} weight="bold" />
                ) : null}
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
            LOCAL STORAGE
          </AppText>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <View style={styles.cardHeading}>
              <View style={[styles.cardIcon, { backgroundColor: theme.yellowSoft }]}>
                <Icon name="database" size={16} color={theme.yellowInk} />
              </View>
              <View style={styles.cardHeadingCopy}>
                <AppText variant="label">On this device only</AppText>
                <AppText variant="caption" tone="muted" style={styles.cardHeadingNote}>
                  Trips and preferences never leave your phone
                </AppText>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
                <AppText style={styles.statValue}>
                  {storageReady ? storage.count : '—'}
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.statLabel}>
                  SAVED TRIPS
                </AppText>
              </View>

              <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
                <AppText style={styles.statValue}>
                  {storageReady ? formatBytes(storage.bytes) : '—'}
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.statLabel}>
                  STORAGE USED
                </AppText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear saved trips"
              accessibilityHint="Removes every saved commute from this device"
              disabled={!storageReady || storage.count === 0}
              onPress={confirmClearTrips}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && storage.count > 0 && styles.pressed,
                (!storageReady || storage.count === 0) && styles.disabled,
              ]}>
              <View style={[styles.actionIcon, { backgroundColor: dangerSoft }]}>
                <Icon name="trash" size={15} color={theme.danger} />
              </View>
              <View style={styles.actionCopy}>
                <AppText variant="label" style={{ color: theme.danger }}>
                  Clear saved trips
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.actionNote}>
                  Your appearance and fare settings are kept
                </AppText>
              </View>
              <Icon name="chevron-right" size={14} color={theme.textMuted} weight="semibold" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
            ABOUT
          </AppText>

          <View
            style={[
              styles.card,
              styles.aboutCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show onboarding"
              accessibilityHint="Replays the welcome walkthrough"
              onPress={() => router.push({ pathname: '/onboarding', params: { from: 'me' } })}
              style={({ pressed }) => [styles.aboutAction, pressed && styles.pressed]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="sparkles" size={15} color={theme.primary} />
              </View>
              <View style={styles.actionCopy}>
                <AppText variant="label">Show onboarding</AppText>
                <AppText variant="caption" tone="muted" style={styles.actionNote}>
                  Replay the welcome walkthrough
                </AppText>
              </View>
              <Icon name="chevron-right" size={14} color={theme.textMuted} weight="semibold" />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.aboutRow}>
              <AppText variant="bodySmall" tone="secondary">
                Version
              </AppText>
              <AppText variant="label" style={styles.aboutValue}>
                {AppConfig.version}
              </AppText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.aboutRow}>
              <AppText variant="bodySmall" tone="secondary">
                Currency
              </AppText>
              <AppText variant="label" style={styles.aboutValue}>
                Philippine peso (₱)
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      <FareMatrixModal
        visible={tierSheetOpen}
        onClose={() => setTierSheetOpen(false)}
        selectedTierId={tierId}
        onSelectTier={selectTier}
      />

      <Modal
        visible={clearSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setClearSheetOpen(false)}
        statusBarTranslucent>
        <View style={styles.dialogRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close clear saved trips confirmation"
            onPress={() => setClearSheetOpen(false)}
            style={styles.dialogBackdrop}
          />

          <View
            style={[
              styles.dialogCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIcon, { backgroundColor: dangerSoft }]}>
                <Icon name="trash" size={18} color={theme.danger} />
              </View>

              <View style={styles.dialogCopy}>
                <AppText variant="subtitle">Clear saved trips?</AppText>
                <AppText variant="caption" tone="muted" style={styles.dialogKicker}>
                  {storage.count} SAVED {storage.count === 1 ? 'COMMUTE' : 'COMMUTES'} · CANNOT BE
                  UNDONE
                </AppText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close clear saved trips confirmation"
                onPress={() => setClearSheetOpen(false)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.dialogClose,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <Icon name="close" size={13} color={theme.textSecondary} weight="semibold" />
              </Pressable>
            </View>

            <AppText variant="bodySmall" tone="secondary" style={styles.dialogBody}>
              This removes every saved commute from this device. Your appearance, fare tier and
              discount settings stay as they are.
            </AppText>

            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Keep saved trips"
                onPress={() => setClearSheetOpen(false)}
                style={({ pressed }) => [
                  styles.dialogSecondary,
                  { borderColor: theme.borderStrong },
                  pressed && styles.pressed,
                ]}>
                <AppText variant="label" tone="secondary" style={styles.dialogSecondaryText}>
                  Cancel
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear saved trips"
                accessibilityState={{ disabled: clearingTrips }}
                disabled={clearingTrips}
                onPress={() => {
                  void clearTrips();
                }}
                style={({ pressed }) => [
                  styles.dialogDangerButton,
                  { backgroundColor: dangerSoft },
                  pressed && styles.pressed,
                  clearingTrips && styles.disabled,
                ]}>
                <Icon name="trash" size={14} color={theme.danger} />
                <AppText variant="label" style={[styles.dialogDangerText, { color: theme.danger }]}>
                  {clearingTrips ? 'Clearing…' : 'Clear trips'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
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
    marginBottom: Spacing.xs,
  },
  localPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  localPillText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.3,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadingCopy: {
    flex: 1,
    gap: 1,
  },
  cardHeadingNote: {
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  mapPreview: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewChip: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  previewChipText: {
    fontSize: 7.5,
    letterSpacing: 0.8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  segmentLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  hint: {
    fontSize: 8.5,
    letterSpacing: 0.2,
    lineHeight: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stat: {
    flex: 1,
    gap: 2,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dialogIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCopy: {
    flex: 1,
    gap: 2,
  },
  dialogKicker: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
  dialogClose: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBody: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dialogSecondary: {
    flex: 0.8,
    height: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogSecondaryText: {
    fontSize: 13,
  },
  dialogDangerButton: {
    flex: 1.4,
    height: 48,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dialogDangerText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionNote: {
    fontSize: 8.5,
    letterSpacing: 0.2,
  },
  aboutCard: {
    gap: 0,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  aboutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  aboutValue: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
