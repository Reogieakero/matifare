export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** Local calendar day key, e.g. `2026-10-31`. */
export function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** "Oct 31, 2026" for a `toDateKey` value. */
export function formatDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return key;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** "9:58 PM" for a timestamp. */
export function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  const hours24 = date.getHours();
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = pad(date.getMinutes());

  return `${hours}:${minutes} ${hours24 < 12 ? 'AM' : 'PM'}`;
}

/** Local "Oct 31 · 9:58 PM" stamp for a finished ride. */
export function formatTripDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return `${MONTHS[date.getMonth()]} ${date.getDate()} · ${formatClockTime(timestamp)}`;
}

/**
 * Day numbers for a month laid out Sunday-first. Leading blanks pad the first
 * week; trailing blanks pad the last row.
 */
export function buildMonthMatrix(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}
