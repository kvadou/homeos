-- User-controlled outbound notifications and a server-only delivery ledger.

create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  safety_alerts boolean not null default true,
  care_reminders boolean not null default true,
  warranty_alerts boolean not null default true,
  weekly_digest boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, home_id)
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
create policy "notification_preferences: own member rows" on public.notification_preferences
  for all using (user_id = auth.uid() and public.is_home_member(home_id))
  with check (user_id = auth.uid() and public.is_home_member(home_id));

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  home_id uuid references public.homes(id) on delete cascade,
  kind text not null check (kind in ('invite','safety','warranty','care','digest')),
  dedupe_key text not null unique,
  recipient text not null,
  subject text not null,
  provider_id text,
  status text not null default 'pending' check (status in ('pending','sent','skipped','failed')),
  attempts integer not null default 0,
  last_error text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_deliveries_updated_at
  before update on public.notification_deliveries
  for each row execute function public.set_updated_at();

alter table public.notification_deliveries enable row level security;
-- Deliberately no session policies: the service-role notification worker owns this ledger.
