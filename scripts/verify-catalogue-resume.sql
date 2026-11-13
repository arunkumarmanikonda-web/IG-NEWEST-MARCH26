-- Rollback-only: no real products remain and no email or payment is sent.
begin;
create temp table csv_checks(label text) on commit drop;
create function pg_temp.check_csv(ok boolean,label text) returns void language plpgsql as $$begin if not coalesce(ok,false) then raise exception 'Failed: %',label;end if;insert into csv_checks values(label);end$$;
do $$
declare owner_id uuid;session_id uuid;p jsonb;r jsonb;before_count bigint;after_count bigint;denied boolean;sku text='ROLLBACK-'||replace(gen_random_uuid()::text,'-','');batch text=encode(extensions.digest(gen_random_uuid()::text,'sha256'),'hex');
begin
 select id into owner_id from auth.users where email='akm@indiagully.com';
 select id into session_id from auth.sessions where user_id=owner_id order by created_at desc limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',session_id,'aal','aal2','role','authenticated')::text,true);
 select count(*) into before_count from public.ig_content where kind='product';
 p=jsonb_build_object('batch_key',batch||':0','rows',jsonb_build_array(jsonb_build_object('title','Rollback custom SKU product','sku',sku),jsonb_build_object('title','Rollback automatic SKU product','brand','Test')));
 r=public.ig_catalogue_import(p);
 perform pg_temp.check_csv((r->>'created')::int=2,'Two draft products created');
 select count(*) into after_count from public.ig_content where kind='product';
 perform pg_temp.check_csv(after_count=before_count+2,'Exactly two records added');
 perform pg_temp.check_csv(exists(select 1 from public.ig_content where kind='product' and public_data->>'sku'=sku and status='draft'),'Manual SKU preserved in draft');
 perform pg_temp.check_csv(exists(select 1 from public.ig_content where title='Rollback automatic SKU product' and nullif(public_data->>'sku','') is not null and status='draft'),'Automatic SKU generated in draft');
 r=public.ig_catalogue_import(p);
 perform pg_temp.check_csv((r->>'recovered')::boolean and (r->>'created')::int=2,'Lost response replay recovers result');
 perform pg_temp.check_csv((select count(*) from public.ig_content where kind='product')=after_count,'Replay creates no duplicate products');
 denied=false;begin perform public.ig_catalogue_import(jsonb_set(p,'{rows,0,title}','"Changed product"'));exception when raise_exception then denied=true;end;
 perform pg_temp.check_csv(denied,'Changed payload cannot reuse batch reference');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',session_id,'aal','aal1','role','authenticated')::text,true);
 denied=false;begin perform public.ig_catalogue_import(p);exception when insufficient_privilege then denied=true;end;
 perform pg_temp.check_csv(denied,'MFA required even for recovered batches');
 perform set_config('request.jwt.claims','{}',true);
 denied=false;begin perform public.ig_catalogue_import(p);exception when insufficient_privilege then denied=true;end;
 perform pg_temp.check_csv(denied,'Anonymous imports rejected');
 perform pg_temp.check_csv(not has_table_privilege('authenticated','ig_private.catalogue_import_batches','SELECT'),'Batch journal cannot be read directly');
end $$;
select count(*) as passed,array_agg(label order by label) as checks from csv_checks;
rollback;
