alter function ig_private.account_update(jsonb) rename to account_update_original;
revoke all on function ig_private.account_update_original(jsonb) from authenticated;
create function ig_private.account_update(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare practice text;
begin
 if p->>'action'='consent' then
  if coalesce(p->>'purpose','') not in ('email_marketing','personalisation','remarketing','sms') or jsonb_typeof(p->'granted') is distinct from 'boolean' or jsonb_typeof(p->'practices') is distinct from 'array' then raise exception 'Invalid communication preference' using errcode='22023'; end if;
  if jsonb_array_length(p->'practices')>7 then raise exception 'Too many practice preferences' using errcode='22023'; end if;
  for practice in select jsonb_array_elements_text(p->'practices') loop
   if practice not in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca') then raise exception 'Unknown practice preference' using errcode='22023'; end if;
  end loop;
 end if;
 return ig_private.account_update_original(p);
end $$;
create or replace function public.ig_account_update(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.account_update(p)$$;
revoke all on function ig_private.account_update(jsonb) from public,anon;
grant execute on function ig_private.account_update(jsonb) to authenticated;
