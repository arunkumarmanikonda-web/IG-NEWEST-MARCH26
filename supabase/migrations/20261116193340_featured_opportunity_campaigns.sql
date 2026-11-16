-- Publication stays the source of all public property information.
create table ig_private.listing_features (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.ig_content(id) on delete cascade,
  slot integer not null check (slot between 1 and 3),
  headline text not null default '' check (length(headline)<=100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  deadline timestamptz,
  stopped_at timestamptz,
  version integer not null default 1,
  check (ends_at>starts_at and (deadline is null or deadline>starts_at))
);
create index listing_feature_schedule on ig_private.listing_features(slot,starts_at,ends_at) where stopped_at is null;
create index listing_feature_history on ig_private.listing_features(content_id,starts_at desc);
create table ig_private.listing_feature_events (
  campaign_id uuid not null references ig_private.listing_features(id) on delete cascade,
  event text not null check(event in ('impression','open')),
  request_id uuid not null,
  happened_at timestamptz not null default now(),
  primary key(campaign_id,event,request_id)
);
alter table ig_private.listing_features enable row level security;
alter table ig_private.listing_feature_events enable row level security;
revoke all on ig_private.listing_features,ig_private.listing_feature_events from public,anon,authenticated;

create function ig_private.feature_eligible(d jsonb) returns boolean language sql immutable set search_path='' as $$
 select coalesce(d->>'reference','') !~* 'portfolio reference' and
 coalesce(d->>'availability','') !~* '(^|[^a-z])(withdrawn|closed|sold|archived|expired|leased|unavailable|off market|off-market|no longer available|not available)([^a-z]|$)'
$$;
create function ig_private.live_listing_features() returns table(id uuid,content_id uuid,slot integer,headline text,starts_at timestamptz,ends_at timestamptz)
language sql stable security definer set search_path='' as $$
 select f.id,f.content_id,f.slot,
   case when strpos(lower(p.title),lower(f.headline))>0 then f.headline else '' end,
   f.starts_at,least(f.ends_at,f.deadline)
 from ig_private.listing_features f join public.ig_public_content p on p.id=f.content_id and p.kind='opportunity'
 where f.stopped_at is null and f.starts_at<=now() and least(f.ends_at,f.deadline)>now() and ig_private.feature_eligible(p.public_data)
 order by f.slot
$$;
create function public.ig_live_listing_features() returns table(id uuid,content_id uuid,slot integer,headline text,starts_at timestamptz,ends_at timestamptz)
language sql stable security invoker set search_path='' as $$ select * from ig_private.live_listing_features() $$;

create function ig_private.withdraw_listing_features() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' or (new.kind<>'opportunity' or not ig_private.feature_eligible(new.public_data)) then
   update ig_private.listing_features set stopped_at=now(),version=version+1
   where content_id=old.id and stopped_at is null and least(ends_at,deadline)>now();
 end if;
 return null;
end $$;
create trigger stop_listing_features after update or delete on public.ig_public_content for each row execute function ig_private.withdraw_listing_features();

create function ig_private.manage_listing_feature(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid:=(p->>'content_id')::uuid; operation text:=p->>'action'; f ig_private.listing_features; pub public.ig_public_content;
  position_no integer; start_time timestamptz; end_time timestamptz; cutoff timestamptz; short_title text; occupied text;
begin
 if auth.uid() is null or not ig_private.allowed('content.publish') or not ig_private.content_access(cid,'publish') then
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
   select * into pub from public.ig_public_content where id=cid and kind='opportunity' for share;
   if pub.id is null or not ig_private.feature_eligible(pub.public_data) then raise exception 'Publish a current opportunity before featuring it.'; end if;
   if f.id is not null and (f.stopped_at is not null or least(f.ends_at,f.deadline)<=now()) then raise exception 'Create a new placement for an ended campaign'; end if;
   position_no=(p->>'slot')::integer; short_title=trim(coalesce(p->>'headline',''));
   start_time=coalesce((p->>'starts_at')::timestamptz,now()); end_time=(p->>'ends_at')::timestamptz; cutoff=(p->>'deadline')::timestamptz;
   if end_time is null or position_no is null or position_no not between 1 and 3 or least(end_time,cutoff)<=greatest(now(),start_time) then raise exception 'Choose a position and a valid future end time.'; end if;
   if f.id is null and start_time<now()-interval '2 minutes' then raise exception 'New placements must start now or later.'; end if;
   if f.id is not null and f.starts_at<=now() and start_time is distinct from f.starts_at then raise exception 'The start of a running campaign is fixed.'; end if;
   if length(short_title)>100 or (short_title<>'' and strpos(lower(pub.title),lower(short_title))=0) then raise exception 'Use a short name taken from the published title.'; end if;
   select p2.title into occupied from ig_private.listing_features c join public.ig_public_content p2 on p2.id=c.content_id
     where c.stopped_at is null and c.id is distinct from f.id and (c.slot=position_no or c.content_id=cid)
     and c.starts_at<least(end_time,cutoff) and least(c.ends_at,c.deadline)>greatest(start_time,now()) limit 1;
   if found then raise exception 'Overlapping placement for %. Choose a different position or dates.',occupied; end if;
   if f.id is null then
     insert into ig_private.listing_features(content_id,slot,headline,starts_at,ends_at,deadline)
       values(cid,position_no,short_title,start_time,end_time,cutoff) returning * into f;
   else
     update ig_private.listing_features set slot=position_no,headline=short_title,starts_at=start_time,ends_at=end_time,deadline=cutoff,version=version+1 where id=f.id;
   end if;
 end if;
 insert into public.ig_audit(actor_id,action,entity_id,detail) values(auth.uid(),'listing.feature.'||operation,cid::text,jsonb_build_object('campaign',f.id));
 return jsonb_build_object('id',f.id);
end $$;
create function public.ig_manage_listing_feature(p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select ig_private.manage_listing_feature(p) $$;

create function ig_private.feature_event(secret text,p jsonb) returns void language plpgsql security definer set search_path='' as $$
declare cid uuid:=(p->>'campaign_id')::uuid; kind text:=p->>'event'; request_key uuid:=(p->>'idempotency_key')::uuid; rate_key text:=p->>'rate_key'; attempts integer;
begin
 if secret is null or length(secret)<40 or not exists(select 1 from ig_private.ingest_config where id and secret_hash=encode(extensions.digest(secret,'sha256'),'hex')) then
   raise exception 'Unavailable' using errcode='42501';
 end if;
 if kind is null or kind not in ('impression','open') or rate_key is null or rate_key !~ '^[0-9a-f]{64}$' or request_key is null then raise exception 'Invalid event'; end if;
 if not exists(select 1 from ig_private.live_listing_features() where id=cid) then return; end if;
 insert into ig_private.rate_limits(key,window_start,count) values('feature:'||rate_key,now(),1)
   on conflict(key) do update set window_start=case when rate_limits.window_start<now()-interval '1 minute' then now() else rate_limits.window_start end,
   count=case when rate_limits.window_start<now()-interval '1 minute' then 1 else rate_limits.count+1 end returning count into attempts;
 if attempts>120 then return; end if;
 delete from ig_private.rate_limits where key like 'feature:%' and window_start<now()-interval '2 days';
 insert into ig_private.listing_feature_events(campaign_id,event,request_id) values(cid,kind,request_key) on conflict do nothing;
end $$;
create function public.ig_record_listing_feature_event(secret text,p jsonb) returns void language sql security invoker set search_path='' as $$ select ig_private.feature_event(secret,p) $$;
revoke all on function ig_private.withdraw_listing_features(),ig_private.feature_eligible(jsonb),ig_private.manage_listing_feature(jsonb),public.ig_manage_listing_feature(jsonb),ig_private.live_listing_features(),public.ig_live_listing_features(),ig_private.feature_event(text,jsonb),public.ig_record_listing_feature_event(text,jsonb) from public,anon,authenticated;
grant execute on function ig_private.manage_listing_feature(jsonb),public.ig_manage_listing_feature(jsonb) to authenticated;
grant execute on function ig_private.live_listing_features(),public.ig_live_listing_features() to anon,authenticated;
grant execute on function ig_private.feature_event(text,jsonb),public.ig_record_listing_feature_event(text,jsonb) to anon;

-- Attribute the actual enquiry or first room request, independent of retry and email delivery.
alter table public.ig_enquiries add column feature_id uuid references ig_private.listing_features(id) on delete set null,
  add column qualified_at timestamptz;
alter table public.ig_nda_requests add column feature_id uuid references ig_private.listing_features(id) on delete set null;
create index ig_enquiries_feature on public.ig_enquiries(feature_id) where feature_id is not null;
create index ig_nda_requests_feature on public.ig_nda_requests(feature_id) where feature_id is not null;

-- Allow a visitor who opened a live feature to finish the form or sign in after the scheduled end.
-- Invalid, removed or unrelated promotions never interrupt registration or the enquiry.
create function ig_private.conversion_feature(raw_id text, listing_slug text, enquiry_interest text default null)
returns uuid language sql stable security invoker set search_path='' as $$
  select f.id from ig_private.listing_features f
  join public.ig_public_content c on c.id=f.content_id
  where f.id=case when raw_id ~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then raw_id::uuid end
    and c.kind='opportunity' and c.slug=listing_slug and ig_private.feature_eligible(c.public_data)
    and f.stopped_at is null and f.starts_at<=now() and least(f.ends_at,f.deadline)>now()-interval '24 hours'
    and (enquiry_interest is null or left(c.title,120)=enquiry_interest)
$$;
revoke all on function ig_private.conversion_feature(text,text,text) from public,anon,authenticated;

-- Amend only the business INSERTs. The existing authorization, idempotency, policy
-- snapshots, notifications, signatures and audit records continue to use their own routines.
do $$
declare
  source text;
  at_columns text := 'insert into public.ig_enquiries(name,email,';
  at_values text := 'values(trim(p->>''name''),lower(trim(p->>''email''))';
  nda_columns text := 'insert into public.ig_nda_requests(user_id,content_id,public_title,purpose';
  nda_values text := 'values(auth.uid(),c.id,c.title,trim(p->>''purpose'')';
  qualification text := 'update public.ig_enquiries set status=p->>''status'',assigned_to=assignee where id=e.id;';
begin
  source := pg_get_functiondef('ig_private.submit_enquiry(text,jsonb)'::regprocedure);
  if strpos(source,at_columns)=0 or strpos(source,at_values)=0 then raise exception 'Unknown enquiry capture definition'; end if;
  source := replace(source,at_columns, 'insert into public.ig_enquiries(feature_id,name,email,');
  source := replace(source,at_values, 'values(ig_private.conversion_feature(p->>''feature_id'',p->>''listing_slug'',p->>''practice''),trim(p->>''name''),lower(trim(p->>''email''))');
  execute source;

  source := pg_get_functiondef('public.ig_project_signature(jsonb)'::regprocedure);
  if array_length(string_to_array(source,nda_columns),1)<>3 or array_length(string_to_array(source,nda_values),1)<>3 then
    raise exception 'Unknown project registration definition';
  end if;
  source := replace(source,nda_columns, 'insert into public.ig_nda_requests(feature_id,user_id,content_id,public_title,purpose');
  source := replace(source,nda_values, 'values(case when c.kind=''opportunity'' then ig_private.conversion_feature(p->>''feature_id'',c.slug) end,auth.uid(),c.id,c.title,trim(p->>''purpose'')');
  execute source;

  source := pg_get_functiondef('ig_private.enquiry_update(jsonb)'::regprocedure);
  if strpos(source,qualification)=0 then raise exception 'Unknown enquiry management definition'; end if;
  source := replace(source,qualification,$qualified$
    update public.ig_enquiries set status=p->>'status',assigned_to=assignee,
      qualified_at=case when p->'qualified'='true'::jsonb then coalesce(qualified_at,now())
                        when p->'qualified'='false'::jsonb then null else qualified_at end
    where id=e.id;
  $qualified$);
  execute source;
end $$;
