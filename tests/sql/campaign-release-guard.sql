-- Entire test rolls back. pg_net requests are never committed or sent.
begin;
do $$
declare uid uuid=gen_random_uuid();sid uuid=gen_random_uuid();c jsonb;j jsonb;
 k text=repeat('c',64);before_count bigint;request_id bigint;denied boolean=false;
begin
 select count(*) into before_count from net.http_request_queue;
 insert into auth.users(id,email,email_confirmed_at) values(uid,'campaign-rollback@example.org',now());
 insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,uid,now(),now());
 update public.ig_profiles set roles=array['owner'],policy_version=ig_private.current_policy(),must_change_password=false where id=uid;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'session_id',sid,'aal','aal2','role','authenticated')::text,true);
 update ig_private.integration_root set secret_hash=encode(extensions.digest(convert_to(k,'UTF8'),'sha256'),'hex');
 update ig_private.integration_config set mode='enabled' where id='resend';
 update ig_private.webhook_relay set enabled=true,supabase_origin='https://abcdefghijklmnopqrst.supabase.co',campaign_delivery_enabled=false;
 c=public.ig_campaign_manage('{"action":"save","practice":"horeca","title":"Rollback only","subject":"Never send","body":"Rollback verification. This message is never sent."}');
 assert c->>'status'='draft','Disabled delivery prevented safe drafting';
 begin
  perform public.ig_campaign_manage(jsonb_build_object('action','activate','id',c->>'id','version',1,'reviewed',true,'audience_count',1));
 exception when insufficient_privilege then denied=true;end;
 assert denied,'Owner could activate while delivery disabled';
 -- Simulate a previously approved queue; the installation switch must still stop it.
 update public.ig_campaigns set status='active' where id=(c->>'id')::uuid;
 insert into ig_private.campaign_deliveries(campaign_id,user_id,recipient) values((c->>'id')::uuid,uid,'campaign-rollback@example.org') returning to_jsonb(campaign_deliveries.*) into j;
 assert public.ig_campaign_runtime(k,'{"action":"claim"}')='[]'::jsonb,'Disabled delivery leased a recipient';
 assert public.ig_campaign_runtime(k,jsonb_build_object('action','prepare','id',j->>'id','payload','{}'::jsonb)) is null,'Disabled delivery released a payload';
 assert ig_private.run_email_worker() is null,'Disabled campaigns scheduled HTTP';
 update ig_private.webhook_relay set campaign_delivery_enabled=true,enabled=false;
 assert ig_private.run_email_worker() is null,'Queued campaign bypassed disabled relay';
 update ig_private.webhook_relay set enabled=true,supabase_origin=null;
 assert ig_private.run_email_worker() is null,'Queued campaign bypassed missing origin';
 update ig_private.webhook_relay set supabase_origin='https://abcdefghijklmnopqrst.supabase.co';
 update ig_private.integration_config set mode='disabled' where id='resend';
 assert ig_private.run_email_worker() is null,'Queued campaign bypassed disabled provider';
 assert (select count(*) from net.http_request_queue)=before_count,'Disabled path queued HTTP';
 update ig_private.integration_config set mode='enabled' where id='resend';
 if not exists(select 1 from vault.secrets where name='ig_email_worker') then perform vault.create_secret(repeat('t',64),'ig_email_worker');end if;
 request_id=ig_private.run_email_worker();
 assert request_id is not null,'Explicitly enabled campaign was not scheduled';
 assert exists(select 1 from net.http_request_queue where id=request_id and url='https://abcdefghijklmnopqrst.supabase.co/functions/v1/ig-provider-webhook/worker'),'Campaign worker used wrong origin';
 assert not has_function_privilege('anon','ig_private.campaign_delivery_enabled()','execute'),'Anonymous release switch access';
 assert not has_function_privilege('authenticated','ig_private.campaign_delivery_enabled()','execute'),'User release switch access';
 assert not has_table_privilege('authenticated','ig_private.campaign_deliveries','select'),'Recipient queue exposed';
end $$;
rollback;
select '14 campaign release and isolation assertions passed; all fixtures and HTTP rolled back' as verification;
