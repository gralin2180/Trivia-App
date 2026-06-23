import type { Card } from '@/types/database';

export function sortCardsForStudy(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const difficultyDiff = (a.difficulty ?? 1) - (b.difficulty ?? 1);
    if (difficultyDiff !== 0) return difficultyDiff;
    return a.order_index - b.order_index;
  });
}

export function difficultyLabel(difficulty?: number): string {
  if (difficulty === 3) return 'Advanced';
  if (difficulty === 2) return 'Intermediate';
  return 'Beginner';
}
