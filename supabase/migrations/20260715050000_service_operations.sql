-- A3: explicit escalation and quality-review records for the private ops console.

create table public.service_escalations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  kind text not null check (kind in ('safety_review','provider_question','response_overdue','quality_review','booking_overdue','other')),
  priority text not null default 'normal' check (priority in ('normal','urgent','immediate')),
  status text not null default 'open' check (status in ('open','resolved')),
  summary text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (service_case_id, home_id) references public.service_cases(id, home_id) on delete cascade
);
create index service_escalations_open_idx on public.service_escalations (status, priority, created_at);

create table public.service_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null check (decision in ('approved','changes_required')),
  checks jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  foreign key (service_case_id, home_id) references public.service_cases(id, home_id) on delete cascade
);
create index service_quality_reviews_case_idx on public.service_quality_reviews (service_case_id, created_at desc);

alter table public.service_escalations enable row level security;
alter table public.service_quality_reviews enable row level security;
-- Operations-only: intentionally no authenticated policies.
