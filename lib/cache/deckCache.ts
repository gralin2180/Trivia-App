import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DeckDetail, DeckWithCardCount } from '@/types/database';

// Deck lists are cached per owner so switching accounts on one device never
// shows the previous user's decks.
const deckListKey = (ownerScope: string) => `trivia:decks:list:${ownerScope}`;
const deckKey = (deckId: string) => `trivia:deck:${deckId}`;

type CachedDeckList = {
  savedAt: string;
  decks: DeckWithCardCount[];
};

type CachedDeckDetail = {
  savedAt: string;
  deck: DeckDetail;
};

export async function saveDecksToCache(decks: DeckWithCardCount[], ownerScope: string) {
  const payload: CachedDeckList = {
    savedAt: new Date().toISOString(),
    decks,
  };
  await AsyncStorage.setItem(deckListKey(ownerScope), JSON.stringify(payload));
}

export async function loadDecksFromCache(ownerScope: string): Promise<DeckWithCardCount[] | null> {
  const raw = await AsyncStorage.getItem(deckListKey(ownerScope));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedDeckList;
    return parsed.decks ?? null;
  } catch {
    return null;
  }
}

export async function saveDeckDetailToCache(deck: DeckDetail) {
  const payload: CachedDeckDetail = {
    savedAt: new Date().toISOString(),
    deck,
  };
  await AsyncStorage.setItem(deckKey(deck.id), JSON.stringify(payload));
}

export async function loadDeckDetailFromCache(deckId: string): Promise<DeckDetail | null> {
  const raw = await AsyncStorage.getItem(deckKey(deckId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedDeckDetail;
    return parsed.deck ?? null;
  } catch {
    return null;
  }
}
