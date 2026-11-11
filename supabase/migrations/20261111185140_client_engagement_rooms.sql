-- Private CRM engagements share the existing document broker, never public listings.
create table public.ig_clients (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 180),
 practice text not null check(practice in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate')),
 stage text not null default 'prospect' check(stage in ('lead','prospect','engaged','completed','archived')),
 reference text not null default '' check(length(reference)<=100), notes text not null default '' check(length(notes)<=5000),
 version int not null default 1,created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.ig_client_contacts (
 id uuid primary key default gen_random_uuid(),client_id uuid not null references public.ig_clients(id),
 name text not null check(length(name) between 1 and 120), email text not null check(email=lower(trim(email)) and length(email)<=254 and email~'^[^[:space:]<>@]+@[^[:space:]<>@]+[.][^[:space:]<>@]+$'),
 designation text not null default '' check(length(designation)<=120),active boolean not null default true,
 portal_enabled boolean not null default false,circulation boolean not null default false,
 version int not null default 1,created_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(client_id,email)
);
create table public.ig_engagements (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.ig_clients(id),
 title text not null check(length(title) between 2 and 180),service text not null check(service in ('feasibility','valuation','forensic-audit','operational-audit','financial-review','due-diligence','other')),
 reference text not null check(length(reference) between 2 and 120),confidentiality_reference text not null check(length(confidentiality_reference)<=500),
 confidentiality_confirmed boolean not null default false,active boolean not null default true,version int not null default 1,
 created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(not confidentiality_confirmed or length(confidentiality_reference)>=5)
);
create index ig_clients_creator on public.ig_clients(created_by);
create index ig_clients_practice on public.ig_clients(practice);
create index ig_contacts_creator on public.ig_client_contacts(created_by);
create index ig_contacts_email on public.ig_client_contacts(email) where active and portal_enabled;
create index ig_engagement_client on public.ig_engagements(client_id);
create index ig_engagement_creator on public.ig_engagements(created_by);
alter table public.ig_data_rooms alter column content_id drop not null;
alter table public.ig_data_rooms add column engagement_id uuid unique references public.ig_engagements(id);
alter table public.ig_data_rooms add constraint ig_room_subject check(num_nonnulls(content_id,engagement_id)=1);
alter table public.ig_room_grants alter column user_id drop not null,alter column nda_request_id drop not null;
alter table public.ig_room_grants add column contact_id uuid references public.ig_client_contacts(id);
alter table public.ig_room_grants add constraint ig_grant_subject check((contact_id is null and user_id is not null and nda_request_id is not null) or (contact_id is not null and user_id is null and nda_request_id is null));
create unique index ig_room_contact_unique on public.ig_room_grants(room_id,contact_id) where contact_id is not null;
create index ig_grants_contact on public.ig_room_grants(contact_id);

create function ig_private.client_staff(client uuid,capability text default 'read') returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_clients c where c.id=client and (
 (capability in ('read','crm') and ig_private.allowed('enquiries.manage') and ig_private.scope_allowed(c.practice,'enquiries')) or
 (capability in ('read','rooms') and ig_private.allowed('nda.manage') and ig_private.scope_allowed(c.practice,'data_rooms'))))
