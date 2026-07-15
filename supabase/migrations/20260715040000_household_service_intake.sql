-- A2: authenticated household intake and explicit record-sharing authorization.
-- Mutations remain RPC-only. Every input is re-scoped to the caller's home.

create or replace function public.create_household_service_intake(
  p_home_id uuid,
  p_item_id uuid,
  p_symptom_summary text,
  p_urgency text,
  p_structured_intake jsonb,
  p_preferred_windows jsonb,
  p_safety_result jsonb,
  p_service_address_snapshot jsonb,
  p_item_snapshot jsonb,
  p_share_approved boolean,
  p_file_ids uuid[] default '{}'
)
returns public.service_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_case public.service_cases;
  v_status text;
  v_scope jsonb;
  v_authorization_id uuid;
  v_expires_at timestamptz := now() + interval '14 days';
  v_valid_file_count int;
begin
  if v_user is null or not public.is_home_writer(p_home_id) then
    raise exception 'household write access required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_symptom_summary, ''))) < 3 then
    raise exception 'symptom summary is required' using errcode = '22023';
  end if;
  if p_urgency not in ('routine', 'soon') then
    raise exception 'invalid service urgency' using errcode = '22023';
  end if;
  if not exists (select 1 from public.items where id = p_item_id and home_id = p_home_id) then
    raise exception 'item not found in household' using errcode = 'P0002';
  end if;

  v_status := case when coalesce((p_safety_result->>'stopped')::boolean, false)
    then 'safety_stopped' else 'intake_ready' end;

  if v_status = 'intake_ready' and not p_share_approved then
    raise exception 'sharing review is required' using errcode = '22023';
  end if;

  select count(*) into v_valid_file_count
  from public.files
  where id = any(coalesce(p_file_ids, '{}'))
    and home_id = p_home_id
    and (item_id is null or item_id = p_item_id);
  if v_valid_file_count <> cardinality(coalesce(p_file_ids, '{}')) then
    raise exception 'one or more selected records are unavailable' using errcode = '42501';
  end if;

  insert into public.service_cases (
    home_id, item_id, opened_by, status, urgency, symptom_summary,
    structured_intake, preferred_windows, service_address_snapshot,
    item_snapshot, safety_result, closed_at
  ) values (
    p_home_id, p_item_id, v_user, v_status,
    case when v_status = 'safety_stopped' then 'safety_stop' else p_urgency end,
    trim(p_symptom_summary), coalesce(p_structured_intake, '{}'),
    coalesce(p_preferred_windows, '[]'), coalesce(p_service_address_snapshot, '{}'),
    coalesce(p_item_snapshot, '{}'), coalesce(p_safety_result, '{}'),
    case when v_status = 'safety_stopped' then now() else null end
  ) returning * into v_case;

  insert into public.service_case_events (
    home_id, service_case_id, actor_type, actor_id, prior_status, next_status, reason, metadata
  ) values (
    p_home_id, v_case.id, 'homeowner', v_user::text, null, v_status,
    case when v_status = 'safety_stopped' then 'Immediate safety condition reported' else 'Service intake completed' end,
    jsonb_build_object('surface', 'ios')
  );

  if v_status = 'intake_ready' then
    v_scope := jsonb_build_object(
      'caseId', v_case.id,
      'itemId', p_item_id,
      'fileIds', to_jsonb(coalesce(p_file_ids, '{}')),
      'fields', jsonb_build_array('item_identity', 'symptom', 'safety_answers', 'availability', 'service_address'),
      'purpose', 'request_service_options'
    );

    insert into public.service_authorizations (
      home_id, service_case_id, user_id, kind, scope, scope_hash, expires_at
    ) values (
      p_home_id, v_case.id, v_user, 'share_request', v_scope,
      md5(v_scope::text), v_expires_at
    ) returning id into v_authorization_id;

    insert into public.service_case_files (
      home_id, service_case_id, file_id, approved_for_sharing, approved_at
    ) select p_home_id, v_case.id, unnest(coalesce(p_file_ids, '{}')), true, now();

    update public.service_cases
    set status = 'sharing_approved', sharing_status = 'approved',
        sharing_scope = v_scope, sharing_expires_at = v_expires_at
    where id = v_case.id
    returning * into v_case;

    insert into public.service_case_events (
      home_id, service_case_id, actor_type, actor_id, prior_status, next_status,
      reason, metadata, authorization_id
    ) values (
      p_home_id, v_case.id, 'homeowner', v_user::text, 'intake_ready', 'sharing_approved',
      'Household approved exact sharing scope',
      jsonb_build_object('file_count', cardinality(coalesce(p_file_ids, '{}')), 'expires_at', v_expires_at),
      v_authorization_id
    );
  end if;

  return v_case;
end;
$$;

revoke all on function public.create_household_service_intake(
  uuid,uuid,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,uuid[]
) from public, anon;
grant execute on function public.create_household_service_intake(
  uuid,uuid,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,uuid[]
) to authenticated;
