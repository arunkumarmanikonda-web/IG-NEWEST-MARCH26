-- Availability is independent of an editorial draft. A timed archive retains only
-- the approved public snapshot and expires at read time, without a cron dependency.
alter table public.ig_content
  add column listing_status text not null default 'available'
    check (listing_status in ('available','reserved','under_offer','sold','withdrawn')),
  add column listing_status_label text not null default ''
    check (length(listing_status_label)<=50 and listing_status_label !~ '[<>[:cntrl:]]'),
  add column listing_archived boolean not null default false,
  add column listing_archive_preserves_access boolean not null default false,
  add column archive_until timestamptz,
  add column listing_lifecycle_version integer not null default 1 check (listing_lifecycle_version>0),
  add constraint listing_archive_window check (archive_until is null or (listing_archived and isfinite(archive_until)));

-- Never replace an existing closed/reserved legacy label with an available claim.
update public.ig_content c set listing_status=case
  when coalesce((select p.public_data->>'availability' from public.ig_public_content p where p.id=c.id),c.public_data->>'availability','') ~* '(^|[^a-z])(sold|closed|leased|completed)([^a-z]|$)' then 'sold'
  when coalesce((select p.public_data->>'availability' from public.ig_public_content p where p.id=c.id),c.public_data->>'availability','') ~* '(^|[^a-z])(reserved|booked)([^a-z]|$)' then 'reserved'
  when coalesce((select p.public_data->>'availability' from public.ig_public_content p where p.id=c.id),c.public_data->>'availability','') ~* 'under[ -]offer|offer accepted|under negotiation' then 'under_offer'
  when coalesce((select p.public_data->>'availability' from public.ig_public_content p where p.id=c.id),c.public_data->>'availability','') ~* 'withdrawn|unavailable|off[ -]market|archived|expired|not available|no longer available' then 'withdrawn'
  else 'available' end,
  listing_archived=(c.status='archived' or c.deleted_at is not null)
where c.kind='opportunity';

create function ig_private.listing_public_visible(k text,d jsonb) returns boolean
language plpgsql stable security invoker set search_path='' as $$
declare deadline timestamptz;
begin
  if k is distinct from 'opportunity' then return true; end if;
  if coalesce(d->>'listing_archived','false')<>'true' then return true; end if;
  if nullif(d->>'listing_archive_until','') is null then return false; end if;
  begin deadline:=(d->>'listing_archive_until')::timestamptz;
  exception when invalid_datetime_format or datetime_field_overflow then return false; end;
  return isfinite(deadline) and deadline>now();
end $$;
revoke all on function ig_private.listing_public_visible(text,jsonb) from public;
grant execute on function ig_private.listing_public_visible(text,jsonb) to anon,authenticated;

-- Lifecycle-only edits must not republish draft tags or pick up a newly released
-- source image. Normal publication (including a repeated publish) still does so.
create or replace function ig_private.publish_tags() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if current_setting('ig.lifecycle_only',true)='on' then return new; end if;
  delete from public.ig_public_tags where content_id=new.id;
  insert into public.ig_public_tags(content_id,term_id)
    select content_id,term_id from public.ig_content_tags where content_id=new.id;
  return new;
end $$;
do $$ declare source text; changed text; begin
  source:=pg_get_functiondef('ig_private.apply_listing_source_photo()'::regprocedure);
  changed:=replace(source,'if new.kind <> ''opportunity'' or new.public_data ? ''image'' then return new; end if;',
    'if current_setting(''ig.lifecycle_only'',true)=''on'' then return new; end if; if new.kind <> ''opportunity'' or new.public_data ? ''image'' then return new; end if;');
  if source=changed then raise exception 'Review the source photo publication function before installing lifecycle support'; end if;
  execute changed;
end $$;

create function ig_private.project_listing_lifecycle() returns trigger
language plpgsql security definer set search_path='' as $$
declare item public.ig_content;
begin
  if new.kind<>'opportunity' then return new; end if;
  select * into strict item from public.ig_content where id=new.id;
  new.public_data:=new.public_data||jsonb_build_object(
    'listing_status',item.listing_status,'listing_status_label',item.listing_status_label,
    'listing_archived',item.listing_archived,'listing_archive_until',item.archive_until,
    'listing_lifecycle_version',item.listing_lifecycle_version);
  return new;
