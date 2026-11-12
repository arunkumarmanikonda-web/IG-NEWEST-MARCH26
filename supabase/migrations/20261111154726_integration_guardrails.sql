-- Preserve explicit practice boundaries for historical enquiry display labels.
create function ig_private.practice_key(value text) returns text language sql immutable set search_path='' as $$
 select case lower(trim(value)) when 'real estate advisory' then 'real-estate' when 'transaction advisory' then 'transaction-advisory' when 'debt & special situations' then 'debt-special-situations' when 'hospitality project' then 'hospitality' when 'retail & leasing' then 'retail-leasing' when 'horeca procurement' then 'horeca' when 'general enquiry' then 'corporate' when 'valuation' then 'corporate' else case when value in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate') then value else 'corporate' end end
$$;
revoke all on function ig_private.practice_key(text) from public,anon;
grant execute on function ig_private.practice_key(text) to authenticated;
create or replace function ig_private.scope_allowed(practice text,capability text) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('admin.read') and exists(select 1 from public.ig_profiles p where p.id=auth.uid() and ('owner'=any(p.roles) or coalesce(p.practice_grants->ig_private.practice_key(practice),'[]') ? capability))
$$;
do $$declare s text;begin
 select pg_get_functiondef('ig_private.payment_start(jsonb)'::regprocedure) into s;
 s=replace(s,$find$if r.status='pending' then return to_jsonb(r);end if;$find$,$find$if not exists(select 1 from ig_private.integration_config where id='razorpay' and mode in ('test','live')) then raise exception 'Payments are currently paused';end if;
 if exists(select 1 from public.ig_profiles where id=auth.uid() and must_change_password) then raise exception 'Change your initial password first';end if;
 if r.status='pending' then return to_jsonb(r);end if;$find$);execute s;
end $$;
