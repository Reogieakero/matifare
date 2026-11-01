import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { TabBarClearance } from '@/components/navigation/glass-tab-bar';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppConfig } from '@/constants/app';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resetOnboarding } from '@/lib/onboarding';

type SettingRow = {
  icon: IconName;
  label: string;
  detail: string;
};

const settingRows: SettingRow[] = [
  { icon: 'location', label: 'Saved places', detail: 'Home, work and more' },
  { icon: 'wallet', label: 'Payment methods', detail: 'No cards saved' },
  { icon: 'bell', label: 'Notifications', detail: 'Trip reminders and offers' },
  { icon: 'shield', label: 'Help & support', detail: 'FAQs and contact' },
  { icon: 'sparkles', label: 'About Tripede', detail: `Version ${AppConfig.version}` },
];

export default function MeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const openComingSoon = (label: string) => {
    Alert.alert(label, 'This section is coming soon.');
  };

  const replayOnboarding = async () => {
    await resetOnboarding();
    router.replace('/onboarding');
  };

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
          <View style={[styles.localPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Icon name="lock" size={12} color={theme.textMuted} />
            <AppText variant="caption" tone="secondary" style={styles.localPillText}>
              LOCAL PROFILE
            </AppText>
          </View>
        </View>

        <View style={styles.header}>
          <AppText variant="caption" tone="muted" style={styles.eyebrow}>
            YOUR ACCOUNT
          </AppText>
          <AppText variant="display">Me</AppText>
          <AppText variant="body" tone="secondary">
            Preferences and everything else in one place.
          </AppText>
        </View>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
          ]}>
          <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
            <Icon name="person" size={28} color={theme.primary} />
          </View>
          <View style={styles.profileCopy}>
            <AppText variant="title">Guest rider</AppText>
            <AppText variant="bodySmall" tone="secondary">
              Your data stays on this device.
            </AppText>
          </View>
          <View style={[styles.memberPill, { backgroundColor: theme.yellowSoft }]}>
            <AppText variant="caption" style={[styles.memberPillText, { color: theme.yellowInk }]}>
              TRIPEDE
            </AppText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Settings</AppText>
        </View>

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
          ]}>
          {settingRows.map((row, index) => (
            <Pressable
              key={row.label}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              onPress={() => openComingSoon(row.label)}
              style={({ pressed }) => [
                styles.row,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
                <Icon name={row.icon} size={17} color={theme.textSecondary} />
              </View>
              <View style={styles.rowCopy}>
                <AppText variant="label">{row.label}</AppText>
                <AppText variant="caption" tone="muted" style={styles.rowDetail}>
                  {row.detail.toUpperCase()}
                </AppText>
              </View>
              <Icon name="chevron-right" size={16} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replay welcome tour"
          onPress={replayOnboarding}
          style={({ pressed }) => [
            styles.replayCard,
            { backgroundColor: theme.primarySoft, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.rowIcon, { backgroundColor: theme.surface }]}>
            <Icon name="sparkles" size={17} color={theme.primary} />
          </View>
          <View style={styles.rowCopy}>
            <AppText variant="label" tone="primary">
              Replay welcome tour
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.rowDetail}>
              SEE HOW TRIPEDE WORKS
            </AppText>
          </View>
          <Icon name="arrow-right" size={16} color={theme.primary} />
        </Pressable>

        <View style={styles.footer}>
          <AppText variant="caption" tone="muted" align="center" style={styles.footerText}>
            {AppConfig.name.toUpperCase()} v{AppConfig.version} · ESTIMATES ARE INDICATIVE
          </AppText>
        </View>
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
  localPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  localPillText: {
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  memberPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  memberPillText: {
    fontSize: 8,
    letterSpacing: 1,
  },
  sectionHeader: {
    marginBottom: -Spacing.sm,
  },
  listCard: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowDetail: {
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  replayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 0.9,
  },
});
