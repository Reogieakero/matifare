import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MONTHS_LONG,
  WEEKDAYS,
  buildMonthMatrix,
  dateKeyFromParts,
  formatDateKey,
  toDateKey,
} from '@/lib/dates';
import { formatPeso } from '@/lib/fare';
import type { SavedTrip } from '@/lib/trips';

type MonthCalendarProps = {
  /** Any timestamp inside the month to display. */
  month: number;
  /** `toDateKey` value for today, used for the highlight ring. */
  todayKey: string;
  trips: SavedTrip[];
  onSelectDate: (dateKey: string) => void;
};

/** Month grid with a dot under every day that has at least one saved commute. */
export function MonthCalendar({ month, todayKey, trips, onSelectDate }: MonthCalendarProps) {
  const theme = useTheme();
  const date = new Date(month);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const cells = buildMonthMatrix(year, monthIndex);

  const marks = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();

    for (const trip of trips) {
      const key = toDateKey(trip.endedAt);
      const mark = map.get(key) ?? { count: 0, total: 0 };
      mark.count += 1;
      mark.total += trip.fare;
      map.set(key, mark);
    }

    return map;
  }, [trips]);

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <AppText variant="subtitle" style={styles.monthLabel}>
          {MONTHS_LONG[monthIndex]} {year}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.monthHint}>
          TAP A DAY
        </AppText>
      </View>

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

          const dateKey = dateKeyFromParts(year, monthIndex, day);
          const mark = marks.get(dateKey);
          const isToday = dateKey === todayKey;

          return (
            <Pressable
              key={dateKey}
              accessibilityRole="button"
              accessibilityLabel={
                mark
                  ? `${formatDateKey(dateKey)}, ${mark.count} ${
                      mark.count === 1 ? 'commute' : 'commutes'
                    }, ${formatPeso(mark.total)}`
                  : `${formatDateKey(dateKey)}, no saved commutes`
              }
              onPress={() => onSelectDate(dateKey)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
              <View
                style={[
                  styles.dayCircle,
                  {
                    borderColor: isToday ? theme.primary : 'transparent',
                    backgroundColor: isToday ? theme.primarySoft : 'transparent',
                  },
                ]}>
                <AppText
                  variant="label"
                  style={[
                    styles.dayText,
                    { color: mark ? theme.primary : theme.text },
                    isToday && { fontWeight: '800' },
                  ]}>
                  {day}
                </AppText>
              </View>

              <View
                style={[
                  styles.dot,
                  { backgroundColor: mark ? theme.primary : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
        <AppText variant="caption" tone="muted" style={styles.legendText}>
          DOT = SAVED COMMUTE
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  monthHint: {
    fontSize: 8,
    letterSpacing: 1.1,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
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
    justifyContent: 'center',
    gap: 6,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.7,
  },
});
