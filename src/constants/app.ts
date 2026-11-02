export const AppConfig = {
  name: 'Tripede',
  tagline: 'Know your fare before you ride.',
  version: '1.0.0',
  currency: '$',
} as const;

export const StorageKeys = {
  onboardingComplete: 'tripede.onboarding.complete',
  fareTier: 'tripede.fare.tier',
  fareDiscount: 'tripede.fare.discount',
  savedTrips: 'tripede.trips.saved',
  themePreference: 'tripede.theme.preference',
  mapStyle: 'tripede.map.style',
} as const;

export type Vehicle = {
  id: 'bike' | 'car' | 'xl';
  label: string;
  description: string;
  icon: 'bike' | 'car' | 'van';
  baseFare: number;
  perKm: number;
  eta: string;
};

export const Vehicles: Vehicle[] = [
  {
    id: 'bike',
    label: 'Bike',
    description: 'Quick solo trips',
    icon: 'bike',
    baseFare: 1.5,
    perKm: 0.6,
    eta: '1 min',
  },
  {
    id: 'car',
    label: 'Car',
    description: 'Everyday rides',
    icon: 'car',
    baseFare: 3,
    perKm: 1.2,
    eta: '3 min',
  },
  {
    id: 'xl',
    label: 'XL',
    description: 'Groups & luggage',
    icon: 'van',
    baseFare: 4.5,
    perKm: 1.8,
    eta: '5 min',
  },
];

export function formatFare(value: number) {
  return `${AppConfig.currency}${value.toFixed(2)}`;
}
