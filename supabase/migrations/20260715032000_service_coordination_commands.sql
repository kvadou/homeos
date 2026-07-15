-- Atomic service-case transitions and one-time authorization consumption.
-- Callable only with the service role; authenticated clients have read-only RLS.

create or replace function public.is_valid_service_case_transition(from_status text, to_status text)
returns boolean
language sql
immutable
as $$
  select (from_status, to_status) in (
    values
      ('draft','safety_screened'), ('draft','safety_stopped'), ('draft','cancelled'),
      ('safety_screened','intake_ready'), ('safety_screened','safety_stopped'),
      ('safety_screened','cancelled'),
      ('intake_ready','sharing_approved'), ('intake_ready','diy_resolved'),
      ('intake_ready','warranty_routed'), ('intake_ready','cancelled'),
      ('sharing_approved','sourcing'), ('sharing_approved','cancelled'),
      ('sourcing','awaiting_provider_responses'), ('sourcing','no_qualified_provider'),
      ('sourcing','cancelled'),
      ('awaiting_provider_responses','options_ready'),
      ('awaiting_provider_responses','no_availability'),
      ('awaiting_provider_responses','no_qualified_provider'),
      ('awaiting_provider_responses','cancelled'),
      ('options_ready','selection_approved'), ('options_ready','slot_expired'),
      ('options_ready','cancelled'),
      ('selection_approved','booking_pending'), ('selection_approved','slot_expired'),
      ('selection_approved','cancelled'),
      ('booking_pending','confirmed'), ('booking_pending','booking_failed'),
      ('booking_pending','slot_expired'), ('booking_pending','cancelled'),
      ('confirmed','service_underway'), ('confirmed','completed'),
      ('confirmed','cancelled'), ('confirmed','disputed'),
      ('service_underway','completed'), ('service_underway','disputed'),
      ('completed','recorded'), ('completed','disputed'),
      ('booking_failed','sourcing'), ('booking_failed','options_ready'),
      ('booking_failed','cancelled'),
      ('slot_expired','sourcing'), ('slot_expired','awaiting_provider_responses'),
      ('slot_expired','cancelled')
  );
$$;

create or replace function public.enforce_service_case_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and not public.is_valid_service_case_transition(old.status, new.status) then
    raise exception 'invalid service case transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger service_cases_enforce_transition
  before update of status on public.service_cases
  for each row execute function public.enforce_service_case_transition();

create or replace function public.transition_service_case(
  p_case_id uuid,
  p_expected_status text,
  p_next_status text,
  p_actor_type text,
  p_actor_id text default null,
  p_reason text default null,
  p_metadata jsonb default '{}',
  p_authorization_id uuid default null,
  p_idempotency_key text default null
)
returns public.service_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  current_case public.service_cases;
begin
  if p_actor_type not in ('homeowner','agent','operator','provider','system') then
    raise exception 'invalid service actor type' using errcode = '22023';
  end if;

  select * into current_case
  from public.service_cases
  where id = p_case_id
  for update;

  if not found then
    raise exception 'service case not found' using errcode = 'P0002';
  end if;

  if p_idempotency_key is not null and exists (
    select 1 from public.service_case_events
    where service_case_id = p_case_id and idempotency_key = p_idempotency_key
  ) then
    return current_case;
  end if;

  if current_case.status <> p_expected_status then
    raise exception 'service case state changed: expected %, found %',
      p_expected_status, current_case.status using errcode = '40001';
  end if;

  if not public.is_valid_service_case_transition(current_case.status, p_next_status) then
    raise exception 'invalid service case transition: % -> %',
      current_case.status, p_next_status using errcode = '23514';
  end if;

  update public.service_cases
  set status = p_next_status,
      closed_at = case when p_next_status in (
        'recorded','safety_stopped','diy_resolved','warranty_routed',
        'no_qualified_provider','no_availability','cancelled','disputed'
      ) then now() else closed_at end
  where id = p_case_id
  returning * into current_case;

  insert into public.service_case_events (
    home_id, service_case_id, actor_type, actor_id, prior_status, next_status,
    reason, metadata, authorization_id, idempotency_key
  ) values (
    current_case.home_id, current_case.id, p_actor_type, p_actor_id,
    p_expected_status, p_next_status, p_reason, coalesce(p_metadata, '{}'),
    p_authorization_id, p_idempotency_key
  );

  return current_case;
end;
$$;

create or replace function public.consume_service_authorization(
  p_authorization_id uuid,
  p_scope_hash text
)
returns public.service_authorizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_authorization public.service_authorizations;
begin
  select * into v_authorization
  from public.service_authorizations
  where id = p_authorization_id
  for update;

  if not found then
    raise exception 'service authorization not found' using errcode = 'P0002';
  end if;
  if v_authorization.status <> 'active' then
    raise exception 'service authorization is %', v_authorization.status using errcode = '23514';
  end if;
  if v_authorization.expires_at <= now() then
    update public.service_authorizations
      set status = 'expired'
      where id = p_authorization_id
      returning * into v_authorization;
    raise exception 'service authorization expired' using errcode = '23514';
  end if;
  if v_authorization.scope_hash <> p_scope_hash then
    raise exception 'service authorization scope mismatch' using errcode = '23514';
  end if;

  update public.service_authorizations
  set status = 'consumed', consumed_at = now()
  where id = p_authorization_id
  returning * into v_authorization;

  return v_authorization;
end;
$$;

revoke all on function public.transition_service_case(
  uuid,text,text,text,text,text,jsonb,uuid,text
) from public, anon, authenticated;
grant execute on function public.transition_service_case(
  uuid,text,text,text,text,text,jsonb,uuid,text
) to service_role;

revoke all on function public.consume_service_authorization(uuid,text)
  from public, anon, authenticated;
grant execute on function public.consume_service_authorization(uuid,text)
  to service_role;
