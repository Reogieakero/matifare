/** Map style options the rider can pick in Me → Map. */
export type MapStyleId = 'standard' | 'dark' | 'contrast';

export type MapPalette = {
  /** Colour behind the map, also used before the canvas has measured itself. */
  background: string;
  land: string;
  water: string;
  green: string;
  building: string;
  path: string;
  service: string;
  minorCasing: string;
  minorFill: string;
  tertiaryCasing: string;
  tertiaryFill: string;
  secondaryCasing: string;
  secondaryFill: string;
  majorCasing: string;
  majorFill: string;
  coast: string;
  waterLine: string;
  labelHalo: string;
  labelText: string;
  trackHalo: string;
  track: string;
  markerFill: string;
  markerStroke: string;
  markerDot: string;
  accuracyFill: string;
  accuracyStroke: string;
};

/**
 * All map drawing colours live here so the same offline geometry can be painted
 * in a light, dark, or high-contrast style without a second map file.
 */
export const MapPalettes: Record<MapStyleId, MapPalette> = {
  standard: {
    background: '#EAF0E3',
    land: '#EEF2E7',
    water: '#B9DDF4',
    green: '#D4EBCB',
    building: '#E2E7EE',
    path: '#D8DFE8',
    service: '#E8EDF3',
    minorCasing: '#DCE3EB',
    minorFill: '#FFFFFF',
    tertiaryCasing: '#D3DCE7',
    tertiaryFill: '#FFFFFF',
    secondaryCasing: '#E9D9BA',
    secondaryFill: '#FBE4B4',
    majorCasing: '#E7B96F',
    majorFill: '#F8CB7C',
    coast: '#9ACDE9',
    waterLine: '#A4D3EE',
    labelHalo: '#FFFFFF',
    labelText: '#36465F',
    trackHalo: 'rgba(255,255,255,0.9)',
    track: '#2563EB',
    markerFill: '#FFFFFF',
    markerStroke: 'rgba(15,23,42,0.16)',
    markerDot: '#2563EB',
    accuracyFill: 'rgba(37,99,235,0.12)',
    accuracyStroke: 'rgba(37,99,235,0.24)',
  },
  dark: {
    background: '#0B1220',
    land: '#0F1A2E',
    water: '#123A5A',
    green: '#123324',
    building: '#1B2740',
    path: '#26344E',
    service: '#22304A',
    minorCasing: '#1E2C46',
    minorFill: '#2A3A57',
    tertiaryCasing: '#26364F',
    tertiaryFill: '#334866',
    secondaryCasing: '#4A3A1E',
    secondaryFill: '#6B5222',
    majorCasing: '#5A421A',
    majorFill: '#8A6824',
    coast: '#2A5D80',
    waterLine: '#2C5E82',
    labelHalo: '#0B1220',
    labelText: '#D7E2F4',
    trackHalo: 'rgba(8,14,28,0.85)',
    track: '#60A5FA',
    markerFill: '#0B1220',
    markerStroke: 'rgba(255,255,255,0.28)',
    markerDot: '#60A5FA',
    accuracyFill: 'rgba(96,165,250,0.16)',
    accuracyStroke: 'rgba(96,165,250,0.32)',
  },
  contrast: {
    background: '#FFFFFF',
    land: '#FFFFFF',
    water: '#8ECDF5',
    green: '#B7E4A8',
    building: '#C9D2DE',
    path: '#6B7789',
    service: '#9AA6B5',
    minorCasing: '#1F2937',
    minorFill: '#FFFFFF',
    tertiaryCasing: '#111827',
    tertiaryFill: '#FDE68A',
    secondaryCasing: '#B45309',
    secondaryFill: '#FCD34D',
    majorCasing: '#92400E',
    majorFill: '#FBBF24',
    coast: '#1D6FA5',
    waterLine: '#1D6FA5',
    labelHalo: '#FFFFFF',
    labelText: '#111827',
    trackHalo: '#FFFFFF',
    track: '#111827',
    markerFill: '#FFFFFF',
    markerStroke: 'rgba(15,23,42,0.4)',
    markerDot: '#111827',
    accuracyFill: 'rgba(17,24,39,0.10)',
    accuracyStroke: 'rgba(17,24,39,0.28)',
  },
};
