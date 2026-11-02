import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { DayFaresSheet } from '@/components/analytics/day-fares-sheet';
import { MonthCalendar } from '@/components/analytics/month-calendar';
import { TabBarClearance } from '@/components/navigation/glass-tab-bar';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Gradients, MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useColorMode, useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/dates';
import { formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

type Range = 'today' | 'week' | 'month';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
const BAR_MAX_HEIGHT = 88;

const insightLinks = [
  {
    key: 'monthly',
    href: '/insights/monthly',
    icon: 'trending-up',
    title: 'Monthly trend',
    subtitle: 'Six months of fare history',
  },
  {
    key: 'ride-insights',
    href: '/insights/ride-insights',
    icon: 'clock',
    title: 'Ride insights',
    subtitle: 'Busiest hour, averages and top plate',
  },
  {
    key: 'fare-mix',
    href: '/insights/fare-mix',
    icon: 'swap',
    title: 'Fare mix',
    subtitle: 'How your fare tiers break down',
  },
  {
    key: 'achievements',
    href: '/insights/achievements',
    icon: 'star',
    title: 'Streaks & milestones',
    subtitle: 'Discount savings and commute badges',
  },
] as const;

/** Midnight (local time) of the Monday that starts the current week. */
function startOfWeek(timestamp: number) {
  const date = new Date(timestamp);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday).getTime();
}

/** Midnight (local time) of the first day of the current month. */
function startOfMonth(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function RangeTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Show fares for ${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.rangeTab,
        active ? styles.rangeTabActive : styles.rangeTabIdle,
        pressed && styles.rangePressed,
      ]}>
      <AppText style={[styles.rangeTabText, active ? styles.rangeTabTextActive : null]}>
        {label}
      </AppText>
    </Pressable>
  );
}

