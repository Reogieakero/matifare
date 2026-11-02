import { MONTHS, toDateKey } from '@/lib/dates';
import type { SavedTrip } from '@/lib/trips';

/** Local midnight for a timestamp. */
export function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Local midnight of the Monday that starts the week containing `timestamp`. */
export function startOfWeek(timestamp: number) {
  const date = new Date(timestamp);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday).getTime();
}

export function formatHour(hour: number) {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

export function discountSavings(trips: SavedTrip[]) {
  return trips.reduce(
    (sum, trip) => (trip.discountApplied ? sum + trip.fare * 0.25 : sum),
    0,
  );
}

export type DayBar = {
  key: string;
  label: string;
  total: number;
  count: number;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Per-day fares for the week containing `now`, Monday first. */
export function buildWeekBars(trips: SavedTrip[], now: number): DayBar[] {
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
    const dayTrips = trips.filter((trip) => trip.endedAt >= dayStart && trip.endedAt < dayEnd);

    return {
      key: toDateKey(dayStart),
      label,
      total: dayTrips.reduce((sum, trip) => sum + trip.fare, 0),
      count: dayTrips.length,
    };
  });
}

export type MonthBar = {
  key: string;
  label: string;
  total: number;
  count: number;
};

/** Fares for the last `months` calendar months, oldest first. */
export function buildMonthBars(trips: SavedTrip[], now: number, months = 6): MonthBar[] {
  const date = new Date(now);
  const bars: MonthBar[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(date.getFullYear(), date.getMonth() - offset, 1);
    const monthStart = monthDate.getTime();
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      1,
    ).getTime();
    const monthTrips = trips.filter(
      (trip) => trip.endedAt >= monthStart && trip.endedAt < monthEnd,
    );

    bars.push({
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      label: MONTHS[monthDate.getMonth()],
      total: monthTrips.reduce((sum, trip) => sum + trip.fare, 0),
      count: monthTrips.length,
    });
  }

  return bars;
}

export type TierSlice = {
  tier: string;
  count: number;
  total: number;
  share: number;
};

/** Trip counts and fare totals grouped by fare tier. */
export function buildTierMix(trips: SavedTrip[]): TierSlice[] {
  const map = new Map<string, TierSlice>();

  for (const trip of trips) {
    const slice = map.get(trip.tier) ?? { tier: trip.tier, count: 0, total: 0, share: 0 };
    slice.count += 1;
    slice.total += trip.fare;
    map.set(trip.tier, slice);
  }

  const total = trips.length || 1;

  return [...map.values()]
    .map((slice) => ({ ...slice, share: slice.count / total }))
    .sort((a, b) => b.count - a.count);
}

export type Insights = {
  busiestHour: string | null;
  busiestHourCount: number;
  avgDistanceKm: number;
  avgDurationMs: number;
  avgFare: number;
  topTier: string | null;
  topPlate: string | null;
  totalTrips: number;
  totalFare: number;
};

/** Highlight figures across every saved commute. */
export function buildInsights(trips: SavedTrip[]): Insights {
  if (trips.length === 0) {
    return {
      busiestHour: null,
      busiestHourCount: 0,
      avgDistanceKm: 0,
      avgDurationMs: 0,
      avgFare: 0,
      topTier: null,
      topPlate: null,
      totalTrips: 0,
      totalFare: 0,
    };
  }

  const hours = new Map<number, number>();
  const tiers = new Map<string, number>();
  const plates = new Map<string, number>();

  for (const trip of trips) {
    const hour = new Date(trip.startedAt).getHours();
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
    tiers.set(trip.tier, (tiers.get(trip.tier) ?? 0) + 1);
    if (trip.plateNumber) {
      plates.set(trip.plateNumber, (plates.get(trip.plateNumber) ?? 0) + 1);
    }
  }

  const topEntry = (map: Map<string | number, number>) =>
    [...map.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const topHour = topEntry(hours);
  const topTier = topEntry(tiers);
  const topPlate = topEntry(plates);

  return {
    busiestHour: topHour ? formatHour(Number(topHour[0])) : null,
    busiestHourCount: topHour ? topHour[1] : 0,
    avgDistanceKm: trips.reduce((sum, trip) => sum + trip.distanceKm, 0) / trips.length,
    avgDurationMs: trips.reduce((sum, trip) => sum + trip.durationMs, 0) / trips.length,
    avgFare: trips.reduce((sum, trip) => sum + trip.fare, 0) / trips.length,
    topTier: topTier ? String(topTier[0]) : null,
    topPlate: topPlate ? String(topPlate[0]) : null,
    totalTrips: trips.length,
    totalFare: trips.reduce((sum, trip) => sum + trip.fare, 0),
  };
}

export type Streaks = {
  current: number;
  best: number;
};

/** Consecutive-day commute streaks, counting back from today (or yesterday). */
export function buildStreaks(trips: SavedTrip[], now: number): Streaks {
  if (trips.length === 0) return { current: 0, best: 0 };

  const dayKeys = [...new Set(trips.map((trip) => toDateKey(trip.endedAt)))].sort();
  const days = dayKeys.map((key) => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  });

  let best = 1;
  let run = 1;

  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(days[index - 1]);
    const expected = new Date(
      previous.getFullYear(),
      previous.getMonth(),
      previous.getDate() + 1,
    ).getTime();

    if (days[index] === expected) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const today = startOfDay(now);
  const todayDate = new Date(today);
  const yesterday = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate() - 1,
  ).getTime();
  const daySet = new Set(days);

  let cursor = daySet.has(today) ? today : daySet.has(yesterday) ? yesterday : null;
  let current = 0;

  while (cursor !== null && daySet.has(cursor)) {
    current += 1;
    const date = new Date(cursor);
    cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1).getTime();
  }

  return { current, best };
}
