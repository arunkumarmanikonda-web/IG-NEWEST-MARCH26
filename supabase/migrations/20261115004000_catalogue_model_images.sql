-- Catalogue photos stay private until a publisher approves the product.
create function ig_private.catalogue_photo_matches(product_id uuid, photo_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.ig_catalogue_items i
    join public.ig_catalogue_pages pg on pg.id=i.page_id
    join public.ig_brand_catalogues b on b.id=pg.catalogue_id
    join public.ig_source_media m on m.id=i.media_id
    join storage.objects o on o.bucket_id='ig-source-media' and o.name=m.path
    where i.content_id=product_id and m.id=photo_id and m.practice='horeca'
      and pg.status='ready' and m.state='ready' and m.rights_reference=b.rights_reference
      and pg.result->'products'->i.item_no->>'photo_source' in ('isolated_asset','product_crop')
  )
$$;
revoke all on function ig_private.catalogue_photo_matches(uuid,uuid) from public,anon,authenticated;

-- A server-validated match can be saved and previewed in its own draft before release.
do $$
declare original text; updated text;
begin
  original := pg_get_functiondef('ig_private.save_content_before_auto_sku(jsonb)'::regprocedure);
  updated := replace(original,'and m.published and m.state=',
    'and (m.published or ig_private.catalogue_photo_matches((p->>''id'')::uuid,m.id)) and m.state=');
  if original=updated then raise exception 'Check library photo validation'; end if;
  updated := replace(updated,'''.jpg''=path and (m.published', '''.jpg''=(p->''public_data''->>''image'') and (m.published');
  execute updated;
end $$;

create function ig_private.attach_catalogue_draft_photo() returns trigger
language plpgsql security definer set search_path='' as $$
declare revised public.ig_content;
begin
  if new.media_id is null or new.content_id is null or
     not ig_private.catalogue_photo_matches(new.content_id,new.media_id) then return new; end if;
  update public.ig_content c set
    public_data=c.public_data||jsonb_build_object('image','/images/library/'||new.media_id||'.jpg','image_alt',left(c.title,180)||' · manufacturer catalogue photograph'),
    version=c.version+1,updated_at=now(),updated_by=auth.uid()
  where c.id=new.content_id and c.kind='product' and c.practice='horeca'
    and c.status='draft' and c.published_version is null and c.deleted_at is null
    and nullif(btrim(c.public_data->>'image'),'') is null
  returning c.* into revised;
  if found then
    insert into public.ig_content_revisions(content_id,version,snapshot,actor_id)
    values(revised.id,revised.version,to_jsonb(revised),auth.uid());
    perform ig_private.record_audit('catalogue.draft_photo_matched',revised.id::text,jsonb_build_object('photo',new.media_id));
  end if;
  return new;
end $$;
revoke all on function ig_private.attach_catalogue_draft_photo() from public,anon,authenticated;
create trigger catalogue_draft_photo after insert or update of content_id,media_id on public.ig_catalogue_items
for each row execute function ig_private.attach_catalogue_draft_photo();

create function ig_private.ensure_product_photo() returns trigger
language plpgsql security definer set search_path='' as $$
declare selected_path text := nullif(btrim(new.public_data->>'image'),''); photo public.ig_source_media;
begin
  if new.kind <> 'product' then return new; end if;
  if selected_path is null then raise exception 'Add a product photo or select an approved photo of the same model before publishing.'; end if;
  if selected_path like '/images/library/%' then
    select m.* into photo from public.ig_source_media m
      join storage.objects o on o.name=m.path and o.bucket_id='ig-source-media'
      where '/images/library/'||m.id||'.jpg'=selected_path and m.practice='horeca' and m.state='ready' for update of m;
    if photo.id is null then raise exception 'This product photo is unavailable. Select a ready image before publishing.'; end if;
    if not photo.published then
      if not ig_private.catalogue_photo_matches(new.id,photo.id) then raise exception 'Review and release this product photo before publishing.'; end if;
      update public.ig_source_media set published=true where id=photo.id;
      perform ig_private.record_audit('media.publish_with_catalogue_product',photo.id::text,jsonb_build_object('product',new.id));
    end if;
  end if;
  return new;
end $$;
revoke all on function ig_private.ensure_product_photo() from public,anon,authenticated;
create trigger require_product_photo before insert or update of public_data on public.ig_public_content
for each row execute function ig_private.ensure_product_photo();

-- Reuse a completed photo when the importer matched the same source artwork on this page.
do $$
declare original text; updated text;
begin
  original:=pg_get_functiondef('ig_private.catalogue_manage(jsonb)'::regprocedure);
  updated:=replace(original,'  if (select count(*) from public.ig_source_media where actor_id=auth.uid()', $logic$
  if p ? 'source_item_no' then
    select * into i from public.ig_catalogue_items origin where origin.page_id=r.id
      and origin.item_no=(p->>'source_item_no')::int and origin.item_no<(p->>'item_no')::int;
    if exists(select 1 from public.ig_source_media where id=i.media_id and state='ready') then
      insert into public.ig_catalogue_items(page_id,item_no,media_id)
      values(r.id,(p->>'item_no')::int,i.media_id) on conflict(page_id,item_no) do update set media_id=excluded.media_id;
      return (select jsonb_build_object('id',id,'path',path,'state',state) from public.ig_source_media where id=i.media_id);
    end if;
  end if;
  if (select count(*) from public.ig_source_media where actor_id=auth.uid()$logic$);
  if original=updated then raise exception 'Check catalogue asset allocation'; end if;
  execute updated;
end $$;
