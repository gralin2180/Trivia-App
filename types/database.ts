// Database types — we will expand these in Phase 8 when models are implemented.

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
  created_at: string;
};

export type Card = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  order_index: number;
  created_at: string;
};
