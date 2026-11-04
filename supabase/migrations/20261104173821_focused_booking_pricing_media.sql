begin;
-- Focused extension of accepted catalogue, CMS and request intake. Approval/allocation commands unchanged.

alter table public.rooms add column bathroom_type text not null default 'unknown' check(bathroom_type in ('unknown','private','shared_dorm'));

alter table public.package_photos add column caption text not null default '' check(length(caption)<=300),add column focal_position text not null default 'center' check(focal_position in ('top','center','bottom')),add column mobile_focal_position text not null default 'center' check(mobile_focal_position in ('top','center','bottom'));
grant select(caption,focal_position,mobile_focal_position) on public.package_photos to anon;

-- Owner-confirmed facts; no capacities, rates, allocations or publication statuses change.
update public.rooms set bathroom_type=case when slug='4-bed-dorm-room' then 'shared_dorm' else 'private' end where slug in ('4-bed-dorm-room','private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p');
update public.property_room_details d set version=d.version+1,amenities=array_append(d.amenities,case when r.kind='dorm' then 'Bathroom shared with dorm occupants' else 'Private bathroom' end) from public.physical_rooms r where r.id=d.id and not (case when r.kind='dorm' then 'Bathroom shared with dorm occupants' else 'Private bathroom' end)=any(d.amenities);
create or replace function ops_private.validate_package_catalogue() returns trigger language plpgsql set search_path='' as $$
declare c jsonb:=new.catalogue; v jsonb; s jsonb; t jsonb; k text; key_name text;
begin
 if jsonb_typeof(c)<>'object' or octet_length(c::text)>40000 then raise exception 'Invalid package catalogue' using errcode='22023';end if;
 if current_setting('role')='authenticated' then
  if new.publication_status='published' or (TG_OP='UPDATE' and old.publication_status='published') or coalesce((c->>'arrangementsVerified')::boolean,false) then
   if public.staff_role() is distinct from 'owner' then raise exception 'Only the MFA Owner can approve, publish or edit a published offer' using errcode='42501';end if;
  elsif coalesce(public.staff_role(),'') not in ('owner','content_editor') then raise exception 'Content access required' using errcode='42501';end if;
 end if;
 if c<>'{}'::jsonb then
  if (c->>'nights')::integer not between 1 and 365 or c->>'currency' not in ('EUR','GBP','USD','MAD') or c->>'pricingBasis' not in ('person','room','booking') then raise exception 'Invalid duration or pricing basis' using errcode='22023';end if;
  foreach key_name in array array['variants','extras','seasons','levels','inclusionsFr','exclusions','exclusionsFr','proposed','proposedFr'] loop
   if jsonb_typeof(c->key_name) is distinct from 'array' or jsonb_array_length(c->key_name)>30 then raise exception 'Invalid package options' using errcode='22023';end if;
  end loop;
  foreach key_name in array array['variants','extras','seasons'] loop
   if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(c->key_name) x) then raise exception 'Duplicate option code' using errcode='22023';end if;
   for v in select * from jsonb_array_elements(c->key_name) loop
    if coalesce(v->>'id','')!~'^[a-z0-9]+(-[a-z0-9]+)*$' or length(v->>'id')>64 or length(coalesce(v->>'label','')) not between 1 and 300 then raise exception 'Invalid option label/code' using errcode='22023';end if;
    if v->'priceCents' is null or (v->>'priceCents' is not null and ((v->>'priceCents')::numeric not between 0 and 99999999 or (v->>'priceCents')::numeric<>trunc((v->>'priceCents')::numeric))) then raise exception 'Invalid package price' using errcode='22023';end if;
    if key_name='variants' and not exists(select 1 from public.rooms where id=(v->>'roomId')::uuid and is_active) then raise exception 'Choose a real active room listing' using errcode='22023';end if;
    if key_name='extras' and v->>'basis' not in ('person','booking') then raise exception 'Invalid extra pricing basis' using errcode='22023';end if;
    if key_name='seasons' then
     if (v->>'start')::date>=(v->>'end')::date or (coalesce(v->>'variantId','')<>'' and not exists(select 1 from jsonb_array_elements(c->'variants') x where x->>'id'=v->>'variantId')) then raise exception 'Invalid season dates or variant' using errcode='22023';end if;
    end if;
   end loop;
  end loop;
  for s in select * from jsonb_array_elements(c->'seasons') loop
   for t in select * from jsonb_array_elements(c->'seasons') loop
    if s->>'id'<>t->>'id' and (s->>'start')::date<(t->>'end')::date and (t->>'start')::date<(s->>'end')::date and (s->>'variantId'='' or t->>'variantId'='' or s->>'variantId'=t->>'variantId') then raise exception 'Season dates overlap for this variant' using errcode='22023';end if;
   end loop;
  end loop;
 end if;
 if c<>'{}'::jsonb then
  if c ? 'chargesIncluded' and jsonb_typeof(c->'chargesIncluded')<>'boolean' then raise exception 'Verify mandatory charges' using errcode='22023';end if;
  for v in select * from jsonb_array_elements(c->'variants') loop
   if coalesce((v->>'minGuests')::integer,1) not between 1 and 23 or coalesce((v->>'maxGuests')::integer,23) not between 1 and 23 or coalesce((v->>'roomCount')::integer,1) not between 1 and 8 or coalesce((v->>'minGuests')::integer,1)>coalesce((v->>'maxGuests')::integer,23) then raise exception 'Check occupancy and room count' using errcode='22023';end if;
   if (v->>'priceCents')::numeric=0 then raise exception 'Use a positive price or null for a quote' using errcode='22023';end if;
   if c->>'pricingBasis'='room' and exists(select 1 from public.rooms where id=(v->>'roomId')::uuid and slug like '%dorm%') then raise exception 'Dorm variants use per-person or package pricing' using errcode='22023';end if;
   if new.publication_status='published' and greatest(coalesce((v->>'minGuests')::integer,1),coalesce((v->>'maxGuests')::integer,1))>(select case when slug like '%dorm%' then 4 else max_guests*coalesce((v->>'roomCount')::integer,1) end from public.rooms where id=(v->>'roomId')::uuid) then raise exception 'Variant occupancy exceeds actual room capacity' using errcode='23514';end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(c->'seasons') x where (x->>'priceCents')::numeric=0) then raise exception 'Use a positive seasonal price or null' using errcode='22023';end if;
 end if;
 if new.publication_status='published' then
  if not exists(select 1 from public.package_photos where package_id=new.id and not archived) then raise exception 'Choose and verify a genuine cover photograph before publishing' using errcode='23514';end if;
  if c='{}'::jsonb or not coalesce((c->>'arrangementsVerified')::boolean,false) or (c->>'nights') is null
   or length(trim(coalesce(c->>'nameFr','')))<2 or length(trim(coalesce(c->>'shortFr','')))<10 or length(trim(coalesce(c->>'descriptionFr','')))<10
   or length(trim(new.name))<2 or length(trim(new.short_description))<10 or length(trim(new.full_description))<10
   or jsonb_array_length(c->'proposed')<>0 or jsonb_array_length(c->'proposedFr')<>0
   or jsonb_array_length(c->'variants')=0 or jsonb_array_length(c->'levels')=0 or cardinality(new.inclusions)=0
   or jsonb_array_length(c->'inclusionsFr')<>cardinality(new.inclusions) or jsonb_array_length(c->'exclusionsFr')<>jsonb_array_length(c->'exclusions')
   or exists(select 1 from jsonb_array_elements(c->'variants') x where length(trim(coalesce(x->>'labelFr','')))=0)
   or exists(select 1 from jsonb_array_elements(c->'extras') x where length(trim(coalesce(x->>'labelFr','')))=0)
   or exists(select 1 from jsonb_array_elements_text(c->'levels') x where x not in ('beginner','improver','intermediate','advanced')) then
    raise exception 'Owner review, complete EN/FR content, duration, levels and real room variants are required before publishing' using errcode='23514';
  end if;
 end if;
 new.is_active:=new.publication_status='published';
 if TG_OP='UPDATE' then new.version:=old.version+1;end if;
 new.updated_at:=clock_timestamp();return new;
