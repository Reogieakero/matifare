import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { FareMatrix, type FareTier } from '@/constants/fare-matrix';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FareTierPickerProps = {
  selectedTierId: number;
  onSelect: (tier: FareTier) => void;
};

export function FareTierPicker({ selectedTierId, onSelect }: FareTierPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected =
    FareMatrix.find((tier) => tier.id === selectedTierId) ?? FareMatrix[0];

  const chooseTier = (tier: FareTier) => {
    onSelect(tier);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            ...(Shadows.card ?? {}),
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fuel tier ${selected.tier}, ${selected.fuelPrice} per liter`}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
          <View style={[styles.iconBadge, { backgroundColor: theme.primarySoft }]}>
            <Icon name="wallet" size={17} color={theme.primary} />
          </View>

          <View style={styles.copy}>
            <AppText variant="caption" tone="muted" style={styles.eyebrow}>
              FUEL TIER
            </AppText>
            <View style={styles.tierLine}>
              <AppText variant="label" style={styles.tierName}>
                {selected.tier}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.fuelRange}>
                {selected.fuelPrice} / L
              </AppText>
            </View>
            <AppText variant="caption" tone="secondary" style={styles.ratesLine}>
              BASE {selected.baseFare} · +{selected.perKm}/KM
            </AppText>
          </View>

          <View
            style={[
              styles.chevron,
              {
                backgroundColor: theme.backgroundElement,
                transform: [{ rotate: open ? '180deg' : '0deg' }],
              },
            ]}>
            <Icon name="chevron-down" size={15} color={theme.textSecondary} />
          </View>
        </Pressable>

        {open ? (
          <Animated.View
            entering={FadeInDown.duration(160)}
            style={[
              styles.dropdown,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...(Shadows.card ?? {}),
              },
            ]}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.dropdownScroll}>
              {FareMatrix.map((tier) => {
                const active = tier.id === selected.id;
                return (
                  <Pressable
                    key={tier.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${tier.tier}, ${tier.fuelPrice} per liter, ${tier.baseFare} base, ${tier.perKm} per added km`}
                    onPress={() => chooseTier(tier)}
                    style={({ pressed }) => [
                      styles.option,
                      active && { backgroundColor: theme.primarySoft },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.optionCopy}>
                      <AppText variant="label">{tier.tier}</AppText>
                      <AppText variant="caption" tone="muted" style={styles.optionRange}>
                        {tier.fuelPrice} / L
                      </AppText>
                    </View>
                    <AppText variant="caption" tone="secondary" style={styles.optionRates}>
                      {tier.baseFare} BASE · +{tier.perKm}/KM
                    </AppText>
                    {active ? <Icon name="check" size={15} color={theme.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : null}
      </View>

      {open ? <View style={styles.scrollSpacer} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 20,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    zIndex: 21,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1,
  },
  tierLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tierName: {
    fontSize: 15,
  },
  fuelRange: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  ratesLine: {
    fontSize: 8,
    letterSpacing: 0.6,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 64,
    left: Spacing.md,
    right: Spacing.md,
    maxHeight: 300,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    zIndex: 30,
    elevation: 12,
  },
  dropdownScroll: {
    maxHeight: 288,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  optionCopy: {
    flex: 1,
    gap: 1,
  },
  optionRange: {
    fontSize: 9,
  },
  optionRates: {
    fontSize: 8,
    letterSpacing: 0.4,
  },
  scrollSpacer: {
    height: 300,
  },
});
