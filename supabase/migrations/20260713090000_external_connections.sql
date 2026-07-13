-- User-owned external data connections. Tokens are encrypted by the app before storage.
create table public.external_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('gmail')),
  account_email text,
  refresh_token_ciphertext text not null,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active','expired','revoked')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create trigger external_connections_updated_at before update on public.external_connections
  for each row execute function public.set_updated_at();

alter table public.external_connections enable row level security;
-- Deliberately no user policies: token rows are server-only through the admin client.

