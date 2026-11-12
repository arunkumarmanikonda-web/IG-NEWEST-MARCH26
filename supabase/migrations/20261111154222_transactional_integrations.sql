alter table public.ig_outbox add column provider_id text,add column lease_token uuid,add column lease_until timestamptz,add column first_attempt_at timestamptz,add column last_error text;
create unique index ig_outbox_provider_id on public.ig_outbox(provider_id) where provider_id is not null;
create table ig_private.provider_events(provider text not null,event_id text not null,created_at timestamptz not null default now(),primary key(provider,event_id));
create table ig_private.email_suppressions(email text primary key,reason text not null,created_at timestamptz not null default now());
alter table ig_private.provider_events enable row level security;
alter table ig_private.email_suppressions enable row level security;
revoke all on ig_private.provider_events,ig_private.email_suppressions from public,anon,authenticated;
create function ig_private.delivery(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;j public.ig_outbox; ev text=p->>'event';
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 if p->>'action'='claim' then
  if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then return '[]';end if;
  with pending as (select o.id from public.ig_outbox o where o.status in ('awaiting_provider','queued','failed') and o.attempts<5 and (o.first_attempt_at is null or o.first_attempt_at>now()-interval '23 hours') and (o.lease_until is null or o.lease_until<now()) and (nullif(p->>'enquiry_id','') is null or o.enquiry_id=(p->>'enquiry_id')::uuid) and not exists(select 1 from ig_private.email_suppressions where email=o.recipient) and o.recipient not like '%.invalid' order by o.created_at limit 20 for update skip locked),claimed as (update public.ig_outbox o set status='queued',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()) from pending where o.id=pending.id returning o.*)
  select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('enquiry',to_jsonb(e))),'[]') into result from claimed c join public.ig_enquiries e on e.id=c.enquiry_id;
  return result;
 elsif p->>'action'='finish' then
  select * into j from public.ig_outbox where id=(p->>'id')::uuid and lease_token=(p->>'lease_token')::uuid for update;
  if j.id is null then raise exception 'Delivery lease expired';end if;
  update public.ig_outbox set status=case when p->>'provider_id' is not null then 'accepted' else 'failed' end,provider_id=nullif(p->>'provider_id',''),last_error=left(p->>'error',200),lease_until=null,lease_token=null where id=j.id;
  return '{"ok":true}';
 elsif p->>'action'='event' then
  insert into ig_private.provider_events(provider,event_id) values('resend',p->>'event_id') on conflict do nothing;
  if not found then return '{"duplicate":true}';end if;
  select * into j from public.ig_outbox where provider_id=p->>'provider_id' for update;
  if j.id is null then return '{"unmatched":true}';end if;
  if ev in ('email.bounced','email.complained') then
   insert into ig_private.email_suppressions(email,reason) values(j.recipient,ev) on conflict(email) do update set reason=excluded.reason;
   update public.ig_outbox set status='suppressed' where id=j.id;
  elsif ev='email.delivered' then update public.ig_outbox set status='delivered' where id=j.id and status<>'suppressed';end if;
  return '{"ok":true}';
 else raise exception 'Unknown delivery action';end if;
end $$;
create function public.ig_delivery(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.delivery(secret,p)$$;
revoke all on function ig_private.delivery(text,jsonb),public.ig_delivery(text,jsonb) from public;
grant execute on function ig_private.delivery(text,jsonb),public.ig_delivery(text,jsonb) to anon,authenticated;
do $$declare s text;begin
 select pg_get_functiondef('ig_private.submit_enquiry(text,jsonb)'::regprocedure) into s;
 s=replace(s,$find$foreach recipient in array array['akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com'] loop$find$,$find$for recipient in select jsonb_array_elements_text(settings->'internal_recipients') from ig_private.integration_config where id='resend' loop$find$);
 s=replace(s,'request_id,payload_hash) values','request_id,payload_hash,privacy_version) values');
 s=replace(s,$find$::uuid,fingerprint) returning$find$,$find$::uuid,fingerprint,ig_private.current_policy()) returning$find$);execute s;
end $$;
