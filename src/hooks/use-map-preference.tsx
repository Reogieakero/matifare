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
import {
  MapPalettes,
  type MapPalette,
  type MapStyleId,
} from '@/constants/map-style';
import { getStoredValue, setStoredValue } from '@/lib/storage';

type MapPreferenceContextValue = {
  mapStyle: MapStyleId;
  palette: MapPalette;
  setMapStyle: (style: MapStyleId) => void;
};

const MapPreferenceContext = createContext<MapPreferenceContextValue | null>(null);

function isMapStyle(value: string | null): value is MapStyleId {
  return value === 'standard' || value === 'dark' || value === 'contrast';
}

/**
 * Keeps the rider's map style on every map surface. The choice is stored on the
 * device, so the home preview, full map and saved routes always match.
 */
export function MapPreferenceProvider({ children }: { children: ReactNode }) {
  const [mapStyle, setMapStyleState] = useState<MapStyleId>('standard');

  useEffect(() => {
    let active = true;

    getStoredValue(StorageKeys.mapStyle)
      .then((stored) => {
        if (active && isMapStyle(stored)) {
          setMapStyleState(stored);
        }
      })
      .catch(() => {
        // Storage is optional; fall back to the standard map.
      });

    return () => {
      active = false;
    };
  }, []);

  const setMapStyle = useCallback((next: MapStyleId) => {
    setMapStyleState(next);
    void setStoredValue(StorageKeys.mapStyle, next);
  }, []);

  const value = useMemo(
    () => ({ mapStyle, palette: MapPalettes[mapStyle], setMapStyle }),
    [mapStyle, setMapStyle],
  );

  return (
    <MapPreferenceContext.Provider value={value}>{children}</MapPreferenceContext.Provider>
  );
}

/** Palette for the canvas to paint with. */
export function useMapPalette(): MapPalette {
  return useContext(MapPreferenceContext)?.palette ?? MapPalettes.standard;
}

export function useMapPreference() {
  const context = useContext(MapPreferenceContext);

  return {
    mapStyle: context?.mapStyle ?? 'standard',
    setMapStyle: context?.setMapStyle ?? (() => {}),
  };
}
