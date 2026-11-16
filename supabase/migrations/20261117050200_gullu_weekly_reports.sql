-- A real, consented conversation opens the reporting week. The three readers
-- receive one frozen report each, after Monday 09:00 India time.
create table ig_private.gullu_reports (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  recipient text not null,
  status text not null default 'queued' check (status in
    ('queued','sending','accepted','delivered','suppressed','failed','unconfirmed')),
  next_at timestamptz not null,
  first_attempt timestamptz,
  attempts integer not null default 0,
  lease_token uuid, lease_until timestamptz,
  summary jsonb, payload jsonb, provider_id text unique,
  unique(period_start,recipient)
);
alter table ig_private.gullu_reports enable row level security;
revoke all on ig_private.gullu_reports from public,anon,authenticated;
create index ig_gullu_reports_pending on ig_private.gullu_reports(next_at)
  where status in ('queued','sending');

create function ig_private.open_gullu_week(stamp timestamptz) returns void
language sql security definer set search_path='' as $$
  insert into ig_private.gullu_reports(period_start,recipient,next_at)
  select week_start, address,
    (week_start + 7 + time '09:00') at time zone 'Asia/Kolkata'
  from (select date_trunc('week',stamp at time zone 'Asia/Kolkata')::date as week_start) w
  cross join unnest(array['akm@indiagully.com','amit.jhingan@indiagully.com','pavan@indiagully.com']) as address
  on conflict(period_start,recipient) do nothing
$$;
create function ig_private.open_gullu_turn_week() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then perform ig_private.open_gullu_week(new.created_at); end if;
  if new.enquiry_id is not null then
    perform ig_private.open_gullu_week(e.created_at) from public.ig_enquiries e where e.id=new.enquiry_id;
  end if;
  return new;
end $$;
create trigger ig_gullu_reporting_week after insert or update of enquiry_id on ig_private.gullu_turns
  for each row execute function ig_private.open_gullu_turn_week();

create function ig_private.gullu_report_due() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled')
    and exists(select 1 from ig_private.gullu_reports where status in ('queued','sending')
      and next_at<=now() and (lease_until is null or lease_until<=now()))
$$;
create function ig_private.gullu_week_summary(d date) returns jsonb
language sql stable security definer set search_path='' as $$
  with bounds as (select d::timestamp at time zone 'Asia/Kolkata' as start_at,
    (d+7)::timestamp at time zone 'Asia/Kolkata' as end_at),
  turns as (select t.* from ig_private.gullu_turns t,bounds
    where t.created_at>=start_at and t.created_at<end_at),
  interests as (select coalesce(nullif(trim(practice_interest),''),'General enquiry') as topic,count(*) as total
    from turns group by 1 order by 2 desc,1 limit 8),
  leads as (select distinct on (e.id) e.id,e.created_at,e.practice,e.message from public.ig_enquiries e
    join ig_private.gullu_turns t on t.enquiry_id=e.id cross join bounds
    where t.follow_up and e.created_at>=start_at and e.created_at<end_at order by e.id,t.created_at desc),
  samples as (select practice,left(message,200) as question from leads order by created_at desc,id limit 6)
  select jsonb_build_object('conversations',(select count(distinct session_id) from turns),
    'questions',(select count(*) from turns),'follow_ups',(select count(*) from leads),
    'topics',coalesce((select jsonb_agg(to_jsonb(i) order by total desc,topic) from interests i),'[]'),
    'requests',coalesce((select jsonb_agg(to_jsonb(s)) from samples s),'[]'))
$$;

-- Apply signed Resend events both when they arrive and when the send returns,
-- covering a delivery notification that races ahead of the provider response.
create function ig_private.gullu_apply_delivery(pid text) returns void
language plpgsql security definer set search_path='' as $$
declare job ig_private.gullu_reports; events text[]; reason text;
begin
  select * into job from ig_private.gullu_reports where provider_id=pid for update;
  if not found then return; end if;
  select array_agg(event_type order by created_at desc) into events from ig_private.provider_events
    where provider='resend' and provider_id=pid;
  select e into reason from unnest(events) as e where e in ('email.bounced','email.complained','email.suppressed') limit 1;
  if reason is not null then
    insert into ig_private.email_suppressions(email,reason) values(job.recipient,reason)
      on conflict(email) do update set reason=excluded.reason;
    update ig_private.gullu_reports set status='suppressed' where id=job.id;
  elsif 'email.delivered'=any(events) then
    update ig_private.gullu_reports set status='delivered' where id=job.id;
  elsif 'email.failed'=any(events) then
    update ig_private.gullu_reports set status='failed' where id=job.id;
  end if;
end $$;
create function ig_private.gullu_delivery_event() returns trigger language plpgsql security definer set search_path='' as $$
begin perform ig_private.gullu_apply_delivery(new.provider_id); return new; end $$;
create trigger ig_gullu_delivery_event after insert on ig_private.provider_events for each row
  when (new.provider='resend' and new.event_type in ('email.delivered','email.bounced','email.complained','email.suppressed','email.failed'))
  execute function ig_private.gullu_delivery_event();

create function ig_private.gullu_digest(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare action text=p->>'action'; job ig_private.gullu_reports; result jsonb='[]'; pid text=nullif(p->>'provider_id',''); report jsonb;
begin
  if ig_private.integration_server(secret) is not true then raise exception 'Server authorisation required' using errcode='42501'; end if;
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
      report=coalesce(job.summary,ig_private.gullu_week_summary(job.period_start));
      if (report->>'questions')::bigint=0 and (report->>'follow_ups')::bigint=0 then
        delete from ig_private.gullu_reports where id=job.id;
        continue;
      end if;
      update ig_private.gullu_reports set status='sending',lease_token=gen_random_uuid(),
        lease_until=now()+interval '5 minutes',first_attempt=coalesce(first_attempt,now()),attempts=attempts+1,summary=report
        where id=job.id returning * into job;
      result=result||jsonb_build_array(jsonb_build_object('id',job.id,'lease_token',job.lease_token,
        'period_start',job.period_start,'period_end',job.period_start+6,'recipient',job.recipient,'summary',report));
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
      or octet_length((p->'payload')::text)>60000 then raise exception 'Invalid report message'; end if;
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
create function public.ig_gullu_digest(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$
  select ig_private.gullu_digest(secret,p)
$$;
revoke all on function ig_private.open_gullu_week(timestamptz),ig_private.open_gullu_turn_week(),
  ig_private.gullu_report_due(),ig_private.gullu_week_summary(date),ig_private.gullu_apply_delivery(text),
  ig_private.gullu_delivery_event(),ig_private.gullu_digest(text,jsonb),public.ig_gullu_digest(text,jsonb)
  from public,anon,authenticated;
grant execute on function ig_private.gullu_digest(text,jsonb),public.ig_gullu_digest(text,jsonb) to anon,authenticated;
