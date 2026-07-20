-- Canonical product identities shared across homes. Provider responses contain
-- public product data only; household ownership, serial numbers, and receipts
-- remain in the existing home-scoped tables.

create table public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_product_id text not null,
  title text not null,
  brand text,
  manufacturer text,
  model text,
  category text,
  description text,
  image_url text,
  source_url text,
  attributes jsonb not null default '{}',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_product_id)
);
create trigger catalog_products_updated_at before update on public.catalog_products
  for each row execute function public.set_updated_at();

create table public.catalog_identifiers (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products(id) on delete cascade,
  provider text not null,
  kind text not null check (kind in ('gtin','upc','ean','mpn','model','asin')),
  value text not null,
  created_at timestamptz not null default now(),
  unique (provider, kind, value)
);
create index catalog_identifiers_lookup_idx on public.catalog_identifiers (kind, value);

alter table public.items
  add column catalog_product_id uuid references public.catalog_products(id) on delete set null,
  add column catalog_match_confidence numeric check (catalog_match_confidence between 0 and 1),
  add column catalog_match_source text;
create index items_catalog_product_idx on public.items (catalog_product_id)
  where catalog_product_id is not null;

-- Catalog rows contain no household data. Signed-in members may read them for
-- item presentation; only the service role used by the resolver can write.
alter table public.catalog_products enable row level security;
alter table public.catalog_identifiers enable row level security;
create policy "catalog_products: authenticated read" on public.catalog_products
  for select to authenticated using (true);
create policy "catalog_identifiers: authenticated read" on public.catalog_identifiers
  for select to authenticated using (true);
