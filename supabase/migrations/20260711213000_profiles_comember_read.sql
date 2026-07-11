-- Members of the same home can read each other's profiles (names in
-- settings member list, task completed-by, etc). Security definer avoids
-- nested policy evaluation on home_members.
create or replace function public.shares_home_with(other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.home_members a
    join public.home_members b on a.home_id = b.home_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create policy "profiles: co-members read" on public.profiles
  for select using (public.shares_home_with(id));
