import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClockTime, formatDateKey, toDateKey } from '@/lib/dates';
import { formatPeso } from '@/lib/fare';
import type { SavedTrip } from '@/lib/trips';

type DayFaresSheetProps = {
  /** `toDateKey` value for the tapped day, or null when the sheet is closed. */
  dateKey: string | null;
  trips: SavedTrip[];
  onClose: () => void;
};

/** Bottom sheet listing every saved commute for a single calendar day. */
export function DayFaresSheet({ dateKey, trips, onClose }: DayFaresSheetProps) {
  const theme = useTheme();

  const dayTrips = dateKey
    ? trips
        .filter((trip) => toDateKey(trip.endedAt) === dateKey)
        .sort((a, b) => a.startedAt - b.startedAt)
    : [];
  const total = dayTrips.reduce((sum, trip) => sum + trip.fare, 0);
  const countLabel = `${dayTrips.length} ${
    dayTrips.length === 1 ? 'commute' : 'commutes'
  }`;

  return (
    <BottomSheet
      visible={dateKey !== null}
      onClose={onClose}
      closeLabel="Close daily fare breakdown"
      icon="calendar"
      title={dateKey ? formatDateKey(dateKey) : 'Daily fares'}
      subtitle={
        dateKey
          ? dayTrips.length > 0
            ? `${countLabel} saved · ${formatPeso(total)}`
            : 'No saved commutes on this day'
          : undefined
      }
      footer={
        dayTrips.length > 0 ? (
          <View style={[styles.footer, { backgroundColor: theme.primarySoft }]}>
            <Icon name="wallet" size={15} color={theme.primary} />
            <AppText variant="caption" tone="secondary" style={styles.footerText}>
              {countLabel.toUpperCase()} · TOTAL
            </AppText>
            <AppText variant="label" style={{ color: theme.primary }}>
              {formatPeso(total)}
            </AppText>
          </View>
        ) : undefined
      }>
      {dayTrips.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="analytics" size={16} color={theme.textMuted} />
          <AppText variant="bodySmall" tone="secondary" style={styles.emptyText}>
            No rides saved for this day. Estimate a fare to start tracking.
          </AppText>
        </View>
      ) : (
        <View
          style={[
            styles.list,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          {dayTrips.map((trip, index) => (
            <View key={trip.id}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              ) : null}

              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}>
                  <Icon name="clock" size={15} color={theme.primary} />
                </View>

                <View style={styles.rowCopy}>
                  <AppText variant="label">{formatClockTime(trip.startedAt)}</AppText>
                  <AppText variant="caption" tone="muted" style={styles.rowMeta}>
                    {[
                      trip.tier.toUpperCase(),
                      `${trip.distanceKm.toFixed(1)} KM`,
                      trip.plateNumber,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>

                <View style={styles.rowValue}>
                  <AppText variant="label" style={styles.fare}>
                    {formatPeso(trip.fare)}
                  </AppText>
                  {trip.discountApplied ? (
                    <AppText variant="caption" style={[styles.discount, { color: theme.primary }]}>
                      20% OFF
                    </AppText>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  rowMeta: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  rowValue: {
    alignItems: 'flex-end',
    gap: 1,
  },
  fare: {
    fontVariant: ['tabular-nums'],
  },
  discount: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  emptyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  footerText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
});
