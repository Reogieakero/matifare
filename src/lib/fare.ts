import type { FareTier } from '@/constants/fare-matrix';

/** Base fare covers the first 3.0 km of every trip. */
export const BASE_DISTANCE_KM = 3;

export type FareBreakdown = {
  /** Flat fare for the first `BASE_DISTANCE_KM`. */
  base: number;
  /** Raw distance used for the calculation. */
  distanceKm: number;
  /** Distance beyond the base distance (never negative). */
  extraKm: number;
  /** Whole added kilometres charged at the per-km rate. */
  billableKm: number;
  /** Charge for the added kilometres. */
  extra: number;
  /** Base fare plus added kilometres. */
  total: number;
};

/**
 * Fare matrix math: `base + ceil(max(0, km - 3)) * perKm`.
 * Added kilometres are billed in whole-kilometre steps, the way tricycle
 * drivers in Mati price the extra distance.
 */
export function calculateFare(tier: FareTier, distanceKm: number): FareBreakdown {
  const safeKm = Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const extraKm = Math.max(0, safeKm - BASE_DISTANCE_KM);
  const billableKm = Math.max(0, Math.ceil(extraKm - 1e-9));
  const extra = billableKm * tier.perKmValue;

  return {
    base: tier.baseFareValue,
    distanceKm: safeKm,
    extraKm,
    billableKm,
    extra,
    total: tier.baseFareValue + extra,
  };
}

/** Statutory 20% discount for senior citizens, PWDs and students. */
export const DISCOUNT_RATE = 0.2;

/**
 * Applies the 20% fare discount and rounds to centavos so totals never show
 * floating-point noise.
 */
export function applyFareDiscount(total: number) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  return Math.round(safeTotal * (1 - DISCOUNT_RATE) * 100) / 100;
}

export function formatKm(km: number) {
  return `${(Number.isFinite(km) && km > 0 ? km : 0).toFixed(2)} km`;
}

export function formatPeso(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `₱${safeValue.toFixed(2)}`;
}

/** mm:ss under an hour, h:mm:ss above it. */
export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
