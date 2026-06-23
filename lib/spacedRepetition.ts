const DAY_MS = 24 * 60 * 60 * 1000;

export function getNextReviewAt(wasCorrect: boolean, previousIntervalDays = 0): Date {
  const now = new Date();

  if (!wasCorrect) {
    return new Date(now.getTime() + DAY_MS);
  }

  const intervalDays = previousIntervalDays === 0 ? 1 : Math.min(previousIntervalDays * 2, 30);
  return new Date(now.getTime() + intervalDays * DAY_MS);
}

export function getIntervalDays(wasCorrect: boolean, previousIntervalDays = 0): number {
  if (!wasCorrect) return 1;
  return previousIntervalDays === 0 ? 1 : Math.min(previousIntervalDays * 2, 30);
}
