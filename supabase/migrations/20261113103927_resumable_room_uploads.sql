-- Remove input byte ceilings while preserving private storage and all access checks.
alter table public.ig_room_files drop constraint ig_room_files_bytes_check;
alter table public.ig_room_files add constraint ig_room_files_bytes_check check(bytes>=1 and bytes<=9007199254740991);
update storage.buckets set file_size_limit=null where id='ig-data-rooms' and public=false;

CREATE OR REPLACE FUNCTION ig_private.room_authorize(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare original_id uuid; f public.ig_room_files; staff boolean; w timestamptz;
begin
 if not ig_private.valid_identity() then raise exception 'Verified sign-in required' using errcode='42501'; end if;
  original_id=(p->>'id')::uuid;
 select * into f from public.ig_room_files where id=(p->>'id')::uuid;
 staff=ig_private.room_staff(f.room_id); if f.id is null or not ig_private.room_access(f.room_id) then raise exception 'File access denied' using errcode='42501'; end if;
 if p->>'action'='upload' then
  if not staff or f.status<>'pending' then raise exception 'Upload not permitted' using errcode='42501'; end if;
 elsif p->>'action'='download' then
  if f.status<>'ready' or not ig_private.room_download(f.id) then raise exception 'Downloads are not permitted for this file' using errcode='42501'; end if;
 elsif p->>'action'='preview_source' then
  if f.status<>'ready' or not ig_private.room_broker_valid(p->>'broker_secret')  then raise exception 'Preview not permitted' using errcode='42501'; end if;
 if f.bytes>20971520 or f.mime not in ('application/pdf','image/jpeg','image/png','image/webp') then select * into f from public.ig_room_files where preview_for=original_id and status='ready'; if f.id is null then raise exception 'An optimised PDF preview has not been uploaded for this file'; end if; end if; else raise exception 'Unsupported file action'; end if;
 -- Bound repeated expensive preview requests to 120/minute per account.
 w=date_trunc('minute',now());
 insert into ig_private.rate_limits(key,window_start,count) values('room:'||auth.uid()::text,w,1)
 on conflict(key) do update set count=case when rate_limits.window_start=w then rate_limits.count+1 else 1 end,window_start=w;
 if (select count from ig_private.rate_limits where key='room:'||auth.uid()::text)>(case when staff then 600 else 120 end) then raise exception 'Too many file requests. Please wait a minute.'; end if;
 perform ig_private.record_audit('room.file_'||(p->>'action'),original_id::text);
 return to_jsonb(f);
end $function$


