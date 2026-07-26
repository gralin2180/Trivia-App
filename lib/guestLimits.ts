import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_DECK_GENS_KEY = 'guest_deck_gens_v1';
export const GUEST_FREE_DECK_LIMIT = 2;

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
