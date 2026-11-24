-- Real publication/permission paths, snapshot isolation and exact expiry boundaries.
begin;
do $$
declare owner_id uuid; buyer_id uuid; owner_claims text; buyer_claims text; staff uuid; staff_session uuid;
  intake jsonb; draft jsonb; saved jsonb; result jsonb; cid uuid; pid uuid; room_id uuid; campaign uuid;
  grant_id uuid; old_room uuid; old_grant uuid; secret text:=repeat('a',64);
  approved_tag uuid:=gen_random_uuid(); draft_tag uuid:=gen_random_uuid(); media uuid:=gen_random_uuid();
  original public.ig_public_content; blocked boolean; n integer; deadline timestamptz:=now()+interval '7 days';
  lifecycle integer:=1; content_version integer; past timestamptz:=now()-interval '1 second';
begin
  select u.id,jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text
    into strict owner_id,owner_claims from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid' limit 1;
  select u.id,jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text
    into strict buyer_id,buyer_claims from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid' limit 1;
  update public.ig_profiles set policy_version=ig_private.current_policy(),must_change_password=false where id=buyer_id;
  insert into public.ig_consents(user_id,purpose,granted,version,policy_hash)
    select buyer_id,'registration',true,version,sha256 from public.ig_policy_releases where current;
  perform set_config('request.jwt.claims',owner_claims,true);
  intake:=public.ig_content_intake(jsonb_build_object('action','begin','request_id',gen_random_uuid(),'kind','opportunity','practice','real-estate'));
  cid:=(intake->>'content_id')::uuid;
  select to_jsonb(c) into draft from public.ig_content c where id=cid;
  insert into public.ig_taxonomy(id,dimension,slug,label) values
    (approved_tag,'opportunity-context','fixture-lifecycle-approved','Approved tag'),
    (draft_tag,'opportunity-context','fixture-lifecycle-private','Unapproved tag');
  draft:=public.ig_save_content(draft||jsonb_build_object('title','Lifecycle hotel','summary','Approved summary','body','Approved body',
    'term_ids',jsonb_build_array(approved_tag),'public_data','{}'::jsonb));
  perform public.ig_content_action(jsonb_build_object('action','publish','id',cid,'version',draft->'version',
    'factsConfirmed',true,'rightsConfirmed',true,'privacyConfirmed',true));
  select * into strict original from public.ig_public_content where id=cid;
  assert original.public_data->>'listing_status'='available';
  assert (original.public_data->>'listing_archived')::boolean=false;
  assert original.public_data->'listing_archive_until'='null'::jsonb;
  insert into public.ig_data_rooms(content_id,title,active) values(cid,'Lifecycle room',true)
    on conflict(content_id) do update set active=true returning id into room_id;
  insert into public.ig_room_grants(room_id,access_basis,recipient_email,recipient_name,authorisation_reason,authorised_by,authorised_at,expires_at)
    values(room_id,'admin_authorised','buyer@example.invalid','Existing client','Authorised confidential evaluation',owner_id,now(),now()+interval '30 days') returning id into grant_id;
  update ig_private.integration_root set secret_hash=encode(extensions.digest(secret,'sha256'),'hex');
  assert ig_private.admin_room_grant_active(grant_id),'Initial private room grant unavailable';
  assert original.slug=any(public.ig_room_listing_slugs());
  campaign:=(public.ig_manage_listing_feature(jsonb_build_object('content_id',cid,'action','save','slot',1,'ends_at',now()+interval '14 days'))->>'id')::uuid;
  assert exists(select 1 from public.ig_live_listing_features() where id=campaign);

  -- Keep a newer draft and tags private, and release an image after publication.
  draft:=public.ig_save_content(draft||jsonb_build_object('body','Unapproved changed body','term_ids',jsonb_build_array(draft_tag)));
  content_version:=(draft->>'version')::integer;
  insert into public.ig_source_media(id,actor_id,practice,path,source_name,rights_reference,alt,preset,state,published)
    values(media,owner_id,'real-estate','fixture/lifecycle.jpg','lifecycle.jpg','Owner supplied','Newly uploaded exterior','landscape','ready',false);
  insert into storage.objects(bucket_id,name,owner) values('ig-source-media','fixture/lifecycle.jpg',owner_id);
  perform public.ig_content_intake(jsonb_build_object('action','media','id',intake->>'id','media_id',media));
  update public.ig_source_media set published=true where id=media;

  perform set_config('request.jwt.claims',buyer_claims,true);
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',1,'status','sold'));
    exception when insufficient_privilege then blocked:=true;end;assert blocked,'Client changed availability';
  perform set_config('request.jwt.claims','{}',true);
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',1,'status','sold'));
    exception when insufficient_privilege then blocked:=true;end;assert blocked,'Anonymous changed availability';
  perform set_config('request.jwt.claims',owner_claims,true);
  result:=public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',1,'status','reserved','label','A new chapter'));
  lifecycle:=(result->>'listing_lifecycle_version')::integer;
  assert lifecycle=2 and result->>'listing_status'='reserved' and (result->>'public_visible')::boolean;
  assert (select body=original.body and version=original.version and published_at=original.published_at and
    public_data-'listing_status'-'listing_status_label'-'listing_archived'-'listing_archive_until'-'listing_lifecycle_version'=
    original.public_data-'listing_status'-'listing_status_label'-'listing_archived'-'listing_archive_until'-'listing_lifecycle_version'
    from public.ig_public_content where id=cid),'Availability edit leaked draft body or image';
  assert exists(select 1 from public.ig_public_tags where content_id=cid and term_id=approved_tag)
    and not exists(select 1 from public.ig_public_tags where content_id=cid and term_id=draft_tag),'Availability edit published draft tags';
  assert (select version=content_version and body='Unapproved changed body' from public.ig_content where id=cid),'Availability edit changed draft';
  assert not exists(select 1 from public.ig_live_listing_features() where id=campaign),'Reserved remained featured';
  assert not original.slug=any(public.ig_room_listing_slugs()),'Reserved room was offered to new visitors';
  assert exists(select 1 from public.ig_data_rooms where id=room_id and active),'Lifecycle altered data room';
  assert ig_private.admin_room_grant_active(grant_id),'Reserved property lost existing private grant';

  -- Both public NDA paths reject new requests for a closed/reserved listing.
  perform set_config('request.jwt.claims',buyer_claims,true);
  blocked:=false;begin perform public.ig_nda_action(jsonb_build_object('action','request','slug',original.slug,'purpose','Review this property'));
    exception when raise_exception then blocked:=true;end;assert blocked,'Legacy NDA accepted reserved listing';
  blocked:=false;begin perform public.ig_project_signature(jsonb_build_object('action','request','slug',original.slug,'purpose','Review this property'));
    exception when raise_exception then blocked:=true;end;assert blocked,'Project NDA accepted reserved listing';
  perform set_config('request.jwt.claims',owner_claims,true);
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',1,'status','sold'));
    exception when serialization_failure then blocked:=true;end;assert blocked,'Stale lifecycle version accepted';
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'status','magic'));
    exception when raise_exception then blocked:=true;end;assert blocked,'Unknown lifecycle state accepted';
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'label',repeat('x',51)));
    exception when raise_exception then blocked:=true;end;assert blocked,'Oversized display label accepted';

  -- Timed archive keeps the last public snapshot, then expires without a cron write.
  result:=public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','archive','lifecycle_version',lifecycle,'status','sold','label','Successfully placed','archive_until',deadline));
  lifecycle:=(result->>'listing_lifecycle_version')::integer;
  assert (result->>'listing_archived')::boolean and (result->>'public_visible')::boolean;
  assert (select status='archived' and archive_until=deadline from public.ig_content where id=cid);
  assert (select body=original.body and public_data->>'listing_status'='sold' and (public_data->>'listing_archived')::boolean
    from public.ig_public_content where id=cid),'Timed archive changed approved content';
  assert ig_private.admin_room_grant_active(grant_id),'Archive revoked existing administrator authority';
  perform set_config('request.jwt.claims',buyer_claims,true);
  assert ig_private.grant_valid(grant_id) and ig_private.room_access(room_id),'Existing client lost archived property room access';
  assert public.ig_client_login_eligible(secret,'buyer@example.invalid'),'Archive disabled client login eligibility';
  perform set_config('request.jwt.claims',owner_claims,true);
  execute 'set local role anon';
  select count(*) into n from public.ig_public_content where id=cid;assert n=1,'Unexpired archive was hidden';
  select count(*) into n from public.ig_public_tags where content_id=cid;assert n=1,'Unexpired archive tags unavailable';
  execute 'reset role';

  -- Saving the editor must not re-open the archive or overwrite dedicated fields.
  draft:=public.ig_save_content(draft||jsonb_build_object('listing_status','available','listing_archived',false,'archive_until',null));
  assert (select listing_status='sold' and listing_archived and archive_until=deadline from public.ig_content where id=cid),'Generic save spoofed lifecycle columns';
  assert (select body=original.body from public.ig_public_content where id=cid),'Draft save replaced archived snapshot';
  result:=public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','archive','lifecycle_version',lifecycle,'archive_until',deadline));
  lifecycle:=(result->>'listing_lifecycle_version')::integer;
  result:=public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'archive_until',deadline+interval '1 day'));
  lifecycle:=(result->>'listing_lifecycle_version')::integer;
  assert (select status='archived' and archive_until=deadline+interval '1 day' from public.ig_content where id=cid),'Archive window not extended';
  assert ig_private.admin_room_grant_active(grant_id),'Extending archived display revoked room authority';
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'archive_until',past));
    exception when raise_exception then blocked:=true;end;assert blocked,'Past archive deadline accepted';
  assert not ig_private.listing_public_visible('opportunity',jsonb_build_object('listing_archived',true,'listing_archive_until',now())),'Expiry boundary was inclusive';
  assert not ig_private.listing_public_visible('opportunity','{"listing_archived":true,"listing_archive_until":"not-a-date"}');
  assert not ig_private.listing_public_visible('opportunity','{"listing_archived":true,"listing_archive_until":"infinity"}');

  update public.ig_content set archive_until=past where id=cid;
  perform ig_private.sync_listing_lifecycle(cid);
  execute 'set local role anon';
  select count(*) into n from public.ig_public_content where id=cid;assert n=0,'Expired archive leaked through REST/RLS';
  select count(*) into n from public.ig_public_tags where content_id=cid;assert n=0,'Expired archive tags leaked';
  execute 'reset role';
  execute 'set local role authenticated';
  select count(*) into n from public.ig_public_content where id=cid;assert n=0,'Expired archive leaked to authenticated public readers';
  execute 'reset role';
  perform set_config('request.jwt.claims',buyer_claims,true);
  assert ig_private.grant_valid(grant_id) and ig_private.room_access(room_id),'Public display expiry revoked private room authority';
  update public.ig_room_grants set active=false where id=grant_id;
  assert not ig_private.grant_valid(grant_id),'Listing archive bypassed explicit grant revocation';
  update public.ig_room_grants set active=true,expires_at=past where id=grant_id;
  assert not ig_private.grant_valid(grant_id),'Listing archive bypassed grant expiry';
  update public.ig_room_grants set expires_at=now()+interval '30 days' where id=grant_id;
  update public.ig_data_rooms set active=false where id=room_id;
  assert not ig_private.grant_valid(grant_id),'Listing archive bypassed disabled room';
  update public.ig_data_rooms set active=true where id=room_id;
  blocked:=false;begin perform public.ig_customer_shortlist(jsonb_build_object('action','add','id',cid));
    exception when raise_exception then blocked:=true;end;assert blocked,'Expired archive could be newly shortlisted';
  perform set_config('request.jwt.claims',owner_claims,true);
  result:=public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','restore','lifecycle_version',lifecycle));
  lifecycle:=(result->>'listing_lifecycle_version')::integer;
  assert not (result->>'public_visible')::boolean and not exists(select 1 from public.ig_public_content where id=cid),'Restore silently republished archive';
  assert (select status='draft' and not listing_archived from public.ig_content where id=cid),'Restore did not create private draft';
  assert ig_private.admin_room_grant_active(grant_id),'Restore changed existing room authority';
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','archive','lifecycle_version',lifecycle,'archive_until',deadline));
    exception when raise_exception then blocked:=true;end;assert blocked,'Missing public snapshot was recreated';

  -- Normal publication and existing bulk archive remain explicit and reversible.
  perform public.ig_content_action(jsonb_build_object('action','publish','id',cid,'version',draft->'version',
    'factsConfirmed',true,'rightsConfirmed',true,'privacyConfirmed',true));
  assert (select body='Unapproved changed body' and public_data->>'listing_status'='sold' from public.ig_public_content where id=cid),'Explicit publication lost lifecycle';
  result:=public.ig_bulk_publication(jsonb_build_object('action','archive','rows',jsonb_build_array(jsonb_build_object('id',cid,'version',draft->'version'))));
  assert result->0->>'ok'='true' and not exists(select 1 from public.ig_public_content where id=cid),'Bulk archive did not hide immediately';
  assert ig_private.admin_room_grant_active(grant_id),'Immediate archive revoked room authority';
  select listing_lifecycle_version into lifecycle from public.ig_content where id=cid;
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'archive_until',deadline));
    exception when raise_exception then blocked:=true;end;assert blocked,'Date edit silently republished immediately archived listing';
  assert exists(select 1 from public.ig_audit where entity_id=cid::text and action='listing.lifecycle.archive'),'Archive audit missing';

  -- An archive that pre-dates the new workflow stays blocked; changing its label
  -- cannot silently reactivate a historically denied private grant.
  insert into public.ig_content(kind,slug,title,status,practice,listing_archived)
    values('opportunity','fixture-legacy-archive','Legacy archive','archived','real-estate',true) returning id into pid;
  insert into public.ig_data_rooms(content_id,title) values(pid,'Legacy room') returning id into old_room;
  insert into public.ig_room_grants(room_id,access_basis,recipient_email,recipient_name,authorisation_reason,authorised_by,authorised_at,expires_at)
    values(old_room,'admin_authorised','buyer@example.invalid','Existing client','Authorised confidential evaluation',owner_id,now(),now()+interval '30 days') returning id into old_grant;
  assert not ig_private.admin_room_grant_active(old_grant),'Legacy archive grant was reactivated';
  perform public.ig_listing_lifecycle(jsonb_build_object('id',pid,'action','save','lifecycle_version',1,'status','sold','label','Previous transaction'));
  assert not ig_private.admin_room_grant_active(old_grant),'Legacy archive label edit reactivated a grant';

  -- A write-only editor and a publisher for another practice cannot update availability.
  insert into auth.users(email,email_confirmed_at) values('lifecycle-editor@example.invalid',now()) returning id into staff;
  insert into auth.sessions(user_id) values(staff) returning id into staff_session;
  update public.ig_profiles set roles=array['editor'],practice_grants='{"real-estate":["read","write"]}',
    must_change_password=false,policy_version=ig_private.current_policy() where id=staff;
  insert into public.ig_consents(user_id,purpose,granted,version,policy_hash)
    select staff,'registration',true,version,sha256 from public.ig_policy_releases where current;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'session_id',staff_session,'role','authenticated','aal','aal2')::text,true);
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'status','available'));
    exception when insufficient_privilege then blocked:=true;end;assert blocked,'Write-only editor changed live availability';
  update public.ig_profiles set roles=array['publisher'],practice_grants='{"horeca":["read","write","publish"]}' where id=staff;
  blocked:=false;begin perform public.ig_listing_lifecycle(jsonb_build_object('id',cid,'action','save','lifecycle_version',lifecycle,'status','available'));
    exception when insufficient_privilege then blocked:=true;end;assert blocked,'Different-practice publisher changed availability';
end $$;
rollback;
