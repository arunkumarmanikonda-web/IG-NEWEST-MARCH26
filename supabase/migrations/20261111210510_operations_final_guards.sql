-- Reviewed media references, deterministic monetary limits and current progress gates.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.provider_prepare(jsonb)'::regprocedure) into s;
 s=replace(s,$find$ perform pg_advisory_xact_lock(hashtextextended('ig-provider-'||c.id,0));$find$,$replace$ if v ? 'reference_media_id' then
  if c.id<>'runway' or p->>'kind'<>'image' or not exists(select 1 from public.ig_source_media where id=(v->>'reference_media_id')::uuid and state='ready' and published and practice=p->>'practice') then raise exception 'Select a released source image in this practice';end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-provider-'||c.id,0));$replace$);execute s;
 select pg_get_functiondef('ig_private.ops_validate(text,jsonb)'::regprocedure) into s;
 s=replace(s,$find$ if nullif(d->>'start_date','') is not null$find$,$replace$ if k='quote' then
  if coalesce((d->>'freight')::numeric,0)<>round(coalesce((d->>'freight')::numeric,0),2) or coalesce((d->>'discount')::numeric,0)<>round(coalesce((d->>'discount')::numeric,0),2) then raise exception 'Freight and discount require two decimal places';end if;
  if exists(select 1 from jsonb_array_elements(d->'lines')x where (x->>'gst_pct')::numeric<>round((x->>'gst_pct')::numeric,3)) then raise exception 'Tax precision exceeds three decimals';end if;
  if (select sum(round((x->>'quantity')::numeric*(x->>'unit_rate')::numeric,2)+round(round((x->>'quantity')::numeric*(x->>'unit_rate')::numeric,2)*(x->>'gst_pct')::numeric/100,2)) from jsonb_array_elements(d->'lines')x)+coalesce((d->>'freight')::numeric,0)>100000000000 then raise exception 'Quotation exceeds supported INR 100 billion limit';end if;
 end if;
 if nullif(d->>'start_date','') is not null$replace$);execute s;
 select pg_get_functiondef('ig_private.ops_save(jsonb)'::regprocedure) into s;
 s=replace(s,$find$not exists(select 1 from public.ig_operations where kind='pmc_progress' and data->>'task_id'=old.id::text and (data->>'percent')::numeric=100)$find$,$replace$coalesce((select (data->>'percent')::numeric from public.ig_operations where kind='pmc_progress' and data->>'task_id'=old.id::text order by data->>'report_date' desc,created_at desc limit 1),0)<>100$replace$);
 s=replace(s,$find$  if k='pmc_budget' and old.status='approved'$find$,$replace$  if k='rfq' and st<>'closed' and exists(select 1 from public.ig_operations where parent_id=old.id and kind='order' and status<>'cancelled') then raise exception 'Awarded RFQ remains closed';end if;
  if k='pmc_budget' and old.status='approved'$replace$);
 s=replace(s,$find$sum(round((x->>'quantity')::numeric*(x->>'unit_rate')::numeric,2)*(1+(x->>'gst_pct')::numeric/100))$find$,$replace$sum(round((x->>'quantity')::numeric*(x->>'unit_rate')::numeric,2)+round(round((x->>'quantity')::numeric*(x->>'unit_rate')::numeric,2)*(x->>'gst_pct')::numeric/100,2))$replace$);
 execute s;
end$$;
