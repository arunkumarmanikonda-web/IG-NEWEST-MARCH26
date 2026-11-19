-- A recorded administrator decision may authorise one email address for one room
-- before NDA signing. Standard NDA and engagement grants retain their own rules.
alter table public.ig_room_grants
 add column access_basis text not null default 'standard' check(access_basis in ('standard','admin_authorised')),
 add column recipient_email text,
 add column recipient_name text,
 add column recipient_contact_id uuid references public.ig_client_contacts(id),
 add column authorisation_reason text,
 add column authorised_by uuid references auth.users(id),
 add column authorised_at timestamptz;
alter table public.ig_room_grants drop constraint ig_grant_subject;
alter table public.ig_room_grants add constraint ig_grant_subject check (
 (access_basis='standard' and recipient_email is null and recipient_name is null and recipient_contact_id is null
  and authorisation_reason is null and authorised_by is null and authorised_at is null and
  ((contact_id is null and user_id is not null and nda_request_id is not null) or
   (contact_id is not null and user_id is null and nda_request_id is null))) or
 (access_basis='admin_authorised' and contact_id is null and user_id is null and nda_request_id is null
  and recipient_email is not null and recipient_email=lower(trim(recipient_email)) and length(recipient_email)<=254
  and recipient_email ~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$'
  and recipient_name is not null and length(recipient_name)<=120 and recipient_name !~ '[[:cntrl:]]'
  and authorisation_reason is not null and length(trim(authorisation_reason)) between 5 and 500
  and authorised_by is not null and authorised_at is not null)
);
create unique index ig_room_admin_email_unique on public.ig_room_grants(room_id,recipient_email) where access_basis='admin_authorised';
create index ig_room_admin_contact on public.ig_room_grants(recipient_contact_id) where recipient_contact_id is not null;
create index ig_room_admin_recipient on public.ig_room_grants(recipient_email) where access_basis='admin_authorised' and active;
create index ig_room_authorised_by on public.ig_room_grants(authorised_by) where authorised_by is not null;
create index ig_contacts_email_state on public.ig_client_contacts(email);

-- This predicate does not grant signed-in access: it also serves pre-registration
-- invitations and is deliberately unavailable as an authenticated RPC.
create function ig_private.admin_room_grant_active(gid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_room_grants g join public.ig_data_rooms d on d.id=g.room_id
 where g.id=gid and g.access_basis='admin_authorised' and g.active and g.expires_at>now() and d.active
 and (d.content_id is null or exists(select 1 from public.ig_content c where c.id=d.content_id and c.deleted_at is null and c.status<>'archived'))
 and (d.engagement_id is null or exists(select 1 from public.ig_engagements e join public.ig_clients x on x.id=e.client_id
      where e.id=d.engagement_id and e.active and x.stage<>'archived'))
 and not exists(select 1 from public.ig_retail_accounts a join public.ig_content c on c.id=a.content_id
      where a.engagement_id=d.engagement_id and (c.deleted_at is not null or c.status='archived'))
 and not exists(select 1 from public.ig_client_contacts c join public.ig_clients x on x.id=c.client_id
      where c.email=g.recipient_email and (not c.active or not c.portal_enabled or x.stage='archived'))
 and (g.recipient_contact_id is null or exists(select 1 from public.ig_client_contacts c join public.ig_clients x on x.id=c.client_id
      where c.id=g.recipient_contact_id and c.email=g.recipient_email and c.active and c.portal_enabled and x.stage<>'archived')))
$$;
revoke all on function ig_private.admin_room_grant_active(uuid) from public,anon,authenticated;

alter function ig_private.grant_valid(uuid) rename to grant_valid_before_admin_authority;
revoke all on function ig_private.grant_valid_before_admin_authority(uuid) from public,anon,authenticated;
create function ig_private.grant_valid(gid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.ig_room_grants where id=gid and access_basis='admin_authorised') then
 ig_private.allowed('account') and ig_private.admin_room_grant_active(gid) and exists(
  select 1 from public.ig_room_grants g join auth.users u on lower(u.email)=g.recipient_email
  join public.ig_profiles p on p.id=u.id where g.id=gid and u.id=auth.uid() and not p.must_change_password)
 else ig_private.grant_valid_before_admin_authority(gid) end
$$;
revoke all on function ig_private.grant_valid(uuid) from public,anon;
grant execute on function ig_private.grant_valid(uuid) to authenticated;

