-- Rollback-only database acceptance; no storage objects or emails are created.
begin;
create temp table upload_checks(label text) on commit drop;
create function pg_temp.check_upload(ok boolean,label text) returns void language plpgsql as $$begin if not coalesce(ok,false) then raise exception 'Failed: %',label;end if;insert into upload_checks values(label);end$$;
do $$
declare owner_id uuid;session_id uuid;room_id uuid;content_id uuid;r jsonb;f jsonb;p jsonb;denied boolean;
begin
 select id into owner_id from auth.users where email='akm@indiagully.com';
 select id into session_id from auth.sessions where user_id=owner_id order by created_at desc limit 1;
 select id into content_id from public.ig_content where kind='opportunity' limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',session_id,'aal','aal2','role','authenticated')::text,true);
 select id into room_id from public.ig_data_rooms where active limit 1;
 if room_id is null then
 r=public.ig_room_manage(jsonb_build_object('action','create','content_id',content_id,'title','Rollback upload test')); room_id=(r->>'id')::uuid;
 end if;
 p=jsonb_build_object('action','upload_prepare','room_id',room_id,'name','Large-review.pdf','folder','','mime','application/pdf','bytes',8589934592,'download_enabled',false);
 f=public.ig_room_manage(p);
 perform pg_temp.check_upload((f->>'bytes')::bigint=8589934592,'8 GB original metadata accepted');
 perform pg_temp.check_upload(f->>'status'='pending','Upload remains pending until broker validates');
 perform pg_temp.check_upload(not (f->>'download_enabled')::boolean,'Private view-only default preserved');
 perform pg_temp.check_upload(not exists(select 1 from storage.buckets where id='ig-data-rooms' and (file_size_limit is not null or public)),'No bucket input cap or public access (including deferred bucket creation)');
 denied=false;begin perform public.ig_room_manage(p||'{"bytes":0}');exception when check_violation then denied=true;end;perform pg_temp.check_upload(denied,'Empty originals rejected');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',session_id,'aal','aal1','role','authenticated')::text,true);
 denied=false;begin perform public.ig_room_manage(p);exception when insufficient_privilege then denied=true;end;perform pg_temp.check_upload(denied,'MFA still required for uploads');
 perform set_config('request.jwt.claims','{}',true);
 denied=false;begin perform public.ig_room_authorize(jsonb_build_object('action','upload','id',f->>'id'));exception when insufficient_privilege then denied=true;end;perform pg_temp.check_upload(denied,'Anonymous upload resolution denied');
 perform pg_temp.check_upload(position('f.bytes>20971520' in pg_get_functiondef('ig_private.room_authorize(jsonb)'::regprocedure))>0,'Large originals use controlled companion preview');
end $$;
select count(*) as passed,array_agg(label order by label) as checks from upload_checks;
rollback;
