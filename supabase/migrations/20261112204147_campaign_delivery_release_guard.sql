-- Installation is separate from permission to send marketing.
-- A later delivery release must explicitly enable this database switch.
alter table ig_private.webhook_relay add column campaign_delivery_enabled boolean not null default false;

create function ig_private.campaign_delivery_enabled() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from ig_private.webhook_relay where id and enabled and campaign_delivery_enabled)
 and exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled')
$$;
revoke all on function ig_private.campaign_delivery_enabled() from public,anon,authenticated;

-- Preserve authorization checks, then refuse activation and payload release while disabled.
do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.campaign_manage(jsonb)'::regprocedure) into s;
 if position($find$elsif a in('activate','pause','resume') then$find$ in s)=0 then raise exception 'Unexpected campaign manager';end if;
 s=replace(s,$find$elsif a in('activate','pause','resume') then$find$,$replace$elsif a in('activate','pause','resume') then
  if a in('activate','resume') and not ig_private.campaign_delivery_enabled() then raise exception 'Campaign sending is disabled' using errcode='42501';end if;$replace$);
 execute s;
 select pg_get_functiondef('ig_private.campaign_runtime(text,jsonb)'::regprocedure) into s;
 if position($find$if a='event' then$find$ in s)=0 then raise exception 'Unexpected campaign runtime';end if;
 s=replace(s,$find$if a='event' then$find$,$replace$if a in('claim','prepare') and not ig_private.campaign_delivery_enabled() then
  if a='claim' then return '[]'::jsonb;else return null;end if;
 end if;
 if a='event' then$replace$);
 execute s;
end $migration$;

-- Explicit definition restores the origin guard even when older migrations were applied later.
create or replace function ig_private.run_email_worker() returns bigint
language plpgsql security definer set search_path='' as $$
declare worker text;stamp text;signature text;request_id bigint;worker_origin text;campaigns_enabled boolean;
begin
 select supabase_origin,campaign_delivery_enabled into worker_origin,campaigns_enabled from ig_private.webhook_relay where id and enabled;
 if worker_origin is null then return null;end if;
 if not exists(select 1 from public.ig_outbox o
  where exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled')
  and o.status in ('awaiting_provider','queued','failed') and o.attempts<5
  and (o.first_attempt_at is null or o.first_attempt_at>now()-interval '23 hours')
  and (o.next_attempt_at is null or o.next_attempt_at<=now()) and (o.lease_until is null or o.lease_until<now()))
 and not exists(select 1 from public.ig_provider_jobs j
  join ig_private.integration_config c on c.id=j.provider and c.mode='enabled'
  where j.status in ('queued','pending','submitting')
  and (j.lease_until is null or j.lease_until<now()) and (j.next_check_at is null or j.next_check_at<=now()))
 and not exists(select 1 from ig_private.campaign_deliveries d
  join public.ig_campaigns c on c.id=d.campaign_id
  where campaigns_enabled and exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled')
  and c.status='active' and d.status in ('queued','sending') and d.attempts<5
  and d.next_attempt<=now() and (d.lease_until is null or d.lease_until<now())) then return null;end if;
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
