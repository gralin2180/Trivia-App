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

/** Normalised comparison so “same answer, different spacing/case” counts as a dupe. */
function answerKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

const FILLER_OPTIONS = [
  'None of the other answers is correct.',
  'This is not covered by the deck.',
  'The opposite of the correct answer.',
];

export function buildQuizQuestions(cards: Card[]): QuizQuestion[] {
  return cards.map((card) => {
    // Dedupe the distractor pool — decks often contain repeated or
    // near-identical answers, which used to surface as repeating options.
    const seen = new Set<string>([answerKey(card.back)]);
    const wrongPool: string[] = [];

    const stored = (card.distractors ?? []).filter((opt) => answerKey(opt) !== answerKey(card.back));
    for (const opt of stored) {
      const key = answerKey(opt);
      if (!seen.has(key)) {
        seen.add(key);
        wrongPool.push(opt);
      }
    }

    for (const other of cards) {
      const key = answerKey(other.back);
      if (!seen.has(key)) {
        seen.add(key);
        wrongPool.push(other.back);
      }
    }

    const wrongOptions = shuffle(wrongPool).slice(0, 3);

    let fillerIndex = 0;
    while (wrongOptions.length < 3 && fillerIndex < FILLER_OPTIONS.length) {
      wrongOptions.push(FILLER_OPTIONS[fillerIndex]);
      fillerIndex += 1;
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
