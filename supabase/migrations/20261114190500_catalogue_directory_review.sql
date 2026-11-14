-- Pages 6 and 7 of the 2026–27 Ankur PDF are directories. Keep the source
-- evidence and assigned SKU history, but take untouched index entries out of
-- the active draft list. A numeric index pointer must not participate in
-- manufacturer-code deduplication when a real specification page is imported.
with fixed as (
  update public.ig_content c set status='archived',
    public_data=c.public_data-'reference'-'seo_keywords',
    summary='',seo_title='',seo_description='',version=c.version+1,
    updated_at=now(),updated_by=null
  from public.ig_catalogue_items i join public.ig_catalogue_pages p on p.id=i.page_id
  where p.catalogue_id='46d50d9f-9817-4fab-9ffb-047c6a5accc2'
    and p.page_number in (6,7) and c.id=i.content_id
    and c.kind='product' and c.status='draft' and c.published_version is null and c.version=2
    and c.body='' and c.title=p.result->'products'->i.item_no->>'title'
    and c.summary=p.result->'products'->i.item_no->>'summary'
    and c.public_data->>'reference'=p.result->'products'->i.item_no->>'reference'
    and not exists (
      select 1 from public.ig_catalogue_items other
      join public.ig_catalogue_pages op on op.id=other.page_id
      where other.content_id=c.id and (op.catalogue_id<>p.catalogue_id or op.page_number not in (6,7)))
  returning c.*
), revisions as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
)
insert into public.ig_audit(action,entity_id,detail)
select 'catalogue.index_draft_archived',content_id::text,jsonb_build_object('version',version) from revisions;

update public.ig_catalogue_pages p set result=p.result || jsonb_build_object(
  'page_type','directory','complete',false,
  'notes','Product directory. Use the specification pages to review and publish individual products. The original index entries are retained for reference.',
  'products',(select jsonb_agg(v || jsonb_build_object('reference','','review_notes',
    concat_ws(' ', 'Index entry only. The printed number is a directory reference. Confirm the product identity, specifications and photograph on its detail page.',nullif(v->>'review_notes',''))) order by n)
    from jsonb_array_elements(p.result->'products') with ordinality as entries(v,n)))
where catalogue_id='46d50d9f-9817-4fab-9ffb-047c6a5accc2' and page_number in (6,7)
  and result->>'page_type' is distinct from 'directory';

-- Build default search copy for spreadsheet imports from supplier-provided
-- fields. Editors can change it using the standard content editor.
do $$
declare original text; updated text;
begin
  original=pg_get_functiondef('ig_private.catalogue_import_before_resumable(jsonb)'::regprocedure);
  updated=replace(original,
    $old$'body',coalesce(row->>'body',''),'public_data',d$old$,
    $new$'body',coalesce(row->>'body',''),
      'seo_title',left(concat_ws(' | ',trim(row->>'title'),'India Gully'),90),
      'seo_description',left(concat_ws(' ',coalesce(nullif(trim(row->>'summary'),''),row->>'title'),
        case when nullif(trim(row->>'reference'),'') is not null then 'Manufacturer reference '||trim(row->>'reference')||'.' end),200),
      'public_data',d||jsonb_build_object('seo_keywords',left(concat_ws(', ',nullif(trim(row->>'title'),''),
        nullif(trim(row->>'category'),''),nullif(trim(row->>'brand'),''),nullif(trim(row->>'reference'),'')),500))$new$);
  if original=updated then raise exception 'Spreadsheet catalogue import definition changed'; end if;
  execute updated;
end $$;

with fixed as (
  update public.ig_content c set seo_title=left(c.title||' | India Gully',90),
    seo_description=left(concat_ws(' ',c.summary,'Manufacturer reference '||(c.public_data->>'reference')||'.'),200),
    public_data=c.public_data || jsonb_build_object('seo_keywords',concat_ws(', ',c.title,c.public_data->>'category',c.public_data->>'reference')),
    version=c.version+1,updated_at=now(),updated_by=null
  where c.kind='product' and c.practice='horeca' and c.status='draft' and c.published_version is null
    and c.public_data->>'brand'='Ariane' and c.public_data->>'sku' like 'IG-ARIA-%'
    and c.public_data->>'category' in ('Crockery','Cutlery') and c.public_data ? 'reference'
    and c.seo_title='' and c.seo_description='' and coalesce(c.public_data->>'seo_keywords','')=''
  returning c.*
), revisions as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
)
insert into public.ig_audit(action,entity_id,detail)
select 'catalogue.search_copy_prepared',content_id::text,jsonb_build_object('version',version) from revisions;
