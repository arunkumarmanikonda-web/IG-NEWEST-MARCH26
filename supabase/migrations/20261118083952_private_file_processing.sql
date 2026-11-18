-- Isolated private scanning/conversion. Originals and existing grant permissions remain unchanged.
alter table public.ig_room_files add column processing_status text not null default 'unscanned'
 check(processing_status in ('unscanned','queued','processing','clean','infected','held'));
alter table public.ig_room_files add column processing_detail text not null default '';
alter table public.ig_room_files add column scanned_at timestamptz;
create table ig_private.file_processing_config (
 id boolean primary key default true check(id), enabled boolean not null default false,
 snapshot_id text, refreshed_at timestamptz
);
insert into ig_private.file_processing_config(id) values(true);
create table ig_private.file_processing_jobs (
 file_id uuid primary key references public.ig_room_files(id),
 state text not null default 'queued' check(state in ('queued','processing','clean','infected','held')),
 required boolean not null default true, attempts int not null default 0,
 lease uuid, started_at timestamptz, finished_at timestamptz, next_at timestamptz not null default now(),
 preview_id uuid references public.ig_room_files(id), report jsonb
);
create index ig_file_processing_due on ig_private.file_processing_jobs(next_at) where state in ('queued','processing');
create index ig_file_processing_preview on ig_private.file_processing_jobs(preview_id);
alter table ig_private.file_processing_config enable row level security;
alter table ig_private.file_processing_jobs enable row level security;
revoke all on ig_private.file_processing_config,ig_private.file_processing_jobs from public,anon,authenticated;

create function ig_private.queue_file_processing() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='ready' and new.processing_status<>'clean' and (tg_op='INSERT' or old.status='pending')
 and exists(select 1 from ig_private.file_processing_config where enabled) then
  insert into ig_private.file_processing_jobs(file_id) values(new.id) on conflict do nothing;
  update public.ig_room_files set processing_status='queued',processing_detail='Private antivirus check queued' where id=new.id;
 end if;return new;
end $$;
revoke all on function ig_private.queue_file_processing() from public,anon,authenticated;
create trigger ig_room_scan_queue after insert or update of status on public.ig_room_files
 for each row execute function ig_private.queue_file_processing();

