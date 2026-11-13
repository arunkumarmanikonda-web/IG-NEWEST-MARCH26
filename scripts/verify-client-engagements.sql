-- Rollback-only acceptance. Uses the existing owner's session ID internally;
-- creates no Auth users, sends no email, and retains no test data.
begin;
create temp table ig_checks(name text,passed boolean);
grant insert,select on ig_checks to authenticated;
create function pg_temp.check_it(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAILED: %',label;end if;insert into ig_checks values(label,true);end$$;
do $$
declare uid uuid;sid uuid;ca jsonb;cb jsonb;ct jsonb;other_contact jsonb;eng jsonb;room uuid;room_b uuid;fid uuid;other_fid uuid;gid uuid;contacts jsonb='[]';result jsonb;batch uuid=gen_random_uuid();i int;claims jsonb;
begin
 select u.id,s.id into uid,sid from auth.users u join auth.sessions s on s.user_id=u.id where lower(u.email)='akm@indiagully.com' order by s.created_at desc limit 1;
 if sid is null then raise exception 'Existing owner session required for rollback-only checks';end if;
 claims=jsonb_build_object('sub',uid,'session_id',sid,'aal','aal2','role','authenticated');perform set_config('request.jwt.claims',claims::text,true);
 ca=public.ig_client_manage('{"action":"client_save","name":"SYSTEM TEST client A","practice":"transaction-advisory","stage":"engaged"}');
 cb=public.ig_client_manage('{"action":"client_save","name":"SYSTEM TEST client B","practice":"hospitality","stage":"engaged"}');
 perform pg_temp.check_it(ca->>'id' is not null,'Administrator creates a private CRM client');
 for i in 1..10 loop
  ct=public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',ca->>'id','name','Test contact '||i,'email',case when i=1 then 'akm@indiagully.com' else 'client-test-'||i||'@example.invalid' end,'portal_enabled',true,'circulation',true));contacts=contacts||jsonb_build_array(ct->>'id');
 end loop;
 other_contact=public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',cb->>'id','name','Other client','email','other-client@example.invalid','portal_enabled',true,'circulation',true));
 eng=public.ig_client_manage(jsonb_build_object('action','engagement_save','client_id',ca->>'id','title','SYSTEM TEST feasibility','service','feasibility','reference','TEST-ENG-A','confidentiality_reference','ROLLBACK TEST ONLY','confidentiality_confirmed',true));
 select id into room from public.ig_data_rooms where engagement_id=(eng->>'id')::uuid;
 perform pg_temp.check_it(room is not null and not exists(select 1 from public.ig_public_content where id=room),'Engagement creates a private room without a public listing');
 result=public.ig_room_manage(jsonb_build_object('action','contact_grant_bulk','room_id',room,'contact_ids',contacts,'download_mode','none','expires_at',now()+interval '30 days'));
 perform pg_temp.check_it((result->>'added')::int=10,'One administrator action shares with ten separate emails');
 result=public.ig_room_manage(jsonb_build_object('action','contact_grant_bulk','room_id',room,'contact_ids',contacts,'download_mode','all','expires_at',now()+interval '60 days'));
 perform pg_temp.check_it((result->>'added')::int=0 and (result->>'existing_unchanged')::int=10 and (select count(*) from public.ig_room_grants where room_id=room and download_mode='none')=10,'Repeated bulk sharing preserves existing individual permissions');
 begin
  perform public.ig_room_manage(jsonb_build_object('action','contact_grant_bulk','room_id',room,'contact_ids',jsonb_build_array(other_contact->>'id'),'download_mode','all','expires_at',now()+interval '1 day'));
  raise exception 'Cross-client bulk grant allowed';
 exception when raise_exception then if sqlerrm='Cross-client bulk grant allowed' then raise;end if;end;
 perform pg_temp.check_it((select count(*) from public.ig_room_grants where room_id=room)=10,'Another client contact cannot be shared into this room');
 select id into gid from public.ig_room_grants where room_id=room and contact_id=(contacts->>0)::uuid;
 result=public.ig_room_manage(jsonb_build_object('action','folder_create','room_id',room,'path','Reports/Final'));
 perform pg_temp.check_it(result->>'path'='Reports/Final','Engagement supports nested folders');
 result=public.ig_room_manage(jsonb_build_object('action','upload_prepare','room_id',room,'name','Report.pdf','folder','Reports/Final','mime','application/pdf','bytes',100,'download_enabled',false));fid=(result->>'id')::uuid;
 update public.ig_room_files set status='ready' where id=fid; -- No storage object is created.
 result=public.ig_room_notify(jsonb_build_object('room_id',room,'batch_id',batch));
 perform pg_temp.check_it((result->>'queued')::int=10,'Circulation queues separate messages for ten authorised emails');
 result=public.ig_room_notify(jsonb_build_object('room_id',room,'batch_id',batch));
 perform pg_temp.check_it((result->>'duplicate')::bool and (select count(*) from public.ig_outbox where circulation_batch=batch)=10,'Circulation retries do not duplicate messages');
 update public.ig_profiles set roles=array['client'],practice_grants='{}' where id=uid;
 perform pg_temp.check_it(ig_private.room_access(room),'Verified email sees its own engagement room');
 result=public.ig_room_dashboard(jsonb_build_object('id',room));
 perform pg_temp.check_it(jsonb_array_length(result)=1 and result->0->>'room_type'='engagement' and jsonb_array_length(result->0->'files')=1,'Client dashboard returns the shared report room');
 perform pg_temp.check_it(not ig_private.room_download(fid),'Read-only grant blocks original download');
 update public.ig_room_grants set download_mode='all' where id=gid;
 perform pg_temp.check_it(not ig_private.room_download(fid),'File-level read-only block overrides all-download grant');
 update public.ig_room_files set download_enabled=true where id=fid;
 perform pg_temp.check_it(ig_private.room_download(fid),'Original download requires both file and contact permission');
 update public.ig_room_grants set download_mode='selected' where id=gid;
 perform pg_temp.check_it(not ig_private.room_download(fid),'Selected mode defaults to no original download');
 insert into public.ig_room_file_rules values(gid,fid,true);
 perform pg_temp.check_it(ig_private.room_download(fid),'Explicit per-contact file permission enables the selected original');
 update public.ig_room_file_rules set allow_download=false where grant_id=gid and file_id=fid; -- corrected below by qualified predicate
 perform pg_temp.check_it(not ig_private.room_download(fid),'Individual file deny overrides a grant');
 update public.ig_client_contacts set active=false where id=(contacts->>0)::uuid;
 perform pg_temp.check_it(not ig_private.room_access(room) and not ig_private.circulation_eligible(room,(contacts->>0)::uuid,'akm@indiagully.com'),'Disabling one contact revokes its room access and circulation');
 perform pg_temp.check_it((select count(*) from public.ig_room_grants g join public.ig_client_contacts c on c.id=g.contact_id where g.room_id=room and c.active)=9,'Other nine contacts retain their own grants');
 update public.ig_client_contacts set active=true where id=(contacts->>0)::uuid;
 update public.ig_room_grants set expires_at=now()-interval '1 second' where id=gid;
 perform pg_temp.check_it(not ig_private.room_access(room),'Expired contact grant cannot read reports');
 update public.ig_room_grants set expires_at=now()+interval '1 day' where id=gid;
 update public.ig_engagements set confidentiality_confirmed=false where id=(eng->>'id')::uuid;
 perform pg_temp.check_it(not ig_private.room_access(room),'Withdrawn confidentiality authority stops client access');
 update public.ig_engagements set confidentiality_confirmed=true where id=(eng->>'id')::uuid;
 update public.ig_clients set stage='archived' where id=(ca->>'id')::uuid;
 perform pg_temp.check_it(not ig_private.room_access(room),'Archived client cannot access reports');
 update public.ig_clients set stage='engaged' where id=(ca->>'id')::uuid;
 execute 'set local role authenticated';
 perform pg_temp.check_it((select count(*) from public.ig_client_contacts)=0,'Client cannot enumerate CRM contacts or other client emails');
 begin perform public.ig_room_manage(jsonb_build_object('action','file_update','id',fid,'version',1,'status','ready','download_enabled',true));raise exception 'Client could manage file permissions';exception when insufficient_privilege then null;end;
 execute 'reset role';
 perform pg_temp.check_it(true,'Client cannot alter file permissions');
 update public.ig_profiles set roles=array['owner'] where id=uid;
 begin
  perform public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',ca->>'id','id',contacts->>0,'version',1,'name','Wrong person','email','replacement@example.invalid','active',true,'portal_enabled',true,'circulation',true));raise exception 'Granted email reassigned';
 exception when raise_exception then if sqlerrm='Granted email reassigned' then raise;end if;end;
 perform pg_temp.check_it((select email from public.ig_client_contacts where id=(contacts->>0)::uuid)='akm@indiagully.com','Granted email cannot be reassigned to another person');
 perform set_config('request.jwt.claims',(claims||jsonb_build_object('aal','aal1'))::text,true);
 begin perform public.ig_client_manage('{"action":"client_save","name":"Should fail","practice":"transaction-advisory"}');raise exception 'MFA bypass';exception when insufficient_privilege then null;end;
 perform pg_temp.check_it(true,'Staff CRM changes require MFA');
end$$;
select * from ig_checks;
rollback;
