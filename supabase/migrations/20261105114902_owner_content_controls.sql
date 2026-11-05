-- Additive CMS editor controls. Retains content, revisions, RLS and booking logic.
create or replace function ops_private.validate_document(p_doc jsonb,p_kind text,p_publish boolean) returns void
language plpgsql security definer set search_path='' as $$ declare k text;v jsonb;asset text;item jsonb;field text;prefix text:=regexp_replace(coalesce(auth.jwt()->>'iss',''),'/auth/v1/?$','')||'/storage/v1/object/public/tifawave-media/';
begin
 if jsonb_typeof(p_doc)<>'object' or octet_length(p_doc::text)>65536 then raise exception 'Invalid document' using errcode='22023';end if;
 for k,v in select * from jsonb_each(p_doc) loop
  if not(k=any(array['title','summary','body','seoTitle','seoDescription','heroImage','heroMobileImage','heroFocal','heroMobileFocal','heroAlt','heroVideo','ctaLabel','ctaPath','sections','faqs','homeMedia','roomOrder','branding'])) then raise exception 'Unsupported content field' using errcode='22023';end if;
  if k not in ('sections','faqs','homeMedia','roomOrder','branding') and (jsonb_typeof(v)<>'string' or length(v#>>'{}')>12000) then raise exception 'Invalid content value' using errcode='22023';end if;
  if k in ('heroImage','heroMobileImage','heroVideo') then
   asset:=v#>>'{}';
   if asset<>'' and not ((k='heroVideo' and asset like prefix||'%') or (k<>'heroVideo' and ops_private.allowed_image(asset)) or asset ~ '^/(images|media)/[A-Za-z0-9_./-]+$') then raise exception 'Use property media from the media library' using errcode='22023';end if;
  end if;
  if k in ('heroFocal','heroMobileFocal') and (v#>>'{}') not in ('top','center','bottom') then raise exception 'Choose a focal point' using errcode='22023';end if;
  if k='ctaPath' and (v#>>'{}')<>'' and (v#>>'{}') !~ '^/[a-z][a-z0-9/-]*$' then raise exception 'Use a local website path' using errcode='22023';end if;
  if k='homeMedia' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>21 then raise exception 'Invalid homepage photographs' using errcode='22023';end if;
   if (select count(*) from jsonb_array_elements(v))<>(select count(distinct a->>'slot') from jsonb_array_elements(v) a) then raise exception 'Duplicate photograph position' using errcode='22023';end if;
   for item in select * from jsonb_array_elements(v) loop
    if jsonb_typeof(item)<>'object' or coalesce(item->>'slot','') not in ('experiences','rooms','room-dorm','room-double','room-twin','room-triple','room-family','surf','excursions','yoga','breakfast','meals','rooftop','packages','day','day-morning','day-ocean','day-rest','day-evening','groups','location') then raise exception 'Unknown photograph position' using errcode='22023';end if;
    for field in select jsonb_object_keys(item) loop
     if field not in ('slot','imageUrl','mobileImage','alt','focal','mobileFocal') or jsonb_typeof(item->field)<>'string' then raise exception 'Invalid photograph field' using errcode='22023';end if;
    end loop;
    if not(item ? 'imageUrl') or length(coalesce(item->>'alt',''))>300 or coalesce(item->>'focal','center') not in ('top','center','bottom') or coalesce(item->>'mobileFocal','center') not in ('top','center','bottom') then raise exception 'Check photograph and crop fields' using errcode='22023';end if;
    foreach field in array array['imageUrl','mobileImage'] loop
     asset:=coalesce(item->>field,'');if asset<>'' and not ops_private.allowed_image(asset) then raise exception 'Choose approved property media' using errcode='22023';end if;
    end loop;
   end loop;
  end if;
  if k='roomOrder' then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>5 or exists(select 1 from jsonb_array_elements_text(v) x where x not in ('room-dorm','room-double','room-twin','room-triple','room-family')) or (select count(*) from jsonb_array_elements(v))<>(select count(distinct a) from jsonb_array_elements(v) a) then raise exception 'Invalid room highlight order' using errcode='22023';end if;
  end if;
  if k='branding' then
   if jsonb_typeof(v)<>'object' then raise exception 'Invalid branding' using errcode='22023';end if;
   for field,item in select * from jsonb_each(v) loop
    if field not in ('logo','headerLogo','footerLogo','favicon','appleIcon','socialImage','titleEn','titleFr','descriptionEn','descriptionFr') or jsonb_typeof(item)<>'string' then raise exception 'Invalid branding field' using errcode='22023';end if;
    asset:=item#>>'{}';
    if field in ('logo','headerLogo','footerLogo','favicon','appleIcon','socialImage') then
     if asset<>'' and not(asset like prefix||'%' and ops_private.allowed_image(asset)) then raise exception 'Choose genuine artwork from this property media library' using errcode='22023';end if;
    elsif length(asset)>(case when field in ('titleEn','titleFr') then 180 else 320 end) then raise exception 'Search text too long' using errcode='22023';end if;
   end loop;
  end if;
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

create or replace function public.save_content_document(p_id uuid,p_version integer,p_kind text,p_slug text,p_locale text,p_draft jsonb,p_action text) returns uuid
language plpgsql security definer set search_path='' as $$ declare d public.content_documents;who uuid;
begin
 who:=ops_private.require_role(case when p_kind='email' or (p_kind='page' and p_slug='branding') then array['owner'] else array['owner','content_editor'] end);
 if p_action not in ('draft','publish','unpublish') or p_kind not in ('page','room','package','email') then raise exception 'Invalid publication action' using errcode='22023';end if;
 if p_kind='page' and p_slug not in ('home','about','faq','stay','packages','groups','partners','collaborate','policies','contact','branding') then raise exception 'Unknown page' using errcode='22023';end if;
 if p_kind='room' and not exists(select 1 from public.rooms where slug=p_slug) then raise exception 'Room listing not found' using errcode='23514';end if;
 if p_kind='package' and not exists(select 1 from public.packages where slug=p_slug) then raise exception 'Package not found' using errcode='23514';end if;
 if p_kind='email' and p_slug not in ('received','owner-alert','confirmed','declined','changed','cancelled','enquiry-received','enquiry-alert') then raise exception 'Unknown email template' using errcode='22023';end if;
 if p_draft ? 'branding' and (p_kind<>'page' or p_slug<>'branding' or p_locale<>'en') then raise exception 'Branding belongs in Owner settings' using errcode='22023';end if;
 if p_slug='branding' and (p_kind<>'page' or p_locale<>'en') then raise exception 'Use the shared bilingual branding document' using errcode='22023';end if;
 if (jsonb_array_length(coalesce(p_draft->'homeMedia','[]'))>0 or jsonb_array_length(coalesce(p_draft->'roomOrder','[]'))>0) and (p_kind<>'page' or p_slug<>'home') then raise exception 'Homepage photographs belong in the homepage editor' using errcode='22023';end if;
 perform ops_private.validate_document(p_draft,p_kind,p_action='publish');
 if p_version=0 then
  insert into public.content_documents(id,kind,slug,locale,draft) values(coalesce(p_id,gen_random_uuid()),p_kind,p_slug,p_locale,p_draft) returning * into d;
 else
  select * into d from public.content_documents where id=p_id for update;
  if not found or d.version<>p_version then raise exception 'Content changed; reload before saving' using errcode='PT409';end if;
  if d.kind<>p_kind or d.slug<>p_slug or d.locale<>p_locale then raise exception 'Document identity cannot change' using errcode='23514';end if;
  update public.content_documents set draft=p_draft,version=version+1,updated_at=now() where id=d.id returning * into d;
 end if;
 if p_action='publish' then update public.content_documents set published=d.draft,published_version=d.version,published_at=now() where id=d.id;
 elsif p_action='unpublish' then update public.content_documents set published=null,published_version=null,published_at=null where id=d.id;end if;
 insert into public.content_revisions(document_id,version,action,payload,actor_id) values(d.id,d.version,p_action,d.draft,who);
 return d.id;
end $$;
create or replace function public.restore_content_revision(p_revision uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$ declare r public.content_revisions;d public.content_documents;who uuid;
begin
 select * into r from public.content_revisions where id=p_revision;
 if not found then raise exception 'Revision not found' using errcode='P0002';end if;
 select * into d from public.content_documents where id=r.document_id for update;
 who:=ops_private.require_role(case when d.kind='email' or (d.kind='page' and d.slug='branding') then array['owner'] else array['owner','content_editor'] end);
 if d.version<>p_version then raise exception 'Content changed' using errcode='PT409';end if;
 update public.content_documents set draft=r.payload,version=version+1,updated_at=now() where id=d.id returning * into d;
 insert into public.content_revisions(document_id,version,action,payload,actor_id) values(d.id,d.version,'restore',d.draft,who);
end $$;
