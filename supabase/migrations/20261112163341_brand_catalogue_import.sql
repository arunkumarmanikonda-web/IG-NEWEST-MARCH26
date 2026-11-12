-- Brand catalogues are private sources. AI creates drafts; publication stays explicit.
create sequence ig_private.product_sku_seq;
create function ig_private.next_product_sku(brand text) returns text language plpgsql security definer set search_path='' as $$
declare candidate text;prefix text=left(regexp_replace(upper(coalesce(brand,'')),'[^A-Z0-9]','','g'),4);
begin
 loop
  candidate='IG-'||coalesce(nullif(prefix,''),'PROD')||'-'||lpad(nextval('ig_private.product_sku_seq')::text,7,'0');
  exit when not exists(select 1 from public.ig_content where kind='product' and lower(public_data->>'sku')=lower(candidate));
 end loop;return candidate;
end $$;
revoke all on function ig_private.next_product_sku(text) from public,anon,authenticated;
alter function ig_private.save_content(jsonb) rename to save_content_before_auto_sku;
revoke all on function ig_private.save_content_before_auto_sku(jsonb) from public,anon,authenticated;
create function ig_private.save_content(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb=coalesce(p->'public_data','{}');existing text;
begin
 if p->>'kind'='product' and nullif(trim(d->>'sku'),'') is null then
  if not ig_private.allowed('content.write') or not ig_private.content_scope('product') or not ig_private.scope_allowed('horeca','write') then raise exception 'HORECA edit permission and MFA required' using errcode='42501';end if;
  select public_data->>'sku' into existing from public.ig_content where id=nullif(p->>'id','')::uuid and kind='product';
  d=d||jsonb_build_object('sku',coalesce(nullif(existing,''),ig_private.next_product_sku(d->>'brand')));
  p=jsonb_set(p,'{public_data}',d);
 end if;
 return ig_private.save_content_before_auto_sku(p);
end $$;
revoke all on function ig_private.save_content(jsonb) from public,anon;
grant execute on function ig_private.save_content(jsonb) to authenticated;
create or replace function ig_private.catalogue_import(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row jsonb;d jsonb;f text;n int=0;sku text;
begin
 if not ig_private.allowed('content.write') or not ig_private.content_scope('product') or not ig_private.scope_allowed('horeca','write') then raise exception 'Catalogue edit permission and MFA required' using errcode='42501';end if;
 if jsonb_typeof(p->'rows') is distinct from 'array' or jsonb_array_length(p->'rows') not between 1 and 200 then raise exception 'Import 1–200 product rows';end if;
 for row in select * from jsonb_array_elements(p->'rows') loop
  if length(coalesce(row->>'title',''))<2 then raise exception 'Each product needs a title';end if;
  sku=coalesce(nullif(trim(row->>'sku'),''),ig_private.next_product_sku(row->>'brand'));
  d=jsonb_build_object('sku',sku);
  foreach f in array array['brand','category','uom','hsn','gst_pct','moq','pack_size','lead_days','price_label','reference'] loop if nullif(row->>f,'') is not null then d=d||jsonb_build_object(f,row->>f);end if;end loop;
  perform ig_private.save_content(jsonb_build_object('kind','product','practice','horeca','slug','sku-'||lower(regexp_replace(sku,'[^a-zA-Z0-9]+','-','g')),'title',row->>'title','summary',coalesce(row->>'summary',''),'body',coalesce(row->>'body',''),'public_data',d));n=n+1;
 end loop;
 perform ig_private.record_audit('catalogue.imported',null,jsonb_build_object('created',n));return jsonb_build_object('created',n);
end $$;
create table public.ig_brand_catalogues(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),
 name text not null check(length(name) between 3 and 160),brand text not null check(length(brand) between 2 and 100),
 sha256 text not null check(sha256~'^[a-f0-9]{64}$'),path text not null unique,
 rights_reference text not null check(length(rights_reference) between 5 and 500),
 page_count int check(page_count between 1 and 500),created_at timestamptz not null default now(),unique(actor_id,sha256,brand)
);
create table public.ig_catalogue_pages(
 id uuid primary key default gen_random_uuid(),catalogue_id uuid not null references public.ig_brand_catalogues(id),
 page_number int not null check(page_number between 1 and 500),status text not null check(status in ('processing','ready','failed')),
 lease_token uuid,lease_until timestamptz,result jsonb check(length(result::text)<100000),note text,
 created_at timestamptz not null default now(),unique(catalogue_id,page_number)
);
create table public.ig_catalogue_items(
 page_id uuid not null references public.ig_catalogue_pages(id),item_no int not null check(item_no between 0 and 23),
 media_id uuid references public.ig_source_media(id),content_id uuid references public.ig_content(id) on delete set null,
 primary key(page_id,item_no)
);
create index ig_brand_catalogue_actor on public.ig_brand_catalogues(actor_id,created_at desc);
create index ig_catalogue_items_content on public.ig_catalogue_items(content_id);
create index ig_catalogue_items_media on public.ig_catalogue_items(media_id);
alter table public.ig_brand_catalogues enable row level security;
alter table public.ig_catalogue_pages enable row level security;
alter table public.ig_catalogue_items enable row level security;
create function ig_private.catalogue_allowed(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('content.write') and ig_private.content_scope('product') and ig_private.scope_allowed('horeca','write') and exists(select 1 from public.ig_brand_catalogues where id=cid and (actor_id=auth.uid() or exists(select 1 from public.ig_profiles where id=auth.uid() and 'owner'=any(roles))))
$$;
revoke all on function ig_private.catalogue_allowed(uuid) from public,anon;
grant execute on function ig_private.catalogue_allowed(uuid) to authenticated;
revoke all on public.ig_brand_catalogues,public.ig_catalogue_pages,public.ig_catalogue_items from public,anon,authenticated;
grant select on public.ig_brand_catalogues,public.ig_catalogue_pages,public.ig_catalogue_items to authenticated;
create policy catalogue_read on public.ig_brand_catalogues for select to authenticated using(ig_private.catalogue_allowed(id));
create policy catalogue_page_read on public.ig_catalogue_pages for select to authenticated using(ig_private.catalogue_allowed(catalogue_id));
create policy catalogue_item_read on public.ig_catalogue_items for select to authenticated using(exists(select 1 from public.ig_catalogue_pages where id=page_id and ig_private.catalogue_allowed(catalogue_id)));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ig-brand-catalogues','ig-brand-catalogues',false,25000000,array['application/pdf']);
create policy catalogue_source_upload on storage.objects for insert to authenticated with check(bucket_id='ig-brand-catalogues' and exists(select 1 from public.ig_brand_catalogues where path=storage.objects.name and actor_id=auth.uid() and ig_private.catalogue_allowed(id)));
create policy catalogue_source_read on storage.objects for select to authenticated using(bucket_id='ig-brand-catalogues' and exists(select 1 from public.ig_brand_catalogues where path=storage.objects.name and ig_private.catalogue_allowed(id)));
create function ig_private.catalogue_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.ig_brand_catalogues;r public.ig_catalogue_pages;m jsonb;i public.ig_catalogue_items;v jsonb;d jsonb;saved jsonb;cid uuid;sku text;n int=0;ids jsonb='[]';j uuid=gen_random_uuid();
begin
 if not ig_private.allowed('content.write') or not ig_private.content_scope('product') or not ig_private.scope_allowed('horeca','write') then raise exception 'HORECA edit permission and MFA required' using errcode='42501';end if;
 if p->>'action'='prepare' then
  if p->>'approved' is distinct from 'true' then raise exception 'Confirm catalogue processing and image usage rights';end if;
  if (select count(*) from public.ig_brand_catalogues where actor_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Daily catalogue upload limit reached';end if;
  insert into public.ig_brand_catalogues(id,actor_id,name,brand,sha256,path,rights_reference) values(j,auth.uid(),p->>'name',trim(p->>'brand'),p->>'sha256',auth.uid()||'/'||j||'.pdf',p->>'rights_reference') on conflict(actor_id,sha256,brand) do update set name=excluded.name returning * into c;
  perform ig_private.record_audit('catalogue.source_registered',c.id::text);
  return to_jsonb(c)||jsonb_build_object('uploaded',exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path));
 end if;
 select * into c from public.ig_brand_catalogues where id=(p->>'id')::uuid;
 if not ig_private.catalogue_allowed(c.id) then raise exception 'Catalogue permission required' using errcode='42501';end if;
 if p->>'action'='claim' then
  if not exists(select 1 from storage.objects where bucket_id='ig-brand-catalogues' and name=c.path) then raise exception 'Complete the PDF upload first';end if;
  if (p->>'page')::int not between 1 and coalesce(c.page_count,500) then raise exception 'Page is outside this catalogue';end if;
  perform pg_advisory_xact_lock(hashtextextended(c.id||':'||(p->>'page'),0));
  select * into r from public.ig_catalogue_pages where catalogue_id=c.id and page_number=(p->>'page')::int for update;
  if r.status='ready' then return jsonb_build_object('page',to_jsonb(r),'catalogue',to_jsonb(c));end if;
  if r.status='processing' and r.lease_until>now() then raise exception 'This page is already being processed. Resume after it finishes.' using errcode='40001';end if;
  delete from public.ig_catalogue_items where page_id=r.id and content_id is null;
  insert into public.ig_catalogue_pages(catalogue_id,page_number,status,lease_token,lease_until) values(c.id,(p->>'page')::int,'processing',j,now()+interval '4 minutes') on conflict(catalogue_id,page_number) do update set status='processing',lease_token=j,lease_until=now()+interval '4 minutes',note=null returning * into r;
  return jsonb_build_object('page',to_jsonb(r),'catalogue',to_jsonb(c));
 end if;
 select * into r from public.ig_catalogue_pages where catalogue_id=c.id and page_number=(p->>'page')::int for update;
 if r.id is null then raise exception 'Catalogue page unavailable';end if;
 if p->>'action'='asset' then
  if r.status<>'processing' or r.lease_token is distinct from (p->>'lease_token')::uuid or r.lease_until<now() then raise exception 'Page processing lease expired';end if;
  if (p->>'item_no')::int not between 0 and 23 then raise exception 'Invalid product image index';end if;
  select * into i from public.ig_catalogue_items where page_id=r.id and item_no=(p->>'item_no')::int;
  if i.media_id is not null then return (select jsonb_build_object('id',id,'path',path,'state',state) from public.ig_source_media where id=i.media_id);end if;
  if (select count(*) from public.ig_source_media where actor_id=auth.uid() and created_at>now()-interval '1 day')>=500 then raise exception 'Daily catalogue image limit reached';end if;
  insert into public.ig_source_media(id,actor_id,practice,path,source_name,rights_reference,alt,preset) values(j,auth.uid(),'horeca',auth.uid()||'/'||j||'.jpg',left(c.name||' · page '||r.page_number,180),c.rights_reference,left(p->>'alt',250),'square');
  insert into public.ig_catalogue_items(page_id,item_no,media_id) values(r.id,(p->>'item_no')::int,j) on conflict(page_id,item_no) do update set media_id=j;
  return jsonb_build_object('id',j,'path',auth.uid()||'/'||j||'.jpg','state','prepared');
 elsif p->>'action'='drafts' then
  if r.status<>'ready' then raise exception 'Extract this page before creating products';end if;
  for v in select value||jsonb_build_object('item_no',ordinality-1) from jsonb_array_elements(r.result->'products') with ordinality loop
   select * into i from public.ig_catalogue_items where page_id=r.id and item_no=(v->>'item_no')::int;
   if i.content_id is not null then ids=ids||jsonb_build_array(i.content_id);continue;end if;
   cid=null;
   if nullif(trim(v->>'reference'),'') is not null then select id into cid from public.ig_content where kind='product' and lower(public_data->>'brand')=lower(c.brand) and lower(public_data->>'reference')=lower(trim(v->>'reference')) limit 1;end if;
   if cid is null then
    sku=ig_private.next_product_sku(c.brand);
    d=jsonb_build_object('sku',sku,'brand',c.brand,'category',v->>'category','reference',v->>'reference','uom',v->>'uom');
    saved=ig_private.save_content(jsonb_build_object('kind','product','practice','horeca','slug','sku-'||lower(sku),'title',v->>'title','summary',coalesce(v->>'summary',''),'body',coalesce(v->>'specifications',''),'public_data',d));cid=(saved->>'id')::uuid;n=n+1;
   end if;
   insert into public.ig_catalogue_items(page_id,item_no,content_id) values(r.id,(v->>'item_no')::int,cid) on conflict(page_id,item_no) do update set content_id=cid;
   ids=ids||jsonb_build_array(cid);
  end loop;
  perform ig_private.record_audit('catalogue.product_drafts',c.id::text,jsonb_build_object('page',r.page_number,'created',n));
  return jsonb_build_object('created',n,'ids',ids);
 end if;raise exception 'Unsupported catalogue action';
end $$;
create function public.ig_brand_catalogue(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.catalogue_manage(p)$$;
revoke all on function ig_private.catalogue_manage(jsonb),public.ig_brand_catalogue(jsonb) from public,anon;
grant execute on function ig_private.catalogue_manage(jsonb),public.ig_brand_catalogue(jsonb) to authenticated;
create function ig_private.catalogue_finish(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_catalogue_pages;
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 select * into r from public.ig_catalogue_pages where id=(p->>'page_id')::uuid and status='processing' and lease_token=(p->>'lease_token')::uuid and lease_until>now() for update;
 if r.id is null then raise exception 'Page lease no longer active';end if;
 if p->>'status' not in ('ready','failed') then raise exception 'Invalid page state';end if;
 if p->>'status'='ready' and (jsonb_typeof(p->'result'->'products') is distinct from 'array' or jsonb_array_length(p->'result'->'products')>24) then raise exception 'Invalid extracted products';end if;
 update public.ig_catalogue_pages set status=p->>'status',result=p->'result',note=left(p->>'note',500),lease_token=null,lease_until=null where id=r.id;
 if p ? 'page_count' then update public.ig_brand_catalogues set page_count=(p->>'page_count')::int where id=r.catalogue_id;end if;
 return '{"ok":true}';
end $$;
create function public.ig_catalogue_finish(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.catalogue_finish(secret,p)$$;
revoke all on function ig_private.catalogue_finish(text,jsonb),public.ig_catalogue_finish(text,jsonb) from public;
grant execute on function ig_private.catalogue_finish(text,jsonb),public.ig_catalogue_finish(text,jsonb) to anon,authenticated;
