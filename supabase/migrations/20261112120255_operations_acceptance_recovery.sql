-- Correct workflow state without widening roles, publishing content or sending messages.
do $migration$
declare source text; needle text; replacement text;
begin
 select pg_get_functiondef('ig_private.ops_save(jsonb)'::regprocedure) into source;
 needle=$old$old.data<>d or old.title is distinct from p->>'title'$old$;
 if strpos(source,needle)=0 then raise exception 'ops_save idempotency definition changed';end if;
 source=replace(source,needle,$new$old.data<>d or old.status is distinct from st or old.title is distinct from p->>'title'$new$);

 needle=$old$ if k='pmc_progress' and (nullif(d->>'report_date','') is null$old$;
 if strpos(source,needle)=0 then raise exception 'ops_save programme definition changed';end if;
 replacement=$new$
 if k='pmc_project' and st='completed' and (
  old.id is null or not exists(select 1 from public.ig_operations where parent_id=old.id and kind='pmc_task' and not archived)
  or exists(select 1 from public.ig_operations where parent_id=old.id and not archived and
   ((kind='pmc_task' and status<>'complete') or (kind in ('pmc_rfi','pmc_risk') and status<>'closed') or (kind='pmc_variation' and status in ('draft','submitted'))))
 ) then raise exception 'Complete the programme and close RFIs, risks and pending changes before closing the project';end if;
 if k='pmc_task' and old.id is not null and nullif(d->>'end_date','') is not null and exists(
  select 1 from public.ig_operations child where child.kind='pmc_task' and not child.archived
  and child.data->>'dependency_id'=old.id::text and nullif(child.data->>'start_date','') is not null
  and child.data->>'start_date'<d->>'end_date'
 ) then raise exception 'Reschedule dependent activities before extending this finish date';end if;
 if k='pmc_progress' and (nullif(d->>'report_date','') is null$new$;
 source=replace(source,needle,replacement);

 needle=$old$  update public.ig_operations set status=case when d->>'direction'='dispatch' then 'dispatched' else 'part-received' end,version=version+1,updated_at=now(),updated_by=auth.uid() where id=pid;$old$;
 if strpos(source,needle)=0 then raise exception 'ops_save movement definition changed';end if;
 replacement=$new$
  -- Derive status from every order line, including receipts and both return directions.
  with position as (
   select (line->>'quantity')::numeric ordered,
    coalesce(sum(case when m.data->>'direction'='receipt' then (x->>'quantity')::numeric when m.data->>'direction'='supplier-return' then -(x->>'quantity')::numeric else 0 end),0) received,
    coalesce(sum(case when m.data->>'direction'='dispatch' then (x->>'quantity')::numeric when m.data->>'direction'='customer-return' then -(x->>'quantity')::numeric else 0 end),0) dispatched
   from jsonb_array_elements(parent.data->'lines') line
   left join public.ig_operations m on m.parent_id=pid and m.kind='movement' and not m.archived
   left join lateral jsonb_array_elements(m.data->'lines') x on x->>'line_id'=line->>'line_id'
   group by line
  )
  update public.ig_operations set status=(select case when bool_and(pos.dispatched=pos.ordered) then 'dispatched' when bool_and(pos.received=pos.ordered) then 'received' else 'part-received' end from position pos),
   data=data-'delivery_reference',version=version+1,updated_at=now(),updated_by=auth.uid() where id=pid;
 end if;
 if k='pmc_progress' then
  update public.ig_operations t set status='active',version=version+1,updated_at=now(),updated_by=auth.uid()
   where t.id=(d->>'task_id')::uuid and t.status='complete' and
   coalesce((select (m.data->>'percent')::numeric from public.ig_operations m where m.kind='pmc_progress'
    and m.data->>'task_id'=t.id::text order by m.data->>'report_date' desc,m.created_at desc limit 1),0)<100;
  if found then perform ig_private.record_audit('operations.progress_reopened',d->>'task_id');end if;
$new$;
 source=replace(source,needle,replacement);
 execute source;
end $migration$;
