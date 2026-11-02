import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { StorageKeys } from '@/constants/app';
import { FareMatrix, type FareTier } from '@/constants/fare-matrix';
import { useTripOdometer, type TripStatus } from '@/hooks/use-trip-odometer';
import {
  useUserLocation,
  type LocationStatus,
  type UserLocation,
} from '@/hooks/use-user-location';
import { applyFareDiscount, calculateFare } from '@/lib/fare';
import type { TrackPoint } from '@/lib/offline-map';
import { getStoredValue, setStoredValue } from '@/lib/storage';
import { appendSavedTrip } from '@/lib/trips';

type TripSessionValue = {
  /** Latest accepted fix, shared by every map surface. */
  location: UserLocation | null;
  locationStatus: LocationStatus;
  canAskAgain: boolean;
  locationError: string | null;
  refreshLocation: () => void;
  openLocationSettings: () => void;
  /**
   * Keeps GPS running while a screen is visible. Returns a release callback, so
   * the meter and the map can both hold a lease without switching it off early.
   */
  acquireLocation: () => () => void;

  status: TripStatus;
  km: number;
  durationMs: number;
  poorSignal: boolean;
  /** Accepted fixes since the trip started. */
  track: TrackPoint[];
  plateNumber: string | null;

  tier: FareTier;
  selectedTierId: number;
  selectTier: (tier: FareTier) => void;
  discountApplied: boolean;
  toggleDiscount: () => void;
  /** Final fare after the optional discount. */
  fare: number;

  /** Set as soon as the rider ends the meter; drives the save prompt. */
  endedAt: number | null;
  startTrip: (plateNumber: string | null) => void;
  endTrip: () => void;
  resetTrip: () => void;
  saveTrip: () => Promise<void>;
  discardTrip: () => void;
};

type TripPreferencesValue = {
  tier: FareTier;
  selectedTierId: number;
  selectTier: (tier: FareTier) => void;
  discountApplied: boolean;
  toggleDiscount: () => void;
};

type TripLocationValue = Pick<
  TripSessionValue,
  | 'location'
  | 'locationStatus'
  | 'canAskAgain'
  | 'locationError'
  | 'refreshLocation'
  | 'openLocationSettings'
  | 'acquireLocation'
>;

const TripSessionContext = createContext<TripSessionValue | null>(null);
/**
 * Preferences change rarely. Keeping them in their own context stops screens
 * like Home and Me from re-rendering on every GPS tick while a meter runs.
 */
const TripPreferencesContext = createContext<TripPreferencesValue | null>(null);
/** Only the live fix, so the home map card ignores distance/fare ticks. */
const TripLocationContext = createContext<TripLocationValue | null>(null);

/**
 * Owns the commute meter for the whole app. Because it lives above the
 * navigator, leaving the map screen no longer stops tracking: the ride keeps
 * running until the rider ends it from the map or the persistent live bar.
 */
