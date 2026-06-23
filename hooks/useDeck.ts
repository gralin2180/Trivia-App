import { useCallback, useEffect, useState } from 'react';

import { fetchDeckById } from '@/lib/decks';
import type { DeckDetail } from '@/types/database';

export function useDeck(deckId: string | undefined) {
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(async () => {
    if (!deckId) {
      setError('Deck not found.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await fetchDeckById(deckId);
    setDeck(result.data);
    setError(result.error);
    setFromCache(result.fromCache);
    setIsLoading(false);
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  return { deck, isLoading, error, fromCache, reload: load };
}
