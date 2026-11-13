-- Staff-attributed fixed-amount Razorpay links; public checkout is hosted by Razorpay.
create table public.ig_collection_links (
 id uuid primary key,
 reference text not null unique,
 practice text not null check(practice in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate')),
 contact_id uuid references public.ig_client_contacts(id),
 customer_name text not null check(length(customer_name) between 2 and 120),
 customer_email text not null check(customer_email=lower(trim(customer_email)) and length(customer_email)<=254 and customer_email~'^[^[:space:]<>@,;]+@[^[:space:]<>@,;]+[.][^[:space:]<>@,;]+$'),
 invoice_ref text not null check(length(invoice_ref) between 1 and 80 and invoice_ref!~'[\r\n]'),
 description text not null check(length(description) between 10 and 500),
 amount_paise bigint not null check(amount_paise between 100 and 1000000000),
 amount_paid bigint not null default 0 check(amount_paid>=0 and amount_paid<=amount_paise),
 mode text not null check(mode in ('test','live')),
 status text not null default 'prepared' check(status in ('prepared','creating','review','active','paid','expired','cancelled')),
 provider_id text unique,short_url text,provider_status text,
 created_by uuid not null references auth.users(id),
 collector_name text not null,collector_email text not null,
 created_at timestamptz not null default now(),expires_at timestamptz not null,
 checked_at timestamptz,paid_at timestamptz,note text not null default '',
 lease_token uuid,lease_until timestamptz,operation text,
 last_email_at timestamptz,
 unique(practice,customer_email,invoice_ref)
);
create index ig_collection_creator on public.ig_collection_links(created_by,created_at desc);
create index ig_collection_practice on public.ig_collection_links(practice,created_at desc);
create index ig_collection_contact on public.ig_collection_links(contact_id);
create table ig_private.collection_bindings(id uuid primary key references public.ig_collection_links(id),config jsonb not null);
alter table public.ig_collection_links enable row level security;
alter table ig_private.collection_bindings enable row level security;
revoke all on public.ig_collection_links,ig_private.collection_bindings from public,anon,authenticated;
grant select on public.ig_collection_links to authenticated;
create function ig_private.collection_allowed(practice text) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('admin.read') and ig_private.scope_allowed(practice,'commerce')
 and exists(select 1 from public.ig_profiles where id=auth.uid() and roles&&array['owner','administrator','property_manager','procurement_manager','sales']);
$$;
revoke all on function ig_private.collection_allowed(text) from public,anon;
grant execute on function ig_private.collection_allowed(text) to authenticated;
create policy collection_staff_read on public.ig_collection_links for select to authenticated using(ig_private.collection_allowed(practice));

alter table public.ig_outbox add column collection_link_id uuid references public.ig_collection_links(id);
create index ig_outbox_collection on public.ig_outbox(collection_link_id,created_at desc);
alter table public.ig_outbox drop constraint ig_outbox_kind_check;
alter table public.ig_outbox add constraint ig_outbox_kind_check check(kind in ('internal','acknowledgement','room_update','payment_link'));
alter table public.ig_outbox drop constraint ig_outbox_subject;
alter table public.ig_outbox add constraint ig_outbox_subject check(
 (collection_link_id is null and enquiry_id is not null and room_id is null and contact_id is null and kind in ('internal','acknowledgement')) or
 (collection_link_id is null and enquiry_id is null and room_id is not null and contact_id is not null and circulation_batch is not null and kind='room_update') or
 (collection_link_id is not null and enquiry_id is null and room_id is null and contact_id is null and kind='payment_link'));
create policy collection_email_read on public.ig_outbox for select to authenticated using(collection_link_id is not null and exists(select 1 from public.ig_collection_links c where c.id=collection_link_id and ig_private.collection_allowed(c.practice)));
create function ig_private.collection_emailable(link uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_collection_links c join public.ig_profiles pr on pr.id=c.created_by
 where c.id=link and c.status='active' and c.expires_at>now() and pr.status='active'
 and (c.contact_id is null or exists(select 1 from public.ig_client_contacts ct where ct.id=c.contact_id and ct.active and ct.email=c.customer_email)));
$$;
revoke all on function ig_private.collection_emailable(uuid) from public,anon,authenticated;
create function ig_private.collection_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_collection_links;c ig_private.integration_config;ct public.ig_client_contacts;nm text;em text;collector text;collector_email text;request uuid;result jsonb;op text=p->>'operation';
begin
 if not ig_private.allowed('admin.read') then raise exception 'Staff sign-in and MFA required' using errcode='42501';end if;
 if p->>'action'='context' then
  return jsonb_build_object('practices',(select coalesce(jsonb_agg(k),'[]') from unnest(array['real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate'])k where ig_private.collection_allowed(k)),
   'contacts',(select coalesce(jsonb_agg(jsonb_build_object('id',ct.id,'name',ct.name,'email',ct.email,'client',cl.name,'practice',cl.practice) order by cl.name,ct.name),'[]') from public.ig_client_contacts ct join public.ig_clients cl on cl.id=ct.client_id where ct.active and cl.stage<>'archived' and ig_private.collection_allowed(cl.practice)),
   'max_amount_paise',(select (settings->>'max_payment_paise')::bigint from ig_private.integration_config where id='razorpay'),
   'mode',(select mode from ig_private.integration_config where id='razorpay'),
   'collector',(select display_name from public.ig_profiles where id=auth.uid()));
 elsif p->>'action'='list' then
  return coalesce((select jsonb_agg(to_jsonb(t)-'lease_token'-'lease_until'-'operation') from
   (select l.*,(select o.status from public.ig_outbox o where o.collection_link_id=l.id order by o.created_at desc limit 1) as email_status
    from public.ig_collection_links l where ig_private.collection_allowed(l.practice) order by l.created_at desc limit 250)t),'[]');
 elsif p->>'action'='prepare' then
  if not ig_private.collection_allowed(p->>'practice') then raise exception 'Collection permission for this practice required' using errcode='42501';end if;
  if p->>'confirmed' is distinct from 'true' then raise exception 'Review the agreed amount, recipient and purpose';end if;
  request=(p->>'request_id')::uuid;
  select * into r from public.ig_collection_links where id=request;
  if r.id is not null then
   if r.created_by<>auth.uid() or r.practice is distinct from p->>'practice' or r.amount_paise is distinct from (p->>'amount_paise')::bigint or r.invoice_ref is distinct from trim(p->>'invoice_ref') or r.description is distinct from trim(p->>'description') or r.expires_at is distinct from (p->>'expires_at')::timestamptz or r.contact_id is distinct from nullif(p->>'contact_id','')::uuid or (r.contact_id is null and (r.customer_email is distinct from lower(trim(p->>'customer_email')) or r.customer_name is distinct from trim(p->>'customer_name'))) then raise exception 'Existing request differs. Review it before creating another.';end if;
   return to_jsonb(r)-'lease_token'-'lease_until'-'operation';
  end if;
  if nullif(p->>'contact_id','') is not null then
   select * into ct from public.ig_client_contacts where id=(p->>'contact_id')::uuid and active;
   if ct.id is null or not exists(select 1 from public.ig_clients where id=ct.client_id and practice=p->>'practice' and stage<>'archived') then raise exception 'Choose an active contact in this practice';end if;
   nm=ct.name;em=ct.email;
  else nm=trim(p->>'customer_name');em=lower(trim(p->>'customer_email'));end if;
  select * into c from ig_private.integration_config where id='razorpay' and mode in ('test','live');
  if c.id is null or (p->>'amount_paise')::bigint>coalesce((c.settings->>'max_payment_paise')::bigint,0) then raise exception 'Razorpay is not enabled for this amount';end if;
  if c.mode='live' and (not exists(select 1 from ig_private.integration_config where id='business' and settings->>'statutory_details_confirmed'='true') or not exists(select 1 from public.ig_policy_releases where current and legal_reviewed)) then raise exception 'Company activation required';end if;
  if (p->>'expires_at')::timestamptz<=now()+interval '1 minute' or (p->>'expires_at')::timestamptz>now()+interval '90 days' then raise exception 'Expiry must be within 90 days';end if;
  perform pg_advisory_xact_lock(hashtextextended('collection:'||auth.uid(),0));
  if (select count(*) from public.ig_collection_links where created_by=auth.uid() and created_at>now()-interval '1 day')>=100 then raise exception 'Daily collection request limit reached';end if;
  select coalesce(nullif(trim(pr.display_name),''),'India Gully team'),u.email into collector,collector_email from public.ig_profiles pr join auth.users u on u.id=pr.id where pr.id=auth.uid();
  insert into public.ig_collection_links(id,reference,practice,contact_id,customer_name,customer_email,invoice_ref,description,amount_paise,mode,created_by,collector_name,collector_email,expires_at)
   values(request,'IG-COL-'||to_char(now() at time zone 'Asia/Kolkata','YYYYMMDD')||'-'||upper(left(replace(request::text,'-',''),12)),p->>'practice',ct.id,nm,em,trim(p->>'invoice_ref'),trim(p->>'description'),(p->>'amount_paise')::bigint,c.mode,auth.uid(),collector,collector_email,(p->>'expires_at')::timestamptz) returning * into r;
  insert into ig_private.collection_bindings(id,config) values(r.id,to_jsonb(c));
  perform ig_private.record_audit('collection.created',r.id::text,jsonb_build_object('reference',r.reference,'amount_paise',r.amount_paise,'collector',r.created_by));
  return to_jsonb(r)-'lease_token'-'lease_until'-'operation';
 end if;
 select * into r from public.ig_collection_links where id=(p->>'id')::uuid for update;
 if r.id is null or not ig_private.collection_allowed(r.practice) then raise exception 'Collection permission required' using errcode='42501';end if;
 if p->>'action'='claim' then
  if op not in ('create','refresh','cancel') then raise exception 'Choose a collection action';end if;
  if r.lease_until>now() then raise exception 'This request is being checked. Retry shortly.';end if;
  if op='create' and r.status<>'prepared' then return jsonb_build_object('reuse',true,'id',r.id);end if;
  if op='create' and r.expires_at<=now() then raise exception 'Request expired';end if;
  if op='cancel' and r.status not in ('active','review') then raise exception 'Only unpaid links may be cancelled';end if;
  if op='refresh' and r.checked_at>now()-interval '10 seconds' then raise exception 'Wait a few seconds before checking again';end if;
  update public.ig_collection_links set status=case when op='create' then 'creating' else status end,operation=op,lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes' where id=r.id returning * into r;
  return jsonb_build_object('id',r.id,'lease_token',r.lease_token);
 elsif p->>'action'='email' then
  if p->>'confirmed' is distinct from 'true' then raise exception 'Confirm the recipient and amount before emailing';end if;
  if p->>'recipient' is distinct from r.customer_email or (p->>'amount_paise')::bigint is distinct from r.amount_paise then raise exception 'Payment email review does not match';end if;
  request=(p->>'request_id')::uuid;
  select jsonb_build_object('id',id,'status',status) into result from public.ig_outbox where id=request and collection_link_id=r.id;
  if result is not null then return result;end if;
  if not ig_private.collection_emailable(r.id) then raise exception 'Only active unpaid requests can be emailed';end if;
  if r.last_email_at>now()-interval '10 minutes' then raise exception 'This request was emailed recently. Check its delivery status before resending.';end if;
  if exists(select 1 from ig_private.email_suppressions where email=r.customer_email) then raise exception 'This recipient has a delivery restriction. Review the email address.';end if;
  if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then raise exception 'Email delivery is not enabled';end if;
  insert into public.ig_outbox(id,collection_link_id,recipient,kind,status) values(request,r.id,r.customer_email,'payment_link','queued');
  update public.ig_collection_links set last_email_at=now() where id=r.id;
  perform ig_private.record_audit('collection.email_queued',r.id::text,jsonb_build_object('reference',r.reference,'recipient',r.customer_email));
  return jsonb_build_object('id',request,'status','queued');
 end if;
 raise exception 'Unsupported collection action';
end $$;
create function public.ig_collection_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.collection_manage(p)$$;
revoke all on function public.ig_collection_manage(jsonb),ig_private.collection_manage(jsonb) from public,anon;
grant execute on function public.ig_collection_manage(jsonb),ig_private.collection_manage(jsonb) to authenticated;
create function ig_private.collection_server(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_collection_links;state text;result jsonb;
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 if p->>'action'='claim_due' then
  if p->>'mode' not in ('test','live') then raise exception 'Choose payment mode';end if;
  with pending as (
   select id from public.ig_collection_links where mode=p->>'mode' and status in ('active','creating','review')
    and (lease_until is null or lease_until<now()) and created_at<now()-interval '2 minutes'
    and expires_at>now()-interval '7 days'
    and (checked_at is null or checked_at<now()-case when status in ('review','creating') then interval '1 hour' else interval '3 minutes' end)
   order by checked_at nulls first,created_at limit 5 for update skip locked
  ),claimed as (
   update public.ig_collection_links c set operation='refresh',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
    from pending where c.id=pending.id returning c.id,c.lease_token
  ) select coalesce(jsonb_agg(to_jsonb(claimed)),'[]') into result from claimed;
  return result;
 end if;
 select * into r from public.ig_collection_links where id=(p->>'id')::uuid for update;
 if r.id is null then raise exception 'Collection not found';end if;
 if p->>'action'='get' then return jsonb_build_object('request',to_jsonb(r),'config',(select config from ig_private.collection_bindings where id=r.id));end if;
 if r.lease_token is distinct from (p->>'lease_token')::uuid or r.lease_until<=now() or r.lease_token is null then raise exception 'Collection operation expired';end if;
 if p->>'action'='fail' then
  update public.ig_collection_links set status=case when status='creating' then 'review' else status end,checked_at=now(),note='Provider outcome needs review. Refresh this request before issuing another.',lease_token=null,lease_until=null where id=r.id;
  return '{"ok":true}';
 elsif p->>'action'='finish' then
  if p->>'provider_id'!~'^plink_[A-Za-z0-9]+$' or (r.provider_id is not null and r.provider_id is distinct from p->>'provider_id') or p->>'short_url'!~'^https://rzp[.]io/[^[:space:]]+$' or (p->>'amount_paid')::bigint not between 0 and r.amount_paise then raise exception 'Invalid provider binding';end if;
  state=case p->>'provider_status' when 'created' then 'active' when 'paid' then 'paid' when 'expired' then 'expired' when 'cancelled' then 'cancelled' when 'partially_paid' then 'review' end;
  if state is null or (state='paid' and (p->>'amount_paid')::bigint<>r.amount_paise) then raise exception 'Payment amount mismatch';end if;
  if r.status='paid' and state<>'paid' then raise exception 'Paid collection cannot regress';end if;
  update public.ig_collection_links set provider_id=p->>'provider_id',short_url=p->>'short_url',provider_status=p->>'provider_status',status=state,amount_paid=(p->>'amount_paid')::bigint,paid_at=case when state='paid' then coalesce(paid_at,now()) else paid_at end,checked_at=now(),lease_token=null,lease_until=null,note=case when state='review' then 'Unexpected partial payment requires reconciliation.' else '' end where id=r.id returning * into r;
  perform ig_private.record_audit('collection.'||state,r.id::text,jsonb_build_object('reference',r.reference,'collector',r.created_by,'amount_paid',r.amount_paid));
  return to_jsonb(r)-'lease_token'-'lease_until'-'operation';
 end if;
 raise exception 'Unknown collection provider action';
end $$;
create function public.ig_collection_server(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.collection_server(secret,p)$$;
revoke all on function public.ig_collection_server(text,jsonb),ig_private.collection_server(text,jsonb) from public,anon,authenticated;
grant execute on function public.ig_collection_server(text,jsonb),ig_private.collection_server(text,jsonb) to anon,authenticated;
-- Preserve existing transactional delivery leases, retries, signatures and idempotency.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.delivery(text,jsonb)'::regprocedure) into s;
 if position('claimed c left join public.ig_enquiries e on e.id=c.enquiry_id' in s)=0 then raise exception 'Unexpected delivery function; review before migrating';end if;
 s=replace(s,'with pending as (',$f$update public.ig_outbox o set status='suppressed',last_error='Payment request no longer available' where o.collection_link_id is not null and o.status in ('awaiting_provider','queued','failed') and not ig_private.collection_emailable(o.collection_link_id);
  with pending as ($f$);
 s=replace(s,$f$jsonb_build_object('enquiry',to_jsonb(e))$f$,$f$jsonb_build_object('enquiry',to_jsonb(e),'contact_name',(select name from public.ig_client_contacts where id=c.contact_id),'collection',(select to_jsonb(l)-'lease_token'-'lease_until'-'operation' from public.ig_collection_links l where l.id=c.collection_link_id))$f$);
 s=replace(s,$f$if p->>'action'='prepare' then$f$,$f$if p->>'action'='prepare' then
   if j.collection_link_id is not null and not ig_private.collection_emailable(j.collection_link_id) then raise exception 'Payment request no longer available';end if;$f$);
 execute s;
end $$;