$$;
create or replace function ig_private.room_staff(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('nda.manage') and exists(select 1 from public.ig_data_rooms d where d.id=room and
 ((d.content_id is not null and ig_private.content_access(d.content_id,'data_rooms')) or
 (d.engagement_id is not null and exists(select 1 from public.ig_engagements e where e.id=d.engagement_id and ig_private.client_staff(e.client_id,'rooms')))))
$$;
create function ig_private.contact_is_me(contact uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('account') and exists(select 1 from public.ig_client_contacts c join public.ig_clients x on x.id=c.client_id
 join auth.users u on u.id=auth.uid() and lower(u.email)=c.email
 join public.ig_profiles p on p.id=u.id
 where c.id=contact and c.active and c.portal_enabled and x.stage<>'archived' and not p.must_change_password)
$$;
create function ig_private.grant_valid(gid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_room_grants g join public.ig_data_rooms d on d.id=g.room_id
 where g.id=gid and g.active and d.active and g.expires_at>now() and (
 (g.contact_id is null and g.user_id=auth.uid() and ig_private.allowed('account') and
 not exists(select 1 from public.ig_profiles where id=auth.uid() and must_change_password) and exists(select 1 from public.ig_nda_requests n where n.id=g.nda_request_id and n.user_id=auth.uid() and n.content_id=d.content_id and n.status='approved' and n.accepted_at>now()-interval '3 years')) or
 (g.contact_id is not null and ig_private.contact_is_me(g.contact_id) and exists(select 1 from public.ig_engagements e join public.ig_client_contacts c on c.client_id=e.client_id where e.id=d.engagement_id and c.id=g.contact_id and e.active and e.confidentiality_confirmed))
 ))
$$;
create or replace function ig_private.room_access(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.room_staff(room) or exists(select 1 from public.ig_room_grants g where g.room_id=room and ig_private.grant_valid(g.id))
$$;
create or replace function ig_private.room_download(file uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_room_files f where f.id=file and ig_private.room_staff(f.room_id)) or exists(
 select 1 from public.ig_room_files f join public.ig_room_grants g on g.room_id=f.room_id left join public.ig_room_file_rules r on r.grant_id=g.id and r.file_id=f.id
 where f.id=file and f.status='ready' and f.download_enabled and ig_private.grant_valid(g.id)
 and g.download_mode<>'none' and coalesce(r.allow_download,g.download_mode='all'))
$$;
revoke all on function ig_private.client_staff(uuid,text),ig_private.contact_is_me(uuid),ig_private.grant_valid(uuid) from public,anon;
grant execute on function ig_private.client_staff(uuid,text),ig_private.contact_is_me(uuid),ig_private.grant_valid(uuid) to authenticated;
alter table public.ig_clients enable row level security;
alter table public.ig_client_contacts enable row level security;
alter table public.ig_engagements enable row level security;
revoke all on public.ig_clients,public.ig_client_contacts,public.ig_engagements from public,anon,authenticated;
grant select on public.ig_clients,public.ig_client_contacts,public.ig_engagements to authenticated;
create policy crm_read on public.ig_clients for select to authenticated using(ig_private.client_staff(id,'read'));
create policy contacts_read on public.ig_client_contacts for select to authenticated using(ig_private.client_staff(client_id,'read'));
create policy engagements_read on public.ig_engagements for select to authenticated using(ig_private.client_staff(client_id,'rooms'));

create function ig_private.client_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.ig_clients;t public.ig_client_contacts;e public.ig_engagements;result jsonb;practice text;a text=p->>'action';
begin
 if not ig_private.allowed('admin.read') then raise exception 'Staff MFA and current account required' using errcode='42501';end if;
 if a='client_save' then
  if nullif(p->>'id','') is null then
   practice=p->>'practice';
   if not ig_private.allowed('enquiries.manage') or not ig_private.scope_allowed(practice,'enquiries') then raise exception 'Practice CRM permission required' using errcode='42501';end if;
   insert into public.ig_clients(name,practice,stage,reference,notes,created_by) values(trim(p->>'name'),practice,coalesce(p->>'stage','prospect'),trim(coalesce(p->>'reference','')),trim(coalesce(p->>'notes','')),auth.uid()) returning * into c;
  else
   select * into c from public.ig_clients where id=(p->>'id')::uuid for update;
   if not ig_private.client_staff(c.id,'crm') then raise exception 'Practice CRM permission required' using errcode='42501';end if;
   if c.stage='archived' and p->>'stage'<>'archived' and not ig_private.client_staff(c.id,'rooms') then raise exception 'Only a practice administrator may reactivate an archived client';end if;
   if c.version is distinct from (p->>'version')::int then raise exception 'Client changed. Reload.' using errcode='40001';end if;
   if p->>'practice' is distinct from c.practice then raise exception 'Create a separate practice engagement instead of transferring an existing client record';end if;
   update public.ig_clients set name=trim(p->>'name'),stage=p->>'stage',reference=trim(coalesce(p->>'reference','')),notes=trim(coalesce(p->>'notes','')),version=version+1,updated_at=now() where id=c.id returning * into c;
  end if;result=to_jsonb(c);
 elsif a='contact_save' then
  select * into c from public.ig_clients where id=(p->>'client_id')::uuid;
  if not ig_private.client_staff(c.id,'crm') then raise exception 'Practice CRM permission required' using errcode='42501';end if;
  if nullif(p->>'id','') is null then
   if (select count(*) from public.ig_client_contacts where client_id=c.id and active)>=50 then raise exception 'Use up to 50 active contacts per client';end if;
   insert into public.ig_client_contacts(client_id,name,email,designation,active,portal_enabled,circulation,created_by) values(c.id,trim(p->>'name'),lower(trim(p->>'email')),trim(coalesce(p->>'designation','')),true,coalesce((p->>'portal_enabled')::bool,false),coalesce((p->>'circulation')::bool,false),auth.uid()) returning * into t;
  else
   select * into t from public.ig_client_contacts where id=(p->>'id')::uuid and client_id=c.id for update;
   if t.id is null or t.version is distinct from (p->>'version')::int then raise exception 'Contact changed. Reload.' using errcode='40001';end if;
   if exists(select 1 from public.ig_room_grants where contact_id=t.id) and not ig_private.client_staff(c.id,'rooms') then raise exception 'An authorised contact can only be changed by the practice administrator' using errcode='42501';end if;
   if t.email<>lower(trim(p->>'email')) and exists(select 1 from public.ig_room_grants where contact_id=t.id) then raise exception 'An authorised email cannot be reassigned. Disable this contact and create a new contact with separately approved access.';end if;
   update public.ig_client_contacts set name=trim(p->>'name'),email=lower(trim(p->>'email')),designation=trim(coalesce(p->>'designation','')),active=(p->>'active')::bool,portal_enabled=(p->>'portal_enabled')::bool,circulation=(p->>'circulation')::bool,version=version+1 where id=t.id returning * into t;
  end if;result=to_jsonb(t);
 elsif a='engagement_save' then
  select * into c from public.ig_clients where id=(p->>'client_id')::uuid;
  if not ig_private.client_staff(c.id,'rooms') then raise exception 'Practice administrator permission required' using errcode='42501';end if;
  if nullif(p->>'id','') is null then
   insert into public.ig_engagements(client_id,title,service,reference,confidentiality_reference,confidentiality_confirmed,active,created_by) values(c.id,trim(p->>'title'),p->>'service',trim(p->>'reference'),trim(coalesce(p->>'confidentiality_reference','')),coalesce((p->>'confidentiality_confirmed')::bool,false),true,auth.uid()) returning * into e;
   insert into public.ig_data_rooms(engagement_id,title,created_by) values(e.id,e.title,auth.uid());
  else
   select * into e from public.ig_engagements where id=(p->>'id')::uuid and client_id=c.id for update;
   if e.id is null or e.version is distinct from (p->>'version')::int then raise exception 'Engagement changed. Reload.' using errcode='40001';end if;
   update public.ig_engagements set title=trim(p->>'title'),service=p->>'service',reference=trim(p->>'reference'),confidentiality_reference=trim(coalesce(p->>'confidentiality_reference','')),confidentiality_confirmed=(p->>'confidentiality_confirmed')::bool,active=(p->>'active')::bool,version=version+1,updated_at=now() where id=e.id returning * into e;
  end if;result=to_jsonb(e);
 else raise exception 'Unsupported client action';end if;
 perform ig_private.record_audit('crm.'||a,result->>'id');return result;
end $$;
create function public.ig_client_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.client_manage(p)$$;
revoke all on function ig_private.client_manage(jsonb),public.ig_client_manage(jsonb) from public,anon;
grant execute on function ig_private.client_manage(jsonb),public.ig_client_manage(jsonb) to authenticated;

-- Add engagement grants without relaxing the NDA requirement for opportunities.
alter function ig_private.room_manage(jsonb) rename to room_manage_before_engagements;
revoke all on function ig_private.room_manage_before_engagements(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.ig_data_rooms;g public.ig_room_grants;c public.ig_client_contacts;e public.ig_engagements;exp timestamptz;result jsonb;
begin
 if p->>'action'='contact_grant' or (p->>'action'='grant_update' and exists(select 1 from public.ig_room_grants where id=(p->>'id')::uuid and contact_id is not null)) then
  if p->>'action'='contact_grant' then select * into d from public.ig_data_rooms where id=(p->>'room_id')::uuid;
  else
   select * into g from public.ig_room_grants where id=(p->>'id')::uuid for update;
   if g.version is distinct from (p->>'version')::int then raise exception 'Access changed. Reload.' using errcode='40001';end if;
   select * into d from public.ig_data_rooms where id=g.room_id;
  end if;
  if not ig_private.room_staff(d.id) then raise exception 'Practice administrator permission required' using errcode='42501';end if;
  select * into e from public.ig_engagements where id=d.engagement_id;
  select * into c from public.ig_client_contacts where id=coalesce(g.contact_id,(p->>'contact_id')::uuid) and client_id=e.client_id;
  exp=(p->>'expires_at')::timestamptz;
  if c.id is null then raise exception 'Choose a contact belonging to this client';end if;
  if p->>'action'='contact_grant' or coalesce((p->>'active')::bool,false) then
   if not d.active or not e.active or not e.confidentiality_confirmed or not c.active or not c.portal_enabled or exists(select 1 from public.ig_clients where id=e.client_id and stage='archived') then raise exception 'Active client, portal contact, room and confirmed confidentiality terms are required';end if;
   if exp is null or exp<=now() or exp>now()+interval '1 year' then raise exception 'Set an access expiry within one year';end if;
  end if;
  if g.id is null then
   insert into public.ig_room_grants(room_id,contact_id,download_mode,expires_at,created_by) values(d.id,c.id,p->>'download_mode',exp,auth.uid()) returning * into g;
  else
   update public.ig_room_grants set active=(p->>'active')::bool,download_mode=p->>'download_mode',expires_at=exp,version=version+1,updated_at=now() where id=g.id returning * into g;
  end if;
  perform ig_private.record_audit('room.'||(p->>'action'),g.id::text);return to_jsonb(g);
 end if;
 return ig_private.room_manage_before_engagements(p);
end $$;
revoke all on function ig_private.room_manage(jsonb) from public,anon;
grant execute on function ig_private.room_manage(jsonb) to authenticated;
do $$declare s text;begin
 select pg_get_functiondef('ig_private.room_dashboard(jsonb)'::regprocedure) into s;
 s=replace(s,$f$'content_id',d.content_id,$f$,$f$'content_id',d.content_id,'engagement_id',d.engagement_id,'room_type',case when d.engagement_id is null then 'opportunity' else 'engagement' end,$f$);execute s;
end $$;

-- Server-only OTP eligibility; it reveals no account list to an anonymous caller.
create function ig_private.client_login_eligible(secret text,email_address text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 return exists(select 1 from public.ig_client_contacts c join public.ig_clients x on x.id=c.client_id where c.email=lower(trim(email_address)) and c.active and c.portal_enabled and x.stage<>'archived');
end $$;
create function public.ig_client_login_eligible(secret text,email_address text) returns boolean language sql security invoker set search_path='' as $$select ig_private.client_login_eligible(secret,email_address)$$;
revoke all on function ig_private.client_login_eligible(text,text),public.ig_client_login_eligible(text,text) from public;
grant execute on function ig_private.client_login_eligible(text,text),public.ig_client_login_eligible(text,text) to anon,authenticated;

-- Service notices reuse the existing signed Resend event and retry pipeline.
alter table public.ig_outbox alter column enquiry_id drop not null;
alter table public.ig_outbox add column room_id uuid references public.ig_data_rooms(id),add column contact_id uuid references public.ig_client_contacts(id),add column circulation_batch uuid;
alter table public.ig_outbox drop constraint ig_outbox_kind_check;
alter table public.ig_outbox add constraint ig_outbox_kind_check check(kind in ('internal','acknowledgement','room_update'));
alter table public.ig_outbox add constraint ig_outbox_subject check((enquiry_id is not null and room_id is null and contact_id is null and kind in ('internal','acknowledgement')) or (enquiry_id is null and room_id is not null and contact_id is not null and circulation_batch is not null and kind='room_update'));
create unique index ig_room_circulation_once on public.ig_outbox(circulation_batch,contact_id) where circulation_batch is not null;
create index ig_outbox_room on public.ig_outbox(room_id);
create index ig_outbox_contact on public.ig_outbox(contact_id);
create table ig_private.room_circulations(id uuid primary key,room_id uuid not null references public.ig_data_rooms(id),created_by uuid references auth.users(id),created_at timestamptz not null default now());
alter table ig_private.room_circulations enable row level security;
revoke all on ig_private.room_circulations from public,anon,authenticated;
create index ig_circulation_room on ig_private.room_circulations(room_id);
create index ig_circulation_creator on ig_private.room_circulations(created_by);
create function ig_private.circulation_eligible(room uuid,contact uuid,email_address text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_data_rooms d join public.ig_engagements e on e.id=d.engagement_id join public.ig_clients x on x.id=e.client_id
 join public.ig_client_contacts c on c.client_id=x.id join public.ig_room_grants g on g.room_id=d.id and g.contact_id=c.id
 where d.id=room and c.id=contact and c.email=email_address and c.active and c.portal_enabled and c.circulation and x.stage<>'archived' and e.active and e.confidentiality_confirmed and d.active and g.active and g.expires_at>now())
$$;
revoke all on function ig_private.circulation_eligible(uuid,uuid,text) from public,anon,authenticated;
create function ig_private.room_notify(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare room uuid=(p->>'room_id')::uuid;batch uuid=(p->>'batch_id')::uuid;total int;
begin
 if not ig_private.room_staff(room) then raise exception 'Practice administrator permission required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('room-circulation:'||room::text,0));
 if exists(select 1 from ig_private.room_circulations where id=batch and room_id=room) then return jsonb_build_object('duplicate',true,'queued',(select count(*) from public.ig_outbox where circulation_batch=batch));end if;
 if exists(select 1 from ig_private.room_circulations where room_id=room and created_at>now()-interval '5 minutes') then raise exception 'A notice was recently queued. Wait five minutes before circulating again.';end if;
 if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then raise exception 'Email delivery is not enabled';end if;
 insert into ig_private.room_circulations(id,room_id,created_by) values(batch,room,auth.uid());
 insert into public.ig_outbox(room_id,contact_id,circulation_batch,recipient,kind)
 select room,c.id,batch,c.email,'room_update' from public.ig_client_contacts c
 where ig_private.circulation_eligible(room,c.id,c.email) and not exists(select 1 from ig_private.email_suppressions s where s.email=c.email);
 get diagnostics total=row_count;
 if total=0 then raise exception 'No active circulation contacts have an unexpired grant to this room';end if;
 perform ig_private.record_audit('room.circulation_queued',room::text,jsonb_build_object('batch_id',batch,'recipients',total));
 return jsonb_build_object('queued',total,'batch_id',batch);
end $$;
create function public.ig_room_notify(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_notify(p)$$;
revoke all on function ig_private.room_notify(jsonb),public.ig_room_notify(jsonb) from public,anon;
grant execute on function ig_private.room_notify(jsonb),public.ig_room_notify(jsonb) to authenticated;
create policy room_outbox_read on public.ig_outbox for select to authenticated using(room_id is not null and ig_private.room_staff(room_id));
-- Extend the current delivery implementation without losing early-event, lease or retry protections.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.delivery(text,jsonb)'::regprocedure) into s;
 s=replace(s,$f$with pending as ($f$,$f$update public.ig_outbox o set status='suppressed',last_error='Room circulation permission withdrawn' where o.room_id is not null and o.status in ('awaiting_provider','queued','failed') and not ig_private.circulation_eligible(o.room_id,o.contact_id,o.recipient);
  with pending as ($f$);
 s=replace(s,$f$if p->>'action'='prepare' then$f$,$f$if p->>'action'='prepare' then
   if j.room_id is not null and not ig_private.circulation_eligible(j.room_id,j.contact_id,j.recipient) then raise exception 'Room circulation permission withdrawn';end if;$f$);
 s=replace(s,$f$claimed c join public.ig_enquiries e$f$,$f$claimed c left join public.ig_enquiries e$f$);
 execute s;
end $$;
