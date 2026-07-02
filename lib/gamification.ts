import { game } from '@/constants/theme';

export type LevelInfo = {
  level: number;
  xp: number;
  xpInLevel: number;
  xpToNextLevel: number;
  progress: number;
};

export function calculateXp(cardsStudied: number, totalQuizScore: number): number {
  return cardsStudied * game.xpPerCard + totalQuizScore * game.xpPerQuizCorrect;
}

export function getLevelInfo(xp: number): LevelInfo {
  const level = Math.floor(xp / game.xpPerLevel) + 1;
  const xpInLevel = xp % game.xpPerLevel;
  return {
    level,
    xp,
    xpInLevel,
    xpToNextLevel: game.xpPerLevel,
    progress: xpInLevel / game.xpPerLevel,
  };
}

export function getDifficultyBadge(percent: number): string {
  if (percent === 0) return 'New';
  if (percent < 30) return 'Beginner';
  if (percent < 70) return 'Learner';
  if (percent < 100) return 'Pro';
  return 'Master';
}

export function getQuizXpEarned(score: number, total: number): number {
  const base = score * game.xpPerQuizCorrect;
  const perfectBonus = score === total && total > 0 ? 50 : 0;
  return base + perfectBonus;
}

export function getStudyXpEarned(cardsReviewed: number): number {
  return cardsReviewed * game.xpPerCard;
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