end $$;

create function ops_private.package_quote(d jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.packages; c jsonb; v jsonb; e jsonb; season jsonb; ids jsonb; selected jsonb:='[]'; base bigint; total bigint; price bigint; party integer; arrival date; departure date; r public.rooms; rooms integer; cap integer; loc text;
begin
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>4000 or exists(select 1 from jsonb_object_keys(d) k where k not in ('packageId','packageVariant','packageExtras','checkIn','checkOut','guests','surfLevel','locale')) then raise exception 'Invalid estimate selections' using errcode='22023';end if;
 select * into p from public.packages where id=(d->>'packageId')::uuid for share;
 if not found or not p.is_active or p.publication_status<>'published' or not coalesce((p.catalogue->>'arrangementsVerified')::boolean,false) then raise exception 'Choose a published verified package' using errcode='22023';end if;
 c:=p.catalogue;loc:=coalesce(d->>'locale','en');party:=(d->>'guests')::integer;arrival:=(d->>'checkIn')::date;departure:=(d->>'checkOut')::date;
 if loc not in ('en','fr') or party is null or party not between 1 and 23 or arrival is null or departure is null or departure-arrival<>(c->>'nights')::integer then raise exception 'Check dates, guests and duration' using errcode='22023';end if;
 select x into v from jsonb_array_elements(c->'variants') x where x->>'id'=d->>'packageVariant';
 if v is null then raise exception 'Choose an offered room variant' using errcode='22023';end if;
 select * into r from public.rooms where id=(v->>'roomId')::uuid and is_active;
 if not found then raise exception 'Room variant no longer offered' using errcode='22023';end if;
 rooms:=coalesce((v->>'roomCount')::integer,1);cap:=case when r.slug like '%dorm%' then 4 else r.max_guests*rooms end;
 if party<coalesce((v->>'minGuests')::integer,1) or party>least(coalesce((v->>'maxGuests')::integer,cap),cap) then raise exception 'Choose an accommodation variant for this group size' using errcode='22023';end if;
 if not c->'levels' ? coalesce(d->>'surfLevel','') then raise exception 'Choose an offered surf level' using errcode='22023';end if;
 ids:=coalesce(d->'packageExtras','[]');
 if jsonb_typeof(ids)<>'array' or jsonb_array_length(ids)>15 or (select count(*)<>count(distinct x) from jsonb_array_elements_text(ids) x) then raise exception 'Invalid extras' using errcode='22023';end if;
 select x into season from jsonb_array_elements(c->'seasons') x where (x->>'variantId'='' or x->>'variantId'=v->>'id') and arrival>=(x->>'start')::date and arrival<(x->>'end')::date;
 base:=case when season is not null then (season->>'priceCents')::bigint else (v->>'priceCents')::bigint end;
 if not coalesce((c->>'chargesIncluded')::boolean,false) or base<=0 then base:=null;end if;
 total:=base*case c->>'pricingBasis' when 'person' then party when 'room' then rooms else 1 end;
 for e in select x from jsonb_array_elements(c->'extras') x where ids ? (x->>'id') loop
  price:=(e->>'priceCents')::bigint;total:=total+price*case when e->>'basis'='person' then party else 1 end;
  selected:=selected||jsonb_build_array(jsonb_build_object('id',e->>'id','label',case when loc='fr' then e->>'labelFr' else e->>'label' end,'priceCents',price,'basis',e->>'basis'));
 end loop;
 if jsonb_array_length(selected)<>jsonb_array_length(ids) then raise exception 'Choose offered extras only' using errcode='22023';end if;
 return jsonb_build_object('id',p.id,'catalogueVersion',p.version,'name',case when loc='fr' then c->>'nameFr' else p.name end,'variantId',v->>'id','variantLabel',case when loc='fr' then v->>'labelFr' else v->>'label' end,'roomId',v->>'roomId','roomCount',rooms,'guests',party,'nights',c->'nights','surfLevel',d->>'surfLevel','extras',selected,'currency',c->>'currency','basis',c->>'pricingBasis','basePriceCents',base,'totalCents',total,'season',case when season is null then null when loc='fr' then coalesce(nullif(season->>'labelFr',''),'Tarif saisonnier') else season->>'label' end,'seasonId',season->>'id','pricingRule','arrival date; whole package; accommodation and mandatory charges included','inclusions',case when loc='fr' then c->'inclusionsFr' else to_jsonb(p.inclusions) end,'exclusions',case when loc='fr' then c->'exclusionsFr' else c->'exclusions' end);
end $$;
revoke all on function ops_private.package_quote(jsonb) from public,anon,authenticated,service_role;
create function public.estimate_package_request(p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.operations_settings where (p_input->>'checkIn')::date<(now() at time zone 'Africa/Casablanca')::date+notice_days or (p_input->>'checkOut')::date-(p_input->>'checkIn')::date not between minimum_nights and maximum_nights) then raise exception 'Choose dates within the current stay rules' using errcode='22023';end if;
 return ops_private.package_quote(p_input);
end $$;
revoke all on function public.estimate_package_request(jsonb) from public,anon,authenticated;
grant execute on function public.estimate_package_request(jsonb) to service_role;
create or replace function ops_private.capture_package_request() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.package_selection is distinct from old.package_selection or new.package_variant is distinct from old.package_variant or new.package_id is distinct from old.package_id then raise exception 'Package request snapshots are immutable' using errcode='42501';end if;return new;
 end if;
 new.package_selection:='{}';new.package_variant:=null;
 if new.package_id is null then return new;end if;
 if new.booking_type<>'surf_package' then raise exception 'Invalid package request type' using errcode='22023';end if;
 new.package_variant:=nullif(current_setting('tifawave.package_variant',true),'');
 new.package_selection:=ops_private.package_quote(jsonb_build_object('packageId',new.package_id,'packageVariant',new.package_variant,'packageExtras',coalesce(nullif(current_setting('tifawave.package_extras',true),'')::jsonb,'[]'),'checkIn',new.check_in,'checkOut',new.check_out,'guests',new.guests,'surfLevel',new.surf_level,'locale',new.locale));
 if new.preferred_listing_id is not null and new.preferred_listing_id<>(new.package_selection->>'roomId')::uuid then raise exception 'Package variant does not match room preference' using errcode='22023';end if;
 new.preferred_listing_id:=(new.package_selection->>'roomId')::uuid;
 select case when r.slug like '%dorm%' then 'dorm' when r.slug like '%twin%' then 'twin' when r.slug like '%triple%' then 'triple' when r.slug like '%family%' then 'family' else 'double' end into new.preferred_kind from public.rooms r where id=new.preferred_listing_id;
 return new;
end $$;
create or replace function ops_private.insert_request(d jsonb, source text, key uuid)
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
   or (source='website' and coalesce(d->>'guestEmail','')='')
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
 if source='website' and kind='stay_only' and listing is not null then
  if party>(select case when slug like '%dorm%' then 4 else max_guests end from public.rooms where id=listing) then raise exception 'For multiple private rooms, request a group quote' using errcode='22023';end if;
  select case when r.slug like '%dorm%' then 'dorm' when r.slug like '%twin%' then 'twin' when r.slug like '%triple%' then 'triple' when r.slug like '%family%' then 'family' else 'double' end into kind from public.rooms r where r.id=listing;
  d:=jsonb_set(d,'{preferredKind}',to_jsonb(kind));kind:='stay_only';
 end if;
 perform set_config('tifawave.package_variant',coalesce(d->>'packageVariant',''),true);
 perform set_config('tifawave.package_extras',coalesce(d->'packageExtras','[]'::jsonb)::text,true);
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


create function ops_private.allowed_image(url text) returns boolean language sql stable set search_path='' as $$
 select length(url)<=2048 and (url ~ '^https://(images[.]unsplash[.]com|images[.]pexels[.]com)/[^#[:space:]]*$' or url like regexp_replace(coalesce(auth.jwt()->>'iss',''),'/auth/v1/?$','')||'/storage/v1/object/public/tifawave-media/%' and url !~ '[#[:space:]]')
$$;
revoke all on function ops_private.allowed_image(text) from public,anon,authenticated,service_role;
create or replace function ops_private.validate_document(p_doc jsonb,p_kind text,p_publish boolean) returns void
language plpgsql security definer set search_path='' as $$ declare k text;v jsonb;asset text;prefix text:=regexp_replace(coalesce(auth.jwt()->>'iss',''),'/auth/v1/?$','')||'/storage/v1/object/public/tifawave-media/';
begin
 if jsonb_typeof(p_doc)<>'object' or octet_length(p_doc::text)>65536 then raise exception 'Invalid document' using errcode='22023';end if;
 for k,v in select * from jsonb_each(p_doc) loop
  if not(k=any(array['title','summary','body','seoTitle','seoDescription','heroImage','heroMobileImage','heroFocal','heroMobileFocal','heroAlt','heroVideo','ctaLabel','ctaPath','sections','faqs'])) then raise exception 'Unsupported content field' using errcode='22023';end if;
  if k not in ('sections','faqs') and (jsonb_typeof(v)<>'string' or length(v#>>'{}')>12000) then raise exception 'Invalid content value' using errcode='22023';end if;
  if k in ('heroImage','heroMobileImage','heroVideo') then
   asset:=v#>>'{}';
   if asset<>'' and not ((k='heroVideo' and asset like prefix||'%') or (k<>'heroVideo' and ops_private.allowed_image(asset)) or asset ~ '^/(images|media)/[A-Za-z0-9_./-]+$') then raise exception 'Use property media from the media library' using errcode='22023';end if;
  end if;
  if k in ('heroFocal','heroMobileFocal') and (v#>>'{}') not in ('top','center','bottom') then raise exception 'Choose a focal point' using errcode='22023';end if;
  if k='ctaPath' and (v#>>'{}')<>'' and (v#>>'{}') !~ '^/[a-z][a-z0-9/-]*$' then raise exception 'Use a local website path' using errcode='22023';end if;
  if k='sections' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>12 or exists(select 1 from jsonb_array_elements(v) a where jsonb_typeof(a)<>'object' or jsonb_typeof(a->'heading') is distinct from 'string' or jsonb_typeof(a->'body') is distinct from 'string' or length(a->>'heading')>180 or length(a->>'body')>5000 or (coalesce(a->>'imageUrl','')<>'' and not ops_private.allowed_image(a->>'imageUrl')) or length(coalesce(a->>'imageAlt',''))>300 or coalesce(a->>'focalPosition','center') not in ('top','center','bottom')) then raise exception 'Invalid page sections' using errcode='22023';end if;
  end if;
  if k='faqs' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>30 or exists(select 1 from jsonb_array_elements(v) a where jsonb_typeof(a)<>'object' or jsonb_typeof(a->'question') is distinct from 'string' or jsonb_typeof(a->'answer') is distinct from 'string' or length(a->>'question')>200 or length(a->>'answer')>2000) then raise exception 'Invalid questions' using errcode='22023';end if;
  end if;
 end loop;
 if p_kind='email' and length(coalesce(p_doc->>'body',''))>4000 then raise exception 'Email additions are limited to 4000 characters' using errcode='22023';end if;
 if p_publish and p_kind<>'email' and length(trim(coalesce(p_doc->>'title','')))<2 then raise exception 'Add a title before publishing' using errcode='23514';end if;
 if p_publish and coalesce(p_doc->>'heroVideo','')<>'' and coalesce(p_doc->>'heroImage','')='' then raise exception 'A video requires a static image fallback' using errcode='23514';end if;
end $$;

create or replace function public.submit_enquiry(p_input jsonb,p_request_key uuid,p_rate_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare e public.enquiries;k text;fingerprint text;attempts integer;payload jsonb;
begin
 if jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>10000 or p_request_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid enquiry' using errcode='22023';end if;
 for k in select jsonb_object_keys(p_input) loop
  if not(k=any(array['kind','contactName','email','phone','organization','message','checkIn','checkOut','groupSize','locale'])) then raise exception 'Unsupported enquiry field' using errcode='22023';end if;
 end loop;
 fingerprint:=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_request_key::text,0));
 select * into e from public.enquiries where request_key=p_request_key;
 if found then
  if e.request_hash<>fingerprint then raise exception 'Request key belongs to another enquiry' using errcode='23505';end if;return e.id;
 end if;
 insert into ops_private.request_limits(rate_key,window_start,attempts) values('enquiry:'||p_rate_key,now(),1)
 on conflict(rate_key) do update set attempts=case when ops_private.request_limits.window_start<now()-interval '15 minutes' then 1 else ops_private.request_limits.attempts+1 end,
 window_start=case when ops_private.request_limits.window_start<now()-interval '15 minutes' then now() else ops_private.request_limits.window_start end
 returning ops_private.request_limits.attempts into attempts;
 if attempts>5 then raise exception 'Too many enquiries' using errcode='P0429';end if;
 if length(trim(coalesce(p_input->>'message','')))<10 or (p_input->>'kind' in ('group','retreat') and nullif(p_input->>'groupSize','') is null) then raise exception 'Add enquiry details and group size' using errcode='22023';end if;
 if nullif(p_input->>'checkIn','')::date < (now() at time zone 'Africa/Casablanca')::date then raise exception 'Arrival must be in the future' using errcode='22023';end if;
 insert into public.enquiries(kind,contact_name,email,phone,organization,message,check_in,check_out,group_size,locale,request_key,request_hash)
 values(p_input->>'kind',trim(p_input->>'contactName'),lower(trim(p_input->>'email')),trim(coalesce(p_input->>'phone','')),trim(coalesce(p_input->>'organization','')),trim(p_input->>'message'),nullif(p_input->>'checkIn','')::date,nullif(p_input->>'checkOut','')::date,nullif(p_input->>'groupSize','')::integer,coalesce(p_input->>'locale','en'),p_request_key,fingerprint) returning * into e;
 payload:=jsonb_build_object('name',e.contact_name,'email',e.email,'phone',e.phone,'checkIn',coalesce(e.check_in::text,''),'checkOut',coalesce(e.check_out::text,''),'guests',coalesce(e.group_size,0),'locale',e.locale,'reference',e.reference,'preference',e.organization,'notes',e.message,'bookingType',e.kind,'package',null,'units','[]'::jsonb,'templateAdditions',ops_private.email_additions(e.locale),'contactEmail',(select contact_email from public.settings where id));
 insert into public.email_outbox(enquiry_id,event,version,payload) values(e.id,'enquiry_received',1,payload),(e.id,'enquiry_alert',1,payload);
 insert into public.operation_notifications(enquiry_id,event) values(e.id,'enquiry_received');
 return e.id;
end $$;

create or replace function public.save_workspace_record(p_entity text,p_id uuid,p_version integer,p_data jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare cols text[];k text;names text:='';vals text:='';sets text:='';result uuid;role text:=public.staff_role();
begin
 if role is null then raise exception 'Not authorized' using errcode='42501';end if;
 if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>24000 then raise exception 'Invalid form' using errcode='22023';end if;
 cols:=case p_entity
 when 'guest_profiles' then array['full_name','email','phone','notes','archived']
 when 'enquiries' then array['kind','contact_name','email','phone','organization','message','notes','stage','check_in','check_out','group_size','booking_id','offer_cents','currency','follow_up','locale','archived']
 when 'work_items' then array['kind','title','notes','status','room_id','booking_id','enquiry_id','assigned_to','due_date','priority','archived']
 when 'property_room_details' then array['description_en','description_fr','amenities','is_published']
 when 'room_readiness' then array['status','room_notes']
 when 'season_rates' then array['unit_id','label','starts_on','ends_on','nightly_cents','currency','archived']
 when 'package_activities' then array['package_id','title','description','duration_minutes','sort_order','archived']
 when 'package_photos' then array['package_id','image_url','alt_text','caption','focal_position','mobile_focal_position','sort_order','archived'] else null end;
 if cols is null or p_version<0 or p_version is null then raise exception 'Invalid entity or version' using errcode='22023';end if;
 if p_entity='room_readiness' and role in ('housekeeping','reception') then cols:=array['status','room_notes'];end if;
 if p_entity='work_items' and role='housekeeping' and p_version>0 then cols:=array['status','notes'];end if;
 for k in select jsonb_object_keys(p_data) loop
  if not(k=any(cols)) then raise exception 'Unsupported field' using errcode='22023';end if;
  names:=names||format(',%I',k);vals:=vals||format(',(jsonb_populate_record(null::public.%I,$1)).%I',p_entity,k);
  sets:=sets||format('%I=(jsonb_populate_record(null::public.%I,$1)).%I,',k,p_entity,k);
 end loop;
 if names='' then raise exception 'No fields supplied' using errcode='22023';end if;
 if p_version=0 then
  execute format('insert into public.%I(id%s) values($2%s) returning id',p_entity,names,vals) using p_data,coalesce(p_id,gen_random_uuid()) into result;
 else
  execute format('update public.%I set %s version=version+1 where id=$2 and version=$3 returning id',p_entity,sets) using p_data,p_id,p_version into result;
 end if;
 if result is null then raise exception 'Record changed or access refused' using errcode='PT409';end if;
 return result;
end $$;


commit;
