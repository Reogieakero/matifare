import { StorageKeys } from '@/constants/app';
import type { TrackPoint } from '@/lib/offline-map';
import { getStoredValue, setStoredValue } from '@/lib/storage';

/** A finished commute the rider chose to keep on this device. */
export type SavedTrip = {
  id: string;
  startedAt: number;
  endedAt: number;
  distanceKm: number;
  durationMs: number;
  fare: number;
  /** Fare tier label the ride was priced with, e.g. "Tier 2". */
  tier: string;
  /** Tricycle body/plate number, when the rider shared one. */
  plateNumber: string | null;
  /** Whether the 20% senior/PWD/student discount was applied to `fare`. */
  discountApplied?: boolean;
  /** Accepted GPS fixes, downsampled so storage stays small. */
  track?: TrackPoint[];
};

/** Newest first; older entries fall off once this many are kept. */
const MAX_SAVED_TRIPS = 100;
/** Enough points to draw a recognisable route without bloating storage. */
const MAX_TRACK_POINTS = 300;

function isTrackPoint(value: unknown): value is TrackPoint {
  if (typeof value !== 'object' || value === null) return false;
  const point = value as Record<string, unknown>;
  return typeof point.latitude === 'number' && typeof point.longitude === 'number';
}

/** Evenly samples a long GPS track so each saved trip stays lightweight. */
function compactTrack(track: TrackPoint[]): TrackPoint[] {
  if (track.length <= MAX_TRACK_POINTS) return track;

  const step = (track.length - 1) / (MAX_TRACK_POINTS - 1);
  return Array.from({ length: MAX_TRACK_POINTS }, (_, index) => track[Math.round(index * step)]);
}

function isSavedTrip(value: unknown): value is SavedTrip {
  if (typeof value !== 'object' || value === null) return false;
  const trip = value as Record<string, unknown>;

  return (
    typeof trip.id === 'string' &&
    typeof trip.startedAt === 'number' &&
    typeof trip.endedAt === 'number' &&
    typeof trip.distanceKm === 'number' &&
    typeof trip.durationMs === 'number' &&
    typeof trip.fare === 'number' &&
    typeof trip.tier === 'string' &&
    (trip.plateNumber === null || typeof trip.plateNumber === 'string') &&
    (trip.discountApplied === undefined || typeof trip.discountApplied === 'boolean') &&
    (trip.track === undefined || (Array.isArray(trip.track) && trip.track.every(isTrackPoint)))
  );
}

export async function loadSavedTrips(): Promise<SavedTrip[]> {
  const raw = await getStoredValue(StorageKeys.savedTrips);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedTrip);
  } catch {
    return [];
  }
}

export async function appendSavedTrip(trip: Omit<SavedTrip, 'id'>): Promise<SavedTrip> {
  const record: SavedTrip = {
    ...trip,
    ...(trip.track ? { track: compactTrack(trip.track) } : {}),
    id: `trip_${trip.endedAt.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
  };

  const existing = await loadSavedTrips();
  await setStoredValue(
    StorageKeys.savedTrips,
    JSON.stringify([record, ...existing].slice(0, MAX_SAVED_TRIPS)),
  );

  return record;
}
