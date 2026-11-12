create table public.ig_room_folders(
 id uuid primary key default gen_random_uuid(),room_id uuid not null references public.ig_data_rooms(id),
 path text not null check(length(path) between 1 and 200 and path !~ '\\.\\.' and path !~ '[\\\\]' and path !~ '^/|/$|//'),
 created_at timestamptz not null default now(),unique(room_id,path)
);
alter table public.ig_room_folders enable row level security;
revoke all on public.ig_room_folders from anon,authenticated;
grant select on public.ig_room_folders to authenticated;
create policy staff_read on public.ig_room_folders for select to authenticated using((select ig_private.allowed('nda.manage')));
alter function ig_private.room_manage(jsonb) rename to room_manage_core;
revoke all on function ig_private.room_manage_core(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare part text; prefix text=''; target text; room uuid; result jsonb;
begin
 if not ig_private.allowed('nda.manage') then raise exception 'Administrator permission and MFA required' using errcode='42501'; end if;
 if p->>'action'='folder_create' then
  room=(p->>'room_id')::uuid;target=trim(coalesce(p->>'path',''));
  if not exists(select 1 from public.ig_data_rooms where id=room and active) then raise exception 'Active room required'; end if;
  if length(target) not between 1 and 200 or target~'\\.\\.|[\\\\]|^/|/$|//' or cardinality(string_to_array(target,'/'))>12 then raise exception 'Use a relative folder path up to 200 characters and 12 levels'; end if;
  foreach part in array string_to_array(target,'/') loop
   if trim(part)='' or part='.' then raise exception 'Invalid folder name'; end if;
   prefix=prefix||case when prefix='' then '' else '/' end||part;
   insert into public.ig_room_folders(room_id,path) values(room,prefix) on conflict(room_id,path) do nothing;
  end loop;
  select to_jsonb(f) into result from public.ig_room_folders f where room_id=room and path=target;
  perform ig_private.record_audit('room.folder_created',result->>'id');
  return result;
 elsif p->>'action'='folder_delete' then
  select room_id,path into room,target from public.ig_room_folders where id=(p->>'id')::uuid for update;
  if room is null then raise exception 'Folder not found'; end if;
  if exists(select 1 from public.ig_room_folders where room_id=room and left(path,length(target)+1)=target||'/') or exists(select 1 from public.ig_room_files where room_id=room and status<>'archived' and (folder=target or left(folder,length(target)+1)=target||'/')) then raise exception 'Move or archive the folder contents and remove subfolders first'; end if;
  delete from public.ig_room_folders where id=(p->>'id')::uuid;
  perform ig_private.record_audit('room.folder_deleted',p->>'id');
  return jsonb_build_object('ok',true);
 end if;
 if p->>'action'='upload_prepare' and trim(coalesce(p->>'folder',''))<>'' then
  perform ig_private.room_manage(jsonb_build_object('action','folder_create','room_id',p->>'room_id','path',p->>'folder'));
 end if;
 return ig_private.room_manage_core(p);
end $$;
create or replace function public.ig_room_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_manage(p)$$;
revoke all on function ig_private.room_manage(jsonb) from public,anon;
grant execute on function ig_private.room_manage(jsonb) to authenticated;

do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.room_dashboard(jsonb)'::regprocedure) into s;
 s=replace(s,'''files'',(select','''folders'',(select coalesce(jsonb_agg(jsonb_build_object(''id'',rf.id,''path'',rf.path) order by rf.path),''[]'') from public.ig_room_folders rf where rf.room_id=d.id),''files'',(select');
 execute s;
 select pg_get_functiondef('ig_private.room_authorize(jsonb)'::regprocedure) into s;
 s=replace(s,')>120 then',')>(case when staff then 600 else 120 end) then');
 execute s;
end $migration$;
