begin;
-- Extend the existing catalogue; no booking/allocation/confirmation command is replaced.
alter table public.packages add column publication_status text not null default 'draft' check(publication_status in ('draft','published','archived')),
 add column catalogue jsonb not null default '{}'::jsonb,
 add column version integer not null default 1 check(version>0);
alter table public.packages alter column is_active set default false;
-- Existing starter content must not become a published real offer.
update public.packages set is_active=false;
alter table public.bookings add column package_variant text,
 add column package_selection jsonb not null default '{}'::jsonb;

create function ops_private.validate_package_catalogue() returns trigger language plpgsql set search_path='' as $$
declare c jsonb:=new.catalogue; v jsonb; s jsonb; t jsonb; k text; key_name text;
begin
 if jsonb_typeof(c)<>'object' or octet_length(c::text)>40000 then raise exception 'Invalid package catalogue' using errcode='22023';end if;
 if current_setting('role')='authenticated' then
  if new.publication_status='published' or (TG_OP='UPDATE' and old.publication_status='published') or coalesce((c->>'arrangementsVerified')::boolean,false) then
   if public.staff_role() is distinct from 'owner' then raise exception 'Only the MFA Owner can approve, publish or edit a published offer' using errcode='42501';end if;
  elsif coalesce(public.staff_role(),'') not in ('owner','content_editor') then raise exception 'Content access required' using errcode='42501';end if;
 end if;
 if c<>'{}'::jsonb then
  if (c->>'nights')::integer not between 1 and 365 or c->>'currency' not in ('EUR','GBP','USD','MAD') or c->>'pricingBasis' not in ('person','booking') then raise exception 'Invalid duration or pricing basis' using errcode='22023';end if;
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
 if new.publication_status='published' then
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
revoke all on function ops_private.validate_package_catalogue() from public,anon,authenticated,service_role;
create trigger package_catalogue_guard before insert or update on public.packages for each row execute function ops_private.validate_package_catalogue();

