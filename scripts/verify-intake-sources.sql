-- Rollback-only metadata fixtures. No file transfer, messages or paid AI calls.
begin;
do $$
declare uid uuid; sid uuid; claims jsonb; p jsonb; source jsonb; again jsonb; denied boolean; checks int=0;
begin
 select u.id,s.id into uid,sid from auth.users u join auth.sessions s on s.user_id=u.id where u.email='akm@indiagully.com' order by s.created_at desc limit 1;
 if sid is null then raise exception 'Owner session required';end if;
 claims=jsonb_build_object('sub',uid,'session_id',sid,'aal','aal2','role','authenticated');perform set_config('request.jwt.claims',claims::text,true);
 p=jsonb_build_object('action','prepare','practice','real-estate','approved',true,'name','SYSTEM TEST large.pdf','mime','application/pdf','size',12000000000,'sha256',encode(extensions.digest(convert_to(gen_random_uuid()::text,'UTF8'),'sha256'),'hex'));
 source=public.ig_intake_sources_manage(p);
 assert (source->>'size')::bigint=12000000000 and source->>'uploaded'='false','Large source metadata rejected';checks=checks+1;
 again=public.ig_intake_sources_manage(p);assert again->>'id'=source->>'id','Retry created duplicate source';checks=checks+1;
 denied=false;begin perform public.ig_intake_sources_manage(p||'{"size":1}');exception when others then denied=true;end;assert denied,'Mismatched metadata accepted';checks=checks+1;
 denied=false;begin perform public.ig_intake_sources_manage(p||'{"approved":false}');exception when others then denied=true;end;assert denied,'Source accepted without approval';checks=checks+1;
 denied=false;begin perform public.ig_intake_sources_manage(p||'{"name":"bad.exe"}');exception when others then denied=true;end;assert denied,'Unsupported format accepted';checks=checks+1;
 p=jsonb_build_object('action','resolve','practice','real-estate','ids',jsonb_build_array(source->>'id'));
 denied=false;begin perform public.ig_intake_sources_manage(p);exception when others then denied=true;end;assert denied,'Unfinished upload resolved';checks=checks+1;
 insert into storage.objects(bucket_id,name,owner,metadata) values('ig-intake-sources',source->>'path',uid,jsonb_build_object('size',12000000000));
 again=public.ig_intake_sources_manage(p);assert again->0->>'id'=source->>'id','Completed source metadata not resolved';checks=checks+1;
 denied=false;begin perform public.ig_intake_sources_manage(p||'{"practice":"horeca"}');exception when insufficient_privilege then denied=true;end;assert denied,'Cross-practice source resolved';checks=checks+1;
 perform set_config('request.jwt.claims',jsonb_set(claims,'{aal}','"aal1"')::text,true);
 denied=false;begin perform public.ig_intake_sources_manage(p);exception when insufficient_privilege then denied=true;end;assert denied,'Source resolved without MFA';checks=checks+1;
 perform set_config('request.jwt.claims','{}',true);assert not ig_private.intake_source_allowed((source->>'id')::uuid),'Anonymous source access allowed';checks=checks+1;
 assert not has_table_privilege('anon','public.ig_intake_sources','SELECT'),'Anonymous metadata read enabled';checks=checks+1;
 assert not has_table_privilege('authenticated','public.ig_intake_sources','INSERT'),'Direct source insert enabled';checks=checks+1;
 assert exists(select 1 from storage.buckets where id='ig-intake-sources' and not public and file_size_limit is null),'Source bucket settings incorrect';checks=checks+1;
 assert exists(select 1 from storage.buckets where id='ig-brand-catalogues' and not public and file_size_limit is null),'Catalogue bucket settings incorrect';checks=checks+1;
 perform set_config('ig.intake_test_result',jsonb_build_object('passed',checks,'fixtures','rolled back','provider_calls',0,'large_file_test','metadata only')::text,true);
end $$;
select current_setting('ig.intake_test_result')::jsonb as result;
rollback;
