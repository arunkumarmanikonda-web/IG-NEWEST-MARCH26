-- Private customer/supplier journeys. Commercial decisions stay deterministic.
create table public.ig_procurement_requests (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 rfq_id uuid not null unique references public.ig_operations(id),client_id uuid not null references public.ig_clients(id),
 reference text not null unique,requirement jsonb not null,status text not null default 'submitted' check(status in ('submitted','quoted','accepted','cancelled')),
 quotation jsonb,quote_version int not null default 0,payment_request_id uuid unique references public.ig_payment_requests(id),
 request_id uuid not null unique,payload_hash text not null,version int not null default 1,
 accepted_at timestamptz,accepted_policy text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index ig_procurement_user on public.ig_procurement_requests(user_id,created_at desc);
create index ig_procurement_client on public.ig_procurement_requests(client_id);
create table public.ig_vendor_contacts (
 id uuid primary key default gen_random_uuid(),vendor_id uuid not null references public.ig_operations(id),
 email text not null check(email=lower(trim(email)) and length(email)<=254 and email~'^[^[:space:]<>@]+@[^[:space:]<>@]+[.][^[:space:]<>@]+$'),
 active boolean not null default true,version int not null default 1,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(vendor_id,email)
);
create index ig_vendor_contact_creator on public.ig_vendor_contacts(created_by);
create table public.ig_vendor_assignments (
 id uuid primary key default gen_random_uuid(),rfq_id uuid not null references public.ig_operations(id),vendor_id uuid not null references public.ig_operations(id),
 expires_at timestamptz not null,active boolean not null default true,quote_id uuid unique references public.ig_operations(id),
 version int not null default 1,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(rfq_id,vendor_id)
);
create index ig_vendor_assignment_vendor on public.ig_vendor_assignments(vendor_id);
create index ig_vendor_assignment_creator on public.ig_vendor_assignments(created_by);
create function ig_private.procurement_identity() returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('account') and not exists(select 1 from public.ig_profiles where id=auth.uid() and must_change_password)
$$;
create function ig_private.vendor_access(vendor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.procurement_identity() and exists(select 1 from public.ig_vendor_contacts c join auth.users u on u.id=auth.uid() and lower(u.email)=c.email join public.ig_operations v on v.id=c.vendor_id where c.vendor_id=vendor and c.active and v.kind='vendor' and v.status='active' and not v.archived)
$$;
revoke all on function ig_private.procurement_identity(),ig_private.vendor_access(uuid) from public,anon;
grant execute on function ig_private.procurement_identity(),ig_private.vendor_access(uuid) to authenticated;
alter table public.ig_procurement_requests enable row level security;
alter table public.ig_vendor_contacts enable row level security;
alter table public.ig_vendor_assignments enable row level security;
revoke all on public.ig_procurement_requests,public.ig_vendor_contacts,public.ig_vendor_assignments from public,anon,authenticated;
grant select on public.ig_procurement_requests,public.ig_vendor_contacts,public.ig_vendor_assignments to authenticated;
create policy procurement_read on public.ig_procurement_requests for select to authenticated using((user_id=(select auth.uid()) and (select ig_private.procurement_identity())) or (select ig_private.ops_allowed('horeca','commerce')));
create policy vendor_contacts_read on public.ig_vendor_contacts for select to authenticated using((select ig_private.ops_allowed('horeca','commerce')));
create policy vendor_assignments_read on public.ig_vendor_assignments for select to authenticated using((select ig_private.ops_allowed('horeca','commerce')));

create function ig_private.procurement(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action';r public.ig_procurement_requests;cid uuid;rid uuid;ref text;lines jsonb='[]';l jsonb;product jsonb;qty numeric;n int=0;digest text;total numeric=0;base numeric;quote jsonb;pay uuid;expiry timestamptz;contact_count int;me public.ig_profiles;email_address text;
begin
 if not ig_private.procurement_identity() then raise exception 'Complete verified sign-in and current account policies' using errcode='42501';end if;
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>120000 then raise exception 'Invalid request';end if;
 if a='submit' then
  perform pg_advisory_xact_lock(hashtextextended('ig-procurement-'||auth.uid()::text,0));
  digest=encode(extensions.digest(convert_to((p-'request_id')::text,'UTF8'),'sha256'),'hex');
  select * into r from public.ig_procurement_requests where request_id=(p->>'request_id')::uuid;
  if r.id is not null then if r.user_id<>auth.uid() or r.payload_hash<>digest then raise exception 'Request identity already used';end if;return to_jsonb(r);end if;
  if (select count(*) from public.ig_procurement_requests where user_id=auth.uid() and created_at>now()-interval '24 hours')>=20 then raise exception 'Daily request limit reached';end if;
  if length(trim(coalesce(p->>'title',''))) not between 2 and 180 or length(trim(coalesce(p->>'destination',''))) not between 5 and 2000 or length(coalesce(p->>'notes',''))>4000 then raise exception 'Enter a title, delivery destination and concise requirements';end if;
  if jsonb_typeof(p->'lines') is distinct from 'array' or jsonb_array_length(p->'lines') not between 1 and 100 then raise exception 'Include 1–100 products or requirement lines';end if;
  if nullif(p->>'required_by','') is not null and (p->>'required_by')::date<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Required delivery cannot be in the past';end if;
  for l in select * from jsonb_array_elements(p->'lines') loop
   n=n+1;qty=(l->>'quantity')::numeric;if qty is null or qty<=0 or qty>10000000 or qty<>round(qty,3) then raise exception 'Invalid quantity';end if;
   if nullif(l->>'product_id','') is not null then
    select to_jsonb(c) into product from public.ig_public_content c where c.id=(l->>'product_id')::uuid and c.kind='product';
    if product is null then raise exception 'A selected product has been withdrawn. Refresh the catalogue';end if;
    if coalesce(product->'public_data'->>'moq','')~'^[0-9]+([.][0-9]+)?$' and qty<(product->'public_data'->>'moq')::numeric then raise exception 'Quantity is below the published minimum';end if;
    if coalesce(product->'public_data'->>'pack_size','')~'^[0-9]+([.][0-9]+)?$' and (product->'public_data'->>'pack_size')::numeric>0 and mod(qty,(product->'public_data'->>'pack_size')::numeric)<>0 then raise exception 'Quantity must match the published pack size';end if;
    lines=lines||jsonb_build_array(jsonb_build_object('line_id','L'||n,'product_id',product->>'id','description',left(product->>'title',1000),'sku',coalesce(product->'public_data'->>'sku',''),'uom',coalesce(nullif(product->'public_data'->>'uom',''),'nos'),'quantity',qty,'unit_rate',0,'gst_pct',0));
   else
    if length(trim(coalesce(l->>'description',''))) not between 2 and 1000 or length(trim(coalesce(l->>'uom',''))) not between 1 and 30 then raise exception 'Custom lines need a description and unit';end if;
    lines=lines||jsonb_build_array(jsonb_build_object('line_id','L'||n,'description',trim(l->>'description'),'sku','','uom',trim(l->>'uom'),'quantity',qty,'unit_rate',0,'gst_pct',0));
   end if;
  end loop;
  select * into me from public.ig_profiles where id=auth.uid();select lower(email) into email_address from auth.users where id=auth.uid();
  select count(*),(array_agg(c.client_id))[1] into contact_count,cid from public.ig_client_contacts c join public.ig_clients x on x.id=c.client_id where c.email=email_address and c.active and c.portal_enabled and x.stage<>'archived';
  if contact_count<>1 then
   select client_id into cid from public.ig_procurement_requests where user_id=auth.uid() order by created_at desc limit 1;
   if cid is null then
    insert into public.ig_clients(name,practice,stage,created_by) values(left(coalesce(nullif(me.company,''),me.display_name,'Website customer'),180),'horeca','lead',auth.uid()) returning id into cid;
    insert into public.ig_client_contacts(client_id,name,email,portal_enabled,created_by) values(cid,coalesce(nullif(me.display_name,''),'Website customer'),email_address,true,auth.uid());
   end if;
  end if;
  rid=gen_random_uuid();ref='WEB-'||upper(left(replace(rid::text,'-',''),12));
  insert into public.ig_operations(id,kind,practice,client_id,title,status,data,request_id,created_by,updated_by)
   values(rid,'rfq','horeca',cid,trim(p->>'title'),'open',jsonb_build_object('reference',ref,'destination',trim(p->>'destination'),'required_by',coalesce(p->>'required_by',''),'terms',coalesce(p->>'notes',''),'lines',lines),gen_random_uuid(),auth.uid(),auth.uid());
  insert into public.ig_procurement_requests(user_id,rfq_id,client_id,reference,requirement,request_id,payload_hash)
   values(auth.uid(),rid,cid,ref,jsonb_build_object('title',trim(p->>'title'),'destination',trim(p->>'destination'),'required_by',coalesce(p->>'required_by',''),'notes',coalesce(p->>'notes',''),'lines',lines),(p->>'request_id')::uuid,digest) returning * into r;
  perform ig_private.record_audit('procurement.submitted',r.id::text);return to_jsonb(r);
 end if;
 select * into r from public.ig_procurement_requests where id=(p->>'id')::uuid for update;
 if r.id is null then raise exception 'Request unavailable';end if;
 if a in ('quote','invoice','close') then
  if not ig_private.ops_allowed('horeca','commerce') then raise exception 'Procurement permission and MFA required' using errcode='42501';end if;
 else
  if r.user_id<>auth.uid() then raise exception 'Request unavailable' using errcode='42501';end if;
 end if;
 if r.version is distinct from (p->>'version')::int then raise exception 'Request changed. Reload before continuing' using errcode='40001';end if;
 if a='quote' then
  if r.status not in ('submitted','quoted') or p->>'reviewed' is distinct from 'true' then raise exception 'Review specifications, tax, total, availability and delivery before releasing a quote';end if;
  quote=p->'quotation';
  perform ig_private.ops_validate('quote',jsonb_build_object('vendor_id',r.rfq_id::text,'reference','CUSTOMER','valid_until',quote->>'valid_until','freight',quote->'freight','discount',quote->'discount','terms',quote->>'terms','lines',quote->'lines'));
  if length(trim(coalesce(quote->>'terms',''))) not between 10 and 4000 then raise exception 'State payment, delivery, warranty and cancellation terms';end if;
  if nullif(quote->>'valid_until','') is null or (quote->>'valid_until')::date<(now() at time zone 'Asia/Kolkata')::date or (quote->>'valid_until')::date>(now() at time zone 'Asia/Kolkata')::date+89 then raise exception 'Quote validity must be within 90 days';end if;
  if jsonb_array_length(quote->'lines')<>jsonb_array_length(r.requirement->'lines') then raise exception 'Quote every requested line';end if;
  lines='[]';
  for l in select * from jsonb_array_elements(quote->'lines') loop
   select x into product from jsonb_array_elements(r.requirement->'lines') x where x->>'line_id'=l->>'line_id';
   if product is null or product->'quantity'<>l->'quantity' or product->>'uom'<>l->>'uom' then raise exception 'Quote lines must match the requested quantities and units';end if;
   if (l->>'unit_rate')::numeric<=0 then raise exception 'Every quoted unit rate must be positive';end if;
   base=round((l->>'unit_rate')::numeric*(l->>'quantity')::numeric*100);total=total+base+round(base*(l->>'gst_pct')::numeric/100);
   lines=lines||jsonb_build_array(product||jsonb_build_object('description',l->>'description','unit_rate',(l->>'unit_rate')::numeric,'gst_pct',(l->>'gst_pct')::numeric));
  end loop;
  total=total+round(coalesce((quote->>'freight')::numeric,0)*100)-round(coalesce((quote->>'discount')::numeric,0)*100);
  if total<100 or total>1000000000 then raise exception 'Total must be between INR 1 and INR 1 crore';end if;
  quote=jsonb_build_object('lines',lines,'freight',coalesce((quote->>'freight')::numeric,0),'discount',coalesce((quote->>'discount')::numeric,0),'terms',trim(quote->>'terms'),'valid_until',quote->>'valid_until','total_paise',total,'issued_at',now(),'issued_by',auth.uid());
  update public.ig_procurement_requests set status='quoted',quotation=quote,quote_version=quote_version+1,version=version+1,updated_at=now() where id=r.id returning * into r;
 elsif a='accept' then
  if r.status<>'quoted' or r.quote_version is distinct from (p->>'quote_version')::int or p->>'accepted' is distinct from 'true' or (r.quotation->>'valid_until')::date<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Accept the current unexpired quotation and terms';end if;
  update public.ig_procurement_requests set status='accepted',accepted_at=now(),accepted_policy=ig_private.current_policy(),version=version+1,updated_at=now() where id=r.id returning * into r;
 elsif a='invoice' then
  if r.status<>'accepted' or r.payment_request_id is not null then raise exception 'A customer-accepted quote without a payment request is required';end if;
  expiry=least(now()+interval '14 days',((r.quotation->>'valid_until')::date+1)::timestamp at time zone 'Asia/Kolkata');if expiry<=now() then raise exception 'Accepted quotation expired; agree a revised request';end if;
  insert into public.ig_payment_requests(user_id,invoice_ref,description,practice,amount_paise,created_by,expires_at)
   values(r.user_id,r.reference||'-Q'||r.quote_version,'Accepted procurement quotation: '||(r.requirement->>'title'),'horeca',(r.quotation->>'total_paise')::bigint,auth.uid(),expiry) returning id into pay;
  update public.ig_procurement_requests set payment_request_id=pay,version=version+1,updated_at=now() where id=r.id returning * into r;
 elsif a='cancel' then
  if r.status not in ('submitted','quoted') or exists(select 1 from public.ig_operations where parent_id=r.rfq_id and kind='order' and status<>'cancelled') then raise exception 'Contact the team about cancellation of an accepted quotation';end if;
  update public.ig_procurement_requests set status='cancelled',version=version+1,updated_at=now() where id=r.id returning * into r;
  update public.ig_operations set status='closed',version=version+1,updated_at=now(),updated_by=auth.uid() where id=r.rfq_id;
  update public.ig_vendor_assignments set active=false,version=version+1 where rfq_id=r.rfq_id;
 else raise exception 'Unknown procurement action';end if;
 perform ig_private.record_audit('procurement.'||a,r.id::text,jsonb_build_object('quote_version',r.quote_version));return to_jsonb(r);
end $$;

create function ig_private.vendor_portal(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action';v public.ig_operations;r public.ig_operations;bid public.ig_operations;assignment public.ig_vendor_assignments;contact public.ig_vendor_contacts;d jsonb;l jsonb;line jsonb;
begin
 if not ig_private.procurement_identity() then raise exception 'Verified account required' using errcode='42501';end if;
 if a='dashboard' then
  return coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'expires_at',x.expires_at,'version',x.version,'rfq',jsonb_build_object('title',rf.title,'reference',rf.data->>'reference','lines',(select jsonb_agg(sx.value-'unit_rate'-'gst_pct') from jsonb_array_elements(rf.data->'lines') sx(value)),'destination',rf.data->>'destination','required_by',rf.data->>'required_by','terms',rf.data->>'terms'),'quote',case when q.id is not null then jsonb_build_object('id',q.id,'version',q.version,'status',q.status,'data',q.data,'awarded',exists(select 1 from public.ig_operations o where o.kind='order' and o.data->>'quote_id'=q.id::text and o.status<>'cancelled')) else null end) order by x.created_at desc)
  from public.ig_vendor_assignments x join public.ig_operations rf on rf.id=x.rfq_id left join public.ig_operations q on q.id=x.quote_id
  where x.active and x.expires_at>now() and ig_private.vendor_access(x.vendor_id) and not rf.archived and rf.status='open'),'[]');
 end if;
 if a in ('contact','assign','revoke') then
  if not ig_private.ops_allowed('horeca','commerce') then raise exception 'Procurement permission and MFA required' using errcode='42501';end if;
  if a='revoke' then
   update public.ig_vendor_assignments set active=false,version=version+1 where id=(p->>'id')::uuid and version=(p->>'version')::int returning * into assignment;if assignment.id is null then raise exception 'Assignment changed' using errcode='40001';end if;
  else
   select * into v from public.ig_operations where id=(p->>'vendor_id')::uuid and kind='vendor' and status='active' and not archived;if v.id is null then raise exception 'Active supplier required';end if;
   if a='contact' then
    insert into public.ig_vendor_contacts(vendor_id,email,active,created_by) values(v.id,lower(trim(p->>'email')),coalesce((p->>'active')::boolean,true),auth.uid()) on conflict(vendor_id,email) do update set active=excluded.active,version=ig_vendor_contacts.version+1 returning * into contact;
    perform ig_private.record_audit('vendor.contact',contact.id::text);return to_jsonb(contact);
   else
    select * into r from public.ig_operations where id=(p->>'rfq_id')::uuid and kind='rfq' and status='open' and not archived;if r.id is null then raise exception 'Open RFQ required';end if;
    if not exists(select 1 from public.ig_vendor_contacts where vendor_id=v.id and active) then raise exception 'Enable a verified supplier contact first';end if;
    if (p->>'expires_at')::timestamptz<=now() or (p->>'expires_at')::timestamptz>now()+interval '90 days' then raise exception 'Deadline must be within 90 days';end if;
    insert into public.ig_vendor_assignments(rfq_id,vendor_id,expires_at,created_by) values(r.id,v.id,(p->>'expires_at')::timestamptz,auth.uid()) on conflict(rfq_id,vendor_id) do update set active=true,expires_at=excluded.expires_at,version=ig_vendor_assignments.version+1 returning * into assignment;
   end if;
  end if;
  perform ig_private.record_audit('vendor.'||a,assignment.id::text);return to_jsonb(assignment);
 end if;
 select * into assignment from public.ig_vendor_assignments where id=(p->>'id')::uuid for update;
 if assignment.id is null or not assignment.active or assignment.expires_at<=now() or not ig_private.vendor_access(assignment.vendor_id) then raise exception 'Supplier assignment unavailable' using errcode='42501';end if;
 if assignment.version is distinct from (p->>'version')::int then raise exception 'Assignment changed. Reload' using errcode='40001';end if;
 select * into r from public.ig_operations where id=assignment.rfq_id for update;
 if r.status<>'open' or r.archived then raise exception 'RFQ closed';end if;
 if exists(select 1 from public.ig_operations where parent_id=r.id and kind='order' and status<>'cancelled') then raise exception 'RFQ has already been awarded';end if;
 select * into bid from public.ig_operations where id=assignment.quote_id for update;
 if a='withdraw' then
  if bid.id is null then raise exception 'No quotation to withdraw';end if;
  update public.ig_operations set status='withdrawn',version=version+1,updated_by=auth.uid(),updated_at=now() where id=bid.id returning * into bid;
 elsif a='quote' then
  d=(p->'data')||jsonb_build_object('vendor_id',assignment.vendor_id::text);
  perform ig_private.ops_validate('quote',d);
  if nullif(d->>'valid_until','') is null or (d->>'valid_until')::date<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Supply an unexpired validity date';end if;
  if jsonb_array_length(d->'lines')<>jsonb_array_length(r.data->'lines') then raise exception 'Quote every RFQ line; explain deviations in the terms';end if;
  for l in select * from jsonb_array_elements(d->'lines') loop
   select x into line from jsonb_array_elements(r.data->'lines') x where x->>'line_id'=l->>'line_id';
   if line is null or line->'quantity'<>l->'quantity' or line->>'uom'<>l->>'uom' then raise exception 'RFQ quantities and units must match';end if;
  end loop;
  if bid.id is null then
   insert into public.ig_operations(kind,practice,parent_id,client_id,title,status,data,request_id,created_by,updated_by) values('quote','horeca',r.id,r.client_id,'Supplier quotation · '||(r.data->>'reference'),'submitted',d,gen_random_uuid(),auth.uid(),auth.uid()) returning * into bid;
  else
   update public.ig_operations set status='submitted',data=d,version=version+1,updated_by=auth.uid(),updated_at=now() where id=bid.id returning * into bid;
  end if;
 else raise exception 'Unknown supplier action';end if;
 update public.ig_vendor_assignments set quote_id=bid.id,version=version+1 where id=assignment.id;
 perform ig_private.record_audit('vendor.'||a,bid.id::text);return jsonb_build_object('id',bid.id,'status',bid.status);
