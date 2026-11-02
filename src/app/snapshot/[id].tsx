import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTripDate } from '@/lib/dates';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';
import { toRouteSnapshots } from '@/lib/route-snapshots';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

/** How long one snapshot stays on screen before advancing like a story. */
const STORY_DURATION_MS = 6500;
/** Height reserved under the map so the caption card never covers the route. */
const CAPTION_CLEARANCE = 176;

function ProgressSegment({
  active,
  done,
  progress,
}: {
  active: boolean;
  done: boolean;
  progress: SharedValue<number>;
}) {
  const theme = useTheme();
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(Math.max(progress.value, 0), 1) * 100}%`,
  }));

  return (
    <View style={[styles.progressTrack, { backgroundColor: 'rgba(15,23,42,0.2)' }]}>
      {active ? (
        <Animated.View
          style={[styles.progressFill, { backgroundColor: theme.primary }, fillStyle]}
        />
      ) : done ? (
        <View
          style={[styles.progressFill, { width: '100%', backgroundColor: theme.primary }]}
        />
      ) : null}
    </View>
  );
}

function StoryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="muted" style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="label" numberOfLines={1} style={styles.statValue}>
        {value}
      </AppText>
    </View>
  );
}

export default function RouteSnapshotScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestedId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [trips, setTrips] = useState<SavedTrip[] | null>(null);
  const [activeId, setActiveId] = useState(requestedId ?? '');
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    let active = true;

    loadSavedTrips()
      .then((saved) => {
        if (active) setTrips(saved);
      })
      .catch(() => {
        if (active) setTrips([]);
      });

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const snapshots = useMemo(() => toRouteSnapshots(trips ?? []), [trips]);
  const currentIndex = Math.max(
    snapshots.findIndex((snapshot) => snapshot.id === activeId),
    0,
  );
  const current = snapshots[currentIndex];
  const isLast = currentIndex === snapshots.length - 1;

  const closeStory = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }, []);

  const goRelative = useCallback(
    (delta: number) => {
      const next = currentIndex + delta;
      if (next < 0) return;
      if (next >= snapshots.length) {
        closeStory();
        return;
      }
      setActiveId(snapshots[next].id);
    },
    [closeStory, currentIndex, snapshots],
  );

  useEffect(() => {
    if (!current) return;

    if (reduceMotion) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: STORY_DURATION_MS,
      easing: Easing.linear,
    });
    const timer = setTimeout(() => goRelative(1), STORY_DURATION_MS);

    return () => clearTimeout(timer);
  }, [current, goRelative, progress, reduceMotion]);

  if (trips === null) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.background }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color={theme.primary} />
        <AppText variant="caption" tone="muted" style={styles.loadingText}>
          LOADING SNAPSHOT…
        </AppText>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.background }]}>
        <StatusBar style="dark" />
        <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
          <Icon name="route" size={20} color={theme.primary} />
        </View>
        <AppText variant="subtitle">Snapshot unavailable</AppText>
        <AppText variant="caption" tone="muted" style={styles.emptyText}>
          This commute has no saved route on this phone.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close snapshot"
          onPress={closeStory}
          style={({ pressed }) => [
            styles.emptyButton,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <AppText variant="label" tone="onPrimary">
            Close
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <OfflineMapCanvas
        key={current.id}
        height={height}
        location={null}
        track={current.track}
        status="ready"
        canAskAgain={false}
        error={null}
        onRetry={() => {}}
        onOpenSettings={() => {}}
        initialCenter={current.viewport.center}
        initialSpanMeters={current.viewport.span}
        bottomInset={insets.bottom + CAPTION_CLEARANCE}
        showChip={false}
        showAttribution
        showLocate={false}
        interactive={false}
        rounded={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous snapshot"
        onPress={() => goRelative(-1)}
        style={[styles.tapZone, styles.tapLeft, { top: insets.top + 104 }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isLast ? 'Close snapshot' : 'Next snapshot'}
        onPress={() => goRelative(1)}
        style={[styles.tapZone, styles.tapRight, { top: insets.top + 104 }]}
      />

      <View
        pointerEvents="box-none"
        style={[styles.top, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.progressRow}>
          {snapshots.map((snapshot, index) => (
            <ProgressSegment
              key={snapshot.id}
              active={index === currentIndex}
              done={index < currentIndex}
              progress={progress}
            />
          ))}
        </View>

        <View
          style={[
            styles.header,
            { backgroundColor: 'rgba(255,255,255,0.95)', ...(Shadows.card ?? {}) },
          ]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Icon name="route" size={15} color={theme.onPrimary} weight="semibold" />
          </View>

          <View style={styles.headerCopy}>
            <AppText variant="label" numberOfLines={1} style={styles.headerTitle}>
              Tripede route
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.headerMeta}>
              {formatTripDate(current.endedAt)} · {currentIndex + 1} of {snapshots.length}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close snapshot"
            onPress={closeStory}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <Icon name="close" size={15} color={theme.text} weight="semibold" />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.caption,
          {
            bottom: insets.bottom + Spacing.lg,
            backgroundColor: theme.surface,
            borderColor: theme.border,
            ...(Shadows.card ?? {}),
          },
        ]}>
        <View style={styles.captionHead}>
          <View style={[styles.captionIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="route" size={14} color={theme.primary} />
          </View>

          <View style={styles.captionCopy}>
            <AppText variant="caption" tone="muted" style={styles.captionEyebrow}>
              ROUTE SNAPSHOT
            </AppText>
            <AppText variant="label" numberOfLines={1} style={styles.captionTitle}>
              {formatTripDate(current.endedAt)}
            </AppText>
          </View>

          <View style={[styles.tierPill, { backgroundColor: theme.backgroundElement }]}>
            <AppText variant="caption" tone="secondary" style={styles.tierText}>
              {current.tier}
            </AppText>
          </View>
        </View>

        <View style={[styles.statRow, { backgroundColor: theme.backgroundElement }]}>
          <StoryStat label="DISTANCE" value={formatKm(current.distanceKm)} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <StoryStat label="DURATION" value={formatDuration(current.durationMs)} />
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <StoryStat label="FARE" value={formatPeso(current.fare)} />
        </View>

        <View style={styles.captionFoot}>
          <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.footText}>
            {current.plateNumber
              ? `PLATE ${current.plateNumber.toUpperCase()} · MATI CITY`
              : 'MATI CITY · SAVED ON THIS PHONE'}
          </AppText>
          <View style={styles.tapHint}>
            <AppText variant="caption" tone="muted" style={styles.footText}>
              {isLast ? 'TAP TO CLOSE' : 'TAP TO CONTINUE'}
            </AppText>
            <Icon name="chevron-right" size={11} color={theme.textMuted} weight="semibold" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    maxWidth: 260,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.pill,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 2,
  },
  progressTrack: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: Radii.xl,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  headerMeta: {
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapZone: {
    position: 'absolute',
    bottom: 0,
  },
  tapLeft: {
    left: 0,
    width: '34%',
  },
  tapRight: {
    left: '34%',
    right: 0,
  },
  caption: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radii.xxl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  captionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  captionIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionCopy: {
    flex: 1,
    gap: 1,
  },
  captionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.1,
  },
  captionTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  tierPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  tierText: {
    fontSize: 8.5,
    letterSpacing: 0.7,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.8,
  },
  captionFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  footText: {
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
