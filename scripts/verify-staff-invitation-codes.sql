-- Disposable, transaction-scoped fixtures for the first-code eligibility regression.
begin;
do $$
declare
  mail text := 'first-code-test@example.invalid';
  test_key text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  update ig_private.integration_root set secret_hash=encode(extensions.digest(convert_to(test_key,'UTF8'),'sha256'),'hex');
  assert not public.ig_client_login_eligible(test_key, mail);
  insert into ig_private.staff_invites(email,roles) values(mail,array['administrator']);
  assert public.ig_client_login_eligible(test_key, upper(mail));
  update ig_private.staff_invites set revoked=true where email=mail;
  assert not public.ig_client_login_eligible(test_key, mail);
end $$;
rollback;
