import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InsightScreen } from '@/components/analytics/insight-screen';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildStreaks, discountSavings } from '@/lib/analytics';
import { formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

type Badge = {
  key: string;
  icon: IconName;
  label: string;
  detail: string;
  unlocked: boolean;
};

type BadgeGroup = {
  title: string;
  badges: Badge[];
};

export default function AchievementsScreen() {
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

  const streaks = useMemo(() => (now ? buildStreaks(trips, now) : { current: 0, best: 0 }), [now, trips]);
  const savings = useMemo(() => discountSavings(trips), [trips]);
  const totalTrips = trips.length;

  const groups: BadgeGroup[] = [
    {
      title: 'COMMUTE MILESTONES',
      badges: [1, 5, 10, 25, 50, 100].map((target) => ({
        key: `trips-${target}`,
        icon: 'trips',
        label: `${target} ${target === 1 ? 'ride' : 'rides'}`,
        detail: totalTrips >= target ? 'Unlocked' : `${totalTrips}/${target}`,
        unlocked: totalTrips >= target,
      })),
    },
    {
      title: 'DISCOUNT SAVINGS',
      badges: [20, 50, 100, 250].map((target) => ({
        key: `savings-${target}`,
        icon: 'wallet',
        label: formatPeso(target),
        detail: savings >= target ? 'Unlocked' : `${formatPeso(savings)} saved`,
        unlocked: savings >= target,
      })),
    },
    {
      title: 'STREAKS',
      badges: [3, 7, 14, 30].map((target) => ({
        key: `streak-${target}`,
        icon: 'sparkles',
        label: `${target} days`,
        detail: streaks.best >= target ? 'Unlocked' : `Best ${streaks.best}`,
        unlocked: streaks.best >= target,
      })),
    },
  ];

  const allBadges = groups.flatMap((group) => group.badges);
  const unlocked = allBadges.filter((badge) => badge.unlocked).length;

  return (
    <InsightScreen title="Streaks & milestones">
      <View
        style={[
          styles.streakCard,
          Shadows.card ?? {},
        ]}>
        <View pointerEvents="none" style={styles.streakGlow} />

        <View style={styles.streakCopy}>
          <AppText style={styles.streakEyebrow}>CURRENT STREAK</AppText>
          <View style={styles.streakValueRow}>
            <AppText style={styles.streakValue}>{loading ? '—' : streaks.current}</AppText>
            <AppText style={styles.streakUnit}>
              {streaks.current === 1 ? 'day' : 'days'}
            </AppText>
          </View>
          <AppText style={styles.streakNote}>
            {streaks.current > 0
              ? 'Keep commuting to grow your streak.'
              : 'Save a commute today to start a streak.'}
          </AppText>
        </View>

        <View style={styles.streakBest}>
          <Icon name="star" size={13} color="rgba(255,255,255,0.8)" />
          <AppText style={styles.streakBestValue}>{loading ? '—' : streaks.best}</AppText>
          <AppText style={styles.streakBestLabel}>BEST</AppText>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
          ]}>
          <AppText style={styles.summaryValue}>{loading ? '—' : String(totalTrips)}</AppText>
          <AppText variant="caption" tone="muted" style={styles.summaryLabel}>
            SAVED COMMUTES
          </AppText>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
          ]}>
          <AppText
            numberOfLines={1}
            adjustsFontSizeToFit
            style={styles.summaryValue}>
            {loading ? '—' : formatPeso(savings)}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.summaryLabel}>
            DISCOUNT SAVED
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            ...(Shadows.card ?? {}),
          },
        ]}>
        <View style={styles.progressHead}>
          <AppText variant="caption" tone="muted" style={styles.progressLabel}>
            BADGES UNLOCKED
          </AppText>
          <AppText variant="label" style={styles.progressValue}>
            {unlocked}/{allBadges.length}
          </AppText>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.primary,
                width: `${allBadges.length > 0 ? (unlocked / allBadges.length) * 100 : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <AppText variant="caption" tone="muted" style={styles.groupTitle}>
            {group.title}
          </AppText>

          <View style={styles.badgeGrid}>
            {[group.badges.slice(0, 3), group.badges.slice(3, 6), group.badges.slice(6, 9)]
              .filter((row) => row.length > 0)
              .map((row, rowIndex) => (
                <View key={rowIndex} style={styles.badgeRow}>
                  {row.map((badge) => (
                    <BadgeCard key={badge.key} badge={badge} />
                  ))}
                  {Array.from({ length: 3 - row.length }, (_, index) => (
                    <View key={`spacer-${index}`} style={styles.badgeSpacer} />
                  ))}
                </View>
              ))}
          </View>
        </View>
      ))}
    </InsightScreen>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badge.unlocked ? theme.primarySoft : theme.surface,
          borderColor: badge.unlocked ? 'transparent' : theme.border,
        },
      ]}>
      <View
        style={[
          styles.badgeIcon,
          {
            backgroundColor: badge.unlocked ? theme.primary : theme.backgroundElement,
          },
        ]}>
        <Icon
          name={badge.unlocked ? badge.icon : 'lock'}
          size={15}
          color={badge.unlocked ? theme.onPrimary : theme.textMuted}
        />
      </View>

      <AppText
        variant="label"
        numberOfLines={1}
        style={[styles.badgeLabel, { color: badge.unlocked ? theme.primary : theme.text }]}>
        {badge.label}
      </AppText>
      <AppText variant="caption" tone="muted" style={styles.badgeDetail}>
        {badge.detail}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.xxl,
    padding: Spacing.xl,
    overflow: 'hidden',
    backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #16307A 100%)',
  },
  streakGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -110,
    right: -60,
  },
  streakCopy: {
    flex: 1,
    gap: 2,
  },
  streakEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakValue: {
    color: '#FFFFFF',
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -1.6,
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
  },
  streakNote: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    lineHeight: 16,
  },
  streakBest: {
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  streakBestValue: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  streakBestLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 8,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    gap: 2,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  summaryValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 8.5,
    letterSpacing: 1,
  },
  progressCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 9,
    letterSpacing: 1.1,
  },
  progressValue: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  group: {
    gap: Spacing.sm,
  },
  groupTitle: {
    fontSize: 9,
    letterSpacing: 1.3,
  },
  badgeGrid: {
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badgeSpacer: {
    flex: 1,
  },
  badge: {
    flex: 1,
    gap: 3,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeDetail: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
});
