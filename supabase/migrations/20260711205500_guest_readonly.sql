-- Security: FOR ALL member policies let guest-role members write and delete
-- home data. Split into read (any member) vs write (owner/family only).

create or replace function public.is_home_writer(home uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.home_members
    where home_id = home and user_id = auth.uid() and role in ('owner','family')
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['rooms','items','contractors','projects','files',
                           'care_tasks','care_events','insights','timeline_events','conversations']
  loop
    execute format('drop policy "%s: member all" on public.%I', t, t);
    execute format(
      'create policy "%s: member read" on public.%I
         for select using (public.is_home_member(home_id))', t, t);
    execute format(
      'create policy "%s: writer insert" on public.%I
         for insert with check (public.is_home_writer(home_id))', t, t);
    execute format(
      'create policy "%s: writer update" on public.%I
         for update using (public.is_home_writer(home_id))
         with check (public.is_home_writer(home_id))', t, t);
    execute format(
      'create policy "%s: writer delete" on public.%I
         for delete using (public.is_home_writer(home_id))', t, t);
  end loop;
end $$;

drop policy "messages: member all" on public.messages;
create policy "messages: member read" on public.messages
  for select using (
    public.is_home_member((select home_id from public.conversations where id = conversation_id))
  );
create policy "messages: writer insert" on public.messages
  for insert with check (
    public.is_home_writer((select home_id from public.conversations where id = conversation_id))
  );

-- storage: writes also restricted to owner/family
drop policy "home-files: member write" on storage.objects;
create policy "home-files: writer write" on storage.objects
  for insert with check (
    bucket_id = 'home-files'
    and public.is_home_writer(((storage.foldername(name))[1])::uuid)
  );
drop policy "home-files: member delete" on storage.objects;
create policy "home-files: writer delete" on storage.objects
  for delete using (
    bucket_id = 'home-files'
    and public.is_home_writer(((storage.foldername(name))[1])::uuid)
  );
