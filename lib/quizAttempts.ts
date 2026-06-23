import { supabase } from '@/lib/supabase';

export async function saveQuizAttempt(
  userId: string,
  deckId: string,
  score: number,
  totalQuestions: number,
) {
  const { error } = await supabase.from('quiz_attempts').insert({
    user_id: userId,
    deck_id: deckId,
    score,
    total_questions: totalQuestions,
  });

  return { error: error?.message ?? null };
}
