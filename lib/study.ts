import { supabase } from '@/lib/supabase';
import { getNextReviewAt } from '@/lib/spacedRepetition';

export async function startStudySession(userId: string, deckId: string) {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: userId, deck_id: deckId })
    .select('id')
    .single();

  if (error) {
    return { sessionId: null, error: error.message };
  }

  return { sessionId: data.id as string, error: null };
}

export async function completeStudySession(sessionId: string, cardsStudied: number) {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      cards_studied: cardsStudied,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  return { error: error?.message ?? null };
}

export async function recordCardReview(
  userId: string,
  cardId: string,
  wasCorrect: boolean,
  previousIntervalDays = 0,
) {
  const nextReviewAt = getNextReviewAt(wasCorrect, previousIntervalDays);

  const { error } = await supabase.from('card_reviews').insert({
    user_id: userId,
    card_id: cardId,
    was_correct: wasCorrect,
    next_review_at: nextReviewAt.toISOString(),
  });

  return { error: error?.message ?? null };
}
