import { supabase } from '@/lib/supabase';

export type DeckProgressItem = {
  deckId: string;
  deckTitle: string;
  cardsStudied: number;
  totalCards: number;
  percent: number;
};

export type RecentQuiz = {
  id: string;
  deckTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
};

export type UserProgress = {
  streak: number;
  cardsStudied: number;
  quizzesTaken: number;
  averageQuizPercent: number;
  deckProgress: DeckProgressItem[];
  recentQuizzes: RecentQuiz[];
};

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function calculateStreak(activityDates: string[]): number {
  if (activityDates.length === 0) return 0;

  const daySet = new Set(activityDates.map((value) => value.slice(0, 10)));
  const today = new Date();
  const todayStr = formatDay(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDay(yesterday);

  let cursor: Date;
  if (daySet.has(todayStr)) {
    cursor = new Date(today);
  } else if (daySet.has(yesterdayStr)) {
    cursor = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  while (daySet.has(formatDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function fetchUserProgress(userId: string): Promise<{
  data: UserProgress | null;
  error: string | null;
}> {
  const [reviewsResult, sessionsResult, quizzesResult, quizCountResult, decksResult] =
    await Promise.all([
    supabase
      .from('card_reviews')
      .select('reviewed_at, card_id, cards!inner(deck_id)')
      .eq('user_id', userId),
    supabase.from('study_sessions').select('started_at').eq('user_id', userId),
    supabase
      .from('quiz_attempts')
      .select('id, score, total_questions, completed_at, decks(title)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('quiz_attempts')
      .select('score, total_questions')
      .eq('user_id', userId),
    supabase.from('decks').select('id, title, cards(count)'),
  ]);

  if (reviewsResult.error) return { data: null, error: reviewsResult.error.message };
  if (sessionsResult.error) return { data: null, error: sessionsResult.error.message };
  if (quizzesResult.error) return { data: null, error: quizzesResult.error.message };
  if (quizCountResult.error) return { data: null, error: quizCountResult.error.message };
  if (decksResult.error) return { data: null, error: decksResult.error.message };

  const activityDates = [
    ...(reviewsResult.data ?? []).map((row) => row.reviewed_at as string),
    ...(sessionsResult.data ?? []).map((row) => row.started_at as string),
    ...(quizzesResult.data ?? []).map((row) => row.completed_at as string),
  ];

  const studiedByDeck = new Map<string, Set<string>>();
  for (const row of reviewsResult.data ?? []) {
    const cardId = row.card_id as string;
    const cards = row.cards as unknown as { deck_id: string } | null;
    const deckId = cards?.deck_id;
    if (!deckId) continue;
    const set = studiedByDeck.get(deckId) ?? new Set<string>();
    set.add(cardId);
    studiedByDeck.set(deckId, set);
  }

  type DeckRow = {
    id: string;
    title: string;
    cards: { count: number }[];
  };

  const deckProgress: DeckProgressItem[] = ((decksResult.data ?? []) as DeckRow[]).map((deck) => {
    const totalCards = deck.cards?.[0]?.count ?? 0;
    const cardsStudied = studiedByDeck.get(deck.id)?.size ?? 0;
    const percent = totalCards > 0 ? Math.round((cardsStudied / totalCards) * 100) : 0;

    return {
      deckId: deck.id,
      deckTitle: deck.title,
      cardsStudied,
      totalCards,
      percent,
    };
  });

  const allQuizzes = quizCountResult.data ?? [];
  const quizzesTaken = allQuizzes.length;
  const averageQuizPercent =
    quizzesTaken > 0
      ? Math.round(
          allQuizzes.reduce((sum, quiz) => {
            const total = quiz.total_questions as number;
            const score = quiz.score as number;
            return sum + (total > 0 ? (score / total) * 100 : 0);
          }, 0) / quizzesTaken,
        )
      : 0;

  const recentQuizzes: RecentQuiz[] = (quizzesResult.data ?? []).map((quiz) => ({
    id: quiz.id as string,
    deckTitle: (quiz.decks as unknown as { title: string } | null)?.title ?? 'Unknown deck',
    score: quiz.score as number,
    totalQuestions: quiz.total_questions as number,
    completedAt: quiz.completed_at as string,
  }));

  return {
    data: {
      streak: calculateStreak(activityDates),
      cardsStudied: reviewsResult.data?.length ?? 0,
      quizzesTaken,
      averageQuizPercent,
      deckProgress,
      recentQuizzes,
    },
    error: null,
  };
}
