-- Resolve the PL/pgSQL name collision without changing permissions.
do $$ declare definition text; begin
 select pg_get_functiondef('ig_private.content_intake(jsonb)'::regprocedure) into definition;
 definition=replace(definition, 'from public.ig_ai_jobs where id=', 'from public.ig_ai_jobs j0 where j0.id=');
 definition=replace(definition, 'and status=''ready'' and practice=c.practice', 'and status=''ready'' and j0.practice=c.practice');
 definition=replace(definition, 'j.context->>''kind''<>''intake''', 'j.context->>''kind'' is distinct from ''intake''');
 definition=replace(definition, 'j.context->>''record_kind''<>c.kind', 'j.context->>''record_kind'' is distinct from c.kind');
 execute definition;
end $$;
-- A complete form, source evidence and SEO fields require more than a short summary.
-- The daily request allowance remains unchanged.
update ig_private.integration_config
set settings=jsonb_set(settings,'{max_output_tokens}','6000'::jsonb), version=version+1,updated_at=now()
where id='openai' and mode='enabled' and (settings->>'max_output_tokens')::integer<6000;
