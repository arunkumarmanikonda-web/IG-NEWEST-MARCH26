-- Retain early delivery events and preserve request bodies across provider retries.
alter table ig_private.provider_events add column provider_id text, add column event_type text, add column processed_at timestamptz;
create index ig_provider_events_pending on ig_private.provider_events(provider,provider_id) where processed_at is null;
alter table public.ig_outbox add column next_attempt_at timestamptz;
create table ig_private.delivery_payloads(id uuid primary key references public.ig_outbox(id) on delete cascade,payload jsonb not null);
alter table ig_private.delivery_payloads enable row level security;
revoke all on ig_private.delivery_payloads from public,anon,authenticated;
create function ig_private.apply_delivery_events(pid text) returns void language plpgsql security definer set search_path='' as $$
declare j public.ig_outbox; bad text;
begin
 select * into j from public.ig_outbox where provider_id=pid for update;
 if j.id is null then return;end if;
 select event_type into bad from ig_private.provider_events where provider='resend' and provider_id=pid and event_type in ('email.bounced','email.complained','email.suppressed') order by created_at desc limit 1;
 if bad is not null then
  insert into ig_private.email_suppressions(email,reason) values(lower(j.recipient),bad) on conflict(email) do update set reason=excluded.reason;
  update public.ig_outbox set status='suppressed' where id=j.id;
 elsif exists(select 1 from ig_private.provider_events where provider='resend' and provider_id=pid and event_type='email.delivered') then
  update public.ig_outbox set status='delivered' where id=j.id and status<>'suppressed';
 end if;
 update ig_private.provider_events set processed_at=now() where provider='resend' and provider_id=pid and processed_at is null;
end $$;
revoke all on function ig_private.apply_delivery_events(text) from public,anon,authenticated;
create or replace function ig_private.delivery(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;j public.ig_outbox;ev text=p->>'event';pid text=p->>'provider_id';
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 if p->>'action'='claim' then
  if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then return '[]';end if;
  with pending as (
   select o.id from public.ig_outbox o where o.status in ('awaiting_provider','queued','failed') and o.attempts<5
    and (o.first_attempt_at is null or o.first_attempt_at>now()-interval '23 hours')
    and (o.next_attempt_at is null or o.next_attempt_at<=now()) and (o.lease_until is null or o.lease_until<now())
    and (nullif(p->>'enquiry_id','') is null or o.enquiry_id=(p->>'enquiry_id')::uuid)
    and not exists(select 1 from ig_private.email_suppressions where email=lower(o.recipient)) and o.recipient not like '%.invalid'
    order by o.created_at limit 4 for update skip locked
  ),claimed as (
   update public.ig_outbox o set status='queued',lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()) from pending where o.id=pending.id returning o.*
  ) select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('enquiry',to_jsonb(e))),'[]') into result from claimed c join public.ig_enquiries e on e.id=c.enquiry_id;
  return result;
 elsif p->>'action' in ('prepare','finish') then
  -- Serialise binding and delivery events for this provider ID, even before a row is bound.
  if pid is not null then perform pg_advisory_xact_lock(hashtextextended('ig-resend:'||pid,0));end if;
  select * into j from public.ig_outbox where id=(p->>'id')::uuid and lease_token=(p->>'lease_token')::uuid and lease_until>now() for update;
  if j.id is null then raise exception 'Delivery lease expired';end if;
  if p->>'action'='prepare' then
   if jsonb_typeof(p->'payload') is distinct from 'object' or length((p->'payload')::text)>50000 or p->'payload'->'to' is distinct from jsonb_build_array(j.recipient) then raise exception 'Invalid message';end if;
   insert into ig_private.delivery_payloads(id,payload) values(j.id,p->'payload') on conflict(id) do nothing;
   select payload into result from ig_private.delivery_payloads where id=j.id;return result;
  end if;
  update public.ig_outbox set status=case when nullif(pid,'') is not null then 'accepted' else 'failed' end,
   provider_id=nullif(pid,''),last_error=left(p->>'error',200),lease_until=null,lease_token=null,
   next_attempt_at=case when nullif(pid,'') is null then now()+make_interval(secs=>least(3600,60*power(2,attempts-1))::int) else null end where id=j.id;
  if nullif(pid,'') is not null then perform ig_private.apply_delivery_events(pid);end if;
  return '{"ok":true}';
 elsif p->>'action'='event' then
  if length(coalesce(p->>'event_id','')) not between 1 and 200 or length(coalesce(pid,'')) not between 1 and 200 or length(coalesce(ev,'')) not between 1 and 100 then raise exception 'Invalid provider event';end if;
  perform pg_advisory_xact_lock(hashtextextended('ig-resend:'||pid,0));
  insert into ig_private.provider_events(provider,event_id,provider_id,event_type) values('resend',p->>'event_id',pid,ev) on conflict do nothing;
  if not found then return '{"duplicate":true}';end if;
  perform ig_private.apply_delivery_events(pid);
  return '{"ok":true}';
 else raise exception 'Unknown delivery action';end if;
end $$;
-- A public webhook receiver forwards only allowlisted paths to the protected app.
-- Bypass credentials stay inside Vault, never in provider URLs or application output.
create table ig_private.webhook_relay(id boolean primary key default true check(id),origin text not null,enabled boolean not null default false);
alter table ig_private.webhook_relay enable row level security;
revoke all on ig_private.webhook_relay from public,anon,authenticated;
create function public.ig_webhook_relay_config() returns jsonb language plpgsql security definer set search_path='' as $$
declare c ig_private.webhook_relay;bypass text;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 select * into c from ig_private.webhook_relay where id and enabled;
 select decrypted_secret into bypass from vault.decrypted_secrets where name='ig_webhook_vercel_bypass';
 if c.origin is null or bypass is null then raise exception 'Relay is unavailable';end if;
 return jsonb_build_object('origin',c.origin,'bypass',bypass);
end $$;
revoke all on function public.ig_webhook_relay_config() from public,anon,authenticated;
grant execute on function public.ig_webhook_relay_config() to service_role;
