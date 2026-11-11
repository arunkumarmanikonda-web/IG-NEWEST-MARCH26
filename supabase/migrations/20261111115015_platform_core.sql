-- India Gully preview: managed auth, least-privilege CMS and audited administration.
create schema if not exists ig_private;
revoke all on schema ig_private from public, anon;
grant usage on schema ig_private to authenticated;

create table public.ig_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(length(display_name)<=120),
 company text not null default '' check(length(company)<=180),
 status text not null default 'active' check(status in ('active','suspended','closed')),
 roles text[] not null default array['client']::text[],
 policy_version text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table ig_private.staff_invites (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 roles text[] not null, accepted_by uuid references auth.users(id), revoked boolean not null default false,
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
insert into ig_private.staff_invites(email,roles) values ('akm@indiagully.com',array['owner']);
create table public.ig_consents (
 id bigint generated always as identity primary key, user_id uuid not null references auth.users(id),
 purpose text not null check(purpose in ('registration','email_marketing','personalisation','remarketing','sms')),
 granted boolean not null, version text not null, practices text[] not null default '{}',
 created_at timestamptz not null default now()
);
create table public.ig_audit (
 id bigint generated always as identity primary key, actor_id uuid, action text not null,
 entity_id text, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.ig_content (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('page','practice','opportunity','product','project','article','person','faq')),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=120),
 title text not null check(length(title) between 1 and 180),
 summary text not null default '' check(length(summary)<=500), body text not null default '' check(length(body)<=100000),
 seo_title text not null default '' check(length(seo_title)<=90), seo_description text not null default '' check(length(seo_description)<=200),
 public_data jsonb not null default '{}' check(jsonb_typeof(public_data)='object'),
 status text not null default 'draft' check(status in ('draft','review','published','archived')),
 version integer not null default 1, published_version integer, created_by uuid references auth.users(id),
 updated_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(kind,slug)
);
create table public.ig_public_content (
 id uuid primary key references public.ig_content(id) on delete cascade,
 kind text not null, slug text not null, title text not null, summary text not null, body text not null,
 seo_title text not null, seo_description text not null, public_data jsonb not null, version integer not null,
 published_at timestamptz not null default now(), unique(kind,slug)
);
create table public.ig_content_revisions (
 id bigint generated always as identity primary key, content_id uuid not null references public.ig_content(id) on delete cascade,
 version integer not null, snapshot jsonb not null, actor_id uuid references auth.users(id), created_at timestamptz not null default now(), unique(content_id,version)
);
create table public.ig_taxonomy (
 id uuid primary key default gen_random_uuid(), dimension text not null check(dimension in ('asset-class','transaction-type','opportunity-context','practice','product-category')),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=80),
 label text not null check(length(label) between 1 and 100), description text not null default '' check(length(description)<=500),
 active boolean not null default true, version integer not null default 1, unique(dimension,slug)
);
create table public.ig_content_tags (
 content_id uuid not null references public.ig_content(id) on delete cascade,
 term_id uuid not null references public.ig_taxonomy(id) on delete restrict, primary key(content_id,term_id)
);
create table ig_private.asset_details (
 content_id uuid primary key references public.ig_content(id) on delete cascade,
 exact_address text not null default '', owner_contact text not null default '', notes text not null default ''
);
create table public.ig_enquiries (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null, practice text not null,
 message text not null, status text not null default 'new' check(status in ('new','assigned','in_progress','closed')),
 assigned_to uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.ig_outbox (
 id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.ig_enquiries(id),
 recipient text not null, kind text not null check(kind in ('internal','acknowledgement')),
 status text not null default 'awaiting_provider' check(status in ('awaiting_provider','queued','accepted','delivered','failed','suppressed')),
 attempts integer not null default 0, created_at timestamptz not null default now(), unique(enquiry_id,recipient,kind)
);
create table ig_private.ingest_config(id boolean primary key default true check(id),secret_hash text not null);
create table ig_private.rate_limits(key text primary key,window_start timestamptz not null,count integer not null);

create function ig_private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ig_profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),120));
 return new;
end $$;
create trigger ig_profile_created after insert on auth.users for each row execute function ig_private.new_profile();

