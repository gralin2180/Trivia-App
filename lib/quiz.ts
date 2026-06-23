import type { Card } from '@/types/database';

export type QuizQuestion = {
  id: string;
  cardId: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
};

export type QuizAnswer = {
  questionId: string;
  prompt: string;
  selected: string;
  correctAnswer: string;
  isCorrect: boolean;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuizQuestions(cards: Card[]): QuizQuestion[] {
  const allAnswers = cards.map((card) => card.back);

  return cards.map((card) => {
    const wrongPool = allAnswers.filter((answer) => answer !== card.back);
    const wrongOptions = shuffle(wrongPool).slice(0, 3);

    while (wrongOptions.length < 3) {
      wrongOptions.push(`Not: ${card.front.slice(0, 24)}`);
    }

    const options = shuffle([card.back, ...wrongOptions.slice(0, 3)]);

    return {
      id: card.id,
      cardId: card.id,
      prompt: card.front,
      correctAnswer: card.back,
      options,
    };
  });
}
