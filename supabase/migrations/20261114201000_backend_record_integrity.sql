-- Keep the row lock, version checks and access rules in the existing save path.
-- An omitted taxonomy selection preserves it. An explicit empty selection clears it.
do $migration$
declare
  original text;
  revised text;
  before_tags text := ' delete from public.ig_content_tags where content_id=item.id;';
  after_tags text := ' insert into public.ig_content_revisions(content_id,version,snapshot,actor_id)';
  after_lock text := '  if item.id is null then raise exception ''Content not found''; end if;';
  intake_call text := 'saved=ig_private.save_content((p->''content'')||jsonb_build_object';
begin
  original := pg_get_functiondef('ig_private.save_content_unscoped(jsonb)'::regprocedure);
  if strpos(original,before_tags)=0 or strpos(original,after_tags)=0 or strpos(original,after_lock)=0 then
    raise exception 'Unexpected content save definition. Check the current migration.';
  end if;
  revised := replace(original, after_lock, after_lock || E'\n  if item.deleted_at is not null then raise exception ''Restore the record from Deleted before editing.''; end if;');
  revised := replace(revised, before_tags, E' if p ? ''term_ids'' then\n' || before_tags);
  revised := replace(revised, after_tags, E' end if;\n' || after_tags);
  execute revised;

  original := pg_get_functiondef('ig_private.content_intake(jsonb)'::regprocedure);
  if strpos(original,intake_call)=0 then raise exception 'Unexpected content intake definition'; end if;
  execute replace(original,intake_call,'saved=ig_private.save_content(((p->''content'') - ''term_ids'')||jsonb_build_object');
end
$migration$;

-- A verified buyer can submit a requirement before completing a business profile.
do $migration$
declare
  original text := pg_get_functiondef('ig_private.procurement(jsonb)'::regprocedure);
  client_name text := 'coalesce(nullif(me.company,''''),me.display_name,''Website customer'')';
  contact_name text := 'coalesce(nullif(me.display_name,''''),''Website customer'')';
begin
  if strpos(original,client_name)=0 or strpos(original,contact_name)=0 then
    raise exception 'Unexpected procurement registration definition';
  end if;
  original := replace(original,client_name,
    'case when length(trim(me.company)) >= 2 then trim(me.company) when length(trim(me.display_name)) >= 2 then trim(me.display_name) else ''Website customer'' end');
  execute replace(original,contact_name,'coalesce(nullif(trim(me.display_name),''''),''Website customer'')');
end
$migration$;
