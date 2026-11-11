-- Transaction rolls back all enquiries, queued email, rate-limit and test-secret changes.
begin;
create temp table ig_checks(name text,passed boolean);
create function pg_temp.check_it(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAILED: %',label;end if;insert into ig_checks values(label,true);end$$;
do $$
declare root text=repeat('routing-test-',5);interest text;result jsonb;p jsonb;
begin
 update ig_private.ingest_config set secret_hash=encode(extensions.digest(root,'sha256'),'hex');
 foreach interest in array array['Real Estate Advisory','HORECA procurement','Hospitality project','General enquiry'] loop
  p=jsonb_build_object('name','SYSTEM TEST routing','email','routing@system-test.invalid','message','Rollback-only enquiry routing verification.','practice',interest,'privacy',true,'request_id',gen_random_uuid(),'rate_key',encode(extensions.digest(interest,'sha256'),'hex'));
  result=public.ig_submit_enquiry(root,p);
  perform pg_temp.check_it((select count(*) from public.ig_outbox where enquiry_id=(result->>'id')::uuid and kind='internal' and recipient in ('akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com'))=3,interest||': all three internal recipients queued');
  perform pg_temp.check_it((select count(*) from public.ig_outbox where enquiry_id=(result->>'id')::uuid and kind='acknowledgement')=1,interest||': one customer acknowledgement queued');
  perform public.ig_submit_enquiry(root,p);
  perform pg_temp.check_it((select count(*) from public.ig_outbox where enquiry_id=(result->>'id')::uuid)=4,interest||': retry does not duplicate notifications');
 end loop;
end$$;
select * from ig_checks;
rollback;
