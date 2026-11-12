alter table public.ig_room_files drop constraint ig_room_files_mime_check;
alter table public.ig_room_files add constraint ig_room_files_mime_check check(mime in (
'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/rtf','text/plain',
'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv',
'application/vnd.oasis.opendocument.spreadsheet','application/vnd.oasis.opendocument.text','application/vnd.oasis.opendocument.presentation',
'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
'image/jpeg','image/png','image/webp','image/gif','image/tiff','image/bmp','application/zip'));
alter table public.ig_room_files add column preview_for uuid references public.ig_room_files(id);
create index ig_room_preview_parent on public.ig_room_files(preview_for);
create unique index ig_room_one_ready_preview on public.ig_room_files(preview_for) where preview_for is not null and status='ready';

do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.room_manage(jsonb)'::regprocedure) into s;
 s=replace(s,'fid=gen_random_uuid();', 'if nullif(p->>''preview_for'','''') is not null and (p->>''mime''<>''application/pdf'' or not exists(select 1 from public.ig_room_files where id=(p->>''preview_for'')::uuid and room_id=d.id and preview_for is null and status=''ready'')) then raise exception ''Preview must be a PDF for a ready file in this room''; end if; fid=gen_random_uuid();');
 s=replace(s,'mime,bytes,download_enabled,created_by)','mime,bytes,download_enabled,created_by,preview_for)');
 s=replace(s,'coalesce((p->>''download_enabled'')::bool,false),auth.uid())','case when nullif(p->>''preview_for'','''') is not null then false else coalesce((p->>''download_enabled'')::bool,false) end,auth.uid(),nullif(p->>''preview_for'','''')::uuid)');
 s=replace(s,'update public.ig_room_files set status=''ready'',version=version+1 where id=f.id', 'if f.preview_for is not null then update public.ig_room_files set status=''archived'',version=version+1 where preview_for=f.preview_for and status=''ready'' and id<>f.id; end if; update public.ig_room_files set status=''ready'',version=version+1 where id=f.id');
 execute s;
 select pg_get_functiondef('ig_private.room_dashboard(jsonb)'::regprocedure) into s;
 s=replace(s,'''can_download'',ig_private.room_download(f.id)', '''has_preview'',(f.mime in (''application/pdf'',''image/jpeg'',''image/png'',''image/webp'') or exists(select 1 from public.ig_room_files pr where pr.preview_for=f.id and pr.status=''ready'')),''can_download'',ig_private.room_download(f.id)');
 s=replace(s,'where f.room_id=d.id and f.status=''ready''','where f.room_id=d.id and f.status=''ready'' and f.preview_for is null');
 execute s;
 select pg_get_functiondef('ig_private.room_authorize(jsonb)'::regprocedure) into s;
 s=replace(s,'declare f public.ig_room_files;','declare original_id uuid; f public.ig_room_files;');
 s=replace(s,'staff=ig_private.allowed(''nda.manage'');','staff=ig_private.allowed(''nda.manage''); original_id=(p->>''id'')::uuid;');
 s=replace(s,'or f.mime not in (''application/pdf'',''image/jpeg'',''image/png'',''image/webp'')','');
 s=replace(s,'else raise exception ''Unsupported file action'';', 'if f.mime not in (''application/pdf'',''image/jpeg'',''image/png'',''image/webp'') then select * into f from public.ig_room_files where preview_for=original_id and status=''ready''; if f.id is null then raise exception ''A PDF preview has not been uploaded for this file''; end if; end if; else raise exception ''Unsupported file action'';');
 s=replace(s,'''room.file_''||(p->>''action''),f.id::text','''room.file_''||(p->>''action''),original_id::text');
 execute s;
end $migration$;
