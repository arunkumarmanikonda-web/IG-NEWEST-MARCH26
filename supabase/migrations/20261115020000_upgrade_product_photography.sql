-- Upgrade existing product photographs without publishing pending staff edits.
with asset(stem, method) as (
  values
    ('ankur/beam', 'super_resolution'),
    ('ankur/boost', 'original'),
    ('ankur/deep-micro', 'super_resolution'),
    ('ankur/deep-micro-slim', 'super_resolution'),
    ('ankur/deep-midi', 'super_resolution'),
    ('ankur/euro-slim-30', 'original'),
    ('ankur/euro-slim-adjustable', 'reference_illustration'),
    ('ankur/euro-slim-fixed', 'original'),
    ('ankur/luci', 'original'),
    ('ankur/luci-35', 'super_resolution'),
    ('ankur/luci-50', 'super_resolution'),
    ('ankur/micro-black', 'reference_illustration'),
    ('ankur/micro-metallic', 'reference_illustration'),
    ('ankur/micro-white', 'reference_illustration'),
    ('ankur/pinhole', 'super_resolution'),
    ('ankur/pinhole-fixed', 'reference_illustration'),
    ('ankur/pinhole-tilt', 'reference_illustration'),
    ('ankur/tunnel-downlighter', 'original'),
    ('ankur/tunnel-fixed', 'original'),
    ('ankur/xr-globe', 'reference_illustration'),
    ('ankur/xr-ip', 'super_resolution'),
    ('ankur/xr-pendant', 'super_resolution'),
    ('ankur/xr-popout', 'reference_illustration'),
    ('ankur/xr-recess', 'super_resolution'),
    ('ankur/xr-track', 'super_resolution'),
    ('ariane-cutlery/aria135arn110', 'original'),
    ('ariane-cutlery/aria140arn109', 'original'),
    ('ariane-cutlery/aria140arn112', 'original'),
    ('ariane-cutlery/aria140arn113', 'original'),
    ('ariane-cutlery/aria150arn101', 'original'),
    ('ariane-cutlery/aria150arn102', 'original'),
    ('ariane-cutlery/aria150arn104', 'original'),
    ('ariane-cutlery/aria150arn105', 'original'),
    ('ariane-cutlery/aria150arn108', 'original'),
    ('ariane/agnarn000011036', 'original'),
    ('ariane/agnarn000102002', 'original'),
    ('ariane/agnarn000103026', 'original'),
    ('ariane/ajlarn000014001', 'super_resolution'),
    ('ariane/ajlarn000023028', 'super_resolution'),
    ('ariane/ajlarn000043020', 'super_resolution'),
    ('ariane/ajlarn000092020', 'super_resolution'),
    ('ariane/ajrarn000011021', 'super_resolution'),
    ('ariane/ajrarn000011028', 'super_resolution'),
    ('ariane/ajsarn000011016', 'super_resolution'),
    ('ariane/ajsarn000011025', 'super_resolution'),
    ('ariane/amkarn000071008', 'super_resolution'),
    ('ariane/aprarn000011027', 'original'),
    ('ariane/aprarn000012026', 'original'),
    ('ariane/aprarn000013032', 'original'),
    ('ariane/aprarn000014013', 'original'),
    ('ariane/aprarn000015026', 'original'),
    ('ariane/aprarn000021016', 'original'),
    ('ariane/aprarn000022009', 'original'),
    ('ariane/aprarn000022016', 'original'),
    ('ariane/aprarn000029014', 'original'),
    ('ariane/aprarn000031035', 'super_resolution'),
    ('ariane/aprarn000043009', 'original'),
    ('ariane/aprarn000064015', 'original'),
    ('ariane/aprarn000069016', 'super_resolution'),
    ('ariane/aprarn000075004', 'original'),
    ('ariane/aprarn000089025', 'super_resolution'),
    ('ariane/aprarn000s87001', 'super_resolution'),
    ('ariane/asearn000a11021', 'super_resolution'),
    ('ariane/avcarn000011027', 'original'),
    ('ariane/avrarn000011015', 'original')
), eligible as (
  select c.id,c.version,asset.method,'/images/catalogue/'||asset.stem||'-hd.webp' as image
  from asset
  join public.ig_content c on c.public_data->>'image'='/images/catalogue/'||asset.stem||'.webp'
  join public.ig_public_content live on live.id=c.id and live.version=c.version
  where c.kind='product' and c.practice='horeca' and c.deleted_at is null
    and live.public_data->>'image'=c.public_data->>'image'
  for update of c,live
), fixed as (
  update public.ig_content c set
    public_data=c.public_data||jsonb_build_object('image',e.image,'image_alt',
      case e.method when 'original' then 'Manufacturer product photograph'
        when 'reference_illustration' then 'AI-assisted product illustration'
        else 'AI-enhanced product image' end||' · '||left(c.title,180)),
    version=c.version+1,published_version=c.version+1,updated_at=now(),updated_by=null
  from eligible e where c.id=e.id and c.version=e.version returning c.*
), revised as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
), visible as (
  update public.ig_public_content live set version=f.version,
    public_data=live.public_data||jsonb_build_object('image',f.public_data->>'image','image_alt',f.public_data->>'image_alt')
  from fixed f where live.id=f.id and live.version=f.version-1 returning live.id
)
insert into public.ig_audit(action,entity_id,detail)
select 'catalogue.photography_upgraded',v.id::text,jsonb_build_object('method',e.method,'version',r.version)
from visible v join eligible e using(id) join revised r on r.content_id=v.id;
