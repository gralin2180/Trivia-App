import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_DECK_GENS_KEY = 'guest_deck_gens_v1';
const GUEST_DEVICE_ID_KEY = 'guest_device_id_v1';

/** Free AI deck generations before asking guests to create an account. */
export const GUEST_FREE_DECK_LIMIT = 3;

export async function loadGuestDeckGens(): Promise<number> {
  const value = await AsyncStorage.getItem(GUEST_DECK_GENS_KEY);
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export async function bumpGuestDeckGens(): Promise<number> {
  const next = (await loadGuestDeckGens()) + 1;
  await AsyncStorage.setItem(GUEST_DECK_GENS_KEY, String(next));
  return next;
}

export async function guestNeedsSubscription(): Promise<boolean> {
  return (await loadGuestDeckGens()) >= GUEST_FREE_DECK_LIMIT;
}

export async function guestGensRemaining(): Promise<number> {
  return Math.max(0, GUEST_FREE_DECK_LIMIT - (await loadGuestDeckGens()));
}

/** Stable local id so guests can generate without a full account session. */
export async function getGuestDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(GUEST_DEVICE_ID_KEY);
  if (existing && existing.length >= 8) return existing;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await AsyncStorage.setItem(GUEST_DEVICE_ID_KEY, id);
  return id;
}
