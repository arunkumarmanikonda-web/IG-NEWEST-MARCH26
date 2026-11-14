-- These earlier catalogue matches were page spreads. Preserve them as evidence without offering them as product photos.
with marked as (
  select p.id,jsonb_agg(
    case when coalesce(v.item->>'photo_source','')='' and exists(
      select 1 from public.ig_catalogue_items i join public.ig_content c on c.id=i.content_id
      where i.page_id=p.id and i.item_no=v.pos-1 and c.public_data->>'image' like '/images/catalogue/ankur/%'
    ) then v.item||jsonb_build_object('photo_source','full_page_reference') else v.item end
    order by v.pos) as products
  from public.ig_catalogue_pages p join public.ig_brand_catalogues b on b.id=p.catalogue_id
  cross join lateral jsonb_array_elements(p.result->'products') with ordinality as v(item,pos)
  where b.sha256='3fce930af5e5cf560bab8d3f5e0dbe7403f90820a9e59cfb3af9cb11a856bda7'
    and p.status='ready'
  group by p.id
)
update public.ig_catalogue_pages pg set result=jsonb_set(pg.result,'{products}',marked.products)
from marked where pg.id=marked.id and pg.result->'products' is distinct from marked.products;
