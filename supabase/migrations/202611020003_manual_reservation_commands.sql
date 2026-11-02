begin;
alter table public.blocked_dates add column reconciled_at timestamptz;
alter table public.reservation_allocations
 add column legacy_block_id uuid references public.blocked_dates(id) on delete restrict;

create function ops_private.email_snapshot(b public.bookings) returns jsonb
language sql stable set search_path=''
as $$ select jsonb_build_object(
 'name',b.guest_name,'email',b.guest_email,'phone',b.guest_phone,
 'checkIn',b.check_in,'checkOut',b.check_out,'guests',b.guests,
 'locale',b.locale,'reference',coalesce(b.reference,b.id::text),
 'preference',b.room_preference,'notes',b.notes,'bookingType',b.booking_type,
 'package', (select name from public.packages where id=b.package_id),
 'units',(select coalesce(jsonb_agg(u.code order by u.code),'[]'::jsonb)
  from public.reservation_allocations a join public.inventory_units u on u.id=a.unit_id
  where a.booking_id=b.id and a.active)) $$;
revoke all on function ops_private.email_snapshot(public.bookings) from public;

create function ops_private.record_event(b public.bookings, kind text, note text default null)
returns void language plpgsql security definer set search_path=''
as $$
begin
 insert into public.reservation_activity(booking_id,actor_id,event,note,details)
 values(b.id,auth.uid(),kind,note,jsonb_build_object(
  'version',b.version,'status',b.status,'checkIn',b.check_in,'checkOut',b.check_out,
  'guests',b.guests,'preferredListingId',b.preferred_listing_id,
  'guestName',b.guest_name,'guestEmail',b.guest_email,'guestPhone',b.guest_phone,'locale',b.locale,'source',b.booking_source,
  'bookingComCheckedAt',b.booking_com_checked_at,'airbnbCheckedAt',b.airbnb_checked_at,
  'unitIds',(select coalesce(jsonb_agg(unit_id),'[]'::jsonb) from public.reservation_allocations where booking_id=b.id and active)));
 insert into public.operation_notifications(booking_id,event) values(b.id,kind);
 if kind in ('received','confirmed','declined','cancelled','changed')
   and coalesce(b.guest_email,'')<>''
   and (kind<>'received' or b.booking_source='website') then
   insert into public.email_outbox(booking_id,event,version,payload)
    values(b.id,kind,b.version,ops_private.email_snapshot(b))
    on conflict(booking_id,event,version) do nothing;
 end if;
 if kind='received' then
   insert into public.email_outbox(booking_id,event,version,payload)
    values(b.id,'owner_alert',b.version,ops_private.email_snapshot(b))
    on conflict(booking_id,event,version) do nothing;
 end if;
end $$;
revoke all on function ops_private.record_event(public.bookings,text,text) from public;

