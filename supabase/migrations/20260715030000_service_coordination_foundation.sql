-- GatherRoot provider coordination, Milestone A foundation.
-- The provider network is private to operations. Households can read their own
-- case records, but every mutation goes through audited server-side commands.

-- ============ provider network (service-role only) ============

create table public.provider_businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  website text,
  phone text,
  email text,
  status text not null default 'candidate'
    check (status in ('candidate','invited','active','paused','removed')),
  pilot_market text not null default 'twin_cities',
  services jsonb not null default '[]',
  brands jsonb not null default '[]',
  service_area jsonb not null default '{}',
  booking_modes jsonb not null default '[]',
  booking_url text,
  diagnostic_policy jsonb not null default '{}',
  cancellation_policy text,
  parts_labor_warranty text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index provider_businesses_market_status_idx
  on public.provider_businesses (pilot_market, status);
create trigger provider_businesses_updated_at before update on public.provider_businesses
  for each row execute function public.set_updated_at();

create table public.provider_verifications (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_businesses(id) on delete cascade,
  kind text not null
    check (kind in ('identity','insurance','license','manufacturer','service_area','contact')),
  status text not null default 'pending'
    check (status in ('pending','verified','expired','failed','not_applicable')),
  value text,
  source text,
  verified_at timestamptz,
  expires_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  evidence_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, kind, value)
);
create index provider_verifications_provider_idx
  on public.provider_verifications (provider_id, status);
create trigger provider_verifications_updated_at before update on public.provider_verifications
  for each row execute function public.set_updated_at();

alter table public.provider_businesses enable row level security;
alter table public.provider_verifications enable row level security;
-- Deliberately no authenticated-user policies. /admin and coordination services
-- use the service-role client only after their own admin/home authorization gate.

-- ============ service cases ============

create table public.service_cases (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  assigned_operator_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft'
    check (status in (
      'draft','safety_screened','intake_ready','sharing_approved','sourcing',
      'awaiting_provider_responses','options_ready','selection_approved',
      'booking_pending','confirmed','service_underway','completed','recorded',
      'safety_stopped','diy_resolved','warranty_routed','no_qualified_provider',
      'no_availability','slot_expired','cancelled','booking_failed','disputed'
    )),
  service_category text not null default 'appliance_repair'
    check (service_category = 'appliance_repair'),
  urgency text not null default 'routine'
    check (urgency in ('routine','soon','safety_stop')),
  symptom_summary text,
  structured_intake jsonb not null default '{}',
  preferred_windows jsonb not null default '[]',
  service_address_snapshot jsonb not null default '{}',
  item_snapshot jsonb not null default '{}',
  safety_result jsonb not null default '{}',
  sharing_status text not null default 'not_requested'
    check (sharing_status in ('not_requested','approved','revoked','expired')),
  sharing_scope jsonb not null default '{}',
  sharing_expires_at timestamptz,
  resolution text
    check (resolution is null or resolution in
      ('booked','diy','warranty','no_supply','cancelled','failed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, home_id)
);
create index service_cases_home_status_idx on public.service_cases (home_id, status);
create index service_cases_operator_status_idx
  on public.service_cases (assigned_operator_id, status)
  where assigned_operator_id is not null;
create trigger service_cases_updated_at before update on public.service_cases
  for each row execute function public.set_updated_at();

-- Composite reference prevents selecting a file from another home.
create unique index files_id_home_unique on public.files (id, home_id);

create table public.service_case_files (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  file_id uuid not null,
  approved_for_sharing boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade,
  foreign key (file_id, home_id)
    references public.files(id, home_id) on delete cascade,
  unique (service_case_id, file_id)
);
create index service_case_files_case_idx on public.service_case_files (service_case_id);

-- ============ sourcing and offers ============

create table public.provider_requests (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  provider_id uuid not null references public.provider_businesses(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft','approved_to_send','sent','viewed','responded','declined','expired','withdrawn')),
  channel text check (channel is null or channel in ('phone','sms','email','booking_link')),
  request_payload jsonb not null default '{}',
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  response_summary jsonb not null default '{}',
  decline_reason text,
  source_message_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade,
  unique (id, home_id),
  unique (service_case_id, provider_id)
);
create index provider_requests_case_status_idx
  on public.provider_requests (service_case_id, status);
create trigger provider_requests_updated_at before update on public.provider_requests
  for each row execute function public.set_updated_at();

create table public.service_offers (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  provider_request_id uuid not null,
  status text not null default 'proposed'
    check (status in ('proposed','held','selected','expired','withdrawn','declined')),
  service_fit jsonb not null default '{}',
  visit_type text not null default 'diagnostic'
    check (visit_type in ('diagnostic','estimate','repair_attempt')),
  diagnostic_fee numeric check (diagnostic_fee is null or diagnostic_fee >= 0),
  travel_fee numeric check (travel_fee is null or travel_fee >= 0),
  deposit numeric check (deposit is null or deposit >= 0),
  currency text not null default 'USD',
  price_notes text,
  window_start timestamptz,
  window_end timestamptz,
  timezone text not null default 'America/Chicago',
  availability_source text
    check (availability_source is null or availability_source in
      ('provider_statement','booking_link','operator_call','provider_portal','api')),
  confirmed_at timestamptz,
  expires_at timestamptz,
  cancellation_terms text,
  parts_labor_warranty text,
  provider_question text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade,
  foreign key (provider_request_id, home_id)
    references public.provider_requests(id, home_id) on delete cascade,
  check (window_end is null or window_start is not null),
  check (window_end is null or window_end > window_start),
  check (expires_at is null or confirmed_at is not null)
);
create index service_offers_case_status_idx on public.service_offers (service_case_id, status);
create index service_offers_expiry_idx on public.service_offers (expires_at)
  where expires_at is not null and status in ('proposed','held');
create trigger service_offers_updated_at before update on public.service_offers
  for each row execute function public.set_updated_at();

-- ============ authorization and appointment ============

create table public.service_authorizations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete restrict,
  kind text not null check (kind in ('share_request','book_appointment','reschedule','cancel')),
  scope jsonb not null,
  scope_hash text not null,
  status text not null default 'active'
    check (status in ('active','consumed','revoked','expired')),
  expires_at timestamptz not null,
  approved_at timestamptz not null default now(),
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade,
  unique (id, home_id),
  unique (service_case_id, kind, scope_hash)
);
create index service_authorizations_active_idx
  on public.service_authorizations (service_case_id, kind, expires_at)
  where status = 'active';

create table public.service_appointments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  provider_id uuid not null references public.provider_businesses(id) on delete restrict,
  offer_id uuid not null references public.service_offers(id) on delete restrict,
  authorization_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','reschedule_requested','cancelled','completed','no_show','disputed')),
  external_reference text,
  window_start timestamptz not null,
  window_end timestamptz not null,
  timezone text not null default 'America/Chicago',
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id) on delete set null,
  calendar_event_identifier text,
  cancellation_terms_snapshot text,
  completion_summary jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade,
  foreign key (authorization_id, home_id)
    references public.service_authorizations(id, home_id) on delete restrict,
  check (window_end > window_start),
  unique (service_case_id)
);
create index service_appointments_home_status_idx
  on public.service_appointments (home_id, status);
