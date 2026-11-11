alter table ig_private.integration_config drop constraint integration_config_id_check;
alter table ig_private.integration_config add constraint integration_config_id_check check(id in ('business','resend','razorpay','fast2sms','openai','runway'));
insert into ig_private.integration_config(id,mode,settings) values('runway','disabled','{"image_model":"gen4_image","video_model":"gen4.5","daily_request_limit":10,"daily_credit_limit":120,"video_enabled":false}');
create table public.ig_provider_jobs(
 id uuid primary key default gen_random_uuid(),request_id uuid not null,actor_id uuid not null references auth.users(id),
 practice text not null,provider text not null check(provider in ('runway','fast2sms')),kind text not null check(kind in ('image','video','sms')),
 input jsonb not null check(length(input::text)<=5000),config_version int not null,
 status text not null default 'queued' check(status in ('queued','submitting','pending','ready','accepted','failed','unknown','cancelled','blocked')),
 provider_id text,estimated_credits int not null default 0,asset_key text,mime text,published boolean not null default false,
 note text,lease_token uuid,lease_until timestamptz,next_check_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(actor_id,request_id)
);
create index ig_provider_actor on public.ig_provider_jobs(actor_id,created_at desc);
create index ig_provider_queue on public.ig_provider_jobs(status,next_check_at);
create table ig_private.provider_assets(job_id uuid primary key references public.ig_provider_jobs(id) on delete cascade,source_url text);
alter table public.ig_provider_jobs enable row level security;
alter table ig_private.provider_assets enable row level security;
revoke all on public.ig_provider_jobs from public,anon,authenticated;
revoke all on ig_private.provider_assets from public,anon,authenticated;
grant select on public.ig_provider_jobs to authenticated;
create function ig_private.provider_allowed(j public.ig_provider_jobs) returns boolean language sql stable security definer set search_path='' as $$
 select case when j.provider='fast2sms' then ig_private.allowed('settings.manage') else ig_private.allowed('content.write') and ig_private.scope_allowed(j.practice,'write') and (j.actor_id=auth.uid() or ig_private.allowed('settings.manage')) end
