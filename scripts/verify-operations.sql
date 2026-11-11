begin;
create temp table checks(name text,passed boolean);
create function pg_temp.ok(v boolean,n text) returns void language plpgsql as $$begin if v is distinct from true then raise exception 'FAIL: %',n;end if;insert into checks values(n,true);end$$;
create function pg_temp.fails(p jsonb,operation boolean,n text) returns void language plpgsql as $$begin begin if operation then perform public.ig_ops_action(p);else perform public.ig_ops_save(p);end if;exception when others then insert into checks values(n,true);return;end;raise exception 'FAIL: %',n;end$$;
create function pg_temp.payload(k text,pr text,t text,st text,d jsonb,parent uuid default null) returns jsonb language sql as $$select jsonb_build_object('request_id',gen_random_uuid(),'kind',k,'practice',pr,'title',t,'status',st,'data',d,'parent_id',parent)$$;
do $$declare uid uuid;sid uuid;claims jsonb;v jsonb;r jsonb;q jsonb;o jsonb;p jsonb;b jsonb;change jsonb;task jsonb;payload jsonb;line jsonb='[{"line_id":"L1","sku":"IG-TEST","description":"Test product","quantity":10,"uom":"nos","unit_rate":100,"gst_pct":18}]';begin
 select u.id,s.id into uid,sid from auth.users u join auth.sessions s on s.user_id=u.id where u.email='akm@indiagully.com' order by s.created_at desc limit 1;
 if sid is null then raise exception 'Owner session required';end if;claims=jsonb_build_object('sub',uid,'session_id',sid,'aal','aal2','role','authenticated');perform set_config('request.jwt.claims',claims::text,true);
 v=public.ig_ops_save(pg_temp.payload('vendor','horeca','SYSTEM TEST vendor','active','{"company":"Test supplier"}'));
 payload=pg_temp.payload('rfq','horeca','SYSTEM TEST RFQ','open',jsonb_build_object('reference','SYSTEM-TEST-RFQ','destination','Test destination','lines',line));r=public.ig_ops_save(payload);
 perform pg_temp.ok(public.ig_ops_save(payload)->>'id'=r->>'id','Repeated RFQ create is idempotent');
 perform pg_temp.fails(payload||jsonb_build_object('title','Changed payload'),false,'Idempotency reference cannot change title');
 perform pg_temp.fails(pg_temp.payload('rfq','hospitality','Wrong practice','open',payload->'data'),false,'HORECA cannot be written to another practice');
 payload=pg_temp.payload('quote','horeca','SYSTEM TEST quote','submitted',jsonb_build_object('vendor_id',v->>'id','reference','TEST-Q','valid_until','2099-01-01','freight',100,'discount',0,'lines',line),(r->>'id')::uuid);q=public.ig_ops_save(payload);
 perform pg_temp.fails(jsonb_set(payload,'{data,lines,0,quantity}','11')||jsonb_build_object('request_id',gen_random_uuid()),false,'Quote quantities must match RFQ');
 perform pg_temp.fails(jsonb_set(payload,'{data,lines,0,unit_rate}','-1')||jsonb_build_object('request_id',gen_random_uuid()),false,'Negative quotation rate rejected');
 o=public.ig_ops_action(jsonb_build_object('id',q->>'id','version',1,'action','award','reviewed',true,'reason','Verified test vendor and price','reference','SYSTEM-TEST-PO','request_id',gen_random_uuid()));
 perform pg_temp.ok(o->>'status'='ordered' and o->'data'->>'vendor_name'='SYSTEM TEST vendor','Award snapshots vendor and quotation');
 perform pg_temp.fails(jsonb_build_object('id',q->>'id','version',1,'action','award','reviewed',true,'reason','Duplicate award blocked','reference','TEST-2','request_id',gen_random_uuid()),true,'Duplicate RFQ award rejected');
 perform pg_temp.fails(payload||jsonb_build_object('id',q->>'id','version',1),false,'Awarded quotation cannot be edited');
 perform pg_temp.fails(jsonb_build_object('id',o->>'id','version',1,'action','delivered','reference','Test acknowledgement'),true,'Order cannot be delivered before dispatch');
 payload=pg_temp.payload('movement','horeca','SYSTEM TEST receipt','posted',jsonb_build_object('direction','receipt','reference','TEST-GRN','date',(now() at time zone 'Asia/Kolkata')::date,'lines','[{"line_id":"L1","quantity":10}]'::jsonb),(o->>'id')::uuid);perform public.ig_ops_save(payload);
 perform pg_temp.fails(payload||jsonb_build_object('request_id',gen_random_uuid()),false,'Over receipt rejected');
 perform pg_temp.fails(jsonb_set(jsonb_set(payload,'{data,direction}','"dispatch"'),'{data,lines,0,quantity}','11')||jsonb_build_object('request_id',gen_random_uuid()),false,'Dispatch cannot exceed stock');
 perform public.ig_ops_save(jsonb_set(payload,'{data,direction}','"dispatch"')||jsonb_build_object('request_id',gen_random_uuid()));
 select to_jsonb(x) into o from public.ig_operations x where id=(o->>'id')::uuid;
 perform public.ig_ops_action(jsonb_build_object('id',o->>'id','version',o->>'version','action','delivered','reference','TEST-POD'));
 perform pg_temp.ok(exists(select 1 from public.ig_operations where id=(o->>'id')::uuid and status='delivered'),'Complete receipt-dispatch-delivery workflow');
 p=public.ig_ops_save(pg_temp.payload('pmc_project','hospitality','SYSTEM TEST PMC','active','{"reference":"SYSTEM-TEST-PMC","scope":"Test project scope","start_date":"2026-11-01","end_date":"2027-01-01"}'));
 payload=pg_temp.payload('pmc_budget','hospitality','SYSTEM TEST budget','approved','{"code":"C01","baseline":100000,"committed":20000,"actual":10000,"forecast":105000}',(p->>'id')::uuid);b=public.ig_ops_save(payload);
 perform pg_temp.fails(jsonb_set(payload,'{data,baseline}','200000')||jsonb_build_object('id',b->>'id','version',1),false,'Approved baseline is immutable');
 payload=pg_temp.payload('pmc_variation','hospitality','SYSTEM TEST change','approved',jsonb_build_object('reference','VAR-01','budget_id',b->>'id','amount',5000,'reason','Test change reason','decision','Test approval record'),(p->>'id')::uuid);
 perform pg_temp.fails(payload,false,'Variation cannot bypass submission');
 change=public.ig_ops_save(payload||'{"status":"submitted"}'::jsonb);
 change=public.ig_ops_save(payload||jsonb_build_object('id',change->>'id','version',1));
 perform pg_temp.ok(change->>'status'='approved','Submitted variation can be approved with evidence');
 perform pg_temp.fails(payload||jsonb_build_object('id',change->>'id','version',2),false,'Approved variation cannot be changed');
 payload=pg_temp.payload('pmc_task','hospitality','SYSTEM TEST task','active','{"wbs":"1.1","weight":1,"start_date":"2026-11-01","end_date":"2026-11-30"}',(p->>'id')::uuid);task=public.ig_ops_save(payload);
 perform pg_temp.fails(payload||jsonb_build_object('id',task->>'id','version',1,'status','complete'),false,'Task completion needs measured progress');
 perform public.ig_ops_save(pg_temp.payload('pmc_progress','hospitality','SYSTEM TEST progress','recorded',jsonb_build_object('task_id',task->>'id','report_date','2026-11-11','percent',100,'evidence','Test inspection record'),(p->>'id')::uuid));
 task=public.ig_ops_save(payload||jsonb_build_object('id',task->>'id','version',1,'status','complete'));
 perform pg_temp.ok(task->>'status'='complete','Measured progress supports completion');
 perform pg_temp.fails(pg_temp.payload('pmc_rfi','hospitality','SYSTEM TEST RFI','closed','{"reference":"RFI1","owner":"Test","question":"What is approved?"}',(p->>'id')::uuid),false,'RFI closure requires an answer');
 perform pg_temp.fails(payload||jsonb_build_object('id',task->>'id','version',1),false,'Stale writes rejected');
 perform pg_temp.ok(exists(select 1 from public.ig_operation_revisions where record_id=(task->>'id')::uuid and version=2),'Operational revisions preserve prior and current snapshots');
 perform pg_temp.fails(jsonb_set(payload,'{data,freight}','0.001')||jsonb_build_object('kind','quote','practice','horeca','request_id',gen_random_uuid()),false,'Invalid quotation input remains blocked');
 perform pg_temp.ok((public.ig_catalogue_import('{"rows":[{"sku":"SYSTEM-TEST-SKU","title":"System test product","uom":"nos"}]}')->>'created')::int=1,'Catalogue CSV-equivalent import creates SKU draft');
 begin
  perform public.ig_catalogue_import('{"rows":[{"sku":"SYSTEM-TEST-NEW","title":"Atomic test product"},{"sku":"SYSTEM-TEST-SKU","title":"Duplicate SKU"}]}');
  raise exception 'Catalogue duplicate was accepted';
 exception when unique_violation then
  perform pg_temp.ok(not exists(select 1 from public.ig_content where public_data->>'sku'='SYSTEM-TEST-NEW'),'Duplicate SKU rolls back entire batch');
 end;
 begin
  perform public.ig_save_content('{"kind":"opportunity","practice":"real-estate","slug":"system-test-coordinates","title":"System test coordinates","public_data":{"latitude":"28.61","longitude":"77.20"}}');
  raise exception 'Coordinates without review accepted';
 exception when raise_exception then
  if sqlerrm='Coordinates without review accepted' then raise;end if;
  perform pg_temp.ok(sqlerrm like '%Verify coordinates%','Coordinates require review and source');
 end;
 begin
  perform public.ig_save_content('{"kind":"opportunity","practice":"real-estate","slug":"system-test-confidential-coordinates","title":"System test confidential","public_data":{"latitude":"28.61","longitude":"77.20","location_reviewed":true,"location_source":"Owner supplied map","confidential":true}}');
  raise exception 'Confidential coordinates accepted';
 exception when raise_exception then
  if sqlerrm='Confidential coordinates accepted' then raise;end if;
  perform pg_temp.ok(sqlerrm like '%confidential%','Confidential opportunities cannot expose coordinates');
 end;
 change=public.ig_source_media_manage('{"action":"prepare","practice":"real-estate","source_name":"test.jpg","rights_reference":"Test rights only","alt":"Test photograph","preset":"landscape"}');
 perform pg_temp.ok(public.ig_public_media_path((change->>'id')::uuid) is null,'Unreleased source media has no public path');
 begin
  perform public.ig_source_media_manage(jsonb_build_object('id',change->>'id','action','publish','reviewed',true));
  raise exception 'Unuploaded media accepted';
 exception when raise_exception then
  if sqlerrm='Unuploaded media accepted' then raise;end if;
  perform pg_temp.ok(sqlerrm like '%ready media%','Unuploaded source media cannot be published');
 end;
 perform set_config('request.jwt.claims',(claims||'{"aal":"aal1"}')::text,true);
 perform pg_temp.fails(pg_temp.payload('vendor','horeca','Forbidden','active','{"company":"Test"}'),false,'Operational writes require MFA');
 perform set_config('request.jwt.claims',claims::text,true);
 update public.ig_profiles set roles=array['procurement_manager'],practice_grants='{"horeca":["read","commerce"]}' where id=uid;
 perform pg_temp.fails(pg_temp.payload('pmc_project','hospitality','Forbidden PMC','planning','{"reference":"FORBIDDEN","scope":"Test"}'),false,'Cross-practice writes rejected');
 perform pg_temp.ok(not has_table_privilege('anon','public.ig_operations','select'),'Anonymous cannot read operational records');
 perform pg_temp.ok(not has_table_privilege('authenticated','public.ig_operations','insert'),'Direct table writes denied');
end$$;
select * from checks;
rollback;
