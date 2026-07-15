-- A4: safe household option comparison, exact booking authorization, and calendar recording.

create or replace function public.get_household_service_case(p_case_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case public.service_cases;
begin
  select * into v_case from public.service_cases where id = p_case_id;
  if not found or auth.uid() is null or not public.is_home_member(v_case.home_id) then
    raise exception 'service case not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'case', jsonb_build_object(
      'id', v_case.id, 'status', v_case.status, 'symptomSummary', v_case.symptom_summary,
      'urgency', v_case.urgency, 'sharingStatus', v_case.sharing_status,
      'sharingExpiresAt', v_case.sharing_expires_at, 'openedAt', v_case.opened_at
    ),
    'options', case when v_case.status in ('options_ready','selection_approved','booking_pending','confirmed') then
      coalesce((select jsonb_agg(jsonb_build_object(
        'id', o.id, 'providerId', p.id, 'providerName', p.display_name,
        'visitType', o.visit_type, 'diagnosticFee', o.diagnostic_fee,
        'travelFee', o.travel_fee, 'deposit', o.deposit, 'currency', o.currency,
        'priceNotes', o.price_notes, 'windowStart', o.window_start, 'windowEnd', o.window_end,
        'timezone', o.timezone, 'providerConfirmedAt', o.confirmed_at, 'expiresAt', o.expires_at,
        'cancellationTerms', coalesce(o.cancellation_terms, p.cancellation_policy),
        'partsLaborWarranty', coalesce(o.parts_labor_warranty, p.parts_labor_warranty),
        'serviceFit', o.service_fit,
        'verifiedFacts', coalesce((select jsonb_agg(jsonb_build_object(
          'kind', pv.kind, 'status', pv.status, 'value', pv.value,
          'source', pv.source, 'verifiedAt', pv.verified_at, 'expiresAt', pv.expires_at
        ) order by pv.kind) from public.provider_verifications pv
          where pv.provider_id = p.id and pv.status = 'verified'
          and (pv.expires_at is null or pv.expires_at > now())), '[]'::jsonb)
      ) order by o.window_start nulls last, o.diagnostic_fee nulls last)
      from public.service_offers o
      join public.provider_requests r on r.id = o.provider_request_id
      join public.provider_businesses p on p.id = r.provider_id
      where o.service_case_id = v_case.id and o.status in ('proposed','held','selected')
        and (o.expires_at is null or o.expires_at > now())), '[]'::jsonb)
    else '[]'::jsonb end,
    'appointment', (select jsonb_build_object(
      'id', a.id, 'status', a.status, 'providerId', a.provider_id,
      'providerName', p.display_name, 'offerId', a.offer_id,
      'windowStart', a.window_start, 'windowEnd', a.window_end, 'timezone', a.timezone,
      'externalReference', a.external_reference, 'confirmedAt', a.confirmed_at,
      'calendarEventIdentifier', a.calendar_event_identifier,
      'cancellationTerms', a.cancellation_terms_snapshot
    ) from public.service_appointments a join public.provider_businesses p on p.id = a.provider_id
      where a.service_case_id = v_case.id)
  );
end;
$$;

