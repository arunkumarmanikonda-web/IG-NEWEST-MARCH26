-- A pending invitation permits first-time email verification. Acceptance and
-- assignment of roles still use the verified identity and the existing policy gates.
create or replace function ig_private.client_login_eligible(secret text, email_address text)
returns boolean language plpgsql security definer set search_path='' as $$
declare mail text := lower(trim(email_address));
begin
  if ig_private.integration_server(secret) is not true then
    raise exception 'Server authorisation required' using errcode='42501';
  end if;
  return exists (
    select 1 from public.ig_client_contacts c join public.ig_clients x on x.id=c.client_id
    where c.email=mail and c.active and c.portal_enabled and x.stage<>'archived'
  ) or exists (
    select 1 from ig_private.staff_invites i where i.email=mail and not i.revoked and i.accepted_by is null
  );
end $$;

create function ig_private.invitation_recipient(p jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare invitation ig_private.staff_invites;
begin
  if not ig_private.allowed('users.manage') then
    raise exception 'User administration permission required' using errcode='42501';
  end if;
  select * into invitation from ig_private.staff_invites where id=(p->>'id')::uuid and not revoked and accepted_by is null;
  if not found then raise exception 'This invitation is no longer pending'; end if;
  if (not invitation.roles <@ array['client','vendor'] or invitation.practice_grants <> '{}'::jsonb)
    and not exists(select 1 from public.ig_profiles where id=auth.uid() and 'owner'=any(roles)) then
    raise exception 'Owner permission required' using errcode='42501';
  end if;
  return jsonb_build_object('email',invitation.email);
end $$;
create function public.ig_invitation_recipient(p jsonb)
returns jsonb language sql security invoker set search_path='' as $$select ig_private.invitation_recipient(p)$$;
revoke all on function ig_private.invitation_recipient(jsonb),public.ig_invitation_recipient(jsonb) from public,anon;
grant execute on function ig_private.invitation_recipient(jsonb),public.ig_invitation_recipient(jsonb) to authenticated;
