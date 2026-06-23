import { useCallback, useEffect, useState } from 'react';

import { fetchUserProgress, type UserProgress } from '@/lib/progress';

const emptyProgress: UserProgress = {
  streak: 0,
  cardsStudied: 0,
  quizzesTaken: 0,
  averageQuizPercent: 0,
  deckProgress: [],
  recentQuizzes: [],
};

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<UserProgress>(emptyProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setProgress(emptyProgress);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await fetchUserProgress(userId);
    setProgress(result.data ?? emptyProgress);
    setError(result.error);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { progress, isLoading, error, reload: load };
}
