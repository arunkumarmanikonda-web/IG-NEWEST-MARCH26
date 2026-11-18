-- Keep held public-source research for authorised editors, without exposing runtime secrets.
alter table ig_private.perspective_runs add column diagnostics jsonb;
alter table ig_private.perspective_runs add constraint perspective_diagnostics_size check (
 diagnostics is null or (jsonb_typeof(diagnostics)='object' and octet_length(diagnostics::text)<=100000));
do $$
declare spec text=pg_get_functiondef('public.ig_perspective_worker(text,jsonb)'::regprocedure);
begin
 if position('error=left(coalesce(p->>''error'',''Evidence review incomplete''),400)' in spec)=0 then raise exception 'Review Perspective hold writer';end if;
 spec=replace(spec,'error=left(coalesce(p->>''error'',''Evidence review incomplete''),400)',
 'error=left(coalesce(p->>''error'',''Evidence review incomplete''),400),diagnostics=case when jsonb_typeof(p->''diagnostics'')=''object'' and octet_length((p->''diagnostics'')::text)<=100000 then p->''diagnostics'' else null end');
 execute spec;
 spec=pg_get_functiondef('public.ig_intelligence_admin(jsonb)'::regprocedure);
 if position('select status,started_at,finished_at,title,error,candidates,selection_reason' in spec)=0 then raise exception 'Review editorial status reader';end if;
 spec=replace(spec,'select status,started_at,finished_at,title,error,candidates,selection_reason',
 'select status,started_at,finished_at,title,error,candidates,selection_reason,diagnostics');
 execute spec;
end $$;
update ig_private.integration_config set settings=jsonb_set(settings,'{perspectives_model}','"gpt-6.2-astra"'),
 version=version+1,updated_at=now() where id='openai' and not settings?'perspectives_model';
insert into public.ig_audit(action,entity_id,detail) values('perspectives.research_model_configured','openai',
 '{"model":"gpt-6.2-astra","scope":"Perspectives research and independent review"}');
notify pgrst,'reload schema';
