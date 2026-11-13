-- Upload-first authoring: the original is stored once in the linked private room.
create table public.ig_content_intakes (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 request_id uuid not null,
 content_id uuid not null unique references public.ig_content(id),
 room_id uuid not null unique references public.ig_data_rooms(id),
 job_id uuid references public.ig_ai_jobs(id),
 media_id uuid references public.ig_source_media(id),
 review jsonb not null default '{}',
 created_at timestamptz not null default now(),
 unique(actor_id,request_id)
);
create index ig_content_intakes_job on public.ig_content_intakes(job_id);
create index ig_content_intakes_media on public.ig_content_intakes(media_id);
alter table public.ig_content_intakes enable row level security;
revoke all on public.ig_content_intakes from public,anon,authenticated;
grant select on public.ig_content_intakes to authenticated;
create policy content_intake_read on public.ig_content_intakes for select to authenticated
 using(ig_private.allowed('content.read') and ig_private.content_access(content_id,'read'));

alter table public.ig_intake_sources add column room_file_id uuid references public.ig_room_files(id);
alter table public.ig_intake_sources drop constraint ig_intake_sources_actor_id_practice_sha256_key;
create unique index intake_legacy_hash on public.ig_intake_sources(actor_id,practice,sha256) where room_file_id is null;
create unique index intake_room_file on public.ig_intake_sources(room_file_id) where room_file_id is not null;

