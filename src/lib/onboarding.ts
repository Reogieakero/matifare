import { StorageKeys } from '@/constants/app';

import { getStoredValue, removeStoredValue, setStoredValue } from './storage';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await getStoredValue(StorageKeys.onboardingComplete);
  return value === 'true';
}

export async function completeOnboarding(): Promise<void> {
  await setStoredValue(StorageKeys.onboardingComplete, 'true');
}

export async function resetOnboarding(): Promise<void> {
  await removeStoredValue(StorageKeys.onboardingComplete);
}