create function ig_private.valid_identity() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>now()))
$$;
create function ig_private.allowed(permission text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare r text[];
begin
 if not ig_private.valid_identity() then return false; end if;
 select roles into r from public.ig_profiles where id=auth.uid() and status='active' and policy_version='2026-11-11';
 if r is null then return false; end if;
 if permission='account' then return true; end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then return false; end if;
 if 'owner'=any(r) then return true; end if;
 return case permission
  when 'admin.read' then r && array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager','sales','auditor']
  when 'content.read' then r && array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager','auditor']
  when 'content.write' then r && array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager']
  when 'content.publish' then r && array['administrator','publisher']
  when 'users.manage' then 'administrator'=any(r)
  when 'enquiries.manage' then r && array['administrator','sales']
  when 'audit.read' then r && array['administrator','auditor']
  else false end;
end $$;
create function ig_private.record_audit(a text,e text,d jsonb default '{}') returns void language sql security definer set search_path='' as $$
 insert into public.ig_audit(actor_id,action,entity_id,detail) values(auth.uid(),a,e,d)
$$;

-- Tables are readable only through row-level policies; writes use audited RPCs.
do $$declare t text;begin
 foreach t in array array['ig_profiles','ig_consents','ig_audit','ig_content','ig_public_content','ig_content_revisions','ig_taxonomy','ig_content_tags','ig_enquiries','ig_outbox'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
grant select on public.ig_public_content,public.ig_taxonomy to anon;
create policy profiles_read on public.ig_profiles for select to authenticated using((id=auth.uid() and ig_private.valid_identity()) or ig_private.allowed('users.manage'));
create policy consents_read on public.ig_consents for select to authenticated using((user_id=auth.uid() and ig_private.valid_identity()) or ig_private.allowed('users.manage'));
create policy audit_read on public.ig_audit for select to authenticated using(ig_private.allowed('audit.read'));
create policy content_read on public.ig_content for select to authenticated using(ig_private.allowed('content.read'));
create policy revisions_read on public.ig_content_revisions for select to authenticated using(ig_private.allowed('content.read'));
create policy public_content_read on public.ig_public_content for select to anon,authenticated using(true);
create policy taxonomy_read on public.ig_taxonomy for select to anon,authenticated using(active or ig_private.allowed('content.read'));
create policy tags_read on public.ig_content_tags for select to authenticated using(ig_private.allowed('content.read'));
create policy enquiries_read on public.ig_enquiries for select to authenticated using(ig_private.allowed('enquiries.manage'));
create policy outbox_read on public.ig_outbox for select to authenticated using(ig_private.allowed('enquiries.manage'));

create function ig_private.account_update(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.valid_identity() then raise exception 'Verified sign-in required' using errcode='42501'; end if;
 if not exists(select 1 from public.ig_profiles where id=auth.uid() and status='active') then raise exception 'Account inactive' using errcode='42501'; end if;
 if p->>'action'='accept_policies' then
  if coalesce(p->>'version','')<>'2026-11-11' or coalesce(p->>'terms','false')<>'true' or coalesce(p->>'privacy','false')<>'true' or coalesce(p->>'dataUse','false')<>'true' then raise exception 'Accept current policies'; end if;
  update public.ig_profiles set policy_version='2026-11-11',updated_at=now() where id=auth.uid();
  insert into public.ig_consents(user_id,purpose,granted,version) values(auth.uid(),'registration',true,'2026-11-11');
 elsif p->>'action'='profile' then
  update public.ig_profiles set display_name=left(coalesce(p->>'display_name',''),120),company=left(coalesce(p->>'company',''),180),updated_at=now() where id=auth.uid();
 elsif p->>'action'='consent' then
  if not ig_private.allowed('account') then raise exception 'Accept current policies'; end if;
  insert into public.ig_consents(user_id,purpose,granted,version,practices) values(auth.uid(),p->>'purpose',(p->>'granted')::boolean,'2026-11-11',array(select jsonb_array_elements_text(coalesce(p->'practices','[]'))));
 else raise exception 'Unsupported action'; end if;
 perform ig_private.record_audit('account.'||(p->>'action'),auth.uid()::text);
 return jsonb_build_object('ok',true);
end $$;
create function public.ig_account_update(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.account_update(p)$$;

create function ig_private.accept_invitation() returns jsonb language plpgsql security definer set search_path='' as $$
declare invite ig_private.staff_invites; mail text;
begin
 if not ig_private.allowed('account') or coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'Verified account and MFA required' using errcode='42501'; end if;
 select lower(email) into mail from auth.users where id=auth.uid();
 select * into invite from ig_private.staff_invites where email=mail and not revoked and accepted_by is null for update;
 if invite.id is null then return jsonb_build_object('accepted',false); end if;
 update public.ig_profiles set roles=invite.roles,updated_at=now() where id=auth.uid();
 update ig_private.staff_invites set accepted_by=auth.uid() where id=invite.id;
 perform ig_private.record_audit('staff.invitation_accepted',auth.uid()::text,jsonb_build_object('roles',invite.roles));
 return jsonb_build_object('accepted',true);
end $$;
create function public.ig_accept_invitation() returns jsonb language sql security invoker set search_path='' as $$select ig_private.accept_invitation()$$;

create function ig_private.save_content(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item public.ig_content; item_id uuid; data jsonb; k text; term uuid;
begin
 if not ig_private.allowed('content.write') then raise exception 'Content permission and MFA required' using errcode='42501'; end if;
 data=coalesce(p->'public_data','{}');
 if coalesce(data->>'image','')<>'' and (data->>'image'!~'^/images/[a-zA-Z0-9._/-]+$' or data->>'image' like '%..%') then raise exception 'Use an approved website media path'; end if;
 if jsonb_typeof(data)<>'object' then raise exception 'Public fields must be an object'; end if;
 for k in select jsonb_object_keys(data) loop
  if k<>all(array['city','region','sector','asset_class','transaction_type','image','image_alt','price_label','reference','confidential','image_identity_reviewed']) then raise exception 'Unapproved public field: %',k; end if;
 end loop;
 if coalesce(data->>'city','')~'[0-9@/\\]' or coalesce(data->>'region','')~'[0-9@/\\]' then raise exception 'Only city/region belongs in public location'; end if;
 if coalesce(data->>'confidential','false')='true' then
  if coalesce(p->>'slug','')!~'^ig-opp-[a-z0-9-]+$' then raise exception 'Confidential teasers require an opaque reference slug'; end if;
  if coalesce(data->>'image','')<>'' and coalesce(data->>'image_identity_reviewed','false')<>'true' then raise exception 'Review identifying imagery'; end if;
 end if;
 if nullif(p->>'id','') is null then
  insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,created_by,updated_by)
  values(p->>'kind',p->>'slug',p->>'title',coalesce(p->>'summary',''),coalesce(p->>'body',''),coalesce(p->>'seo_title',''),coalesce(p->>'seo_description',''),data,auth.uid(),auth.uid()) returning * into item;
 else
  select * into item from public.ig_content where id=(p->>'id')::uuid for update;
  if item.id is null then raise exception 'Content not found'; end if;
  if item.version is distinct from (p->>'version')::integer then raise exception 'Content changed. Reload before saving.' using errcode='40001'; end if;
  update public.ig_content set slug=p->>'slug',title=p->>'title',summary=coalesce(p->>'summary',''),body=coalesce(p->>'body',''),seo_title=coalesce(p->>'seo_title',''),seo_description=coalesce(p->>'seo_description',''),public_data=data,status='draft',version=version+1,updated_by=auth.uid(),updated_at=now() where id=item.id returning * into item;
 end if;
 delete from public.ig_content_tags where content_id=item.id;
 for term in select jsonb_array_elements_text(coalesce(p->'term_ids','[]'))::uuid loop
  if not exists(select 1 from public.ig_taxonomy where id=term and active) then raise exception 'Invalid or retired category'; end if;
  insert into public.ig_content_tags(content_id,term_id) values(item.id,term) on conflict do nothing;
 end loop;
 insert into public.ig_content_revisions(content_id,version,snapshot,actor_id) values(item.id,item.version,to_jsonb(item),auth.uid());
 perform ig_private.record_audit('content.saved',item.id::text,jsonb_build_object('version',item.version));
 return to_jsonb(item);
end $$;
create function public.ig_save_content(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.save_content(p)$$;

create function ig_private.content_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item public.ig_content; a text=p->>'action';
begin
 if not ig_private.allowed('content.publish') then raise exception 'Publishing permission and MFA required' using errcode='42501'; end if;
 select * into item from public.ig_content where id=(p->>'id')::uuid for update;
 if item.id is null then raise exception 'Content not found'; end if;
 if item.version is distinct from (p->>'version')::integer then raise exception 'Revision changed. Review the current version.' using errcode='40001'; end if;
 if a='publish' then
  if coalesce(p->>'factsConfirmed','false')<>'true' or coalesce(p->>'rightsConfirmed','false')<>'true' or coalesce(p->>'privacyConfirmed','false')<>'true' then raise exception 'Verify facts, media rights and privacy before publishing'; end if;
  insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version) values(item.id,item.kind,item.slug,item.title,item.summary,item.body,item.seo_title,item.seo_description,item.public_data,item.version)
  on conflict(id) do update set slug=excluded.slug,title=excluded.title,summary=excluded.summary,body=excluded.body,seo_title=excluded.seo_title,seo_description=excluded.seo_description,public_data=excluded.public_data,version=excluded.version,published_at=now();
  update public.ig_content set status='published',published_version=version where id=item.id;
 elsif a='archive' then
  delete from public.ig_public_content where id=item.id;
  update public.ig_content set status='archived' where id=item.id;
 elsif a='restore' then update public.ig_content set status='draft' where id=item.id;
 elsif a='delete' then
  if item.status<>'archived' then raise exception 'Archive content before permanent deletion'; end if;
  delete from public.ig_content where id=item.id;
 else raise exception 'Unsupported content action'; end if;
 perform ig_private.record_audit('content.'||a,item.id::text,jsonb_build_object('version',item.version));
 return jsonb_build_object('ok',true);
end $$;
create function public.ig_content_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.content_action(p)$$;

create function ig_private.taxonomy_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item public.ig_taxonomy; a text=p->>'action';
begin
 if not ig_private.allowed('content.publish') then raise exception 'Taxonomy permission and MFA required' using errcode='42501'; end if;
 if a='create' then
  insert into public.ig_taxonomy(dimension,slug,label,description) values(p->>'dimension',p->>'slug',p->>'label',coalesce(p->>'description','')) returning * into item;
 else
  select * into item from public.ig_taxonomy where id=(p->>'id')::uuid for update;
  if item.id is null then raise exception 'Category not found'; end if;
  if item.version is distinct from (p->>'version')::integer then raise exception 'Category changed; reload' using errcode='40001'; end if;
  if a='update' then update public.ig_taxonomy set label=p->>'label',description=coalesce(p->>'description',''),active=(p->>'active')::boolean,version=version+1 where id=item.id;
  elsif a='delete' then delete from public.ig_taxonomy where id=item.id;
  else raise exception 'Unsupported category action'; end if;
 end if;
 perform ig_private.record_audit('taxonomy.'||a,item.id::text);
 return jsonb_build_object('ok',true,'id',item.id);
end $$;
create function public.ig_taxonomy_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.taxonomy_action(p)$$;

create function ig_private.users_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.ig_profiles; r text[]; own boolean; a text=p->>'action'; target_id uuid; mail text;
begin
 if not ig_private.allowed('users.manage') then raise exception 'User permission and MFA required' using errcode='42501'; end if;
 select 'owner'=any(roles) into own from public.ig_profiles where id=auth.uid();
 perform pg_advisory_xact_lock(7193321);
 if a in ('invite','update') then
  r=array(select distinct jsonb_array_elements_text(p->'roles'));
  if cardinality(r)=0 or not r<@array['owner','administrator','publisher','editor','property_manager','procurement_manager','marketing_manager','sales','auditor','client','vendor'] then raise exception 'Invalid roles'; end if;
  if 'owner'=any(r) and not own then raise exception 'Only an owner may appoint an owner' using errcode='42501'; end if;
 end if;
 if a='invite' then
  mail=lower(trim(p->>'email'));
  if coalesce(mail,'')!~'^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' then raise exception 'Invalid email'; end if;
  insert into ig_private.staff_invites(email,roles,created_by) values(mail,r,auth.uid()) on conflict(email) do update set roles=excluded.roles,revoked=false,accepted_by=null,created_by=auth.uid();
  perform ig_private.record_audit('user.invited',null,jsonb_build_object('email',mail,'roles',r));
  return jsonb_build_object('ok',true,'notice','Invitation saved. Ask the colleague to register, verify email and complete MFA.');
 end if;
 target_id=(p->>'id')::uuid;
 select * into target from public.ig_profiles where id=target_id for update;
 if target.id is null then raise exception 'User not found'; end if;
 if 'owner'=any(target.roles) and not own then raise exception 'Owner permission required' using errcode='42501'; end if;
 if 'owner'=any(target.roles) and (a='close' or (a='update' and (not 'owner'=any(r) or p->>'status'<>'active'))) and not exists(select 1 from public.ig_profiles where id<>target.id and status='active' and 'owner'=any(roles)) then raise exception 'Cannot remove the last active owner'; end if;
 if a='update' then
  update public.ig_profiles set roles=r,status=p->>'status',display_name=left(coalesce(p->>'display_name',target.display_name),120),company=left(coalesce(p->>'company',target.company),180),updated_at=now() where id=target_id;
  delete from auth.sessions where user_id=target_id;
 elsif a='revoke_sessions' then delete from auth.sessions where user_id=target_id;
 elsif a='close' then
  update public.ig_profiles set status='closed',updated_at=now() where id=target_id;
  delete from auth.sessions where user_id=target_id;
 else raise exception 'Unsupported user action'; end if;
 perform ig_private.record_audit('user.'||a,target_id::text,jsonb_build_object('roles',r));
 return jsonb_build_object('ok',true);
end $$;
create function public.ig_users_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.users_action(p)$$;

create function ig_private.admin_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not ig_private.allowed('admin.read') then raise exception 'Staff access and MFA required' using errcode='42501'; end if;
 return jsonb_build_object('content',(select count(*) from public.ig_content),'published',(select count(*) from public.ig_public_content),'enquiries',case when ig_private.allowed('enquiries.manage') then (select count(*) from public.ig_enquiries where status<>'closed') else null end,'users',case when ig_private.allowed('users.manage') then (select count(*) from public.ig_profiles) else null end);
end $$;
create function public.ig_admin_overview() returns jsonb language sql security invoker set search_path='' as $$select ig_private.admin_overview()$$;

-- Explicit function grants. No definer function is exposed in the public API schema.
revoke all on all functions in schema ig_private from public,anon,authenticated;
grant execute on function ig_private.valid_identity(),ig_private.allowed(text) to authenticated;
grant execute on function ig_private.allowed(text) to anon;
grant execute on function ig_private.account_update(jsonb),ig_private.accept_invitation(),ig_private.save_content(jsonb),ig_private.content_action(jsonb),ig_private.taxonomy_action(jsonb),ig_private.users_action(jsonb),ig_private.admin_overview() to authenticated;
revoke all on function public.ig_account_update(jsonb),public.ig_accept_invitation(),public.ig_save_content(jsonb),public.ig_content_action(jsonb),public.ig_taxonomy_action(jsonb),public.ig_users_action(jsonb),public.ig_admin_overview() from public,anon;
grant execute on function public.ig_account_update(jsonb),public.ig_accept_invitation(),public.ig_save_content(jsonb),public.ig_content_action(jsonb),public.ig_taxonomy_action(jsonb),public.ig_users_action(jsonb),public.ig_admin_overview() to authenticated;

-- Defence in depth for non-exposed tables and indexed access paths.
alter table ig_private.staff_invites enable row level security;
alter table ig_private.asset_details enable row level security;
alter table ig_private.ingest_config enable row level security;
alter table ig_private.rate_limits enable row level security;
create index ig_consents_user_created on public.ig_consents(user_id,created_at desc);
create index ig_audit_created on public.ig_audit(created_at desc);
create index ig_content_updated on public.ig_content(updated_at desc);
create index ig_tags_term on public.ig_content_tags(term_id);
create index ig_enquiries_status_created on public.ig_enquiries(status,created_at desc);
create index ig_outbox_status_created on public.ig_outbox(status,created_at);

create function ig_private.admin_users() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not ig_private.allowed('users.manage') then raise exception 'User permission and MFA required' using errcode='42501'; end if;
 return jsonb_build_object('users',coalesce((select jsonb_agg(row_to_json(q)) from (select p.*,u.email,u.email_confirmed_at from public.ig_profiles p join auth.users u on u.id=p.id order by p.created_at desc limit 250)q),'[]'::jsonb),'invitations',coalesce((select jsonb_agg(row_to_json(q)) from (select id,email,roles,accepted_by,revoked,created_at from ig_private.staff_invites order by created_at desc limit 250)q),'[]'::jsonb));
end $$;
create function public.ig_admin_users() returns jsonb language sql security invoker set search_path='' as $$select ig_private.admin_users()$$;
revoke all on function ig_private.admin_users(),public.ig_admin_users() from public,anon;
grant execute on function ig_private.admin_users(),public.ig_admin_users() to authenticated;

create function ig_private.enquiry_update(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.allowed('enquiries.manage') then raise exception 'Enquiry permission and MFA required' using errcode='42501'; end if;
 update public.ig_enquiries set status=p->>'status',assigned_to=nullif(p->>'assigned_to','')::uuid where id=(p->>'id')::uuid;
 if not found then raise exception 'Enquiry not found'; end if;
 perform ig_private.record_audit('enquiry.updated',p->>'id');
 return jsonb_build_object('ok',true);
end $$;
create function public.ig_enquiry_update(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.enquiry_update(p)$$;
revoke all on function ig_private.enquiry_update(jsonb),public.ig_enquiry_update(jsonb) from public,anon;
grant execute on function ig_private.enquiry_update(jsonb),public.ig_enquiry_update(jsonb) to authenticated;
