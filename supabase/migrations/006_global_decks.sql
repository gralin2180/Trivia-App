-- Global / reusable AI decks: share recent topic decks so we can skip re-generation.

alter table public.decks
  add column if not exists is_public boolean not null default false,
  add column if not exists topic_key text,
  add column if not exists difficulty text,
  add column if not exists reuse_count int not null default 0,
  add column if not exists context_source text;

create index if not exists decks_topic_key_idx
  on public.decks (topic_key, difficulty)
  where source = 'ai' and is_public = true;

create index if not exists decks_public_recent_idx
  on public.decks (created_at desc)
  where is_public = true and source = 'ai';

drop policy if exists "Authenticated users can read decks" on public.decks;
create policy "Read own or public decks"
  on public.decks for select
  to authenticated, anon
  using (
    is_public = true
    or created_by = auth.uid()
  );

drop policy if exists "Authenticated users can read cards" on public.cards;
create policy "Read cards for own or public decks"
  on public.cards for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id
        and (d.is_public = true or d.created_by = auth.uid())
    )
  );

update public.decks
set
  is_public = true,
  topic_key = lower(regexp_replace(coalesce(topic, title), '[^a-z0-9]+', '-', 'g')),
  difficulty = coalesce(difficulty, 'medium')
where source = 'ai'
  and (topic_key is null or is_public = false);
