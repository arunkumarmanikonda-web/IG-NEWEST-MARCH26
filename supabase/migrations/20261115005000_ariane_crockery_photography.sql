-- Manufacturer-coded product photos from the crockery worksheet supplied to India Gully.
-- The same photo covers a second size only when the manufacturer identifies the same design.
with model(reference, photo) as (
  values
    ('AGNARN000011036','agnarn000011036'),
    ('AGNARN000102002','agnarn000102002'),
    ('AGNARN000103026','agnarn000103026'),
    ('AJLARN000014001','ajlarn000014001'),
    ('AJLARN000023028','ajlarn000023028'),
    ('AJLARN000043020','ajlarn000043020'),
    ('AJLARN000092020','ajlarn000092020'),
    ('AJRARN000011021','ajrarn000011021'),
    ('AJRARN000011028','ajrarn000011028'),
    ('AJSARN000011016','ajsarn000011016'),
    ('AJSARN000011025','ajsarn000011025'),
    ('AMKARN000071008','amkarn000071008'),
    ('AMKARN000072008','amkarn000071008'),
    ('APRARN000011019','aprarn000011027'),
    ('APRARN000011027','aprarn000011027'),
    ('APRARN000012026','aprarn000012026'),
    ('APRARN000013032','aprarn000013032'),
    ('APRARN000014013','aprarn000014013'),
    ('APRARN000015026','aprarn000015026'),
    ('APRARN000015032','aprarn000015026'),
    ('APRARN000021016','aprarn000021016'),
    ('APRARN000022009','aprarn000022009'),
    ('APRARN000022012','aprarn000022016'),
    ('APRARN000022014','aprarn000022016'),
    ('APRARN000022016','aprarn000022016'),
    ('APRARN000029014','aprarn000029014'),
    ('APRARN000031035','aprarn000031035'),
    ('APRARN000043009','aprarn000043009'),
    ('APRARN000064015','aprarn000064015'),
    ('APRARN000069012','aprarn000069016'),
    ('APRARN000069014','aprarn000069016'),
    ('APRARN000069016','aprarn000069016'),
    ('APRARN000075004','aprarn000075004'),
    ('APRARN000089025','aprarn000089025'),
    ('APRARN000S87001','aprarn000s87001'),
    ('ASEARN000A11021','asearn000a11021'),
    ('AVCARN000011018','avcarn000011027'),
    ('AVCARN000011027','avcarn000011027'),
    ('AVRARN000011015','avrarn000011015')
), eligible as (
  select c.id, c.version, '/images/catalogue/ariane/'||model.photo||'.webp' as image
  from model
  join public.ig_content c on c.public_data->>'reference'=model.reference and lower(c.public_data->>'brand')='ariane'
  join public.ig_public_content live on live.id=c.id and live.version=c.version
  where c.kind='product' and c.practice='horeca' and c.deleted_at is null
    and nullif(btrim(c.public_data->>'image'),'') is null
    and nullif(btrim(live.public_data->>'image'),'') is null
  for update of c, live
), fixed as (
  update public.ig_content c set
    public_data=c.public_data||jsonb_build_object('image',e.image,'image_alt','Manufacturer catalogue photograph · '||left(c.title,180)),
    version=c.version+1, published_version=c.version+1, updated_at=now(),updated_by=null
  from eligible e where c.id=e.id and c.version=e.version returning c.*
), revised as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
), visible as (
  update public.ig_public_content live set version=f.version, public_data=live.public_data||
    jsonb_build_object('image',f.public_data->>'image','image_alt',f.public_data->>'image_alt')
  from fixed f where f.id=live.id and live.version=f.version-1 returning live.id
)
insert into public.ig_audit(action,entity_id,detail)
select 'catalogue.model_photo_restored',v.id::text,jsonb_build_object('source','Ariane supplier workbook 9 October 2026','version',r.version)
from visible v join revised r on r.content_id=v.id;
