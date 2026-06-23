-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Creates tables, security rules, and 2 sample decks with cards.

-- ─── Tables ───────────────────────────────────────────────────────────────

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  front text not null,
  back text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  cards_studied int not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  was_correct boolean not null,
  reviewed_at timestamptz not null default now(),
  next_review_at timestamptz
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  score int not null,
  total_questions int not null,
  completed_at timestamptz not null default now()
);

create index if not exists cards_deck_id_idx on public.cards (deck_id);

-- ─── Row Level Security ───────────────────────────────────────────────────

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.study_sessions enable row level security;
alter table public.card_reviews enable row level security;
alter table public.quiz_attempts enable row level security;

-- Decks & cards: any logged-in user can read (shared study content)
create policy "Authenticated users can read decks"
  on public.decks for select
  to authenticated
  using (true);

create policy "Authenticated users can read cards"
  on public.cards for select
  to authenticated
  using (true);

-- Progress tables: users only see their own data (used in later phases)
create policy "Users can read own study sessions"
  on public.study_sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own study sessions"
  on public.study_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own card reviews"
  on public.card_reviews for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own card reviews"
  on public.card_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own quiz attempts"
  on public.quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own quiz attempts"
  on public.quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── Sample data (safe to re-run: skips if decks already exist) ───────────

do $$
begin
  if exists (select 1 from public.decks limit 1) then
    return;
  end if;

  insert into public.decks (title, description, category) values
    (
      'European Capitals',
      'Learn the capital cities of major European countries.',
      'Geography'
    ),
    (
      'Solar System Basics',
      'Key facts about planets and our solar neighborhood.',
      'Science'
    );

  insert into public.cards (deck_id, front, back, order_index)
  select d.id, v.front, v.back, v.order_index
  from public.decks d
  cross join lateral (
    values
      ('What is the capital of France?', 'Paris', 1),
      ('What is the capital of Germany?', 'Berlin', 2),
      ('What is the capital of Italy?', 'Rome', 3),
      ('What is the capital of Spain?', 'Madrid', 4),
      ('What is the capital of Portugal?', 'Lisbon', 5)
  ) as v(front, back, order_index)
  where d.title = 'European Capitals';

  insert into public.cards (deck_id, front, back, order_index)
  select d.id, v.front, v.back, v.order_index
  from public.decks d
  cross join lateral (
    values
      ('Which planet is closest to the Sun?', 'Mercury', 1),
      ('Which planet is known as the Red Planet?', 'Mars', 2),
      ('What is the largest planet in our solar system?', 'Jupiter', 3),
      ('How many planets are in our solar system?', 'Eight', 4),
      ('Which planet has prominent rings?', 'Saturn', 5)
  ) as v(front, back, order_index)
  where d.title = 'Solar System Basics';
end $$;
