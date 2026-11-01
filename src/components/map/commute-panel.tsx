import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import type { FareTier } from '@/constants/fare-matrix';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import type { TripStatus } from '@/hooks/use-trip-odometer';
import type { LocationStatus } from '@/hooks/use-user-location';
import { useTheme } from '@/hooks/use-theme';
import { BASE_DISTANCE_KM, applyFareDiscount, calculateFare, formatDuration, formatPeso } from '@/lib/fare';
import { OfflineMap } from '@/lib/offline-map';

type CommutePanelProps = {
  tier: FareTier;
  onChangeTier: () => void;
  tripStatus: TripStatus;
  km: number;
  durationMs: number;
  poorSignal: boolean;
  hasFix: boolean;
  locationStatus: LocationStatus;
  /** Body/plate number entered when the trip started, if the rider shared it. */
  plateNumber?: string | null;
  /** Whether the 20% senior/PWD/student discount is applied to the fare. */
  discountApplied: boolean;
  onToggleDiscount: () => void;
  /** When collapsed, only the readout and trip action stay visible. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
  bottomInset: number;
};

function tripTitle(status: TripStatus, durationMs: number) {
  if (status === 'riding') return `Meter running · ${formatDuration(durationMs)}`;
  if (status === 'ended') return `Trip ended · ${formatDuration(durationMs)}`;
  return 'Ready when you are';
}

export function CommutePanel({
  tier,
  onChangeTier,
  tripStatus,
  km,
  durationMs,
  poorSignal,
  hasFix,
  locationStatus,
  plateNumber,
  discountApplied,
  onToggleDiscount,
  collapsed,
  onToggleCollapsed,
  onStart,
  onEnd,
  onReset,
  bottomInset,
}: CommutePanelProps) {
  const theme = useTheme();
  const detailsHeight = useSharedValue(0);
  const footerHeight = useSharedValue(0);
  const [detailsMeasured, setDetailsMeasured] = useState(false);
  const [footerMeasured, setFooterMeasured] = useState(false);
  const expandProgress = useSharedValue(collapsed ? 0 : 1);

  useEffect(() => {
    expandProgress.value = withTiming(collapsed ? 0 : 1, {
      duration: 320,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [collapsed, expandProgress]);

  const detailsStyle = useAnimatedStyle(() => ({
    height: detailsHeight.value * expandProgress.value,
    opacity: expandProgress.value,
  }));

  const footerStyle = useAnimatedStyle(() => ({
    height: footerHeight.value * expandProgress.value,
    opacity: expandProgress.value,
  }));

  const handleDetailsLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    if (next > 0 || !detailsMeasured) {
      detailsHeight.value = next;
    }
    if (next > 0 && !detailsMeasured) {
      setDetailsMeasured(true);
    }
  };

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    if (next > 0 || !footerMeasured) {
      footerHeight.value = next;
    }
    if (next > 0 && !footerMeasured) {
      setFooterMeasured(true);
    }
  };

  const fare = calculateFare(tier, km);
  const totalFare = discountApplied ? applyFareDiscount(fare.total) : fare.total;
  const discountValue = Math.max(0, fare.total - totalFare);
  const riding = tripStatus === 'riding';
  const ended = tripStatus === 'ended';

  const waitingForGps = !hasFix && (locationStatus === 'locating' || locationStatus === 'checking');
  const gpsUnavailable = !hasFix && !waitingForGps;

  const actionLabel = riding
    ? 'End trip'
    : ended
      ? 'Start new trip'
      : hasFix
        ? 'Commute now'
        : waitingForGps
          ? 'Getting GPS…'
          : 'Location off';

  const actionDisabled = !riding && !hasFix;

  const handleAction = () => {
    if (riding) {
      onEnd();
      return;
    }
    if (ended) {
      onReset();
    }
    onStart();
  };

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.surface, paddingBottom: Math.max(bottomInset, Spacing.sm) },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={collapsed ? 'Show fare details' : 'Compress fare details'}
        onPress={onToggleCollapsed}
        style={({ pressed }) => [
          styles.toggleButton,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          pressed && styles.toggleButtonPressed,
        ]}>
        <AppText variant="caption" tone="secondary" style={styles.toggleButtonText}>
          {collapsed ? 'SHOW DETAILS' : 'COMPRESS'}
        </AppText>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText
              variant="caption"
              tone="muted"
              numberOfLines={1}
              style={styles.headerKicker}>
              {plateNumber ? `COMMUTE METER · ${plateNumber}` : 'COMMUTE METER'}
            </AppText>
            <AppText variant="label" style={styles.headerTitle}>
              {tripTitle(tripStatus, durationMs)}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Fare tier ${tier.tier}, ${tier.perKm} per added kilometre. Change tier`}
            onPress={onChangeTier}
            style={({ pressed }) => [
              styles.tierChip,
              { backgroundColor: theme.primarySoft, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <Icon name="wallet" size={12} color={theme.primary} />
            <AppText variant="caption" style={[styles.tierChipText, { color: theme.primary }]}>
              {tier.tier.toUpperCase()} · {tier.perKm}/KM
            </AppText>
            <Icon name="chevron-down" size={11} color={theme.primary} weight="semibold" />
          </Pressable>
        </View>

        <View
          style={[
            styles.readout,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={styles.readoutColumn}>
            <AppText variant="caption" tone="muted" style={styles.readoutLabel}>
              DISTANCE
            </AppText>
            <View style={styles.readoutValueRow}>
              <AppText style={[styles.readoutNumber, { color: theme.text }]}>
                {km.toFixed(2)}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.readoutUnit}>
                KM
              </AppText>
            </View>
          </View>

          <View style={[styles.readoutDivider, { backgroundColor: theme.border }]} />

          <View style={styles.readoutColumn}>
            <AppText variant="caption" tone="muted" style={styles.readoutLabel}>
              {discountApplied ? 'DISCOUNTED FARE' : 'FARE SO FAR'}
            </AppText>
            <View style={styles.readoutValueRow}>
              <AppText style={[styles.readoutNumber, { color: theme.primary }]}>
                {formatPeso(totalFare)}
              </AppText>
            </View>
          </View>
        </View>

        {poorSignal ? (
          <View style={[styles.notice, { backgroundColor: theme.yellowSoft }]}>
            <Icon name="wifi-off" size={11} color={theme.yellowInk} />
            <AppText style={[styles.noticeText, { color: theme.yellowInk }]}>
              GPS SIGNAL IS WEAK — THE METER IS PAUSED UNTIL IT RECOVERS
            </AppText>
          </View>
        ) : null}

        {gpsUnavailable && !riding && !ended ? (
          <View style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
            <Icon name="location" size={11} color={theme.textMuted} />
            <AppText style={[styles.noticeText, { color: theme.textMuted }]}>
              WAITING FOR A GPS FIX BEFORE STARTING THE METER
            </AppText>
          </View>
        ) : null}

        <Animated.View
          style={[styles.collapsible, detailsMeasured && detailsStyle]}
          pointerEvents={collapsed ? 'none' : 'auto'}
          accessibilityElementsHidden={collapsed}
          importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}>
          <View style={styles.detailsInner} onLayout={handleDetailsLayout}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: discountApplied }}
              accessibilityLabel="Apply 20 percent discount for senior citizens, PWDs and students"
              accessibilityHint="Reduces the total fare by 20 percent"
              onPress={onToggleDiscount}
              style={({ pressed }) => [
                styles.discountRow,
                {
                  backgroundColor: discountApplied ? theme.primarySoft : theme.backgroundElement,
                  borderColor: discountApplied ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: discountApplied ? theme.primary : 'transparent',
                    borderColor: discountApplied ? theme.primary : theme.borderStrong,
                  },
                ]}>
                {discountApplied ? (
                  <Icon name="check" size={12} color={theme.onPrimary} weight="bold" />
                ) : null}
              </View>

              <View style={styles.discountCopy}>
                <AppText variant="label" style={styles.discountTitle}>
                  Senior citizen · PWD · Student
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.discountHint}>
                  20% OFF THE TOTAL FARE
                </AppText>
              </View>

              {discountApplied ? (
                <AppText variant="caption" style={[styles.discountAmount, { color: theme.primary }]}>
                  −{formatPeso(discountValue)}
                </AppText>
              ) : null}
            </Pressable>

            <View
              style={[
                styles.fareCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
          <View style={styles.fareCardHeader}>
            <AppText variant="caption" tone="muted" style={styles.fareCardKicker}>
              FARE BREAKDOWN
            </AppText>
            <View style={[styles.fareBadge, { backgroundColor: theme.primarySoft }]}>
              <AppText variant="caption" style={[styles.fareBadgeText, { color: theme.primary }]}>
                {tier.tier.toUpperCase()}
              </AppText>
            </View>
          </View>

          <View style={styles.fareRows}>
            <View style={styles.fareRow}>
              <View style={styles.fareRowCopy}>
                <AppText variant="bodySmall" tone="secondary" style={styles.fareRowLabel}>
                  Base fare
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.fareRowHint}>
                  FIRST {BASE_DISTANCE_KM.toFixed(1)} KM INCLUDED
                </AppText>
              </View>
              <AppText style={[styles.fareRowValue, { color: theme.text }]}>
                {formatPeso(fare.base)}
              </AppText>
            </View>

            <View style={[styles.fareRowDivider, { backgroundColor: theme.border }]} />

            <View style={styles.fareRow}>
              <View style={styles.fareRowCopy}>
                <AppText variant="bodySmall" tone="secondary" style={styles.fareRowLabel}>
                  Added distance
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.fareRowHint}>
                  {fare.billableKm > 0
                    ? `${fare.billableKm} KM × ${tier.perKm}`
                    : `NEXT KM AT ${(BASE_DISTANCE_KM + 0.01).toFixed(2)} KM`}
                </AppText>
              </View>
              <AppText
                style={[
                  styles.fareRowValue,
                  { color: fare.extra > 0 ? theme.text : theme.textMuted },
                ]}>
                {formatPeso(fare.extra)}
              </AppText>
            </View>

            {discountApplied ? (
              <>
                <View style={[styles.fareRowDivider, { backgroundColor: theme.border }]} />

                <View style={styles.fareRow}>
                  <View style={styles.fareRowCopy}>
                    <AppText variant="bodySmall" tone="secondary" style={styles.fareRowLabel}>
                      Discount
                    </AppText>
                    <AppText variant="caption" tone="muted" style={styles.fareRowHint}>
                      SENIOR · PWD · STUDENT — 20% OFF
                    </AppText>
                  </View>
                  <AppText style={[styles.fareRowValue, { color: theme.primary }]}>
                    −{formatPeso(discountValue)}
                  </AppText>
                </View>
              </>
            ) : null}
          </View>

          <View
            style={[
              styles.rateGrid,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <View style={styles.rateItem}>
              <AppText variant="caption" tone="muted" style={styles.rateLabel}>
                BASE
              </AppText>
              <AppText style={[styles.rateValue, { color: theme.text }]}>{tier.baseFare}</AppText>
              <AppText variant="caption" tone="muted" style={styles.rateHint}>
                FIRST {BASE_DISTANCE_KM.toFixed(0)} KM
              </AppText>
            </View>

            <View style={[styles.rateDivider, { backgroundColor: theme.border }]} />

            <View style={styles.rateItem}>
              <AppText variant="caption" tone="muted" style={styles.rateLabel}>
                ADDED KM
              </AppText>
              <AppText style={[styles.rateValue, { color: theme.text }]}>{tier.perKm}</AppText>
              <AppText variant="caption" tone="muted" style={styles.rateHint}>
                PER WHOLE KM
              </AppText>
            </View>

            <View style={[styles.rateDivider, { backgroundColor: theme.border }]} />

            <View style={styles.rateItem}>
              <AppText variant="caption" tone="muted" style={styles.rateLabel}>
                FUEL BAND
              </AppText>
              <AppText
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={[styles.rateValueSmall, { color: theme.text }]}>
                {tier.fuelPrice}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.rateHint}>
                SETS THE TIER
              </AppText>
            </View>
          </View>

          <View style={styles.fareFootnote}>
            <Icon name="route" size={10} color={theme.textMuted} />
            <AppText variant="caption" tone="muted" style={styles.fareFootnoteText}>
              EXTRA DISTANCE IS BILLED IN WHOLE KILOMETRES
            </AppText>
          </View>
            </View>
          </View>
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ disabled: actionDisabled }}
          disabled={actionDisabled}
          onPress={handleAction}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: actionDisabled
                ? theme.backgroundElement
                : riding
                  ? theme.danger
                  : theme.primary,
            },
            pressed && !actionDisabled && styles.pressed,
          ]}>
          <AppText
            style={[
              styles.actionText,
              {
                color: actionDisabled
                  ? theme.textMuted
                  : riding
                    ? '#FFFFFF'
                    : theme.primaryText,
              },
            ]}>
            {actionLabel}
          </AppText>
        </Pressable>
      </View>

      <Animated.View
        style={[styles.collapsible, footerMeasured && footerStyle]}
        pointerEvents={collapsed ? 'none' : 'auto'}
        accessibilityElementsHidden={collapsed}
        importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}>
        <View style={styles.footer} onLayout={handleFooterLayout}>
        <View style={styles.footerMeta}>
          <Icon name="location" size={9} color={theme.textMuted} />
          <AppText variant="caption" tone="muted" style={styles.footerText}>
            {OfflineMap.city.toUpperCase()}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted" style={styles.attribution}>
          {OfflineMap.attribution}
        </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: -Radii.lg,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
    ...(Shadows.card ?? {}),
  },
  toggleButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  toggleButtonPressed: {
    opacity: 0.65,
  },
  toggleButtonText: {
    fontSize: 8.5,
    letterSpacing: 1,
  },
  content: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 1,
  },
  headerKicker: {
    fontSize: 8,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  tierChipText: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  readoutColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  readoutDivider: {
    width: 1,
    marginVertical: 2,
  },
  readoutLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  readoutValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  readoutNumber: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  readoutUnit: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountCopy: {
    flex: 1,
    gap: 1,
  },
  discountTitle: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  discountHint: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  discountAmount: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  collapsible: {
    overflow: 'hidden',
  },
  detailsInner: {
    gap: Spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radii.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 8,
    letterSpacing: 0.7,
    lineHeight: 12,
    fontWeight: '600',
  },
  fareCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  fareCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  fareCardKicker: {
    fontSize: 8,
    letterSpacing: 1.1,
  },
  fareBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  fareBadgeText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  fareRows: {
    gap: 2,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: 5,
  },
  fareRowCopy: {
    flex: 1,
    gap: 1,
  },
  fareRowLabel: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  fareRowHint: {
    fontSize: 8,
    letterSpacing: 0.7,
  },
  fareRowValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  fareRowDivider: {
    height: StyleSheet.hairlineWidth,
  },
  rateGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  rateDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  rateLabel: {
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
  rateValue: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  rateValueSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
  rateHint: {
    fontSize: 7,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  fareFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fareFootnoteText: {
    flex: 1,
    fontSize: 7.5,
    letterSpacing: 0.6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radii.pill,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  attribution: {
    fontSize: 8,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
