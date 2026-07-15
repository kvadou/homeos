-- A5: homeowner-confirmed service outcomes and permanent care history.

create table public.service_outcomes (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  service_case_id uuid not null,
  appointment_id uuid not null references public.service_appointments(id) on delete restrict,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'confirmed' check (status in ('confirmed','disputed')),
  resolution text not null check (resolution in ('resolved','partially_resolved','not_resolved')),
  work_performed text not null,
  final_cost numeric check (final_cost is null or final_cost >= 0),
  parts_summary text,
  labor_warranty text,
  invoice_file_id uuid references public.files(id) on delete set null,
  provider_timeliness int check (provider_timeliness between 1 and 5),
  provider_communication int check (provider_communication between 1 and 5),
  private_feedback text,
  occurred_on date not null default current_date,
  care_event_id uuid references public.care_events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_case_id, home_id) references public.service_cases(id, home_id) on delete cascade,
  unique (service_case_id),
  unique (appointment_id)
);
create trigger service_outcomes_updated_at before update on public.service_outcomes
  for each row execute function public.set_updated_at();
alter table public.service_outcomes enable row level security;
create policy "service_outcomes: member read" on public.service_outcomes
  for select using (public.is_home_member(home_id));

create or replace function public.record_household_service_outcome(
  p_case_id uuid,
  p_resolution text,
  p_work_performed text,
  p_final_cost numeric default null,
  p_parts_summary text default null,
  p_labor_warranty text default null,
  p_invoice_file_id uuid default null,
  p_provider_timeliness int default null,
  p_provider_communication int default null,
  p_private_feedback text default null,
  p_occurred_on date default current_date
)
returns public.service_outcomes
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_case public.service_cases;
  v_appointment public.service_appointments;
  v_outcome public.service_outcomes;
  v_event_id uuid;
  v_title text;
begin
  select * into v_case from public.service_cases where id = p_case_id for update;
  if not found or v_user is null or not public.is_home_writer(v_case.home_id) then
    raise exception 'household write access required' using errcode = '42501';
  end if;
  if v_case.status not in ('confirmed','service_underway','completed') then
    raise exception 'a confirmed appointment is required' using errcode = '23514';
  end if;
  if p_resolution not in ('resolved','partially_resolved','not_resolved') then
    raise exception 'invalid resolution' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_work_performed,''))) < 3 then
    raise exception 'work performed is required' using errcode = '22023';
  end if;
  if p_final_cost is not null and p_final_cost < 0 then raise exception 'invalid final cost'; end if;
  if p_provider_timeliness is not null and p_provider_timeliness not between 1 and 5 then raise exception 'invalid timeliness rating'; end if;
  if p_provider_communication is not null and p_provider_communication not between 1 and 5 then raise exception 'invalid communication rating'; end if;
  if p_invoice_file_id is not null and not exists (
    select 1 from public.files where id = p_invoice_file_id and home_id = v_case.home_id
  ) then raise exception 'invoice is not available to this household' using errcode = '42501'; end if;

  select * into v_appointment from public.service_appointments
    where service_case_id = p_case_id and status in ('confirmed','completed') for update;
  if not found then raise exception 'confirmed appointment not found' using errcode = '23514'; end if;

  select * into v_outcome from public.service_outcomes where service_case_id = p_case_id;
  if found then return v_outcome; end if;

  v_title := case p_resolution when 'resolved' then 'Service completed'
    when 'partially_resolved' then 'Service visit completed — follow-up needed'
    else 'Service visit completed — issue remains' end;
  insert into public.care_events(home_id,item_id,title,note,cost,occurred_on,provenance)
  values (v_case.home_id,v_case.item_id,v_title,trim(p_work_performed),p_final_cost,p_occurred_on,
    jsonb_build_object('source','service_coordination','service_case_id',v_case.id,'appointment_id',v_appointment.id))
  returning id into v_event_id;

  if p_invoice_file_id is not null then
    update public.files set item_id = v_case.item_id,
      meta = coalesce(meta,'{}') || jsonb_build_object('service_case_id',v_case.id,'care_event_id',v_event_id)
      where id = p_invoice_file_id;
  end if;

  insert into public.service_outcomes(home_id,service_case_id,appointment_id,submitted_by,resolution,
    work_performed,final_cost,parts_summary,labor_warranty,invoice_file_id,provider_timeliness,
    provider_communication,private_feedback,occurred_on,care_event_id)
  values (v_case.home_id,v_case.id,v_appointment.id,v_user,p_resolution,trim(p_work_performed),
    p_final_cost,nullif(trim(coalesce(p_parts_summary,'')),''),nullif(trim(coalesce(p_labor_warranty,'')),''),
    p_invoice_file_id,p_provider_timeliness,p_provider_communication,
    nullif(trim(coalesce(p_private_feedback,'')),''),p_occurred_on,v_event_id)
  returning * into v_outcome;

  update public.service_appointments set status = 'completed', completion_summary = jsonb_build_object(
    'resolution',p_resolution,'careEventId',v_event_id,'confirmedBy',v_user) where id = v_appointment.id;
  if v_case.status = 'confirmed' then
    perform public.transition_service_case(v_case.id,'confirmed','completed','homeowner',v_user::text,
      'Household confirmed the service outcome',jsonb_build_object('resolution',p_resolution,'careEventId',v_event_id),
      null,'service-outcome:' || v_case.id::text);
  elsif v_case.status = 'service_underway' then
    perform public.transition_service_case(v_case.id,'service_underway','completed','homeowner',v_user::text,
      'Household confirmed the service outcome',jsonb_build_object('resolution',p_resolution,'careEventId',v_event_id),
      null,'service-outcome:' || v_case.id::text);
  end if;
  return v_outcome;
