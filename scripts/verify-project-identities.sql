begin;
do $$
declare owner_id uuid; buyer uuid; own_jwt text; buyer_jwt text; ky jsonb; entity uuid; app record; other record;
 tmpl jsonb; other_t jsonb; request jsonb; signature jsonb; actual jsonb; ordinary jsonb; session_secret text=repeat('x',64); evidence text; blocked boolean; before_count int;
begin
 select u.id,jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal2')::text into owner_id,own_jwt from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid';
 select u.id,jsonb_build_object('sub',u.id,'session_id',s.id,'role','authenticated','aal','aal1')::text into buyer,buyer_jwt from auth.users u join auth.sessions s on s.user_id=u.id where u.email='buyer@example.invalid';
 update public.ig_profiles set policy_version=ig_private.current_policy() where id=buyer;
 insert into public.ig_consents(user_id,purpose,granted,version,policy_hash) select buyer,'registration',true,version,sha256 from public.ig_policy_releases where current;
 update ig_private.integration_root set secret_hash=encode(extensions.digest(convert_to(session_secret,'UTF8'),'sha256'),'hex');
 select * into app from public.ig_public_content where kind='opportunity' order by slug limit 1;
 insert into public.ig_content(kind,slug,title) values('project','identity-test-project','Synthetic Project') returning * into other;
 insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version)
 values(other.id,other.kind,other.slug,other.title,'','','','','{}',1);
 insert into public.ig_data_rooms(content_id,title) values(app.id,app.title),(other.id,other.title) on conflict(content_id) do update set active=true;
 assert app.slug=any(public.ig_room_listing_slugs());assert other.slug=any(public.ig_room_listing_slugs('project'));
 perform set_config('request.jwt.claims',own_jwt,true);
 tmpl=public.ig_nda_admin(jsonb_build_object('action','template_create','version','qa-room-a','title','Synthetic project A agreement','body',repeat('Example approved terms for the fixture. ',6),'content_id',app.id));
 perform public.ig_edit_project_nda(jsonb_build_object('id',tmpl->>'id','title',tmpl->>'title','body',tmpl->>'body','original_title',tmpl->>'title','original_body',tmpl->>'body'));
 other_t=public.ig_nda_admin(jsonb_build_object('action','template_create','version','qa-room-b','title','Synthetic project B agreement','body',repeat('Example text for independent project B. ',6),'content_id',other.id));
 perform public.ig_nda_admin(jsonb_build_object('action','template_publish','id',tmpl->>'id','legal_reviewed',true));
 perform public.ig_nda_admin(jsonb_build_object('action','template_publish','id',other_t->>'id','legal_reviewed',true));
 assert (select count(*) from public.ig_nda_templates where status='active' and content_id in (app.id,other.id))=2;
 perform set_config('request.jwt.claims',buyer_jwt,true);
 perform public.ig_project_signature(jsonb_build_object('action','request','kind','project','slug',other.slug,'purpose','Initial evaluation of this project'));
 ky=public.ig_client_identity('{"action":"create","kind":"company","legal_name":"Sample Hospitality Limited","vital_date":"2017-05-12","signer":"Example Signatory","cin":"U12345DL2017PLC123456","gstin":"07ABCDE1234F1Z5","consent":true}');
 entity=(ky->>'id')::uuid;
 perform public.ig_client_identity('{"action":"create","kind":"individual","legal_name":"Sample Person","vital_date":"1988-05-12","pan":"ABCDE1234F","id_method":"passport","consent":true}');
 assert jsonb_array_length(public.ig_client_identity('{"action":"list"}'))=2;
 assert not has_table_privilege('anon','public.ig_legal_entities','SELECT');
 assert not has_table_privilege('authenticated','public.ig_legal_entities','UPDATE');
 assert not ig_private.kyc_object(concat_ws('/',buyer,entity,1,'aadhaar_offline'),true);
 signature=jsonb_build_object('slug',app.slug,'template_id',tmpl->>'id','entity_id',entity,'purpose','Review a synthetic opportunity','accepted',true,'disclaimer',public.ig_project_disclaimer());
 blocked=false;begin perform public.ig_project_signature(signature);exception when others then blocked=true;end;assert blocked,'Unverified legal name accepted';
 foreach evidence in array array['incorporation','gst','resolution'] loop
   assert ig_private.kyc_object(concat_ws('/',buyer,entity,1,evidence),true);
   insert into storage.objects(bucket_id,name) values('client-kyc',concat_ws('/',buyer,entity,1,evidence));
   assert public.ig_kyc_check_result(session_secret,jsonb_build_object('id',entity,'revision',1,'slot',evidence,'result',jsonb_build_object('status',case when evidence='resolution' then 'review' else 'matched' end,'fields','{}'::jsonb)));
 end loop;
 perform public.ig_client_identity(jsonb_build_object('action','submit','id',entity,'revision',1));
 blocked=false;begin perform public.ig_client_identity(jsonb_build_object('action','verify','id',entity,'revision',1,'reviewed',true));exception when others then blocked=true;end;assert blocked,'Self approval accepted';
 perform set_config('request.jwt.claims',own_jwt,true);
 assert not ig_private.kyc_object(concat_ws('/',buyer,entity,1,'resolution'),false),'Unaudited staff read';
 assert public.ig_client_identity(jsonb_build_object('action','review_document','id',entity,'revision',1,'slot','resolution'))->>'path'=concat_ws('/',buyer,entity,1,'resolution');
 assert ig_private.kyc_object(concat_ws('/',buyer,entity,1,'resolution'),false),'Reviewed document unavailable';
 assert not ig_private.kyc_object(concat_ws('/',buyer,entity,1,'gst'),false),'Review authorisation leaked to another document';
 perform public.ig_client_identity(jsonb_build_object('action','verify','id',entity,'revision',1,'reviewed',true));
 assert not ig_private.kyc_object(concat_ws('/',buyer,entity,1,'resolution'),false),'Staff read outside pending review';
 blocked=false;begin perform public.ig_project_signature(signature);exception when others then blocked=true;end;assert blocked,'Different account could sign';
 perform set_config('request.jwt.claims',buyer_jwt,true);
 blocked=false;begin perform public.ig_project_signature(signature||jsonb_build_object('template_id',other_t->>'id'));exception when others then blocked=true;end;assert blocked,'Different project terms accepted';
 blocked=false;begin perform public.ig_project_signature(signature||'{"accepted":false}');exception when others then blocked=true;end;assert blocked,'Unchecked disclaimer was accepted';
 blocked=false;begin perform public.ig_project_signature(signature-'accepted');exception when others then blocked=true;end;assert blocked,'Missing acceptance was accepted';
 blocked=false;begin perform public.ig_project_signature(signature||'{"disclaimer":"previous wording"}');exception when others then blocked=true;end;assert blocked,'Stale disclaimer was accepted';
 select count(*) into before_count from public.ig_room_grants;
 request=public.ig_project_signature(signature);
 assert request->>'signed_name'='Example Signatory' and request->'agreement_snapshot'->>'method'='project-disclaimer-acceptance'
   and request->'agreement_snapshot'->>'disclaimer'=public.ig_project_disclaimer();
 assert request->>'status'='accepted' and request->'agreement_snapshot'->>'legal_name'='Sample Hospitality Limited';
 assert public.ig_project_signature(signature)->>'id'=request->>'id','Retry created another signature';
 actual=public.ig_project_signature(signature||jsonb_build_object('kind','project','slug',other.slug,'template_id',other_t->>'id'));
 assert actual->>'legal_entity_id'=request->>'legal_entity_id' and actual->'agreement_snapshot'->>'sha256'<>request->'agreement_snapshot'->>'sha256';
 assert (select count(*) from public.ig_room_grants)=before_count,'Signing granted access';
 ordinary=public.ig_procurement(jsonb_build_object('action','submit','request_id',gen_random_uuid(),'entity_id',entity,'title','Fixture RFQ','destination','Synthetic hotel site','lines','[{"description":"Test plate","quantity":1,"uom":"nos"}]'::jsonb));
 assert ordinary->>'legal_entity_id'=entity::text and ordinary->'requirement'->>'legal_name'='Sample Hospitality Limited','RFQ lost legal name';
 -- The same signed recipient cannot be emailed until staff approve the project-specific NDA.
 perform set_config('request.jwt.claims',own_jwt,true);
 select jsonb_build_object('action','share','room_id',r.id,'batch_id',gen_random_uuid(),'recipient_ids',jsonb_build_array(request->'id'),'download_mode','none','expires_at',now()+interval '20 days')
   into signature from public.ig_data_rooms r where r.content_id=app.id;
 assert signature is not null;
 blocked=false;begin perform public.ig_room_share(signature);exception when raise_exception then blocked=true;end;assert blocked;
 update public.ig_nda_requests set status='approved',reviewed_at=now() where id=(request->>'id')::uuid;
 ordinary=public.ig_room_share(signature);
 assert ordinary->>'queued'='1' and ordinary->>'added'='1','Approved NDA room not shared';
 assert ig_private.room_notice_eligible((signature->>'room_id')::uuid,null,(request->>'id')::uuid,'buyer@example.invalid');
 update public.ig_room_grants set active=false where nda_request_id=(request->>'id')::uuid;
 assert not ig_private.room_notice_eligible((signature->>'room_id')::uuid,null,(request->>'id')::uuid,'buyer@example.invalid'),'Revocation did not stop the queued NDA notice';
end $$;
rollback;
