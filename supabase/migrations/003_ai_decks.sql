-- Run after schema.sql if you already created the database.
-- Adds AI deck metadata + progressive difficulty on cards.

alter table public.decks
  add column if not exists topic text,
  add column if not exists source text not null default 'seed',
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.cards
  add column if not exists difficulty int not null default 1 check (difficulty between 1 and 3);

create index if not exists decks_created_by_idx on public.decks (created_by);
