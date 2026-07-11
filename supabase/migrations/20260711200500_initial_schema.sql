-- HomeOS initial schema
-- All home-scoped tables gated by home_members via is_home_member().

-- ============ helpers ============

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============ profiles ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ homes + membership ============

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  street text, city text, state text, zip text,
  year_built int, sqft int, beds numeric, baths numeric,
  property_type text,
  features jsonb not null default '[]',
  goals jsonb not null default '[]',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.home_members (
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','family','guest')),
  created_at timestamptz not null default now(),
  primary key (home_id, user_id)
);

-- security definer: avoids RLS recursion between homes and home_members
create or replace function public.is_home_member(home uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.home_members
    where home_id = home and user_id = auth.uid()
  );
$$;

create or replace function public.is_home_owner(home uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.home_members
    where home_id = home and user_id = auth.uid() and role = 'owner'
  );
$$;

alter table public.homes enable row level security;
alter table public.home_members enable row level security;

create policy "homes: member read" on public.homes
  for select using (public.is_home_member(id));
create policy "homes: creator insert" on public.homes
  for insert with check (created_by = auth.uid());
create policy "homes: member update" on public.homes
  for update using (public.is_home_member(id));
create policy "homes: owner delete" on public.homes
  for delete using (public.is_home_owner(id));

create policy "home_members: member read" on public.home_members
  for select using (public.is_home_member(home_id));
create policy "home_members: owner write" on public.home_members
  for all using (public.is_home_owner(home_id));

-- creator automatically becomes owner (bypasses the owner-only insert policy)
create or replace function public.handle_new_home()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.home_members (home_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end $$;

create trigger on_home_created
  after insert on public.homes
  for each row execute function public.handle_new_home();

create trigger homes_updated_at before update on public.homes
  for each row execute function public.set_updated_at();

-- ============ home-scoped tables ============

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  slug text not null,
  name text not null,
  summary text,
  created_at timestamptz not null default now(),
  unique (home_id, slug)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  category text not null,
  status text,
  manufacturer text, model text, serial text,
  installed_on date,
  lifespan_years int,
  summary text,
  facts jsonb not null default '[]',
  knowledge jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_home_idx on public.items (home_id);
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  name text not null,
  company text, phone text, email text, notes text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  name text not null,
  kind text not null default 'idea' check (kind in ('active','idea','recommended','completed')),
  status text,
  progress int,
  summary text,
  budget numeric, spent numeric,
  contractor_id uuid references public.contractors(id) on delete set null,
  started_on date, target_end date,
  completed_year int,
  cost numeric, value_added numeric,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_home_idx on public.projects (home_id);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.files (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  type text not null check (type in ('document','photo','video','receipt','manual','warranty')),
  name text not null,
  storage_path text not null,
  meta jsonb not null default '{}',
  taken_at date,
  created_at timestamptz not null default now()
);
create index files_home_idx on public.files (home_id);

create table public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  title text not null,
  detail text,
  priority text,
  season text check (season in ('spring','summer','fall','winter')),
  due_on date,
  recurrence text,
  status text not null default 'open' check (status in ('open','done','snoozed')),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  source text not null default 'user' check (source in ('ai','user')),
  created_at timestamptz not null default now()
);
create index care_tasks_home_idx on public.care_tasks (home_id);

create table public.care_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  title text not null,
  note text,
  cost numeric,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  category text not null,
  headline text not null,
  detail text,
  basis text,
  stat text,
  action text,
  status text not null default 'active' check (status in ('active','dismissed')),
  source text not null default 'seed',
  created_at timestamptz not null default now()
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  year int not null,
  title text not null,
  detail text,
  kind text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- one FOR ALL member policy per home-scoped table
do $$
declare t text;
begin
  foreach t in array array['rooms','items','contractors','projects','files',
                           'care_tasks','care_events','insights','timeline_events','conversations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s: member all" on public.%I for all
         using (public.is_home_member(home_id))
         with check (public.is_home_member(home_id))', t, t);
  end loop;
end $$;

alter table public.messages enable row level security;
create policy "messages: member all" on public.messages
  for all using (
    public.is_home_member((select home_id from public.conversations where id = conversation_id))
  ) with check (
    public.is_home_member((select home_id from public.conversations where id = conversation_id))
  );

-- ============ usage events (admin analytics) ============

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  event text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index usage_events_created_idx on public.usage_events (created_at);

alter table public.usage_events enable row level security;
create policy "usage_events: insert own" on public.usage_events
  for insert with check (user_id = auth.uid());
-- reads happen via service role on /admin only

-- ============ storage ============

insert into storage.buckets (id, name, public)
values ('home-files', 'home-files', false);

-- objects stored under {home_id}/... — membership gates access
create policy "home-files: member read" on storage.objects
  for select using (
    bucket_id = 'home-files'
    and public.is_home_member(((storage.foldername(name))[1])::uuid)
  );
create policy "home-files: member write" on storage.objects
  for insert with check (
    bucket_id = 'home-files'
    and public.is_home_member(((storage.foldername(name))[1])::uuid)
  );
create policy "home-files: member delete" on storage.objects
  for delete using (
    bucket_id = 'home-files'
    and public.is_home_member(((storage.foldername(name))[1])::uuid)
  );
