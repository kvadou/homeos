-- A6: operator-confirmed provider availability and measurable pilot readiness.

create table public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.provider_businesses(id) on delete cascade,
  status text not null default 'unknown'
    check (status in ('accepting','limited','unavailable','unknown')),
  next_available_on date,
  typical_response_minutes int check (typical_response_minutes is null or typical_response_minutes > 0),
  capacity_notes text,
  source text not null check (source in ('operator_call','provider_message','booking_link','provider_portal','api')),
  confirmed_at timestamptz not null,
  valid_until timestamptz not null,
  confirmed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until > confirmed_at)
);
create index provider_availability_current_idx on public.provider_availability(status, valid_until);
create trigger provider_availability_updated_at before update on public.provider_availability
  for each row execute function public.set_updated_at();

create table public.provider_pilot_simulations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_businesses(id) on delete cascade,
  scenario text not null check (scenario in ('routine_appliance','urgent_appliance','no_availability','booking_change')),
  result text not null check (result in ('passed','needs_follow_up','failed')),
  response_minutes int check (response_minutes is null or response_minutes >= 0),
  notes text not null,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index provider_pilot_simulations_provider_idx
  on public.provider_pilot_simulations(provider_id, performed_at desc);

alter table public.provider_availability enable row level security;
alter table public.provider_pilot_simulations enable row level security;
-- Operations-only tables. /admin uses the service-role client after the admin gate.