end $$;
revoke all on function ig_private.project_listing_lifecycle() from public,anon,authenticated;
create trigger project_listing_lifecycle before insert or update on public.ig_public_content
for each row execute function ig_private.project_listing_lifecycle();

create function ig_private.sync_listing_lifecycle(cid uuid) returns void
language plpgsql security definer set search_path='' as $$
declare previous_setting text:=coalesce(current_setting('ig.lifecycle_only',true),'');
begin
  perform set_config('ig.lifecycle_only','on',true);
  -- The projection trigger copies only dedicated lifecycle columns. Every
  -- editorial field, image, tag, published timestamp and version stays intact.
  update public.ig_public_content set public_data=public_data where id=cid and kind='opportunity';
  perform set_config('ig.lifecycle_only',previous_setting,true);
end $$;
revoke all on function ig_private.sync_listing_lifecycle(uuid) from public,anon,authenticated;

do $$ declare cid uuid; begin
  for cid in select id from public.ig_public_content where kind='opportunity' loop
    perform ig_private.sync_listing_lifecycle(cid);
  end loop;
end $$;

alter policy public_content_read on public.ig_public_content to anon,authenticated
  using(ig_private.listing_public_visible(kind,public_data));
alter policy published_tags on public.ig_public_tags to anon,authenticated
  using(exists(select 1 from public.ig_public_content c where c.id=content_id));

-- Labels are presentation only. A creative name cannot reopen a reserved,
-- sold, withdrawn or archived property, or restart a stopped promotion.
create or replace function ig_private.feature_eligible(d jsonb) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(d->>'listing_archived','false')<>'true'
   and coalesce(d->>'reference','') !~* 'portfolio reference'
   and case when nullif(d->>'listing_status','') is not null then d->>'listing_status'='available'
     else coalesce(d->>'availability','') !~* '(^|[^a-z])(reserved|booked|under offer|under-offer|under negotiation|withdrawn|closed|sold|archived|expired|leased|unavailable|off market|off-market|no longer available|not available)([^a-z]|$)' end
$$;
create function ig_private.listing_accepting_enquiries(k text,d jsonb) returns boolean
language sql stable security invoker set search_path='' as $$
  select k is distinct from 'opportunity' or
    (ig_private.listing_public_visible(k,d) and ig_private.feature_eligible(d))
$$;
revoke all on function ig_private.listing_accepting_enquiries(text,jsonb) from public,anon,authenticated;

update ig_private.listing_features f set stopped_at=now(),version=f.version+1
from public.ig_public_content c where c.id=f.content_id and c.kind='opportunity'
  and not ig_private.feature_eligible(c.public_data) and f.stopped_at is null;

