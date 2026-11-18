-- Customer-owned continuity. No private listing data is copied to saved lists.
create table public.ig_saved_listings (
 user_id uuid not null references auth.users(id) on delete cascade,
 content_id uuid not null references public.ig_content(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,content_id)
);
create index ig_saved_listings_content on public.ig_saved_listings(content_id);
alter table public.ig_saved_listings enable row level security;
revoke all on public.ig_saved_listings from anon,authenticated;
grant select on public.ig_saved_listings to authenticated;
create policy saved_listings_own on public.ig_saved_listings for select to authenticated
 using(user_id=(select auth.uid()) and (select ig_private.allowed('account')));

create function public.ig_customer_shortlist(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a text=p->>'action'; uid uuid=auth.uid(); ids uuid[]; count_after integer;
begin
 if not ig_private.allowed('account') or uid is null then raise exception 'Verified active account required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('shortlist:'||uid::text,0));
 if a='remove' then delete from public.ig_saved_listings where user_id=uid and content_id=(p->>'id')::uuid;
 elsif a in ('add','merge') then
  if a='merge' and (jsonb_typeof(p->'ids') is distinct from 'array' or jsonb_array_length(p->'ids')>100) then raise exception 'Import up to 100 listings';end if;
  ids=case when a='add' then array[(p->>'id')::uuid] else array(select jsonb_array_elements_text(p->'ids')::uuid) end;
  if exists(select from unnest(ids) i where not exists(select from public.ig_public_content c where c.id=i and c.kind in ('opportunity','retail_space','retail_requirement'))) then
   raise exception 'One of these listings is no longer public. Remove it from the browser shortlist before importing.';
  end if;
  select count(*) into count_after from (select content_id from public.ig_saved_listings where user_id=uid union select unnest(ids)) combined;
  if count_after>100 then raise exception 'Your shortlist can hold 100 listings';end if;
  insert into public.ig_saved_listings(user_id,content_id) select uid,i from unnest(ids) i on conflict do nothing;
 elsif a is distinct from 'list' then raise exception 'Unknown shortlist action';end if;
 return coalesce((select jsonb_agg(content_id order by created_at desc) from public.ig_saved_listings where user_id=uid),'[]'::jsonb);
end $$;
revoke all on function public.ig_customer_shortlist(jsonb) from public,anon;
grant execute on function public.ig_customer_shortlist(jsonb) to authenticated;

-- A customer sees only enquiries sent from their verified account email.
-- Internal notes, notification recipients and private staff contact details stay private.
create function public.ig_customer_enquiries() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare mail text;
begin
 if not ig_private.allowed('account') then raise exception 'Verified active account required' using errcode='42501';end if;
 select lower(email) into mail from auth.users where id=auth.uid() and email_confirmed_at is not null;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (
  select e.id,e.practice,e.message,e.created_at,
   case when e.status='closed' then 'Closed' when e.assigned_to is not null then 'With your advisory team' else 'Received for review' end status,
   case when e.assigned_to is not null then coalesce(nullif(p.display_name,''),'India Gully advisory team') else 'India Gully advisory team' end contact
  from public.ig_enquiries e left join public.ig_profiles p on p.id=e.assigned_to
  where lower(e.email)=mail order by e.created_at desc limit 100
 ) x),'[]'::jsonb);
end $$;
revoke all on function public.ig_customer_enquiries() from public,anon;
grant execute on function public.ig_customer_enquiries() to authenticated;

-- Extend the existing allowlist without changing authentication, revision,
-- publication, private-source or media checks.
do $$ declare old text;updated text;begin
 old=pg_get_functiondef('ig_private.save_content_unscoped(jsonb)'::regprocedure);
 updated=replace(old,'''availability'',''seo_keywords''','''availability'',''seo_keywords'',''data_as_of'',''last_verified_at'',''availability_verified_at'',''process_stage'',''management_agreement'',''rent_period'',''area_basis'',''cam'',''taxes'',''possession'',''permitted_use'',''material'',''dimensions'',''finish'',''capacity'',''sample_policy'',''specification_status''');
 if old=updated then raise exception 'Public-field allowlist changed: review migration';end if;
 execute updated;
end $$;

-- Invalid or future verification dates must never appear as availability evidence.
create function ig_private.validate_experience_fields() returns trigger
language plpgsql set search_path='' as $$
declare k text;v text;
begin
 foreach k in array array['last_verified_at','availability_verified_at'] loop
  v=new.public_data->>k;
  if nullif(v,'') is not null and (v!~'^\d{4}-\d{2}-\d{2}$' or v::date>current_date) then raise exception 'Use a valid completed review date for %',k;end if;
 end loop;
 return new;
end $$;
revoke all on function ig_private.validate_experience_fields() from public,anon,authenticated;
create trigger experience_dates before insert or update of public_data on public.ig_content
for each row execute function ig_private.validate_experience_fields();

alter table public.ig_enquiries add column listing_id uuid references public.ig_content(id) on delete set null;
create index ig_enquiries_listing on public.ig_enquiries(listing_id) where listing_id is not null;
do $$ declare old text;updated text;begin
 old=pg_get_functiondef('ig_private.submit_enquiry(text,jsonb)'::regprocedure);
 updated=replace(old,'insert into public.ig_enquiries(feature_id,name','insert into public.ig_enquiries(listing_id,feature_id,name');
 updated=replace(updated,'values(ig_private.conversion_feature(', 'values((select id from public.ig_public_content where slug=p->>''listing_slug'' and kind in (''opportunity'',''retail_space'',''retail_requirement'') limit 1),ig_private.conversion_feature(');
 if old=updated then raise exception 'Enquiry insert changed: review migration';end if;
 execute updated;
end $$;
