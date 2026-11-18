begin;
do $$
declare owner_claims text;buyer_claims text;buyer uuid;owner_id uuid;item uuid;hidden uuid;result jsonb;blocked boolean;
begin
 select u.id,jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text into owner_id,owner_claims from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid' limit 1;
 select u.id,jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text into buyer,buyer_claims from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid' limit 1;
 update public.ig_profiles set policy_version=ig_private.current_policy() where id=buyer;
 insert into public.ig_consents(user_id,purpose,granted,version,policy_hash) select buyer,'registration',true,version,sha256 from public.ig_policy_releases where current;
 insert into public.ig_content(kind,slug,title,status,created_by,updated_by) values('opportunity','fixture-experience-public','Fixture property','published',owner_id,owner_id) returning id into item;
 insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version) select id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version from public.ig_content where id=item;
 insert into public.ig_content(kind,slug,title,created_by,updated_by) values('opportunity','fixture-experience-private','Private draft',owner_id,owner_id) returning id into hidden;
 perform set_config('request.jwt.claims',buyer_claims,true);
 result=public.ig_customer_shortlist(jsonb_build_object('action','add','id',item));assert result @> to_jsonb(array[item]);
 result=public.ig_customer_shortlist(jsonb_build_object('action','merge','ids',jsonb_build_array(item,item)));assert jsonb_array_length(result)=1,'Duplicate save created another row';
 blocked=false;begin perform public.ig_customer_shortlist(jsonb_build_object('action','add','id',hidden));exception when others then blocked=true;end;assert blocked,'Draft could be saved';
 perform set_config('request.jwt.claims',owner_claims,true);assert public.ig_customer_shortlist('{"action":"list"}')='[]','Another account read the buyer shortlist';
 perform public.ig_customer_shortlist(jsonb_build_object('action','remove','id',item));assert exists(select from public.ig_saved_listings where user_id=buyer and content_id=item),'Cross-account removal';
 insert into public.ig_enquiries(name,email,practice,message) values('Buyer','buyer@example.invalid','Real Estate Advisory','Customer-visible message'),('Other','other@example.invalid','Private interest','Other message');
 perform set_config('request.jwt.claims',buyer_claims,true);result=public.ig_customer_enquiries();assert result::text like '%Customer-visible message%' and result::text not like '%Other message%','Enquiry ownership failed';
 update auth.users set email_confirmed_at=null where id=buyer;blocked=false;begin result=public.ig_customer_enquiries();assert result='[]';exception when others then blocked=true;end;
 update auth.users set email_confirmed_at=now() where id=buyer;
 perform set_config('request.jwt.claims','{}',true);blocked=false;begin perform public.ig_customer_shortlist('{"action":"list"}');exception when others then blocked=true;end;assert blocked,'Anonymous read succeeded';
 blocked=false;begin update public.ig_content set public_data='{"availability_verified_at":"2099-01-01"}' where id=item;exception when others then blocked=true;end;assert blocked,'Future availability verification accepted';
end $$;
rollback;
