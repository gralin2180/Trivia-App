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

export function getQuizXpEarned(
  score: number,
  total: number,
  options?: { timed?: boolean },
): number {
  const base = score * game.xpPerQuizCorrect;
  const perfectBonus = score === total && total > 0 ? 50 : 0;
  const timedBonus = options?.timed ? score * game.timedXpBonusPerCorrect : 0;
  return base + perfectBonus + timedBonus;
}

export function getStudyXpEarned(cardsReviewed: number): number {
  return cardsReviewed * game.xpPerCard;
}

export type Achievement = {
  id: string;
  icon: string;
  label: string;
  unlocked: boolean;
};

export function buildAchievements(input: {
  streak: number;
  quizzesTaken: number;
  hasPerfectQuiz: boolean;
  cardsStudied: number;
  xp: number;
}): Achievement[] {
  return [
    {
      id: 'first_study',
      icon: '📖',
      label: 'First study',
      unlocked: input.cardsStudied >= 1,
    },
    {
      id: 'streak_7',
      icon: '🔥',
      label: '7-day streak',
      unlocked: input.streak >= 7,
    },
    {
      id: 'perfect',
      icon: '🏆',
      label: 'Perfect quiz',
      unlocked: input.hasPerfectQuiz,
    },
    {
      id: 'quiz_5',
      icon: '⚡',
      label: '5 quizzes',
      unlocked: input.quizzesTaken >= 5,
    },
    {
      id: 'xp_300',
      icon: '⭐',
      label: '300 XP',
      unlocked: input.xp >= 300,
    },
  ];
}

export type WeakDeck = {
  deckId: string;
  deckTitle: string;
  averagePercent: number;
};

export function buildWeakDecks(
  quizzes: { deckId: string; deckTitle: string; score: number; totalQuestions: number }[],
): WeakDeck[] {
  const byDeck = new Map<string, { title: string; percents: number[] }>();

  for (const quiz of quizzes) {
    if (!quiz.deckId || quiz.totalQuestions <= 0) continue;
    const percent = (quiz.score / quiz.totalQuestions) * 100;
    const entry = byDeck.get(quiz.deckId) ?? { title: quiz.deckTitle, percents: [] };
    entry.percents.push(percent);
    byDeck.set(quiz.deckId, entry);
  }

  return [...byDeck.entries()]
    .map(([deckId, value]) => ({
      deckId,
      deckTitle: value.title,
      averagePercent: Math.round(
        value.percents.reduce((sum, p) => sum + p, 0) / value.percents.length,
      ),
    }))
    .filter((deck) => deck.averagePercent < 70)
    .sort((a, b) => a.averagePercent - b.averagePercent)
    .slice(0, 3);
}


export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export function didLevelUp(xpBefore: number, xpEarned: number): boolean {
  const levelBefore = getLevelInfo(xpBefore).level;
  const levelAfter = getLevelInfo(xpBefore + xpEarned).level;
  return levelAfter > levelBefore;
}

export type StreakDay = {
  date: string;
  weekday: string;
  dayNum: number;
  active: boolean;
  isToday: boolean;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildStreakCalendar(activityDates: string[], days = 7): StreakDay[] {
  const daySet = new Set(activityDates.map((value) => value.slice(0, 10)));
  const today = new Date();
  const todayStr = formatDay(today);
  const calendar: StreakDay[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const dateStr = formatDay(date);

    calendar.push({
      date: dateStr,
      weekday: WEEKDAY_LABELS[date.getDay()],
      dayNum: date.getDate(),
      active: daySet.has(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  return calendar;
}