create function ops_private.insert_request(d jsonb, source text, key uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare b public.bookings; arrival date; departure date; party integer;
 listing uuid; package uuid; fingerprint text; kind text;
begin
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>16000 then
  raise exception 'Invalid request' using errcode='22023';
 end if;
 fingerprint := encode(sha256(convert_to(d::text || ':' || source,'UTF8')),'hex');
 if key is not null then
   -- Serialize duplicate submissions. No duplicate receipt or notification.
   perform pg_advisory_xact_lock(hashtextextended(key::text,0));
   select * into b from public.bookings where request_key=key;
   if found then
    if b.request_hash<>fingerprint then raise exception 'Request key already used' using errcode='22023'; end if;
    return b.id;
   end if;
 end if;
 begin
   arrival := (d->>'checkIn')::date; departure := (d->>'checkOut')::date;
   party := (d->>'guests')::integer;
   listing := nullif(d->>'roomId','')::uuid;
   package := nullif(d->>'packageId','')::uuid;
 exception when others then raise exception 'Invalid dates or guest count' using errcode='22023';
 end;
 if arrival is null or departure is null or party is null
   or (source='website' and arrival < (now() at time zone 'Africa/Casablanca')::date)
   or departure<=arrival or departure-arrival>365 or party not between 1 and 23 then
   raise exception 'Invalid dates or guest count' using errcode='22023';
 end if;
 if length(trim(coalesce(d->>'guestName',''))) not between 2 and 120
   or length(coalesce(d->>'guestEmail',''))>254
   or (coalesce(d->>'guestEmail','')<>'' and d->>'guestEmail' !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')
   or (coalesce(d->>'guestPhone','')<>'' and d->>'guestPhone' !~ '^[+()0-9[:space:]-]{6,40}$')
   or (source='website' and (coalesce(d->>'guestEmail','')='' or coalesce(d->>'guestPhone','')=''))
   or length(coalesce(d->>'message',''))>1600
   or length(coalesce(d->>'roomPreference',''))>160
   or length(coalesce(d->>'surfLevel',''))>160
   or length(coalesce(d->>'retreatName',''))>160
   or coalesce(d->>'locale','en') not in ('en','fr') then
   raise exception 'Invalid guest details' using errcode='22023';
 end if;
 kind := coalesce(d->>'bookingType','stay_only');
 if kind not in ('stay_only','surf_package','group_request')
   or coalesce(d->>'preferredKind','mixed') not in ('double','twin','triple','family','dorm','mixed') then
   raise exception 'Invalid request type' using errcode='22023';
 end if;
 if listing is not null and not exists(select 1 from public.rooms where id=listing and is_active) then
   raise exception 'Requested room listing is not active' using errcode='22023';
 end if;
 if package is not null and not exists(select 1 from public.packages where id=package and is_active) then
   raise exception 'Requested package is not active' using errcode='22023';
 end if;
 if kind='surf_package' and package is null then
   raise exception 'Choose an active surf package' using errcode='22023';
 end if;
 insert into public.bookings(
  room_id,preferred_listing_id,preferred_kind,package_id,reference,request_key,request_hash,
  booking_type,booking_source,external_reference,status,locale,check_in,check_out,guests,
  guest_name,guest_email,guest_phone,notes,surf_level,room_preference,group_size,
  airport_transfer,board_rental,wetsuit_rental,coworking_interest,private_coaching,
  yoga_interest,meals_needed,retreat_name)
 values(null,listing,coalesce(d->>'preferredKind','mixed'),package,
  'TW-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),key,fingerprint,
  kind,source,left(d->>'externalReference',160),'pending',coalesce(d->>'locale','en'),
  arrival,departure,party,trim(d->>'guestName'),lower(trim(d->>'guestEmail')),
  trim(d->>'guestPhone'),nullif(d->>'message',''),nullif(d->>'surfLevel',''),
  nullif(d->>'roomPreference',''),case when kind='group_request' then party else null end,
  coalesce((d->>'airportTransfer')::boolean,false),coalesce((d->>'boardRental')::boolean,false),
  coalesce((d->>'wetsuitRental')::boolean,false),coalesce((d->>'coworkingInterest')::boolean,false),
  coalesce((d->>'privateCoaching')::boolean,false),coalesce((d->>'yogaInterest')::boolean,false),
  coalesce((d->>'mealsNeeded')::boolean,false),nullif(d->>'retreatName',''))
 returning * into b;
 perform ops_private.record_event(b,'received');
 return b.id;
end $$;
revoke all on function ops_private.insert_request(jsonb,text,uuid) from public;

-- Only the bounded server intake can supply the HMAC rate key. Clients cannot
-- invoke this RPC with an arbitrary IP/rate key or bypass intake limits.
create function public.submit_booking_request(p_input jsonb,p_request_key uuid,p_rate_key text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare bucket ops_private.request_limits;
begin
 if p_request_key is null or p_rate_key !~ '^[0-9a-f]{64}$' then
   raise exception 'Invalid request key' using errcode='22023';
 end if;
 insert into ops_private.request_limits(rate_key,window_start,attempts)
 values(p_rate_key,now(),1)
 on conflict(rate_key) do update set
  attempts=case when ops_private.request_limits.window_start<now()-interval '1 hour' then 1
    else ops_private.request_limits.attempts+1 end,
  window_start=case when ops_private.request_limits.window_start<now()-interval '1 hour' then now()
    else ops_private.request_limits.window_start end
 returning * into bucket;
 if bucket.attempts>10 then raise exception 'Too many requests. Please contact the property.' using errcode='P0429'; end if;
 return ops_private.insert_request(p_input,'website',p_request_key);
end $$;
revoke all on function public.submit_booking_request(jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.submit_booking_request(jsonb,uuid,text) to service_role;

create function public.create_manual_request(p_input jsonb,p_source text,p_request_key uuid default gen_random_uuid())
returns uuid language plpgsql security definer set search_path=''
as $$
begin
 perform ops_private.require_role(array['owner','reception']);
 if p_source not in ('booking_com','airbnb','direct','walk_in') then
  raise exception 'Invalid source' using errcode='22023';
 end if;
 return ops_private.insert_request(p_input,p_source,p_request_key);
end $$;
revoke all on function public.create_manual_request(jsonb,text,uuid) from public;
grant execute on function public.create_manual_request(jsonb,text,uuid) to authenticated;

create function public.manage_reservation(p_booking_id uuid,p_command text,p_data jsonb,p_expected_version integer)
returns void language plpgsql security definer set search_path=''
as $$
declare b public.bookings; actor uuid; units uuid[]; seats integer; note text; kind text;
begin
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>16000 then
  raise exception 'Invalid command' using errcode='22023';
 end if;
 actor := ops_private.require_role(array['owner','reception']);
 -- A small property-wide inventory lock gives deterministic ordering across
 -- bookings, group allocations, reassignments and maintenance blocks.
 perform pg_advisory_xact_lock(82416023);
 select * into b from public.bookings where id=p_booking_id for update;
 if not found then raise exception 'Reservation not found' using errcode='P0002'; end if;
 if b.version<>p_expected_version then raise exception 'Reservation changed. Refresh before saving.' using errcode='40001'; end if;
 note := nullif(trim(p_data->>'note'),'');
 if length(note)>4000 then raise exception 'Note is too long' using errcode='22023'; end if;
 if p_command='note' then
  if note is null then raise exception 'Enter a note' using errcode='22023'; end if;
  insert into public.reservation_activity(booking_id,actor_id,event,note) values(b.id,actor,'note',note);
  return;
 end if;
 if p_command='details' then
  if b.status<>'pending' then perform ops_private.require_role(array['owner']); end if;
  if length(trim(coalesce(p_data->>'guestName',''))) not between 2 and 120
    or length(coalesce(p_data->>'guestEmail',''))>254
    or (coalesce(p_data->>'guestEmail','')<>'' and p_data->>'guestEmail' !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')
    or (coalesce(p_data->>'guestPhone','')<>'' and p_data->>'guestPhone' !~ '^[+()0-9[:space:]-]{6,40}$')
    or coalesce(p_data->>'locale','en') not in ('en','fr') then
    raise exception 'Invalid guest details' using errcode='22023';
  end if;
  update public.bookings set guest_name=trim(p_data->>'guestName'),
   guest_email=lower(trim(coalesce(p_data->>'guestEmail',''))),
   guest_phone=trim(coalesce(p_data->>'guestPhone','')),
   locale=coalesce(p_data->>'locale','en'),version=version+1,updated_at=now()
   where id=b.id returning * into b;
  perform ops_private.record_event(b,'guest_details_changed',note);
  return;
 end if;
 perform ops_private.require_role(array['owner']);
 if p_command in ('confirm','change','reconcile') then
  if p_command='confirm' and b.status<>'pending' then raise exception 'Only pending requests can be confirmed' using errcode='22023'; end if;
  if p_command in ('change','reconcile') and b.status<>'confirmed' then raise exception 'Choose a confirmed reservation' using errcode='22023'; end if;
  if p_command='reconcile' and (b.booking_source<>'legacy' or exists(
    select 1 from public.reservation_allocations where booking_id=b.id and active)) then
    raise exception 'Only an unmapped legacy stay can be reconciled' using errcode='22023';
  end if;
  if p_command='reconcile' and (
    coalesce(nullif(p_data->>'checkIn','')::date,b.check_in)<>b.check_in or
    coalesce(nullif(p_data->>'checkOut','')::date,b.check_out)<>b.check_out or
    coalesce(nullif(p_data->>'guests','')::integer,b.guests)<>b.guests) then
    raise exception 'Reconciliation must preserve existing dates and guest count' using errcode='22023';
  end if;
  if not coalesce((p_data->>'bookingComChecked')::boolean,false)
    or not coalesce((p_data->>'airbnbChecked')::boolean,false) then
    raise exception 'Record both manual OTA checks before confirmation' using errcode='23514';
  end if;
  b.check_in := coalesce(nullif(p_data->>'checkIn','')::date,b.check_in);
  b.check_out := coalesce(nullif(p_data->>'checkOut','')::date,b.check_out);
  b.guests := coalesce(nullif(p_data->>'guests','')::integer,b.guests);
  if b.check_out<=b.check_in or b.check_out-b.check_in>365 or b.guests not between 1 and 23 then
   raise exception 'Invalid reservation dates or guest count' using errcode='22023';
  end if;
  if p_command='confirm' and b.booking_source='website' and b.check_in<(now() at time zone 'Africa/Casablanca')::date then
   raise exception 'Arrival cannot be in the past' using errcode='22023';
  end if;
  select array_agg(v::uuid) into units from jsonb_array_elements_text(p_data->'unitIds') v;
  if coalesce(cardinality(units),0)=0 or cardinality(units)>12
     or cardinality(units)<>(select count(distinct u) from unnest(units) u) then
    raise exception 'Select distinct room or bed units' using errcode='23514';
  end if;
  select sum(u.capacity) into seats from public.inventory_units u
   join public.physical_rooms r on r.id=u.physical_room_id
   where u.id=any(units) and u.is_active and r.is_active;
  if coalesce(seats,0)<b.guests or cardinality(units)<>(select count(*) from public.inventory_units u
     join public.physical_rooms r on r.id=u.physical_room_id
     where u.id=any(units) and u.is_active and r.is_active) then
    raise exception 'Allocated rooms/beds must be active and accommodate every guest' using errcode='23514';
  end if;
  if p_command<>'reconcile' and exists(
    select 1 from public.bookings x where x.id<>b.id and x.status='confirmed'
     and x.check_in<b.check_out and x.check_out>b.check_in
     and not exists(select 1 from public.reservation_allocations a where a.booking_id=x.id and a.active)) then
    raise exception 'Reconcile overlapping legacy confirmed stays first' using errcode='23514';
  end if;
  if exists(select 1 from public.blocked_dates x where x.reconciled_at is null
    and x.start_date<b.check_out and x.end_date>b.check_in) then
    raise exception 'Reconcile overlapping legacy blocked dates first' using errcode='23514';
  end if;
  -- Preserve every old allocation as history. An exclusion failure rolls back
  -- both this release and the header change.
  update public.reservation_allocations set active=false where booking_id=b.id and active;
  update public.bookings set status='confirmed',check_in=b.check_in,check_out=b.check_out,
   preferred_listing_id=coalesce(preferred_listing_id,room_id),room_id=null,
   guests=b.guests,decision_by=actor,decision_at=now(),booking_com_checked_at=now(),
   airbnb_checked_at=now(),version=version+1,updated_at=now() where id=b.id returning * into b;
  insert into public.reservation_allocations(booking_id,unit_id,check_in,check_out,created_by)
   select b.id,u,b.check_in,b.check_out,actor from unnest(units) u;
  kind := case when p_command='confirm' then 'confirmed' when p_command='change' then 'changed' else 'reconciled' end;
 elsif p_command in ('decline','cancel') then
  if (p_command='decline' and b.status<>'pending')
    or (p_command='cancel' and b.status not in ('pending','confirmed')) then
    raise exception 'Invalid reservation transition' using errcode='22023';
  end if;
  if note is null then raise exception 'Add a decision reason' using errcode='22023'; end if;
  update public.reservation_allocations set active=false where booking_id=b.id and active;
  update public.bookings set status=case when p_command='decline' then 'declined'::public.booking_status else 'cancelled'::public.booking_status end,
   decision_by=actor,decision_at=now(),version=version+1,updated_at=now()
   where id=b.id returning * into b;
  kind := case when p_command='decline' then 'declined' else 'cancelled' end;
 else raise exception 'Unsupported reservation command' using errcode='22023';
 end if;
 perform ops_private.record_event(b,kind,note);
end $$;
revoke all on function public.manage_reservation(uuid,text,jsonb,integer) from public;
grant execute on function public.manage_reservation(uuid,text,jsonb,integer) to authenticated;

create function public.manage_inventory_block(p_unit_ids uuid[],p_check_in date,p_check_out date,p_reason text,p_legacy_block_id uuid default null)
returns void language plpgsql security definer set search_path=''
as $$
declare actor uuid;
begin
 actor := ops_private.require_role(array['owner']);
 perform pg_advisory_xact_lock(82416023);
 if coalesce(cardinality(p_unit_ids),0)=0 or cardinality(p_unit_ids)>12
  or cardinality(p_unit_ids)<>(select count(distinct u) from unnest(p_unit_ids) u)
  or p_check_in is null or p_check_out is null or p_check_out<=p_check_in
  or length(trim(coalesce(p_reason,''))) not between 2 and 500 then
  raise exception 'Invalid maintenance block' using errcode='22023';
 end if;
 if exists(select 1 from public.bookings x where x.status='confirmed'
   and x.check_in<p_check_out and x.check_out>p_check_in
   and not exists(select 1 from public.reservation_allocations a where a.booking_id=x.id and a.active)) then
   raise exception 'Reconcile overlapping legacy confirmed stays first' using errcode='23514';
 end if;
 if p_legacy_block_id is not null then
   perform 1 from public.blocked_dates where id=p_legacy_block_id and reconciled_at is null
    and start_date=p_check_in and end_date=p_check_out for update;
   if not found then raise exception 'Legacy block changed' using errcode='22023'; end if;
 end if;
 insert into public.reservation_allocations(unit_id,check_in,check_out,block_reason,created_by,legacy_block_id)
 select u,p_check_in,p_check_out,trim(p_reason),actor,p_legacy_block_id from unnest(p_unit_ids) u;
 if p_legacy_block_id is not null then
  update public.blocked_dates set reconciled_at=now() where id=p_legacy_block_id;
 end if;
 insert into public.inventory_activity(actor_id,action,unit_ids,check_in,check_out,reason)
 values(actor,case when p_legacy_block_id is null then 'blocked' else 'reconciled' end,
  p_unit_ids,p_check_in,p_check_out,trim(p_reason));
end $$;
revoke all on function public.manage_inventory_block(uuid[],date,date,text,uuid) from public;
grant execute on function public.manage_inventory_block(uuid[],date,date,text,uuid) to authenticated;

create function public.release_inventory_block(p_id uuid) returns void
language plpgsql security definer set search_path=''
as $$
declare a public.reservation_allocations; actor uuid;
begin
 actor := ops_private.require_role(array['owner']);
 perform pg_advisory_xact_lock(82416023);
 select * into a from public.reservation_allocations where id=p_id and booking_id is null and active for update;
 if not found then raise exception 'Active block not found' using errcode='P0002'; end if;
 update public.reservation_allocations set active=false where id=p_id and booking_id is null and active;
 insert into public.inventory_activity(actor_id,action,unit_ids,check_in,check_out,reason)
 values(actor,'released',array[a.unit_id],a.check_in,a.check_out,a.block_reason);
end $$;
revoke all on function public.release_inventory_block(uuid) from public;
grant execute on function public.release_inventory_block(uuid) to authenticated;

create function public.claim_booking_emails(p_booking_id uuid default null)
returns setof public.email_outbox language plpgsql security definer set search_path=''
as $$
begin
 return query
 with due as (
  select id from public.email_outbox where
   ((status in ('queued','failed') and available_at<=now())
    or (status='processing' and lease_until<now()))
   and attempts<5 and (p_booking_id is null or booking_id=p_booking_id)
   order by created_at limit 10 for update skip locked
 )
 update public.email_outbox o set status='processing',attempts=attempts+1,
   lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
 from due where o.id=due.id returning o.*;
end $$;
create function public.finish_booking_email(p_id uuid,p_lease_token uuid,p_success boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
 update public.email_outbox set status=case when p_success then 'sent' else 'failed' end,
  sent_at=case when p_success then now() else null end,
  last_error=case when p_success then null else 'Provider delivery attempt failed; inspect server configuration/logs.' end,
  available_at=now()+make_interval(mins=>least(60,attempts*attempts)),
  lease_until=null,lease_token=null
 where id=p_id and lease_token=p_lease_token and status='processing';
 if not found then raise exception 'Email lease expired or changed' using errcode='40001'; end if;
end $$;
revoke all on function public.claim_booking_emails(uuid) from public,anon,authenticated;
revoke all on function public.finish_booking_email(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_booking_emails(uuid) to service_role;
grant execute on function public.finish_booking_email(uuid,uuid,boolean) to service_role;
create function public.retry_failed_booking_emails(p_booking_id uuid) returns void
language plpgsql security definer set search_path=''
as $$
declare b public.bookings;
begin
 perform ops_private.require_role(array['owner']);
 select * into b from public.bookings where id=p_booking_id;
 if not found then raise exception 'Reservation not found' using errcode='P0002'; end if;
 update public.email_outbox set status='queued',attempts=0,available_at=now(),
  last_error=null,lease_token=null,lease_until=null where booking_id=b.id and status='failed';
 perform ops_private.record_event(b,'email_retry_requested');
end $$;
revoke all on function public.retry_failed_booking_emails(uuid) from public;
grant execute on function public.retry_failed_booking_emails(uuid) to authenticated;
create function public.unit_calendar_events(p_unit_id uuid)
returns setof public.reservation_allocations
language plpgsql stable security definer set search_path=''
as $$
begin
 if exists(select 1 from public.bookings b where b.status='confirmed'
   and b.check_out>(now() at time zone 'Africa/Casablanca')::date
   and not exists(select 1 from public.reservation_allocations a where a.booking_id=b.id and a.active))
   or exists(select 1 from public.blocked_dates where reconciled_at is null
    and end_date>(now() at time zone 'Africa/Casablanca')::date) then
  raise exception 'Reconcile legacy inventory before exporting availability' using errcode='23514';
 end if;
 return query select * from public.reservation_allocations a
  where a.unit_id=p_unit_id and a.active
   and a.check_out>(now() at time zone 'Africa/Casablanca')::date order by a.check_in,a.id;
end $$;
revoke all on function public.unit_calendar_events(uuid) from public,anon,authenticated;
grant execute on function public.unit_calendar_events(uuid) to service_role;
commit;
