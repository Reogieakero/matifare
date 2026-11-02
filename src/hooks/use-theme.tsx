import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SystemUI from 'expo-system-ui';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { StorageKeys } from '@/constants/app';
import { Colors, type Theme } from '@/constants/theme';
import { getStoredValue, setStoredValue } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorMode = 'light' | 'dark';

type ThemeContextValue = {
  /** What the rider picked: follow the device, or force light / dark. */
  preference: ThemePreference;
  /** The palette currently in effect after resolving the system setting. */
  colorMode: ColorMode;
  theme: Theme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function resolveColorMode(preference: ThemePreference, systemMode: ColorMode): ColorMode {
  if (preference === 'system') return systemMode;
  return preference;
}

/**
 * Applies the rider's theme choice across every screen. The preference is
 * persisted on the device, so a restart keeps the last selected mode.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;

    getStoredValue(StorageKeys.themePreference)
      .then((stored) => {
        if (active && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Storage is optional; fall back to following the system theme.
      });

    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void setStoredValue(StorageKeys.themePreference, next);
  }, []);

  const colorMode = resolveColorMode(preference, systemScheme === 'dark' ? 'dark' : 'light');
  const theme = Colors[colorMode];

  // Keep native surfaces (root view, alerts, keyboards) and the web document in
  // sync with the resolved theme. Without this, the area behind the app stays
  // white while the rider is in dark mode.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.background).catch(() => {
      // Not available in every environment (for example, web SSR).
    });

    if (Platform.OS === 'web') {
      const root = typeof document === 'undefined' ? null : document.documentElement;
      if (root) {
        root.style.colorScheme = colorMode;
        root.style.backgroundColor = theme.background;
      }
      return;
    }

    try {
      // Let native dialogs and keyboards follow the rider's choice too. 'auto'
      // hands control back to the device setting.
      Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
    } catch {
      // Appearance is only supported on iOS and Android.
    }
  }, [colorMode, preference, theme.background]);

  const value = useMemo(
    () => ({ preference, colorMode, theme, setPreference }),
    [preference, colorMode, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext)?.theme ?? Colors.light;
}

export function useColorMode(): ColorMode {
  return useContext(ThemeContext)?.colorMode ?? 'light';
}

export function useThemePreference() {
  const context = useContext(ThemeContext);

  return {
    preference: context?.preference ?? 'system',
    colorMode: context?.colorMode ?? 'light',
    setPreference: context?.setPreference ?? (() => {}),
  };
}
