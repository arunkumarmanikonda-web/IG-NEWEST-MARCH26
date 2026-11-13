-- Table aliases must not shadow PL/pgSQL row variables.
do $$ declare definition text; begin
 select pg_get_functiondef('ig_private.content_intake(jsonb)'::regprocedure) into definition;
 definition=replace(definition,'select 1 from public.ig_intake_sources s join public.ig_room_files f on f.id=s.room_file_id','select 1 from public.ig_intake_sources src join public.ig_room_files rf on rf.id=src.room_file_id');
 definition=replace(definition,'where s.id=(x->>''source_id'')::uuid and f.room_id=w.room_id and ig_private.intake_source_allowed(s.id)','where src.id=(x->>''source_id'')::uuid and rf.room_id=w.room_id and ig_private.intake_source_allowed(src.id)');
 execute definition;
end $$;
