-- The private media importer uses the existing service role for storage and a
-- separately authenticated worker RPC. USAGE permits function-name resolution;
-- no table privileges or client grants are added.
grant usage on schema ig_private to service_role;

-- Guard the exact failure observed in live Runway import, while preserving the
-- integration secret check inside the worker.
do $$
begin
 if not has_function_privilege('service_role','public.ig_provider_worker(text,jsonb)','EXECUTE')
 or not has_function_privilege('service_role','ig_private.provider_worker(text,jsonb)','EXECUTE') then
  raise exception 'Creative worker function grants are incomplete';
 end if;
end $$;
