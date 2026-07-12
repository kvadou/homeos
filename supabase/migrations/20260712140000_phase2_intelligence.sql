-- Phase 2: intelligence layer schema
-- Canonical design: docs/plans/2026-07-12-phase2-object-model.md §4
-- + engine additions: docs/plans/2026-07-12-phase2-intelligence-engine.md §2, §6

-- ============ 0. pgvector (embeddings; fill deferred, schema now) ============

create extension if not exists vector with schema extensions;

-- ============ 1. files: ingestion status flag + byte-level dedupe ============

alter table public.files
  add column extraction_status text not null default 'none'
    check (extraction_status in ('none','pending','done','failed')),
  add column content_hash text;
create unique index files_home_hash_idx on public.files (home_id, content_hash)
  where content_hash is not null;

-- ============ 2. extractions: OCR + structured parse, one row per run ============
-- The citation hub: every AI fact points back here.

create table public.extractions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','processing','done','failed')),
  doc_type text,
  raw_text text,
  data jsonb not null default '{}',
  confidence numeric,
  model text,
  error text,
  search tsvector generated always as (to_tsvector('english', coalesce(raw_text,''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index extractions_home_idx on public.extractions (home_id);
create index extractions_file_idx on public.extractions (file_id);
create index extractions_search_idx on public.extractions using gin (search);
create trigger extractions_updated_at before update on public.extractions
  for each row execute function public.set_updated_at();

-- ============ 3. field_provenance: Pattern B (mixed user/AI objects) ============
-- Absence of a row = user-authored. One row per AI-filled field.

create table public.field_provenance (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  entity_table text not null check (entity_table in ('items','projects','warranties')),
  entity_id uuid not null,
  field text not null,
  source_kind text not null check (source_kind in ('extraction','inference')),
  extraction_id uuid references public.extractions(id) on delete set null,
  confidence numeric,
  model text,
  created_at timestamptz not null default now(),
  unique (entity_table, entity_id, field)
);
create index field_provenance_entity_idx on public.field_provenance (entity_table, entity_id);

-- ============ 4. warranties: first-class, extraction-derived ============

create table public.warranties (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  file_id uuid references public.files(id) on delete set null,
  extraction_id uuid references public.extractions(id) on delete set null,
  provider text,
  kind text check (kind in ('manufacturer','extended','home-warranty','labor')),
  coverage text,
  starts_on date,
  ends_on date,
  term_months int,
  status text not null default 'active'
    check (status in ('active','expiring','expired','claimed','void')),
  source_kind text not null default 'user',
  confidence numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index warranties_home_idx on public.warranties (home_id);
create index warranties_item_idx on public.warranties (item_id);
create index warranties_ends_idx on public.warranties (ends_on);
create trigger warranties_updated_at before update on public.warranties
  for each row execute function public.set_updated_at();

-- ============ 5. home_facts: atomic AI memory + embeddings (Pattern A) ============

create table public.home_facts (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  subject_table text check (subject_table in ('items','projects','rooms','homes','contractors')),
  subject_id uuid,
  statement text not null,
  predicate text,
  object_value text,
  category text,
  embedding extensions.vector(1024),
  source_kind text not null default 'inference'
    check (source_kind in ('user','extraction','inference','seed')),
  source_extraction_id uuid references public.extractions(id) on delete set null,
  confidence numeric,
  evidence jsonb not null default '[]',
  is_current boolean not null default true,
  superseded_by uuid references public.home_facts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index home_facts_home_idx on public.home_facts (home_id);
create index home_facts_subject_idx on public.home_facts (subject_table, subject_id);
create index home_facts_embedding_idx on public.home_facts
  using hnsw (embedding extensions.vector_cosine_ops);

-- ============ 6. insights: row-level provenance + engine dedupe ============

alter table public.insights
  add column confidence numeric,
  add column evidence jsonb not null default '[]',
  add column source_extraction_id uuid references public.extractions(id) on delete set null,
  add column dedupe_slug text;
-- upsert target for (home_id, category, dedupe_slug) — update in place, never stack
create unique index insights_dedupe_idx on public.insights (home_id, category, dedupe_slug)
  where dedupe_slug is not null;

-- ============ 7. A-lite row provenance + engine keys ============
-- provenance jsonb: {pipeline, model, file_id, extraction_id, confidence, depth}

alter table public.care_tasks
  add column provenance jsonb not null default '{}',
  add column template_slug text;
-- upsert target for (home_id, item_id, template_slug) — do nothing on conflict
-- nulls not distinct: home-level tasks (item_id null) must dedupe too
create unique index care_tasks_template_idx on public.care_tasks (home_id, item_id, template_slug)
  nulls not distinct where template_slug is not null;

alter table public.care_events
  add column provenance jsonb not null default '{}',
  add column project_id uuid references public.projects(id) on delete set null;
create index care_events_project_idx on public.care_events (project_id);

alter table public.timeline_events
  add column provenance jsonb not null default '{}';
-- ponytail: timeline dedupe (home_id, year, title) stays app-side match-or-create;
-- a unique index could collide with existing seed rows.

-- ============ 8. suggestions: the review queue (one confirm surface) ============

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  target text not null,            -- 'items' | 'care_tasks' | 'insights' | 'timeline_events' | 'contractors' | 'item_fact'
  action text not null default 'insert' check (action in ('insert','update')),
  target_id uuid,                  -- set for updates (which row to patch)
  payload jsonb not null,          -- the exact columns to write
  summary text not null,           -- human line: "Add water heater (Rheem, installed Jul 2026)?"
  confidence numeric not null,
  provenance jsonb not null default '{}',
  dedupe_key text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique (home_id, target, dedupe_key)
);

-- ============ 9. RLS: standard member policy for all new home-scoped tables ============

do $$
declare t text;
begin
  foreach t in array array['extractions','field_provenance','warranties',
                           'home_facts','suggestions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s: member all" on public.%I for all
         using (public.is_home_member(home_id))
         with check (public.is_home_member(home_id))', t, t);
  end loop;
end $$;
