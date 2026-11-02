-- Local disposable tests only. This is NOT a Supabase migration.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),status text);
create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
 $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create schema storage;
create table storage.buckets(
 id text primary key,name text,public boolean,file_size_limit bigint,
 allowed_mime_types text[],created_at timestamptz default now(),updated_at timestamptz default now()
);
create table storage.objects(id uuid,name text,bucket_id text);
alter table storage.objects enable row level security;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
grant select on auth.users to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
-- Mimic Supabase's default public table grants. Migrations must narrow them.
alter default privileges in schema public grant all on tables to anon,authenticated;
-- Hosted Supabase grants API-role function execution explicitly, not only PUBLIC.
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
grant all on storage.objects,storage.buckets to service_role;
grant all on storage.objects to authenticated;
