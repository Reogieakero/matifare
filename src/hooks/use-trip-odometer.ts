import { useCallback, useEffect, useRef, useState } from 'react';

import type { UserLocation } from '@/hooks/use-user-location';
import { haversineMeters } from '@/lib/geo';
import type { TrackPoint } from '@/lib/offline-map';

export type TripStatus = 'idle' | 'riding' | 'ended';

/** Fixes worse than this are treated as noise and never metered. */
const MAX_ACCURACY_METERS = 35;
/** Standing still produces a few metres of jitter; ignore it. */
const MIN_SEGMENT_METERS = 3;
/** Below this reported speed the device is standing still, not travelling. */
const MIN_MOVING_SPEED_MPS = 0.7;
/** Anything faster than this is a GPS jump, not a tricycle. */
const MAX_SPEED_MPS = 25;
/** Road winding correction applied to each measured segment. */
const ROAD_FACTOR = 1.25;
/** The trip panel refreshes at this cadence, independent of fix frequency. */
const TICK_MS = 250;

export type TripOdometer = {
  status: TripStatus;
  km: number;
  durationMs: number;
  /** True while GPS accuracy is too poor to measure reliably. */
  poorSignal: boolean;
  /** Accepted fixes since the trip started, for drawing the travelled line. */
  track: TrackPoint[];
  start: () => void;
  stop: () => void;
  reset: () => void;
};

/**
 * Accumulates live GPS movement into a trip odometer. Nothing is persisted:
 * an unfinished trip lives only while this screen is mounted.
 */
export function useTripOdometer(location: UserLocation | null): TripOdometer {
  const [status, setStatus] = useState<TripStatus>('idle');
  const [km, setKm] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [track, setTrack] = useState<TrackPoint[]>([]);

  const statusRef = useRef<TripStatus>('idle');
  const lastFixRef = useRef<UserLocation | null>(null);
  const metersRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  // Distance is accumulated in a ref on every fix; the panel reads it on a
  // fixed tick so a fast GPS stream cannot re-render the map on each fix.
  useEffect(() => {
    if (!location || statusRef.current !== 'riding') return;

    const weak = location.accuracy !== null && location.accuracy > MAX_ACCURACY_METERS;
    if (weak) {
      // Never bridge a weak fix: drop the anchor so the next good fix starts
      // a fresh segment instead of counting the drift as distance.
      lastFixRef.current = null;
      return;
    }

    // A stationary phone still reports fixes that wander several metres. The
    // device's own speed reading is the reliable way to tell drift from travel.
    //
    // Android reports speed as 0 when the GPS fix does not carry a speed value
    // at all, which is common on cheaper phones. Treat 0 (and negative / null)
    // as "unknown" instead of "standing still", otherwise the meter never
    // leaves 0.00 KM even while the rider is moving.
    const speed = location.speed;
    const hasSpeedReading = speed !== null && speed > 0;
    const standingStill = hasSpeedReading && speed < MIN_MOVING_SPEED_MPS;

    if (standingStill) {
      // Re-anchor at the current fix so the next real movement is measured
      // from where the rider actually is, not from stale drift.
      lastFixRef.current = location;
      return;
    }

    const previous = lastFixRef.current;
    if (!previous) {
      lastFixRef.current = location;
      return;
    }

    const segment = haversineMeters(previous, location);
    // Never meter a hop smaller than the fix's own error radius: that is GPS
    // noise, and counting it is what made the meter climb while standing still.
    const jitterFloor = Math.max(
      MIN_SEGMENT_METERS,
      Math.min((location.accuracy ?? 0) * 0.6, 12),
    );
    if (segment < jitterFloor) return;

    const elapsedSeconds = Math.max((location.timestamp - previous.timestamp) / 1000, 0.5);
    if (segment / elapsedSeconds > MAX_SPEED_MPS) {
      lastFixRef.current = location;
      return;
    }

    metersRef.current += segment * ROAD_FACTOR;
    lastFixRef.current = location;
    setTrack((points) => [
      ...points,
      { latitude: location.latitude, longitude: location.longitude },
    ]);
  }, [location]);

  useEffect(() => {
    if (status !== 'riding') return;

    const interval = setInterval(() => {
      setKm(metersRef.current / 1000);
      if (startedAtRef.current !== null) {
        setDurationMs(Date.now() - startedAtRef.current);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [status]);

  const start = useCallback(() => {
    const usableStart =
      location &&
      (location.accuracy === null || location.accuracy <= MAX_ACCURACY_METERS)
        ? [{ latitude: location.latitude, longitude: location.longitude }]
        : [];

    metersRef.current = 0;
    lastFixRef.current = location;
    startedAtRef.current = Date.now();
    statusRef.current = 'riding';

    setStatus('riding');
    setKm(0);
    setDurationMs(0);
    setTrack(usableStart);
  }, [location]);

  const stop = useCallback(() => {
    if (statusRef.current !== 'riding') return;

    setKm(metersRef.current / 1000);
    if (startedAtRef.current !== null) {
      setDurationMs(Date.now() - startedAtRef.current);
    }
    statusRef.current = 'ended';
    setStatus('ended');
  }, []);

  const reset = useCallback(() => {
    metersRef.current = 0;
    lastFixRef.current = null;
    startedAtRef.current = null;
    statusRef.current = 'idle';

    setStatus('idle');
    setKm(0);
    setDurationMs(0);
    setTrack([]);
  }, []);

  const poorSignal =
    status === 'riding' &&
    location !== null &&
    location.accuracy !== null &&
    location.accuracy > MAX_ACCURACY_METERS;

  return { status, km, durationMs, poorSignal, track, start, stop, reset };
}
