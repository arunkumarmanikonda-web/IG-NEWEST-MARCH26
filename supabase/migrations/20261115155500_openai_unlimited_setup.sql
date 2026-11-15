-- A null effective cap represents an explicit owner-selected unlimited setting.
-- The numeric cap stays available when the owner switches back to a daily limit.
create function ig_private.openai_request_cap(settings jsonb)
returns integer language sql immutable set search_path='' as $$
 select case when settings->'unlimited_daily_requests'='true'::jsonb then null
   else least(100,greatest(1,coalesce((settings->>'daily_request_limit')::integer,20))) end
$$;
revoke all on function ig_private.openai_request_cap(jsonb) from public,anon,authenticated;

do $$
declare compiled text; revised text; original_cap text;
begin
 original_cap=$old$least(100,greatest(1,coalesce((settings->>'daily_request_limit')::int,20)))$old$;
 compiled=pg_get_functiondef('ig_private.ai_prepare(jsonb)'::regprocedure);
 if strpos(compiled,original_cap)=0 or strpos(compiled,'if (select count(*) from public.ig_ai_jobs where not catalogue_extra')=0 then
  raise exception 'Review the staff AI request budget definition';end if;
 revised=replace(compiled,original_cap,'ig_private.openai_request_cap(settings)');
 execute replace(revised,'if (select count(*) from public.ig_ai_jobs where not catalogue_extra','if cap is not null and (select count(*) from public.ig_ai_jobs where not catalogue_extra');
 compiled=pg_get_functiondef('ig_private.catalogue_background_claim()'::regprocedure);
 original_cap=replace(original_cap,'settings->>','cfg.settings->>');
 if strpos(compiled,original_cap)=0 or strpos(compiled,'if (select count(*) from public.ig_ai_jobs where not catalogue_extra')=0 then
  raise exception 'Review the catalogue worker budget definition';end if;
 revised=replace(compiled,original_cap,'ig_private.openai_request_cap(cfg.settings)');
 execute replace(revised,'if (select count(*) from public.ig_ai_jobs where not catalogue_extra','if cap is not null and (select count(*) from public.ig_ai_jobs where not catalogue_extra');
end $$;

create function ig_private.resume_catalogues_on_uncapping()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 update ig_private.catalogue_runs set state='queued',due=now(),note=null
 where state='waiting' and note='Daily AI allowance reached. Resumes after midnight India time.'
 and (lease_until is null or lease_until<=now());
 return new;
end $$;
revoke all on function ig_private.resume_catalogues_on_uncapping() from public,anon,authenticated;
create trigger resume_catalogues_on_uncapping after update of settings,mode on ig_private.integration_config
 for each row when (new.id='openai' and new.mode='enabled' and new.settings->'unlimited_daily_requests'='true'::jsonb
 and (old.settings->'unlimited_daily_requests' is distinct from new.settings->'unlimited_daily_requests' or old.mode is distinct from new.mode))
 execute function ig_private.resume_catalogues_on_uncapping();
