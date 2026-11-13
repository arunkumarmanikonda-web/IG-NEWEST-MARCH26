-- Source uploads bypass application request-body limits. Originals never become public.
create table public.ig_intake_sources (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 practice text not null check(practice in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate')),
 name text not null check(length(name) between 1 and 150),
 mime text not null,
 size bigint not null check(size > 0),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 path text not null unique,
 created_at timestamptz not null default now(),
 unique(actor_id,practice,sha256)
);
create index ig_intake_sources_actor on public.ig_intake_sources(actor_id,created_at desc);
create index ig_intake_sources_practice on public.ig_intake_sources(practice);
alter table public.ig_intake_sources enable row level security;
revoke all on public.ig_intake_sources from public,anon,authenticated;
grant select on public.ig_intake_sources to authenticated;

create function ig_private.intake_source_allowed(source uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and ig_private.allowed('content.write')
 and exists(select 1 from public.ig_intake_sources s where s.id=source
  and s.actor_id=auth.uid() and ig_private.scope_allowed(s.practice,'write'))
$$;
revoke all on function ig_private.intake_source_allowed(uuid) from public,anon;
grant execute on function ig_private.intake_source_allowed(uuid) to authenticated;
create policy intake_source_read on public.ig_intake_sources for select to authenticated using(ig_private.intake_source_allowed(id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ig-intake-sources','ig-intake-sources',false,null,array[
 'application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
 'text/csv','text/plain','image/jpeg','image/png','image/webp']);
create policy intake_source_upload on storage.objects for insert to authenticated with check(
 bucket_id='ig-intake-sources' and exists(select 1 from public.ig_intake_sources s
 where s.path=storage.objects.name and ig_private.intake_source_allowed(s.id)));
create policy intake_source_download on storage.objects for select to authenticated using(
 bucket_id='ig-intake-sources' and exists(select 1 from public.ig_intake_sources s
 where s.path=storage.objects.name and ig_private.intake_source_allowed(s.id)));
-- No update/delete/public policy: an uploaded source is immutable and no public URL is issued.
create function ig_private.intake_sources_manage(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.ig_intake_sources; sid uuid=gen_random_uuid(); ids uuid[]; result jsonb='[]'; ext text; expected_mime text;
begin
 if auth.uid() is null or not ig_private.allowed('content.write') or not ig_private.scope_allowed(p->>'practice','write') then
  raise exception 'Staff edit permission and MFA required' using errcode='42501';end if;
 if p->>'action'='prepare' then
  if p->>'approved' is distinct from 'true' then raise exception 'Confirm source processing permission';end if;
  ext=lower(substring(p->>'name' from '\.([^.]+)$'));
  expected_mime=case ext when 'pdf' then 'application/pdf'
   when 'docx' then 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
   when 'xlsx' then 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
   when 'pptx' then 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
   when 'csv' then 'text/csv' when 'txt' then 'text/plain'
   when 'jpg' then 'image/jpeg' when 'jpeg' then 'image/jpeg' when 'png' then 'image/png' when 'webp' then 'image/webp' end;
  if expected_mime is null or p->>'mime' is distinct from expected_mime or coalesce(p->>'size','')!~'^[0-9]+$' then raise exception 'Unsupported source file';end if;
  perform pg_advisory_xact_lock(hashtextextended('intake-sources:'||auth.uid(),0));
  select * into s from public.ig_intake_sources where actor_id=auth.uid() and practice=p->>'practice' and sha256=p->>'sha256';
  if s.id is not null then
   if s.size is distinct from (p->>'size')::bigint or s.mime is distinct from expected_mime then raise exception 'Source metadata mismatch';end if;
  else
   if (select count(*) from public.ig_intake_sources where actor_id=auth.uid() and created_at>now()-interval '1 day')>=40 then
    raise exception 'Daily source upload limit reached. Reuse an existing upload or continue tomorrow.' using errcode='P0429';end if;
   insert into public.ig_intake_sources(id,actor_id,practice,name,mime,size,sha256,path)
   values(sid,auth.uid(),p->>'practice',p->>'name',expected_mime,(p->>'size')::bigint,p->>'sha256',auth.uid()||'/'||sid||'.'||ext) returning * into s;
   perform ig_private.record_audit('intake.source_registered',s.id::text,jsonb_build_object('practice',s.practice,'size',s.size));
  end if;
  return to_jsonb(s)||jsonb_build_object('uploaded',exists(select 1 from storage.objects where bucket_id='ig-intake-sources' and name=s.path and (metadata->>'size')::bigint=s.size));
 elsif p->>'action'='resolve' then
  if jsonb_typeof(p->'ids') is distinct from 'array' or jsonb_array_length(p->'ids') not between 1 and 8 then raise exception 'Choose 1–8 uploaded sources';end if;
  select array_agg(value::uuid) into ids from jsonb_array_elements_text(p->'ids');
  if (select count(distinct x) from unnest(ids)x)<>cardinality(ids) then raise exception 'Duplicate source';end if;
  foreach sid in array ids loop
   select * into s from public.ig_intake_sources where id=sid;
   if s.id is null or s.practice is distinct from p->>'practice' or not ig_private.intake_source_allowed(s.id) then
    raise exception 'Source permission required' using errcode='42501';end if;
   if not exists(select 1 from storage.objects where bucket_id='ig-intake-sources' and name=s.path and (metadata->>'size')::bigint=s.size) then
    raise exception 'Source upload incomplete. Retry the same file.';end if;
   result=result||jsonb_build_array(to_jsonb(s));
  end loop;
  return result;
 end if;
 raise exception 'Unsupported source action';
end $$;
create function public.ig_intake_sources_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.intake_sources_manage(p)$$;
revoke all on function ig_private.intake_sources_manage(jsonb),public.ig_intake_sources_manage(jsonb) from public,anon;
grant execute on function ig_private.intake_sources_manage(jsonb),public.ig_intake_sources_manage(jsonb) to authenticated;