create or replace function public.authorize_household_service_booking(p_case_id uuid, p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_case public.service_cases;
  v_offer public.service_offers;
  v_provider public.provider_businesses;
  v_scope jsonb;
  v_hash text;
  v_auth public.service_authorizations;
  v_appointment public.service_appointments;
begin
  select * into v_case from public.service_cases where id = p_case_id for update;
  if not found or v_user is null or not public.is_home_writer(v_case.home_id) then
    raise exception 'household write access required' using errcode = '42501';
  end if;
  if v_case.status <> 'options_ready' then
    raise exception 'options are no longer available for selection' using errcode = '40001';
  end if;
  select o.* into v_offer from public.service_offers o
    where o.id = p_offer_id and o.service_case_id = p_case_id and o.status in ('proposed','held') for update;
  if not found or v_offer.window_start is null or v_offer.window_end is null
     or v_offer.confirmed_at is null or (v_offer.expires_at is not null and v_offer.expires_at <= now()) then
    raise exception 'this provider option is not currently available' using errcode = '23514';
  end if;
  select p.* into v_provider from public.provider_businesses p
    join public.provider_requests r on r.provider_id = p.id where r.id = v_offer.provider_request_id;

  v_scope := jsonb_build_object(
    'caseId', v_case.id, 'offerId', v_offer.id, 'providerId', v_provider.id,
    'providerName', v_provider.display_name, 'visitType', v_offer.visit_type,
    'diagnosticFee', v_offer.diagnostic_fee, 'travelFee', v_offer.travel_fee,
    'deposit', v_offer.deposit, 'currency', v_offer.currency,
    'windowStart', v_offer.window_start, 'windowEnd', v_offer.window_end,
    'timezone', v_offer.timezone, 'cancellationTerms', coalesce(v_offer.cancellation_terms, v_provider.cancellation_policy),
    'partsLaborWarranty', coalesce(v_offer.parts_labor_warranty, v_provider.parts_labor_warranty),
    'sharedInformation', v_case.sharing_scope, 'purpose', 'request_exact_appointment'
  );
  v_hash := md5(v_scope::text);

  insert into public.service_authorizations(home_id, service_case_id, user_id, kind, scope, scope_hash, expires_at)
  values (v_case.home_id, v_case.id, v_user, 'book_appointment', v_scope, v_hash,
    least(coalesce(v_offer.expires_at, now() + interval '2 hours'), now() + interval '2 hours'))
  returning * into v_auth;

  update public.service_offers set status = 'selected' where id = v_offer.id;
  perform public.transition_service_case(v_case.id, 'options_ready', 'selection_approved', 'homeowner',
    v_user::text, 'Household approved exact provider, terms, and visit window',
    jsonb_build_object('offerId', v_offer.id, 'providerId', v_provider.id), v_auth.id,
    'household-selection:' || v_offer.id::text);

  insert into public.service_appointments(home_id, service_case_id, provider_id, offer_id, authorization_id,
    status, window_start, window_end, timezone, cancellation_terms_snapshot)
  values (v_case.home_id, v_case.id, v_provider.id, v_offer.id, v_auth.id, 'pending',
    v_offer.window_start, v_offer.window_end, v_offer.timezone,
    coalesce(v_offer.cancellation_terms, v_provider.cancellation_policy))
  returning * into v_appointment;

  update public.service_authorizations set status = 'consumed', consumed_at = now() where id = v_auth.id;
  perform public.transition_service_case(v_case.id, 'selection_approved', 'booking_pending', 'agent', null,
    'Exact appointment request submitted; provider confirmation is pending',
    jsonb_build_object('appointmentId', v_appointment.id), v_auth.id,
    'booking-requested:' || v_appointment.id::text);

  return jsonb_build_object('caseId', v_case.id, 'status', 'booking_pending',
    'appointmentId', v_appointment.id, 'providerName', v_provider.display_name);
end;
$$;

create or replace function public.record_household_calendar_event(p_case_id uuid, p_identifier text)
returns void language plpgsql security definer set search_path = public as $$
declare v_home uuid;
begin
  select home_id into v_home from public.service_cases where id = p_case_id;
  if v_home is null or auth.uid() is null or not public.is_home_writer(v_home) then
    raise exception 'household write access required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_identifier,''))) < 1 then raise exception 'calendar identifier required'; end if;
  update public.service_appointments set calendar_event_identifier = trim(p_identifier)
    where service_case_id = p_case_id and status = 'confirmed';
  if not found then raise exception 'confirmed appointment required' using errcode = '23514'; end if;
end; $$;

revoke all on function public.get_household_service_case(uuid) from public, anon;
revoke all on function public.authorize_household_service_booking(uuid,uuid) from public, anon;
revoke all on function public.record_household_calendar_event(uuid,text) from public, anon;
grant execute on function public.get_household_service_case(uuid) to authenticated;
grant execute on function public.authorize_household_service_booking(uuid,uuid) to authenticated;
grant execute on function public.record_household_calendar_event(uuid,text) to authenticated;
