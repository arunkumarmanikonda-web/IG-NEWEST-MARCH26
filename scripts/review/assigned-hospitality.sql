do $$begin
 if not exists(select from ig_review_guard.installation where project_ref='ehcqhoxiwmydipwfujuf' and stage='ready_for_accounts') then raise exception 'Requires the dedicated, isolated reviewer database'; end if;
end$$;
create or replace function public.ig_review_hospitality_workspace() returns jsonb
language sql stable security definer set search_path='' as $$
 select (select jsonb_build_object('title',c.title,'summary',c.summary,'body',c.body,'status',c.status,'version',c.version,'practice',c.practice)
 from public.ig_content c where c.kind='opportunity' and c.slug='sample-lotus-hotel' and c.practice='hospitality' and c.status='draft' and c.deleted_at is null)
 where ig_private.valid_identity()
 and auth.jwt()->>'iss'='https://ehcqhoxiwmydipwfujuf.supabase.co/auth/v1'
 and coalesce((auth.jwt()->'amr') @> '[{"method":"password"}]'::jsonb,false)
 and exists(select 1 from ig_review_guard.installation i cross join ig_review_guard.reviewers r join public.ig_profiles p on p.id=r.user_id join auth.users u on u.id=r.user_id
 where i.project_ref='ehcqhoxiwmydipwfujuf' and i.stage='ready_for_accounts' and r.kind='staff' and r.active and r.email='play.staff@example.invalid' and r.user_id=auth.uid() and u.email=r.email and p.status='active' and not p.must_change_password);
$$;
revoke all on function public.ig_review_hospitality_workspace() from public,anon,authenticated,service_role;
grant execute on function public.ig_review_hospitality_workspace() to authenticated;
