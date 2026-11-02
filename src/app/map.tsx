import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FareMatrixModal } from '@/components/fare-matrix-modal';
import { CommutePanel } from '@/components/map/commute-panel';
import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { TricyclePlateModal } from '@/components/map/tricycle-plate-modal';
import { TripSaveModal } from '@/components/map/trip-save-modal';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTripSession } from '@/hooks/use-trip-session';
import { formatKm, formatPeso } from '@/lib/fare';

const PANEL_OVERLAP = Radii.lg;

export default function MapScreen() {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    location,
    locationStatus,
    canAskAgain,
    locationError,
    refreshLocation,
    openLocationSettings,
    acquireLocation,
    status: tripStatus,
    km,
    durationMs,
    poorSignal,
    track,
    plateNumber,
    tier: selectedTier,
    selectedTierId,
    selectTier,
    discountApplied,
    toggleDiscount,
    fare,
    endedAt,
    startTrip,
    endTrip,
    resetTrip,
    saveTrip,
    discardTrip,
  } = useTripSession();

  // The offline map builds a lot of SVG on mount. Hold it back until the
  // screen transition has finished so the slide never stutters.
  const [mapReady, setMapReady] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [plateModalOpen, setPlateModalOpen] = useState(false);
  const [plateDraft, setPlateDraft] = useState('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  // The panel sizes itself to its content; the map fills everything left over.
  const [mapHeight, setMapHeight] = useState(() => Math.round(height * 0.5));
  const saveModalOpen = endedAt !== null;

  useFocusEffect(
    useCallback(() => {
      // Let the slide-up finish before GPS starts, so a permission prompt never
      // interrupts the transition.
      let release: (() => void) | null = null;
      const gpsTimer = setTimeout(() => {
        release = acquireLocation();
      }, 260);
      const mapTimer = setTimeout(() => setMapReady(true), 400);

      return () => {
        clearTimeout(gpsTimer);
        clearTimeout(mapTimer);
        release?.();
      };
    }, [acquireLocation]),
  );

  const hasFix = Boolean(location);

  const togglePanel = () => {
    setPanelCollapsed((current) => !current);
  };

  // "Commute now" only asks for the optional tricycle number; the meter starts
  // once the rider confirms (or skips) that prompt.
  const requestStart = () => {
    setPlateDraft('');
    setPlateModalOpen(true);
  };

  const confirmStart = (enteredPlate: string | null) => {
    setPlateModalOpen(false);
    startTrip(enteredPlate);
  };

  const closeSaveModal = () => {
    discardTrip();
  };

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setMapHeight((current) => (current === next ? current : next));
  };

  // Keep the locate pill and zoom buttons clear of the panel's rounded edge.
  const mapControlsInset = fullScreen ? insets.bottom : PANEL_OVERLAP + Spacing.sm;

  const tripSummary = `${formatPeso(fare)} · ${formatKm(km)}`;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.mapArea} onLayout={handleMapLayout}>
        {mapReady ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.mapCanvas}>
            <OfflineMapCanvas
              height={mapHeight}
              location={location}
              track={track}
              status={locationStatus}
              canAskAgain={canAskAgain}
              error={locationError}
              onRetry={refreshLocation}
              onOpenSettings={openLocationSettings}
              initialSpanMeters={1400}
              maxSpanMeters={10000}
              bottomInset={mapControlsInset}
              showChip={false}
              showAttribution={fullScreen}
              rounded={false}
              locateLabel="Where am I"
            />
          </Animated.View>
        ) : (
          <View style={styles.mapPlaceholder} />
        )}

        <View
          pointerEvents="box-none"
          style={[styles.topOverlay, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={[styles.topBar, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close map"
              accessibilityHint={
                tripStatus === 'riding'
                  ? 'The commute meter keeps running and stays visible on every screen'
                  : 'Returns to the previous screen'
              }
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: theme.primarySoft },
                pressed && styles.pressed,
              ]}>
              <Icon name="chevron-left" size={18} color={theme.primary} weight="semibold" />
            </Pressable>

            <View style={styles.topCopy}>
              <AppText variant="label" style={styles.topTitle}>
                You are here
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.topKicker}>
                MATI CITY · DAVAO ORIENTAL
              </AppText>
            </View>

            <View style={[styles.offlineChip, { backgroundColor: theme.primarySoft }]}>
              <Icon name="wifi-off" size={10} color={theme.primary} />
              <AppText variant="caption" style={[styles.offlineChipText, { color: theme.primary }]}>
                OFFLINE
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={fullScreen ? 'Exit full screen map' : 'Show map full screen'}
              accessibilityHint={
                fullScreen
                  ? 'Brings back the commute meter below the map'
                  : 'Hides the commute meter so the map fills the screen'
              }
              onPress={() => setFullScreen((current) => !current)}
              style={({ pressed }) => [
                styles.fullScreenButton,
                { backgroundColor: theme.primarySoft },
                pressed && styles.pressed,
              ]}>
              <Icon
                name={fullScreen ? 'collapse' : 'expand'}
                size={14}
                color={theme.primary}
                weight="semibold"
              />
            </Pressable>
          </View>
        </View>
      </View>

      {!fullScreen ? (
        <CommutePanel
          tier={selectedTier}
          onChangeTier={() => setMatrixOpen(true)}
          tripStatus={tripStatus}
          km={km}
          durationMs={durationMs}
          poorSignal={poorSignal}
          hasFix={hasFix}
          locationStatus={locationStatus}
          plateNumber={plateNumber}
          discountApplied={discountApplied}
          onToggleDiscount={toggleDiscount}
          collapsed={panelCollapsed}
          onToggleCollapsed={togglePanel}
          onStart={requestStart}
          onEnd={endTrip}
          onReset={resetTrip}
          bottomInset={insets.bottom}
        />
      ) : null}

      <FareMatrixModal
        visible={matrixOpen}
        onClose={() => setMatrixOpen(false)}
        selectedTierId={selectedTierId}
        onSelectTier={selectTier}
      />

      <TricyclePlateModal
        visible={plateModalOpen}
        value={plateDraft}
        onChangeValue={setPlateDraft}
        onCancel={() => setPlateModalOpen(false)}
        onConfirm={confirmStart}
      />

      <TripSaveModal
        visible={saveModalOpen}
        summary={tripSummary}
        onSave={saveTrip}
        onDiscard={closeSaveModal}
        onClose={closeSaveModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
    minHeight: 160,
  },
  mapCanvas: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#EAF0E3',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.xl,
    ...(Shadows.card ?? {}),
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCopy: {
    flex: 1,
    gap: 1,
  },
  topTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  topKicker: {
    fontSize: 8,
    letterSpacing: 1,
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  offlineChipText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
