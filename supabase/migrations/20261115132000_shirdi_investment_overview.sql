-- Update only the published version reviewed for this editorial release.
with copy as (
 select
 $summary$A five-level hotel structure occupies the principal parcel at Sai Niwara Township. Thirty adjoining residential plots complete a 5.15-acre holding on Shirdi–Pimpalwadi Road in Rui, Maharashtra.$summary$ as summary,
 $body$## The hotel site

Plot 1 covers 12,757.65 sq m, approximately 3.15 acres. An existing ground-plus-four-storey structure gives the hotel development a physical starting point. The site photographs show the building in its shell condition. Commercial operations have yet to begin.

For a hotel developer, the opportunity is to shape the guest experience within that structure. The arrangement of rooms on the upper floors, the position of dining and reception at arrival level, and the movement of guests and service staff are all choices for the completion design.

## The residential plots

Alongside the hotel, Plots 2 to 31 comprise 30 residential plots covering 8,071.58 sq m, approximately 2.00 acres. They account for approximately 39% of the holding. The township schedule identifies each plot by number, giving the residential component a defined footprint within the larger site.

## Location and connections

The township lies in Rui, in Rahata taluka, on the Shirdi–Pimpalwadi Road. The project presentation places the Sai Baba Samadhi Mandir approximately 5.2 km from the site by road. It also gives indicative distances of 7.8 km to Sainagar Shirdi railway station and 18.6 km to Shirdi Airport.

For a hotel serving pilgrims, these connections matter at arrival and departure. Airport and station transfers can be planned alongside trips to the temple. Family room configurations, group dining and space for coach arrivals are practical choices for the hotel design.

## Property and transaction particulars

The project documents identify Trillion Real Estate and Properties (India) Private Limited as the owner of the hotel parcel and the 30 residential plots. The hotel is identified as Plot 1, Gat Nos. 303, 305, 308B and 312B/4/1. The two components together measure 20,829.23 sq m.

The project documents describe a corporate insolvency resolution process. The resolution professional’s current process documents govern participation, the transaction timetable and the assets included in a resolution proposal.$body$ as body
), eligible as (
 select c.id,c.version from public.ig_content c join public.ig_public_content live on live.id=c.id and live.version=c.version
 where c.slug='ig-opp-0d4382ffed7c4afe937499f168b14df7' and c.kind='opportunity' and c.deleted_at is null and c.body=live.body
 and c.body like '%Those parcels warrant a valuation of their own.%' for update of c,live
), fixed as (
 update public.ig_content c set summary=copy.summary,body=copy.body,version=c.version+1,published_version=c.version+1,updated_at=now(),updated_by=null
 from eligible e,copy where e.id=c.id returning c.*
), revised as (
 insert into public.ig_content_revisions(content_id,version,snapshot) select id,version,to_jsonb(fixed) from fixed returning content_id,version
), visible as (
 update public.ig_public_content p set summary=f.summary,body=f.body,version=f.version from fixed f where p.id=f.id and p.version=f.version-1 returning p.id
)
insert into public.ig_audit(action,entity_id,detail)
select 'property.editorial_updated',v.id::text,jsonb_build_object('version',r.version) from visible v join revised r on r.content_id=v.id;
