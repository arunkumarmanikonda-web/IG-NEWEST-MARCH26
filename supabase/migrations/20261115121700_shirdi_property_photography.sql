-- Link the approved site photograph and remove the redundant enquiry paragraph.
with eligible as (
  select c.id, c.version, E'\n\nArun Manikonda and Amit Jhingan at India Gully can arrange a private briefing on the parcels, the hotel completion scope and the documented resolution process. Request the property brief or enquire about access to the project data room.' as redundant,
    jsonb_build_object('image','/images/shirdi-hotel-exterior.jpg','image_alt','Unfinished hotel at Sai Niwara Township, Shirdi, viewed from the site grounds') as photo
  from public.ig_content c join public.ig_public_content live on c.id=live.id and c.version=live.version
  where c.slug='ig-opp-0d4382ffed7c4afe937499f168b14df7' and c.kind='opportunity' and c.deleted_at is null
    and c.body=live.body and nullif(c.public_data->>'image','') is null and nullif(live.public_data->>'image','') is null
    and coalesce(c.public_data->>'confidential','false')='false'
  for update of c, live
), fixed as (
  update public.ig_content c set body=replace(c.body,e.redundant,''),public_data=c.public_data||e.photo,
    version=c.version+1,published_version=c.version+1,updated_at=now(),updated_by=null
  from eligible e where c.id=e.id returning c.*
), revised as (
  insert into public.ig_content_revisions(content_id,version,snapshot)
  select id,version,to_jsonb(fixed) from fixed returning content_id,version
), visible as (
  update public.ig_public_content live set version=f.version,body=f.body,public_data=live.public_data||e.photo
  from fixed f join eligible e on e.id=f.id where live.id=f.id and live.version=e.version returning live.id
)
insert into public.ig_audit(action,entity_id,detail)
select 'property.photography_updated',v.id::text,jsonb_build_object('version',r.version,'source','Supplied Shirdi site photograph')
from visible v join revised r on r.content_id=v.id;
