import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTripDate } from '@/lib/dates';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';
import { toRouteSnapshots, type RouteSnapshot } from '@/lib/route-snapshots';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

const CARD_WIDTH = 196;
const THUMB_HEIGHT = 108;
const MAX_SNAPSHOTS = 6;

function SnapshotCard({ snapshot, onPress }: { snapshot: RouteSnapshot; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Route snapshot from ${formatTripDate(snapshot.endedAt)}, ${formatKm(
        snapshot.distanceKm,
      )}, ${formatPeso(snapshot.fare)}`}
      accessibilityHint="Opens this route as a full screen snapshot"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...(Shadows.card ?? {}),
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.thumb}>
        <OfflineMapCanvas
          height={THUMB_HEIGHT}
          location={null}
          track={snapshot.track}
          status="ready"
          canAskAgain={false}
          error={null}
          onRetry={() => {}}
          onOpenSettings={() => {}}
          initialCenter={snapshot.viewport.center}
          initialSpanMeters={snapshot.viewport.span}
          showChip={false}
          showAttribution={false}
          showLocate={false}
          interactive={false}
          rounded={false}
        />

        <View style={[styles.routeChip, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
          <Icon name="route" size={9} color={theme.primary} />
          <AppText variant="caption" style={[styles.routeChipText, { color: theme.primary }]}>
            ROUTE
          </AppText>
        </View>

        <View style={[styles.farePill, { backgroundColor: theme.primary }]}>
          <AppText variant="caption" style={styles.farePillText}>
            {formatPeso(snapshot.fare)}
          </AppText>
        </View>
      </View>

      <View style={styles.cardBody}>
        <AppText variant="label" numberOfLines={1} style={styles.cardDate}>
          {formatTripDate(snapshot.endedAt)}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.cardMeta}>
          {formatKm(snapshot.distanceKm)} · {formatDuration(snapshot.durationMs)}
        </AppText>
      </View>
    </Pressable>
  );
}

function SnapshotSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.skeletonThumb} radius={0} />
      <View style={styles.cardBody}>
        <Skeleton style={styles.skeletonDate} radius={4} />
        <Skeleton style={styles.skeletonMeta} radius={4} />
      </View>
    </View>
  );
}

export function RouteSnapshots() {
  const router = useRouter();
  const theme = useTheme();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

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

  const snapshots = useMemo(
    () => toRouteSnapshots(trips).slice(0, MAX_SNAPSHOTS),
    [trips],
  );

  const openSnapshot = (snapshot: RouteSnapshot) => {
    router.push({ pathname: '/snapshot/[id]', params: { id: snapshot.id } });
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Route snapshots
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.sectionHint}>
          {snapshots.length > 0 ? `${snapshots.length} SAVED` : 'FROM YOUR RIDES'}
        </AppText>
      </View>

      {loading ? (
        <View style={styles.strip}>
          <SnapshotSkeleton />
          <SnapshotSkeleton />
        </View>
      ) : snapshots.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="No route snapshots yet"
          accessibilityHint="Opens the commute meter to record a route"
          onPress={() => router.push('/map')}
          style={({ pressed }) => [
            styles.empty,
            { borderColor: theme.borderStrong, backgroundColor: theme.surface },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="route" size={16} color={theme.primary} />
          </View>
          <View style={styles.emptyCopy}>
            <AppText variant="label">No route snapshots yet</AppText>
            <AppText variant="caption" tone="secondary" style={styles.emptyText}>
              Finish and save a commute — its route becomes a snapshot here.
            </AppText>
          </View>
          <Icon name="chevron-right" size={14} color={theme.textMuted} weight="semibold" />
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          style={styles.stripScroll}>
          {snapshots.map((snapshot) => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              onPress={() => openSnapshot(snapshot)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
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
  stripScroll: {
    marginHorizontal: -Spacing.lg,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumb: {
    height: THUMB_HEIGHT,
    overflow: 'hidden',
  },
  routeChip: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  routeChipText: {
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
  farePill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  farePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  cardBody: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  cardDate: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardMeta: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  skeletonThumb: {
    height: THUMB_HEIGHT,
    width: '100%',
  },
  skeletonDate: {
    width: 118,
    height: 10,
  },
  skeletonMeta: {
    width: 86,
    height: 8,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radii.xl,
    padding: Spacing.md,
  },
  emptyIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    flex: 1,
    gap: 2,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
