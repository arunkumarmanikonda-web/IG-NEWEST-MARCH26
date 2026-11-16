-- Private, transaction-only fixtures. No emails or network calls.
begin;
do $$
declare staff_jwt text; buyer_jwt text; ca jsonb; cb jsonb; c1 jsonb; c2 jsonb; outside jsonb; e jsonb;
  room uuid; b uuid:=gen_random_uuid(); payload jsonb; result jsonb; blocked boolean; mail jsonb; mail_id uuid;
  secret text:=repeat('z',64);
begin
  select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text into strict staff_jwt
    from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid' limit 1;
  select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text into strict buyer_jwt
    from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid' limit 1;
  perform set_config('request.jwt.claims',staff_jwt,true);
  ca:=public.ig_client_manage('{"action":"client_save","name":"Share fixture","practice":"hospitality","stage":"engaged"}');
  cb:=public.ig_client_manage('{"action":"client_save","name":"Unrelated fixture","practice":"hospitality","stage":"engaged"}');
  c1:=public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',ca->'id','name','Selected','email','fixture-one@example.com','portal_enabled',true,'circulation',true));
  c2:=public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',ca->'id','name','Unselected','email','fixture-two@example.com','portal_enabled',true,'circulation',true));
  outside:=public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',cb->'id','name','Outside','email','fixture-other@example.com','portal_enabled',true,'circulation',true));
  e:=public.ig_client_manage(jsonb_build_object('action','engagement_save','client_id',ca->'id','title','Sharing test','service','feasibility','reference','Fixture assignment'));
  select id into strict room from public.ig_data_rooms where engagement_id=(e->>'id')::uuid;
  payload:=jsonb_build_object('action','share','room_id',room,'batch_id',b,'recipient_ids',jsonb_build_array(c1->'id'),'download_mode','none','expires_at',now()+interval '20 days');
  blocked:=false;begin perform public.ig_room_share(payload);exception when raise_exception then blocked:=true;end;assert blocked,'Missing authority accepted';
  payload:=payload||jsonb_build_object('confirm_terms',true,'terms_reference','Executed fixture','engagement_version',e->'version');
  blocked:=false;begin perform public.ig_room_share(payload||jsonb_build_object('recipient_ids',jsonb_build_array(c1->'id',outside->'id')));exception when raise_exception then blocked:=true;end;assert blocked;
  assert not exists(select 1 from public.ig_room_grants where room_id=room),'Mixed batch partially granted';
  assert not (select confidentiality_confirmed from public.ig_engagements where id=(e->>'id')::uuid),'Failed batch saved the attestation';
  result:=public.ig_room_share(payload);
  assert result->>'added'='1' and result->>'queued'='1';
  assert public.ig_room_share(payload)=result,'Retry changed receipt';
  assert not exists(select 1 from public.ig_outbox where room_id=room and contact_id=(c2->>'id')::uuid),'Unselected recipient emailed';
  result:=public.ig_room_share(payload||jsonb_build_object('batch_id',gen_random_uuid(),'download_mode','all'));
  assert result->>'recent'='1' and result->>'queued'='0';
  assert exists(select 1 from public.ig_room_grants where room_id=room and download_mode='none'),'Existing access broadened';
  update public.ig_client_contacts set circulation=false where id=(c2->>'id')::uuid;
  payload:=payload||jsonb_build_object('batch_id',gen_random_uuid(),'recipient_ids',jsonb_build_array(c2->'id'));
  blocked:=false;begin perform public.ig_room_share(payload);exception when raise_exception then blocked:=true;end;assert blocked;
  result:=public.ig_room_share(payload||'{"action":"access"}');
  assert result->>'added'='1' and result->>'queued'='0','Access-only mailed an opted-out contact';
  update public.ig_room_grants set active=false where room_id=room and contact_id=(c2->>'id')::uuid;
  result:=public.ig_room_share(payload||jsonb_build_object('batch_id',gen_random_uuid(),'action','access'));
  assert result->>'renewed'='1','Revoked grant could not be explicitly renewed';
  update ig_private.integration_root set secret_hash=encode(extensions.digest(convert_to(secret,'UTF8'),'sha256'),'hex');
  mail:=public.ig_delivery(secret,jsonb_build_object('action','claim','circulation_batch',gen_random_uuid()));
  assert jsonb_array_length(mail)=0,'Worker claimed outside selected batch';
  mail:=public.ig_delivery(secret,jsonb_build_object('action','claim','circulation_batch',b));
  assert jsonb_array_length(mail)=1 and mail->0->>'recipient'='fixture-one@example.com';
  mail_id:=(mail->0->>'id')::uuid;
  perform public.ig_delivery(secret,jsonb_build_object('action','prepare','id',mail_id,'lease_token',mail->0->'lease_token','payload',jsonb_build_object('to',jsonb_build_array('fixture-one@example.com'))));
  perform public.ig_delivery(secret,jsonb_build_object('action','finish','id',mail_id,'lease_token',mail->0->'lease_token','provider_id','test-room-delivery'));
  result:=public.ig_room_share(jsonb_build_object('action','status','room_id',room));
  assert result->0->>'status'='accepted','Missing provider receipt';
  perform public.ig_delivery(secret,jsonb_build_object('action','event','event','email.delivered','event_id','room-share-test-event','provider_id','test-room-delivery'));
  result:=public.ig_room_share(jsonb_build_object('action','status','room_id',room));
  assert result->0->>'status'='delivered','Missing delivered receipt';
  perform set_config('request.jwt.claims',buyer_jwt,true);
  blocked:=false;begin perform public.ig_room_share(jsonb_build_object('action','status','room_id',room));exception when insufficient_privilege then blocked:=true;end;assert blocked,'Client read staff recipients';
end $$;
rollback;
