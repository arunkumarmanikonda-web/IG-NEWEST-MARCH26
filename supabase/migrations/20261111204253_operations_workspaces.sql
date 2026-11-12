-- Operational records are private. Dedicated modules share audited storage, not permissions.
create table ig_private.ops_specs(kind text primary key,spec jsonb not null);
alter table ig_private.ops_specs enable row level security;
revoke all on ig_private.ops_specs from public,anon,authenticated;
insert into ig_private.ops_specs values ('vendor','{"label":"Vendors","singular":"Vendor","practice":"horeca","statuses":["active","on-hold"],"fields":{"company":{"label":"Legal / trading name","type":"text","required":true,"max":250},"email":{"label":"Business email","type":"text","required":false,"max":250},"phone":{"label":"Contact number","type":"text","required":false,"max":250},"gstin":{"label":"GSTIN","type":"text","required":false,"max":250},"categories":{"label":"Supply categories","type":"text","required":false,"max":250},"address":{"label":"Billing address","type":"textarea","required":false,"max":4000},"notes":{"label":"Qualification & terms","type":"textarea","required":false,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('rfq','{"label":"RFQs & BOQs","singular":"RFQ","practice":"horeca","statuses":["draft","open","closed"],"fields":{"reference":{"label":"RFQ reference","type":"text","required":true,"max":250},"required_by":{"label":"Required delivery","type":"date"},"valid_until":{"label":"Quotation deadline","type":"date"},"destination":{"label":"Delivery destination","type":"textarea","required":true,"max":4000},"terms":{"label":"Specifications & commercial terms","type":"textarea","required":false,"max":4000},"lines":{"type":"lines","label":"Requirement schedule","required":true}}}'::jsonb);
insert into ig_private.ops_specs values ('quote','{"label":"Vendor quotations","singular":"Vendor quotation","practice":"horeca","parent":"rfq","statuses":["draft","submitted","withdrawn"],"fields":{"vendor_id":{"label":"Vendor","type":"reference","kind":"vendor","required":true},"reference":{"label":"Vendor quotation reference","type":"text","required":true,"max":250},"valid_until":{"label":"Valid until","type":"date"},"lead_days":{"label":"Lead time · days","type":"number","min":0,"max":3650},"freight":{"label":"Freight · INR","type":"number","min":0,"max":100000000000},"discount":{"label":"Discount · INR","type":"number","min":0,"max":100000000000},"terms":{"label":"Payment, warranty & exclusions","type":"textarea","required":false,"max":4000},"lines":{"type":"lines","label":"Quoted schedule","required":true}}}'::jsonb);
insert into ig_private.ops_specs values ('order','{"label":"Orders & fulfilment","singular":"Purchase order","practice":"horeca","parent":"rfq","statuses":["ordered","part-received","received","dispatched","delivered","cancelled"],"generated":true,"fields":{}}'::jsonb);
insert into ig_private.ops_specs values ('movement','{"label":"Goods movements","singular":"Goods movement","practice":"horeca","parent":"order","statuses":["posted"],"fields":{"direction":{"label":"Movement","type":"select","options":["receipt","dispatch","customer-return","supplier-return"],"required":true},"reference":{"label":"GRN / dispatch / return reference","type":"text","required":true,"max":250},"date":{"label":"Movement date","type":"date"},"carrier":{"label":"Carrier / logistics partner","type":"text","required":false,"max":250},"tracking":{"label":"Tracking / delivery reference","type":"text","required":false,"max":250},"notes":{"label":"Condition, shortages & inspection notes","type":"textarea","required":false,"max":4000},"lines":{"type":"movement-lines","label":"Quantities","required":true}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_project','{"label":"Project register","singular":"PMC project","practice":"hospitality","statuses":["planning","active","on-hold","completed"],"fields":{"reference":{"label":"Project reference","type":"text","required":true,"max":250},"location":{"label":"Site / city","type":"text","required":false,"max":250},"start_date":{"label":"Commencement","type":"date"},"end_date":{"label":"Target completion","type":"date"},"manager":{"label":"Project manager","type":"text","required":false,"max":250},"engagement_id":{"label":"Client engagement","type":"reference","kind":"engagement","required":false},"scope":{"label":"Scope & success criteria","type":"textarea","required":true,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_task','{"label":"Programme","singular":"Programme activity","practice":"hospitality","parent":"pmc_project","statuses":["planned","active","blocked","complete"],"fields":{"wbs":{"label":"WBS / activity reference","type":"text","required":true,"max":250},"owner":{"label":"Responsible person / contractor","type":"text","required":false,"max":250},"start_date":{"label":"Planned start","type":"date"},"end_date":{"label":"Planned finish","type":"date"},"weight":{"label":"Progress weight","type":"number","min":1,"max":1000},"dependency_id":{"label":"Predecessor activity","type":"reference","kind":"pmc_task","required":false},"notes":{"label":"Deliverables & dependencies","type":"textarea","required":false,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_budget','{"label":"Budgets & costs","singular":"Budget line","practice":"hospitality","parent":"pmc_project","statuses":["draft","approved"],"fields":{"code":{"label":"Cost code","type":"text","required":true,"max":250},"baseline":{"label":"Baseline budget · INR","type":"number","min":0,"max":100000000000},"committed":{"label":"Committed cost · INR","type":"number","min":0,"max":100000000000},"actual":{"label":"Actual cost · INR","type":"number","min":0,"max":100000000000},"forecast":{"label":"Forecast final cost · INR","type":"number","min":0,"max":100000000000},"notes":{"label":"Basis & variance explanation","type":"textarea","required":false,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_variation','{"label":"Variations","singular":"Variation request","practice":"hospitality","parent":"pmc_project","statuses":["draft","submitted","approved","rejected"],"fields":{"reference":{"label":"Variation reference","type":"text","required":true,"max":250},"budget_id":{"label":"Budget line","type":"reference","kind":"pmc_budget","required":true},"amount":{"label":"Cost impact · INR","type":"number","min":-100000000000,"max":100000000000},"time_days":{"label":"Time impact · days","type":"number","min":-3650,"max":3650},"reason":{"label":"Change, cause & justification","type":"textarea","required":true,"max":4000},"decision":{"label":"Decision reference / approval record","type":"textarea","required":false,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_progress','{"label":"Progress reports","singular":"Progress update","practice":"hospitality","parent":"pmc_project","statuses":["recorded"],"fields":{"task_id":{"label":"Programme activity","type":"reference","kind":"pmc_task","required":true},"report_date":{"label":"Reporting date","type":"date"},"percent":{"label":"Measured completion · %","type":"number","min":0,"max":100},"evidence":{"label":"Measurement / inspection evidence","type":"textarea","required":true,"max":4000},"blockers":{"label":"Constraints & next actions","type":"textarea","required":false,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_rfi','{"label":"RFIs & decisions","singular":"Request for information","practice":"hospitality","parent":"pmc_project","statuses":["open","answered","closed"],"fields":{"reference":{"label":"RFI reference","type":"text","required":true,"max":250},"owner":{"label":"Decision owner","type":"text","required":true,"max":250},"due_date":{"label":"Response due","type":"date"},"question":{"label":"Question / clarification","type":"textarea","required":true,"max":4000},"response":{"label":"Response & supporting reference","type":"textarea","required":false,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('pmc_risk','{"label":"Risks & issues","singular":"Risk / issue","practice":"hospitality","parent":"pmc_project","statuses":["open","mitigating","closed"],"fields":{"owner":{"label":"Risk owner","type":"text","required":true,"max":250},"probability":{"label":"Probability · 1–5","type":"number","min":1,"max":5},"impact":{"label":"Impact · 1–5","type":"number","min":1,"max":5},"due_date":{"label":"Action due","type":"date"},"mitigation":{"label":"Mitigation & response","type":"textarea","required":true,"max":4000}}}'::jsonb);
insert into ig_private.ops_specs values ('matter','{"label":"Assignments","singular":"Practice assignment","statuses":["lead","scoping","engaged","delivery","completed","on-hold"],"fields":{"reference":{"label":"Assignment reference","type":"text","required":true,"max":250},"service":{"label":"Service","type":"select","options":["advisory","transaction","debt","special-situation","feasibility","valuation","forensic-audit","operational-audit","leasing","design","other"],"required":true},"owner":{"label":"Assignment owner","type":"text","required":false,"max":250},"due_date":{"label":"Target delivery","type":"date"},"engagement_id":{"label":"Client engagement","type":"reference","kind":"engagement","required":false},"scope":{"label":"Scope & deliverables","type":"textarea","required":true,"max":4000},"next_action":{"label":"Next action & client update","type":"textarea","required":false,"max":4000}}}'::jsonb);
create table public.ig_operations(
 id uuid primary key default gen_random_uuid(),kind text not null references ig_private.ops_specs(kind),practice text not null,
 client_id uuid references public.ig_clients(id),parent_id uuid references public.ig_operations(id),title text not null check(length(title) between 2 and 180),
 status text not null,data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=150000),
 archived boolean not null default false,version int not null default 1,request_id uuid not null unique,
 created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index ig_ops_practice_kind on public.ig_operations(practice,kind,updated_at desc);
create index ig_ops_parent on public.ig_operations(parent_id);
create index ig_ops_client on public.ig_operations(client_id);
create index ig_ops_created_by on public.ig_operations(created_by);
create index ig_ops_updated_by on public.ig_operations(updated_by);
create unique index ig_ops_award_unique on public.ig_operations(parent_id) where kind='order' and status<>'cancelled';
create unique index ig_ops_reference on public.ig_operations(practice,kind,lower(data->>'reference')) where kind in ('rfq','pmc_project','matter') and not archived;
create function ig_private.ops_allowed(practice text,cap text) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.scope_allowed(practice,cap) and exists(select 1 from public.ig_profiles where id=auth.uid() and roles&&array['owner','administrator','procurement_manager','property_manager','sales','auditor'] and (cap='read' or not roles<@array['auditor']))
$$;
revoke all on function ig_private.ops_allowed(text,text) from public,anon;
grant execute on function ig_private.ops_allowed(text,text) to authenticated;
alter table public.ig_operations enable row level security;
revoke all on public.ig_operations from public,anon,authenticated;
grant select on public.ig_operations to authenticated;
create policy ops_read on public.ig_operations for select to authenticated using(ig_private.ops_allowed(practice,'read'));
create function ig_private.ops_validate(k text,d jsonb) returns void language plpgsql security definer set search_path='' as $$
declare spec jsonb;f text;s jsonb;v jsonb;n numeric;l jsonb;
begin
 select os.spec into spec from ig_private.ops_specs os where kind=k;
 if spec is null or jsonb_typeof(d) is distinct from 'object' then raise exception 'Unknown operational record';end if;
 for f in select jsonb_object_keys(d) loop if not (spec->'fields') ? f then raise exception 'Unexpected field: %',f;end if;end loop;
 for f,s in select * from jsonb_each(spec->'fields') loop
  v=d->f;
  if coalesce((s->>'required')::boolean,false) and (v is null or v='null' or v='""') then raise exception 'Required: %',s->>'label';end if;
  if v is null or v='null' or v='""' then continue;end if;
  if s->>'type' in ('text','textarea','date','reference','select') then
   if jsonb_typeof(v)<>'string' or length(v#>>'{}')>coalesce((s->>'max')::int,250) then raise exception 'Invalid text: %',f;end if;
   if s->>'type'='date' and (v#>>'{}')!~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid date';end if;
   if s->>'type'='date' then perform (v#>>'{}')::date;end if;
   if s->>'type'='reference' and (v#>>'{}')!~'^[0-9a-f-]{36}$' then raise exception 'Invalid record reference';end if;
   if s->>'type'='select' and not (s->'options') ? (v#>>'{}') then raise exception 'Invalid selection: %',f;end if;
  elsif s->>'type'='number' then
   if jsonb_typeof(v)<>'number' then raise exception 'A number is required: %',f;end if;n=(v#>>'{}')::numeric;
   if n<(s->>'min')::numeric or n>(s->>'max')::numeric or n<>round(n,3) then raise exception 'Number outside allowed range: %',f;end if;
  elsif s->>'type' in ('lines','movement-lines') then
   if jsonb_typeof(v)<>'array' or jsonb_array_length(v) not between 1 and 300 then raise exception 'Add 1–300 schedule lines';end if;
   if (select count(distinct x->>'line_id') from jsonb_array_elements(v)x)<>jsonb_array_length(v) then raise exception 'Schedule references must be unique';end if;
   for l in select * from jsonb_array_elements(v) loop
    if jsonb_typeof(l)<>'object' or coalesce(l->>'line_id','')!~'^[A-Za-z0-9_-]{1,60}$' or jsonb_typeof(l->'quantity') is distinct from 'number' or (l->>'quantity')::numeric<=0 or (l->>'quantity')::numeric>10000000 or (l->>'quantity')::numeric<>round((l->>'quantity')::numeric,3) then raise exception 'Invalid schedule quantity or reference';end if;
    if s->>'type'='lines' then
     if length(coalesce(l->>'description','')) not between 2 and 1000 or length(coalesce(l->>'sku',''))>80 or length(coalesce(l->>'uom','')) not between 1 and 30 then raise exception 'Supply description, SKU and unit';end if;
     if k='quote' and (jsonb_typeof(l->'unit_rate') is distinct from 'number' or (l->>'unit_rate')::numeric<0 or (l->>'unit_rate')::numeric>1000000000 or (l->>'unit_rate')::numeric<>round((l->>'unit_rate')::numeric,2) or jsonb_typeof(l->'gst_pct') is distinct from 'number' or (l->>'gst_pct')::numeric not between 0 and 100) then raise exception 'Invalid quotation rate or tax';end if;
    end if;
   end loop;
  end if;
 end loop;
 if nullif(d->>'start_date','') is not null and nullif(d->>'end_date','') is not null and (d->>'end_date')::date<(d->>'start_date')::date then raise exception 'Finish cannot precede start';end if;
end $$;
revoke all on function ig_private.ops_validate(text,jsonb) from public,anon,authenticated;
create function ig_private.ops_save(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_operations;old public.ig_operations;parent public.ig_operations;related public.ig_operations;spec jsonb;d jsonb=p->'data';k text=p->>'kind';pr text=p->>'practice';cid uuid=nullif(p->>'client_id','')::uuid;pid uuid=nullif(p->>'parent_id','')::uuid;st text=p->>'status';f text;s jsonb;l jsonb;base jsonb;received numeric;dispatched numeric;q numeric;v text;
begin
 if not ig_private.ops_allowed(pr,case when k in ('vendor','rfq','quote','order','movement') then 'commerce' else 'write' end) then raise exception 'Practice operational permission and MFA required' using errcode='42501';end if;
 select os.spec into spec from ig_private.ops_specs os where kind=k;
 if spec is null or coalesce((spec->>'generated')::boolean,false) then raise exception 'Use the dedicated order workflow';end if;
 if spec ? 'practice' and pr<>spec->>'practice' then raise exception 'Wrong practice for this record';end if;
 if not (spec->'statuses') ? st then raise exception 'Invalid lifecycle state';end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-ops-'||pr,0));
 if nullif(p->>'id','') is null then
  select * into old from public.ig_operations where request_id=(p->>'request_id')::uuid;
  if old.id is not null then
   if old.created_by<>auth.uid() or old.kind<>k or old.practice<>pr or old.data<>d or old.title is distinct from p->>'title' or old.parent_id is distinct from pid or old.client_id is distinct from cid then raise exception 'Request reference already used';end if;
   return to_jsonb(old);
  end if;
 else
  select * into old from public.ig_operations where id=(p->>'id')::uuid for update;
  if old.id is null or old.practice<>pr or old.kind<>k or old.archived or old.parent_id is distinct from pid then raise exception 'Record unavailable';end if;
  if old.version is distinct from (p->>'version')::int then raise exception 'Record changed. Reload before saving.' using errcode='40001';end if;
  if k in ('movement','pmc_progress') then raise exception 'Posted events are immutable. Record a correction event.';end if;
  if k='quote' and exists(select 1 from public.ig_operations where kind='order' and data->>'quote_id'=old.id::text and status<>'cancelled') then raise exception 'Awarded quotation is locked';end if;
  if k='rfq' and exists(select 1 from public.ig_operations where parent_id=old.id and kind in ('quote','order') and not archived) and old.data->'lines' is distinct from d->'lines' then raise exception 'Quoted schedule is locked. Create a revised RFQ.';end if;
  if k='pmc_budget' and old.status='approved' and (old.data->'baseline' is distinct from d->'baseline' or st<>'approved') then raise exception 'Approved baseline is locked. Use a variation.';end if;
  if k='pmc_variation' and old.status in ('approved','rejected') then raise exception 'Decided variation is locked. Create a new variation.';end if;
 end if;
 if cid is not null and not ig_private.client_staff(cid,'read') then raise exception 'Client access required' using errcode='42501';end if;
 if spec ? 'parent' then
  select * into parent from public.ig_operations where id=pid for update;
  if parent.id is null or parent.kind<>spec->>'parent' or parent.practice<>pr or parent.archived or parent.status in ('cancelled','completed') then raise exception 'Select an active parent record';end if;
  if parent.client_id is distinct from cid then raise exception 'Parent client must match';end if;
 elsif pid is not null then raise exception 'Unexpected parent';end if;
 perform ig_private.ops_validate(k,d);
 for f,s in select * from jsonb_each(spec->'fields') where value->>'type'='reference' loop
  if nullif(d->>f,'') is not null then
   if s->>'kind'='engagement' then
    if not exists(select 1 from public.ig_engagements e where e.id=(d->>f)::uuid and e.client_id=cid and e.active) then raise exception 'Select this client’s active engagement';end if;
   else
    select * into related from public.ig_operations where id=(d->>f)::uuid;
    if related.id is null or related.kind<>s->>'kind' or related.practice<>pr or related.archived or (related.parent_id is not null and related.parent_id is distinct from pid) or related.id=old.id then raise exception 'Invalid related record: %',f;end if;
   end if;
  end if;
 end loop;
 if k='quote' then
  if parent.status<>'open' then raise exception 'Quotations require an open RFQ';end if;
  if not exists(select 1 from public.ig_operations where id=(d->>'vendor_id')::uuid and status='active') then raise exception 'Vendor is on hold';end if;
  if jsonb_array_length(d->'lines')<>jsonb_array_length(parent.data->'lines') then raise exception 'Quote every RFQ line for comparable totals';end if;
  for l in select * from jsonb_array_elements(d->'lines') loop
   select x into base from jsonb_array_elements(parent.data->'lines')x where x->>'line_id'=l->>'line_id';
   if base is null or (base->>'quantity')::numeric<>(l->>'quantity')::numeric or base->>'uom'<>l->>'uom' then raise exception 'Quotation must match RFQ references, units and quantities';end if;
  end loop;
  if coalesce((d->>'discount')::numeric,0)>(select sum(round((x->>'quantity')::numeric*(x->>'unit_rate')::numeric,2)*(1+(x->>'gst_pct')::numeric/100)) from jsonb_array_elements(d->'lines')x)+coalesce((d->>'freight')::numeric,0) then raise exception 'Discount exceeds quotation value';end if;
 end if;
 if k='vendor' and nullif(d->>'email','') is not null and d->>'email'!~'^[^[:space:]<>@]+@[^[:space:]<>@]+[.][^[:space:]<>@]+$' then raise exception 'Invalid business email';end if;
 if k in ('pmc_budget','pmc_variation') and st in ('approved','rejected') then
  if not ig_private.ops_allowed(pr,'commerce') then raise exception 'Commercial approval permission required' using errcode='42501';end if;
  if k='pmc_variation' and (old.status is distinct from 'submitted' or length(coalesce(d->>'decision',''))<5) then raise exception 'Submit first and record the approval / rejection reference';end if;
 end if;
 if k='pmc_task' and nullif(d->>'dependency_id','') is not null then
  if exists(with recursive chain as (select id,data->>'dependency_id' as next from public.ig_operations where id=(d->>'dependency_id')::uuid union select o.id,o.data->>'dependency_id' from public.ig_operations o join chain c on o.id::text=c.next) select 1 from chain where id=old.id) then raise exception 'Programme dependency cycle';end if;
  if nullif(d->>'start_date','') is not null and nullif(related.data->>'end_date','') is not null and d->>'start_date'<related.data->>'end_date' then raise exception 'Activity starts before its predecessor finishes';end if;
 end if;
 if k='pmc_task' and st='complete' and not exists(select 1 from public.ig_operations where kind='pmc_progress' and data->>'task_id'=old.id::text and (data->>'percent')::numeric=100) then raise exception 'Record measured 100%% progress before completion';end if;
 if k='pmc_progress' and (nullif(d->>'report_date','') is null or (d->>'report_date')::date>(now() at time zone 'Asia/Kolkata')::date) then raise exception 'Use a reporting date up to today';end if;
 if k='pmc_rfi' and st in ('answered','closed') and length(coalesce(d->>'response',''))<5 then raise exception 'Record the response before closing';end if;
 if k='movement' then
  if parent.status in ('delivered','cancelled') then raise exception 'Order is closed';end if;
  if nullif(d->>'date','') is null then raise exception 'Movement date required';end if;
  for l in select * from jsonb_array_elements(d->'lines') loop
   select x into base from jsonb_array_elements(parent.data->'lines')x where x->>'line_id'=l->>'line_id';
   if base is null then raise exception 'Movement contains an unknown order line';end if;
   select coalesce(sum(case when m.data->>'direction'='receipt' then (x->>'quantity')::numeric when m.data->>'direction'='supplier-return' then -(x->>'quantity')::numeric else 0 end),0),coalesce(sum(case when m.data->>'direction'='dispatch' then (x->>'quantity')::numeric when m.data->>'direction'='customer-return' then -(x->>'quantity')::numeric else 0 end),0) into received,dispatched from public.ig_operations m cross join lateral jsonb_array_elements(m.data->'lines')x where m.kind='movement' and m.parent_id=pid and x->>'line_id'=l->>'line_id';
   q=(l->>'quantity')::numeric;
   if d->>'direction'='receipt' then received=received+q;
   elsif d->>'direction'='dispatch' then dispatched=dispatched+q;
   elsif d->>'direction'='supplier-return' then received=received-q;
   else dispatched=dispatched-q;end if;
   if received<0 or received>(base->>'quantity')::numeric or dispatched<0 or dispatched>received then raise exception 'Movement exceeds ordered / received / dispatched quantity';end if;
  end loop;
 end if;
 if old.id is null then
  insert into public.ig_operations(kind,practice,client_id,parent_id,title,status,data,request_id,created_by,updated_by) values(k,pr,cid,pid,p->>'title',st,d,(p->>'request_id')::uuid,auth.uid(),auth.uid()) returning * into r;
 else
  update public.ig_operations set client_id=cid,title=p->>'title',status=st,data=d,version=version+1,updated_by=auth.uid(),updated_at=now() where id=old.id returning * into r;
 end if;
 if k='movement' then
  update public.ig_operations set status=case when d->>'direction'='dispatch' then 'dispatched' else 'part-received' end,version=version+1,updated_at=now(),updated_by=auth.uid() where id=pid;
 end if;
 perform ig_private.record_audit('operations.saved',r.id::text,jsonb_build_object('kind',k,'version',r.version,'status',st));return to_jsonb(r);
end $$;
create function public.ig_ops_save(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.ops_save(p)$$;
create function ig_private.ops_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_operations;rfq public.ig_operations;v public.ig_operations;o public.ig_operations;l jsonb;n numeric;
begin
 select * into r from public.ig_operations where id=(p->>'id')::uuid for update;
 if r.id is null or not ig_private.ops_allowed(r.practice,case when r.kind in ('vendor','rfq','quote','order','movement','pmc_budget','pmc_variation') then 'commerce' else 'write' end) then raise exception 'Practice permission and MFA required' using errcode='42501';end if;
 if r.version is distinct from (p->>'version')::int then raise exception 'Record changed. Reload before continuing.' using errcode='40001';end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-ops-'||r.practice,0));
 if p->>'action'='award' then
  if r.kind<>'quote' or r.status<>'submitted' or r.archived or p->>'reviewed' is distinct from 'true' or length(coalesce(p->>'reason',''))<10 or length(coalesce(p->>'reference',''))<2 then raise exception 'Review the submitted quotation and record the award rationale and PO reference';end if;
  select * into rfq from public.ig_operations where id=r.parent_id for update;
  select * into v from public.ig_operations where id=(r.data->>'vendor_id')::uuid;
  if rfq.status<>'open' or rfq.archived or v.status<>'active' or v.archived then raise exception 'RFQ or vendor is not active';end if;
  if nullif(r.data->>'valid_until','') is null or (r.data->>'valid_until')::date<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Valid quotation expiry required';end if;
  insert into public.ig_operations(kind,practice,parent_id,client_id,title,status,data,request_id,created_by,updated_by) values('order','horeca',rfq.id,rfq.client_id,p->>'reference','ordered',r.data||jsonb_build_object('quote_id',r.id,'rfq_reference',rfq.data->>'reference','destination',rfq.data->>'destination','vendor_name',v.title,'vendor_details',v.data,'reference',p->>'reference','award_reason',p->>'reason','quote_version',r.version),(p->>'request_id')::uuid,auth.uid(),auth.uid()) returning * into o;
  update public.ig_operations set status='closed',version=version+1,updated_at=now(),updated_by=auth.uid() where id=rfq.id;
  perform ig_private.record_audit('operations.awarded',o.id::text,jsonb_build_object('quote',r.id));return to_jsonb(o);
 elsif p->>'action'='delivered' then
  if r.kind<>'order' or r.status='cancelled' or length(coalesce(p->>'reference',''))<3 then raise exception 'Record delivery acknowledgement';end if;
  for l in select * from jsonb_array_elements(r.data->'lines') loop
   select coalesce(sum(case when m.data->>'direction'='dispatch' then (x->>'quantity')::numeric when m.data->>'direction'='customer-return' then -(x->>'quantity')::numeric else 0 end),0) into n from public.ig_operations m cross join lateral jsonb_array_elements(m.data->'lines')x where m.parent_id=r.id and m.kind='movement' and x->>'line_id'=l->>'line_id';
   if n<>(l->>'quantity')::numeric then raise exception 'All ordered quantities must be dispatched before final delivery';end if;
  end loop;
  update public.ig_operations set status='delivered',data=data||jsonb_build_object('delivery_reference',p->>'reference','delivered_at',now()),version=version+1,updated_at=now(),updated_by=auth.uid() where id=r.id;
 elsif p->>'action'='cancel_order' then
  if r.kind<>'order' or r.status<>'ordered' or exists(select 1 from public.ig_operations where parent_id=r.id and kind='movement') then raise exception 'Only an unfulfilled order can be cancelled';end if;
  update public.ig_operations set status='cancelled',version=version+1,updated_at=now(),updated_by=auth.uid() where id=r.id;
  update public.ig_operations set status='open',version=version+1,updated_at=now(),updated_by=auth.uid() where id=r.parent_id;
 elsif p->>'action' in ('archive','restore') then
  if r.kind in ('order','movement','pmc_progress') or r.status='approved' then raise exception 'Posted / approved records remain in the audit register';end if;
  if p->>'action'='archive' and exists(select 1 from public.ig_operations x where not x.archived and (x.parent_id=r.id or x.data->>'vendor_id'=r.id::text or x.data->>'task_id'=r.id::text or x.data->>'dependency_id'=r.id::text or x.data->>'budget_id'=r.id::text)) then raise exception 'Active records still refer to this item';end if;
  update public.ig_operations set archived=(p->>'action'='archive'),version=version+1,updated_at=now(),updated_by=auth.uid() where id=r.id;
 else raise exception 'Unsupported operation';end if;
 perform ig_private.record_audit('operations.'||(p->>'action'),r.id::text);return '{"ok":true}';
end $$;
create function public.ig_ops_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.ops_action(p)$$;
revoke all on function ig_private.ops_save(jsonb),public.ig_ops_save(jsonb),ig_private.ops_action(jsonb),public.ig_ops_action(jsonb) from public,anon;
grant execute on function ig_private.ops_save(jsonb),public.ig_ops_save(jsonb),ig_private.ops_action(jsonb),public.ig_ops_action(jsonb) to authenticated;
