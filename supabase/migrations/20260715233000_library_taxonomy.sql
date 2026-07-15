-- Consolidate legacy Library categories into the homeowner-facing taxonomy.
-- Item/file linkage already lives in files.item_id; linked evidence remains
-- attached to its item and is no longer presented as a second top-level record.

update public.items
set category = case
  when category in ('paint', 'exterior') then 'structure'
  when category in ('yard', 'measurement') then 'equipment'
  else category
end
where category in ('paint', 'exterior', 'yard', 'measurement');

comment on column public.items.category is
  'Library taxonomy: appliance, system, fixture, structure, equipment, safety; other is retained only for explicit user overrides/out-of-scope review.';

comment on column public.files.item_id is
  'When set, this file is evidence owned by the item profile and should not appear as a duplicate top-level Library record.';
