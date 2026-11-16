-- Guest details are separate from public content and never enter the model's context.
create table ig_private.gullu_guests (
 session_id uuid primary key, name text not null, email text not null, mobile text not null,
 consent_version text not null default 'gullu-2', created_at timestamptz not null default now()
);
alter table ig_private.gullu_guests enable row level security;
revoke all on ig_private.gullu_guests from public,anon,authenticated;
create index ig_gullu_session_time on ig_private.gullu_turns(session_id,created_at,turn_id);

create function public.ig_gullu_guest(secret text,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid=(p->>'session_id')::uuid; guest ig_private.gullu_guests; t ig_private.gullu_turns; ack jsonb;
begin
 if ig_private.integration_server(secret) is not true then raise exception 'Server required' using errcode='42501'; end if;
 if p->>'action'='start' then
  if p->'consent' is distinct from 'true'::jsonb or coalesce(length(trim(p->>'name')),0) not between 2 and 100
     or coalesce(p->>'email','') !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' or length(p->>'email')>254
     or coalesce(p->>'mobile','') !~ '^[+]?[0-9]{7,15}$' then raise exception 'Invalid guest details'; end if;
  insert into ig_private.gullu_guests(session_id,name,email,mobile) values(sid,trim(p->>'name'),lower(trim(p->>'email')),p->>'mobile');
  return '{"registered":true}';
 end if;
 select * into strict guest from ig_private.gullu_guests where session_id=sid;
 if p->>'action'='context' then
  select * into t from ig_private.gullu_turns where session_id=sid and turn_id=(p->>'turn_id')::uuid;
  return jsonb_build_object('existing',case when t.turn_id is null then null else to_jsonb(t) end,
   'history',(select coalesce(jsonb_agg(to_jsonb(h) order by created_at,turn_id),'[]') from
     (select question,answer,sources,created_at,turn_id from ig_private.gullu_turns where session_id=sid order by created_at desc,turn_id desc limit 6) h));
 end if;
 if p->>'action'='record' then
  ack=public.ig_gullu_record(secret,p||jsonb_build_object('consent',true,'contact_name',guest.name,'contact_email',guest.email));
  update ig_private.gullu_turns set consent_version='gullu-2' where turn_id=(p->>'turn_id')::uuid;
  if ack->>'enquiry_id' is not null then update public.ig_enquiries set phone=guest.mobile,privacy_version='gullu-2' where id=(ack->>'enquiry_id')::uuid; end if;
  return ack;
 end if;
 raise exception 'Unknown guest action';
end $$;
revoke all on function public.ig_gullu_guest(text,jsonb) from public;
grant execute on function public.ig_gullu_guest(text,jsonb) to anon,authenticated;

alter table ig_private.gullu_reports add column cadence text not null default 'weekly' check(cadence in ('weekly','daily'));
alter table ig_private.gullu_reports drop constraint gullu_reports_period_start_recipient_key;
alter table ig_private.gullu_reports add unique(period_start,recipient,cadence);
create or replace function ig_private.open_gullu_week(stamp timestamptz) returns void
language sql security definer set search_path='' as $$
  insert into ig_private.gullu_reports(period_start,recipient,next_at)
  select week_start, address,
    (week_start + 7 + time '09:00') at time zone 'Asia/Kolkata'
  from (select date_trunc('week',stamp at time zone 'Asia/Kolkata')::date as week_start) w
  cross join unnest(array['akm@indiagully.com','amit.jhingan@indiagully.com','pavan@indiagully.com']) as address
  on conflict(period_start,recipient,cadence) do nothing
$$;

create or replace function ig_private.open_gullu_turn_week() returns trigger
language plpgsql security definer set search_path='' as $$
declare d date=(new.created_at at time zone 'Asia/Kolkata')::date;
begin
 if exists(select 1 from ig_private.gullu_guests where session_id=new.session_id) then
  if tg_op='UPDATE' and old.enquiry_id is not distinct from new.enquiry_id then return new; end if;
  if tg_op='UPDATE' then d=(now() at time zone 'Asia/Kolkata')::date; end if;
  insert into ig_private.gullu_reports(period_start,recipient,next_at,cadence)
  select d,a,((d+1)+time '09:00') at time zone 'Asia/Kolkata','daily'
  from unnest(array['akm@indiagully.com','amit.jhingan@indiagully.com','pavan@indiagully.com']) a
  on conflict(period_start,recipient,cadence) do nothing;
 else
  if tg_op='INSERT' then perform ig_private.open_gullu_week(new.created_at); end if;
  if new.enquiry_id is not null then perform ig_private.open_gullu_week(e.created_at) from public.ig_enquiries e where e.id=new.enquiry_id; end if;
 end if;
 return new;
end $$;
-- Only registered sessions active that day. Include earlier turns for continuity in the workbook.
create function ig_private.gullu_day_sessions(d date, after_id uuid, batch int) returns jsonb
language sql stable security definer set search_path='' as $$
 with bounds as (select d::timestamp at time zone 'Asia/Kolkata' lo,(d+1)::timestamp at time zone 'Asia/Kolkata' hi),
 active as (select g.* from ig_private.gullu_guests g,bounds b where (after_id is null or g.session_id>after_id)
 and exists(select 1 from ig_private.gullu_turns t left join public.ig_enquiries e on e.id=t.enquiry_id where t.session_id=g.session_id and
 (t.created_at>=b.lo and t.created_at<b.hi or e.created_at>=b.lo and e.created_at<b.hi))
 order by g.session_id limit greatest(1,least(batch,50)))
 select coalesce(jsonb_agg(jsonb_build_object('session_id',g.session_id,'name',g.name,'email',g.email,'mobile',g.mobile,'turns',
 (select jsonb_agg(jsonb_build_object('question',t.question,'answer',t.answer,'sources',t.sources,'created_at',t.created_at,'practice',t.practice_interest,
 'follow_up',e.created_at<b.hi) order by t.created_at,t.turn_id) from ig_private.gullu_turns t left join public.ig_enquiries e on e.id=t.enquiry_id where t.session_id=g.session_id and t.created_at<b.hi))
 order by g.session_id),'[]') from active g cross join bounds b
$$;
create function public.ig_gullu_day(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.allowed('enquiries.manage') then raise exception 'Lead access required' using errcode='42501'; end if;
 return ig_private.gullu_day_sessions((p->>'day')::date,(p->>'after')::uuid,25);
end $$;
revoke all on function ig_private.gullu_day_sessions(date,uuid,int),public.ig_gullu_day(jsonb) from public,anon,authenticated;
grant execute on function public.ig_gullu_day(jsonb) to authenticated;
create or replace function ig_private.gullu_digest(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare action text=p->>'action'; job ig_private.gullu_reports; result jsonb='[]'; pid text=nullif(p->>'provider_id',''); report jsonb;
begin
  if ig_private.integration_server(secret) is not true then raise exception 'Server authorisation required' using errcode='42501'; end if;
  if action='rows' then
    select * into strict job from ig_private.gullu_reports where id=(p->>'id')::uuid and lease_token=(p->>'lease_token')::uuid and status='sending' and lease_until>now() and cadence='daily';
    return ig_private.gullu_day_sessions(job.period_start,(p->>'after')::uuid,25);
  end if;
  if action='claim' then
    if not ig_private.gullu_report_due() then return result; end if;
    update ig_private.gullu_reports set status='unconfirmed',lease_token=null,lease_until=null
      where status in ('queued','sending') and (lease_until is null or lease_until<=now())
      and (first_attempt<=now()-interval '23 hours' or attempts>=5);
    for job in select * from ig_private.gullu_reports where status in ('queued','sending') and next_at<=now()
      and (lease_until is null or lease_until<=now()) order by period_start,recipient limit 3 for update skip locked loop
      if exists(select 1 from ig_private.email_suppressions where email=job.recipient) then
        update ig_private.gullu_reports set status='suppressed' where id=job.id;
        continue;
      end if;
      if job.cadence='daily' then
       select jsonb_build_object('conversations',count(distinct t.session_id),'questions',count(*) filter(where (t.created_at at time zone 'Asia/Kolkata')::date=job.period_start),
       'follow_ups',count(*) filter(where (e.created_at at time zone 'Asia/Kolkata')::date=job.period_start),'topics','[]'::jsonb,'requests','[]'::jsonb) into report
       from ig_private.gullu_turns t join ig_private.gullu_guests g using(session_id) left join public.ig_enquiries e on e.id=t.enquiry_id
       where (t.created_at at time zone 'Asia/Kolkata')::date=job.period_start or (e.created_at at time zone 'Asia/Kolkata')::date=job.period_start;
       report=coalesce(job.summary,report);
      else report=coalesce(job.summary,ig_private.gullu_week_summary(job.period_start)); end if;
      if (report->>'questions')::bigint=0 and (report->>'follow_ups')::bigint=0 then
        delete from ig_private.gullu_reports where id=job.id;
        continue;
      end if;
      update ig_private.gullu_reports set status='sending',lease_token=gen_random_uuid(),
        lease_until=now()+interval '5 minutes',first_attempt=coalesce(first_attempt,now()),attempts=attempts+1,summary=report
        where id=job.id returning * into job;
      result=result||jsonb_build_array(jsonb_build_object('id',job.id,'lease_token',job.lease_token,
        'period_start',job.period_start,'cadence',job.cadence,'period_end',case when job.cadence='daily' then job.period_start else job.period_start+6 end,'recipient',job.recipient,'summary',report));
    end loop;
    return result;
  end if;
  if action='finish' and pid is not null then perform pg_advisory_xact_lock(hashtextextended('ig-resend:'||pid,0)); end if;
  select * into job from ig_private.gullu_reports where id=(p->>'id')::uuid and status='sending'
    and lease_token=(p->>'lease_token')::uuid and lease_until>now() for update;
  if not found then raise exception 'Report lease expired'; end if;
  if action='prepare' then
    if exists(select 1 from ig_private.email_suppressions where email=job.recipient) then
      update ig_private.gullu_reports set status='suppressed',lease_token=null,lease_until=null where id=job.id;
      return null;
    end if;
    if jsonb_typeof(p->'payload') is distinct from 'object' or p->'payload'->'to' is distinct from jsonb_build_array(job.recipient)
      or octet_length((p->'payload')::text)>1000000 then raise exception 'Invalid report message'; end if;
    update ig_private.gullu_reports set payload=coalesce(payload,p->'payload') where id=job.id returning payload into result;
    return result;
  elsif action='finish' then
    update ig_private.gullu_reports set status=case when pid is not null then 'accepted' when attempts>=5 then 'unconfirmed' else 'queued' end,
      provider_id=pid,lease_token=null,lease_until=null,next_at=now()+make_interval(mins=>attempts*attempts)
      where id=job.id;
    if pid is not null then perform ig_private.gullu_apply_delivery(pid); end if;
    return '{"ok":true}';
  end if;
  raise exception 'Unknown report action';
end $$;

create or replace function ig_private.prune_gullu() returns void language plpgsql security definer set search_path='' as $$
begin
 delete from ig_private.gullu_turns where created_at<now()-interval '90 days';
 delete from ig_private.gullu_guests g where g.created_at<now()-interval '90 days' and not exists(select 1 from ig_private.gullu_turns t where t.session_id=g.session_id);
 delete from ig_private.gullu_reports where period_start < (now() at time zone 'Asia/Kolkata')::date-90;
 delete from ig_private.rate_limits where key like 'gullu:%' and window_start<now()-interval '2 days';
end $$;