export function TripSessionProvider({ children }: { children: ReactNode }) {
  const [locationDemand, setLocationDemand] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(FareMatrix[0].id);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getStoredValue(StorageKeys.fareTier).then((value) => {
      if (!active || !value) return;

      const tierId = Number(value);
      if (FareMatrix.some((tier) => tier.id === tierId)) {
        setSelectedTierId(tierId);
      }
    });

    getStoredValue(StorageKeys.fareDiscount).then((value) => {
      if (!active || !value) return;
      setDiscountApplied(value === '1');
    });

    return () => {
      active = false;
    };
  }, []);

  const acquireLocation = useCallback(() => {
    setLocationDemand((count) => count + 1);
    let released = false;

    return () => {
      if (released) return;
      released = true;
      setLocationDemand((count) => Math.max(0, count - 1));
    };
  }, []);

  const locationEnabled = locationDemand > 0 || sessionActive;
  const {
    status: locationStatus,
    location,
    canAskAgain,
    error: locationError,
    refresh,
    openSettings,
  } = useUserLocation(locationEnabled, {
    profile: sessionActive ? 'navigation' : 'default',
  });

  const odometer = useTripOdometer(location);
  const { status, km, durationMs, poorSignal, track } = odometer;

  const selectedTier =
    FareMatrix.find((tier) => tier.id === selectedTierId) ?? FareMatrix[0];
  const fareTotal = calculateFare(selectedTier, km).total;
  const fare = discountApplied ? applyFareDiscount(fareTotal) : fareTotal;

  const selectTier = useCallback((tier: FareTier) => {
    setSelectedTierId(tier.id);
    void setStoredValue(StorageKeys.fareTier, String(tier.id));
  }, []);

  const toggleDiscount = useCallback(() => {
    setDiscountApplied((current) => {
      const next = !current;
      void setStoredValue(StorageKeys.fareDiscount, next ? '1' : '0');
      return next;
    });
  }, []);

  const startTrip = useCallback(
    (plate: string | null) => {
      setPlateNumber(plate);
      setEndedAt(null);
      setSessionActive(true);
      odometer.start();
    },
    [odometer],
  );

  const endTrip = useCallback(() => {
    if (odometer.status !== 'riding') return;
    odometer.stop();
    setEndedAt(Date.now());
    setSessionActive(false);
  }, [odometer]);

  const resetTrip = useCallback(() => {
    odometer.reset();
    setPlateNumber(null);
    setEndedAt(null);
    setSessionActive(false);
  }, [odometer]);

  const saveTrip = useCallback(async () => {
    if (endedAt === null) return;

    await appendSavedTrip({
      startedAt: Math.max(endedAt - durationMs, 0),
      endedAt,
      distanceKm: km,
      durationMs,
      fare,
      tier: selectedTier.tier,
      plateNumber,
      discountApplied,
      track,
    });
  }, [discountApplied, durationMs, endedAt, fare, km, plateNumber, selectedTier.tier, track]);

  const discardTrip = useCallback(() => {
    resetTrip();
  }, [resetTrip]);

  const locationValue = useMemo<TripLocationValue>(
    () => ({
      location,
      locationStatus,
      canAskAgain,
      locationError,
      refreshLocation: refresh,
      openLocationSettings: openSettings,
      acquireLocation,
    }),
    [
      acquireLocation,
      canAskAgain,
      location,
      locationError,
      locationStatus,
      openSettings,
      refresh,
    ],
  );

  const preferences = useMemo<TripPreferencesValue>(
    () => ({
      tier: selectedTier,
      selectedTierId,
      selectTier,
      discountApplied,
      toggleDiscount,
    }),
    [discountApplied, selectTier, selectedTier, selectedTierId, toggleDiscount],
  );

  const value = useMemo<TripSessionValue>(
    () => ({
      location,
      locationStatus,
      canAskAgain,
      locationError,
      refreshLocation: refresh,
      openLocationSettings: openSettings,
      acquireLocation,
      status,
      km,
      durationMs,
      poorSignal,
      track,
      plateNumber,
      tier: selectedTier,
      selectedTierId,
      selectTier,
      discountApplied,
      toggleDiscount,
      fare,
      endedAt,
      startTrip,
      endTrip,
      resetTrip,
      saveTrip,
      discardTrip,
    }),
    [
      acquireLocation,
      canAskAgain,
      discountApplied,
      durationMs,
      endedAt,
      fare,
      km,
      location,
      locationError,
      locationStatus,
      openSettings,
      plateNumber,
      poorSignal,
      refresh,
      resetTrip,
      saveTrip,
      selectTier,
      selectedTier,
      selectedTierId,
      startTrip,
      status,
      discardTrip,
      toggleDiscount,
      track,
      endTrip,
    ],
  );

  return (
    <TripPreferencesContext.Provider value={preferences}>
      <TripLocationContext.Provider value={locationValue}>
        <TripSessionContext.Provider value={value}>{children}</TripSessionContext.Provider>
      </TripLocationContext.Provider>
    </TripPreferencesContext.Provider>
  );
}

export function useTripSession(): TripSessionValue {
  const context = useContext(TripSessionContext);
  if (!context) {
    throw new Error('useTripSession must be used inside TripSessionProvider');
  }
  return context;
}

export function useTripPreferences(): TripPreferencesValue {
  const context = useContext(TripPreferencesContext);
  if (!context) {
    throw new Error('useTripPreferences must be used inside TripSessionProvider');
  }
  return context;
}

export function useTripLocation(): TripLocationValue {
  const context = useContext(TripLocationContext);
  if (!context) {
    throw new Error('useTripLocation must be used inside TripSessionProvider');
  }
  return context;
}
