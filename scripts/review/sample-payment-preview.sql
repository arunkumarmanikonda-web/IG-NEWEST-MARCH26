create function public.ig_review_sample_payment(link_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',l.id,'amount',l.amount,'purpose',l.purpose,'created_at',l.created_at)
 from ig_review_guard.sample_links l where l.id=link_id and ig_private.valid_identity()
 and auth.jwt()->>'iss'='https://ehcqhoxiwmydipwfujuf.supabase.co/auth/v1'
 and exists(select from ig_review_guard.installation i cross join ig_review_guard.reviewers r join public.ig_profiles p on p.id=r.user_id
 where i.project_ref='ehcqhoxiwmydipwfujuf' and r.active and p.status='active' and r.user_id=auth.uid() and r.email=auth.jwt()->>'email')
$$;
revoke all on function public.ig_review_sample_payment(uuid) from public,anon,authenticated,service_role;
grant execute on function public.ig_review_sample_payment(uuid) to authenticated;
