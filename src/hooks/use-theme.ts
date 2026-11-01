import { Colors, type Theme } from '@/constants/theme';

/**
 * Tripede ships a single blue / yellow / white palette. White surfaces with
 * electric blue actions and mascot-yellow accents, so every screen — from the
 * splash to the fare dashboard — shares the same look.
 */
export function useTheme(): Theme {
  return Colors.light;
}

export function useColorMode() {
  return 'light' as const;
}
