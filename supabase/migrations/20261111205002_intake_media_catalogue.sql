create table public.ig_source_media(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),practice text not null,
 path text not null unique,source_name text not null check(length(source_name)<=180),rights_reference text not null check(length(rights_reference) between 5 and 500),
 alt text not null check(length(alt) between 5 and 250),preset text not null check(preset in ('landscape','square','portrait')),
 state text not null default 'prepared' check(state in ('prepared','ready')),published boolean not null default false,
 created_at timestamptz not null default now()
);
create index ig_source_media_actor on public.ig_source_media(actor_id);
create index ig_source_media_practice on public.ig_source_media(practice,created_at desc);
alter table public.ig_source_media enable row level security;
revoke all on public.ig_source_media from public,anon,authenticated;
grant select on public.ig_source_media to authenticated;
create policy source_media_read on public.ig_source_media for select to authenticated using(ig_private.allowed('content.write') and ig_private.scope_allowed(practice,'write'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ig-source-media','ig-source-media',false,3000000,array['image/jpeg']);
create function ig_private.source_media_access(object_path text,cap text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_source_media m where m.path=object_path and case when cap='upload' then m.actor_id=auth.uid() and m.state='prepared' and ig_private.allowed('content.write') and ig_private.scope_allowed(m.practice,'write') else (m.published and m.state='ready') or (ig_private.allowed('content.write') and ig_private.scope_allowed(m.practice,'write')) end)
$$;
revoke all on function ig_private.source_media_access(text,text) from public;
grant execute on function ig_private.source_media_access(text,text) to anon,authenticated;
create policy source_media_upload on storage.objects for insert to authenticated with check(bucket_id='ig-source-media' and ig_private.source_media_access(name,'upload'));
create policy source_media_download on storage.objects for select to anon,authenticated using(bucket_id='ig-source-media' and ig_private.source_media_access(name,'read'));
create function ig_private.source_media_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.ig_source_media;j uuid=gen_random_uuid();pr text=p->>'practice';
begin
 if p->>'action'='prepare' then
  if not ig_private.allowed('content.write') or not ig_private.scope_allowed(pr,'write') then raise exception 'Practice media rights and MFA required' using errcode='42501';end if;
  if (select count(*) from public.ig_source_media where actor_id=auth.uid() and created_at>now()-interval '1 hour')>=60 then raise exception 'Hourly media upload limit reached';end if;
  insert into public.ig_source_media(id,actor_id,practice,path,source_name,rights_reference,alt,preset) values(j,auth.uid(),pr,auth.uid()::text||'/'||j::text||'.jpg',p->>'source_name',p->>'rights_reference',p->>'alt',p->>'preset') returning * into m;
 else
  select * into m from public.ig_source_media where id=(p->>'id')::uuid for update;
  if m.id is null or not ig_private.allowed('content.write') or not ig_private.scope_allowed(m.practice,'write') then raise exception 'Practice media permission required' using errcode='42501';end if;
  if p->>'action'='complete' then
   if m.actor_id<>auth.uid() or not exists(select 1 from storage.objects where bucket_id='ig-source-media' and name=m.path) then raise exception 'Upload is not complete';end if;
   update public.ig_source_media set state='ready' where id=m.id;
  elsif p->>'action' in ('publish','withdraw') then
   if not ig_private.allowed('content.publish') or not ig_private.scope_allowed(m.practice,'publish') then raise exception 'Practice publication permission required' using errcode='42501';end if;
   if p->>'action'='publish' and (m.state<>'ready' or p->>'reviewed' is distinct from 'true') then raise exception 'Review the ready media before release';end if;
   update public.ig_source_media set published=p->>'action'='publish' where id=m.id;
  else raise exception 'Unsupported media action';end if;
 end if;
 perform ig_private.record_audit('media.'||(p->>'action'),m.id::text);return jsonb_build_object('id',m.id,'path',m.path,'public_path','/images/library/'||m.id||'.jpg');
end $$;
create function public.ig_source_media_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.source_media_manage(p)$$;
create function public.ig_public_media_path(media_id uuid) returns text language sql stable security definer set search_path='' as $$select path from public.ig_source_media where id=media_id and published and state='ready'$$;
revoke all on function ig_private.source_media_manage(jsonb),public.ig_source_media_manage(jsonb),public.ig_public_media_path(uuid) from public,anon;
grant execute on function ig_private.source_media_manage(jsonb),public.ig_source_media_manage(jsonb) to authenticated;
grant execute on function public.ig_public_media_path(uuid) to anon,authenticated;
-- Structured product and location fields remain explicitly allowlisted.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.save_content_unscoped(jsonb)'::regprocedure) into s;
 s=replace(s,'''job_title'',''sort_order'',''expertise''','''job_title'',''sort_order'',''expertise'',''sku'',''brand'',''category'',''uom'',''hsn'',''gst_pct'',''moq'',''pack_size'',''lead_days'',''latitude'',''longitude'',''location_source'',''location_reviewed'',''area'',''area_unit'',''keys'',''tenure'',''availability''');
 execute s;
end $$;
create unique index ig_product_sku_unique on public.ig_content(lower(public_data->>'sku')) where kind='product' and nullif(public_data->>'sku','') is not null;
alter function ig_private.save_content(jsonb) rename to save_content_before_intake;
revoke all on function ig_private.save_content_before_intake(jsonb) from public,anon,authenticated;
create function ig_private.save_content(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d jsonb=coalesce(p->'public_data','{}');f text;n numeric;path text=d->>'image';result jsonb;
begin
 if length(d::text)>15000 then raise exception 'Public metadata too large';end if;
 for f in select jsonb_object_keys(d) loop if jsonb_typeof(d->f)='string' and length(d->>f)>500 then raise exception 'Public metadata field too long';end if;end loop;
 if nullif(d->>'sku','') is not null and d->>'sku'!~'^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$' then raise exception 'SKU must be 2–80 letters, numbers, dots, hyphens or underscores';end if;
 foreach f in array array['gst_pct','moq','pack_size','lead_days','keys'] loop
  if nullif(d->>f,'') is not null then n=(d->>f)::numeric;if n<0 or n>10000000 or (f='gst_pct' and n>100) then raise exception 'Invalid product / property number';end if;end if;
 end loop;
 if nullif(d->>'latitude','') is not null or nullif(d->>'longitude','') is not null then
  if nullif(d->>'latitude','') is null or nullif(d->>'longitude','') is null or (d->>'latitude')::numeric not between -90 and 90 or (d->>'longitude')::numeric not between -180 and 180 then raise exception 'Supply valid latitude and longitude';end if;
  if coalesce(d->>'confidential','false')='true' then raise exception 'Exact coordinates cannot be public on confidential opportunities';end if;
  if d->>'location_reviewed' is distinct from 'true' or length(coalesce(d->>'location_source',''))<5 then raise exception 'Verify coordinates against the supplied location source';end if;
 end if;
 if path like '/images/library/%' and not exists(select 1 from public.ig_source_media m where '/images/library/'||m.id||'.jpg'=path and m.published and m.state='ready' and ig_private.scope_allowed(m.practice,'write')) then raise exception 'Select reviewed public media from your practice';end if;
 result=ig_private.save_content_before_intake(p);return result;
end $$;
revoke all on function ig_private.save_content(jsonb) from public,anon;
grant execute on function ig_private.save_content(jsonb) to authenticated;
alter function ig_private.content_action(jsonb) rename to content_action_before_catalogue;
revoke all on function ig_private.content_action_before_catalogue(jsonb) from public,anon,authenticated;
create function ig_private.content_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_content;
begin
 select * into r from public.ig_content where id=(p->>'id')::uuid;
 if p->>'action'='publish' and r.kind='product' and (length(coalesce(r.public_data->>'sku',''))<2 or length(coalesce(r.public_data->>'uom',''))<1) then raise exception 'A product needs a unique SKU and unit before publication';end if;
 return ig_private.content_action_before_catalogue(p);
end $$;
revoke all on function ig_private.content_action(jsonb) from public,anon;
grant execute on function ig_private.content_action(jsonb) to authenticated;
create function ig_private.catalogue_import(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row jsonb;d jsonb;f text;n int=0;
begin
 if not ig_private.allowed('content.write') or not ig_private.content_scope('product') or not ig_private.scope_allowed('horeca','write') then raise exception 'Catalogue edit permission and MFA required' using errcode='42501';end if;
 if jsonb_typeof(p->'rows') is distinct from 'array' or jsonb_array_length(p->'rows') not between 1 and 200 then raise exception 'Import 1–200 SKU rows';end if;
 for row in select * from jsonb_array_elements(p->'rows') loop
  if length(coalesce(row->>'sku',''))<2 or length(coalesce(row->>'title',''))<2 then raise exception 'Each product needs a SKU and title';end if;
  d='{}';foreach f in array array['sku','brand','category','uom','hsn','gst_pct','moq','pack_size','lead_days','price_label'] loop if nullif(row->>f,'') is not null then d=d||jsonb_build_object(f,row->>f);end if;end loop;
  d=d||jsonb_build_object('uom',coalesce(nullif(row->>'uom',''),'nos'));
  perform ig_private.save_content(jsonb_build_object('kind','product','practice','horeca','slug','sku-'||lower(regexp_replace(row->>'sku','[^a-zA-Z0-9]+','-','g')),'title',row->>'title','summary',coalesce(row->>'summary',''),'body',coalesce(row->>'body',''),'public_data',d));n=n+1;
 end loop;
 perform ig_private.record_audit('catalogue.imported',null,jsonb_build_object('created',n));return jsonb_build_object('created',n);
end $$;
create function public.ig_catalogue_import(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.catalogue_import(p)$$;
revoke all on function ig_private.catalogue_import(jsonb),public.ig_catalogue_import(jsonb) from public,anon;
grant execute on function ig_private.catalogue_import(jsonb),public.ig_catalogue_import(jsonb) to authenticated;
-- Staff with operational practice access can link the existing client, without gaining CRM mutation rights.
create or replace function ig_private.client_staff(client uuid,capability text default 'read') returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_clients c where c.id=client and (
 (capability='read' and ig_private.ops_allowed(c.practice,'read')) or
 (capability in ('read','crm') and ig_private.allowed('enquiries.manage') and ig_private.scope_allowed(c.practice,'enquiries')) or
 (capability in ('read','rooms') and ig_private.allowed('nda.manage') and ig_private.scope_allowed(c.practice,'data_rooms'))))
$$;