create function public.ig_file_processing(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action'; j ig_private.file_processing_jobs; f public.ig_room_files; preview public.ig_room_files;
 token uuid; result jsonb; rep jsonb=p->'report'; needs boolean;
begin
 if not ig_private.integration_server(secret) then raise exception 'Worker authentication required' using errcode='42501';end if;
 if a='config' then return (select to_jsonb(c) from ig_private.file_processing_config c where id);end if;
 if a='snapshot' then
  if p->>'snapshot_id' !~ '^snap_[A-Za-z0-9]+$' then raise exception 'Invalid processing image';end if;
  update ig_private.file_processing_config set snapshot_id=p->>'snapshot_id',refreshed_at=now() where id;
  return '{}';
 end if;
 if not exists(select 1 from ig_private.file_processing_config where enabled) then return null;end if;
 if a='claim' then
  with exhausted as (update ig_private.file_processing_jobs set state='held',lease=null,finished_at=now(),report='{"scan":"held","error":"Processing timed out after three attempts"}'
   where state='processing' and started_at<now()-interval '8 minutes' and attempts>=3 returning file_id)
  update public.ig_room_files set processing_status='held',processing_detail='Processing timed out after three attempts' where id in(select file_id from exhausted);
  select q.* into j from ig_private.file_processing_jobs q join public.ig_room_files r on r.id=q.file_id
  where r.status='ready' and ((q.state='queued' and q.next_at<=now()) or (q.state='processing' and q.started_at<now()-interval '8 minutes'))
  and q.attempts<3 order by (r.preview_for is null and r.mime not in ('application/pdf','image/jpeg','image/png','image/webp','application/zip')) desc,
  q.next_at,r.bytes for update of q skip locked limit 1;
  if j.file_id is null then return null;end if;
  token=gen_random_uuid();
  update ig_private.file_processing_jobs set state='processing',lease=token,started_at=now(),attempts=attempts+1 where file_id=j.file_id;
  update public.ig_room_files set processing_status='processing',processing_detail='Private antivirus check in progress' where id=j.file_id;
  select * into f from public.ig_room_files where id=j.file_id;
  needs=f.preview_for is null and f.mime<>'application/zip' and not (f.mime in ('application/pdf','image/jpeg','image/png','image/webp') and f.bytes<=20971520)
   and not exists(select 1 from public.ig_room_files where preview_for=f.id and status='ready');
  return jsonb_build_object('file_id',f.id,'lease',token,'name',f.name,'mime',f.mime,'bytes',f.bytes,'needs_preview',needs);
 end if;
 select * into j from ig_private.file_processing_jobs where file_id=(p->>'file_id')::uuid and lease=(p->>'lease')::uuid
 and state='processing' and started_at>now()-interval '8 minutes' for update;
 if j.file_id is null then raise exception 'Processing lease expired' using errcode='42501';end if;
 select * into f from public.ig_room_files where id=j.file_id and status='ready';
 if f.id is null then raise exception 'Original is no longer available';end if;
 if a='source' then return to_jsonb(f);end if;
 if a='preview_prepare' then
  if f.preview_for is not null or (p->>'bytes')::bigint not between 1 and 20971520 then raise exception 'Invalid preview';end if;
  if exists(select 1 from public.ig_room_files where preview_for=f.id and status='ready') then raise exception 'A preview was attached while processing';end if;
  if j.preview_id is not null then
   update public.ig_room_files set status='archived' where id=j.preview_id and status='pending';
  end if;
  token=gen_random_uuid();
  insert into public.ig_room_files(id,room_id,name,folder,object_key,mime,bytes,preview_for,download_enabled)
  values(token,f.room_id,left(regexp_replace(f.name,'\.[^.]+$',''),160)||' preview.pdf',f.folder,
   f.room_id::text||'/'||token::text,'application/pdf',(p->>'bytes')::bigint,f.id,false) returning * into preview;
  update ig_private.file_processing_jobs set preview_id=token where file_id=f.id;
  return to_jsonb(preview);
 end if;
 if a='preview_source' then
  select * into preview from public.ig_room_files where id=j.preview_id and preview_for=f.id and status='pending';
  if preview.id is null then raise exception 'Preview upload not prepared';end if;return to_jsonb(preview);
 end if;
 if a='finish' then
  if jsonb_typeof(rep)<>'object' or length(rep::text)>10000 or coalesce(rep->>'scan','') not in ('clean','infected','held') then raise exception 'Invalid scan result';end if;
  if rep->>'scan' in ('clean','infected') and (coalesce(rep->>'sha256','') !~ '^[a-f0-9]{64}$' or coalesce(rep->>'engine','') !~ '^ClamAV ') then raise exception 'Complete antivirus evidence required';end if;
  if rep->>'scan'='clean' and coalesce((rep->>'preview')::boolean,false) then
   if coalesce(rep->>'preview_sha256','') !~ '^[a-f0-9]{64}$' or (rep->>'pages')::int not between 1 and 500 then raise exception 'Invalid preview report';end if;
   select * into preview from public.ig_room_files where id=j.preview_id and preview_for=f.id and status='pending';
   if preview.id is null or preview.bytes<>(rep->>'preview_bytes')::bigint then raise exception 'Verified preview upload required';end if;
   update public.ig_room_files set status='ready',processing_status='clean',processing_detail='Generated and scanned in isolated processing',scanned_at=now(),version=version+1 where id=preview.id;
   insert into ig_private.file_processing_jobs(file_id,state,required,finished_at,report) values(preview.id,'clean',true,now(),rep)
    on conflict(file_id) do update set state='clean',finished_at=now(),report=excluded.report;
  end if;
  update ig_private.file_processing_jobs set state=case when rep->>'scan'='held' and attempts<3 then 'queued' else rep->>'scan' end,report=rep,finished_at=now(),lease=null,next_at=now()+interval '5 minutes' where file_id=f.id;
  update public.ig_room_files set processing_status=case when rep->>'scan'='held' and j.attempts<3 then 'queued' else rep->>'scan' end,scanned_at=case when rep->>'scan' in ('clean','infected') then now() else null end,
   processing_detail=left(case when rep->>'scan'='clean' then coalesce(rep->>'preview_error','Antivirus check passed') when rep->>'scan'='infected' then 'Malware detected; file access blocked' when j.attempts<3 then 'Processing will retry automatically in five minutes' else coalesce(rep->>'error','Processing needs review') end,350) where id=f.id;
  insert into public.ig_audit(action,entity_id,detail) values('room.file_processing',f.id::text,jsonb_build_object('scan',rep->>'scan','preview',rep->'preview','sha256',rep->>'sha256'));
  return '{}';
 end if;
 raise exception 'Unknown processing action';
end $$;
revoke all on function public.ig_file_processing(text,jsonb) from public;
grant execute on function public.ig_file_processing(text,jsonb) to anon,authenticated;

-- Retain all existing user/room permission checks before adding scan gates.
do $$
declare spec text=pg_get_functiondef('ig_private.room_authorize(jsonb)'::regprocedure);
begin
 if position('if p->>''action''=''upload'' then' in spec)=0 then raise exception 'Review file authorizer';end if;
 spec=replace(spec,'if p->>''action''=''upload'' then',
 'if p->>''action''<>''upload'' and exists(select 1 from ig_private.file_processing_jobs q where q.file_id=f.id and (q.state=''infected'' or (q.required and q.state<>''clean''))) then raise exception ''This file is awaiting a private security check or needs administrator review'' using errcode=''42501'';end if;
 if p->>''action''=''upload'' then');
 spec=replace(spec,'-- Bound repeated expensive preview requests',
 'if p->>''action''<>''upload'' and exists(select 1 from ig_private.file_processing_jobs q where q.file_id=f.id and (q.state=''infected'' or (q.required and q.state<>''clean''))) then raise exception ''Preview is awaiting a private security check'' using errcode=''42501'';end if;
 -- Bound repeated expensive preview requests');
 execute spec;
end $$;
alter table ig_private.worker_health drop constraint worker_health_component_check;
alter table ig_private.worker_health add constraint worker_health_component_check check(component in ('email','providers','campaigns','collections','catalogue','artwork','perspectives','gullu_reports','private_files'));
insert into ig_private.worker_health(component) values('private_files');
do $$
declare spec text=pg_get_functiondef('ig_private.run_email_worker()'::regprocedure);
begin
 if position('and not ig_private.gullu_report_due()' in spec)=0 then raise exception 'Review file-processing scheduler';end if;
 spec=replace(spec,'and not ig_private.gullu_report_due()',
 'and not exists(select 1 from ig_private.file_processing_jobs q,ig_private.file_processing_config c where c.enabled and (q.state=''queued'' and q.next_at<=now() or q.state=''processing'' and q.started_at<now()-interval ''8 minutes'')) and not ig_private.gullu_report_due()');
 execute spec;
end $$;
notify pgrst,'reload schema';

-- The same readiness rule protects single and bulk invitation/grant flows.
create or replace function public.ig_room_readiness(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare room uuid=(p->>'room_id')::uuid; problems jsonb;
begin
 if not ig_private.room_staff(room) then raise exception 'Room administration permission required' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'status',status,'download_enabled',download_enabled,'reason',reason) order by name),'[]') into problems from (
 select f.*,case when f.status='pending' then 'Upload has not completed. Retry or remove this pending file.'
 when exists(select 1 from ig_private.file_processing_jobs q where q.file_id=f.id and (q.state='infected' or q.required and q.state<>'clean')) then 'Private security check is pending or needs administrator review.'
 when f.status='ready' and not (f.mime in ('application/pdf','image/jpeg','image/png','image/webp') and f.bytes<=20971520)
 and not exists(select 1 from public.ig_room_files pr where pr.preview_for=f.id and pr.status='ready' and pr.mime='application/pdf' and pr.bytes<=20971520
 and not exists(select 1 from ig_private.file_processing_jobs q where q.file_id=pr.id and (q.state='infected' or q.required and q.state<>'clean')))
 and not (f.download_enabled and coalesce(p->>'download_mode','none')='all') then 'Automatic preview is pending. Review processing, attach a PDF, or explicitly permit original downloads for this file and recipient.' end reason
 from public.ig_room_files f where f.room_id=room and f.preview_for is null and f.status<>'archived') entries where reason is not null;
 return jsonb_build_object('ready',jsonb_array_length(problems)=0,'issues',problems);
end $$;

alter function ig_private.room_manage(jsonb) rename to room_manage_before_processing;
revoke all on function ig_private.room_manage_before_processing(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.ig_room_files;
begin
 if p->>'action'='processing_retry' then
  select * into f from public.ig_room_files where id=(p->>'id')::uuid;
  if f.id is null or not ig_private.room_staff(f.room_id) then raise exception 'Room administration permission required' using errcode='42501';end if;
  if f.status<>'ready' or f.processing_status='infected' then raise exception 'Replace infected files with a clean original';end if;
  if not exists(select 1 from ig_private.file_processing_config where enabled) then raise exception 'Private processing is not enabled';end if;
  insert into ig_private.file_processing_jobs(file_id) values(f.id) on conflict(file_id) do update set state='queued',attempts=0,lease=null,next_at=now(),report=null
   where file_processing_jobs.state in('held','clean');
  if not found then raise exception 'Processing already queued or in progress';end if;
  update public.ig_room_files set processing_status='queued',processing_detail='Private processing queued' where id=f.id;
  perform ig_private.record_audit('room.processing_retry',f.id::text);return '{}';
 end if;
 return ig_private.room_manage_before_processing(p);
end $$;
grant execute on function ig_private.room_manage(jsonb) to authenticated;
revoke all on function ig_private.room_manage(jsonb) from public,anon;
notify pgrst,'reload schema';

-- Expose only user-facing scan status through the already authorised room listing.
do $$
declare spec text=pg_get_functiondef('ig_private.room_dashboard(jsonb)'::regprocedure);
begin
 if position('''can_download'',ig_private.room_download(f.id)' in spec)=0 then raise exception 'Review dashboard processing state';end if;
 spec=replace(spec,'''can_download'',ig_private.room_download(f.id)',
 '''processing_status'',f.processing_status,''security_pending'',exists(select 1 from ig_private.file_processing_jobs q where q.file_id=f.id and (q.state=''infected'' or q.required and q.state<>''clean'')),''can_download'',ig_private.room_download(f.id)');
 execute spec;
end $$;
notify pgrst,'reload schema';
