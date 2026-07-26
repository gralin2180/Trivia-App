import AsyncStorage from '@react-native-async-storage/async-storage';

import type { VisualThemeId } from '@/constants/theme';

const SOUND_ENABLED_KEY = 'sound_enabled';
const MUSIC_ENABLED_KEY = 'music_enabled';
const HAPTICS_ENABLED_KEY = 'haptics_enabled';
const SFX_VOLUME_KEY = 'sfx_volume';
const MUSIC_VOLUME_KEY = 'music_volume';
const ONBOARDING_TIP_KEY = 'onboarding_tip_seen';
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete_v1';
const VISUAL_THEME_KEY = 'visual_theme_v2';
const GUEST_MODE_KEY = 'guest_mode';
const DISPLAY_NAME_KEY = 'display_name';
const MASCOT_INTRO_KEY = 'mascot_intro_seen_v1';
const MASCOT_POSITION_KEY = 'mascot_position_v1';

export async function loadSoundEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
  if (value === null) return true;
  return value === 'true';
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

export async function loadMusicEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MUSIC_ENABLED_KEY);
  if (value === null) return false;
  return value === 'true';
}

export async function saveMusicEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
}

export async function loadHapticsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
  if (value === null) return true;
  return value === 'true';
}

export async function saveHapticsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
}

export async function loadSfxVolume(): Promise<number> {
  const value = await AsyncStorage.getItem(SFX_VOLUME_KEY);
  if (value === null) return 0.8;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.8;
}

export async function saveSfxVolume(volume: number): Promise<void> {
  await AsyncStorage.setItem(SFX_VOLUME_KEY, String(Math.min(1, Math.max(0, volume))));
}

export async function loadMusicVolume(): Promise<number> {
  const value = await AsyncStorage.getItem(MUSIC_VOLUME_KEY);
  if (value === null) return 0.35;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.35;
}

export async function saveMusicVolume(volume: number): Promise<void> {
  await AsyncStorage.setItem(MUSIC_VOLUME_KEY, String(Math.min(1, Math.max(0, volume))));
}

export async function loadOnboardingTipSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_TIP_KEY);
  return value === 'true';
}

export async function saveOnboardingTipSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_TIP_KEY, 'true');
}

export async function loadOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

export async function saveOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

export async function loadVisualTheme(): Promise<VisualThemeId> {
  const value = await AsyncStorage.getItem(VISUAL_THEME_KEY);
  if (value === 'dusk' || value === 'day' || value === 'minimal') return value;
  if (value === 'library') return 'dusk';
  if (value === 'solar') return 'dusk';
  return 'dusk';
}

export async function saveVisualTheme(theme: VisualThemeId): Promise<void> {
  await AsyncStorage.setItem(VISUAL_THEME_KEY, theme);
}

export async function loadGuestMode(): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
  return value === 'true';
}

export async function saveGuestMode(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  } else {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }
}

export async function loadDisplayName(): Promise<string | null> {
  return AsyncStorage.getItem(DISPLAY_NAME_KEY);
}

export async function saveDisplayName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(DISPLAY_NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmed.slice(0, 24));
}

export async function loadMascotIntroSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MASCOT_INTRO_KEY);
  return value === 'true';
}

export async function saveMascotIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(MASCOT_INTRO_KEY, 'true');
}

export async function loadMascotPosition(): Promise<{ x: number; y: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(MASCOT_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return { x: parsed.x, y: parsed.y };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveMascotPosition(pos: { x: number; y: number }): Promise<void> {
  await AsyncStorage.setItem(MASCOT_POSITION_KEY, JSON.stringify(pos));
}

/** Dev helper — clear intro so the guided tour runs again. */
export async function resetMascotTutorial(): Promise<void> {
  await AsyncStorage.removeItem(MASCOT_INTRO_KEY);
}
