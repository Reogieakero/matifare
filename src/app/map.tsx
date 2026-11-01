import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { StorageKeys } from '@/constants/app';
import { FareMatrix, type FareTier } from '@/constants/fare-matrix';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTripOdometer } from '@/hooks/use-trip-odometer';
import { useUserLocation } from '@/hooks/use-user-location';
import { applyFareDiscount, calculateFare, formatKm, formatPeso } from '@/lib/fare';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { appendSavedTrip } from '@/lib/trips';

const PANEL_OVERLAP = Radii.lg;

export default function MapScreen() {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  // The offline map builds a lot of SVG on mount. Hold it back until the
  // screen transition has finished so the slide never stutters.
  const [mapReady, setMapReady] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [plateModalOpen, setPlateModalOpen] = useState(false);
  const [plateDraft, setPlateDraft] = useState('');
  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(FareMatrix[0].id);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  // The panel sizes itself to its content; the map fills everything left over.
  const [mapHeight, setMapHeight] = useState(() => Math.round(height * 0.5));

  useFocusEffect(
    useCallback(() => {
      // Let the slide-up finish before GPS starts, so a permission prompt never
      // interrupts the transition.
      const gpsTimer = setTimeout(() => setFocused(true), 260);
      const mapTimer = setTimeout(() => setMapReady(true), 400);

      return () => {
        clearTimeout(gpsTimer);
        clearTimeout(mapTimer);
        setFocused(false);
      };
    }, []),
  );

  const { status, location, canAskAgain, error, refresh, openSettings } = useUserLocation(
    focused,
    { profile: navigating ? 'navigation' : 'default' },
  );

  const trip = useTripOdometer(location);
  const hasFix = Boolean(location);

  useEffect(() => {
    let active = true;

    getStoredValue(StorageKeys.fareTier).then((value) => {
      if (!active || !value) return;

      const tierId = Number(value);
      if (FareMatrix.some((tier) => tier.id === tierId)) {
        setSelectedTierId(tierId);
      }
    });

    getStoredValue(StorageKeys.fareDiscount).then((value) => {
      if (!active || !value) return;
      setDiscountApplied(value === '1');
    });

    return () => {
      active = false;
    };
  }, []);

  const selectTier = (tier: FareTier) => {
    setSelectedTierId(tier.id);
    void setStoredValue(StorageKeys.fareTier, String(tier.id));
  };

  const toggleDiscount = () => {
    setDiscountApplied((current) => {
      const next = !current;
      void setStoredValue(StorageKeys.fareDiscount, next ? '1' : '0');
      return next;
    });
  };

  const togglePanel = () => {
    setPanelCollapsed((current) => !current);
  };

  const selectedTier =
    FareMatrix.find((tier) => tier.id === selectedTierId) ?? FareMatrix[0];

  // "Commute now" only asks for the optional tricycle number; the meter starts
  // once the rider confirms (or skips) that prompt.
  const requestStart = () => {
    setPlateDraft('');
    setEndedAt(null);
    setPlateModalOpen(true);
  };

  const confirmStart = (enteredPlate: string | null) => {
    setPlateNumber(enteredPlate);
    setPlateModalOpen(false);
    trip.start();
    setNavigating(true);
  };

  const endTrip = () => {
    trip.stop();
    setNavigating(false);
    setEndedAt(Date.now());
    setSaveModalOpen(true);
  };

  const saveTripDetails = async () => {
    if (endedAt === null) return;

    const fare = calculateFare(selectedTier, trip.km).total;

    // Keep the modal open: it plays the success animation once this resolves,
    // then closes itself.
    await appendSavedTrip({
      startedAt: Math.max(endedAt - trip.durationMs, 0),
      endedAt,
      distanceKm: trip.km,
      durationMs: trip.durationMs,
      fare: discountApplied ? applyFareDiscount(fare) : fare,
      tier: selectedTier.tier,
      plateNumber,
      discountApplied,
      track: trip.track,
    });
  };

  const closeSaveModal = () => {
    setSaveModalOpen(false);
  };

  const resetTrip = () => {
    trip.reset();
    setPlateNumber(null);
    setEndedAt(null);
    setNavigating(false);
  };

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setMapHeight((current) => (current === next ? current : next));
  };

  // Keep the locate pill and zoom buttons clear of the panel's rounded edge.
  const mapControlsInset = fullScreen ? insets.bottom : PANEL_OVERLAP + Spacing.sm;

  const tripFare = calculateFare(selectedTier, trip.km).total;
  const finalFare = discountApplied ? applyFareDiscount(tripFare) : tripFare;
  const tripSummary = `${formatPeso(finalFare)} · ${formatKm(trip.km)}`;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.mapArea} onLayout={handleMapLayout}>
        {mapReady ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.mapCanvas}>
            <OfflineMapCanvas
              height={mapHeight}
              location={location}
              track={trip.track}
              status={status}
              canAskAgain={canAskAgain}
              error={error}
              onRetry={refresh}
              onOpenSettings={openSettings}
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
              accessibilityLabel="Close map and commute meter"
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
          tripStatus={trip.status}
          km={trip.km}
          durationMs={trip.durationMs}
          poorSignal={trip.poorSignal}
          hasFix={hasFix}
          locationStatus={status}
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
        onSave={saveTripDetails}
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
