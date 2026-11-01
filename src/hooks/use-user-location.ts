import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, type AppStateStatus } from 'react-native';

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  /** Device-reported ground speed in m/s, or null when unavailable. */
  speed: number | null;
  timestamp: number;
};

export type LocationStatus =
  | 'checking'
  | 'locating'
  | 'ready'
  | 'denied'
  | 'services-off'
  | 'error';

type LocationState = {
  status: LocationStatus;
  location: UserLocation | null;
  canAskAgain: boolean;
  error: string | null;
};

const initialState: LocationState = {
  status: 'checking',
  location: null,
  canAskAgain: true,
  error: null,
};

function toUserLocation(position: Location.LocationObject): UserLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed,
    timestamp: position.timestamp,
  };
}

/**
 * Foreground GPS only. Location fixes come from the device sensors, so this
 * keeps working with mobile data and Wi-Fi completely turned off.
 *
 * `profile: 'navigation'` asks for a denser, more accurate stream while the
 * commute meter is running; the default profile is the battery-friendly one
 * used by the map card.
 */
export function useUserLocation(
  enabled = true,
  options?: { profile?: 'default' | 'navigation' },
) {
  const profile = options?.profile ?? 'default';
  const [state, setState] = useState<LocationState>(initialState);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  const refresh = useCallback(() => {
    setState((current) => ({
      ...current,
      status: current.location ? current.status : 'checking',
      error: null,
    }));
    setAttempt((value) => value + 1);
  }, []);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    mounted.current = true;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const apply = (position: Location.LocationObject) => {
      if (cancelled) return;
      setState({
        status: 'ready',
        location: toUserLocation(position),
        canAskAgain: true,
        error: null,
      });
    };

    const start = async () => {
      try {
        let servicesEnabled = true;
        try {
          servicesEnabled = await Location.hasServicesEnabledAsync();
        } catch {
          // Some browsers/devices cannot report this; try the actual fix below.
        }
        if (!servicesEnabled) {
          if (!cancelled) {
            setState((current) => ({
              ...current,
              status: 'services-off',
              error: 'Location services are turned off.',
            }));
          }
          return;
        }

        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }

        if (!permission.granted) {
          if (!cancelled) {
            setState((current) => ({
              ...current,
              status: 'denied',
              canAskAgain: permission.canAskAgain,
              error: null,
            }));
          }
          return;
        }

        // A cached fix makes the pin appear instantly; the live watch below
        // replaces it with a fresh GPS reading.
        let lastKnown: Location.LocationObject | null = null;
        try {
          lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
        } catch {
          // Not supported everywhere; the live watch is the source of truth.
        }
        if (lastKnown && !cancelled) {
          apply(lastKnown);
        } else if (!cancelled) {
          setState((current) => ({
            ...current,
            status: 'locating',
            canAskAgain: true,
            error: null,
          }));
        }

        subscription = await Location.watchPositionAsync(
          profile === 'navigation'
            ? {
                accuracy: Location.Accuracy.High,
                distanceInterval: 3,
                timeInterval: 1000,
                mayShowUserSettingsDialog: false,
              }
            : {
                accuracy: Location.Accuracy.Balanced,
                distanceInterval: 10,
                timeInterval: 5000,
                mayShowUserSettingsDialog: false,
              },
          apply,
          (reason) => {
            if (!cancelled) {
              setState((current) => ({
                ...current,
                status: current.location ? current.status : 'error',
                error: reason,
              }));
            }
          },
        );

        if (cancelled) {
          subscription.remove();
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            status: current.location ? current.status : 'error',
            error: error instanceof Error ? error.message : 'Unable to read your location.',
          }));
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [attempt, enabled, profile]);

  // Coming back from the system settings app should immediately re-check,
  // but never re-prompt automatically.
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next !== 'active' || !mounted.current) return;
      void Location.getForegroundPermissionsAsync().then((permission) => {
        if (permission.granted) refresh();
      });
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  return { ...state, refresh, openSettings };
}
