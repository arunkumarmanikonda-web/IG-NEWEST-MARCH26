-- Exercise staff single and bulk publication through the real RPCs.
begin;
do $$
declare
  staff uuid; session_id uuid; w jsonb; item jsonb; media uuid:=gen_random_uuid(); asset text:='fixture/'||media||'.jpg';
  listing uuid; result jsonb; request jsonb; draft jsonb;
begin
  select u.id,s.id into strict staff,session_id from auth.users u join auth.sessions s on s.user_id=u.id
    where u.email='owner@example.invalid' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'session_id',session_id,'aal','aal2','role','authenticated')::text,true);
  w:=public.ig_content_intake(jsonb_build_object('action','begin','request_id',gen_random_uuid(),'kind','opportunity','practice','real-estate'));
  listing:=(w->>'content_id')::uuid;
  select to_jsonb(c) into draft from public.ig_content c where c.id=listing;
  item:=public.ig_save_content(draft || jsonb_build_object('title','Regression hotel','body','Hotel exterior and accommodation','public_data','{}'::jsonb));
  insert into public.ig_source_media(id,actor_id,practice,path,source_name,rights_reference,alt,preset,state)
    values(media,staff,'real-estate',asset,'exterior.jpg','Owner supplied','Approved hotel exterior','landscape','ready');
  insert into storage.objects(bucket_id,name,owner) values('ig-source-media',asset,staff);
  perform public.ig_content_intake(jsonb_build_object('action','media','id',w->>'id','media_id',media));
  request:=jsonb_build_object('action','publish','id',listing,'version',item->'version',
    'factsConfirmed',true,'rightsConfirmed',true,'privacyConfirmed',true);
  perform public.ig_content_action(request);
  assert exists(select 1 from public.ig_public_content where id=listing and not public_data ? 'image'),'Unreleased photo became public';
  update public.ig_source_media set published=true where id=media;
  result:=public.ig_bulk_publication(request||jsonb_build_object('rows',jsonb_build_array(jsonb_build_object('id',listing,'version',item->'version'))));
  assert (result->0->>'ok')::boolean;
  assert exists(select 1 from public.ig_public_content where id=listing and public_data->>'image'='/images/library/'||media||'.jpg'),'Bulk published without the approved photo';
  item:=public.ig_save_content(item||'{"public_data":{"confidential":true}}');
  perform public.ig_content_action(request||jsonb_build_object('version',item->'version'));
  assert exists(select 1 from public.ig_public_content where id=listing and not public_data ? 'image'),'Auto-selected a confidential listing image';
  item:=public.ig_save_content(item||'{"public_data":{}}');
  perform public.ig_content_action(request||jsonb_build_object('version',item->'version'));
  assert exists(select 1 from public.ig_public_content where id=listing and public_data->>'image_alt'='Approved hotel exterior'),'Single publish omitted approved media';
  item:=public.ig_save_content(item||'{"public_data":{}}');
  assert item->'public_data'->>'image'='/images/library/'||media||'.jpg','Draft did not pick up approved asset';
  item:=public.ig_save_content(item||'{"public_data":{}}');
  perform public.ig_content_action(request||jsonb_build_object('version',item->'version'));
  assert exists(select 1 from public.ig_public_content where id=listing and public_data->>'image'=''),'Manual image removal was overwritten';
end $$;
rollback;
