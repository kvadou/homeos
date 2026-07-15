-- Phase 5: research-safe entitlements and willingness-to-pay evidence.

create table public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','founding','plus')),
  status text not null default 'active' check (status in ('active','trialing','expired','cancelled')),
  source text not null default 'system' check (source in ('system','founder','stripe','app_store')),
  current_period_ends_at timestamptz,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create trigger account_entitlements_updated_at before update on public.account_entitlements
  for each row execute function public.set_updated_at();

create table public.monetization_research_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  prompt_key text not null,
  plan text not null check (plan in ('plus')),
  price_cents int not null check (price_cents > 0),
  billing_period text not null check (billing_period in ('month','year')),
  response text not null check (response in ('not_now','maybe','likely','early_access')),
  value_theme text check (value_theme is null or value_theme in ('intelligence','collaboration','integrations','reports','multiple_homes','provider_coordination')),
  reason text check (reason is null or char_length(reason) <= 1000),
  activated boolean not null default false,
  surface text not null check (surface in ('web','ios')),
  created_at timestamptz not null default now()
);
create index monetization_research_created_idx on public.monetization_research_responses(created_at desc);
create index monetization_research_user_idx on public.monetization_research_responses(user_id, created_at desc);

alter table public.account_entitlements enable row level security;
alter table public.monetization_research_responses enable row level security;

create policy "Users read own entitlement" on public.account_entitlements
  for select using (user_id = auth.uid());

create policy "Users read own monetization research" on public.monetization_research_responses
  for select using (user_id = auth.uid());
create policy "Users add own monetization research" on public.monetization_research_responses
  for insert with check (
    user_id = auth.uid()
    and (home_id is null or public.is_home_member(home_id))
  );

-- Writes to account_entitlements are service-role only after verified payment
-- or an explicit founder grant. Research responses never grant access.
