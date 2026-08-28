import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildQuizQuestions } from '@/lib/quiz';
import { saveQuizAttempt } from '@/lib/quizAttempts';
import { bumpQuestProgress } from '@/lib/quests';
import type { Card } from '@/types/database';
import type { QuizAnswer, QuizQuestion } from '@/lib/quiz';

type QuizPhase = 'loading' | 'quiz' | 'results';

export function useQuiz(
  deckId: string | undefined,
  cards: Card[],
  userId: string | undefined,
  quizMode: 'normal' | 'practice' | 'timed' = 'normal',
) {
  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!deckId) {
      setError('Deck not found.');
      setPhase('loading');
      return;
    }

    if (cards.length < 2) {
      setError('This deck needs at least 2 cards for a quiz.');
      setPhase('loading');
      return;
    }

    setQuestions(buildQuizQuestions(cards));
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setError(null);
    setPhase('quiz');
  }, [deckId, userId, cards]);

  const currentQuestion = questions[currentIndex] ?? null;
  const progressLabel =
    questions.length > 0 ? `${Math.min(currentIndex + 1, questions.length)} / ${questions.length}` : '0 / 0';

  const score = answers.filter((answer) => answer.isCorrect).length;

  const selectOption = useCallback(
    (option: string) => {
      if (!currentQuestion || selectedOption !== null) return;

      setSelectedOption(option);

      const isCorrect = option === currentQuestion.correctAnswer;
      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          selected: option,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect,
        },
      ]);
    },
    [currentQuestion, selectedOption],
  );

  const goNext = useCallback(async () => {
    if (!deckId) return;

    const isLast = currentIndex >= questions.length - 1;

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      return;
    }

    setIsSaving(true);

    const finalAnswers =
      currentQuestion && selectedOption && answers.length === currentIndex
        ? [
            ...answers,
            {
              questionId: currentQuestion.id,
              prompt: currentQuestion.prompt,
              selected: selectedOption,
              correctAnswer: currentQuestion.correctAnswer,
              isCorrect: selectedOption === currentQuestion.correctAnswer,
            },
          ]
        : answers;

    const finalScore = finalAnswers.filter((answer) => answer.isCorrect).length;
    // Guests take the quiz locally; attempts are only persisted for real users.
    if (userId) {
      const result = await saveQuizAttempt(userId, deckId, finalScore, questions.length);
      if (result.error) {
        setError(result.error);
      }
    }
    void bumpQuestProgress('quiz');
    if (quizMode === 'timed') {
      void bumpQuestProgress('timed');
    }
    setIsSaving(false);

    setAnswers(finalAnswers);
    setPhase('results');
  }, [deckId, userId, currentIndex, questions.length, answers, currentQuestion, selectedOption, quizMode]);

  const restart = useCallback(() => {
    setQuestions(buildQuizQuestions(cards));
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setError(null);
    setPhase('quiz');
  }, [cards]);

  return useMemo(
    () => ({
      phase,
      currentQuestion,
      currentIndex,
      progressLabel,
      selectedOption,
      answers,
      score,
      total: questions.length,
      error,
      isSaving,
      selectOption,
      goNext,
      restart,
      canGoNext: selectedOption !== null,
    }),
    [
      phase,
      currentQuestion,
      currentIndex,
      progressLabel,
      selectedOption,
      answers,
      score,
      questions.length,
      error,
      isSaving,
      selectOption,
      goNext,
      restart,
    ],
  );
}
