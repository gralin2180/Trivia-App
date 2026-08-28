import { getAiApiUrl } from '@/lib/remoteConfig';

export type PublicDeck = {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  difficulty: string;
  reuseCount: number;
  contextSource: string | null;
  createdAt: string | null;
  cardCount: number;
};

export async function fetchPublicDecks(limit = 16): Promise<{
  decks: PublicDeck[];
  error: string | null;
}> {
  const base = (await getAiApiUrl()).replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/public-decks?limit=${limit}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (!response.ok) {
      const text = await response.text();
      return { decks: [], error: text.slice(0, 200) || `HTTP ${response.status}` };
    }
    const body = (await response.json()) as { decks?: PublicDeck[] };
    return { decks: body.decks ?? [], error: null };
  } catch (err) {
    return {
      decks: [],
      error: err instanceof Error ? err.message : 'Could not load global decks.',
    };
  }
}
