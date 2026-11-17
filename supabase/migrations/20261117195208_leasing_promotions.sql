-- Sale opportunities and leasing mandates share three carousel positions.
-- Product priorities remain a separate schedule. No existing placement is changed.
create function ig_private.priority_register(k text) returns text
language sql immutable set search_path='' as $$
 select case when k in ('opportunity','retail_space','retail_requirement') then 'opportunity' when k='product' then 'product' end
$$;
revoke all on function ig_private.priority_register(text) from public,anon,authenticated;

create or replace function ig_private.priority_eligible(k text,d jsonb) returns boolean
language sql immutable set search_path='' as $$
 select case when k in ('opportunity','retail_requirement') then ig_private.feature_eligible(d)
 when k='retail_space' then ig_private.feature_eligible(d) and (
   jsonb_array_length(coalesce(d->'units','[]'::jsonb))=0 or exists(
     select 1 from jsonb_array_elements(d->'units') u where coalesce(u->>'status','To confirm') not in ('Leased','Withdrawn')))
 when k='product' then coalesce(d->>'availability','') !~* '(^|[^a-z])(discontinued|withdrawn|archived|unavailable|out of stock|not available)([^a-z]|$)'
 else false end
$$;

create or replace function ig_private.manage_priority(k text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid:=(p->>'content_id')::uuid; operation text:=p->>'action'; f ig_private.listing_features; pub public.ig_public_content;
  position_no integer; start_time timestamptz; end_time timestamptz; cutoff timestamptz; short_title text; occupied text;
begin
 if k is null or k not in ('opportunity','retail_space','retail_requirement','product') or auth.uid() is null or not ig_private.allowed('content.publish')
    or not ig_private.content_scope(k) or not ig_private.content_access(cid,'publish')
    or not exists(select 1 from public.ig_content where id=cid and kind=k) then
   raise exception 'Listing publication permission required' using errcode='42501';
 end if;
 if operation='report' then
   return coalesce((select jsonb_agg(to_jsonb(h) order by h.starts_at desc) from (
     select c.*, (select count(*) from ig_private.listing_feature_events e where e.campaign_id=c.id and e.event='impression') as impressions,
       (select count(*) from ig_private.listing_feature_events e where e.campaign_id=c.id and e.event='open') as opens,
       (select count(*) from public.ig_enquiries e where e.feature_id=c.id) as enquiries,
       (select count(*) from public.ig_enquiries e where e.feature_id=c.id and e.qualified_at is not null) as qualified,
       (select count(*) from public.ig_nda_requests r where r.feature_id=c.id) as room_requests
     from ig_private.listing_features c where c.content_id=cid order by c.starts_at desc limit 50
   ) h),'[]'::jsonb);
 end if;
 if operation is null or operation not in ('save','stop') then raise exception 'Unknown placement action'; end if;
 perform pg_advisory_xact_lock(hashtextextended('ig.listing.feature.schedule',0));
 if p->>'id' is not null then
   select * into f from ig_private.listing_features where id=(p->>'id')::uuid and content_id=cid for update;
   if f.id is null or f.version is distinct from (p->>'version')::integer then raise exception 'Placement changed. Refresh before editing.'; end if;
 end if;
 if operation='stop' then
   if f.id is null then raise exception 'Choose an existing placement'; end if;
   update ig_private.listing_features set stopped_at=coalesce(stopped_at,now()),version=version+1 where id=f.id;
 else
   select * into pub from public.ig_public_content where id=cid and kind=k for share;
   if pub.id is null or not ig_private.priority_eligible(k,pub.public_data) then raise exception 'Publish a current record before featuring it.'; end if;
   if f.id is not null and (f.stopped_at is not null or least(f.ends_at,f.deadline)<=now()) then raise exception 'Create a new placement for an ended campaign'; end if;
   position_no=(p->>'slot')::integer; short_title=trim(coalesce(p->>'headline',''));
   start_time=coalesce((p->>'starts_at')::timestamptz,now()); end_time=(p->>'ends_at')::timestamptz; cutoff=(p->>'deadline')::timestamptz;
   if end_time is null or position_no is null or position_no not between 1 and 3 or least(end_time,cutoff)<=greatest(now(),start_time) then raise exception 'Choose a position and a valid future end time.'; end if;
   if f.id is null and start_time<now()-interval '2 minutes' then raise exception 'New placements must start now or later.'; end if;
   if f.id is not null and f.starts_at<=now() and start_time is distinct from f.starts_at then raise exception 'The start of a running campaign is fixed.'; end if;
   if length(short_title)>100 or (short_title<>'' and strpos(lower(pub.title),lower(short_title))=0) then raise exception 'Use a short name taken from the published title.'; end if;
   select p2.title into occupied from ig_private.listing_features c join public.ig_public_content p2 on p2.id=c.content_id
     where ig_private.priority_register(p2.kind)=ig_private.priority_register(k) and c.stopped_at is null and c.id is distinct from f.id and (c.slot=position_no or c.content_id=cid)
     and c.starts_at<least(end_time,cutoff) and least(c.ends_at,c.deadline)>greatest(start_time,now()) limit 1;
   if found then raise exception 'Overlapping placement for %. Choose a different position or dates.',occupied; end if;
   if f.id is null then
     insert into ig_private.listing_features(content_id,slot,headline,starts_at,ends_at,deadline)
       values(cid,position_no,short_title,start_time,end_time,cutoff) returning * into f;
   else
     update ig_private.listing_features set slot=position_no,headline=short_title,starts_at=start_time,ends_at=end_time,deadline=cutoff,version=version+1 where id=f.id;
   end if;
 end if;
 insert into public.ig_audit(actor_id,action,entity_id,detail) values(auth.uid(),(case when k='product' then 'product.priority.' else 'listing.feature.' end)||operation,cid::text,jsonb_build_object('campaign',f.id));
 return jsonb_build_object('id',f.id);
end $$;

create or replace function ig_private.manage_listing_feature(p jsonb) returns jsonb language sql security invoker set search_path='' as
  $$ select ig_private.manage_priority((select kind from public.ig_content where id=(p->>'content_id')::uuid and kind in ('opportunity','retail_space','retail_requirement')),p) $$;
create or replace function ig_private.live_listing_features() returns table(id uuid,content_id uuid,slot integer,headline text,starts_at timestamptz,ends_at timestamptz)
language sql stable security definer set search_path='' as $$
 select f.id,f.content_id,f.slot,
   case when strpos(lower(p.title),lower(f.headline))>0 then f.headline else '' end,
   f.starts_at,least(f.ends_at,f.deadline)
 from ig_private.listing_features f join public.ig_public_content p on p.id=f.content_id and p.kind in ('opportunity','retail_space','retail_requirement')
 where f.stopped_at is null and f.starts_at<=now() and least(f.ends_at,f.deadline)>now() and ig_private.priority_eligible(p.kind,p.public_data)
 order by f.slot
$$;
create or replace function ig_private.priority_workspace(p jsonb) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare k text:=p->>'kind'; q text:=left(lower(trim(coalesce(p->>'q',''))),160); skip_rows integer:=greatest(coalesce((p->>'offset')::int,0),0);
  selection uuid:=nullif(p->>'record','')::uuid; can_manage boolean; batch jsonb; schedule jsonb; selected_item jsonb;
begin
  if auth.uid() is null or not ig_private.allowed('admin.read') then raise exception 'Staff access required' using errcode='42501'; end if;
  if k is null or k not in ('opportunity','product') then raise exception 'Choose a register'; end if;
  can_manage:=ig_private.allowed('content.publish') and ig_private.content_scope(k)
    and (ig_private.scope_allowed(case when k='product' then 'horeca' else 'real-estate' end,'publish')
      or exists(select 1 from public.ig_content c where ig_private.priority_register(c.kind)=k and ig_private.content_scope(c.kind) and ig_private.scope_allowed(c.practice,'publish')));
  if not can_manage then return jsonb_build_object('can_manage',false,'items','[]'::jsonb,'has_more',false,'placements','[]'::jsonb,'selected',null); end if;
  with candidates as (
    select s.id,s.kind,s.slug,s.title,s.public_data from public.ig_public_content s join public.ig_content c on c.id=s.id
    where ig_private.priority_register(s.kind)=k and ig_private.content_scope(s.kind) and ig_private.scope_allowed(c.practice,'publish') and ig_private.priority_eligible(s.kind,s.public_data)
    and (q='' or strpos(lower(concat_ws(' ',s.title,s.public_data->>'sku',s.public_data->>'brand',s.public_data->>'category',s.public_data->>'city',s.public_data->>'markets',s.public_data->>'formats')),q)>0)
    order by lower(s.title),s.id offset skip_rows limit 25
  ) select coalesce(jsonb_agg(to_jsonb(x) order by lower(x.title),x.id),'[]'::jsonb) into batch from candidates x;
  select to_jsonb(x) into selected_item from (
    select s.id,s.kind,s.slug,s.title,s.public_data from public.ig_public_content s join public.ig_content c on s.id=c.id where s.id=selection and ig_private.priority_register(s.kind)=k and ig_private.content_scope(s.kind)
      and ig_private.scope_allowed(c.practice,'publish') and ig_private.priority_eligible(s.kind,s.public_data)
  ) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.slot,x.starts_at),'[]'::jsonb) into schedule from (
    select f.*,s.kind,s.title from ig_private.listing_features f join public.ig_public_content s on s.id=f.content_id join public.ig_content c on c.id=s.id
    where ig_private.priority_register(s.kind)=k and ig_private.content_scope(s.kind) and ig_private.scope_allowed(c.practice,'publish') and f.stopped_at is null and least(f.ends_at,f.deadline)>now()
      and ig_private.priority_eligible(s.kind,s.public_data)
  ) x;
  return jsonb_build_object('can_manage',true,'items',case when jsonb_array_length(batch)>24 then batch-24 else batch end,
    'has_more',jsonb_array_length(batch)>24,'placements',schedule,'selected',selected_item);
