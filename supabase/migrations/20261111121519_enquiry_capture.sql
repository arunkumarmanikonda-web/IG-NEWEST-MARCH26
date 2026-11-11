alter table public.ig_enquiries add column organisation text not null default '',add column phone text not null default '',add column request_id uuid not null default gen_random_uuid(),add column payload_hash text not null default '',add column privacy_version text not null default '2026-11-11';
create unique index ig_enquiry_request on public.ig_enquiries(request_id);
create function ig_private.submit_enquiry(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare expected text; e public.ig_enquiries; fingerprint text; rate integer; rkey text; recipient text;
begin
 select secret_hash into expected from ig_private.ingest_config where id=true;
 if expected is null or secret is null or length(secret)<40 or encode(extensions.digest(secret,'sha256'),'hex')<>expected then raise exception 'Enquiry ingestion is unavailable' using errcode='42501'; end if;
 if coalesce(p->>'privacy','false')<>'true' then raise exception 'Privacy acknowledgement required'; end if;
 if length(trim(coalesce(p->>'name',''))) not between 2 and 100 or length(trim(coalesce(p->>'message',''))) not between 10 and 1500 or length(trim(coalesce(p->>'practice',''))) not between 1 and 120 then raise exception 'Check the enquiry fields'; end if;
 if length(coalesce(p->>'email',''))>254 or coalesce(p->>'email','')!~'^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' or length(coalesce(p->>'phone',''))>30 or length(coalesce(p->>'organisation',''))>150 then raise exception 'Check your contact details'; end if;
 if coalesce(p->>'rate_key','')!~'^[a-f0-9]{64}$' then raise exception 'Invalid request context'; end if;
 fingerprint=encode(extensions.digest((p-'rate_key')::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p->>'request_id',0));
 select * into e from public.ig_enquiries where request_id=(p->>'request_id')::uuid;
 if e.id is not null then
  if e.payload_hash<>fingerprint then raise exception 'Request reference already used' using errcode='23505'; end if;
  return jsonb_build_object('id',e.id,'saved',true,'email_status','awaiting_provider');
 end if;
 rkey='enquiry:'||(p->>'rate_key');
 insert into ig_private.rate_limits(key,window_start,count) values(rkey,now(),1) on conflict(key) do update set window_start=case when rate_limits.window_start<now()-interval '15 minutes' then now() else rate_limits.window_start end,count=case when rate_limits.window_start<now()-interval '15 minutes' then 1 else rate_limits.count+1 end returning count into rate;
 if rate>5 then raise exception 'Please wait before submitting another enquiry' using errcode='P0429'; end if;
 delete from ig_private.rate_limits where window_start<now()-interval '2 days';
 insert into public.ig_enquiries(name,email,organisation,phone,practice,message,request_id,payload_hash) values(trim(p->>'name'),lower(trim(p->>'email')),trim(coalesce(p->>'organisation','')),trim(coalesce(p->>'phone','')),trim(p->>'practice'),trim(p->>'message'),(p->>'request_id')::uuid,fingerprint) returning * into e;
 foreach recipient in array array['akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com'] loop
  insert into public.ig_outbox(enquiry_id,recipient,kind) values(e.id,recipient,'internal');
 end loop;
 insert into public.ig_outbox(enquiry_id,recipient,kind) values(e.id,e.email,'acknowledgement');
 insert into public.ig_audit(action,entity_id,detail) values('enquiry.received',e.id::text,'{"email_status":"awaiting_provider"}');
 return jsonb_build_object('id',e.id,'saved',true,'email_status','awaiting_provider');
end $$;
create function public.ig_submit_enquiry(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.submit_enquiry(secret,p)$$;
revoke all on function ig_private.submit_enquiry(text,jsonb),public.ig_submit_enquiry(text,jsonb) from public;
grant execute on function ig_private.submit_enquiry(text,jsonb),public.ig_submit_enquiry(text,jsonb) to anon,authenticated;
