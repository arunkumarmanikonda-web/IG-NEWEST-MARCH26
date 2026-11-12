create table public.ig_campaigns(id uuid primary key default gen_random_uuid(),title text not null,practice text not null,subject text not null,body text not null,status text not null default 'draft' check(status in('draft','active','paused','completed')),version integer not null default 1,created_by uuid not null references auth.users(id),approved_by uuid references auth.users(id),approved_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index campaigns_creator on public.ig_campaigns(created_by);create index campaigns_approver on public.ig_campaigns(approved_by);
create table ig_private.campaign_deliveries(id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.ig_campaigns(id),user_id uuid not null references auth.users(id),recipient text not null,status text not null default 'queued' check(status in('queued','sending','sent','delivered','suppressed','failed')),attempts integer not null default 0,lease_token uuid,lease_until timestamptz,next_attempt timestamptz not null default now(),first_attempt timestamptz,sent_at timestamptz,provider_id text unique,payload jsonb,created_at timestamptz not null default now(),unique(campaign_id,user_id));
create index campaign_user_history on ig_private.campaign_deliveries(user_id,sent_at desc);
create index campaign_work on ig_private.campaign_deliveries(status,next_attempt);
create table ig_private.campaign_events(id text primary key,provider_id text not null,event_type text not null,created_at timestamptz not null default now());create index campaign_event_provider on ig_private.campaign_events(provider_id);
alter table public.ig_campaigns enable row level security;alter table ig_private.campaign_deliveries enable row level security;alter table ig_private.campaign_events enable row level security;
revoke all on public.ig_campaigns,ig_private.campaign_deliveries,ig_private.campaign_events from public,anon,authenticated;
grant select on public.ig_campaigns to authenticated;
create function ig_private.campaign_allowed(practice text) returns boolean language sql stable security definer set search_path='' as $$select ig_private.allowed('admin.read') and exists(select 1 from public.ig_profiles where id=auth.uid() and roles && array['owner','administrator','marketing_manager']) and ig_private.scope_allowed(practice,'write')$$;
revoke all on function ig_private.campaign_allowed(text) from public,anon;grant execute on function ig_private.campaign_allowed(text) to authenticated;
create policy campaign_staff_read on public.ig_campaigns for select to authenticated using(ig_private.campaign_allowed(practice));
create function ig_private.campaign_eligible(uid uuid,practice text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join public.ig_profiles p on p.id=u.id cross join lateral(select granted,practices from public.ig_consents where user_id=u.id and purpose='email_marketing' order by id desc limit 1)c where u.id=uid and u.email_confirmed_at is not null and u.deleted_at is null and p.status='active' and c.granted and practice=any(c.practices) and not exists(select 1 from ig_private.email_suppressions s where s.email=lower(u.email)))
$$;
revoke all on function ig_private.campaign_eligible(uuid,text) from public,anon,authenticated;
create function ig_private.campaign_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action';c public.ig_campaigns;n integer;begin
 if a='save' and nullif(p->>'id','') is null then
  if not ig_private.campaign_allowed(p->>'practice') then raise exception 'Marketing practice permission required' using errcode='42501';end if;
  if (select count(*) from public.ig_campaigns where created_by=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'Daily draft limit reached';end if;
 else select * into c from public.ig_campaigns where id=(p->>'id')::uuid for update;if c.id is null or not ig_private.campaign_allowed(c.practice) then raise exception 'Campaign access denied' using errcode='42501';end if;
 end if;
 if a='preview' then
  select count(*) into n from auth.users u where ig_private.campaign_eligible(u.id,c.practice);
  return jsonb_build_object('eligible',n,'version',c.version,'limit',500,'frequency','At most two campaigns per seven days, with 24 hours between messages');
 elsif a='stats' then return coalesce((select jsonb_object_agg(status,n) from(select status,count(*) n from ig_private.campaign_deliveries where campaign_id=c.id group by status)t),'{}');
 elsif a='save' then
  if length(coalesce(p->>'title','')) not between 2 and 180 or length(coalesce(p->>'subject','')) not between 2 and 180 or (p->>'subject')~E'[\r\n]' or length(coalesce(p->>'body','')) not between 20 and 12000 then raise exception 'Provide a title, one-line subject and a message of 20–12,000 characters';end if;
  if p->>'practice' not in('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca') then raise exception 'Select a practice';end if;
  if c.id is null then insert into public.ig_campaigns(title,practice,subject,body,created_by) values(p->>'title',p->>'practice',p->>'subject',p->>'body',auth.uid()) returning * into c;
  elsif c.status<>'draft' or c.version is distinct from (p->>'version')::integer then raise exception 'Only the current unpublished draft can be edited' using errcode='40001';
  else update public.ig_campaigns set title=p->>'title',subject=p->>'subject',body=p->>'body',version=version+1,updated_at=now() where id=c.id returning * into c;end if;
 elsif a in('activate','pause','resume') then
  if not exists(select 1 from public.ig_profiles where id=auth.uid() and 'owner'=any(roles)) then raise exception 'Owner approval required to release campaigns' using errcode='42501';end if;
  if c.version is distinct from (p->>'version')::integer then raise exception 'Campaign changed; review again' using errcode='40001';end if;
  if a='activate' then
   if c.status<>'draft' or (p->>'reviewed')::boolean is distinct from true then raise exception 'Review the exact campaign before activation';end if;
   select count(*) into n from auth.users u where ig_private.campaign_eligible(u.id,c.practice);
   if n=0 or n>500 or n is distinct from (p->>'audience_count')::integer then raise exception 'Audience changed or is outside 1–500 recipients. Preview it again.';end if;
   insert into ig_private.campaign_deliveries(campaign_id,user_id,recipient) select c.id,u.id,lower(u.email) from auth.users u where ig_private.campaign_eligible(u.id,c.practice);
   update public.ig_campaigns set status='active',approved_by=auth.uid(),approved_at=now(),version=version+1,updated_at=now() where id=c.id returning * into c;
  elsif a='pause' and c.status='active' then update public.ig_campaigns set status='paused',version=version+1,updated_at=now() where id=c.id returning * into c;
  elsif a='resume' and c.status='paused' then update public.ig_campaigns set status='active',version=version+1,updated_at=now() where id=c.id returning * into c;
  else raise exception 'Invalid campaign transition';end if;
 else raise exception 'Unknown campaign operation';end if;
 perform ig_private.record_audit('campaign.'||a,c.id::text,jsonb_build_object('version',c.version));return to_jsonb(c);
end $$;
create function public.ig_campaign_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.campaign_manage(p)$$;
revoke all on function ig_private.campaign_manage(jsonb),public.ig_campaign_manage(jsonb) from public,anon;grant execute on function ig_private.campaign_manage(jsonb),public.ig_campaign_manage(jsonb) to authenticated;
create function ig_private.campaign_apply(pid text) returns void language plpgsql security definer set search_path='' as $$
declare j ig_private.campaign_deliveries;bad text;begin
 select * into j from ig_private.campaign_deliveries where provider_id=pid for update;if j.id is null then return;end if;
 select event_type into bad from ig_private.campaign_events where provider_id=pid and event_type in('email.bounced','email.complained','email.suppressed') limit 1;
 if bad is not null then insert into ig_private.email_suppressions(email,reason) values(j.recipient,bad) on conflict(email) do update set reason=excluded.reason;update ig_private.campaign_deliveries set status='suppressed' where id=j.id;
 elsif exists(select 1 from ig_private.campaign_events where provider_id=pid and event_type='email.delivered') then update ig_private.campaign_deliveries set status='delivered' where id=j.id and status<>'suppressed';
 elsif exists(select 1 from ig_private.campaign_events where provider_id=pid and event_type='email.failed') then update ig_private.campaign_deliveries set status='failed' where id=j.id and status not in('delivered','suppressed');end if;
end $$;revoke all on function ig_private.campaign_apply(text) from public,anon,authenticated;
create function ig_private.campaign_runtime(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action';j ig_private.campaign_deliveries;c public.ig_campaigns;result jsonb='[]';lease uuid;begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 if a='event' then
  if p->>'event' not in('email.delivered','email.bounced','email.complained','email.suppressed','email.failed') then return '{"ok":true}';end if;
  if length(coalesce(p->>'event_id','')) not between 1 and 200 or length(coalesce(p->>'provider_id','')) not between 1 and 100 then raise exception 'Invalid provider event';end if;
  insert into ig_private.campaign_events(id,provider_id,event_type) values(p->>'event_id',p->>'provider_id',p->>'event') on conflict(id) do nothing;perform ig_private.campaign_apply(p->>'provider_id');return '{"ok":true}';
 elsif a='unsubscribe' then
  select * into j from ig_private.campaign_deliveries where id=(p->>'id')::uuid;if j.id is null then return '{"ok":true}';end if;
  insert into public.ig_consents(user_id,purpose,granted,version,practices,policy_hash) select j.user_id,'email_marketing',false,version,'{}',sha256 from public.ig_policy_releases where current;
  update ig_private.campaign_deliveries set status='suppressed',lease_token=null where user_id=j.user_id and status in('queued','sending');return '{"ok":true}';
 elsif a='claim' then
  perform pg_advisory_xact_lock(7193342);
  update ig_private.campaign_deliveries set status='failed',lease_token=null where status in('queued','sending') and first_attempt<now()-interval '23 hours';
  for j in select d.* from ig_private.campaign_deliveries d join public.ig_campaigns camp on camp.id=d.campaign_id where camp.status='active' and d.attempts<5 and d.next_attempt<=now() and (d.status='queued' or (d.status='sending' and d.lease_until<now())) order by d.created_at limit 4 for update of d skip locked loop
   select * into c from public.ig_campaigns where id=j.campaign_id;
   if not ig_private.campaign_eligible(j.user_id,c.practice) or lower((select email from auth.users where id=j.user_id)) is distinct from j.recipient then update ig_private.campaign_deliveries set status='suppressed' where id=j.id;continue;end if;
   if (select count(*) from ig_private.campaign_deliveries where user_id=j.user_id and id<>j.id and ((sent_at>now()-interval '7 days') or (status='sending' and lease_until>now())))>=2 or exists(select 1 from ig_private.campaign_deliveries where user_id=j.user_id and id<>j.id and (sent_at>now()-interval '24 hours' or (status='sending' and lease_until>now()))) then update ig_private.campaign_deliveries set next_attempt=now()+interval '24 hours' where id=j.id;continue;end if;
   lease=gen_random_uuid();update ig_private.campaign_deliveries set status='sending',lease_token=lease,lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt=coalesce(first_attempt,now()) where id=j.id;
   result=result||jsonb_build_array(jsonb_build_object('id',j.id,'lease_token',lease,'recipient',j.recipient,'subject',c.subject,'body',c.body));
  end loop;return result;
 end if;
 select * into j from ig_private.campaign_deliveries where id=(p->>'id')::uuid for update;
 if j.id is null or j.lease_token is distinct from (p->>'lease_token')::uuid or j.status<>'sending' or j.lease_until<now() then raise exception 'Delivery lease expired';end if;
 select * into c from public.ig_campaigns where id=j.campaign_id;
 if a='prepare' then
  if c.status<>'active' or not ig_private.campaign_eligible(j.user_id,c.practice) then update ig_private.campaign_deliveries set status='suppressed',lease_token=null where id=j.id;return null;end if;
  if j.payload is null then update ig_private.campaign_deliveries set payload=p->'payload' where id=j.id returning * into j;end if;return j.payload;
 elsif a='finish' then
  if nullif(p->>'provider_id','') is not null then update ig_private.campaign_deliveries set status='sent',provider_id=p->>'provider_id',sent_at=now(),lease_token=null where id=j.id;perform ig_private.campaign_apply(p->>'provider_id');
  else update ig_private.campaign_deliveries set status=case when attempts>=5 then 'failed' else 'queued' end,next_attempt=now()+make_interval(mins=>greatest(2,attempts*attempts)),lease_token=null where id=j.id;end if;
  if not exists(select 1 from ig_private.campaign_deliveries where campaign_id=c.id and status in('queued','sending')) then update public.ig_campaigns set status='completed',version=version+1,updated_at=now() where id=c.id and status='active';end if;
  return '{"ok":true}';
 end if;raise exception 'Unknown campaign runtime operation';
end $$;
create function public.ig_campaign_runtime(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.campaign_runtime(secret,p)$$;
revoke all on function ig_private.campaign_runtime(text,jsonb),public.ig_campaign_runtime(text,jsonb) from public;grant execute on function ig_private.campaign_runtime(text,jsonb),public.ig_campaign_runtime(text,jsonb) to anon,authenticated;