end; $$;

create or replace function public.report_household_service_exception(p_case_id uuid,p_kind text,p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_case public.service_cases; v_next text; v_appt text;
begin
  select * into v_case from public.service_cases where id=p_case_id for update;
  if not found or v_user is null or not public.is_home_writer(v_case.home_id) then raise exception 'household write access required' using errcode='42501'; end if;
  if p_kind not in ('provider_cancelled','no_show','dispute') then raise exception 'invalid exception type'; end if;
  if length(trim(coalesce(p_note,''))) < 3 then raise exception 'details are required'; end if;
  if p_kind='dispute' then v_next := 'disputed'; v_appt := 'disputed';
  elsif v_case.status='booking_pending' then v_next := 'booking_failed'; v_appt := case when p_kind='no_show' then 'no_show' else 'cancelled' end;
  else v_next := 'cancelled'; v_appt := case when p_kind='no_show' then 'no_show' else 'cancelled' end; end if;
  perform public.transition_service_case(v_case.id,v_case.status,v_next,'homeowner',v_user::text,
    trim(p_note),jsonb_build_object('kind',p_kind),null,'service-exception:' || p_kind || ':' || v_case.id::text);
  update public.service_appointments set status=v_appt where service_case_id=v_case.id;
  insert into public.service_escalations(home_id,service_case_id,kind,priority,summary,created_by)
    values(v_case.home_id,v_case.id,case when p_kind='dispute' then 'other' else 'booking_overdue' end,
      case when p_kind='dispute' then 'urgent' else 'normal' end,trim(p_note),v_user);
end; $$;

revoke all on function public.record_household_service_outcome(uuid,text,text,numeric,text,text,uuid,int,int,text,date) from public,anon;
revoke all on function public.report_household_service_exception(uuid,text,text) from public,anon;
grant execute on function public.record_household_service_outcome(uuid,text,text,numeric,text,text,uuid,int,int,text,date) to authenticated;
grant execute on function public.report_household_service_exception(uuid,text,text) to authenticated;
