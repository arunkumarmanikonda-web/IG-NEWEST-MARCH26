-- The public snapshot is the source of truth for website visibility. A record
-- can retain its previously published version number after withdrawal.
do $migration$
declare
  definition text := pg_get_functiondef('ig_private.admin_overview()'::regprocedure);
  old_count text := 'from public.ig_content where published_version is not null and ig_private.scope_allowed(practice,''read'')';
  live_count text := 'from public.ig_public_content s join public.ig_content c on c.id=s.id where ig_private.scope_allowed(c.practice,''read'')';
begin
  if strpos(definition,old_count)=0 then raise exception 'Unexpected dashboard overview definition'; end if;
  execute replace(definition,old_count,live_count);
end
$migration$;
