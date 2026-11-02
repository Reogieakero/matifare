import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { InsightBanner } from '@/components/analytics/insight-banner';
import { InsightScreen } from '@/components/analytics/insight-screen';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildMonthBars } from '@/lib/analytics';
import { formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

const BAR_MAX_HEIGHT = 132;

function MonthBarView({
  label,
  total,
  max,
  isCurrent,
}: {
  label: string;
  total: number;
  max: number;
  isCurrent: boolean;
}) {
  const theme = useTheme();
  const target = max > 0 ? Math.max((total / max) * BAR_MAX_HEIGHT, total > 0 ? 6 : 0) : 0;
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(target, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [height, target]);

  const fillStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.barColumn}>
      <View style={styles.barValueWrap}>
        {total > 0 ? (
          <AppText
            numberOfLines={1}
            style={[styles.barValue, { color: isCurrent ? theme.primary : theme.textMuted }]}>
            ₱{Math.round(total)}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
        {total > 0 ? (
          <Animated.View style={[styles.barFill, fillStyle]}>
            <View style={styles.barSheen} />
          </Animated.View>
        ) : (
          <View style={[styles.barEmpty, { backgroundColor: theme.borderStrong }]} />
        )}
      </View>

      <View
        style={[
          styles.barLabelPill,
          isCurrent ? { backgroundColor: theme.primarySoft } : null,
        ]}>
        <AppText
          style={[
            styles.barLabel,
            { color: isCurrent ? theme.primary : theme.textMuted },
          ]}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

export default function MonthlyTrendScreen() {
  const theme = useTheme();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setNow(Date.now());

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

  const bars = useMemo(() => (now ? buildMonthBars(trips, now, 6) : []), [now, trips]);
  const max = useMemo(() => bars.reduce((value, bar) => Math.max(value, bar.total), 0), [bars]);
  const total = useMemo(() => bars.reduce((sum, bar) => sum + bar.total, 0), [bars]);
  const count = useMemo(() => bars.reduce((sum, bar) => sum + bar.count, 0), [bars]);
  const best = useMemo(
    () => bars.reduce((winner, bar) => (bar.total > winner.total ? bar : winner), bars[0]),
    [bars],
  );
  const activeMonths = bars.filter((bar) => bar.count > 0).length;
  const currentKey = bars.length > 0 ? bars[bars.length - 1].key : '';

  return (
    <InsightScreen title="Monthly trend">
      <InsightBanner
        eyebrow="LAST 6 MONTHS"
        value={loading ? '—' : formatPeso(total)}
        caption={
          loading
            ? 'Adding up your saved commutes…'
            : count === 0
              ? 'No saved commutes yet.'
              : `${count} ${count === 1 ? 'commute' : 'commutes'} across ${activeMonths} ${
                  activeMonths === 1 ? 'month' : 'months'
                }`
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
        <View style={styles.chart}>
          {bars.map((bar) => (
            <MonthBarView
              key={bar.key}
              label={bar.label}
              total={bar.total}
              max={max}
              isCurrent={bar.key === currentKey}
            />
          ))}
        </View>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard
          icon="star"
          label="BEST MONTH"
          value={best && best.total > 0 ? best.label : '—'}
          note={best && best.total > 0 ? formatPeso(best.total) : 'No fares yet'}
        />
        <SummaryCard
          icon="analytics"
          label="AVG. PER MONTH"
          value={formatPeso(total / 6)}
          note="Across six months"
        />
      </View>

      <SummaryCard
        icon="calendar"
        label="ACTIVE MONTHS"
        value={String(activeMonths)}
        note={`${count} saved ${count === 1 ? 'commute' : 'commutes'}`}
        full
      />

      {!loading && count === 0 ? (
        <View style={[styles.note, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="sparkles" size={15} color={theme.textMuted} />
          <AppText variant="bodySmall" tone="secondary" style={styles.noteText}>
            Estimate and save a commute to start building your monthly history.
          </AppText>
        </View>
      ) : null}
    </InsightScreen>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
  full,
}: {
  icon: 'star' | 'analytics' | 'calendar';
  label: string;
  value: string;
  note: string;
  full?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        full ? styles.summaryCardFull : styles.summaryCardHalf,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...(Shadows.card ?? {}),
        },
      ]}>
      <View style={[styles.summaryIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={14} color={theme.primary} />
      </View>

      <AppText variant="caption" tone="muted" style={styles.summaryLabel}>
        {label}
      </AppText>
      <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.summaryValue}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted" style={styles.summaryNote}>
        {note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barValueWrap: {
    height: 14,
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    width: '100%',
    height: BAR_MAX_HEIGHT,
    borderRadius: Radii.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: Radii.sm,
    borderTopRightRadius: Radii.sm,
    backgroundColor: '#2563EB',
    overflow: 'hidden',
  },
  barSheen: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  barEmpty: {
    height: 4,
    width: '100%',
    opacity: 0.5,
  },
  barLabelPill: {
    minWidth: 30,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  barLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryCard: {
    gap: 2,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  summaryCardHalf: {
    flex: 1,
  },
  summaryCardFull: {
    width: '100%',
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  summaryNote: {
    fontSize: 8.5,
    letterSpacing: 0.6,
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
