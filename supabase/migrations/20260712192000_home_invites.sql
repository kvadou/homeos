-- Household sharing: invite links.
-- Owners mint a token; invitees never read this table directly — acceptance
-- runs through a service-role server action scoped strictly by the token row
-- (constitution §3.6). RLS here only lets an owner manage their own invites.

create table public.home_invites (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  email text,                      -- optional display hint, NOT an auth check
  role text not null default 'family' check (role in ('family','guest')),
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index home_invites_token_idx on public.home_invites (token);

alter table public.home_invites enable row level security;

-- Owner-only: the only session-context access to the table. Acceptance by an
-- invitee happens via service role, gated by possession of the token.
create policy "home_invites: owner all" on public.home_invites
  for all using (public.is_home_owner(home_id))
  with check (public.is_home_owner(home_id));
