-- Client names, references and stages are private CRM data. The directory must
-- use the same per-client read permission as the client register, even though
-- this SECURITY DEFINER function does not inherit the caller's table RLS.
create or replace function ig_private.client_directory()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not ig_private.allowed('admin.read') then
  raise exception 'Staff access and MFA required' using errcode='42501';
 end if;
 return coalesce((
  select jsonb_agg(jsonb_build_object(
   'id',c.id,'name',c.name,'stage',c.stage,'reference',c.reference,'practice',c.practice
  ) order by c.name)
  from public.ig_clients c
  where c.stage<>'archived' and ig_private.client_staff(c.id,'read')
 ),'[]'::jsonb);
end $$;

-- CREATE OR REPLACE retains the existing authenticated-only RPC grants and the
-- public invoker wrapper. Owner access remains governed by client_staff.
