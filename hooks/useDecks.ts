import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { fetchDecks } from '@/lib/decks';
import type { DeckWithCardCount } from '@/types/database';

export function useDecks() {
  const { user } = useAuth();
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
    // Refetch when the signed-in account changes so lists never leak across users.
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { decks, isLoading, error, fromCache, reload: load };
}
