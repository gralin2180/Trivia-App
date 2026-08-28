import {
  loadDeckDetailFromCache,
  loadDecksFromCache,
  saveDeckDetailToCache,
  saveDecksToCache,
} from '@/lib/cache/deckCache';
import { decodeCardBack } from '@/lib/cardPayload';
import { loadGuestDeckIds } from '@/lib/ownDecks';
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

/**
 * Decks are private: signed-in users only see decks they created, guests only
 * see decks generated on this device. Nobody sees anyone else's topics.
 */
export async function fetchDecks(): Promise<FetchResult<DeckWithCardCount[]>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;
  const ownerScope = userId ?? 'guest';

  let query = supabase
    .from('decks')
    .select('id, title, description, category, created_at, cards(count)')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (userId) {
    query = query.eq('created_by', userId);
  } else {
    const guestDeckIds = await loadGuestDeckIds();
    if (guestDeckIds.length === 0) {
      return { data: [], error: null, fromCache: false };
    }
    query = query.in('id', guestDeckIds);
  }

  const { data, error } = await query;

  if (!error && data) {
    const decks = (data as DeckRow[]).map(mapDeck);
    await saveDecksToCache(decks, ownerScope);
    return { data: decks, error: null, fromCache: false };
  }

  const cached = await loadDecksFromCache(ownerScope);
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
        cards: (cards as Card[]).map((card) => {
          const decoded = decodeCardBack(card.back);
          return {
            ...card,
            back: decoded.answer,
            distractors: decoded.distractors.length ? decoded.distractors : card.distractors,
          };
        }),
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