create function ig_private.listing_lifecycle(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.ig_content; cid uuid:=(p->>'id')::uuid; action text:=p->>'action';
  next_status text; next_label text; deadline timestamptz; retained boolean; previous jsonb;
begin
  if auth.uid() is null or not ig_private.allowed('content.publish') or
     not ig_private.content_access(cid,'publish') or not ig_private.content_scope('opportunity') then
    raise exception 'Real estate publication permission required' using errcode='42501';
  end if;
  select * into item from public.ig_content where id=cid for update;
  if item.id is null or item.kind<>'opportunity' then raise exception 'Choose a real estate listing'; end if;
  if item.deleted_at is not null then raise exception 'Restore this listing from Deleted before changing its availability'; end if;
  if item.listing_lifecycle_version is distinct from (p->>'lifecycle_version')::integer then
    raise exception 'Listing availability changed. Refresh before saving.' using errcode='40001';
  end if;
  if action is null or action not in ('save','archive','restore') then raise exception 'Unknown listing availability action'; end if;
  if action='restore' and not item.listing_archived and item.status<>'archived' then
    raise exception 'This listing is not archived';
  end if;
  next_status:=case when p ? 'status' then p->>'status' else item.listing_status end;
  next_label:=case when p ? 'label' then trim(coalesce(p->>'label','')) else item.listing_status_label end;
  if next_status is null or next_status not in ('available','reserved','under_offer','sold','withdrawn') then raise exception 'Choose a recognised listing status'; end if;
  if length(next_label)>50 or next_label ~ '[<>[:cntrl:]]' then raise exception 'Use a plain status label of up to 50 characters'; end if;
  deadline:=item.archive_until;
  if action='archive' or p ? 'archive_until' then
    deadline:=nullif(p->>'archive_until','')::timestamptz;
    if deadline is not null and (not isfinite(deadline) or deadline<=now()) then
      raise exception 'Choose a future archive display end time, or hide the listing immediately';
    end if;
    if action='save' and not item.listing_archived and deadline is not null then
      raise exception 'Archive the listing to set its public display end time';
    end if;
  end if;
  if action='restore' then deadline:=null; end if;
  select exists(select 1 from public.ig_public_content where id=cid) into retained;
  if deadline is not null and not retained then
    raise exception 'There is no approved public snapshot to retain. Restore and publish the listing before scheduling its archive.';
  end if;
  previous:=jsonb_build_object('status',item.listing_status,'label',item.listing_status_label,
    'archived',item.listing_archived,'archive_until',item.archive_until,'lifecycle_version',item.listing_lifecycle_version);
  update public.ig_content set listing_status=next_status,listing_status_label=next_label,
    listing_archived=case when action='archive' then true when action='restore' then false else listing_archived end,
    listing_archive_preserves_access=case
      when action='archive' then item.status<>'archived' or item.listing_archive_preserves_access
      when action='restore' then false else listing_archive_preserves_access end,
    archive_until=deadline,listing_lifecycle_version=listing_lifecycle_version+1,
    status=case when action='archive' then 'archived' when action='restore' then 'draft' else status end,
    updated_by=auth.uid(),updated_at=now()
    where id=cid returning * into item;
  if action='restore' or (item.listing_archived and item.archive_until is null) then
    delete from public.ig_public_content where id=cid;
  else
    perform ig_private.sync_listing_lifecycle(cid);
  end if;
  perform ig_private.record_audit('listing.lifecycle.'||action,cid::text,
    jsonb_build_object('before',previous,'after',jsonb_build_object('status',item.listing_status,
      'label',item.listing_status_label,'archived',item.listing_archived,'archive_until',item.archive_until,
      'lifecycle_version',item.listing_lifecycle_version)));
  return jsonb_build_object('ok',true,'listing_status',item.listing_status,'listing_status_label',item.listing_status_label,
    'listing_archived',item.listing_archived,'archive_until',item.archive_until,
    'listing_lifecycle_version',item.listing_lifecycle_version,'lifecycle_version',item.listing_lifecycle_version,
    'public_visible',exists(select 1 from public.ig_public_content c where c.id=cid and ig_private.listing_public_visible(c.kind,c.public_data)));
end $$;
revoke all on function ig_private.listing_lifecycle(jsonb) from public,anon;
grant execute on function ig_private.listing_lifecycle(jsonb) to authenticated;
create function public.ig_listing_lifecycle(p jsonb) returns jsonb
language sql security invoker set search_path='' as $$select ig_private.listing_lifecycle(p)$$;
revoke all on function public.ig_listing_lifecycle(jsonb) from public,anon;
grant execute on function public.ig_listing_lifecycle(jsonb) to authenticated;

-- Preserve the original content workflow and all of its publication/privacy
-- checks. Existing archive and bulk archive controls still mean hide now.
alter function ig_private.content_action(jsonb) rename to content_action_before_lifecycle;
revoke all on function ig_private.content_action_before_lifecycle(jsonb) from public,anon,authenticated;
create function ig_private.content_action(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.ig_content; action text:=p->>'action'; result jsonb;
begin
  if auth.uid() is null or not ig_private.allowed('content.publish') or not ig_private.content_access((p->>'id')::uuid,'publish') then
    raise exception 'Practice publication permission required' using errcode='42501';
  end if;
  select * into item from public.ig_content where id=(p->>'id')::uuid for update;
  if item.id is null then raise exception 'Content not found'; end if;
  if item.version is distinct from (p->>'version')::integer then
    raise exception 'Revision changed. Review the current version.' using errcode='40001';
  end if;
  if item.kind<>'opportunity' then return ig_private.content_action_before_lifecycle(p); end if;
  if action='archive' then
    return ig_private.listing_lifecycle(jsonb_build_object('id',item.id,'lifecycle_version',item.listing_lifecycle_version,
      'action','archive','archive_until',p->'archive_until'));
  end if;
  if action='publish' and item.listing_archived then
    update public.ig_content set listing_archived=false,listing_archive_preserves_access=false,archive_until=null,
      listing_lifecycle_version=listing_lifecycle_version+1 where id=item.id;
  end if;
  result:=ig_private.content_action_before_lifecycle(p);
  if action in ('trash','restore') then
    delete from public.ig_public_content where id=item.id;
    update public.ig_content set listing_archived=(action='trash'),listing_archive_preserves_access=false,archive_until=null,
      listing_lifecycle_version=listing_lifecycle_version+1 where id=item.id;
  end if;
  return result;
end $$;
revoke all on function ig_private.content_action(jsonb) from public,anon;
grant execute on function ig_private.content_action(jsonb) to authenticated;

-- Rebind the existing public entry point and retain its verified publication receipt.
create or replace function public.ig_content_action(p jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare answer jsonb;
begin
  answer:=ig_private.content_action(p);
  if p->>'action'='publish' and not exists(select 1 from public.ig_public_content live
    where live.id=(p->>'id')::uuid and live.version=(p->>'version')::int) then
    raise exception 'Could not verify this revision in the public listings. Publication was rolled back.' using errcode='40001';
  end if;
  return answer;
end $$;

-- SECURITY DEFINER readers bypass RLS, so each public workflow also checks the
-- same lifecycle contract. Existing data-room grants/files remain untouched.
create or replace function public.ig_room_listing_slugs(content_kind text default 'opportunity') returns text[]
language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(c.slug order by c.slug),array[]::text[]) from public.ig_public_content c
 where c.kind in ('opportunity','project') and c.kind=content_kind
   and ig_private.listing_accepting_enquiries(c.kind,c.public_data)
   and exists(select 1 from public.ig_data_rooms r where r.content_id=c.id and r.active)
$$;

do $$ declare source text;changed text;begin
  -- Public retirement is not a revocation of existing private room authority.
  -- The flag starts false for legacy archives, so this change cannot reactivate
  -- grants blocked before this feature was installed. Explicit room/grant revoke,
  -- deletion, recipient eligibility and grant expiry continue to take precedence.
  source:=pg_get_functiondef('ig_private.admin_room_grant_active(uuid)'::regprocedure);
  changed:=replace(source,'c.deleted_at is null and c.status<>''archived''',
    'c.deleted_at is null and (c.status<>''archived'' or (c.kind=''opportunity'' and c.listing_archive_preserves_access))');
  if source=changed then raise exception 'Review administrator room authority lifecycle guard';end if;execute changed;

  source:=pg_get_functiondef('ig_private.nda_action(jsonb)'::regprocedure);
  changed:=replace(source,'where kind=''opportunity'' and slug=p->>''slug'';',
    'where kind=''opportunity'' and slug=p->>''slug'' and ig_private.listing_accepting_enquiries(kind,public_data);');
  if source=changed then raise exception 'Review legacy NDA request lifecycle guard';end if;execute changed;

  source:=pg_get_functiondef('public.ig_project_signature(jsonb)'::regprocedure);
  changed:=replace(source,'and slug=p->>''slug'';',
    'and slug=p->>''slug'' and ig_private.listing_accepting_enquiries(kind,public_data);');
  if source=changed then raise exception 'Review project signature lifecycle guard';end if;execute changed;

  source:=pg_get_functiondef('public.ig_customer_shortlist(jsonb)'::regprocedure);
  changed:=replace(source,'c.id=i and c.kind in (''opportunity'',''retail_space'',''retail_requirement'')',
    'c.id=i and c.kind in (''opportunity'',''retail_space'',''retail_requirement'') and ig_private.listing_public_visible(c.kind,c.public_data)');
  if source=changed then raise exception 'Review shortlist lifecycle guard';end if;execute changed;

  source:=pg_get_functiondef('ig_private.submit_enquiry(text,jsonb)'::regprocedure);
  changed:=replace(source,'where slug=p->>''listing_slug'' and kind in (''opportunity'',''retail_space'',''retail_requirement'') limit 1',
    'where slug=p->>''listing_slug'' and kind in (''opportunity'',''retail_space'',''retail_requirement'') and ig_private.listing_public_visible(kind,public_data) limit 1');
  if source=changed then raise exception 'Review enquiry attribution lifecycle guard';end if;execute changed;

  source:=pg_get_functiondef('public.ig_bulk_publication(jsonb)'::regprocedure);
  changed:=replace(source,'then s.version=c.version else s.id is null end',
    'then s.version=c.version and not c.listing_archived and c.status<>''archived'' else s.id is null and not c.listing_archived end');
  if source=changed then raise exception 'Review bulk publication lifecycle verification';end if;execute changed;
end $$;

notify pgrst, 'reload schema';
