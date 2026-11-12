-- Wake the existing signed worker for campaign-only traffic as well.
do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.run_email_worker()'::regprocedure) into s;
 s=replace(s,$find$ then return null;end if;$find$,$replace$ and not exists(select 1 from ig_private.campaign_deliveries d join public.ig_campaigns c on c.id=d.campaign_id where c.status='active' and d.status in('queued','sending') and d.attempts<5 and d.next_attempt<=now() and (d.lease_until is null or d.lease_until<now())) then return null;end if;$replace$);
 execute s;
 select pg_get_functiondef('ig_private.campaign_runtime(text,jsonb)'::regprocedure) into s;
 s=replace(s,$find$end loop;return result;$find$,$replace$end loop;
 update public.ig_campaigns cc set status='completed',version=version+1,updated_at=now() where cc.status='active' and not exists(select 1 from ig_private.campaign_deliveries dd where dd.campaign_id=cc.id and dd.status in('queued','sending'));
 return result;$replace$);
 execute s;
end $migration$;
