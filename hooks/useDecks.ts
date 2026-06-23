import { useCallback, useEffect, useState } from 'react';

import { fetchDecks } from '@/lib/decks';
import type { DeckWithCardCount } from '@/types/database';

export function useDecks() {
  const [decks, setDecks] = useState<DeckWithCardCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchDecks();
    setDecks(result.data ?? []);
    setError(result.error);
    setFromCache(result.fromCache);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { decks, isLoading, error, fromCache, reload: load };
}
