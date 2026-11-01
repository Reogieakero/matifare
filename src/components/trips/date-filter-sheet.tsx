import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MONTHS_LONG,
  WEEKDAYS,
  buildMonthMatrix,
  dateKeyFromParts,
  formatDateKey,
  shiftMonth,
  toDateKey,
} from '@/lib/dates';

type DateFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  selectedDate: string | null;
  /** Days (as `toDateKey` values) that have at least one saved commute. */
  markedDates: ReadonlySet<string>;
  onSelectDate: (dateKey: string | null) => void;
};

function viewFor(dateKey: string | null) {
  const source = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
  const valid = !Number.isNaN(source.getTime());
  const base = valid ? source : new Date();
  return { year: base.getFullYear(), month: base.getMonth() };
}

export function DateFilterSheet({
  visible,
  onClose,
  selectedDate,
  markedDates,
  onSelectDate,
}: DateFilterSheetProps) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [view, setView] = useState(() => viewFor(selectedDate));

  const progress = useSharedValue(1);
  const monthKey = `${view.year}-${view.month}`;
  const [todayKey] = useState(() => toDateKey(Date.now()));

  // Soft fade/slide whenever the visible month changes.
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 180 });
  }, [monthKey, progress]);

  const gridStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  const cells = buildMonthMatrix(view.year, view.month);

  const choose = (dateKey: string) => {
    onSelectDate(dateKey);
    sheetRef.current?.close();
  };

  const clear = () => {
    onSelectDate(null);
    sheetRef.current?.close();
  };

  const changeMonth = (delta: number) => {
    setView((current) => shiftMonth(current.year, current.month, delta));
  };

  return (
    <BottomSheet
      ref={sheetRef}
      visible={visible}
      onClose={onClose}
      closeLabel="Close date picker"
      icon="calendar"
      title="Filter by date"
      titleStyle={styles.sheetTitle}
      subtitle="Pick a day to see the commutes you saved."
      footer={
        <View style={[styles.footer, { backgroundColor: theme.primarySoft }]}>
          <Icon name="calendar" size={15} color={theme.primary} />
          <AppText variant="caption" tone="secondary" style={styles.footerText}>
            {selectedDate
              ? `SHOWING ${formatDateKey(selectedDate).toUpperCase()}`
              : 'SHOWING ALL SAVED COMMUTES'}
          </AppText>
          {selectedDate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear date filter"
              onPress={clear}
              hitSlop={8}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <AppText variant="caption" style={{ color: theme.primary }}>
                RESET
              </AppText>
            </Pressable>
          ) : null}
        </View>
      }>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => changeMonth(-1)}
          style={({ pressed }) => [
            styles.monthButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <Icon name="chevron-left" size={15} color={theme.primary} weight="semibold" />
        </Pressable>

        <AppText variant="subtitle" style={styles.monthLabel}>
          {MONTHS_LONG[view.month]} {view.year}
        </AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => changeMonth(1)}
          style={({ pressed }) => [
            styles.monthButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <Icon name="chevron-right" size={15} color={theme.primary} weight="semibold" />
        </Pressable>
      </View>

      <Animated.View style={[styles.grid, gridStyle]}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((weekday, index) => (
            <View key={`${weekday}-${index}`} style={styles.cell}>
              <AppText variant="caption" tone="muted" style={styles.weekday}>
                {weekday}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.days}>
          {cells.map((day, index) => {
            if (day == null) {
              return <View key={`blank-${index}`} style={styles.cell} />;
            }

            const dateKey = dateKeyFromParts(view.year, view.month, day);
            const selected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            const marked = markedDates.has(dateKey);

            return (
              <Pressable
                key={dateKey}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${formatDateKey(dateKey)}${marked ? ', has saved commutes' : ''}`}
                onPress={() => choose(dateKey)}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: selected ? theme.primary : 'transparent',
                      borderColor: isToday && !selected ? theme.borderStrong : 'transparent',
                    },
                  ]}>
                  <AppText
                    variant="label"
                    style={[
                      styles.dayText,
                      { color: selected ? theme.onPrimary : theme.text },
                      marked && !selected && { color: theme.primary },
                    ]}>
                    {day}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: marked
                        ? selected
                          ? theme.onPrimary
                          : theme.primary
                        : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: theme.primary }]} />
        <AppText variant="caption" tone="muted" style={styles.legendText}>
          DAYS WITH COMMUTES
        </AppText>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  monthButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  grid: {
    gap: Spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    gap: 2,
  },
  weekday: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -Spacing.xs,
  },
  legendText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  footerText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
