-- Public key/value config the app reads at startup.
-- Lets the self-hosted AI API move to a new tunnel URL without shipping a new APK.
-- Safe to run multiple times.

create table if not exists public.app_config (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "App config is readable by everyone" on public.app_config;
create policy "App config is readable by everyone"
  on public.app_config for select
  using (true);

-- Writes are service-role only (the start script on the host PC), so no
-- insert/update policy is defined here: service role bypasses RLS.

grant select on public.app_config to anon, authenticated;

insert into public.app_config (key, value)
values ('ai_api_url', '')
on conflict (key) do nothing;
