-- Staff retain verification: authenticator AAL2 OR a provider-verified email OTP.
-- Password-only, recovery, signup and user metadata never satisfy this gate.
-- Existing registration acceptance is retained with its original version/hash.
-- No staff invitation password requirement, role or MFA factor is removed.
create function ig_private.staff_verified() returns boolean
language sql stable security invoker set search_path='' as $$
 select ig_private.valid_identity() and (
  coalesce(auth.jwt()->>'aal','aal1')='aal2'
  or (coalesce(auth.jwt()->'amr' @> '[{"method":"otp"}]'::jsonb,false)
      and nullif(auth.jwt()->>'email','') is not null)
 )
$$;
create function ig_private.registration_accepted(person uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_profiles p join public.ig_consents c
 on c.user_id=p.id and c.version=p.policy_version
 where p.id=person and c.purpose='registration' and c.granted)
$$;
revoke all on function ig_private.staff_verified(),ig_private.registration_accepted(uuid) from public,anon;
grant execute on function ig_private.staff_verified(),ig_private.registration_accepted(uuid) to authenticated,service_role;

-- Replace only the assurance and registration gates, retaining the role map.
do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.allowed(text)'::regprocedure) into s;
 s=replace(s,'policy_version=ig_private.current_policy()','ig_private.registration_accepted(auth.uid())');
 s=replace(s,$find$coalesce(auth.jwt()->>'aal','aal1')<>'aal2'$find$,'not ig_private.staff_verified()');
 execute s;
 select pg_get_functiondef('ig_private.accept_invitation()'::regprocedure) into s;
 s=replace(s,$find$coalesce(auth.jwt()->>'aal','aal1')<>'aal2'$find$,'not ig_private.staff_verified()');
 s=replace(s,'Verified account and MFA required','Verify with an authenticator or email code to continue');
 execute s;
 select pg_get_functiondef('ig_private.room_manage_core(jsonb)'::regprocedure) into s;
 s=replace(s,'policy_version=ig_private.current_policy()','ig_private.registration_accepted(n.user_id)');
 s=replace(s,'Administrator permission and MFA required','Verified administrator access required');
 execute s;
 select pg_get_functiondef('ig_private.provider_reference(text,jsonb)'::regprocedure) into s;
 s=replace(s,'policy_version=(select version from public.ig_policy_releases where current)','ig_private.registration_accepted(j.actor_id)');
 execute s;
end $migration$;

create function ig_private.signin_status() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare p public.ig_profiles; pending boolean;
begin
 if not ig_private.valid_identity() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 select * into p from public.ig_profiles where id=auth.uid();
 select exists(select 1 from ig_private.staff_invites i join auth.users u on lower(u.email)=i.email
 where u.id=auth.uid() and not i.revoked and i.accepted_by is null and p.roles=array['client']::text[]) into pending;
 return jsonb_build_object('accepted',ig_private.registration_accepted(auth.uid()),
 'verified',ig_private.staff_verified(),'pending_invitation',pending);
end $$;
create function public.ig_signin_status() returns jsonb
language sql security invoker set search_path='' as $$select ig_private.signin_status()$$;
revoke all on function ig_private.signin_status(),public.ig_signin_status() from public,anon;
grant execute on function ig_private.signin_status(),public.ig_signin_status() to authenticated,service_role;

-- Record registration once. A repeated request cannot overwrite the original
-- accepted policy version/hash or create duplicate consent/audit entries.
create or replace function ig_private.account_update(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if p->>'action'='accept_policies' then
  if not ig_private.valid_identity() then raise exception 'Verified sign-in required' using errcode='42501';end if;
  perform 1 from public.ig_profiles where id=auth.uid() and status='active' for update;
  if not found then raise exception 'Account inactive' using errcode='42501';end if;
  if ig_private.registration_accepted(auth.uid()) then return jsonb_build_object('ok',true,'already_accepted',true);end if;
  if coalesce(p->>'adult','false')<>'true' then raise exception 'Confirm that you are at least 18 and authorised to register';end if;
 end if;
 result=ig_private.account_update_policy_base(p);
 if p->>'action'='accept_policies' then
  update public.ig_consents set policy_hash=(select sha256 from public.ig_policy_releases where current)
  where id=(select max(id) from public.ig_consents where user_id=auth.uid() and purpose='registration');
 end if;
 return result;
end $$;