create trigger service_appointments_updated_at before update on public.service_appointments
  for each row execute function public.set_updated_at();

-- ============ communication and audit ledgers ============

create table public.service_messages (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  provider_request_id uuid references public.provider_requests(id) on delete set null,
  channel text not null check (channel in ('in_app','phone','sms','email','booking_link')),
  direction text not null check (direction in ('inbound','outbound','internal')),
  actor_type text not null check (actor_type in ('homeowner','agent','operator','provider','system')),
  actor_id text,
  recipients jsonb not null default '[]',
  body text,
  redacted_body text,
  template_key text,
  template_version int,
  external_id text,
  delivery_status text
    check (delivery_status is null or delivery_status in ('draft','queued','sent','delivered','failed','received')),
  extracted_facts jsonb not null default '{}',
  created_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade
);
create index service_messages_case_created_idx
  on public.service_messages (service_case_id, created_at);

alter table public.provider_requests
  add constraint provider_requests_source_message_fk
  foreign key (source_message_id) references public.service_messages(id) on delete set null;

create table public.service_case_events (
  id bigint generated always as identity primary key,
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  actor_type text not null check (actor_type in ('homeowner','agent','operator','provider','system')),
  actor_id text,
  prior_status text,
  next_status text not null,
  reason text,
  metadata jsonb not null default '{}',
  authorization_id uuid references public.service_authorizations(id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  foreign key (service_case_id, home_id)
    references public.service_cases(id, home_id) on delete cascade,
  unique (service_case_id, idempotency_key)
);
create index service_case_events_case_created_idx
  on public.service_case_events (service_case_id, created_at);

-- ============ RLS: household read, service commands write ============

do $$
declare t text;
begin
  foreach t in array array[
    'service_cases','service_case_files','provider_requests','service_offers',
    'service_authorizations','service_appointments','service_messages','service_case_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s: member read" on public.%I
         for select using (public.is_home_member(home_id))', t, t);
  end loop;
end $$;

-- No authenticated write policies are intentional. Server commands use the
-- service role after checking the caller's membership/role and current state.

