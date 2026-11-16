-- Apply only the released source image selected inside this exact listing's workspace.
create function ig_private.apply_listing_source_photo() returns trigger
language plpgsql security invoker set search_path='' as $$
declare photo jsonb;
begin
  if new.kind <> 'opportunity' or new.public_data ? 'image' then return new; end if;
  if tg_table_name = 'ig_content' and tg_op = 'UPDATE' then
    if old.public_data ? 'image' then
      new.public_data := new.public_data || '{"image":""}'::jsonb;
      return new;
    end if;
  end if;
  if coalesce(new.public_data->>'confidential','false') <> 'false' then return new; end if;
  select jsonb_build_object('image','/images/library/'||m.id||'.jpg','image_alt',m.alt)
    into photo from public.ig_content_intakes w
    join public.ig_content c on c.id=w.content_id
    join public.ig_source_media m on m.id=w.media_id and m.practice=c.practice
    join storage.objects o on o.bucket_id='ig-source-media' and o.name=m.path
    where w.content_id=new.id and c.deleted_at is null and m.state='ready' and m.published
      and coalesce(c.public_data->>'confidential','false')='false'
      and not exists (select 1 from public.ig_content_revisions r where r.content_id=c.id
        and nullif(r.snapshot->'public_data'->>'image','') is not null);
  if photo is not null then new.public_data := new.public_data || photo; end if;
  return new;
end $$;
revoke all on function ig_private.apply_listing_source_photo() from public,anon,authenticated;

create trigger listing_source_photo_draft before update of public_data on public.ig_content
for each row execute function ig_private.apply_listing_source_photo();
create trigger listing_source_photo_publication before insert or update of public_data on public.ig_public_content
for each row execute function ig_private.apply_listing_source_photo();

-- A successful staff receipt must match the revision customers can read.
-- Single and bulk publication both use this entry point.
create or replace function public.ig_content_action(p jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare answer jsonb;
begin
  answer:=ig_private.content_action(p);
  if p->>'action'='publish' and not exists (
    select 1 from public.ig_public_content live
    where live.id=(p->>'id')::uuid and live.version=(p->>'version')::int
  ) then
    raise exception 'Could not verify this revision in the public listings. Publication was rolled back.' using errcode='40001';
  end if;
  return answer;
end $$;
