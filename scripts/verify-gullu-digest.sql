-- All records and outbound events stay in this rolled-back transaction.
begin;
do $$
declare secret text=repeat('r',64); monday date=date_trunc('week',now() at time zone 'Asia/Kolkata')::date-14;
  t uuid=gen_random_uuid(); session_key uuid=gen_random_uuid(); jobs jsonb; j jsonb; request jsonb;
  message jsonb; ack jsonb; recipient text; provider text=gen_random_uuid()::text; saved jsonb;
begin
  update ig_private.integration_root set secret_hash=encode(extensions.digest(secret,'sha256'),'hex');
  update ig_private.integration_config set mode='enabled' where id='resend';
  begin
    perform public.ig_gullu_digest(null,'{"action":"claim"}');
    raise exception 'Null secret was accepted';
  exception when insufficient_privilege then null; end;
  insert into ig_private.gullu_turns(turn_id,session_id,question,answer,sources,practice_interest,created_at) values
    (t,session_key,'First question','Answer','[]','Hospitality',(monday+time '12:00') at time zone 'Asia/Kolkata'),
    (gen_random_uuid(),session_key,'Second question','Answer','[]','Hospitality',(monday+6+time '23:59') at time zone 'Asia/Kolkata');
  if (select count(*) from ig_private.gullu_reports where period_start=monday)<>3 or
       not ig_private.gullu_report_due() then raise exception 'Missing or duplicate weekly recipients'; end if;
  jobs=public.ig_gullu_digest(secret,'{"action":"claim"}');
  if jsonb_array_length(jobs)<>3 or (jobs#>>'{0,summary,questions}')::int<>2 or
       (jobs#>>'{0,summary,conversations}')::int<>1 or (jobs#>>'{0,summary,topics,0,total}')::int<>2 then
    raise exception 'Incorrect weekly report snapshot';
  end if;
  if public.ig_gullu_digest(secret,'{"action":"claim"}')<>'[]'::jsonb then raise exception 'Active lease reclaimed'; end if;
  j=jobs->0;recipient=j->>'recipient';
  request=jsonb_build_object('id',j->>'id','lease_token',j->>'lease_token');
  message=jsonb_build_object('subject','Digest','to',jsonb_build_array(recipient));
  saved=public.ig_gullu_digest(secret,request||jsonb_build_object('action','prepare','payload',message));
  ack=public.ig_gullu_digest(secret,request||jsonb_build_object('action','finish','provider_id',null));
  update ig_private.gullu_reports set next_at=now() where id=(j->>'id')::uuid;
  j=public.ig_gullu_digest(secret,'{"action":"claim"}')->0;
  request=jsonb_build_object('id',j->>'id','lease_token',j->>'lease_token');
  if public.ig_gullu_digest(secret,request||jsonb_build_object('action','prepare','payload',message||'{"subject":"Changed"}'::jsonb))
       is distinct from saved then raise exception 'Report retry changed its payload'; end if;
  insert into ig_private.provider_events(provider,event_id,provider_id,event_type) values('resend',gen_random_uuid()::text,provider,'email.delivered');
  perform public.ig_gullu_digest(secret,request||jsonb_build_object('action','finish','provider_id',provider));
  if (select status from ig_private.gullu_reports where id=(j->>'id')::uuid)<>'delivered' then raise exception 'Early webhook was lost'; end if;
  insert into ig_private.provider_events(provider,event_id,provider_id,event_type) values('resend',gen_random_uuid()::text,provider,'email.complained');
  if (select status from ig_private.gullu_reports where id=(j->>'id')::uuid)<>'suppressed' or
    not exists(select 1 from ig_private.email_suppressions where email=recipient) then raise exception 'Suppression missing'; end if;
end $$;
rollback;
