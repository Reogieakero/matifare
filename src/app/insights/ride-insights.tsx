import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InsightBanner } from '@/components/analytics/insight-banner';
import { InsightScreen } from '@/components/analytics/insight-screen';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildInsights } from '@/lib/analytics';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

type Row = {
  icon: IconName;
  label: string;
  value: string;
  note: string;
};

export default function RideInsightsScreen() {
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

  const insights = useMemo(() => buildInsights(trips), [trips]);

  const rows: Row[] = [
    {
      icon: 'clock',
      label: 'BUSIEST HOUR',
      value: insights.busiestHour ?? '—',
      note:
        insights.busiestHourCount > 0
          ? `${insights.busiestHourCount} saved ${
              insights.busiestHourCount === 1 ? 'commute' : 'commutes'
            } started around then`
          : 'Commute times will show up here',
    },
    {
      icon: 'route',
      label: 'AVERAGE DISTANCE',
      value: formatKm(insights.avgDistanceKm),
      note: 'Distance per saved commute',
    },
    {
      icon: 'calendar',
      label: 'AVERAGE DURATION',
      value: formatDuration(insights.avgDurationMs),
      note: 'Time on the meter, on average',
    },
    {
      icon: 'wallet',
      label: 'AVERAGE FARE',
      value: formatPeso(insights.avgFare),
      note: 'What a typical ride costs',
    },
    {
      icon: 'swap',
      label: 'MOST-USED TIER',
      value: insights.topTier ?? '—',
      note: 'Your default fare tier',
    },
    {
      icon: 'car',
      label: 'MOST-RIDDEN PLATE',
      value: insights.topPlate ?? '—',
      note: insights.topPlate ? 'The tricycle you look for most' : 'No plate numbers saved yet',
    },
  ];

  return (
    <InsightScreen title="Ride insights">
      <InsightBanner
        eyebrow="ALL SAVED COMMUTES"
        value={loading ? '—' : formatPeso(insights.totalFare)}
        caption={
          loading
            ? 'Reading your saved commutes…'
            : insights.totalTrips === 0
              ? 'No saved commutes yet.'
              : `${insights.totalTrips} ${
                  insights.totalTrips === 1 ? 'commute' : 'commutes'
                } · average ${formatPeso(insights.avgFare)}`
        }
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            ...(Shadows.card ?? {}),
          },
        ]}>
        {rows.map((row, index) => (
          <View key={row.label}>
            {index > 0 ? (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            ) : null}

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
                <Icon name={row.icon} size={16} color={theme.primary} />
              </View>

              <View style={styles.rowCopy}>
                <AppText variant="caption" tone="muted" style={styles.rowLabel}>
                  {row.label}
                </AppText>
                <AppText variant="bodySmall" tone="secondary" style={styles.rowNote}>
                  {row.note}
                </AppText>
              </View>

              <AppText variant="label" numberOfLines={1} style={styles.rowValue}>
                {row.value}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      {!loading && insights.totalTrips === 0 ? (
        <View style={[styles.note, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="sparkles" size={15} color={theme.textMuted} />
          <AppText variant="bodySmall" tone="secondary" style={styles.noteText}>
            Save a commute and we will start spotting your riding patterns.
          </AppText>
        </View>
      ) : null}
    </InsightScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  rowNote: {
    fontSize: 11,
    lineHeight: 15,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '42%',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
