insert into auth.users(email,email_confirmed_at) values ('owner@example.invalid',now());
insert into auth.sessions(user_id) select id from auth.users;
update public.ig_policy_releases set current=true where version=(select max(version) from public.ig_policy_releases);
update public.ig_profiles set roles=array['owner'],must_change_password=false,policy_version=ig_private.current_policy();
insert into public.ig_consents(user_id,purpose,granted,version,policy_hash)
select id,'registration',true,policy_version,(select sha256 from public.ig_policy_releases where current) from public.ig_profiles;

insert into ig_private.integration_root(secret_hash) values(repeat('a',64));
insert into ig_private.ingest_config(secret_hash) values(repeat('a',64)) on conflict do nothing;
update ig_private.integration_config set mode='enabled' where id in ('resend','runway');
insert into ig_private.webhook_relay(id,origin,enabled) values(true,'https://example.invalid',true)
on conflict(id) do update set enabled=true;
update ig_private.webhook_relay set campaign_delivery_enabled=true;

insert into auth.users(email,email_confirmed_at) values ('buyer@example.invalid',now());
insert into auth.sessions(user_id) select id from auth.users where email='buyer@example.invalid';
