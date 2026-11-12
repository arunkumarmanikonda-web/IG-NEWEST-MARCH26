-- Every opportunity can have one private room. No direct client storage policies are created.
create table public.ig_data_rooms (
 id uuid primary key default gen_random_uuid(),
 content_id uuid not null unique references public.ig_content(id),
 title text not null check(length(title) between 1 and 180),
 active boolean not null default true,
 version int not null default 1,
 created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.ig_room_files (
 id uuid primary key default gen_random_uuid(),room_id uuid not null references public.ig_data_rooms(id),
 name text not null check(length(name) between 1 and 180 and name !~ '[/\\\\]'),
 folder text not null default '' check(length(folder)<=200 and folder !~ '\\.\\.' and folder !~ '[\\\\]'),
 object_key text not null unique,mime text not null,
 bytes bigint not null check(bytes between 1 and 20971520),
 status text not null default 'pending' check(status in ('pending','ready','archived')),
 download_enabled boolean not null default false,version int not null default 1,
 created_by uuid references auth.users(id),created_at timestamptz not null default now(),
 check(mime in ('application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','text/csv'))
);
create table public.ig_room_grants (
 id uuid primary key default gen_random_uuid(),room_id uuid not null references public.ig_data_rooms(id),
 user_id uuid not null references auth.users(id),nda_request_id uuid not null references public.ig_nda_requests(id),
 active boolean not null default true,download_mode text not null default 'none' check(download_mode in ('none','all','selected')),
 expires_at timestamptz not null,version int not null default 1,
 created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(room_id,user_id)
);
create table public.ig_room_file_rules (
 grant_id uuid not null references public.ig_room_grants(id) on delete cascade,
 file_id uuid not null references public.ig_room_files(id) on delete cascade,
 allow_download boolean not null,primary key(grant_id,file_id)
);
create table ig_private.room_config(id boolean primary key default true check(id),broker_secret_hash text not null);
revoke all on ig_private.room_config from public,anon,authenticated;
create index ig_room_creator on public.ig_data_rooms(created_by);
create index ig_room_file_room on public.ig_room_files(room_id);
create index ig_room_file_creator on public.ig_room_files(created_by);
create index ig_room_grant_user on public.ig_room_grants(user_id);
create index ig_room_grant_nda on public.ig_room_grants(nda_request_id);
create index ig_room_grant_creator on public.ig_room_grants(created_by);
create index ig_room_rule_file on public.ig_room_file_rules(file_id);

create function ig_private.room_access(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('nda.manage') or (
 ig_private.allowed('account') and not exists(select 1 from public.ig_profiles where id=auth.uid() and must_change_password)
 and exists(select 1 from public.ig_room_grants g
 join public.ig_data_rooms d on d.id=g.room_id
 join public.ig_nda_requests n on n.id=g.nda_request_id
 where d.id=room and d.active and g.user_id=auth.uid() and g.active and g.expires_at>now()
 and n.user_id=auth.uid() and n.content_id=d.content_id and n.status='approved' and n.accepted_at>now()-interval '3 years'))
$$;
create function ig_private.room_download(file uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('nda.manage') or exists(
 select 1 from public.ig_room_files f join public.ig_room_grants g on g.room_id=f.room_id
 left join public.ig_room_file_rules r on r.grant_id=g.id and r.file_id=f.id
 where f.id=file and f.status='ready' and f.download_enabled and g.user_id=auth.uid()
 and g.active and g.expires_at>now() and ig_private.room_access(f.room_id)
 and g.download_mode<>'none' and coalesce(r.allow_download,g.download_mode='all'))
$$;
create function ig_private.room_broker_valid(secret text) returns boolean language sql stable security definer set search_path='' as $$
 select length(secret)>=40 and exists(select 1 from ig_private.room_config where broker_secret_hash=encode(extensions.digest(convert_to(secret,'UTF8'),'sha256'),'hex'))
$$;
revoke all on function ig_private.room_broker_valid(text) from public,anon,authenticated;
revoke all on function ig_private.room_access(uuid),ig_private.room_download(uuid) from public,anon;
grant execute on function ig_private.room_access(uuid),ig_private.room_download(uuid) to authenticated;
do $$declare tab text;begin
 foreach tab in array array['ig_data_rooms','ig_room_files','ig_room_grants','ig_room_file_rules'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from anon,authenticated',tab);
 execute format('grant select on public.%I to authenticated',tab);
 execute format('create policy staff_read on public.%I for select to authenticated using((select ig_private.allowed(''nda.manage'')))',tab);
 end loop;
end $$;

create function ig_private.room_dashboard(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not ig_private.allowed('account') then raise exception 'Verified account and policy acceptance required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'content_id',d.content_id,
 'files',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'folder',f.folder,'mime',f.mime,'bytes',f.bytes,'can_download',ig_private.room_download(f.id)) order by f.folder,f.name),'[]') from public.ig_room_files f where f.room_id=d.id and f.status='ready')) order by d.title),'[]')
 into result from public.ig_data_rooms d where d.active and ig_private.room_access(d.id) and (nullif(p->>'id','') is null or d.id=(p->>'id')::uuid);
 return result;
