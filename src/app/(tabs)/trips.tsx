import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { TabBarClearance } from '@/components/navigation/glass-tab-bar';
import { DataNoticeModal } from '@/components/trips/data-notice-modal';
import { DateFilterSheet } from '@/components/trips/date-filter-sheet';
import { TripDetailsSheet } from '@/components/trips/trip-details-sheet';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useColorMode, useTheme } from '@/hooks/use-theme';
import { formatDateKey, formatTripDate, toDateKey } from '@/lib/dates';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

/** Dashed tear line with a half-moon notch on each edge of the paper. */
function Perforation() {
  const theme = useTheme();

  return (
    <View style={styles.perforation}>
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.background }]} />
      <View style={[styles.receiptDashes, { borderTopColor: theme.borderStrong }]} />
      <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.background }]} />
    </View>
  );
}

/** Softly scalloped paper edge along the bottom of the receipt. */
function ScallopedEdge() {
  const theme = useTheme();

  return (
    <View pointerEvents="none" style={styles.scallop}>
      {Array.from({ length: 22 }, (_, index) => (
        <View key={index} style={styles.scallopCell}>
          <View style={[styles.scallopDot, { backgroundColor: theme.background }]} />
        </View>
      ))}
    </View>
  );
}

function TripCard({ trip, onPress }: { trip: SavedTrip; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatTripDate(trip.endedAt)}, ${formatPeso(trip.fare)}, ${formatKm(trip.distanceKm)}`}
      accessibilityHint="Opens the route and commute details"
      onPress={onPress}
      style={({ pressed }) => [
        styles.receipt,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...(Shadows.card ?? {}),
        },
        pressed && styles.tripCardPressed,
      ]}>
      <View style={styles.receiptBody}>
        <View style={styles.receiptHeader}>
          <View style={styles.receiptBrand}>
            <AppText style={styles.receiptBrandName}>TRIPEDE</AppText>
            <AppText variant="caption" tone="muted" style={styles.receiptKicker}>
              FARE RECEIPT
            </AppText>
          </View>
          <View style={styles.receiptMeta}>
            <AppText variant="mono" tone="secondary" style={styles.receiptDate}>
              {formatTripDate(trip.endedAt)}
            </AppText>
            <AppText variant="mono" tone="muted" style={styles.receiptNumber}>
              NO. {trip.id.slice(-6).toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>

      <Perforation />

      <View style={styles.receiptBody}>
        <View style={styles.receiptStats}>
          <View style={styles.receiptStat}>
            <AppText variant="caption" tone="muted" style={styles.receiptStatLabel}>
              DISTANCE
            </AppText>
            <AppText variant="mono" numberOfLines={1} style={styles.receiptStatValue}>
              {formatKm(trip.distanceKm)}
            </AppText>
          </View>

          <View style={[styles.receiptStatDivider, { backgroundColor: theme.border }]} />

          <View style={styles.receiptStat}>
            <AppText variant="caption" tone="muted" style={styles.receiptStatLabel}>
              DURATION
            </AppText>
            <AppText variant="mono" numberOfLines={1} style={styles.receiptStatValue}>
              {formatDuration(trip.durationMs)}
            </AppText>
          </View>

          <View style={[styles.receiptStatDivider, { backgroundColor: theme.border }]} />

          <View style={[styles.receiptStat, styles.receiptStatEnd]}>
            <AppText variant="caption" tone="muted" style={styles.receiptStatLabel}>
              TOTAL FARE
            </AppText>
            <AppText numberOfLines={1} style={styles.receiptTotalValue}>
              {formatPeso(trip.fare)}
            </AppText>
          </View>
        </View>
      </View>

      <View pointerEvents="none" style={styles.receiptMascotWrap}>
        <Image
          source={require('@/assets/images/mascot.png')}
          style={styles.receiptMascot}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <ScallopedEdge />
    </Pressable>
  );
}

function TripCardSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.receipt,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...(Shadows.card ?? {}),
        },
      ]}>
      <View style={styles.receiptBody}>
        <View style={styles.receiptHeader}>
          <View style={styles.receiptBrand}>
            <Skeleton style={styles.skeletonBrand} radius={4} />
            <Skeleton style={styles.skeletonKicker} radius={4} />
          </View>
          <View style={styles.receiptMeta}>
            <Skeleton style={styles.skeletonDate} radius={4} />
            <Skeleton style={styles.skeletonNumber} radius={4} />
          </View>
        </View>
      </View>

      <Perforation />

      <View style={styles.receiptBody}>
        <View style={styles.receiptStats}>
          <View style={styles.receiptStat}>
            <Skeleton style={styles.skeletonStatLabel} radius={4} />
            <Skeleton style={styles.skeletonStatValue} radius={4} />
          </View>
          <View style={[styles.receiptStatDivider, { backgroundColor: theme.border }]} />
          <View style={styles.receiptStat}>
            <Skeleton style={styles.skeletonStatLabel} radius={4} />
            <Skeleton style={styles.skeletonStatValue} radius={4} />
          </View>
          <View style={[styles.receiptStatDivider, { backgroundColor: theme.border }]} />
          <View style={[styles.receiptStat, styles.receiptStatEnd]}>
            <Skeleton style={styles.skeletonStatLabel} radius={4} />
            <Skeleton style={styles.skeletonTotalValue} radius={6} />
          </View>
        </View>
      </View>

      <ScallopedEdge />
    </View>
  );
}

function TripsSkeleton() {
  return (
    <View accessibilityLabel="Loading saved commutes" style={styles.tripList}>
      <TripCardSkeleton />
      <TripCardSkeleton />
      <TripCardSkeleton />
    </View>
  );
}

export default function TripsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorMode = useColorMode();
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);

  const markedDates = useMemo(
    () => new Set(trips.map((trip) => toDateKey(trip.endedAt))),
    [trips],
  );

  const visibleTrips = useMemo(
    () =>
      selectedDate ? trips.filter((trip) => toDateKey(trip.endedAt) === selectedDate) : trips,
    [trips, selectedDate],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      loadSavedTrips()
        .then((saved) => {
          if (active) setTrips(saved);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, []),
  );

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
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter commutes by date"
              accessibilityHint="Opens a calendar to pick a day"
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [
                styles.noticeButton,
                {
                  backgroundColor: selectedDate ? theme.primary : theme.primarySoft,
                },
                pressed && styles.pressed,
              ]}>
              <Icon
                name="calendar"
                size={16}
                color={selectedDate ? theme.onPrimary : theme.primary}
                weight="semibold"
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About data storage"
              accessibilityHint="Explains that your commutes are kept on this phone only"
              onPress={() => setNoticeOpen(true)}
              style={({ pressed }) => [
                styles.noticeButton,
                { backgroundColor: theme.primarySoft },
                pressed && styles.pressed,
              ]}>
              <Icon name="lock" size={16} color={theme.primary} weight="semibold" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <TripsSkeleton />
        ) : visibleTrips.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  ...(Shadows.card ?? {}),
                },
              ]}>
            <Image
              source={require('@/assets/images/mascot.png')}
              style={styles.emptyMascot}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />

            <View style={styles.emptyCopy}>
              <AppText variant="caption" tone="muted" style={styles.emptyEyebrow}>
                {selectedDate ? 'NO COMMUTE ON THIS DAY' : 'READY WHEN YOU ARE'}
              </AppText>
              <AppText variant="subtitle" align="center">
                {selectedDate ? `Nothing saved on ${formatDateKey(selectedDate)}` : 'No commutes yet'}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" align="center">
                {selectedDate
                  ? 'There is no saved commute for this date. Close the filter to see every commute kept on this phone.'
                  : 'Save a finished commute and it will appear here with its fare, distance and time — ready whenever you need it.'}
              </AppText>
            </View>

            {selectedDate ? (
              <AppButton
                label="Close"
                size="small"
                fullWidth={false}
                variant="secondary"
                onPress={() => setSelectedDate(null)}
              />
            ) : (
              <AppButton
                label="Plan a commute"
                size="small"
                fullWidth={false}
                icon="arrow-right"
                onPress={() => router.navigate('/home')}
              />
            )}
          </View>
          </View>
        ) : (
          <View style={styles.tripList}>
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onPress={() => setSelectedTrip(trip)} />
            ))}
          </View>
        )}
      </ScrollView>

      <DataNoticeModal visible={noticeOpen} onClose={() => setNoticeOpen(false)} />
      {selectedTrip ? (
        <TripDetailsSheet
          visible
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      ) : null}
      {pickerOpen ? (
        <DateFilterSheet
          visible
          onClose={() => setPickerOpen(false)}
          selectedDate={selectedDate}
          markedDates={markedDates}
          onSelectDate={setSelectedDate}
        />
      ) : null}
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
    gap: Spacing.xl,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noticeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.lg,
    borderRadius: Radii.xxl,
    borderWidth: 1,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyMascot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 142,
    height: 95,
    opacity: 0.16,
  },
  emptyEyebrow: {
    fontSize: 8.5,
    letterSpacing: 1.4,
  },
  emptyCopy: {
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 260,
  },
  tripList: {
    gap: Spacing.lg,
    marginBottom: -Spacing.sm,
  },
  receipt: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  tripCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  receiptBody: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: 6,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  receiptBrand: {
    gap: 1,
  },
  receiptBrandName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  receiptKicker: {
    fontSize: 8.5,
    letterSpacing: 1.6,
  },
  receiptMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  receiptDate: {
    fontSize: 11,
    lineHeight: 16,
  },
  receiptNumber: {
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
  perforation: {
    position: 'relative',
    height: 12,
    justifyContent: 'center',
  },
  receiptDashes: {
    marginHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  notch: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  notchLeft: {
    left: -8,
  },
  notchRight: {
    right: -8,
  },
  receiptStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  receiptStat: {
    flex: 1,
    gap: 2,
  },
  receiptStatEnd: {
    alignItems: 'flex-end',
  },
  receiptStatLabel: {
    fontSize: 8.5,
    letterSpacing: 1.1,
  },
  receiptStatValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  receiptStatDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.8,
  },
  receiptTotalValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  receiptMascotWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 124,
    height: 82,
    opacity: 0.14,
  },
  receiptMascot: {
    width: '100%',
    height: '100%',
  },
  scallop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 8,
    flexDirection: 'row',
  },
  scallopCell: {
    flex: 1,
    alignItems: 'center',
  },
  scallopDot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
  },
  skeletonBrand: {
    width: 72,
    height: 11,
  },
  skeletonKicker: {
    width: 58,
    height: 8,
  },
  skeletonDate: {
    width: 96,
    height: 10,
  },
  skeletonNumber: {
    width: 62,
    height: 8,
  },
  skeletonStatLabel: {
    width: 52,
    height: 8,
  },
  skeletonStatValue: {
    width: 64,
    height: 12,
  },
  skeletonTotalValue: {
    width: 82,
    height: 20,
  },
});
