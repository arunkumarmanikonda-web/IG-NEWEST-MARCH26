-- A registered catalogue may reuse an identical, ready PDF already uploaded
-- by the same editor. Storage and room access are checked on every request.
create function ig_private.catalogue_room_source(c public.ig_brand_catalogues)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('path',s.path,'size',s.size)
  from public.ig_intake_sources s
  join public.ig_room_files f on f.id=s.room_file_id and f.status='ready'
  join storage.objects o on o.bucket_id='ig-data-rooms' and o.name=s.path
  where s.actor_id=c.actor_id and s.practice='horeca' and s.sha256=c.sha256
    and s.mime='application/pdf' and ig_private.intake_source_allowed(s.id)
    and (o.metadata->>'size')::bigint=s.size
  order by f.created_at desc limit 1
$$;
revoke all on function ig_private.catalogue_room_source(public.ig_brand_catalogues) from public,anon,authenticated;

-- Keep the existing claim lease, product deduplication and reviewed catalogue rules.
do $$
declare original text; updated text;
begin
  original=pg_get_functiondef('ig_private.catalogue_manage(jsonb)'::regprocedure);
  updated=replace(original,
    $old$'uploaded',exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path)$old$,
    $new$'uploaded',exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path) or ig_private.catalogue_room_source(c) is not null$new$);
  if updated=original then raise exception 'Catalogue preparation definition changed'; end if;
  original=updated;
  updated=replace(original,
    $old$if not exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path) then$old$,
    $new$if not exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path) and ig_private.catalogue_room_source(c) is null then$new$);
  if updated=original then raise exception 'Catalogue claim definition changed'; end if;
  original=updated;
  updated=replace(original,$old$'catalogue',to_jsonb(c)$old$,
    $new$'catalogue',to_jsonb(c)||jsonb_build_object('room_source',case when not exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path) then ig_private.catalogue_room_source(c) end)$new$);
  if updated=original then raise exception 'Catalogue response definition changed'; end if;
  execute updated;
  original=pg_get_functiondef('ig_private.catalogue_import_before_resumable(jsonb)'::regprocedure);
  updated=replace(original,$old$d=jsonb_build_object('sku',sku);$old$,
    $new$d=jsonb_build_object('sku',sku,'uom',coalesce(nullif(btrim(row->>'uom'),''),'each'));$new$);
  if updated=original then raise exception 'CSV import definition changed'; end if;
  -- Keep the trimmed, editable unit above even when CSV contains only whitespace.
  updated=replace(updated,$old$'category','uom','hsn'$old$,$new$'category','hsn'$new$);
  execute updated;
end $$;

-- Repair only the identified Ariane quote import. Keep private originals,
-- SKUs, box counts, previously approved revisions and media rights untouched.
with fixed as (
  update public.ig_content c set
    public_data = c.public_data || jsonb_build_object('uom',case
      when c.title ilike '% set%' or c.title ilike '%bowl and lid%' then 'set' else 'each' end),
    version=c.version+1,updated_at=now(), updated_by=null
  where c.kind='product' and c.practice='horeca' and c.status='draft'
    and c.published_version is null and c.public_data->>'brand'='Ariane'
    and c.public_data->>'sku' like 'IG-ARIA-%' and c.public_data->>'category' in ('Crockery','Cutlery')
    and nullif(btrim(c.public_data->>'uom'),'') is null and c.public_data ? 'reference'
  returning c.*
), revisions as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
)
insert into public.ig_audit(action,entity_id,detail)
select 'catalogue.unit_repaired',content_id::text,jsonb_build_object('version',version) from revisions;
