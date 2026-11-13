-- Transaction-only checks. No messages, auth accounts, grants or retained records.
begin;
create temp table contact_checks(name text, passed boolean);
create function pg_temp.check_contact(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAILED: %',label;end if;insert into contact_checks values(label,true);end$$;
do $$
declare uid uuid;sid uuid;claims jsonb;client jsonb;batch jsonb;contact jsonb;result jsonb;clientid uuid;contactid uuid;before_count int;initial_version int;
begin
 select u.id,s.id into uid,sid from auth.users u join auth.sessions s on s.user_id=u.id where lower(u.email)='akm@indiagully.com' order by s.created_at desc limit 1;
 if sid is null then raise exception 'Existing owner session required';end if;
 claims=jsonb_build_object('sub',uid,'session_id',sid,'aal','aal2','role','authenticated');perform set_config('request.jwt.claims',claims::text,true);
 client=public.ig_client_manage('{"action":"client_save","name":"INTERNAL QA multi-contact client","practice":"transaction-advisory","contacts":[{"name":"QA one","email":"qa-one@example.invalid","phone":"+1 (202) 555-0101"},{"name":"QA two","email":"qa-two@example.invalid","phone":"+44 20 7946 0001"}]}');
 clientid=(client->>'id')::uuid;
 perform pg_temp.check_contact(jsonb_array_length(client->'contacts')=2,'One creation request saves two independent client contacts');
 perform pg_temp.check_contact((select count(*) from public.ig_client_contacts where client_id=clientid and phone<>'')=2,'Both distinct phone numbers persist in the database');
 perform pg_temp.check_contact(not exists(select 1 from public.ig_client_contacts where client_id=clientid and (portal_enabled or circulation)),'New contacts do not acquire portal or circulation permission by default');
 batch=public.ig_client_manage(jsonb_build_object('action','contacts_add','client_id',clientid,'contacts','[{"name":"QA three","email":"qa-three@example.invalid","phone":"+1 202 555 0103"},{"name":"QA four","email":"qa-four@example.invalid"}]'::jsonb));
 perform pg_temp.check_contact((batch->>'added')::int=2 and (select count(*) from public.ig_client_contacts where client_id=clientid)=4,'An existing organisation accepts a further multi-contact batch');
 contact=client->'contacts'->0;contactid=(contact->>'id')::uuid;
 result=public.ig_client_manage(contact||jsonb_build_object('action','contact_save','phone','+1 202 555 0199'));
 perform pg_temp.check_contact(result->>'phone'='+1 202 555 0199' and (result->>'version')::int=2,'Editing a phone number preserves the contact identity and advances its version');
 result=public.ig_client_manage((result-'phone')||jsonb_build_object('action','contact_save','designation','Updated QA role'));
 perform pg_temp.check_contact(result->>'phone'='+1 202 555 0199','Older clients which omit the phone field preserve the saved number');
 begin
  perform public.ig_client_manage(contact||jsonb_build_object('action','contact_save','phone','+1 202 555 0100'));
  raise exception 'STALE_CONTACT_ACCEPTED';
 exception when serialization_failure then null;end;
 perform pg_temp.check_contact(true,'Stale edits remain rejected');
 begin
  perform public.ig_client_manage(jsonb_build_object('action','contacts_add','client_id',clientid,'contacts','[{"name":"QA first new","email":"qa-new@example.invalid"},{"name":"QA duplicate","email":"qa-one@example.invalid"}]'::jsonb));
  raise exception 'DUPLICATE_ACCEPTED';
 exception when raise_exception then if sqlerrm='DUPLICATE_ACCEPTED' then raise;end if;end;
 perform pg_temp.check_contact((select count(*) from public.ig_client_contacts where client_id=clientid)=4,'A duplicate in a batch rolls back every new contact in that batch');
 select count(*) into before_count from public.ig_clients;
 begin
  perform public.ig_client_manage('{"action":"client_save","name":"INVALID QA client","practice":"transaction-advisory","contacts":[{"name":"Bad number","email":"bad-phone@example.invalid","phone":"phone pending"}]}');
  raise exception 'INVALID_PHONE_ACCEPTED';
 exception when raise_exception then if sqlerrm='INVALID_PHONE_ACCEPTED' then raise;end if;end;
 perform pg_temp.check_contact((select count(*) from public.ig_clients)=before_count,'Invalid contact data also rolls back the new client, avoiding partial records');
 perform pg_temp.check_contact(not exists(select 1 from public.ig_room_grants where contact_id in (select id from public.ig_client_contacts where client_id=clientid)),'Contact creation creates no data-room grants');
 perform set_config('request.jwt.claims','{}',true);
 begin
  perform public.ig_client_manage(jsonb_build_object('action','contacts_add','client_id',clientid,'contacts','[{"name":"Unauthorised","email":"not-allowed@example.invalid"}]'::jsonb));
  raise exception 'UNAUTHENTICATED_ACCEPTED';
 exception when insufficient_privilege then null;end;
 perform pg_temp.check_contact(true,'Unauthenticated batch creation remains blocked');
end $$;
select * from contact_checks;
rollback;