end $$;
create function public.ig_room_dashboard(p jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_dashboard(p)$$;

create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.ig_data_rooms; f public.ig_room_files; g public.ig_room_grants; n public.ig_nda_requests; result jsonb; fid uuid; exp timestamptz;
begin
 if not ig_private.allowed('nda.manage') then raise exception 'Administrator permission and MFA required' using errcode='42501'; end if;
 if p->>'action'='create' then
  if not exists(select 1 from public.ig_content where id=(p->>'content_id')::uuid and kind='opportunity') then raise exception 'Choose a real estate opportunity'; end if;
  insert into public.ig_data_rooms(content_id,title,created_by) values((p->>'content_id')::uuid,trim(p->>'title'),auth.uid()) returning * into d;
  result=to_jsonb(d);
 elsif p->>'action'='room_update' then
  select * into d from public.ig_data_rooms where id=(p->>'id')::uuid for update;
  if d.id is null or d.version is distinct from (p->>'version')::int then raise exception 'Room changed. Reload.' using errcode='40001'; end if;
  update public.ig_data_rooms set title=trim(p->>'title'),active=(p->>'active')::bool,version=version+1,updated_at=now() where id=d.id returning * into d;result=to_jsonb(d);
 elsif p->>'action'='upload_prepare' then
  select * into d from public.ig_data_rooms where id=(p->>'room_id')::uuid and active;
  if d.id is null then raise exception 'Active room required'; end if;
  fid=gen_random_uuid();
  insert into public.ig_room_files(id,room_id,name,folder,object_key,mime,bytes,download_enabled,created_by)
  values(fid,d.id,trim(p->>'name'),trim(coalesce(p->>'folder','')),d.id::text||'/'||fid::text,p->>'mime',(p->>'bytes')::bigint,coalesce((p->>'download_enabled')::bool,false),auth.uid()) returning * into f;result=to_jsonb(f);
 elsif p->>'action' in ('upload_complete','file_update') then
  select * into f from public.ig_room_files where id=(p->>'id')::uuid for update;
  if f.id is null or f.version is distinct from (p->>'version')::int then raise exception 'File changed. Reload.' using errcode='40001'; end if;
  if p->>'action'='upload_complete' then
   if not ig_private.room_broker_valid(p->>'broker_secret') or f.status<>'pending' then raise exception 'Verified upload required' using errcode='42501'; end if;
   update public.ig_room_files set status='ready',version=version+1 where id=f.id returning * into f;
  else
   if p->>'status' not in ('ready','archived') or f.status='pending' then raise exception 'Unsupported file state'; end if;
   update public.ig_room_files set status=p->>'status',download_enabled=(p->>'download_enabled')::bool,version=version+1 where id=f.id returning * into f;
  end if;result=to_jsonb(f);
 elsif p->>'action'='grant' then
  select * into d from public.ig_data_rooms where id=(p->>'room_id')::uuid and active;
  select * into n from public.ig_nda_requests where id=(p->>'nda_request_id')::uuid and content_id=d.content_id and status='approved' and accepted_at>now()-interval '3 years';
  if n.id is null then raise exception 'An approved, signed NDA for this exact project is required'; end if;
  if not exists(select 1 from public.ig_profiles where id=n.user_id and status='active' and policy_version='2026-11-11') then raise exception 'Active client registration required'; end if;
  exp=(p->>'expires_at')::timestamptz;
  if exp is null or exp<=now() or exp>least(now()+interval '1 year',n.accepted_at+interval '3 years') then raise exception 'Access expiry must be within one year and the NDA term'; end if;
  insert into public.ig_room_grants(room_id,user_id,nda_request_id,download_mode,expires_at,created_by)
  values(d.id,n.user_id,n.id,p->>'download_mode',exp,auth.uid()) returning * into g;result=to_jsonb(g);
 elsif p->>'action'='grant_update' then
  select * into g from public.ig_room_grants where id=(p->>'id')::uuid for update;
  if g.id is null or g.version is distinct from (p->>'version')::int then raise exception 'Access changed. Reload.' using errcode='40001'; end if;
  select * into n from public.ig_nda_requests where id=g.nda_request_id;
  exp=(p->>'expires_at')::timestamptz;
  if exp is null or exp<=now() or exp>least(now()+interval '1 year',n.accepted_at+interval '3 years') then raise exception 'Invalid access expiry'; end if;
  if (p->>'active')::bool and n.status<>'approved' then raise exception 'Approved NDA required'; end if;
  update public.ig_room_grants set active=(p->>'active')::bool,download_mode=p->>'download_mode',expires_at=exp,version=version+1,updated_at=now() where id=g.id returning * into g;
  result=to_jsonb(g);
 elsif p->>'action'='file_rule' then
  select * into g from public.ig_room_grants where id=(p->>'grant_id')::uuid for update;
  if g.id is null or g.version is distinct from (p->>'version')::int then raise exception 'Access changed. Reload.' using errcode='40001'; end if;
  select * into f from public.ig_room_files where id=(p->>'file_id')::uuid and room_id=g.room_id;
  if f.id is null then raise exception 'File does not belong to this room'; end if;
  if p->>'rule'='inherit' then delete from public.ig_room_file_rules where grant_id=g.id and file_id=f.id;
  elsif p->>'rule' in ('allow','deny') then
   insert into public.ig_room_file_rules(grant_id,file_id,allow_download) values(g.id,f.id,p->>'rule'='allow') on conflict(grant_id,file_id) do update set allow_download=excluded.allow_download;
  else raise exception 'Invalid file permission'; end if;
  update public.ig_room_grants set version=version+1,updated_at=now() where id=g.id returning * into g;result=to_jsonb(g);
 else raise exception 'Unsupported room action'; end if;
 perform ig_private.record_audit('room.'||(p->>'action'),coalesce(result->>'id',fid::text));
 return result;
end $$;
create function public.ig_room_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_manage(p)$$;

create function ig_private.room_authorize(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.ig_room_files; staff boolean; w timestamptz;
begin
 if not ig_private.valid_identity() then raise exception 'Verified sign-in required' using errcode='42501'; end if;
 staff=ig_private.allowed('nda.manage');
 select * into f from public.ig_room_files where id=(p->>'id')::uuid;
 if f.id is null or not ig_private.room_access(f.room_id) then raise exception 'File access denied' using errcode='42501'; end if;
 if p->>'action'='upload' then
  if not staff or f.status<>'pending' then raise exception 'Upload not permitted' using errcode='42501'; end if;
 elsif p->>'action'='download' then
  if f.status<>'ready' or not ig_private.room_download(f.id) then raise exception 'Downloads are not permitted for this file' using errcode='42501'; end if;
 elsif p->>'action'='preview_source' then
  if f.status<>'ready' or not ig_private.room_broker_valid(p->>'broker_secret') or f.mime not in ('application/pdf','image/jpeg','image/png','image/webp') then raise exception 'Preview not permitted' using errcode='42501'; end if;
 else raise exception 'Unsupported file action'; end if;
 -- Bound repeated expensive preview requests to 120/minute per account.
 w=date_trunc('minute',now());
 insert into ig_private.rate_limits(key,window_start,count) values('room:'||auth.uid()::text,w,1)
 on conflict(key) do update set count=case when rate_limits.window_start=w then rate_limits.count+1 else 1 end,window_start=w;
 if (select count from ig_private.rate_limits where key='room:'||auth.uid()::text)>120 then raise exception 'Too many file requests. Please wait a minute.'; end if;
 perform ig_private.record_audit('room.file_'||(p->>'action'),f.id::text);
 return to_jsonb(f);
end $$;
create function public.ig_room_authorize(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_authorize(p)$$;
revoke all on function ig_private.room_dashboard(jsonb),ig_private.room_manage(jsonb),ig_private.room_authorize(jsonb),public.ig_room_dashboard(jsonb),public.ig_room_manage(jsonb),public.ig_room_authorize(jsonb) from public,anon;
grant execute on function ig_private.room_dashboard(jsonb),ig_private.room_manage(jsonb),ig_private.room_authorize(jsonb),public.ig_room_dashboard(jsonb),public.ig_room_manage(jsonb),public.ig_room_authorize(jsonb) to authenticated;
