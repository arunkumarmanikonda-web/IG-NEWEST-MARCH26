-- No HTTP request is sent: pg_net dispatches after commit, and this test rolls back.
begin;
do $$
declare eid uuid; oid uuid; request_id bigint; before_count bigint;
begin
 select count(*) into before_count from net.http_request_queue;
 insert into public.ig_enquiries(name,email,practice,message)
 values('Rollback scheduler test','rollback@example.org','corporate','Environment isolation verification; always rolled back.') returning id into eid;
 insert into public.ig_outbox(enquiry_id,recipient,kind)
 values(eid,'rollback@example.org','acknowledgement') returning id into oid;
 update ig_private.integration_config set mode='disabled' where id<>'business';
 update ig_private.webhook_relay set enabled=false;
 assert ig_private.run_email_worker() is null,'Disabled relay dispatched';
 update ig_private.webhook_relay set enabled=true,supabase_origin=null;
 update ig_private.integration_config set mode='enabled' where id='resend';
 assert ig_private.run_email_worker() is null,'Missing origin dispatched';
 begin
  update ig_private.webhook_relay set supabase_origin='https://example.org';
  raise exception 'Invalid worker origin was accepted';
 exception when check_violation then null;
 end;
 update ig_private.webhook_relay set supabase_origin='https://abcdefghijklmnopqrst.supabase.co';
 update ig_private.integration_config set mode='disabled' where id='resend';
 assert ig_private.run_email_worker() is null,'Disabled email provider dispatched';
 assert (select count(*) from net.http_request_queue)=before_count,'An inactive worker queued HTTP';
 update ig_private.integration_config set mode='enabled' where id='resend';
 if not exists(select 1 from vault.secrets where name='ig_email_worker') then
  perform vault.create_secret(repeat('t',64),'ig_email_worker');
 end if;
 request_id=ig_private.run_email_worker();
 assert request_id is not null,'Enabled transactional work was not queued';
 assert exists(select 1 from net.http_request_queue where id=request_id
  and url='https://abcdefghijklmnopqrst.supabase.co/functions/v1/ig-provider-webhook/worker'
  and headers->>'x-ig-signature' ~ '^[0-9a-f]{64}$'
  and not headers ? 'authorization'),'Wrong destination or permanent credentials in HTTP queue';
 assert not has_function_privilege('anon','ig_private.run_email_worker()','execute'),'Anonymous worker execution allowed';
 assert not has_function_privilege('authenticated','ig_private.run_email_worker()','execute'),'User worker execution allowed';
end $$;
rollback;
select 'Worker destination, inactive-provider, relay and access checks passed; all fixtures and queued HTTP rolled back' as verification;
