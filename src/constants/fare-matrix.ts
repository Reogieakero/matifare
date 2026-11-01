export type FareTier = {
  id: number;
  tier: string;
  fuelPrice: string;
  fuelMin: number;
  fuelMax: number;
  baseFare: string;
  baseFareValue: number;
  perKm: string;
  perKmValue: number;
};

/**
 * Fuel-price based fare tiers (Philippine peso).
 * Base fare covers the first 3.0 km; the per-km rate applies to each added km.
 */
export const FareMatrix: FareTier[] = [
  {
    id: 1,
    tier: 'Tier 1',
    fuelPrice: '₱50.00 – ₱59.99',
    fuelMin: 50,
    fuelMax: 59.99,
    baseFare: '₱15.00',
    baseFareValue: 15,
    perKm: '₱2.00',
    perKmValue: 2,
  },
  {
    id: 2,
    tier: 'Tier 2',
    fuelPrice: '₱60.00 – ₱79.99',
    fuelMin: 60,
    fuelMax: 79.99,
    baseFare: '₱20.00',
    baseFareValue: 20,
    perKm: '₱3.00',
    perKmValue: 3,
  },
  {
    id: 3,
    tier: 'Tier 3',
    fuelPrice: '₱80.00 – ₱89.99',
    fuelMin: 80,
    fuelMax: 89.99,
    baseFare: '₱20.00',
    baseFareValue: 20,
    perKm: '₱4.00',
    perKmValue: 4,
  },
  {
    id: 4,
    tier: 'Tier 4',
    fuelPrice: '₱90.00 – ₱99.99',
    fuelMin: 90,
    fuelMax: 99.99,
    baseFare: '₱20.00',
    baseFareValue: 20,
    perKm: '₱5.00',
    perKmValue: 5,
  },
  {
    id: 5,
    tier: 'Tier 5',
    fuelPrice: '₱100.00 – ₱124.99',
    fuelMin: 100,
    fuelMax: 124.99,
    baseFare: '₱20.00',
    baseFareValue: 20,
    perKm: '₱6.00',
    perKmValue: 6,
  },
  {
    id: 6,
    tier: 'Tier 6',
    fuelPrice: '₱125.00 – ₱149.99',
    fuelMin: 125,
    fuelMax: 149.99,
    baseFare: '₱20.00',
    baseFareValue: 20,
    perKm: '₱7.00',
    perKmValue: 7,
  },
  {
    id: 7,
    tier: 'Tier 7',
    fuelPrice: '₱150.00 – ₱174.99',
    fuelMin: 150,
    fuelMax: 174.99,
    baseFare: '₱25.00',
    baseFareValue: 25,
    perKm: '₱8.00',
    perKmValue: 8,
  },
  {
    id: 8,
    tier: 'Tier 8',
    fuelPrice: '₱175.00 – ₱200.00',
    fuelMin: 175,
    fuelMax: 200,
    baseFare: '₱30.00',
    baseFareValue: 30,
    perKm: '₱9.00',
    perKmValue: 9,
  },
];
