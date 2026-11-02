import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InsightBanner } from '@/components/analytics/insight-banner';
import { InsightScreen } from '@/components/analytics/insight-screen';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildTierMix } from '@/lib/analytics';
import { formatPeso } from '@/lib/fare';
import { loadSavedTrips, type SavedTrip } from '@/lib/trips';

export default function FareMixScreen() {
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

  const mix = useMemo(() => buildTierMix(trips), [trips]);
  const totalFare = useMemo(() => mix.reduce((sum, slice) => sum + slice.total, 0), [mix]);

  return (
    <InsightScreen title="Fare mix">
      <InsightBanner
        eyebrow="ACROSS ALL SAVED COMMUTES"
        value={loading ? '—' : formatPeso(totalFare)}
        caption={
          loading
            ? 'Reading your saved commutes…'
            : mix.length === 0
              ? 'No saved commutes yet.'
              : `${trips.length} ${trips.length === 1 ? 'commute' : 'commutes'} · ${
                  mix[0]?.tier ?? 'no tier'
                } leads your mix`
        }
      />

      {mix.length === 0 ? (
        <View style={[styles.note, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="analytics" size={15} color={theme.textMuted} />
          <AppText variant="bodySmall" tone="secondary" style={styles.noteText}>
            {loading
              ? 'Reading your saved commutes…'
              : 'No fare tiers yet. Save a commute and its tier will appear here.'}
          </AppText>
        </View>
      ) : (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
          ]}>
          {mix.map((slice, index) => (
            <View key={slice.tier} style={styles.sliceRow}>
              <View style={styles.sliceHead}>
                <View style={styles.sliceTitle}>
                  <AppText variant="label">{slice.tier}</AppText>
                  <AppText variant="caption" tone="muted" style={styles.sliceCount}>
                    {slice.count} {slice.count === 1 ? 'COMMUTE' : 'COMMUTES'}
                  </AppText>
                </View>

                <View style={styles.sliceAmount}>
                  <AppText variant="label" style={styles.sliceShare}>
                    {Math.round(slice.share * 100)}%
                  </AppText>
                  <AppText variant="caption" tone="muted" style={styles.sliceTotal}>
                    {formatPeso(slice.total)}
                  </AppText>
                </View>
              </View>

              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor:
                        index === 0 ? theme.primary : index === 1 ? theme.accent : theme.primary,
                      opacity: index > 1 ? Math.max(0.45, 0.9 - index * 0.15) : 1,
                      width: `${Math.max(slice.share * 100, 2)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </InsightScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  sliceRow: {
    gap: Spacing.sm,
  },
  sliceHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sliceTitle: {
    flex: 1,
    gap: 1,
  },
  sliceCount: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
  sliceAmount: {
    alignItems: 'flex-end',
    gap: 1,
  },
  sliceShare: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sliceTotal: {
    fontSize: 8,
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.pill,
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
