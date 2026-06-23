import { useCallback, useEffect, useMemo, useState } from 'react';

import { completeStudySession, recordCardReview, startStudySession } from '@/lib/study';
import { sortCardsForStudy } from '@/lib/cards';
import type { Card } from '@/types/database';

type StudyPhase = 'loading' | 'studying' | 'complete';

type StudyStats = {
  correct: number;
  wrong: number;
  total: number;
};

export function useStudySession(deckId: string | undefined, cards: Card[], userId: string | undefined) {
  const [phase, setPhase] = useState<StudyPhase>('loading');
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<StudyStats>({ correct: 0, wrong: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!deckId || !userId) {
      setError('You must be signed in to study.');
      setPhase('loading');
      return;
    }

    if (cards.length === 0) {
      setError('This deck has no cards to study.');
      setPhase('loading');
      return;
    }

    const activeUserId = userId;
    const activeDeckId = deckId;
    let cancelled = false;

    async function init() {
      setPhase('loading');
      setError(null);

      const session = await startStudySession(activeUserId, activeDeckId);
      if (cancelled) return;

      if (session.error || !session.sessionId) {
        setError(session.error ?? 'Could not start study session.');
        return;
      }

      setSessionId(session.sessionId);
      setQueue(sortCardsForStudy(cards));
      setCurrentIndex(0);
      setIsFlipped(false);
      setStats({ correct: 0, wrong: 0, total: cards.length });
      setPhase('studying');
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [deckId, userId, cards]);

  const currentCard = queue[currentIndex] ?? null;
  const progressLabel = queue.length > 0 ? `${Math.min(currentIndex + 1, queue.length)} / ${queue.length}` : '0 / 0';

  const finishSession = useCallback(
    async (finalStats: StudyStats) => {
      if (sessionId) {
        await completeStudySession(sessionId, finalStats.correct + finalStats.wrong);
      }
      setStats(finalStats);
      setPhase('complete');
    },
    [sessionId],
  );

  const answerCard = useCallback(
    async (wasCorrect: boolean) => {
      if (!currentCard || !userId || isSaving) return;

      setIsSaving(true);

      await recordCardReview(userId, currentCard.id, wasCorrect);

      const nextStats: StudyStats = {
        ...stats,
        correct: stats.correct + (wasCorrect ? 1 : 0),
        wrong: stats.wrong + (wasCorrect ? 0 : 1),
      };
      setStats(nextStats);

      let nextQueue = queue;
      if (!wasCorrect) {
        nextQueue = [...queue, currentCard];
        setQueue(nextQueue);
      }

      const isAtEnd = currentIndex >= nextQueue.length - 1;

      if (isAtEnd) {
        await finishSession(nextStats);
        setIsSaving(false);
        return;
      }

      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setIsSaving(false);
    },
    [currentCard, userId, isSaving, stats, currentIndex, queue.length, finishSession],
  );

  const flipCard = useCallback(() => {
    if (phase === 'studying' && currentCard) {
      setIsFlipped((prev) => !prev);
    }
  }, [phase, currentCard]);

  const restart = useCallback(async () => {
    if (!deckId || !userId || cards.length === 0) return;

    setPhase('loading');
    setError(null);

    const session = await startStudySession(userId, deckId);
    if (session.error || !session.sessionId) {
      setError(session.error ?? 'Could not start study session.');
      return;
    }

    setSessionId(session.sessionId);
    setQueue(sortCardsForStudy(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ correct: 0, wrong: 0, total: cards.length });
    setPhase('studying');
  }, [deckId, userId, cards]);

  return useMemo(
    () => ({
      phase,
      currentCard,
      isFlipped,
      progressLabel,
      stats,
      error,
      isSaving,
      flipCard,
      markCorrect: () => answerCard(true),
      markWrong: () => answerCard(false),
      reset: restart,
    }),
    [phase, currentCard, isFlipped, progressLabel, stats, error, isSaving, flipCard, answerCard, restart],
  );
}
