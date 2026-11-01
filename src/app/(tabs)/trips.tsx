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
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, formatTripDate, toDateKey } from '@/lib/dates';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

function TripStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.statCell}>
      <AppText variant="caption" tone="muted" style={styles.statLabel}>
        {label}
      </AppText>
      <AppText
        variant="label"
        numberOfLines={1}
        style={[styles.statValue, { color: muted ? theme.textMuted : theme.text }]}>
        {value}
      </AppText>
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
        styles.tripCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...(Shadows.card ?? {}),
        },
        pressed && styles.tripCardPressed,
      ]}>
      <Image
        source={require('@/assets/images/mascot.png')}
        style={styles.tripMascot}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />

      <View style={[styles.tripAccent, { backgroundColor: theme.primary }]} />

      <View style={styles.tripBody}>
        <View style={styles.tripTop}>
          <View style={[styles.tripIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="route" size={19} color={theme.primary} weight="semibold" />
          </View>

          <View style={styles.tripHead}>
            <AppText variant="label" numberOfLines={1}>
              {formatTripDate(trip.endedAt)}
            </AppText>
            <View style={styles.tripStatus}>
              <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
              <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.tripStatusText}>
                SAVED · {trip.tier.toUpperCase()}
                {trip.discountApplied ? ' · 20% OFF' : ''}
              </AppText>
            </View>
          </View>

          <View style={styles.tripFare}>
            <AppText style={styles.tripFareValue}>{formatPeso(trip.fare)}</AppText>
            <AppText variant="caption" tone="muted" style={styles.tripFareLabel}>
              TOTAL FARE
            </AppText>
          </View>
        </View>

        <View style={[styles.statStrip, { backgroundColor: theme.backgroundElement }]}>
          <TripStat label="DISTANCE" value={formatKm(trip.distanceKm)} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <TripStat label="DURATION" value={formatDuration(trip.durationMs)} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <TripStat label="PLATE" value={trip.plateNumber ?? '—'} muted={!trip.plateNumber} />
        </View>
      </View>
    </Pressable>
  );
}

export default function TripsScreen() {
  const router = useRouter();
  const theme = useTheme();
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
      <StatusBar style="dark" />
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
          <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="body" tone="secondary">
              Loading your saved commutes…
            </AppText>
          </View>
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
  loadingCard: {
    alignItems: 'center',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  tripList: {
    gap: Spacing.md,
    marginBottom: -Spacing.sm,
  },
  tripCard: {
    flexDirection: 'row',
    borderRadius: Radii.xxl,
    borderWidth: 1,
  },
  tripCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  tripMascot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 148,
    opacity: 0.18,
  },
  tripAccent: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginVertical: Spacing.lg,
    marginLeft: Spacing.lg,
  },
  tripBody: {
    flex: 1,
    padding: Spacing.lg,
    paddingLeft: Spacing.md,
    gap: Spacing.md,
  },
  tripTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tripIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripHead: {
    flex: 1,
    gap: 3,
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tripStatusText: {
    fontSize: 9,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  tripFare: {
    alignItems: 'flex-end',
    gap: 1,
  },
  tripFareValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  tripFareLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.xs,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.8,
  },
});