-- Request data may specify option IDs only. Prices/names are captured from locked server data.
create function ops_private.capture_package_request() returns trigger language plpgsql security definer set search_path='' as $$
declare p public.packages; c jsonb; v jsonb; e jsonb; season jsonb; ids jsonb; selected jsonb:='[]'; base bigint; total bigint; price bigint; level text;
begin
 if TG_OP='UPDATE' then
  if new.package_selection is distinct from old.package_selection or new.package_variant is distinct from old.package_variant or new.package_id is distinct from old.package_id then raise exception 'Package request snapshots are immutable' using errcode='42501';end if;
  return new;
 end if;
 -- The insert_request function sets transaction-local input; the public cannot supply a snapshot.
 new.package_selection:='{}';new.package_variant:=null;
 if new.package_id is null then return new;end if;
 if new.booking_type<>'surf_package' then raise exception 'Package selections require the surf-package request type' using errcode='22023';end if;
 select * into p from public.packages where id=new.package_id for share;
 if not found or not p.is_active or p.publication_status<>'published' then raise exception 'Choose a published package' using errcode='22023';end if;
 c:=p.catalogue;
 new.package_variant:=nullif(current_setting('tifawave.package_variant',true),'');
 select x into v from jsonb_array_elements(c->'variants') x where x->>'id'=new.package_variant;
 if v is null or (new.preferred_listing_id is not null and new.preferred_listing_id<>(v->>'roomId')::uuid) then raise exception 'Choose a valid package room variant' using errcode='22023';end if;
 if not exists(select 1 from public.rooms where id=(v->>'roomId')::uuid and is_active) then raise exception 'Room option is no longer offered' using errcode='22023';end if;
 if new.check_out-new.check_in<>(c->>'nights')::integer then raise exception 'Dates must match the package duration' using errcode='22023';end if;
 level:=new.surf_level;
 if not c->'levels' ? level then raise exception 'Choose an offered surf level' using errcode='22023';end if;
 ids:=coalesce(nullif(current_setting('tifawave.package_extras',true),'')::jsonb,'[]');
 if jsonb_typeof(ids)<>'array' or jsonb_array_length(ids)>15 or (select count(*)<>count(distinct x) from jsonb_array_elements_text(ids) x) then raise exception 'Invalid extra selections' using errcode='22023';end if;
 select x into season from jsonb_array_elements(c->'seasons') x where (x->>'variantId'='' or x->>'variantId'=v->>'id') and new.check_in>=(x->>'start')::date and new.check_in<(x->>'end')::date;
 base:=case when season is not null then (season->>'priceCents')::bigint else (v->>'priceCents')::bigint end;
 total:=base*case when c->>'pricingBasis'='person' then new.guests else 1 end;
 for e in select x from jsonb_array_elements(c->'extras') x where ids ? (x->>'id') loop
  price:=(e->>'priceCents')::bigint;
  total:=total+price*case when e->>'basis'='person' then new.guests else 1 end;
  selected:=selected||jsonb_build_array(jsonb_build_object('id',e->>'id','label',case when new.locale='fr' then e->>'labelFr' else e->>'label' end,'priceCents',price,'basis',e->>'basis'));
 end loop;
 if jsonb_array_length(selected)<>jsonb_array_length(ids) then raise exception 'Choose offered extras only' using errcode='22023';end if;
 new.preferred_listing_id:=(v->>'roomId')::uuid;
 select case when r.slug like '%dorm%' then 'dorm' when r.slug like '%twin%' then 'twin' when r.slug like '%triple%' then 'triple' when r.slug like '%family%' then 'family' else 'double' end into new.preferred_kind from public.rooms r where id=new.preferred_listing_id;
 new.package_selection:=jsonb_build_object('id',p.id,'catalogueVersion',p.version,'name',case when new.locale='fr' then c->>'nameFr' else p.name end,'variantId',v->>'id','variantLabel',case when new.locale='fr' then v->>'labelFr' else v->>'label' end,'roomId',v->>'roomId','nights',c->'nights','surfLevel',level,'extras',selected,'currency',c->>'currency','basis',c->>'pricingBasis','basePriceCents',base,'totalCents',total,'season',season->>'label','seasonId',season->>'id','pricingRule','arrival date; whole package','inclusions',case when new.locale='fr' then c->'inclusionsFr' else to_jsonb(p.inclusions) end,'exclusions',case when new.locale='fr' then c->'exclusionsFr' else c->'exclusions' end);
 return new;
end $$;
revoke all on function ops_private.capture_package_request() from public,anon,authenticated,service_role;
create trigger package_request_snapshot before insert or update on public.bookings for each row execute function ops_private.capture_package_request();

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

create or replace function ops_private.email_snapshot(b public.bookings) returns jsonb
language sql stable set search_path=''
as $$ select jsonb_build_object(
 'name',b.guest_name,'email',b.guest_email,'phone',b.guest_phone,
 'checkIn',b.check_in,'checkOut',b.check_out,'guests',b.guests,
 'locale',b.locale,'reference',coalesce(b.reference,b.id::text),
 'preference',b.room_preference,'notes',b.notes,'bookingType',b.booking_type,
 'package', coalesce(b.package_selection->>'name',(select name from public.packages where id=b.package_id)),
 'packageSelection',b.package_selection,
 'units',(select coalesce(jsonb_agg(u.code order by u.code),'[]'::jsonb)
  from public.reservation_allocations a join public.inventory_units u on u.id=a.unit_id
  where a.booking_id=b.id and a.active)) || jsonb_build_object('templateAdditions',ops_private.email_additions(b.locale),'contactEmail',(select contact_email from public.settings where id)) $$;

