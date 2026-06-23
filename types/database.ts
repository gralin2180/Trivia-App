export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type Deck = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  topic?: string | null;
  source?: string;
  created_by?: string | null;
  created_at: string;
};

export type Card = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  order_index: number;
  difficulty?: number;
  created_at: string;
};

export type DeckWithCardCount = Deck & {
  card_count: number;
};

export type DeckDetail = Deck & {
  cards: Card[];
};

export type StudySession = {
  id: string;
  user_id: string;
  deck_id: string;
  cards_studied: number;
  started_at: string;
  ended_at: string | null;
};

export type CardReview = {
  id: string;
  user_id: string;
  card_id: string;
  was_correct: boolean;
  reviewed_at: string;
  next_review_at: string | null;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  deck_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
};
