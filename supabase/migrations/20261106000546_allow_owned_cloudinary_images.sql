-- Add one Owner-owned Cloudinary image delivery account. No data updates,
-- booking changes, grants to public APIs, or changes to existing RLS policies.
create function ops_private.allowed_cloudinary_image(url text) returns boolean
language plpgsql immutable strict set search_path='' as $$
declare path text; parts text[]; part text; token text;
begin
 if length(url)>2048 or url not like 'https://res.cloudinary.com/dytykwtc/image/upload/%' then return false;end if;
 path:=substr(url,length('https://res.cloudinary.com/dytykwtc/image/upload/')+1);
 if path='' or path !~ '^[A-Za-z0-9_.,:/-]+$' or strpos(path,'..')>0 then return false;end if;
 parts:=string_to_array(path,'/');
 while cardinality(parts)>1 and parts[1] ~ '^(?:f|q|w|h|c|g|dpr|ar|t|l|u|fl|d|e|o|r|a|x|y|z|if|fn|pg)_' loop
  foreach token in array string_to_array(parts[1],',') loop
   if token !~ '^(?:f_(?:auto|avif|webp|jpg|jpeg|png|gif)|q_(?:auto(?::(?:best|good|eco|low))?|[1-9][0-9]?|100)|[wh]_[1-9][0-9]{0,4}|c_(?:fill|fit|limit|scale|pad|thumb|crop)|g_(?:auto|center|north|south|east|west|face|faces)|dpr_(?:auto|1|1\.5|2|3)|ar_[1-9][0-9]?:[1-9][0-9]?)$' then return false;end if;
  end loop;
  parts:=parts[2:cardinality(parts)];
 end loop;
 if parts[1] ~ '^v[0-9]+$' and cardinality(parts)>1 then parts:=parts[2:cardinality(parts)];end if;
 foreach part in array parts loop
  if part ~ '^(?:f|q|w|h|c|g|dpr|ar|t|l|u|fl|d|e|o|r|a|x|y|z|if|fn|pg)_' or part !~* '^[A-Za-z0-9_-]+(?:\.(?:jpg|jpeg|png|webp|avif|gif))?$' then return false;end if;
 end loop;
 return true;
end $$;
revoke all on function ops_private.allowed_cloudinary_image(text) from public,anon,authenticated,service_role;

create or replace function ops_private.allowed_image(url text) returns boolean
language sql stable set search_path='' as $$
 select length(url)<=2048 and (
  ops_private.allowed_cloudinary_image(url)
  or url ~ '^https://(images[.]unsplash[.]com|images[.]pexels[.]com)/[^#[:space:]]*$'
  or (url like regexp_replace(coalesce(auth.jwt()->>'iss',''),'/auth/v1/?$','')||'/storage/v1/object/public/tifawave-media/%' and url !~ '[#[:space:]]')
 )
$$;
revoke all on function ops_private.allowed_image(text) from public,anon,authenticated,service_role;

-- Preserve the existing complete validator and change only the branding source
-- predicate. Abort rather than replacing an unexpected function definition.
do $$ declare definition text;needle text:='asset like prefix||''%'' and ops_private.allowed_image(asset)';begin
 definition:=pg_get_functiondef('ops_private.validate_document(jsonb,text,boolean)'::regprocedure);
 if strpos(definition,needle)=0 then raise exception 'Unexpected CMS validator; review before applying';end if;
 execute replace(definition,needle,'(asset like prefix||''%'' or ops_private.allowed_cloudinary_image(asset)) and ops_private.allowed_image(asset)');
end $$;

-- Direct staff Data API writes must obey the same allowlist. Validate new or
-- changed URLs only; retain all existing historical images and metadata edits.
create function ops_private.check_image_delivery() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if TG_OP='UPDATE' and new.image_url is not distinct from old.image_url then return new;end if;
 if not coalesce(ops_private.allowed_image(new.image_url),false) then
  raise exception 'Use an HTTPS image from approved property media or Cloudinary account dytykwtc' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function ops_private.check_image_delivery() from public,anon,authenticated,service_role;
create trigger approved_image_delivery before insert or update of image_url on public.room_images for each row execute function ops_private.check_image_delivery();
create trigger approved_image_delivery before insert or update of image_url on public.gallery_images for each row execute function ops_private.check_image_delivery();
create trigger approved_image_delivery before insert or update of image_url on public.package_photos for each row execute function ops_private.check_image_delivery();
