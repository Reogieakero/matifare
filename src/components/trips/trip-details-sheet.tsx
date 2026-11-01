import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClockTime, formatDateKey, toDateKey } from '@/lib/dates';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';
import { getTrackViewport } from '@/lib/offline-map';
import type { SavedTrip } from '@/lib/trips';

const MAP_HEIGHT = 188;

type TripDetailsSheetProps = {
  visible: boolean;
  trip: SavedTrip;
  onClose: () => void;
};

function DetailStat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
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

function MetaTile({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.metaTile, { backgroundColor: theme.backgroundElement }]}>
      <AppText variant="caption" tone="muted" style={styles.metaLabel}>
        {label}
      </AppText>
      <AppText
        variant="label"
        numberOfLines={1}
        style={[styles.metaValue, { color: muted ? theme.textMuted : theme.text }]}>
        {value}
      </AppText>
    </View>
  );
}

function averageSpeedKmh(distanceKm: number, durationMs: number) {
  const hours = durationMs / 3_600_000;
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return distanceKm / hours;
}

export function TripDetailsSheet({ visible, trip, onClose }: TripDetailsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [fullMapOpen, setFullMapOpen] = useState(false);

  const trackViewport = useMemo(() => getTrackViewport(trip.track ?? []), [trip.track]);
  const hasTrack = Boolean(trackViewport);
  const speed = averageSpeedKmh(trip.distanceKm, trip.durationMs);

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
        closeLabel="Close commute details"
        icon="route"
        title="Commute details"
        titleStyle={styles.sheetTitle}
        subtitle={formatDateKey(toDateKey(trip.endedAt))}>
        {hasTrack ? (
          <OfflineMapCanvas
            height={MAP_HEIGHT}
            location={null}
            track={trip.track}
            status="ready"
            canAskAgain={false}
            error={null}
            onRetry={() => {}}
            onOpenSettings={() => {}}
            initialCenter={trackViewport?.center}
            initialSpanMeters={trackViewport?.span}
            showChip={false}
            showAttribution={false}
            showLocate={false}
            onExpand={() => setFullMapOpen(true)}
          />
        ) : (
          <View style={[styles.noTrack, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.noTrackIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name="route" size={16} color={theme.primary} />
            </View>
            <View style={styles.noTrackCopy}>
              <AppText variant="label">Route not recorded</AppText>
              <AppText variant="caption" tone="secondary" style={styles.noTrackText}>
                This commute was saved before routes were captured. Its fare and timing are still
                kept.
              </AppText>
            </View>
          </View>
        )}

        <View style={[styles.statStrip, { backgroundColor: theme.backgroundElement }]}>
          <DetailStat label="DISTANCE" value={formatKm(trip.distanceKm)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailStat label="DURATION" value={formatDuration(trip.durationMs)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailStat
            label="AVG SPEED"
            value={speed > 0 ? `${speed.toFixed(1)} km/h` : '—'}
            muted={speed <= 0}
          />
        </View>

        <View style={[styles.journey, { borderColor: theme.border }]}>
          <View style={styles.journeyHead}>
            <View style={[styles.journeyIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name="calendar" size={14} color={theme.primary} />
            </View>
            <View style={styles.journeyHeadCopy}>
              <AppText variant="caption" tone="muted" style={styles.journeyLabel}>
                COMMUTE DATE
              </AppText>
              <AppText variant="label" style={styles.journeyDate}>
                {formatDateKey(toDateKey(trip.endedAt))}
              </AppText>
            </View>
          </View>

          <View style={[styles.journeyDivider, { backgroundColor: theme.border }]} />

          <View style={styles.timeline}>
            <View style={[styles.timelineRail, { backgroundColor: theme.border }]} />

            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { borderColor: theme.primary }]} />
              <View style={styles.timelineCopy}>
                <AppText variant="caption" tone="muted" style={styles.journeyLabel}>
                  STARTED
                </AppText>
                <AppText variant="label">{formatClockTime(trip.startedAt)}</AppText>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              />
              <View style={styles.timelineCopy}>
                <AppText variant="caption" tone="muted" style={styles.journeyLabel}>
                  ENDED
                </AppText>
                <AppText variant="label">{formatClockTime(trip.endedAt)}</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaTile label="FARE TIER" value={trip.tier} />
          <MetaTile
            label="PLATE"
            value={trip.plateNumber ?? 'Not recorded'}
            muted={!trip.plateNumber}
          />
        </View>

        <View style={[styles.footer, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.footerIcon, { backgroundColor: theme.surface }]}>
            <Icon name="wallet" size={15} color={theme.primary} />
          </View>
          <View style={styles.footerCopy}>
            <AppText variant="caption" tone="secondary" style={styles.footerLabel}>
              TOTAL FARE
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.footerHint}>
              {trip.discountApplied ? 'SENIOR · PWD · STUDENT 20% OFF' : 'SAVED ON THIS PHONE'}
            </AppText>
          </View>
          <AppText style={[styles.footerValue, { color: theme.primary }]}>
            {formatPeso(trip.fare)}
          </AppText>
        </View>
      </BottomSheet>

      <Modal
        visible={fullMapOpen}
        animationType="fade"
        onRequestClose={() => setFullMapOpen(false)}
        statusBarTranslucent>
        <View style={[styles.fullRoot, { backgroundColor: '#EAF0E3' }]}>
          <OfflineMapCanvas
            height={windowHeight}
            location={null}
            track={trip.track}
            status="ready"
            canAskAgain={false}
            error={null}
            onRetry={() => {}}
            onOpenSettings={() => {}}
            initialCenter={trackViewport?.center}
            initialSpanMeters={trackViewport?.span}
            bottomInset={insets.bottom}
            showChip={false}
            showAttribution
            showLocate={false}
            rounded={false}
          />

          <View
            pointerEvents="box-none"
            style={[styles.fullTop, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={[styles.fullBar, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
              <View style={[styles.fullIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="route" size={15} color={theme.primary} />
              </View>

              <View style={styles.fullCopy}>
                <AppText variant="label" style={styles.fullTitle}>
                  Commute route
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.fullKicker}>
                  {formatKm(trip.distanceKm).toUpperCase()} · {formatDuration(trip.durationMs)}
                </AppText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close full screen route"
                onPress={() => setFullMapOpen(false)}
                style={({ pressed }) => [
                  styles.fullClose,
                  { backgroundColor: theme.primarySoft },
                  pressed && styles.pressed,
                ]}>
                <Icon name="close" size={16} color={theme.primary} weight="semibold" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  fullRoot: {
    flex: 1,
  },
  fullTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  fullBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.xl,
    ...(Shadows.card ?? {}),
  },
  fullIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullCopy: {
    flex: 1,
    gap: 1,
  },
  fullTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  fullKicker: {
    fontSize: 8,
    letterSpacing: 1,
  },
  fullClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  noTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
  },
  noTrackIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTrackCopy: {
    flex: 1,
    gap: 3,
  },
  noTrackText: {
    fontSize: 12,
    lineHeight: 17,
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
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.8,
  },
  journey: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  journeyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  journeyIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyHeadCopy: {
    flex: 1,
    gap: 1,
  },
  journeyLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  journeyDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  journeyDivider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.8,
  },
  timeline: {
    position: 'relative',
    gap: Spacing.md,
  },
  timelineRail: {
    position: 'absolute',
    left: 4,
    top: 12,
    bottom: 12,
    width: StyleSheet.hairlineWidth,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  timelineCopy: {
    flex: 1,
    gap: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaTile: {
    flex: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 2,
  },
  metaLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  footerIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCopy: {
    flex: 1,
    gap: 1,
  },
  footerLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  footerHint: {
    fontSize: 8,
    letterSpacing: 0.6,
  },
  footerValue: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
});
