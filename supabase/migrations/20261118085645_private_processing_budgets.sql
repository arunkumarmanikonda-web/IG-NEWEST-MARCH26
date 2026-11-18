-- Leave large originals for a worker with a full time allowance.
do $$
declare spec text=pg_get_functiondef('public.ig_file_processing(text,jsonb)'::regprocedure);
begin
 if position('where r.status=''ready'' and' in spec)=0 then raise exception 'Review processing claim filter';end if;
 spec=replace(spec,'where r.status=''ready'' and','where r.status=''ready'' and r.bytes<=greatest(1,least(1073741824,coalesce((p->>''max_bytes'')::bigint,1073741824))) and');
 execute spec;
end $$;
notify pgrst,'reload schema';
