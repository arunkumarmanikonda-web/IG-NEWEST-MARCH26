-- Rollback-only permission regression checks, run by test:workflows against
-- synthetic local fixtures. No Auth users, messages or retained data are created.
begin;
create temp table directory_checks(name text,passed boolean);
create function pg_temp.check_directory(ok boolean,label text)
returns void language plpgsql as $$begin
 if ok is distinct from true then raise exception 'FAILED: %',label;end if;
 insert into directory_checks values(label,true);
end $$;
do $$
declare uid uuid;sid uuid;claims jsonb;result jsonb;expected jsonb;
 client_a jsonb;client_b jsonb;archived_client jsonb;staff_role text;
begin
 select u.id,s.id into uid,sid from auth.users u join auth.sessions s on s.user_id=u.id
 where lower(u.email)='akm@indiagully.com' order by s.created_at desc limit 1;
 if sid is null then raise exception 'Existing owner fixture session required';end if;
 claims=jsonb_build_object('sub',uid,'session_id',sid,'aal','aal2','role','authenticated');
 perform set_config('request.jwt.claims',claims::text,true);
 client_a=public.ig_client_manage('{"action":"client_save","name":"DIRECTORY QA Alpha","practice":"transaction-advisory","stage":"engaged","reference":"PRIVATE-ALPHA"}');
 client_b=public.ig_client_manage('{"action":"client_save","name":"DIRECTORY QA Beta","practice":"hospitality","stage":"prospect","reference":"PRIVATE-BETA"}');
 archived_client=public.ig_client_manage('{"action":"client_save","name":"DIRECTORY QA Archived","practice":"transaction-advisory","stage":"archived","reference":"PRIVATE-ARCHIVED"}');

 -- Exercise the public RPC as an authenticated caller, not as the database owner.
 foreach staff_role in array array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager','sales','auditor'] loop
  update public.ig_profiles set roles=array[staff_role],practice_grants='{}' where id=uid;
  execute 'set local role authenticated';
  result=public.ig_client_directory();
  execute 'reset role';
  perform pg_temp.check_directory(result='[]'::jsonb,staff_role||' without practice grants cannot enumerate any client fields');
 end loop;

 update public.ig_profiles set roles=array['property_manager'],practice_grants='{"transaction-advisory":["read"]}' where id=uid;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'stage',stage,'reference',reference,'practice',practice) order by name),'[]'::jsonb)
 into expected from public.ig_clients where practice='transaction-advisory' and stage<>'archived';
 execute 'set local role authenticated';
 result=public.ig_client_directory();
 execute 'reset role';
 perform pg_temp.check_directory(result=expected and result @> jsonb_build_array(jsonb_build_object('id',client_a->>'id')),'Operational reader gets the permitted practice with unchanged fields and ordering');
 perform pg_temp.check_directory(not result @> jsonb_build_array(jsonb_build_object('id',client_b->>'id')) and not exists(select 1 from jsonb_array_elements(result) c where c->>'practice'<>'transaction-advisory'),'Other-practice client identifiers and details are excluded');
 perform pg_temp.check_directory(not result @> jsonb_build_array(jsonb_build_object('id',archived_client->>'id')),'Archived clients stay excluded even within a permitted practice');

 update public.ig_profiles set roles=array['editor'] where id=uid;
 execute 'set local role authenticated';
 result=public.ig_client_directory();
 execute 'reset role';
 perform pg_temp.check_directory(result='[]'::jsonb,'Editorial read permission alone does not grant CRM client access');

 update public.ig_profiles set roles=array['sales'],practice_grants='{"transaction-advisory":["read","enquiries"]}' where id=uid;
 execute 'set local role authenticated';
 result=public.ig_client_directory();
 execute 'reset role';
 perform pg_temp.check_directory(result=expected,'Practice CRM staff retain their authorised directory');

 update public.ig_profiles set roles=array['administrator'],practice_grants='{"transaction-advisory":["read","data_rooms"]}' where id=uid;
 execute 'set local role authenticated';
 result=public.ig_client_directory();
 execute 'reset role';
 perform pg_temp.check_directory(result=expected,'Practice room administrators retain their authorised directory');

 update public.ig_profiles set roles=array['owner'],practice_grants='{}' where id=uid;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'stage',stage,'reference',reference,'practice',practice) order by name),'[]'::jsonb)
 into expected from public.ig_clients where stage<>'archived';
 execute 'set local role authenticated';
 result=public.ig_client_directory();
 execute 'reset role';
 perform pg_temp.check_directory(result=expected and result @> jsonb_build_array(jsonb_build_object('id',client_a->>'id'),jsonb_build_object('id',client_b->>'id')),'Owner retains all nonarchived clients without explicit practice grants');

 update public.ig_profiles set roles=array['client'] where id=uid;
 execute 'set local role authenticated';
 begin
  perform public.ig_client_directory();raise exception 'CLIENT_DIRECTORY_ALLOWED';
 exception when insufficient_privilege then null;end;
 execute 'reset role';
 perform pg_temp.check_directory(true,'Client account cannot invoke the staff directory');

 update public.ig_profiles set roles=array['property_manager'],practice_grants='{"transaction-advisory":["read"]}' where id=uid;
 perform set_config('request.jwt.claims',(claims||jsonb_build_object('aal','aal1','amr',jsonb_build_array(jsonb_build_object('method','password'))))::text,true);
 execute 'set local role authenticated';
 begin
  perform public.ig_client_directory();raise exception 'UNVERIFIED_DIRECTORY_ALLOWED';
 exception when insufficient_privilege then null;end;
 execute 'reset role';
 perform pg_temp.check_directory(true,'Password-only staff session cannot bypass verification');

 perform set_config('request.jwt.claims','{}',true);
 execute 'set local role authenticated';
 begin
  perform public.ig_client_directory();raise exception 'NO_IDENTITY_DIRECTORY_ALLOWED';
 exception when insufficient_privilege then null;end;
 execute 'reset role';
 perform pg_temp.check_directory(true,'Missing identity cannot read the directory');
 perform pg_temp.check_directory(not has_function_privilege('anon','public.ig_client_directory()','EXECUTE') and not has_function_privilege('anon','ig_private.client_directory()','EXECUTE'),'Anonymous execution stays revoked on both RPC functions');
end $$;
select * from directory_checks;
rollback;