end $$;

create function ig_private.procurement_dashboard() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not ig_private.procurement_identity() then raise exception 'Verified account required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('fulfilment',coalesce((select jsonb_agg(jsonb_build_object('status',o.status,'reference',o.data->>'reference','delivery_reference',o.data->>'delivery_reference')) from public.ig_operations o where o.parent_id=r.rfq_id and o.kind='order' and not o.archived),'[]'),'payment_status',(select status from public.ig_payment_requests where id=r.payment_request_id)) order by r.created_at desc) from public.ig_procurement_requests r where r.user_id=auth.uid()),'[]');
end $$;
create function public.ig_procurement(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.procurement(p)$$;
create function public.ig_vendor_portal(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.vendor_portal(p)$$;
create function public.ig_procurement_dashboard() returns jsonb language sql security invoker set search_path='' as $$select ig_private.procurement_dashboard()$$;
revoke all on function ig_private.procurement(jsonb),ig_private.vendor_portal(jsonb),ig_private.procurement_dashboard(),public.ig_procurement(jsonb),public.ig_vendor_portal(jsonb),public.ig_procurement_dashboard() from public,anon;
grant execute on function ig_private.procurement(jsonb),ig_private.vendor_portal(jsonb),ig_private.procurement_dashboard(),public.ig_procurement(jsonb),public.ig_vendor_portal(jsonb),public.ig_procurement_dashboard() to authenticated;
