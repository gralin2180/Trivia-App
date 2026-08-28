import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local registry of deck ids generated on this device by a guest.
 * Signed-in users don't need it — their decks carry `created_by` in Supabase.
 */
const GUEST_DECKS_KEY = 'own_guest_deck_ids_v1';

export async function loadGuestDeckIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function registerGuestDeckId(deckId: string): Promise<void> {
  const ids = await loadGuestDeckIds();
  if (ids.includes(deckId)) return;
  await AsyncStorage.setItem(GUEST_DECKS_KEY, JSON.stringify([...ids, deckId].slice(-100)));
}