$$;
revoke all on function ig_private.provider_allowed(public.ig_provider_jobs) from public,anon;
grant execute on function ig_private.provider_allowed(public.ig_provider_jobs) to authenticated;
create policy provider_staff_read on public.ig_provider_jobs for select to authenticated using(ig_private.provider_allowed(ig_provider_jobs));
create function ig_private.provider_prepare(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c ig_private.integration_config;j public.ig_provider_jobs;cost int=0;cap int;day_start timestamptz;v jsonb;
begin
 if p->>'provider'='fast2sms' then
  if not ig_private.allowed('settings.manage') then raise exception 'Super-user and MFA required for SMS' using errcode='42501';end if;
 elsif p->>'provider'='runway' then
  if not ig_private.allowed('content.write') or not ig_private.scope_allowed(p->>'practice','write') then raise exception 'Practice content rights and MFA required' using errcode='42501';end if;
 else raise exception 'Unsupported provider';end if;
 select * into c from ig_private.integration_config where id=p->>'provider';
 if c.mode<>'enabled' then raise exception 'Provider is disabled';end if;
 if c.version is distinct from (p->>'config_version')::int then raise exception 'Configuration changed; reload before submitting';end if;
 v=p->'input';
 if jsonb_typeof(v) is distinct from 'object' or length(v::text)>5000 then raise exception 'Invalid provider input';end if;
 if c.id='runway' then
  if p->>'kind' not in ('image','video') or v->>'public_approved' is distinct from 'true' or length(coalesce(v->>'prompt','')) not between 20 and 900 or v->>'ratio' not in ('1280:720','720:1280','720:720') then raise exception 'Approved public creative brief required';end if;
  cost=5;
  if p->>'kind'='video' then
   if c.settings->>'video_enabled' is distinct from 'true' or (v->>'duration')::int not between 2 and 10 or v->>'ratio'='720:720' then raise exception 'Invalid or disabled video generation';end if;
   cost=12*(v->>'duration')::int;
  end if;
 else
  if p->>'kind'<>'sms' or c.settings->>'dlt_approved' is distinct from 'true' or coalesce(c.settings->>'message_id','')!~'^\d{1,20}$' or v->>'service_confirmed' is distinct from 'true' or coalesce(v->>'phone','')!~'^[6-9]\d{9}$' or length(coalesce(v->>'consent_reference','')) not between 12 and 300 or jsonb_typeof(v->'variables') is distinct from 'array' then raise exception 'Approved DLT service message and recipient permission required';end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-provider-'||c.id,0));
 select * into j from public.ig_provider_jobs where actor_id=auth.uid() and request_id=(p->>'request_id')::uuid;
 if j.id is not null then
  if j.input<>v or j.provider<>c.id or j.practice<>p->>'practice' or j.kind<>p->>'kind' then raise exception 'Request reference already used for different input';end if;
  return jsonb_build_object('id',j.id,'status',j.status);
 end if;
 day_start=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
 cap=least(100,greatest(1,coalesce((c.settings->>'daily_request_limit')::int,10)));
 if (select count(*) from public.ig_provider_jobs where provider=c.id and created_at>=day_start)>=cap then raise exception 'Daily provider request limit reached';end if;
 if c.id='runway' and (select coalesce(sum(estimated_credits),0) from public.ig_provider_jobs where provider=c.id and created_at>=day_start)+cost>least(1200,greatest(5,coalesce((c.settings->>'daily_credit_limit')::int,120))) then raise exception 'Daily creative credit budget reached';end if;
 if exists(select 1 from public.ig_provider_jobs where actor_id=auth.uid() and provider=c.id and created_at>now()-interval '30 seconds') then raise exception 'Wait 30 seconds before another provider request';end if;
 if c.id='fast2sms' and exists(select 1 from public.ig_provider_jobs where provider=c.id and input->>'phone'=v->>'phone' and created_at>now()-interval '5 minutes' and status not in ('cancelled','blocked')) then raise exception 'A message for this recipient was recently submitted';end if;
 insert into public.ig_provider_jobs(request_id,actor_id,practice,provider,kind,input,config_version,estimated_credits) values((p->>'request_id')::uuid,auth.uid(),p->>'practice',c.id,p->>'kind',v,c.version,cost) returning * into j;
 perform ig_private.record_audit('provider.queued',j.id::text,jsonb_build_object('provider',j.provider,'kind',j.kind));
 return jsonb_build_object('id',j.id,'status',j.status);
end $$;
create function public.ig_provider_prepare(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.provider_prepare(p)$$;
create function ig_private.provider_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.ig_provider_jobs;
begin
 select * into j from public.ig_provider_jobs where id=(p->>'id')::uuid for update;
 if j.id is null or not ig_private.provider_allowed(j) then raise exception 'Practice access and MFA required' using errcode='42501';end if;
 if p->>'action'='cancel' and j.status='queued' then update public.ig_provider_jobs set status='cancelled',updated_at=now() where id=j.id;
 elsif p->>'action'='publish' then
  if j.kind<>'image' or j.status<>'ready' or p->>'reviewed' is distinct from 'true' or not ig_private.allowed('content.publish') or not ig_private.scope_allowed(j.practice,'publish') then raise exception 'Review a completed image with practice publication rights' using errcode='42501';end if;
  update public.ig_provider_jobs set published=true,updated_at=now() where id=j.id;
 elsif p->>'action'='withdraw' then
  if not ig_private.allowed('content.publish') or not ig_private.scope_allowed(j.practice,'publish') then raise exception 'Publication rights required' using errcode='42501';end if;
  update public.ig_provider_jobs set published=false,updated_at=now() where id=j.id;
 else raise exception 'This operation is unavailable for the current job';end if;
 perform ig_private.record_audit('provider.'||(p->>'action'),j.id::text);return '{"ok":true}';
end $$;
create function public.ig_provider_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.provider_manage(p)$$;
create function ig_private.provider_worker(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.ig_provider_jobs;result jsonb;
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 if p->>'action'='claim' then
  update public.ig_provider_jobs set status='unknown',note='Submission interrupted. Check provider before any new request.',lease_token=null,lease_until=null,updated_at=now() where status='submitting' and lease_until<now();
  update public.ig_provider_jobs j set status='blocked',note='Provider disabled or configuration changed. Nothing was submitted.',updated_at=now() where status='queued' and not exists(select 1 from ig_private.integration_config c where c.id=j.provider and c.mode='enabled' and c.version=j.config_version);
  select * into j from public.ig_provider_jobs where status in ('queued','pending') and (lease_until is null or lease_until<now()) and (next_check_at is null or next_check_at<=now()) order by created_at for update skip locked limit 1;
  if j.id is null then return null;end if;
  update public.ig_provider_jobs set status=case when status='queued' then 'submitting' else status end,lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',next_check_at=now()+interval '1 minute',updated_at=now() where id=j.id returning * into j;
  return to_jsonb(j);
 end if;
 select * into j from public.ig_provider_jobs where id=(p->>'id')::uuid for update;
 if j.id is null then raise exception 'Job unavailable';end if;
 if p->>'action'='asset' then
  if p->>'public'='true' and (not j.published or j.status<>'ready' or j.kind<>'image') then return null;end if;
  return jsonb_build_object('id',j.id,'status',j.status,'kind',j.kind,'asset_key',j.asset_key,'mime',j.mime,'source_url',(select source_url from ig_private.provider_assets where job_id=j.id));
 end if;
 if p->>'action'='stored' then
  if j.status<>'pending' or not exists(select 1 from ig_private.provider_assets where job_id=j.id and source_url is not null) then raise exception 'Media is not awaiting storage';end if;
  if p->>'asset_key' not in (j.id::text||'.png',j.id::text||'.jpg',j.id::text||'.webp',j.id::text||'.mp4') or p->>'mime' not in ('image/png','image/jpeg','image/webp','video/mp4') then raise exception 'Invalid stored media';end if;
  update public.ig_provider_jobs set status='ready',asset_key=p->>'asset_key',mime=p->>'mime',note=null,lease_until=null,lease_token=null,updated_at=now() where id=j.id;
  update ig_private.provider_assets set source_url=null where job_id=j.id;
  perform ig_private.record_audit('provider.media_stored',j.id::text);return '{"ok":true}';
 end if;
 if p->>'action'<>'finish' or j.lease_token is distinct from (p->>'lease_token')::uuid or j.status not in ('submitting','pending') then raise exception 'Job lease changed';end if;
 if p->>'status' not in ('pending','accepted','failed','unknown') then raise exception 'Invalid provider transition';end if;
 if j.status='submitting' and p->>'status'='pending' and (j.provider<>'runway' or coalesce(p->>'provider_id','')!~'^[0-9a-f-]{36}$') then raise exception 'Runway task acknowledgement required';end if;
 if p->>'status'='accepted' and (j.provider<>'fast2sms' or coalesce(p->>'provider_id','')!~'^[a-zA-Z0-9_-]{1,150}$') then raise exception 'SMS acknowledgement required';end if;
 if p->>'source_url' is not null then
  if j.provider<>'runway' or p->>'status'<>'pending' or length(p->>'source_url')>6000 or p->>'source_url'!~'^https://' then raise exception 'Invalid provider media';end if;
  insert into ig_private.provider_assets(job_id,source_url) values(j.id,p->>'source_url') on conflict(job_id) do update set source_url=excluded.source_url;
 end if;
 update public.ig_provider_jobs set status=p->>'status',provider_id=coalesce(provider_id,p->>'provider_id'),note=left(p->>'note',300),lease_until=null,lease_token=null,updated_at=now() where id=j.id;
 return '{"ok":true}';
end $$;
create function public.ig_provider_worker(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.provider_worker(secret,p)$$;
revoke all on function ig_private.provider_prepare(jsonb),public.ig_provider_prepare(jsonb),ig_private.provider_manage(jsonb),public.ig_provider_manage(jsonb) from public,anon;
grant execute on function ig_private.provider_prepare(jsonb),public.ig_provider_prepare(jsonb),ig_private.provider_manage(jsonb),public.ig_provider_manage(jsonb) to authenticated;
revoke all on function ig_private.provider_worker(text,jsonb),public.ig_provider_worker(text,jsonb) from public;
grant execute on function ig_private.provider_worker(text,jsonb),public.ig_provider_worker(text,jsonb) to anon,authenticated;
-- Include the existing signed recovery worker when durable provider jobs are due.
do $$declare f text;begin
 select pg_get_functiondef('ig_private.run_email_worker()'::regprocedure) into f;
 f=replace(f,'if not exists(select 1 from ig_private.integration_config where id=''resend'' and mode=''enabled'') then return null;end if;','');
 f=replace(f,'then return null;end if;','and not exists(select 1 from public.ig_provider_jobs where status in (''queued'',''pending'',''submitting'') and (lease_until is null or lease_until<now()) and (next_check_at is null or next_check_at<=now())) then return null;end if;');
 execute f;
end $$;
-- Generated imagery remains an explicitly labelled, reviewed public asset.
alter function ig_private.save_content(jsonb) rename to save_content_before_generated_media;
revoke all on function ig_private.save_content_before_generated_media(jsonb) from public,anon,authenticated;
create function ig_private.save_content(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare path text=p->'public_data'->>'image';jid uuid;
begin
 if path like '/images/generated/%' then
  if path!~'^/images/generated/[0-9a-f-]{36}\.(png|jpg|webp)$' or coalesce(p->'public_data'->>'image_alt','') not ilike 'Illustrative AI-generated concept%' then raise exception 'Label generated imagery as an illustrative AI-generated concept';end if;
  jid=split_part(split_part(path,'/',4),'.',1)::uuid;
  if not exists(select 1 from public.ig_provider_jobs where id=jid and status='ready' and kind='image' and published and asset_key=split_part(path,'/',4) and ig_private.scope_allowed(practice,'write')) then raise exception 'Use a reviewed and released creative from your assigned practice';end if;
 end if;
 return ig_private.save_content_before_generated_media(p);
end $$;
revoke all on function ig_private.save_content(jsonb) from public,anon;
grant execute on function ig_private.save_content(jsonb) to authenticated;
