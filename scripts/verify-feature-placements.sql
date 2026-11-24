begin;
do $$
declare owner_claims text; buyer_claims text; a public.ig_public_content; b public.ig_public_content; payload jsonb; campaign uuid; event_payload jsonb; report jsonb;
  blocked boolean; api_secret text:=repeat('sample-secret-',5);
begin
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text into owner_claims from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid';
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text into buyer_claims from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid';
 select * into strict a from public.ig_public_content where kind='opportunity' order by slug limit 1;
 select * into strict b from public.ig_public_content where kind='opportunity' and id<>a.id order by slug limit 1;
 update public.ig_public_content set public_data=public_data-'reference'-'availability' where id in (a.id,b.id);
 perform set_config('request.jwt.claims',buyer_claims,true);
 payload=jsonb_build_object('content_id',a.id,'action','save','slot',1,'ends_at',now()+interval '14 days');
 blocked=false;begin perform public.ig_manage_listing_feature(payload);exception when insufficient_privilege then blocked=true;end;assert blocked;
 perform set_config('request.jwt.claims',owner_claims,true);
 campaign=(public.ig_manage_listing_feature(payload||jsonb_build_object('headline',left(a.title,20)))->>'id')::uuid;
 assert exists(select 1 from public.ig_live_listing_features() where id=campaign);
 blocked=false;begin perform public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',b.id));exception when raise_exception then blocked=true;end;assert blocked,'Competing slot accepted';
 perform public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',b.id,'slot',2,'starts_at',now()+interval '1 day'));
 assert not exists(select 1 from public.ig_live_listing_features() where content_id=b.id),'Scheduled campaign leaked';
 update ig_private.ingest_config set secret_hash=encode(extensions.digest(api_secret,'sha256'),'hex');
 event_payload=jsonb_build_object('campaign_id',campaign,'event','impression','rate_key',repeat('1',64),'idempotency_key',gen_random_uuid());
 perform public.ig_record_listing_feature_event(api_secret,event_payload);
 perform public.ig_record_listing_feature_event(api_secret,event_payload);
 report=public.ig_manage_listing_feature(jsonb_build_object('content_id',a.id,'action','report'));
 assert (report->0->>'impressions')::integer=1,'Retry miscounted';
 update ig_private.listing_features set starts_at=now()-interval '1 day',deadline=now()-interval '1 minute' where id=campaign;
 assert not exists(select 1 from public.ig_live_listing_features() where id=campaign),'Verified deadline ignored';
 update ig_private.listing_features set deadline=null where id=campaign;
 perform public.ig_listing_lifecycle(jsonb_build_object('id',a.id,'action','save','status','withdrawn',
   'lifecycle_version',(select listing_lifecycle_version from public.ig_content where id=a.id)));
 perform public.ig_listing_lifecycle(jsonb_build_object('id',a.id,'action','save','status','available',
   'lifecycle_version',(select listing_lifecycle_version from public.ig_content where id=a.id)));
 assert not exists(select 1 from public.ig_live_listing_features() where id=campaign),'Withdrawn campaign revived';
 delete from public.ig_public_content where id=b.id;
 assert (select stopped_at is not null from ig_private.listing_features where content_id=b.id),'Unpublication did not stop campaign';
end $$;
rollback;
