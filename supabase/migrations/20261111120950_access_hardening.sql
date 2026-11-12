-- Scope specialist staff, protect owner transitions and expose only published tags.
create function ig_private.content_scope(k text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_profiles where id=auth.uid() and status='active' and (
 roles && array['owner','administrator','publisher','auditor'] or
 ('editor'=any(roles) and k in ('page','practice','project','article','person','faq')) or
 ('property_manager'=any(roles) and k='opportunity') or
 ('procurement_manager'=any(roles) and k in ('product','project')) or
 ('marketing_manager'=any(roles) and k in ('page','article','faq'))))
$$;
revoke all on function ig_private.content_scope(text) from public,anon;
grant execute on function ig_private.content_scope(text) to authenticated;
drop policy content_read on public.ig_content;
create policy content_read on public.ig_content for select to authenticated using(ig_private.allowed('content.read') and ig_private.content_scope(kind));
drop policy revisions_read on public.ig_content_revisions;
create policy revisions_read on public.ig_content_revisions for select to authenticated using(exists(select 1 from public.ig_content c where c.id=content_id));
drop policy tags_read on public.ig_content_tags;
create policy tags_read on public.ig_content_tags for select to authenticated using(exists(select 1 from public.ig_content c where c.id=content_id));
alter function ig_private.save_content(jsonb) rename to save_content_unscoped;
revoke all on function ig_private.save_content_unscoped(jsonb) from authenticated;
create function ig_private.save_content(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare k text;
begin
 if not ig_private.allowed('content.write') then raise exception 'Content permission and MFA required' using errcode='42501'; end if;
 if nullif(p->>'id','') is null then k=p->>'kind'; else select kind into k from public.ig_content where id=(p->>'id')::uuid; end if;
 if k is null or not ig_private.content_scope(k) then raise exception 'Your role cannot edit this content type' using errcode='42501'; end if;
 return ig_private.save_content_unscoped(p);
end $$;
create or replace function public.ig_save_content(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.save_content(p)$$;
revoke all on function ig_private.save_content(jsonb) from public,anon;
grant execute on function ig_private.save_content(jsonb) to authenticated;

alter function ig_private.users_action(jsonb) rename to users_action_original;
revoke all on function ig_private.users_action_original(jsonb) from authenticated;
create function ig_private.users_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare is_owner boolean;
begin
 if not ig_private.allowed('users.manage') then raise exception 'User permission and MFA required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(7193321);
 select 'owner'=any(roles) into is_owner from public.ig_profiles where id=auth.uid();
 if p->>'action'='invite' then
  if not is_owner and exists(select 1 from ig_private.staff_invites where email=lower(trim(p->>'email')) and 'owner'=any(roles)) then raise exception 'Only an owner can replace an owner invitation' using errcode='42501'; end if;
  if exists(select 1 from auth.users u join public.ig_profiles p on p.id=u.id where lower(u.email)=lower(trim(users_action.p->>'email')) and p.roles<>array['client']::text[]) then raise exception 'Use the existing user record to change staff roles'; end if;
 end if;
 return ig_private.users_action_original(p);
end $$;
create or replace function public.ig_users_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.users_action(p)$$;
revoke all on function ig_private.users_action(jsonb) from public,anon;
grant execute on function ig_private.users_action(jsonb) to authenticated;

create or replace function ig_private.accept_invitation() returns jsonb language plpgsql security definer set search_path='' as $$
declare invite ig_private.staff_invites; mail text; current_roles text[];
begin
 if not ig_private.allowed('account') or coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'Verified account and MFA required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(7193321);
 select lower(email) into mail from auth.users where id=auth.uid();
 select * into invite from ig_private.staff_invites where email=mail and not revoked and accepted_by is null for update;
 if invite.id is null then return jsonb_build_object('accepted',false); end if;
 select roles into current_roles from public.ig_profiles where id=auth.uid();
 if current_roles<>array['client']::text[] then raise exception 'Existing staff roles must be changed through user administration'; end if;
 update public.ig_profiles set roles=invite.roles,updated_at=now() where id=auth.uid();
 update ig_private.staff_invites set accepted_by=auth.uid() where id=invite.id;
 perform ig_private.record_audit('staff.invitation_accepted',auth.uid()::text,jsonb_build_object('roles',invite.roles));
 return jsonb_build_object('accepted',true);
end $$;
create function ig_private.revoke_invitation(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare invite ig_private.staff_invites;
begin
 if not ig_private.allowed('users.manage') then raise exception 'User permission and MFA required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(7193321);
 select * into invite from ig_private.staff_invites where id=(p->>'id')::uuid for update;
 if invite.id is null then raise exception 'Invitation not found'; end if;
 if 'owner'=any(invite.roles) and not exists(select 1 from public.ig_profiles where id=auth.uid() and 'owner'=any(roles)) then raise exception 'Owner permission required' using errcode='42501'; end if;
 update ig_private.staff_invites set revoked=true where id=invite.id;
 perform ig_private.record_audit('invitation.revoked',invite.id::text);
 return jsonb_build_object('ok',true);
end $$;
create function public.ig_revoke_invitation(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.revoke_invitation(p)$$;
revoke all on function ig_private.revoke_invitation(jsonb),public.ig_revoke_invitation(jsonb) from public,anon;
grant execute on function ig_private.revoke_invitation(jsonb),public.ig_revoke_invitation(jsonb) to authenticated;

create table public.ig_public_tags(content_id uuid not null references public.ig_public_content(id) on delete cascade,term_id uuid not null references public.ig_taxonomy(id) on delete restrict,primary key(content_id,term_id));
alter table public.ig_public_tags enable row level security;
revoke all on public.ig_public_tags from anon,authenticated;
grant select on public.ig_public_tags to anon,authenticated;
create policy published_tags on public.ig_public_tags for select to anon,authenticated using(true);
create index ig_public_tags_term on public.ig_public_tags(term_id);
create function ig_private.publish_tags() returns trigger language plpgsql security definer set search_path='' as $$begin
 delete from public.ig_public_tags where content_id=new.id;
 insert into public.ig_public_tags(content_id,term_id) select content_id,term_id from public.ig_content_tags where content_id=new.id;
 return new;
end $$;
revoke all on function ig_private.publish_tags() from public,anon,authenticated;
create trigger ig_published_tags after insert or update on public.ig_public_content for each row execute function ig_private.publish_tags();
grant usage on schema ig_private to anon;
-- Anonymous execution remains limited to the policy helper, which returns false for staff access.
