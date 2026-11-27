do $$begin
 if not exists(select from ig_review_guard.installation where project_ref='ehcqhoxiwmydipwfujuf' and origin='https://india-gully-play-review.vercel.app') then raise exception 'Review project required';end if;
end$$;
insert into public.ig_content(kind,slug,title,summary,body,practice,status)
values('product','sample-lotus-service-tray','Lotus service tray','Sample stainless-steel service tray for the hotel dining room.','Oval service tray, brushed finish. Sample quotation unit is one tray.','horeca','draft')
on conflict(kind,slug) do nothing;
create table ig_review_guard.sample_links(
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 amount numeric(10,2) not null check(amount>0 and amount<=100000),
 purpose text not null check(length(purpose) between 1 and 100),
 created_at timestamptz not null default now()
);
create table ig_review_guard.sample_uploads(
 id uuid primary key references public.ig_room_files(id), purpose text not null check(purpose in ('document','image')),
 validated boolean not null default false, submitted_at timestamptz not null default now(),
 request_id uuid not null unique
);
revoke all on ig_review_guard.sample_links,ig_review_guard.sample_uploads from public,anon,authenticated,service_role;
create function public.ig_review_sample_workflows(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare op text:=p->>'action'; choice text:=p->>'item'; item public.ig_content;
 file public.ig_room_files; link ig_review_guard.sample_links; room public.ig_data_rooms;
 request_key uuid; total_bytes bigint; pdf_name text; result jsonb;
begin
 if public.ig_review_hospitality_workspace() is null then raise exception 'Assigned staff reviewer sign-in required' using errcode='42501';end if;
 select * into strict room from public.ig_data_rooms d where d.title='Sample hotel documents' and d.id='fbf63d2d-98a0-4ad7-be37-1dac19b5c341' and d.active;
 if op='overview' then
 return jsonb_build_object('items',(select jsonb_agg(jsonb_build_object('item',case when c.kind='opportunity' then 'listing' else 'catalogue' end,'title',c.title,'summary',c.summary,'version',c.version) order by c.kind) from public.ig_content c where (c.kind,c.slug,c.practice) in (('opportunity','sample-lotus-hotel','hospitality'),('product','sample-lotus-service-tray','horeca')) and c.status='draft'),
 'files',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'shared',f.status='ready','purpose',coalesce(u.purpose,'document')) order by f.created_at desc),'[]'::jsonb) from public.ig_room_files f left join ig_review_guard.sample_uploads u on u.id=f.id where f.room_id=room.id and (f.status='ready' or u.validated)),
 'links',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]'::jsonb) from (select id,amount,purpose,created_at from ig_review_guard.sample_links order by created_at desc limit 25)t));
 elsif op='edit' then
 if choice is null or choice not in ('listing','catalogue') or nullif(trim(p->>'title'),'') is null or length(p->>'title')>180 or length(coalesce(p->>'summary',''))>500 then raise exception 'Enter a title and a summary of up to 500 characters';end if;
 update public.ig_content c set title=trim(p->>'title'),summary=trim(coalesce(p->>'summary','')),version=version+1,updated_at=now(),updated_by=auth.uid()
 where (c.kind,c.slug,c.practice) in (('opportunity','sample-lotus-hotel','hospitality'),('product','sample-lotus-service-tray','horeca'))
 and c.kind=case choice when 'listing' then 'opportunity' else 'product' end and c.status='draft' and c.version=(p->>'version')::int returning * into item;
 if not found then raise exception 'Record changed. Reload before editing.' using errcode='40001';end if;
 return jsonb_build_object('version',item.version);
 elsif op='payment' then
 if nullif(trim(p->>'purpose'),'') is null or length(p->>'purpose')>100 or (p->>'amount')::numeric not between 0.01 and 100000 or nullif(p->>'amount','') is null or nullif(p->>'request','') is null then raise exception 'Choose an amount and a purpose for the sample link';end if;
 insert into ig_review_guard.sample_links(request_id,amount,purpose) values((p->>'request')::uuid,(p->>'amount')::numeric,trim(p->>'purpose')) on conflict(request_id) do nothing returning * into link;
 if not found then select * into strict link from ig_review_guard.sample_links where request_id=(p->>'request')::uuid; end if;
 if link.amount<>round((p->>'amount')::numeric,2) or link.purpose<>trim(p->>'purpose') then raise exception 'This request already produced a different sample payment link' using errcode='40001';end if;
 return jsonb_build_object('id',link.id);
 elsif op='upload_prepare' then
 if not ig_private.room_broker_valid(p->>'broker_secret') then raise exception 'File service required' using errcode='42501';end if;
 request_key:=(p->>'request')::uuid; pdf_name:=trim(p->>'name');
 if choice is null or choice not in ('document','image') or char_length(pdf_name) not between 1 and 175 or pdf_name ~ '[/\\]' or (p->>'bytes')::bigint not between 1 and 20971520 or p->>'mime' not in ('application/pdf','image/png','image/jpeg','image/webp') or (choice='image' and p->>'mime'='application/pdf') then raise exception 'Use a PDF or supported image up to 20 MB';end if;
 perform pg_advisory_xact_lock(hashtext('isolated-sample-file-allowance'));
 select f.* into file from public.ig_room_files f join ig_review_guard.sample_uploads u on u.id=f.id where u.request_id=request_key;
 if not found then
 select coalesce(sum(f.bytes),0) into total_bytes from public.ig_room_files f join ig_review_guard.sample_uploads u on u.id=f.id where f.room_id=room.id;
 if total_bytes+(p->>'bytes')::bigint>209715200 then raise exception 'The sample room is at its 200 MB allocation';end if;
 insert into public.ig_room_files(room_id,name,object_key,mime,bytes,created_by,download_enabled)
 values(room.id,pdf_name,room.id::text||'/'||gen_random_uuid()::text,p->>'mime',(p->>'bytes')::bigint,auth.uid(),false) returning * into file;
 insert into ig_review_guard.sample_uploads(id,purpose,request_id) values(file.id,choice,request_key);
 end if;
 if not exists(select from ig_review_guard.sample_uploads where id=file.id and purpose=choice) or file.name<>pdf_name or file.bytes<>(p->>'bytes')::bigint or file.mime<>p->>'mime' or file.status<>'pending' then raise exception 'Upload request already used';end if;
 return jsonb_build_object('id',file.id,'object_key',file.object_key,'version',file.version);
 elsif op in ('upload_inspect','upload_validated','share') then
 select f.* into file from public.ig_room_files f join ig_review_guard.sample_uploads u on u.id=f.id where f.id=(p->>'id')::uuid and f.room_id=room.id and f.created_by=auth.uid() for update of f;
 if not found then raise exception 'Sample upload unavailable' using errcode='42501';end if;
 if op in ('upload_inspect','upload_validated') then
 if not ig_private.room_broker_valid(p->>'broker_secret') then raise exception 'File service required' using errcode='42501';end if;
 if op='upload_inspect' then return jsonb_build_object('id',file.id,'name',file.name,'mime',file.mime,'bytes',file.bytes,'object_key',file.object_key);end if;
 update ig_review_guard.sample_uploads set validated=true where id=file.id;
 else
 if not exists(select from ig_review_guard.sample_uploads where id=file.id and validated) or not exists(select from public.ig_room_grants g join public.ig_client_contacts ct on ct.id=g.contact_id where g.room_id=room.id and g.active and g.expires_at>now() and g.download_mode='none' and ct.active and ct.email='play.client@example.invalid') then raise exception 'Validated sample and assigned client required';end if;
 update public.ig_room_files set status='ready',version=version+1 where id=file.id and status='pending';
 end if;return jsonb_build_object('ok',true);
 end if;raise exception 'Unknown sample operation';
end$$;
revoke all on function public.ig_review_sample_workflows(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.ig_review_sample_workflows(jsonb) to authenticated;
