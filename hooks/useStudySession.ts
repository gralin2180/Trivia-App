import { useCallback, useEffect, useMemo, useState } from 'react';

import { sortCardsForStudy } from '@/lib/cards';
import { cardsToStudyBullets } from '@/lib/studyNotes';
import { completeStudySession, recordCardReview, startStudySession } from '@/lib/study';
import { speakFeedback, stopSpeaking } from '@/lib/voice';
import type { Card } from '@/types/database';

export type StudyPhase = 'loading' | 'notes' | 'studying' | 'complete';

type StudyStats = {
  correct: number;
  wrong: number;
  total: number;
};

export function useStudySession(
  deckId: string | undefined,
  cards: Card[],
  userId: string | undefined,
  description?: string | null,
) {
  const [phase, setPhase] = useState<StudyPhase>('loading');
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<StudyStats>({ correct: 0, wrong: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);

  useEffect(() => {
    if (!deckId) {
      setError('Deck not found.');
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
      stopSpeaking();

      let newSessionId: string | null = null;
      if (activeUserId) {
        const session = await startStudySession(activeUserId, activeDeckId);
        if (cancelled) return;
        newSessionId = session.sessionId;
      }
      if (cancelled) return;

      setSessionId(newSessionId);
      const studyBullets = cardsToStudyBullets(cards, description);
      setBullets(studyBullets);
      setQueue(sortCardsForStudy(cards));
      setCurrentIndex(0);
      setIsFlipped(false);
      setStats({ correct: 0, wrong: 0, total: cards.length });
      setPhase('notes');

      if (studyBullets.length > 0) {
        void speakFeedback(`Study these points. ${studyBullets.slice(0, 4).join('. ')}`);
      }
    }

    void init();

    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [deckId, userId, cards, description]);

  const currentCard = queue[currentIndex] ?? null;
  const progressLabel =
    queue.length > 0 ? `${Math.min(currentIndex + 1, queue.length)} / ${queue.length}` : '0 / 0';

  const beginQuestions = useCallback(() => {
    stopSpeaking();
    setPhase('studying');
    setCurrentIndex(0);
    setIsFlipped(false);
    void speakFeedback('Time for questions. Flip each card, then say if you got it right.');
  }, []);

  const finishSession = useCallback(
    async (finalStats: StudyStats) => {
      if (sessionId) {
        await completeStudySession(sessionId, finalStats.correct + finalStats.wrong);
      }
      setStats(finalStats);
      setPhase('complete');
      void speakFeedback(
        `Session complete. You got ${finalStats.correct} right and missed ${finalStats.wrong}. Ready for a quiz?`,
      );
    },
    [sessionId],
  );

  const answerCard = useCallback(
    async (wasCorrect: boolean) => {
      if (!currentCard || isSaving || phase !== 'studying') return;

      setIsSaving(true);
      stopSpeaking();

      if (userId) {
        await recordCardReview(userId, currentCard.id, wasCorrect);
      }

      void speakFeedback(wasCorrect ? 'Nice — you got it right.' : 'Okay — we will review that again.');

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
    [currentCard, userId, isSaving, stats, currentIndex, queue, finishSession, phase],
  );

  const flipCard = useCallback(() => {
    if (phase !== 'studying' || !currentCard) return;
    setIsFlipped((prev) => {
      const next = !prev;
      if (next) {
        void speakFeedback(`Question: ${currentCard.front}. The answer is: ${currentCard.back}`);
      }
      return next;
    });
  }, [phase, currentCard]);

  const restart = useCallback(async () => {
    if (!deckId || cards.length === 0) return;

    setPhase('loading');
    setError(null);
    stopSpeaking();

    let newSessionId: string | null = null;
    if (userId) {
      const session = await startStudySession(userId, deckId);
      newSessionId = session.sessionId;
    }
    setSessionId(newSessionId);
      const studyBullets = cardsToStudyBullets(cards, description);
    setBullets(studyBullets);
    setQueue(sortCardsForStudy(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ correct: 0, wrong: 0, total: cards.length });
    setPhase('notes');
  }, [deckId, userId, cards, description]);

  return useMemo(
    () => ({
      phase,
      bullets,
      currentCard,
      isFlipped,
      progressLabel,
      stats,
      error,
      isSaving,
      beginQuestions,
      flipCard,
      markCorrect: () => answerCard(true),
      markWrong: () => answerCard(false),
      reset: restart,
    }),
    [
      phase,
      bullets,
      currentCard,
      isFlipped,
      progressLabel,
      stats,
      error,
      isSaving,
      beginQuestions,
      flipCard,
      answerCard,
      restart,
    ],
  );
}
