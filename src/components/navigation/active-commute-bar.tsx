import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTripSession } from '@/hooks/use-trip-session';
import { formatDuration, formatKm, formatPeso } from '@/lib/fare';

/** Screens that already show the full meter, or that should stay immersive. */
const HIDDEN_ROUTES = ['/map', '/onboarding', '/index'];
const TAB_ROUTES = ['/home', '/trips', '/analytics', '/me'];

/**
 * Persistent snack bar shown whenever a commute is being metered. It lets the
 * rider jump back to the map or end the ride from anywhere, and it never hides
 * on its own — tracking continues until the rider decides to stop.
 */
export function ActiveCommuteBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { status, km, durationMs, fare, endTrip } = useTripSession();

  const ended = status === 'ended';
  const hidden =
    (status !== 'riding' && !ended) ||
    HIDDEN_ROUTES.includes(pathname) ||
    pathname.startsWith('/snapshot');

  if (hidden) return null;

  const onTabScreen = TAB_ROUTES.includes(pathname);
  const bottom = onTabScreen
    ? Math.max(insets.bottom, 10) + 84
    : insets.bottom + Spacing.lg;

  const openMeter = () => {
    router.navigate('/map');
  };

  const endCommute = () => {
    if (ended) {
      openMeter();
      return;
    }
    endTrip();
    router.navigate('/map');
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(260).springify().damping(20)}
      exiting={FadeOutDown.duration(160)}
      pointerEvents="box-none"
      style={[styles.host, { bottom }]}>
      <View style={styles.hostInner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ended ? 'Trip ended, not saved yet' : 'Commute meter running'}, ${formatKm(
            km,
          )}, ${formatDuration(durationMs)}, ${formatPeso(fare)}. Open the commute meter`}
          onPress={openMeter}
          style={({ pressed }) => [
            styles.bar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              ...(Shadows.card ?? {}),
            },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
            <Icon name="route" size={15} color={theme.primary} weight="semibold" />
          </View>

          <View style={styles.copy}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: ended ? theme.danger : theme.primary },
                ]}
              />
              <AppText variant="caption" tone="muted" style={styles.kicker}>
                {ended ? 'TRIP ENDED · NOT SAVED' : 'COMMUTE METER · LIVE'}
              </AppText>
            </View>
            <AppText variant="label" numberOfLines={1} style={styles.readout}>
              {formatDuration(durationMs)} · {formatKm(km)} ·{' '}
              <AppText variant="label" tone="primary">
                {formatPeso(fare)}
              </AppText>
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ended ? 'Save this trip' : 'End commute'}
            accessibilityHint={
              ended
                ? 'Opens the save prompt for the finished trip'
                : 'Stops metering and opens the save prompt'
            }
            onPress={endCommute}
            style={({ pressed }) => [
              styles.endButton,
              { backgroundColor: ended ? theme.primary : theme.danger },
              pressed && styles.endPressed,
            ]}>
            <AppText variant="caption" style={styles.endText}>
              {ended ? 'SAVE' : 'END'}
            </AppText>
          </Pressable>

          <Icon name="chevron-right" size={14} color={theme.textMuted} weight="semibold" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  hostInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.xl,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  kicker: {
    fontSize: 7.5,
    letterSpacing: 1,
  },
  readout: {
    fontSize: 12.5,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  endButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 30,
    borderRadius: Radii.pill,
  },
  endPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  endText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
