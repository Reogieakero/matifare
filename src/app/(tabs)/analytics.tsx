import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { TabBarClearance } from '@/components/navigation/glass-tab-bar';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Vehicles, formatFare } from '@/constants/app';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const stats: { label: string; value: string; icon: IconName }[] = [
  { label: 'TRIPS', value: '0', icon: 'trips' },
  { label: 'TOTAL SPENT', value: formatFare(0), icon: 'wallet' },
  { label: 'AVG. FARE', value: formatFare(0), icon: 'trending-up' },
  { label: 'SAVED', value: '0', icon: 'star' },
];

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function AnalyticsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
          <View style={[styles.rangePill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Icon name="analytics" size={13} color={theme.textMuted} />
            <AppText variant="caption" tone="secondary" style={styles.rangePillText}>
              ALL TIME
            </AppText>
          </View>
        </View>

        <View style={styles.header}>
          <AppText variant="caption" tone="muted" style={styles.eyebrow}>
            YOUR NUMBERS
          </AppText>
          <AppText variant="display">Analytics</AppText>
          <AppText variant="body" tone="secondary">
            See how your fares add up over time.
          </AppText>
        </View>

        <View style={styles.statGrid}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name={stat.icon} size={16} color={theme.primary} />
              </View>
              <AppText style={styles.statValue}>{stat.value}</AppText>
              <AppText variant="caption" tone="muted" style={styles.statLabel}>
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
          ]}>
          <View style={styles.cardHeader}>
            <View>
              <AppText variant="title">This week</AppText>
              <AppText variant="bodySmall" tone="secondary">
                Fare spend, Monday to Sunday.
              </AppText>
            </View>
            <View style={[styles.cardIcon, { backgroundColor: theme.yellowSoft }]}>
              <Icon name="analytics" size={18} color={theme.yellowInk} />
            </View>
          </View>

          <View style={styles.chart}>
            <View style={[styles.chartBaseline, { borderColor: theme.border }]} />
            {weekdays.map((day, index) => (
              <View key={`${day}-${index}`} style={styles.chartColumn}>
                <View style={[styles.chartBarTrack, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.chartBarEmpty, { backgroundColor: theme.borderStrong }]} />
                </View>
                <AppText variant="caption" tone="muted" style={styles.chartDay}>
                  {day}
                </AppText>
              </View>
            ))}
          </View>

          <View style={[styles.chartNote, { backgroundColor: theme.backgroundElement }]}>
            <Icon name="sparkles" size={15} color={theme.textMuted} />
            <AppText variant="bodySmall" tone="secondary" style={styles.chartNoteText}>
              No rides this week yet. Estimate a fare to start tracking.
            </AppText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Fare mix</AppText>
          <AppText variant="caption" tone="muted">
            0 TRIPS
          </AppText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, gap: Spacing.lg }]}>
          {Vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.mixRow}>
              <View style={[styles.mixIcon, { backgroundColor: theme.backgroundElement }]}>
                <Icon name={vehicle.icon} size={16} color={theme.textSecondary} />
              </View>
              <View style={styles.mixCopy}>
                <View style={styles.mixLabelRow}>
                  <AppText variant="label">{vehicle.label}</AppText>
                  <AppText variant="caption" tone="muted">
                    0%
                  </AppText>
                </View>
                <View style={[styles.mixTrack, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.mixFill, { backgroundColor: theme.primary, width: '0%' }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <AppButton
          label="Estimate a fare"
          icon="arrow-right"
          variant="secondary"
          onPress={() => router.navigate('/home')}
        />
      </ScrollView>
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  rangePillText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  header: {
    gap: Spacing.xs,
    marginTop: -Spacing.sm,
  },
  eyebrow: {
    letterSpacing: 1.6,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: -Spacing.sm,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.xs,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  card: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: 132,
    paddingTop: Spacing.sm,
  },
  chartBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    borderTopWidth: 1,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chartBarTrack: {
    width: '100%',
    height: 88,
    borderRadius: Radii.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarEmpty: {
    height: 3,
    width: '100%',
    opacity: 0.55,
  },
  chartDay: {
    fontSize: 9,
    letterSpacing: 0.4,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -Spacing.sm,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mixIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixCopy: {
    flex: 1,
    gap: 5,
  },
  mixLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mixTrack: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  mixFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
});
