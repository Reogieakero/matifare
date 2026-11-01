import '@/global.css';

import { Platform } from 'react-native';

/**
 * Tripede design tokens.
 * Brand palette: electric blue, mascot yellow and crisp white surfaces.
 */
export const Brand = {
  blue: '#2563EB',
  blueDeep: '#1D4ED8',
  blueBright: '#3B82F6',
  yellow: '#FFC61A',
  yellowDeep: '#E5A900',
  yellowInk: '#8A5B00',
  white: '#FFFFFF',
  ice: '#F2F7FF',
  ink: '#0F172A',
} as const;

export const Gradients = {
  /** Primary action + brand mark */
  brand: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  /** Large hero surfaces */
  hero: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #16307A 100%)',
  /** Ambient glow washes */
  blueGlow:
    'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0.08) 45%, rgba(37,99,235,0) 72%)',
} as const;

export const Colors = {
  light: {
    background: Brand.white,
    surface: Brand.white,
    surfaceElevated: Brand.white,
    backgroundElement: '#F1F6FF',
    backgroundSelected: '#E3EDFF',
    text: Brand.ink,
    textSecondary: '#475569',
    textMuted: '#7A889E',
    border: 'rgba(15,23,42,0.08)',
    borderStrong: 'rgba(15,23,42,0.16)',
    primary: '#1D4ED8',
    primarySoft: 'rgba(37,99,235,0.10)',
    primaryText: '#FFFFFF',
    accent: Brand.blue,
    accentSoft: 'rgba(37,99,235,0.10)',
    onPrimary: '#FFFFFF',
    yellow: Brand.yellow,
    yellowInk: Brand.yellowInk,
    yellowSoft: 'rgba(255,198,26,0.22)',
    danger: '#D92D20',
    overlay: 'rgba(15,23,42,0.35)',
  },
  dark: {
    background: '#080E1C',
    surface: '#101A2E',
    surfaceElevated: '#15203A',
    backgroundElement: '#15203A',
    backgroundSelected: '#1E2C4C',
    text: '#F7FAFF',
    textSecondary: '#A9B7CE',
    textMuted: '#7586A3',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.20)',
    primary: '#7FB2FF',
    primarySoft: 'rgba(96,165,250,0.16)',
    primaryText: '#0B1220',
    accent: '#FACC15',
    accentSoft: 'rgba(250,204,21,0.14)',
    onPrimary: '#FFFFFF',
    yellow: Brand.yellow,
    yellowInk: '#FFD75E',
    yellowSoft: 'rgba(255,198,26,0.16)',
    danger: '#FF6369',
    overlay: 'rgba(3,7,18,0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)[keyof typeof Colors];

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'sans-serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    rounded: 'System',
    mono: 'monospace',
  },
});

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 520;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#1D4ED8',
      shadowOpacity: 0.12,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 3 },
    default: {},
  }),
  glow: Platform.select({
    ios: {
      shadowColor: Brand.blue,
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
