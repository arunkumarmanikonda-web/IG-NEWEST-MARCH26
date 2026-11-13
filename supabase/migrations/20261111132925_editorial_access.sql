-- Public editorial fields; existing privacy allowlist and publication controls remain enforced.
do $migration$
declare source text;
begin
 select pg_get_functiondef('ig_private.save_content_unscoped(jsonb)'::regprocedure) into source;
 if position('''image_identity_reviewed'']' in source)=0 then raise exception 'Unexpected content validator definition'; end if;
 execute replace(source,'''image_identity_reviewed'']','''image_identity_reviewed'',''job_title'',''sort_order'',''expertise'']');
end $migration$;

alter table public.ig_profiles add column must_change_password boolean not null default false;
alter table ig_private.staff_invites add column require_password_change boolean not null default false;
-- Fresh installations must not grant named staff roles as a schema side effect.
-- Preserve the roles of existing invitations and strengthen their sign-in gate.
-- Additional staff invitations are provisioned separately with owner approval.
update ig_private.staff_invites set require_password_change=true
where accepted_by is null and not revoked;

create or replace function ig_private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ig_profiles(id,display_name,must_change_password)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),120),
 exists(select 1 from ig_private.staff_invites where email=lower(new.email) and not revoked and accepted_by is null and require_password_change));
 return new;
end $$;

-- Auth owns encrypted_password. Client metadata and direct profile writes cannot clear this gate.
create function ig_private.password_rotated() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.encrypted_password is distinct from new.encrypted_password and coalesce(old.encrypted_password,'')<>'' and coalesce(new.encrypted_password,'')<>'' then
  update public.ig_profiles set must_change_password=false,updated_at=now() where id=new.id and must_change_password;
  if found then perform ig_private.record_audit('account.initial_password_changed',new.id::text); end if;
 end if;
 return new;
end $$;
revoke all on function ig_private.password_rotated() from public,anon,authenticated;
create trigger ig_password_rotated after update of encrypted_password on auth.users for each row execute function ig_private.password_rotated();

create or replace function ig_private.allowed(permission text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare r text[]; change_required boolean;
begin
 if not ig_private.valid_identity() then return false; end if;
 select roles,must_change_password into r,change_required from public.ig_profiles where id=auth.uid() and status='active' and policy_version='2026-11-11';
 if r is null then return false; end if;
 if permission='account' then return true; end if;
 if change_required or coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then return false; end if;
 if 'owner'=any(r) then return true; end if;
 return case permission
  when 'admin.read' then r && array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager','sales','auditor']
  when 'content.read' then r && array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager','auditor']
  when 'content.write' then r && array['administrator','publisher','editor','property_manager','procurement_manager','marketing_manager']
  when 'content.publish' then r && array['administrator','publisher']
  when 'users.manage' then 'administrator'=any(r)
  when 'enquiries.manage' then r && array['administrator','sales']
  when 'nda.manage' then 'administrator'=any(r)
  when 'audit.read' then r && array['administrator','auditor']
  else false end;
end $$;
-- The invitation gate is enforced in the database as well as in the application.
do $migration$
declare source text;
begin
 select pg_get_functiondef('ig_private.accept_invitation()'::regprocedure) into source;
 source=replace(source,'perform pg_advisory_xact_lock(7193321);',
 'if exists(select 1 from public.ig_profiles where id=auth.uid() and must_change_password) then raise exception ''Change your initial password before activating staff access'' using errcode=''42501''; end if; perform pg_advisory_xact_lock(7193321);');
 execute source;
end $migration$;
