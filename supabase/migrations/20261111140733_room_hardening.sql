alter table ig_private.room_config enable row level security;
alter table public.ig_room_folders add constraint ig_room_path_safe check(strpos(path,'..')=0 and strpos(path,chr(92))=0 and path !~ '[[:cntrl:]]');
alter table public.ig_room_files add constraint ig_room_folder_safe check(strpos(folder,'..')=0 and strpos(folder,chr(92))=0 and folder !~ '[[:cntrl:]]');
alter table public.ig_room_files add constraint ig_room_name_safe check(strpos(name,'/')=0 and strpos(name,chr(92))=0 and name !~ '[[:cntrl:]]');
do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.room_manage(jsonb)'::regprocedure) into s;
 s=replace(s,'if trim(part)='''' or part=''.'' then','if trim(part)='''' or part=''.'' or strpos(part,''..'')>0 or strpos(part,chr(92))>0 or part~''[[:cntrl:]]'' then');
 execute s;
 select pg_get_functiondef('ig_private.room_manage_core(jsonb)'::regprocedure) into s;
 s=replace(s,'if exp is null or exp<=now() or exp>least(now()+interval ''1 year'',n.accepted_at+interval ''3 years'') then raise exception ''Invalid access expiry'';',
 'if exp is null or ((p->>''active'')::boolean and (exp<=now() or exp>least(now()+interval ''1 year'',n.accepted_at+interval ''3 years''))) then raise exception ''Invalid access expiry'';');
 execute s;
end $migration$;
