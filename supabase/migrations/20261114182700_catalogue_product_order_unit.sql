-- The RFQ unit is editable and distinct from electrical specifications,
-- carton quantities and the supplier's pricing unit.
do $$
declare original text; updated text;
begin
  original=pg_get_functiondef('ig_private.catalogue_manage(jsonb)'::regprocedure);
  updated=replace(original,$old$'uom',v->>'uom'$old$,
    $new$'uom',coalesce(nullif(btrim(v->>'uom'),''),'each')$new$);
  if updated=original then raise exception 'Catalogue product fields changed'; end if;
  execute updated;
end $$;

with fixed as (
  update public.ig_content c set public_data=jsonb_set(public_data,'{uom}','"each"'),
    version=version+1,updated_at=now(),updated_by=null
  where c.kind='product' and c.practice='horeca' and c.status='draft' and c.published_version is null
    and nullif(btrim(public_data->>'uom'),'') is null
    and exists(select 1 from public.ig_catalogue_items i where i.content_id=c.id)
  returning c.*
), revisions as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
)
insert into public.ig_audit(action,entity_id,detail)
select 'catalogue.unit_repaired',content_id::text,jsonb_build_object('version',version) from revisions;
