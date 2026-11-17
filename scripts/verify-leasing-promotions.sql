-- Isolated workflow fixtures only: no production records or external delivery.
begin;
do $$
declare staff text; guest text; principal jsonb; person jsonb; w jsonb; item jsonb; k text;
 space uuid; requirement uuid; sale uuid; first uuid; second uuid; third uuid; payload jsonb; details jsonb; blocked boolean;
begin
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text into strict staff from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid';
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text into strict guest from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid';
 perform set_config('request.jwt.claims',staff,true);
 principal=public.ig_client_manage('{"action":"client_save","name":"Leasing promotion fixture","practice":"retail-leasing","stage":"engaged"}');
 person=public.ig_client_manage(jsonb_build_object('action','contact_save','client_id',principal->'id','name','Fixture contact','email','buyer@example.invalid','portal_enabled',true));
 foreach k in array array['retail_space','retail_requirement'] loop
   w=public.ig_content_intake(jsonb_build_object('action','begin','kind',k,'practice','retail-leasing','request_id',gen_random_uuid()));
   item=public.ig_save_content(jsonb_build_object('id',w->'content_id','version',w->'version','kind',k,'practice','retail-leasing','title','Leasing campaign '||k,'slug','leasing-campaign-'||replace(k,'_','-'),'summary','Approved leasing brief.','body','Test mandate with approved details.',
     'public_data',case when k='retail_space' then '{"city":"Gurugram","formats":"Office","units":[{"unit":"801","floor":"8","area":"4361 sq ft","basis":"Super area","zone":"Office","status":"Available"}]}'::jsonb else '{"markets":"Mumbai","brand":"Fixture café","formats":"Café","area_range":"1000 sq ft"}'::jsonb end));
   perform public.ig_retail_manage(jsonb_build_object('action','assign','content_id',w->'content_id','client_id',principal->'id','title','Fixture mandate','confirmed',true,'terms','Executed test mandate','contact_ids',jsonb_build_array(person->'id')));
   perform public.ig_content_action(jsonb_build_object('action','publish','id',item->'id','version',item->'version','factsConfirmed',true,'privacyConfirmed',true,'rightsConfirmed',true));
   if k='retail_space' then space=(item->>'id')::uuid; else requirement=(item->>'id')::uuid; end if;
 end loop;
 select id into strict sale from public.ig_public_content where kind='opportunity' order by slug limit 1;
 update public.ig_public_content set public_data=public_data-'reference'-'availability' where id=sale;
 payload=jsonb_build_object('action','save','slot',1,'ends_at',now()+interval '7 days');
 first=(public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',sale))->>'id')::uuid;
 blocked=false; begin perform public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',space)); exception when raise_exception then blocked=true; end; assert blocked,'Lease overlapped the sale slot';
 second=(public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',space,'slot',2))->>'id')::uuid;
 third=(public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',requirement,'slot',3,'starts_at',now()+interval '1 day'))->>'id')::uuid;
 assert exists(select 1 from public.ig_live_listing_features() where id=second);
 assert not exists(select 1 from public.ig_live_listing_features() where id=third),'Scheduled mandate displayed early';
 assert not exists(select 1 from public.ig_live_product_priorities() where id=second),'Mandate leaked into HORECA';
 details=public.ig_priority_workspace(jsonb_build_object('kind','opportunity','q','Gurugram','record',space));
 assert exists(select 1 from jsonb_array_elements(details->'items') i where i->>'kind'='retail_space');
 assert details#>>'{selected,kind}'='retail_space';
 assert jsonb_array_length(public.ig_priority_workspace('{"kind":"opportunity","q":"Fixture café"}')->'items')=1;
 perform public.ig_swap_priority_positions(jsonb_build_object('kind','opportunity','first_id',first,'first_version',1,'second_id',second,'second_version',1));
 assert exists(select 1 from public.ig_live_listing_features() where id=second and slot=1),'Cross-kind swap failed';
 assert ig_private.conversion_feature(second::text,'leasing-campaign-retail-space','Retail & Leasing')=second;
 assert ig_private.conversion_feature(second::text,'leasing-campaign-retail-requirement','Retail & Leasing') is null,'Unrelated attribution accepted';
 assert ig_private.conversion_feature(second::text,'leasing-campaign-retail-space','HORECA') is null,'Unrelated interest accepted';
 perform set_config('request.jwt.claims',guest,true);
 blocked=false; begin perform public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',space,'slot',3)); exception when insufficient_privilege then blocked=true; end; assert blocked,'Client scheduled a promotion';
 perform set_config('request.jwt.claims',staff,true);
 update public.ig_public_content set public_data=jsonb_set(public_data,'{units,0,status}','"Leased"') where id=space;
 assert not exists(select 1 from public.ig_live_listing_features() where id=second),'Fully leased mandate still promoted';
 assert (select stopped_at is not null from ig_private.listing_features where id=second);
 update public.ig_public_content set public_data=jsonb_set(public_data,'{units,0,status}','"Available"') where id=space;
 assert not exists(select 1 from public.ig_live_listing_features() where id=second),'Ended placement revived';
 delete from public.ig_public_content where id=requirement;
 assert (select stopped_at is not null from ig_private.listing_features where id=third),'Unpublished requirement kept its schedule';
end $$;
rollback;