end $$;
create or replace function ig_private.swap_priority_positions(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare k text:=p->>'kind'; a ig_private.listing_features; b ig_private.listing_features;
begin
  if auth.uid() is null or not ig_private.allowed('content.publish') or k is null or k not in ('opportunity','product') or not ig_private.content_scope(k) then
    raise exception 'Publication permission required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ig.listing.feature.schedule',0));
  select * into a from ig_private.listing_features where id=(p->>'first_id')::uuid for update;
  select * into b from ig_private.listing_features where id=(p->>'second_id')::uuid for update;
  if a.id is null or b.id is null or a.id=b.id or a.slot=b.slot then raise exception 'Choose two different current positions.'; end if;
  if not ig_private.content_access(a.content_id,'publish') or not ig_private.content_access(b.content_id,'publish') then raise exception 'Publication permission required' using errcode='42501'; end if;
  if a.version is distinct from (p->>'first_version')::int or b.version is distinct from (p->>'second_version')::int then raise exception 'Placements changed. Refresh before swapping.'; end if;
  if a.stopped_at is not null or b.stopped_at is not null or greatest(a.starts_at,b.starts_at)>now() or least(a.ends_at,a.deadline,b.ends_at,b.deadline)<=now()
    or (select count(*) from public.ig_public_content where id in(a.content_id,b.content_id) and ig_private.priority_register(kind)=k and ig_private.content_scope(kind) and ig_private.priority_eligible(kind,public_data))<>2
  then raise exception 'Both placements must be live in the same register.'; end if;
  if exists(select 1 from ig_private.listing_features f join public.ig_public_content s on s.id=f.content_id and ig_private.priority_register(s.kind)=k
    where f.stopped_at is null and f.id not in(a.id,b.id) and least(f.ends_at,f.deadline)>now()
    and ((f.slot=b.slot and f.starts_at<least(a.ends_at,a.deadline)) or (f.slot=a.slot and f.starts_at<least(b.ends_at,b.deadline))))
  then raise exception 'The new order would overlap a scheduled placement. Adjust its dates first.'; end if;
  update ig_private.listing_features set slot=case when id=a.id then b.slot else a.slot end,version=version+1 where id in(a.id,b.id);
  insert into public.ig_audit(actor_id,action,entity_id,detail) values(auth.uid(),'priority.swap',a.id::text,jsonb_build_object('other',b.id,'register',k,'first_position',b.slot,'second_position',a.slot));
  return jsonb_build_object('swapped',true);
end $$;
create or replace function ig_private.conversion_feature(raw_id text, listing_slug text, enquiry_interest text default null)
returns uuid language sql stable security invoker set search_path='' as $$
  select f.id from ig_private.listing_features f
  join public.ig_public_content c on c.id=f.content_id
  where f.id=case when raw_id ~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then raw_id::uuid end
    and c.kind in ('opportunity','retail_space','retail_requirement') and c.slug=listing_slug and ig_private.priority_eligible(c.kind,c.public_data)
    and f.stopped_at is null and f.starts_at<=now() and least(f.ends_at,f.deadline)>now()-interval '24 hours'
    and (enquiry_interest is null or left(c.title,120)=enquiry_interest or (c.kind in ('retail_space','retail_requirement') and enquiry_interest='Retail & Leasing'))
$$;
