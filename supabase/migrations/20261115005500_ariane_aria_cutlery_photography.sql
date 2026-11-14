-- Exact Aria references from the manufacturer's 2026/27 cutlery catalogue, linked at
-- https://linktr.ee/arianefineporcelainindia. Each crop contains one identified utensil.
with model(reference, photo) as (
  values
    ('ARIA135ARN110','aria135arn110'),
    ('ARIA140ARN109','aria140arn109'),
    ('ARIA140ARN112','aria140arn112'),
    ('ARIA140ARN113','aria140arn113'),
    ('ARIA150ARN101','aria150arn101'),
    ('ARIA150ARN102','aria150arn102'),
    ('ARIA150ARN104','aria150arn104'),
    ('ARIA150ARN105','aria150arn105'),
    ('ARIA150ARN108','aria150arn108')
), eligible as (
  select c.id, c.version, '/images/catalogue/ariane-cutlery/'||model.photo||'.webp' as image
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
select 'catalogue.model_photo_restored',v.id::text,jsonb_build_object('source','Ariane official cutlery catalogue 2026/27, Aria panel','version',r.version)
from visible v join revised r on r.content_id=v.id;