insert into public.packages(slug,name,short_description,full_description,inclusions,duration,display_order,publication_status,is_active,catalogue) select 'surf-stay-week','Surf & Stay Week','Draft stay specification; Owner verification required before publication.','Draft only. Activities, providers, equipment, transport, levels and prices require verification before publication.',array['Breakfast with accommodation'],'7 nights',10,'draft',false,'{"nameFr": "Semaine Surf & Stay", "shortFr": "Projet de s\u00e9jour \u00e0 v\u00e9rifier avec le propri\u00e9taire avant publication.", "descriptionFr": "Brouillon uniquement. Les activit\u00e9s, les prestataires, les \u00e9quipements, le transport et les tarifs doivent \u00eatre v\u00e9rifi\u00e9s avant publication.", "nights": 7, "levels": [], "inclusionsFr": ["Petit-d\u00e9jeuner avec h\u00e9bergement"], "exclusions": ["Additional meals are not included."], "exclusionsFr": ["Les repas suppl\u00e9mentaires ne sont pas inclus."], "proposed": ["Accommodation for 7 nights", "5 coached surf days", "Surf equipment", "Surf transport"], "proposedFr": ["H\u00e9bergement pour 7 nuits", "5 journ\u00e9es de surf encadr\u00e9es", "\u00c9quipement de surf", "Transport surf"], "currency": "EUR", "pricingBasis": "person", "featured": true, "arrangementsVerified": false, "variants": [], "extras": [], "seasons": []}'::jsonb || jsonb_build_object('variants',(select coalesce(jsonb_agg(jsonb_build_object('id',r.slug,'roomId',r.id,'label',r.name,'labelFr',case r.slug when '4-bed-dorm-room' then 'Lit individuel en dortoir' when 'twin-room' then 'Chambre twin' when 'private-double-room-balcony' then 'Chambre double avec balcon' when 'private-double-room' then 'Chambre double standard' when 'triple-room' then 'Chambre triple' when 'family-room-4p' then 'Suite familiale' else '' end,'priceCents',null) order by r.slug),'[]'::jsonb) from public.rooms r where r.is_active and r.slug in ('4-bed-dorm-room','private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p'))) on conflict(slug) do nothing;
insert into public.packages(slug,name,short_description,full_description,inclusions,duration,display_order,publication_status,is_active,catalogue) select 'short-surf-escape','Short Surf Escape','Draft stay specification; Owner verification required before publication.','Draft only. Activities, providers, equipment, transport, levels and prices require verification before publication.',array['Breakfast with accommodation'],'3 nights',20,'draft',false,'{"nameFr": "Escapade surf", "shortFr": "Projet de s\u00e9jour \u00e0 v\u00e9rifier avec le propri\u00e9taire avant publication.", "descriptionFr": "Brouillon uniquement. Les activit\u00e9s, les prestataires, les \u00e9quipements, le transport et les tarifs doivent \u00eatre v\u00e9rifi\u00e9s avant publication.", "nights": 3, "levels": [], "inclusionsFr": ["Petit-d\u00e9jeuner avec h\u00e9bergement"], "exclusions": ["Additional meals are not included."], "exclusionsFr": ["Les repas suppl\u00e9mentaires ne sont pas inclus."], "proposed": ["Accommodation for 3 nights", "2 surf lessons", "Surf equipment", "Surf transport"], "proposedFr": ["H\u00e9bergement pour 3 nuits", "2 cours de surf", "\u00c9quipement de surf", "Transport surf"], "currency": "EUR", "pricingBasis": "person", "featured": true, "arrangementsVerified": false, "variants": [], "extras": [], "seasons": []}'::jsonb || jsonb_build_object('variants',(select coalesce(jsonb_agg(jsonb_build_object('id',r.slug,'roomId',r.id,'label',r.name,'labelFr',case r.slug when '4-bed-dorm-room' then 'Lit individuel en dortoir' when 'twin-room' then 'Chambre twin' when 'private-double-room-balcony' then 'Chambre double avec balcon' when 'private-double-room' then 'Chambre double standard' when 'triple-room' then 'Chambre triple' when 'family-room-4p' then 'Suite familiale' else '' end,'priceCents',null) order by r.slug),'[]'::jsonb) from public.rooms r where r.is_active and r.slug in ('4-bed-dorm-room','private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p'))) on conflict(slug) do nothing;
insert into public.packages(slug,name,short_description,full_description,inclusions,duration,display_order,publication_status,is_active,catalogue) select 'surf-yoga-retreat','Surf & Yoga Retreat','Draft stay specification; Owner verification required before publication.','Draft only. Activities, providers, equipment, transport, levels and prices require verification before publication.',array['Breakfast with accommodation'],'7 nights',30,'draft',false,'{"nameFr": "Retraite surf et yoga", "shortFr": "Projet de s\u00e9jour \u00e0 v\u00e9rifier avec le propri\u00e9taire avant publication.", "descriptionFr": "Brouillon uniquement. Les activit\u00e9s, les prestataires, les \u00e9quipements, le transport et les tarifs doivent \u00eatre v\u00e9rifi\u00e9s avant publication.", "nights": 7, "levels": [], "inclusionsFr": ["Petit-d\u00e9jeuner avec h\u00e9bergement"], "exclusions": ["Additional meals are not included."], "exclusionsFr": ["Les repas suppl\u00e9mentaires ne sont pas inclus."], "proposed": ["Accommodation for 7 nights", "5 surf lessons", "3 yoga sessions"], "proposedFr": ["H\u00e9bergement pour 7 nuits", "5 cours de surf", "3 s\u00e9ances de yoga"], "currency": "EUR", "pricingBasis": "person", "featured": true, "arrangementsVerified": false, "variants": [], "extras": [], "seasons": []}'::jsonb || jsonb_build_object('variants',(select coalesce(jsonb_agg(jsonb_build_object('id',r.slug,'roomId',r.id,'label',r.name,'labelFr',case r.slug when '4-bed-dorm-room' then 'Lit individuel en dortoir' when 'twin-room' then 'Chambre twin' when 'private-double-room-balcony' then 'Chambre double avec balcon' when 'private-double-room' then 'Chambre double standard' when 'triple-room' then 'Chambre triple' when 'family-room-4p' then 'Suite familiale' else '' end,'priceCents',null) order by r.slug),'[]'::jsonb) from public.rooms r where r.is_active and r.slug in ('4-bed-dorm-room','private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p'))) on conflict(slug) do nothing;
insert into public.packages(slug,name,short_description,full_description,inclusions,duration,display_order,publication_status,is_active,catalogue) select 'surf-guiding-week','Surf Guiding Week','Draft stay specification; Owner verification required before publication.','Draft only. Activities, providers, equipment, transport, levels and prices require verification before publication.',array['Breakfast with accommodation'],'7 nights',40,'draft',false,'{"nameFr": "Semaine de surf guid\u00e9", "shortFr": "Projet de s\u00e9jour \u00e0 v\u00e9rifier avec le propri\u00e9taire avant publication.", "descriptionFr": "Brouillon uniquement. Les activit\u00e9s, les prestataires, les \u00e9quipements, le transport et les tarifs doivent \u00eatre v\u00e9rifi\u00e9s avant publication.", "nights": 7, "levels": [], "inclusionsFr": ["Petit-d\u00e9jeuner avec h\u00e9bergement"], "exclusions": ["Additional meals are not included."], "exclusionsFr": ["Les repas suppl\u00e9mentaires ne sont pas inclus."], "proposed": ["Accommodation for 7 nights", "5 guided surf days"], "proposedFr": ["H\u00e9bergement pour 7 nuits", "5 journ\u00e9es de surf guid\u00e9"], "currency": "EUR", "pricingBasis": "person", "featured": false, "arrangementsVerified": false, "variants": [], "extras": [], "seasons": []}'::jsonb || jsonb_build_object('variants',(select coalesce(jsonb_agg(jsonb_build_object('id',r.slug,'roomId',r.id,'label',r.name,'labelFr',case r.slug when '4-bed-dorm-room' then 'Lit individuel en dortoir' when 'twin-room' then 'Chambre twin' when 'private-double-room-balcony' then 'Chambre double avec balcon' when 'private-double-room' then 'Chambre double standard' when 'triple-room' then 'Chambre triple' when 'family-room-4p' then 'Suite familiale' else '' end,'priceCents',null) order by r.slug),'[]'::jsonb) from public.rooms r where r.is_active and r.slug in ('4-bed-dorm-room','private-double-room','private-double-room-balcony','twin-room','triple-room','family-room-4p'))) on conflict(slug) do nothing;

commit;
