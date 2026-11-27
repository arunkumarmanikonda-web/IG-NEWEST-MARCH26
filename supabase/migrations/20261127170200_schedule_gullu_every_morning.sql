-- Create the scheduled envelope independently of guest activity. The existing worker
-- claims due envelopes and retains its delivery, suppression and retry handling.
create or replace function ig_private.queue_gullu_daily()
returns void language sql security definer set search_path='' as $$
  insert into ig_private.gullu_reports(period_start,recipient,next_at,cadence)
  select local_day - 1, recipient, (local_day + time '09:00') at time zone 'Asia/Kolkata', 'daily'
  from (select (now() at time zone 'Asia/Kolkata')::date as local_day) d
  cross join unnest(array['akm@indiagully.com','amit.jhingan@indiagully.com','pavan@indiagully.com']) r(recipient)
  on conflict(period_start,recipient,cadence) do nothing;
$$;
revoke all on function ig_private.queue_gullu_daily() from public, anon, authenticated;

do $migration$
declare
  source text := pg_get_functiondef('ig_private.gullu_digest(text,jsonb)'::regprocedure);
  old_guard text := 'if (report->>''questions'')::bigint=0 and (report->>''follow_ups'')::bigint=0 then';
begin
  if strpos(source, old_guard)=0 then raise exception 'Digest definition changed; review the zero-activity guard'; end if;
  execute replace(source, old_guard, 'if job.cadence <> ''daily'' and ' || substr(old_guard,4));
end $migration$;

-- pg_cron runs in GMT. Queue at 08:59 IST for the 09:00 recovery worker.
select cron.schedule('ig-gullu-daily','29 3 * * *','select ig_private.queue_gullu_daily()');
select ig_private.queue_gullu_daily();