alter function ig_private.client_login_eligible(text,text) rename to client_login_eligible_before_admin_authority;
revoke all on function ig_private.client_login_eligible_before_admin_authority(text,text) from public,anon,authenticated;
create function ig_private.client_login_eligible(secret text,email_address text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if ig_private.integration_server(secret) is not true then raise exception 'Server authorisation required' using errcode='42501';end if;
 return ig_private.client_login_eligible_before_admin_authority(secret,email_address) or exists(
  select 1 from public.ig_room_grants g where g.recipient_email=lower(trim(email_address)) and ig_private.admin_room_grant_active(g.id));
end $$;
revoke all on function ig_private.client_login_eligible(text,text) from public;
grant execute on function ig_private.client_login_eligible(text,text) to anon,authenticated;

-- Keep CRM recipient identity changes subject to room administration as well.
alter function ig_private.client_manage(jsonb) rename to client_manage_before_admin_authority;
revoke all on function ig_private.client_manage_before_admin_authority(jsonb) from public,anon,authenticated;
create function ig_private.client_manage(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.ig_client_contacts;
begin
 if p->>'action'='contact_save' and nullif(p->>'id','') is not null then
  select * into c from public.ig_client_contacts where id=(p->>'id')::uuid for update;
  if exists(select 1 from public.ig_room_grants where recipient_contact_id=c.id) then
   if not ig_private.client_staff(c.client_id,'rooms') then raise exception 'Room administration permission required for shared contacts' using errcode='42501';end if;
   if lower(trim(p->>'email')) is distinct from c.email then raise exception 'Disable this shared contact and create a new contact to change its email';end if;
  end if;
 end if;
 return ig_private.client_manage_before_admin_authority(p);
end $$;
revoke all on function ig_private.client_manage(jsonb) from public,anon;
grant execute on function ig_private.client_manage(jsonb) to authenticated;

-- Existing update and file-rule controls remain the administrator's revoke/renew UI.
alter function ig_private.room_manage(jsonb) rename to room_manage_before_admin_authority;
revoke all on function ig_private.room_manage_before_admin_authority(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare g public.ig_room_grants; exp timestamptz; live boolean; ready jsonb;
begin
 if p->>'action'='grant_update' then
  select * into g from public.ig_room_grants where id=(p->>'id')::uuid for update;
  if g.access_basis='admin_authorised' then
   if not ig_private.room_staff(g.room_id) then raise exception 'Room administration permission required' using errcode='42501';end if;
   if g.version is distinct from (p->>'version')::int then raise exception 'Access changed. Reload.' using errcode='40001';end if;
   live=coalesce((p->>'active')::boolean,false);exp=coalesce((p->>'expires_at')::timestamptz,g.expires_at);
   if p->>'download_mode' is null or p->>'download_mode' not in ('none','selected','all') then raise exception 'Choose a download permission';end if;
   if live and (exp<=now() or exp>now()+interval '1 year') then raise exception 'Choose an expiry within one year';end if;
   update public.ig_room_grants set active=live,expires_at=exp,download_mode=p->>'download_mode',version=version+1,updated_at=now() where id=g.id returning * into g;
   if live then
    if not ig_private.admin_room_grant_active(g.id) then raise exception 'An active room and eligible recipient are required';end if;
    ready=public.ig_room_readiness(jsonb_build_object('room_id',g.room_id,'download_mode',g.download_mode));
    if (ready->>'ready')::boolean is not true then raise exception 'Room is not ready. Complete the file checks before enabling access.';end if;
   end if;
   perform ig_private.record_audit('room.admin_authorised_update',g.id::text,jsonb_build_object('active',g.active,'expires_at',g.expires_at,'download_mode',g.download_mode,'reason',g.authorisation_reason));
   return to_jsonb(g);
  end if;
 end if;
 return ig_private.room_manage_before_admin_authority(p);
end $$;
revoke all on function ig_private.room_manage(jsonb) from public,anon;
grant execute on function ig_private.room_manage(jsonb) to authenticated;

alter table public.ig_outbox add column room_grant_id uuid references public.ig_room_grants(id);
create index ig_outbox_room_grant on public.ig_outbox(room_grant_id) where room_grant_id is not null;
create unique index ig_room_admin_circulation_once on public.ig_outbox(circulation_batch,room_grant_id) where room_grant_id is not null;
alter table public.ig_outbox drop constraint ig_outbox_subject;
alter table public.ig_outbox add constraint ig_outbox_subject check (
 (kind in ('internal','acknowledgement') and enquiry_id is not null and collection_link_id is null and room_id is null and contact_id is null and nda_request_id is null and room_grant_id is null) or
 (kind='payment_link' and collection_link_id is not null and enquiry_id is null and room_id is null and contact_id is null and nda_request_id is null and room_grant_id is null) or
 (kind='room_update' and room_id is not null and circulation_batch is not null and enquiry_id is null and collection_link_id is null and num_nonnulls(contact_id,nda_request_id,room_grant_id)=1)
);
create function ig_private.room_notice_eligible(room uuid,contact uuid,nda uuid,email_address text,gid uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select case when gid is null then ig_private.room_notice_eligible(room,contact,nda,email_address) else
 contact is null and nda is null and ig_private.admin_room_grant_active(gid) and exists(
  select 1 from public.ig_room_grants g where g.id=gid and g.room_id=room and g.recipient_email=email_address
  and (g.recipient_contact_id is null or exists(select 1 from public.ig_client_contacts c where c.id=g.recipient_contact_id and c.circulation))
  and not exists(select 1 from public.ig_client_contacts c where c.email=g.recipient_email and not c.circulation)
  and not exists(select 1 from auth.users u left join public.ig_profiles p on p.id=u.id where lower(u.email)=email_address
    and (u.deleted_at is not null or coalesce(u.banned_until>now(),false) or p.status is distinct from 'active')))
 end
$$;
revoke all on function ig_private.room_notice_eligible(uuid,uuid,uuid,text,uuid) from public,anon,authenticated;
do $$ declare src text=pg_get_functiondef('ig_private.delivery(text,jsonb)'::regprocedure);begin
 if strpos(src,'ig_private.room_notice_eligible(o.room_id,o.contact_id,o.nda_request_id,o.recipient)')=0
 or strpos(src,'ig_private.room_notice_eligible(j.room_id,j.contact_id,j.nda_request_id,j.recipient)')=0 then raise exception 'Review current delivery eligibility';end if;
 src=replace(src,'ig_private.room_notice_eligible(o.room_id,o.contact_id,o.nda_request_id,o.recipient)','ig_private.room_notice_eligible(o.room_id,o.contact_id,o.nda_request_id,o.recipient,o.room_grant_id)');
 src=replace(src,'ig_private.room_notice_eligible(j.room_id,j.contact_id,j.nda_request_id,j.recipient)','ig_private.room_notice_eligible(j.room_id,j.contact_id,j.nda_request_id,j.recipient,j.room_grant_id)');
 execute src;
end $$;

alter function ig_private.room_share(jsonb) rename to room_share_before_admin_authority;
revoke all on function ig_private.room_share_before_admin_authority(jsonb) from public,anon,authenticated;
create function ig_private.room_share(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare room uuid=(p->>'room_id')::uuid; batch uuid=(p->>'batch_id')::uuid; intent text=p->>'action';
 previous ig_private.room_share_receipts; hash text=encode(extensions.digest(convert_to((p-'batch_id')::text,'UTF8'),'sha256'),'hex');
 recipients jsonb='{}'; target jsonb; entry record; c public.ig_client_contacts; g public.ig_room_grants;
 email_address text; recipient_name text; reason text=trim(coalesce(p->>'authorisation_reason','')); exp timestamptz;
 ready jsonb; added int=0; renewed int=0; queued int=0; recent int=0; result jsonb;
begin
 if not ig_private.room_staff(room) then raise exception 'Room administration permission required' using errcode='42501';end if;
 if p->>'access_basis' is distinct from 'admin_authorised' or intent is null or intent not in ('share','access') then return ig_private.room_share_before_admin_authority(p);end if;
 if batch is null then raise exception 'A unique sharing request is required';end if;
 perform pg_advisory_xact_lock(hashtextextended('room-circulation:'||room::text,0));
 select * into previous from ig_private.room_share_receipts where batch_id=batch;
 if found then
  if previous.room_id<>room or previous.actor_id<>auth.uid() or previous.request_hash<>hash then raise exception 'Sharing request does not match its previous attempt';end if;
  return previous.result;
 end if;
 if (p->>'confirm_authorisation')::boolean is not true or length(reason) not between 5 and 500 then raise exception 'Confirm your authority and record the reason for access before NDA signing';end if;
 if p->>'download_mode' is null or p->>'download_mode' not in ('none','selected','all') then raise exception 'Choose a download permission';end if;
 exp=(p->>'expires_at')::timestamptz;
 if exp is null or exp<=now() or exp>now()+interval '1 year' then raise exception 'Choose an expiry within one year';end if;
 if jsonb_typeof(coalesce(p->'recipient_ids','[]'))<>'array' or jsonb_typeof(coalesce(p->'recipients','[]'))<>'array' then raise exception 'Choose recipients';end if;
 if jsonb_array_length(coalesce(p->'recipient_ids','[]'))+jsonb_array_length(coalesce(p->'recipients','[]')) not between 1 and 50 then raise exception 'Choose between one and fifty recipients';end if;
 perform 1 from public.ig_data_rooms where id=room for update;
 for target in select value from jsonb_array_elements(coalesce(p->'recipient_ids','[]')) loop
  select * into c from public.ig_client_contacts where id=(target#>>'{}')::uuid;
  if c.id is null or not ig_private.client_staff(c.client_id,'read') or not c.active or not c.portal_enabled
   or not exists(select 1 from public.ig_clients where id=c.client_id and stage<>'archived') then raise exception 'Choose active client contacts with portal access';end if;
  if recipients ? c.email and recipients->c.email->>'contact_id' is distinct from c.id::text then raise exception 'Choose only one client contact for each email address';end if;
  recipients=recipients||jsonb_build_object(c.email,jsonb_build_object('name',c.name,'contact_id',c.id));
 end loop;
 for target in select value from jsonb_array_elements(coalesce(p->'recipients','[]')) loop
  email_address=lower(trim(coalesce(target->>'email','')));recipient_name=trim(coalesce(target->>'name',''));
  if jsonb_typeof(target)<>'object' or length(email_address)>254 or email_address !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$' or length(recipient_name)>120 or recipient_name ~ '[[:cntrl:]]' then raise exception 'Enter a valid recipient email and optional name';end if;
  if not recipients ? email_address then
   -- Entering an existing contact's email must not bypass its portal or email preferences.
   select t.* into c from public.ig_client_contacts t join public.ig_clients x on x.id=t.client_id
    where t.email=email_address order by t.active,t.portal_enabled,(x.stage<>'archived'),t.circulation,t.id limit 1;
   recipients=recipients||jsonb_build_object(email_address,jsonb_build_object('name',recipient_name,'contact_id',c.id));
  end if;
 end loop;
 -- Existing active grants keep their individual permissions on repeated sharing.
 ready=public.ig_room_readiness(p||jsonb_build_object('download_mode',case when p->>'download_mode'='all' and exists(
  select 1 from public.ig_room_grants where room_id=room and access_basis='admin_authorised' and recipients ? recipient_email and active and expires_at>now() and download_mode<>'all') then 'none' else p->>'download_mode' end));
 if (ready->>'ready')::boolean is not true then raise exception 'Room is not ready. Complete file uploads, security checks and previews before sharing.';end if;
 if intent='share' then
  if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then raise exception 'Email delivery is unavailable. Choose access only.';end if;
  insert into ig_private.room_circulations(id,room_id,created_by) values(batch,room,auth.uid());
 end if;
 for entry in select key,value from jsonb_each(recipients) order by key loop
  select * into g from public.ig_room_grants where room_id=room and access_basis='admin_authorised' and recipient_email=entry.key for update;
  if g.id is null then
   insert into public.ig_room_grants(room_id,access_basis,recipient_email,recipient_name,recipient_contact_id,authorisation_reason,authorised_by,authorised_at,download_mode,expires_at,created_by)
   values(room,'admin_authorised',entry.key,entry.value->>'name',(entry.value->>'contact_id')::uuid,reason,auth.uid(),now(),p->>'download_mode',exp,auth.uid()) returning * into g;
   added=added+1;
  else
   if g.recipient_contact_id is null and entry.value->>'contact_id' is not null then
    update public.ig_room_grants set recipient_contact_id=(entry.value->>'contact_id')::uuid,version=version+1,updated_at=now() where id=g.id returning * into g;
   end if;
   if not g.active or g.expires_at<=now() then
    update public.ig_room_grants set active=true,download_mode=p->>'download_mode',expires_at=exp,authorisation_reason=reason,authorised_by=auth.uid(),authorised_at=now(),version=version+1,updated_at=now() where id=g.id returning * into g;
    renewed=renewed+1;
   end if;
  end if;
  if not ig_private.admin_room_grant_active(g.id) then raise exception 'An active room and eligible recipient are required';end if;
  if intent='share' then
   if not ig_private.room_notice_eligible(room,null,null,entry.key,g.id) or exists(select 1 from ig_private.email_suppressions where email=entry.key) then raise exception 'Email is unavailable for this recipient. Check contact permissions or choose access only.';end if;
   if exists(select 1 from public.ig_outbox where room_id=room and recipient=entry.key and status in ('awaiting_provider','queued','accepted','delivered') and created_at>now()-interval '5 minutes') then recent=recent+1;
   else
    insert into public.ig_outbox(room_id,room_grant_id,circulation_batch,recipient,kind) values(room,g.id,batch,entry.key,'room_update');queued=queued+1;
   end if;
  end if;
  perform ig_private.record_audit('room.admin_authorised_'||intent,g.id::text,jsonb_build_object('room_id',room,'recipient',entry.key,'reason',reason,'batch_id',batch,'expires_at',g.expires_at,'download_mode',g.download_mode));
 end loop;
 result=jsonb_build_object('batch_id',batch,'recipients',(select count(*) from jsonb_object_keys(recipients)),'added',added,'renewed',renewed,'queued',queued,'recent',recent);
 insert into ig_private.room_share_receipts(batch_id,room_id,actor_id,request_hash,result) values(batch,room,auth.uid(),hash,result);
 return result;
end $$;
revoke all on function ig_private.room_share(jsonb) from public,anon;
grant execute on function ig_private.room_share(jsonb) to authenticated;
notify pgrst,'reload schema';
