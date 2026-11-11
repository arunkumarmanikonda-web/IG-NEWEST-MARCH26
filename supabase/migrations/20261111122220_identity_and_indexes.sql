create or replace function ig_private.valid_identity() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and u.deleted_at is null and not u.is_anonymous and (u.banned_until is null or u.banned_until<=now()) and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>now()))
$$;
drop policy profiles_read on public.ig_profiles;
create policy profiles_read on public.ig_profiles for select to authenticated using((id=(select auth.uid()) and (select ig_private.valid_identity())) or (select ig_private.allowed('users.manage')));
drop policy consents_read on public.ig_consents;
create policy consents_read on public.ig_consents for select to authenticated using((user_id=(select auth.uid()) and (select ig_private.valid_identity())) or (select ig_private.allowed('users.manage')));
create index ig_invites_accepted_by on ig_private.staff_invites(accepted_by);
create index ig_invites_created_by on ig_private.staff_invites(created_by);
create index ig_content_created_by on public.ig_content(created_by);
create index ig_content_updated_by on public.ig_content(updated_by);
create index ig_revision_actor on public.ig_content_revisions(actor_id);
create index ig_enquiry_assigned on public.ig_enquiries(assigned_to);
