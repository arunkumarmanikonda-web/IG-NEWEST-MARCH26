begin;
do $$
declare secret text=repeat('q',64); claim jsonb; a jsonb; t jsonb; ack jsonb; x text;
begin
 update ig_private.integration_root set secret_hash=encode(extensions.digest(secret,'sha256'),'hex');
 if public.ig_gullu_admit(secret,jsonb_build_object('visitor_hash',repeat('1',64))) is not true then raise exception 'Chat admission failed';end if;
 t=jsonb_build_object('session_id',gen_random_uuid(),'turn_id',gen_random_uuid(),'question','Tell me about hotel feasibility.','answer','Explore the hospitality practice.','sources','[]'::jsonb,'practice_interest','Hospitality','consent',true);
 begin perform public.ig_gullu_record(secret,t||'{"consent":false}'); raise exception 'Saved without consent'; exception when others then if sqlerrm='Saved without consent' then raise;end if;end;
 perform public.ig_gullu_record(secret,t);
 t=t||'{"follow_up":true,"contact_email":"qa@example.invalid","contact_name":"QA Visitor"}'::jsonb;
 ack=public.ig_gullu_record(secret,t);
 if ack is distinct from public.ig_gullu_record(secret,t) or (select count(*) from public.ig_outbox where enquiry_id=(ack->>'enquiry_id')::uuid)<>3 then raise exception 'Lead delivery deduplication failed';end if;
 claim=public.ig_perspective_worker(secret,'{"action":"claim"}');
 if claim->>'run_id' is null or public.ig_perspective_worker(secret,'{"action":"claim"}') is not null then raise exception 'Research lease failed';end if;
 perform public.ig_perspective_worker(secret,claim||'{"action":"hold","error":"Insufficient evidence"}');
 if (select count(*) from public.ig_public_content where public_data->>'engine'='perspectives')<>0 then raise exception 'Held report published';end if;
 update ig_private.intelligence_settings set next_at=now();
 claim=public.ig_perspective_worker(secret,'{"action":"claim"}');
 a=jsonb_build_object('title','Test Perspective','summary','Verified fixture','body',repeat('Verified fixture ',20),'sources','[{},{}]'::jsonb,
  'sections','[{},{}]'::jsonb,'practice','Real estate','verification','{"report":"VERIFIED in a fixture"}'::jsonb);
 x=public.ig_perspective_worker(secret,claim||jsonb_build_object('action','publish','article',a))->>'slug';
 if not exists(select 1 from public.ig_public_content where slug=x and kind='article') or public.ig_perspective_worker(secret,claim||jsonb_build_object('action','publish','article',a)) is not null then raise exception 'Publication or idempotency failed';end if;
end $$;
rollback;
