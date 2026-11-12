create or replace function ig_private.apply_delivery_events(pid text) returns void language plpgsql security definer set search_path='' as $$
declare j public.ig_outbox; bad text;
begin
 select * into j from public.ig_outbox where provider_id=pid for update;
 if j.id is null then return;end if;
 select event_type into bad from ig_private.provider_events where provider='resend' and provider_id=pid and event_type in ('email.bounced','email.complained','email.suppressed') order by created_at desc limit 1;
 if bad is not null then
  insert into ig_private.email_suppressions(email,reason) values(lower(j.recipient),bad) on conflict(email) do update set reason=excluded.reason;
  update public.ig_outbox set status='suppressed' where id=j.id;
 elsif exists(select 1 from ig_private.provider_events where provider='resend' and provider_id=pid and event_type='email.delivered') then
  update public.ig_outbox set status='delivered' where id=j.id and status<>'suppressed';
 elsif exists(select 1 from ig_private.provider_events where provider='resend' and provider_id=pid and event_type='email.failed') then
  update public.ig_outbox set status='failed',attempts=5,last_error='Provider reported terminal delivery failure; review provider logs.' where id=j.id and status not in ('suppressed','delivered');
 end if;
 update ig_private.provider_events set processed_at=now() where provider='resend' and provider_id=pid and processed_at is null;
end $$;
