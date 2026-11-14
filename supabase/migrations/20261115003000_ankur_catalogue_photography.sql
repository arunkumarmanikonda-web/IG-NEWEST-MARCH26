-- Supplier-approved artwork from the Ankur 2026/27 catalogue. Visually identical
-- wattage and size variants share a model photograph. Keep editorial overrides.
with model(sku, photo) as (
  values
    ('IG-ANKU-0000060', 'pinhole'),
    ('IG-ANKU-0000109', 'tunnel-fixed'),
    ('IG-ANKU-0000110', 'tunnel-downlighter'),
    ('IG-ANKU-0000111', 'xr-track'),
    ('IG-ANKU-0000112', 'xr-recess'),
    ('IG-ANKU-0000113', 'xr-pendant'),
    ('IG-ANKU-0000114', 'xr-track'),
    ('IG-ANKU-0000115', 'xr-track'),
    ('IG-ANKU-0000116', 'xr-globe'),
    ('IG-ANKU-0000117', 'xr-popout'),
    ('IG-ANKU-0000118', 'xr-pendant'),
    ('IG-ANKU-0000119', 'deep-micro'),
    ('IG-ANKU-0000120', 'deep-midi'),
    ('IG-ANKU-0000121', 'micro-white'),
    ('IG-ANKU-0000122', 'micro-black'),
    ('IG-ANKU-0000123', 'micro-metallic'),
    ('IG-ANKU-0000124', 'micro-white'),
    ('IG-ANKU-0000125', 'micro-black'),
    ('IG-ANKU-0000126', 'micro-metallic'),
    ('IG-ANKU-0000127', 'deep-micro-slim'),
    ('IG-ANKU-0000128', 'boost'),
    ('IG-ANKU-0000129', 'luci-50'),
    ('IG-ANKU-0000130', 'luci-35'),
    ('IG-ANKU-0000131', 'beam'),
    ('IG-ANKU-0000132', 'luci'),
    ('IG-ANKU-0000133', 'pinhole-fixed'),
    ('IG-ANKU-0000134', 'pinhole-tilt'),
    ('IG-ANKU-0000135', 'euro-slim-adjustable'),
    ('IG-ANKU-0000136', 'euro-slim-adjustable'),
    ('IG-ANKU-0000137', 'euro-slim-fixed'),
    ('IG-ANKU-0000138', 'euro-slim-fixed'),
    ('IG-ANKU-0000139', 'euro-slim-30'),
    ('IG-ANKU-0000140', 'xr-ip'),
    ('IG-ANKU-0000141', 'xr-ip')
), eligible as (
  select c.id, c.version, '/images/catalogue/ankur/'||model.photo||'.webp' as image
  from model
  join public.ig_content c on c.public_data->>'sku'=model.sku
  join public.ig_public_content live on live.id=c.id and live.version=c.version
  where c.kind='product' and c.practice='horeca' and c.deleted_at is null
    and nullif(btrim(c.public_data->>'image'),'') is null
    and nullif(btrim(live.public_data->>'image'),'') is null
    and exists (
      select 1 from public.ig_catalogue_items i
      join public.ig_catalogue_pages pg on pg.id=i.page_id
      join public.ig_brand_catalogues cat on cat.id=pg.catalogue_id
      where i.content_id=c.id and pg.status='ready'
        and cat.sha256='3fce930af5e5cf560bab8d3f5e0dbe7403f90820a9e59cfb3af9cb11a856bda7'
    )
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
select 'catalogue.model_photo_restored',v.id::text,jsonb_build_object('source','Ankur Lighting 2026/27','version',r.version)
from visible v join revised r on r.content_id=v.id;
