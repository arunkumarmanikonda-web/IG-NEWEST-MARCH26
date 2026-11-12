-- Each environment must explicitly select its own Supabase worker origin.
-- A missing or disabled relay never sends scheduled work to another project.
-- Recovery covers transactional email and explicitly requested provider jobs only.
-- Marketing campaign scheduling requires a separate approved release.
alter table ig_private.webhook_relay add column if not exists supabase_origin text
 check (supabase_origin ~ '^https://[a-z0-9]{20}\.supabase\.co$');

create or replace function ig_private.run_email_worker() returns bigint
language plpgsql security definer set search_path='' as $$
declare worker text;stamp text;signature text;request_id bigint;worker_origin text;
begin
 select supabase_origin into worker_origin from ig_private.webhook_relay where id and enabled;
 if worker_origin is null then return null;end if;
 if not exists(select 1 from public.ig_outbox o
  where exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled')
  and o.status in ('awaiting_provider','queued','failed') and o.attempts<5
  and (o.first_attempt_at is null or o.first_attempt_at>now()-interval '23 hours')
  and (o.next_attempt_at is null or o.next_attempt_at<=now()) and (o.lease_until is null or o.lease_until<now()))
 and not exists(select 1 from public.ig_provider_jobs j
  join ig_private.integration_config c on c.id=j.provider and c.mode='enabled'
  where j.status in ('queued','pending','submitting')
  and (j.lease_until is null or j.lease_until<now()) and (j.next_check_at is null or j.next_check_at<=now())) then return null;end if;
 select decrypted_secret into worker from vault.decrypted_secrets where name='ig_email_worker';
 if worker is null then raise exception 'Worker is not configured';end if;
 stamp=floor(extract(epoch from now()))::text;
 signature=encode(extensions.hmac(convert_to('ig-email-worker-v1.'||stamp||'.{}','UTF8'),convert_to(worker,'UTF8'),'sha256'),'hex');
 select net.http_post(
  url:=worker_origin||'/functions/v1/ig-provider-webhook/worker',
  headers:=jsonb_build_object('Content-Type','application/json','x-ig-timestamp',stamp,'x-ig-signature',signature),
  body:='{}'::jsonb,timeout_milliseconds:=120000
 ) into request_id;
 return request_id;
end $$;
revoke all on function ig_private.run_email_worker() from public,anon,authenticated;
