import {
  loadDeckDetailFromCache,
  loadDecksFromCache,
  saveDeckDetailToCache,
  saveDecksToCache,
} from '@/lib/cache/deckCache';
import { supabase } from '@/lib/supabase';
import type { Card, Deck, DeckDetail, DeckWithCardCount } from '@/types/database';

type DeckRow = Deck & {
  cards: { count: number }[];
};

export type FetchResult<T> = {
  data: T | null;
  error: string | null;
  fromCache: boolean;
};

function mapDeck(row: DeckRow): DeckWithCardCount {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    created_at: row.created_at,
    card_count: row.cards?.[0]?.count ?? 0,
  };
}

export async function fetchDecks(): Promise<FetchResult<DeckWithCardCount[]>> {
  const { data, error } = await supabase
    .from('decks')
    .select('id, title, description, category, created_at, cards(count)')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (!error && data) {
    const decks = (data as DeckRow[]).map(mapDeck);
    await saveDecksToCache(decks);
    return { data: decks, error: null, fromCache: false };
  }

  const cached = await loadDecksFromCache();
  if (cached) {
    return {
      data: cached,
      error: null,
      fromCache: true,
    };
  }

  return {
    data: null,
    error: error?.message ?? 'Could not load decks.',
    fromCache: false,
  };
}

export async function fetchDeckById(deckId: string): Promise<FetchResult<DeckDetail>> {
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('id, title, description, category, created_at')
    .eq('id', deckId)
    .single();

  if (!deckError && deck) {
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, deck_id, front, back, order_index, difficulty, created_at')
      .eq('deck_id', deckId)
      .order('order_index', { ascending: true });

    if (!cardsError && cards) {
      const detail: DeckDetail = {
        ...(deck as Deck),
        cards: cards as Card[],
      };
      await saveDeckDetailToCache(detail);
      return { data: detail, error: null, fromCache: false };
    }
  }

  const cached = await loadDeckDetailFromCache(deckId);
  if (cached) {
    return { data: cached, error: null, fromCache: true };
  }

  return {
    data: null,
    error: deckError?.message ?? 'Could not load deck.',
    fromCache: false,
  };
}

export function groupDecksByCategory(decks: DeckWithCardCount[]): Record<string, DeckWithCardCount[]> {
  return decks.reduce<Record<string, DeckWithCardCount[]>>((groups, deck) => {
    const list = groups[deck.category] ?? [];
    list.push(deck);
    groups[deck.category] = list;
    return groups;
  }, {});
}
