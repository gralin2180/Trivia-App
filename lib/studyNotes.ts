import type { Card } from '@/types/database';
import { parseStudyNotes } from '@/lib/cardPayload';

/**
 * Turn flashcards into short study bullets shown before question practice.
 * Prefers AI study notes stored on the deck description when present.
 */
export function cardsToStudyBullets(cards: Card[], description?: string | null): string[] {
  const fromDeck = parseStudyNotes(description);
  if (fromDeck.length >= 3) return fromDeck;

  const bullets: string[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const fact = (card.back || '').trim();
    const prompt = (card.front || '').trim();
    if (!fact && !prompt) continue;

    let line: string;
    if (fact && prompt && fact.length < 160) {
      // Prefer the answer as the teaching point; front as label when short.
      line = prompt.length <= 48 ? `${prompt}: ${fact}` : fact;
    } else {
      line = fact || prompt;
    }

    const key = line.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    bullets.push(line.length > 220 ? `${line.slice(0, 217)}…` : line);
  }

  return bullets;
}
