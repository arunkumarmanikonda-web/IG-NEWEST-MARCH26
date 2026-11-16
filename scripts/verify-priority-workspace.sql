begin;
do $$
declare staff text; guest text; a uuid; b uuid; other uuid; r uuid; property uuid; details jsonb; first_campaign uuid; second_campaign uuid; future_campaign uuid; payload jsonb; pair jsonb; blocked boolean;
begin
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text into strict staff from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid';
 select jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text into strict guest from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid';
 insert into public.ig_content(kind,slug,title,practice,public_data)
   select 'product','priority-fixture-'||i,'Priority fixture '||lpad(i::text,2,'0'),'horeca',jsonb_build_object('image','/images/catalogue/ariane/agnarn000103026-hd.webp','sku','QA-SKU-'||i,'brand','Fixture Brand','category','Testing') from generate_series(1,28) i;
 insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version)
   select id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version from public.ig_content where slug like 'priority-fixture-%';
 select id into a from public.ig_content where slug='priority-fixture-1';
 select id into b from public.ig_content where slug='priority-fixture-2';
 select id into other from public.ig_content where slug='priority-fixture-3';
 select id into property from public.ig_public_content where kind='opportunity' order by slug limit 1;
 update public.ig_public_content set public_data=public_data-'reference'-'availability' where id=property;
 payload=jsonb_build_object('action','save','content_id',a,'slot',1,'ends_at',now()+interval '7 days');
 perform set_config('request.jwt.claims',guest,true);
 blocked=false; begin perform public.ig_priority_workspace('{"kind":"product"}'); exception when insufficient_privilege then blocked=true; end; assert blocked;
 blocked=false; begin perform public.ig_manage_product_priority(payload); exception when insufficient_privilege then blocked=true; end; assert blocked;
 perform set_config('request.jwt.claims',staff,true);
 details=public.ig_priority_workspace('{"kind":"product","q":"Fixture Brand"}');
 assert (details->>'can_manage')::bool and (details->>'has_more')::bool and jsonb_array_length(details->'items')=24;
 details=public.ig_priority_workspace(jsonb_build_object('kind','product','q','Fixture Brand','offset',24,'record',a));
 assert not (details->>'has_more')::bool and jsonb_array_length(details->'items')=4 and (details#>>'{selected,id}')::uuid=a;
 assert jsonb_array_length(public.ig_priority_workspace('{"kind":"product","q":"QA-SKU-28"}')->'items')=1;
 first_campaign=(public.ig_manage_product_priority(payload)->>'id')::uuid;
 r=(public.ig_manage_listing_feature(payload||jsonb_build_object('content_id',property))->>'id')::uuid;
 assert exists(select 1 from public.ig_live_listing_features() where id=r) and not exists(select 1 from public.ig_live_listing_features() where id=first_campaign);
 assert exists(select 1 from public.ig_live_product_priorities() where content_id=a and slot=1);
 second_campaign=(public.ig_manage_product_priority(payload||jsonb_build_object('content_id',b,'slot',2,'ends_at',now()+interval '14 days'))->>'id')::uuid;
 pair=jsonb_build_object('kind','product','first_id',first_campaign,'first_version',1,'second_id',second_campaign,'second_version',1);
 future_campaign=(public.ig_manage_product_priority(payload||jsonb_build_object('content_id',other,'starts_at',now()+interval '8 days','ends_at',now()+interval '9 days'))->>'id')::uuid;
 blocked=false; begin perform public.ig_swap_priority_positions(pair); exception when raise_exception then blocked=true; end; assert blocked,'Future overlap accepted';
 perform public.ig_manage_product_priority(jsonb_build_object('content_id',other,'id',future_campaign,'version',1,'action','stop'));
 perform public.ig_swap_priority_positions(pair);
 assert exists(select 1 from public.ig_live_product_priorities() where content_id=b and slot=1) and exists(select 1 from public.ig_live_product_priorities() where content_id=a and slot=2);
 blocked=false; begin perform public.ig_swap_priority_positions(pair); exception when raise_exception then blocked=true; end; assert blocked,'Stale swap accepted';
 blocked=false; begin perform public.ig_manage_product_priority(payload||jsonb_build_object('content_id',property)); exception when insufficient_privilege then blocked=true; end; assert blocked;
 update public.ig_public_content set public_data=public_data||'{"availability":"Discontinued"}' where id=a;
 assert not exists(select 1 from public.ig_live_product_priorities() where content_id=a);
 update public.ig_public_content set public_data=public_data-'availability' where id=a;
 assert not exists(select 1 from public.ig_live_product_priorities() where content_id=a);
 delete from public.ig_public_content where id=b;
 assert (select stopped_at is not null from ig_private.listing_features where id=second_campaign);
 assert jsonb_array_length(public.ig_priority_workspace('{"kind":"product"}')->'placements')=0;
end $$;
rollback;
