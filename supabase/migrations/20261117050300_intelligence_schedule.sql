create function public.ig_intelligence_admin(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a text=coalesce(p->>'action','status'); cfg ig_private.intelligence_settings; can_leads boolean; days int;
begin
 if not ig_private.allowed('content.publish') or not ig_private.scope_allowed('corporate','publish') then
  raise exception 'Publication administration required' using errcode='42501';
 end if;
 can_leads=ig_private.allowed('enquiries.manage');
 if a in ('settings','queue') then
  select * into strict cfg from ig_private.intelligence_settings where id for update;
  if a='queue' then
   if not cfg.enabled then raise exception 'Enable the schedule first';end if;
   if exists(select 1 from ig_private.perspective_runs where status='researching' and started_at>now()-interval '7 minutes') then raise exception 'Research is already running';end if;
   update ig_private.intelligence_settings set next_at=now(),attempts=0 where id;
  else
   days=(p->>'cadence_days')::int;
   if days is null or days not in (7,14) or jsonb_typeof(p->'enabled') is distinct from 'boolean' or length(coalesce(p->>'preferred_topic',''))>200 then raise exception 'Invalid editorial schedule';end if;
   if (cfg.enabled,cfg.cadence_days,cfg.preferred_topic) is distinct from ((p->>'enabled')::boolean,days,trim(coalesce(p->>'preferred_topic',''))) then
    update ig_private.perspective_runs set status='held',finished_at=now(),error='Schedule changed by staff' where status='researching';
    update ig_private.intelligence_settings set enabled=(p->>'enabled')::boolean,cadence_days=days,preferred_topic=trim(coalesce(p->>'preferred_topic','')),attempts=0,
    next_at=case when not cfg.enabled then now() when days<>cfg.cadence_days then (date_trunc('week',now() at time zone 'Asia/Kolkata')+make_interval(days=>days,hours=>9)) at time zone 'Asia/Kolkata' else cfg.next_at end where id;
   end if;
  end if;
  insert into public.ig_audit(actor_id,action,entity_id) values(auth.uid(),'intelligence.'||a,'perspectives');
 elsif a<>'status' then raise exception 'Unknown action';end if;
 return jsonb_build_object(
  'settings',(select to_jsonb(s)-'id'-'attempts' from ig_private.intelligence_settings s where id),
  'runs',(select coalesce(jsonb_agg(to_jsonb(r) order by started_at desc),'[]') from (select status,started_at,finished_at,title,error,candidates,selection_reason from ig_private.perspective_runs order by started_at desc limit 40) r),
  'reports',case when can_leads then (select coalesce(jsonb_agg(to_jsonb(d) order by period_start desc),'[]') from (select period_start,recipient,status from ig_private.gullu_reports order by period_start desc limit 30) d) else '[]'::jsonb end,
  'conversations',case when can_leads then (select coalesce(jsonb_agg(to_jsonb(c) order by created_at desc),'[]') from (select session_id,question,answer,practice_interest,follow_up,created_at,enquiry_id from ig_private.gullu_turns order by created_at desc limit 100) c) else '[]'::jsonb end);
end $$;
revoke all on function public.ig_intelligence_admin(jsonb) from public,anon;
grant execute on function public.ig_intelligence_admin(jsonb) to authenticated;

do $$
declare src text; updated text;
begin
 src=pg_get_functiondef('ig_private.run_email_worker()'::regprocedure);
 updated=replace(src,'if not exists(select 1 from ig_private.catalogue_runs','if not exists(select 1 from ig_private.intelligence_settings where enabled and next_at<=now())
 and not ig_private.gullu_report_due()
 and not exists(select 1 from ig_private.catalogue_runs');
 if updated=src then raise exception 'Review scheduler before registering intelligence work';end if;
 execute updated;
end $$;

create function ig_private.prune_gullu() returns void language plpgsql security definer set search_path='' as $$
begin
 delete from ig_private.gullu_turns where created_at<now()-interval '90 days';
 delete from ig_private.rate_limits where key like 'gullu:%' and window_start<now()-interval '2 days';
end $$;
revoke all on function ig_private.prune_gullu() from public,anon,authenticated;
select cron.schedule('ig-gullu-retention','20 21 * * *','select ig_private.prune_gullu()');
