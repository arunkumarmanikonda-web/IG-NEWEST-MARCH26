-- A file above the scanner's hard limit needs review, never an indefinitely queued job.
do $$
declare spec text=pg_get_functiondef('public.ig_file_processing(text,jsonb)'::regprocedure);
begin
 if position('if a=''claim'' then' in spec)=0 then raise exception 'Review processing claim';end if;
 spec=replace(spec,'if a=''claim'' then',$body$if a='claim' then
  with oversized as (
   update ig_private.file_processing_jobs q set state='held',lease=null,finished_at=now(),
    report='{"scan":"held","error":"Original exceeds the 1 GiB automated scan limit; administrator review required"}'
   from public.ig_room_files r where r.id=q.file_id and r.status='ready' and q.state='queued' and r.bytes>1073741824
   returning q.file_id)
  update public.ig_room_files set processing_status='held',processing_detail='Original exceeds the 1 GiB automated scan limit; administrator review required'
   where id in(select file_id from oversized);
 $body$);
 execute spec;
end $$;
notify pgrst,'reload schema';
