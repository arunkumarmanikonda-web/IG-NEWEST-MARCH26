create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create or replace function public.ig_webhook_relay_config() returns jsonb language plpgsql security definer set search_path='' as $$
declare c ig_private.webhook_relay;bypass text;worker text;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 select * into c from ig_private.webhook_relay where id and enabled;
 select decrypted_secret into bypass from vault.decrypted_secrets where name='ig_webhook_vercel_bypass';
 select decrypted_secret into worker from vault.decrypted_secrets where name='ig_email_worker';
 if c.origin is null or bypass is null or worker is null then raise exception 'Relay is unavailable';end if;
 return jsonb_build_object('origin',c.origin,'bypass',bypass,'worker',worker);
end $$;
create function ig_private.run_email_worker() returns bigint language plpgsql security definer set search_path='' as $$
declare worker text;stamp text;signature text;request_id bigint;
begin
 if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then return null;end if;
 if not exists(select 1 from public.ig_outbox where status in ('awaiting_provider','queued','failed') and attempts<5 and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') and (next_attempt_at is null or next_attempt_at<=now()) and (lease_until is null or lease_until<now())) then return null;end if;
 select decrypted_secret into worker from vault.decrypted_secrets where name='ig_email_worker';
 if worker is null then raise exception 'Worker is not configured';end if;
 stamp=floor(extract(epoch from now()))::text;
 signature=encode(extensions.hmac(convert_to('ig-email-worker-v1.'||stamp||'.{}','UTF8'),convert_to(worker,'UTF8'),'sha256'),'hex');
 -- pg_net's queue contains only a short-lived action signature, never permanent credentials.
 select net.http_post(
  url:='https://wktdgczjdocsnfgvcsat.supabase.co/functions/v1/ig-provider-webhook/worker',
  headers:=jsonb_build_object('Content-Type','application/json','x-ig-timestamp',stamp,'x-ig-signature',signature),
  body:='{}'::jsonb,timeout_milliseconds:=120000
 ) into request_id;
 return request_id;
end $$;
revoke all on function ig_private.run_email_worker() from public,anon,authenticated;
select cron.schedule('ig-email-recovery','*/2 * * * *','select ig_private.run_email_worker()');