function WeekBar({
  label,
  total,
  max,
  isToday,
}: {
  label: string;
  total: number;
  max: number;
  isToday: boolean;
}) {
  const theme = useTheme();
  const targetHeight = max > 0 ? Math.max((total / max) * BAR_MAX_HEIGHT, total > 0 ? 6 : 0) : 0;
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(targetHeight, {
      duration: 560,
      easing: Easing.out(Easing.cubic),
    });
  }, [height, targetHeight]);

  const fillStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.chartColumn}>
      <View style={styles.chartValueWrap}>
        {total > 0 ? (
          <AppText
            numberOfLines={1}
            style={[styles.chartValue, { color: isToday ? theme.primary : theme.textMuted }]}>
            ₱{Math.round(total)}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.chartTrack, { backgroundColor: theme.backgroundElement }]}>
        {total > 0 ? (
          <Animated.View
            style={[styles.chartBar, { backgroundImage: Gradients.brand }, fillStyle]}>
            <View style={styles.chartBarSheen} />
          </Animated.View>
        ) : (
          <View style={[styles.chartEmpty, { backgroundColor: theme.borderStrong }]} />
        )}
      </View>

      <View
        style={[
          styles.chartDayPill,
          isToday ? { backgroundColor: theme.primarySoft } : null,
        ]}>
        <AppText
          style={[
            styles.chartDay,
            { color: isToday ? theme.primary : theme.textMuted },
          ]}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorMode = useColorMode();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('today');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

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

  const weekBars = useMemo(() => {
    if (!now) return [];

    const weekStart = new Date(startOfWeek(now));

    return DAY_LABELS.map((label, index) => {
      const dayStart = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + index,
      ).getTime();
      const dayEnd = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + index + 1,
      ).getTime();

      return {
        key: toDateKey(dayStart),
        label,
        total: trips
          .filter((trip) => trip.endedAt >= dayStart && trip.endedAt < dayEnd)
          .reduce((sum, trip) => sum + trip.fare, 0),
      };
    });
  }, [now, trips]);

  const weekMax = useMemo(
    () => weekBars.reduce((max, day) => Math.max(max, day.total), 0),
    [weekBars],
  );
  const weekTotal = useMemo(
    () => weekBars.reduce((sum, day) => sum + day.total, 0),
    [weekBars],
  );

  const rangeStats = useMemo(() => {
    if (!now) return { trips: 0, total: 0, savings: 0, discounted: 0 };

    const todayKey = toDateKey(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const matching = trips.filter((trip) => {
      if (range === 'today') return toDateKey(trip.endedAt) === todayKey;
      if (range === 'week') return trip.endedAt >= weekStart;
      return trip.endedAt >= monthStart;
    });

    let savings = 0;
    let discounted = 0;

    for (const trip of matching) {
      if (trip.discountApplied) {
        discounted += 1;
        // Fares are stored after the 20% discount, so `fare / 0.8 - fare` is what was saved.
        savings += trip.fare * 0.25;
      }
    }

    return {
      trips: matching.length,
      total: matching.reduce((sum, trip) => sum + trip.fare, 0),
      savings,
      discounted,
    };
  }, [now, range, trips]);

  const summary = { total: rangeStats.total, count: rangeStats.trips };

  const rangeNote =
    range === 'today' ? 'TODAY' : range === 'week' ? 'MONDAY TO SUNDAY' : 'THIS MONTH';
  const rangeTotalNote = range === 'today' ? 'TODAY' : range === 'week' ? 'THIS WEEK' : 'THIS MONTH';

  const rangeCards = [
    {
      key: 'discounted',
      label: 'DISCOUNTED',
      value: formatPeso(rangeStats.savings),
      note:
        rangeStats.discounted > 0
          ? `${rangeStats.discounted} ${rangeStats.discounted === 1 ? 'TRIP' : 'TRIPS'} · 20% OFF`
          : 'NO DISCOUNTS YET',
      icon: 'star' as const,
    },
    {
      key: 'trips',
      label: 'TRIPS',
      value: String(rangeStats.trips),
      note: rangeNote,
      icon: 'trips' as const,
    },
    {
      key: 'total',
      label: 'TOTAL SPENT',
      value: formatPeso(rangeStats.total),
      note: rangeTotalNote,
      icon: 'wallet' as const,
    },
    {
      key: 'average',
      label: 'AVG. FARE',
      value: formatPeso(rangeStats.trips > 0 ? rangeStats.total / rangeStats.trips : 0),
      note: 'PER COMMUTE',
      icon: 'trending-up' as const,
    },
  ];
  const reportEyebrow =
    range === 'today' ? "TODAY'S REPORT" : range === 'week' ? 'WEEKLY REPORT' : 'MONTHLY REPORT';
  const reportHint =
    range === 'today' ? 'TODAY' : range === 'week' ? 'MON – SUN' : 'MONTH TO DATE';
  const todayIndex = now ? (new Date(now).getDay() + 6) % 7 : -1;
  const peakIndex = weekBars.reduce(
    (best, day, index) => (day.total > (weekBars[best]?.total ?? 0) ? index : best),
    0,
  );

  const rangeLabel =
    range === 'today'
      ? "TODAY'S FARES"
      : range === 'week'
        ? "THIS WEEK'S FARES"
        : "THIS MONTH'S FARES";
  const metaLabel = loading
    ? 'Adding up your saved commutes…'
    : summary.count === 0
      ? `No saved commutes ${
          range === 'today' ? 'today' : range === 'week' ? 'this week' : 'this month'
        } yet`
      : `${summary.count} ${summary.count === 1 ? 'commute' : 'commutes'} · ${
          range === 'today' ? 'today' : range === 'week' ? 'Monday to Sunday' : 'this month'
        }`;

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
        </View>

        <View style={[styles.banner, Shadows.card ?? {}]}>
          <View pointerEvents="none" style={styles.bannerGlowLarge} />
          <View pointerEvents="none" style={styles.bannerGlowSmall} />

          <View style={styles.bannerCopy}>
            <View style={styles.bannerEyeRow}>
              <View style={styles.bannerDot} />
              <AppText style={styles.bannerEyebrow}>{rangeLabel}</AppText>
            </View>

            <AppText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.bannerAmount}>
              {loading ? '—' : formatPeso(summary.total)}
            </AppText>

            <AppText style={styles.bannerMeta} numberOfLines={2}>
              {metaLabel}
            </AppText>

            <View style={styles.rangeToggle}>
              <RangeTab
                label="Today"
                active={range === 'today'}
                onPress={() => setRange('today')}
              />
              <RangeTab label="Week" active={range === 'week'} onPress={() => setRange('week')} />
              <RangeTab
                label="Month"
                active={range === 'month'}
                onPress={() => setRange('month')}
              />
            </View>
          </View>

          <Image
            source={require('@/assets/images/Cheerful Calculator Mascot with Cap.png')}
            style={styles.bannerMascot}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={styles.chartSection}>
          {range === 'month' && now ? (
            <MonthCalendar
              month={now}
              todayKey={toDateKey(now)}
              trips={trips}
              onSelectDate={setSelectedDay}
            />
          ) : (
            <>
              <View style={styles.reportHeader}>
                <AppText variant="caption" tone="muted" style={styles.reportEyebrow}>
                  THIS WEEK
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.reportHint}>
                  MON – SUN
                </AppText>
              </View>

              <View style={styles.chart}>
                {weekBars.map((day, index) => (
                  <WeekBar
                    key={day.key}
                    label={day.label}
                    total={day.total}
                    max={weekMax}
                    isToday={index === todayIndex}
                  />
                ))}
              </View>

              <View style={[styles.chartNote, { backgroundColor: theme.backgroundElement }]}>
                <Icon
                  name={weekTotal > 0 ? 'sparkles' : 'analytics'}
                  size={15}
                  color={weekTotal > 0 ? theme.primary : theme.textMuted}
                />
                <AppText variant="bodySmall" tone="secondary" style={styles.chartNoteText}>
                  {weekTotal > 0
                    ? `${DAY_NAMES[peakIndex]} is your busiest day at ${formatPeso(
                        weekBars[peakIndex]?.total ?? 0,
                      )}.`
                    : 'No rides this week yet. Estimate a fare to start tracking.'}
                </AppText>
              </View>
            </>
          )}
        </View>

        <View style={styles.report}>
          <View style={styles.reportHeader}>
            <AppText variant="caption" tone="muted" style={styles.reportEyebrow}>
              {reportEyebrow}
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.reportHint}>
              {reportHint}
            </AppText>
          </View>

          <View style={styles.statGrid}>
            {[rangeCards.slice(0, 2), rangeCards.slice(2, 4)].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.statRow}>
                {row.map((card) => (
                  <View
                    key={card.key}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        ...(Shadows.card ?? {}),
                      },
                    ]}>
                    <View style={[styles.statIcon, { backgroundColor: theme.primarySoft }]}>
                      <Icon name={card.icon} size={16} color={theme.primary} />
                    </View>

                    <AppText
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.statValue}>
                      {card.value}
                    </AppText>

                    <AppText variant="caption" tone="muted" style={styles.statLabel}>
                      {card.label}
                    </AppText>
                    <AppText variant="caption" tone="muted" style={styles.statNote}>
                      {card.note}
                    </AppText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.report}>
          <View style={styles.reportHeader}>
            <AppText variant="caption" tone="muted" style={styles.reportEyebrow}>
              MORE INSIGHTS
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.reportHint}>
              DEDICATED VIEWS
            </AppText>
          </View>

          <View
            style={[
              styles.linkCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            {insightLinks.map((link, index) => (
              <View key={link.key}>
                {index > 0 ? (
                  <View style={[styles.linkDivider, { backgroundColor: theme.border }]} />
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={link.title}
                  accessibilityHint={link.subtitle}
                  onPress={() => router.push(link.href)}
                  style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}>
                  <View style={[styles.linkIcon, { backgroundColor: theme.primarySoft }]}>
                    <Icon name={link.icon} size={16} color={theme.primary} />
                  </View>

                  <View style={styles.linkCopy}>
                    <AppText variant="label">{link.title}</AppText>
                    <AppText variant="caption" tone="muted" style={styles.linkSubtitle}>
                      {link.subtitle}
                    </AppText>
                  </View>

                  <Icon name="chevron-right" size={14} color={theme.textMuted} weight="semibold" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <DayFaresSheet
        dateKey={selectedDay}
        trips={trips}
        onClose={() => setSelectedDay(null)}
      />
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
    gap: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  banner: {
    minHeight: 158,
    borderRadius: Radii.xxl,
    padding: Spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundImage: Gradients.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  bannerGlowLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -132,
    left: -76,
  },
  bannerGlowSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -74,
    right: 96,
  },
  bannerCopy: {
    width: '62%',
    gap: Spacing.xs,
    zIndex: 1,
  },
  bannerEyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  bannerAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  bannerMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: Spacing.sm,
  },
  rangeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    padding: 3,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rangeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  rangeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  rangeTabIdle: {
    backgroundColor: 'transparent',
  },
  rangeTabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.85)',
  },
  rangeTabTextActive: {
    color: '#1D4ED8',
  },
  rangePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  bannerMascot: {
    position: 'absolute',
    right: -10,
    bottom: -8,
    width: 142,
    height: 136,
  },
  chartSection: {
    gap: Spacing.lg,
  },
  report: {
    gap: Spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportEyebrow: {
    fontSize: 9,
    letterSpacing: 1.4,
  },
  reportHint: {
    fontSize: 8,
    letterSpacing: 1.1,
  },
  statGrid: {
    gap: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    gap: 2,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  statNote: {
    fontSize: 7.5,
    letterSpacing: 0.7,
  },
  linkCard: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  linkDivider: {
    height: StyleSheet.hairlineWidth,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  linkPressed: {
    opacity: 0.72,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: {
    flex: 1,
    gap: 1,
  },
  linkSubtitle: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartValueWrap: {
    height: 14,
    justifyContent: 'flex-end',
  },
  chartValue: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chartTrack: {
    width: '100%',
    height: BAR_MAX_HEIGHT,
    borderRadius: Radii.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: Radii.sm,
    borderTopRightRadius: Radii.sm,
    overflow: 'hidden',
  },
  chartBarSheen: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  chartEmpty: {
    height: 4,
    width: '100%',
    opacity: 0.5,
  },
  chartDayPill: {
    minWidth: 24,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  chartDay: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chartNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  chartNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