create or replace function ig_private.intake_source_allowed(source uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and ig_private.allowed('content.write') and exists(
 select 1 from public.ig_intake_sources s where s.id=source and s.actor_id=auth.uid()
 and ig_private.scope_allowed(s.practice,'write') and (s.room_file_id is null or exists(
 select 1 from public.ig_room_files f where f.id=s.room_file_id and f.status='ready' and ig_private.room_staff(f.room_id))))
$$;
-- Only the staff source owner can read the original for AI. Client access still uses the room broker.
create policy room_source_processing on storage.objects for select to authenticated using(
 bucket_id='ig-data-rooms' and exists(select 1 from public.ig_intake_sources s
 where s.room_file_id is not null and s.path=storage.objects.name and ig_private.intake_source_allowed(s.id)));

alter function ig_private.intake_sources_manage(jsonb) rename to intake_sources_manage_before_rooms;
create function ig_private.intake_sources_manage(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.ig_intake_sources; ids uuid[]; sid uuid; result jsonb='[]'; bucket text;
begin
 if p->>'action'<>'resolve' then
  -- Legacy uploads must not accidentally deduplicate against a different room.
  return ig_private.intake_sources_manage_before_rooms(p);
 end if;
 if not ig_private.allowed('content.write') or not ig_private.scope_allowed(p->>'practice','write') then
  raise exception 'Staff source permission required' using errcode='42501';end if;
 if jsonb_typeof(p->'ids') is distinct from 'array' or jsonb_array_length(p->'ids') not between 1 and 8 then raise exception 'Choose 1–8 sources';end if;
 select array_agg(value::uuid) into ids from jsonb_array_elements_text(p->'ids');
 if (select count(distinct x) from unnest(ids)x)<>cardinality(ids) then raise exception 'Duplicate source';end if;
 foreach sid in array ids loop
  select * into s from public.ig_intake_sources where id=sid;
  if s.id is null or s.practice is distinct from p->>'practice' or not ig_private.intake_source_allowed(s.id) then raise exception 'Source permission required' using errcode='42501';end if;
  bucket=case when s.room_file_id is null then 'ig-intake-sources' else 'ig-data-rooms' end;
  if not exists(select 1 from storage.objects where bucket_id=bucket and name=s.path and (metadata->>'size')::bigint=s.size) then raise exception 'Source upload incomplete. Retry the same file.';end if;
  result=result||jsonb_build_array(to_jsonb(s)||jsonb_build_object('bucket',bucket));
 end loop;
 return result;
end $$;
-- Keep the legacy prepare lookup confined to its own bucket.
do $$ declare definition text; begin
 select pg_get_functiondef('ig_private.intake_sources_manage_before_rooms(jsonb)'::regprocedure) into definition;
 definition=replace(definition,'where actor_id=auth.uid() and practice=p->>''practice'' and sha256=p->>''sha256'';',
  'where actor_id=auth.uid() and practice=p->>''practice'' and sha256=p->>''sha256'' and room_file_id is null;');
 execute definition;
end $$;

create function ig_private.content_intake(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w public.ig_content_intakes; c public.ig_content; r public.ig_data_rooms; f public.ig_room_files;
 s public.ig_intake_sources; j public.ig_ai_jobs; saved jsonb; req uuid; kind text; practice text;
begin
 if auth.uid() is null or not ig_private.allowed('content.write') then raise exception 'Staff edit permission required' using errcode='42501';end if;
 if p->>'action'='begin' then
  req=(p->>'request_id')::uuid;kind=p->>'kind';practice=p->>'practice';
  if req is null or kind not in ('opportunity','product','project','page','practice','article','person','faq') then raise exception 'Choose a content type';end if;
  if not ig_private.allowed('nda.manage') or not ig_private.scope_allowed(practice,'write') or not ig_private.scope_allowed(practice,'data_rooms') then raise exception 'Content and data-room permissions are required for this practice' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended('content-intake:'||auth.uid()||':'||req,0));
  select * into w from public.ig_content_intakes where actor_id=auth.uid() and request_id=req;
  if w.id is not null then
   select * into c from public.ig_content where id=w.content_id;
   if c.kind<>kind or c.practice<>practice then raise exception 'This upload belongs to another content type. Start a new draft.';end if;
   return to_jsonb(w)||jsonb_build_object('version',c.version);
  end if;
  saved=ig_private.save_content(jsonb_build_object('kind',kind,'practice',practice,'slug','ig-opp-'||replace(gen_random_uuid()::text,'-',''),
   'title','Source material awaiting AI draft','summary','','body','','public_data','{}'::jsonb,'term_ids','[]'::jsonb));
  insert into public.ig_data_rooms(content_id,title,created_by) values((saved->>'id')::uuid,'Source material awaiting AI draft',auth.uid()) returning * into r;
  insert into public.ig_content_intakes(actor_id,request_id,content_id,room_id) values(auth.uid(),req,(saved->>'id')::uuid,r.id) returning * into w;
  perform ig_private.record_audit('content.intake_started',w.content_id::text,jsonb_build_object('room_id',r.id));
  return to_jsonb(w)||jsonb_build_object('version',saved->'version');
 elsif p->>'action'='room' then
  select * into c from public.ig_content where id=(p->>'content_id')::uuid for update;
  if c.id is null or not ig_private.allowed('nda.manage') or not ig_private.content_access(c.id,'data_rooms') then raise exception 'Data-room permission required' using errcode='42501';end if;
  select * into r from public.ig_data_rooms where content_id=c.id;
  if r.id is null then
   insert into public.ig_data_rooms(content_id,title,created_by) values(c.id,c.title,auth.uid()) returning * into r;
   perform ig_private.record_audit('room.created',r.id::text,jsonb_build_object('content_id',c.id));
  end if;
  return to_jsonb(r);
 end if;
 select * into w from public.ig_content_intakes where id=(p->>'id')::uuid for update;
 if w.id is null or w.actor_id<>auth.uid() or not ig_private.content_access(w.content_id,'write') or not ig_private.room_staff(w.room_id) then raise exception 'Source workspace permission required' using errcode='42501';end if;
 select * into c from public.ig_content where id=w.content_id for update;
 if p->>'action'='source' then
  if p->>'approved' is distinct from 'true' or coalesce(p->>'sha256','')!~'^[a-f0-9]{64}$' then raise exception 'Confirm source processing permission';end if;
  select * into f from public.ig_room_files where id=(p->>'file_id')::uuid and room_id=w.room_id and status='ready' and preview_for is null;
  if f.id is null or not exists(select 1 from storage.objects where bucket_id='ig-data-rooms' and name=f.object_key and (metadata->>'size')::bigint=f.bytes) then raise exception 'Complete the original file upload first';end if;
  if f.mime not in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/csv','text/plain','image/jpeg','image/png','image/webp') then raise exception 'This format can be kept in the room but is not supported for AI extraction';end if;
  select * into s from public.ig_intake_sources where room_file_id=f.id;
  if s.id is null then
   insert into public.ig_intake_sources(actor_id,practice,name,mime,size,sha256,path,room_file_id)
   values(auth.uid(),c.practice,right(f.name,150),f.mime,f.bytes,p->>'sha256',f.object_key,f.id) returning * into s;
  elsif s.sha256<>p->>'sha256' then raise exception 'Source integrity mismatch';end if;
  return to_jsonb(s);
 elsif p->>'action'='finish' then
  select * into j from public.ig_ai_jobs where id=(p->>'job_id')::uuid and actor_id=auth.uid() and status='ready' and practice=c.practice;
  if j.id is null or j.context->>'kind'<>'intake' or j.context->>'record_kind'<>c.kind or j.context->>'workspace_id' is distinct from w.id::text then raise exception 'Use the completed AI draft for this workspace';end if;
  if w.job_id=j.id then return to_jsonb(w)||jsonb_build_object('version',c.version);end if;
  if c.version is distinct from (p->>'version')::int then raise exception 'The record changed during generation. Review the current draft before applying AI changes.' using errcode='40001';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(j.context->'sources','[]')) x where not exists(
   select 1 from public.ig_intake_sources s join public.ig_room_files f on f.id=s.room_file_id
   where s.id=(x->>'source_id')::uuid and f.room_id=w.room_id and ig_private.intake_source_allowed(s.id))) then raise exception 'AI sources must belong to this data room';end if;
  saved=ig_private.save_content((p->'content')||jsonb_build_object('id',c.id,'version',c.version,'kind',c.kind,'practice',c.practice));
  update public.ig_content_intakes set job_id=j.id,review=j.draft where id=w.id returning * into w;
  update public.ig_data_rooms set title=saved->>'title',version=version+1,updated_at=now() where id=w.room_id;
  perform ig_private.record_audit('content.ai_draft_saved',c.id::text,jsonb_build_object('job_id',j.id,'room_id',w.room_id));
  return to_jsonb(w)||jsonb_build_object('version',saved->'version');
 elsif p->>'action'='media' then
  if not exists(select 1 from public.ig_source_media m where m.id=(p->>'media_id')::uuid and m.practice=c.practice and m.state='ready' and not m.published) then raise exception 'Choose a private image from this practice';end if;
  update public.ig_content_intakes set media_id=(p->>'media_id')::uuid where id=w.id returning * into w;
  return to_jsonb(w);
 end if;
 raise exception 'Unsupported content intake action';
end $$;
create function public.ig_content_intake(p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select ig_private.content_intake(p) $$;
revoke all on function ig_private.content_intake(jsonb),public.ig_content_intake(jsonb),ig_private.intake_sources_manage(jsonb) from public,anon;
grant execute on function ig_private.content_intake(jsonb),public.ig_content_intake(jsonb),ig_private.intake_sources_manage(jsonb) to authenticated;
