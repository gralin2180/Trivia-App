import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = 'sound_enabled';
const ONBOARDING_TIP_KEY = 'onboarding_tip_seen';

export async function loadSoundEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
  if (value === null) return true;
  return value === 'true';
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

export async function loadOnboardingTipSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_TIP_KEY);
  return value === 'true';
}

export async function saveOnboardingTipSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_TIP_KEY, 'true');
}
