-- INSERT ... RETURNING evaluates before the AFTER trigger creates the owner
-- membership row, so the creator must be able to select their home directly.
drop policy "homes: member read" on public.homes;
create policy "homes: member read" on public.homes
  for select using (created_by = auth.uid() or public.is_home_member(id));
