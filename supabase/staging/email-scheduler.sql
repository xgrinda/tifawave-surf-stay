-- STAGING ONLY. Apply through the authenticated management connection to
-- cjtrnnpqwkorxwqhtjeq. The orchestrator replaces __STAGING_ANON_JWT__ with this
-- project's public legacy anon JWT. No private key is embedded in source.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$
declare token text;
begin
 select decrypted_secret into token from vault.decrypted_secrets where name='tifawave_email_scheduler_token';
 if token is null then
  token:=encode(extensions.gen_random_bytes(32),'hex');
  perform vault.create_secret(token,'tifawave_email_scheduler_token','Staging-only email worker authentication');
 end if;
 insert into ops_private.email_scheduler_config(singleton,project_ref,token_hash,enabled)
 values(true,'cjtrnnpqwkorxwqhtjeq',sha256(convert_to(token,'UTF8')),false)
 on conflict(singleton) do update set project_ref=excluded.project_ref,token_hash=excluded.token_hash;
end $$;
create or replace function ops_private.invoke_email_scheduler() returns bigint
language plpgsql security definer set search_path=''
as $$ declare token text;
begin
 if not exists(select 1 from ops_private.email_scheduler_config where singleton and enabled
  and project_ref='cjtrnnpqwkorxwqhtjeq') then return null; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='tifawave_email_scheduler_token';
 if token is null then raise exception 'Email scheduler credential missing'; end if;
 return net.http_post(
  url:='https://cjtrnnpqwkorxwqhtjeq.supabase.co/functions/v1/email-outbox',
  headers:=jsonb_build_object('Content-Type','application/json',
   'Authorization','Bearer __STAGING_ANON_JWT__','x-worker-token',token),
  body:='{}'::jsonb,timeout_milliseconds:=90000);
end $$;
revoke all on function ops_private.invoke_email_scheduler() from public,anon,authenticated,service_role;
-- Exactly one independently running schedule; keep disabled until acceptance
-- fixtures are ready and the worker configuration has been verified.
select cron.schedule('tifawave-email-outbox','* * * * *','select ops_private.invoke_email_scheduler();');
