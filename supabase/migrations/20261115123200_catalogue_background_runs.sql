-- A job authorises only the registered PDF, its private crops and unpublished product drafts.
create table ig_private.catalogue_runs (
  catalogue_id uuid primary key references public.ig_brand_catalogues(id),
  first_page int not null check(first_page between 1 and 500),
  last_page int not null check(last_page between first_page and 500),
  auto_images boolean not null, bucket text not null, path text not null,
  state text not null default 'queued' check(state in ('queued','working','waiting','paused','review','complete')),
  due timestamptz not null default now(), note text, attempts int not null default 0,
  page_id uuid references public.ig_catalogue_pages(id), lease uuid, lease_until timestamptz
);
create index catalogue_runs_due on ig_private.catalogue_runs(due) where state in ('queued','working','waiting');
create table ig_private.catalogue_artwork (
  content_id uuid primary key references public.ig_content(id), catalogue_id uuid not null references public.ig_brand_catalogues(id),
  media_id uuid references public.ig_source_media(id), due timestamptz not null default now(), note text
);
revoke all on ig_private.catalogue_runs,ig_private.catalogue_artwork from public,anon,authenticated;

create function ig_private.catalogue_background_source(c public.ig_brand_catalogues,bucket text,path text)
returns bigint language sql stable security definer set search_path='' as $$
 select (o.metadata->>'size')::bigint
 from storage.objects o join public.ig_profiles a on a.id=c.actor_id and a.status='active'
 join auth.users u on u.id=a.id and u.deleted_at is null and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now())
 where not a.must_change_password and ig_private.registration_accepted(a.id)
 and ('owner'=any(a.roles) or (a.roles && array['administrator','publisher','procurement_manager'] and (a.practice_grants->'horeca') ? 'write'))
 and o.bucket_id=bucket and o.name=path and (
 (bucket='ig-brand-catalogues' and path=c.path) or
 (bucket='ig-data-rooms' and exists(
  select 1 from public.ig_intake_sources s join public.ig_room_files f on f.id=s.room_file_id
  join public.ig_data_rooms d on d.id=f.room_id
  left join public.ig_content rc on rc.id=d.content_id
  left join public.ig_engagements e on e.id=d.engagement_id left join public.ig_clients cl on cl.id=e.client_id
  where s.actor_id=a.id and s.practice='horeca' and s.sha256=c.sha256 and s.mime='application/pdf'
    and s.path=o.name and s.size=(o.metadata->>'size')::bigint and f.status='ready' and d.active
    and ('owner'=any(a.roles) or ('administrator'=any(a.roles) and (a.practice_grants->coalesce(rc.practice,cl.practice)) ? 'data_rooms'))
 ))) limit 1
$$;
revoke all on function ig_private.catalogue_background_source(public.ig_brand_catalogues,text,text) from public,anon,authenticated;

create function public.ig_catalogue_run(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.ig_brand_catalogues; r ig_private.catalogue_runs; location jsonb; b text='ig-brand-catalogues'; src text;
begin
 select * into c from public.ig_brand_catalogues where id=(p->>'id')::uuid;
 if c.id is null or not ig_private.catalogue_allowed(c.id) then raise exception 'Catalogue edit permission required' using errcode='42501'; end if;
 if p->>'action'='queue' then
  src=c.path;
  if not exists(select 1 from storage.objects where bucket_id=b and name=src) then
   location=ig_private.catalogue_room_source(c); b='ig-data-rooms';src=location->>'path';
  end if;
  if ig_private.catalogue_background_source(c,b,src) is null then raise exception 'The registered source is unavailable. Complete its upload first.';end if;
  insert into ig_private.catalogue_runs(catalogue_id,first_page,last_page,auto_images,bucket,path)
  values(c.id,(p->>'first')::int,least((p->>'last')::int,coalesce(c.page_count,500)),(p->>'auto_images')::boolean,b,src)
  on conflict(catalogue_id) do update set first_page=excluded.first_page,last_page=excluded.last_page,auto_images=excluded.auto_images,bucket=b,path=src,
    state=case when ig_private.catalogue_runs.lease_until>now() then 'working' else 'queued' end,due=now(),note=null,attempts=0;
  perform ig_private.record_audit('catalogue.background_requested',c.id::text);
 elsif p->>'action'='pause' then
  update ig_private.catalogue_runs set state='paused' where catalogue_id=c.id;
 elsif p->>'action' is distinct from 'status' then raise exception 'Unknown catalogue operation';end if;
 select * into r from ig_private.catalogue_runs where catalogue_id=c.id;
 if r.catalogue_id is null then return null;end if;
 return jsonb_build_object('state',r.state,'note',r.note,'due',r.due,'first',r.first_page,'last',r.last_page);
end $$;
revoke all on function public.ig_catalogue_run(jsonb) from public,anon;
grant execute on function public.ig_catalogue_run(jsonb) to authenticated;

create function ig_private.catalogue_background_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare r ig_private.catalogue_runs;c public.ig_brand_catalogues;pg public.ig_catalogue_pages;n int;size bigint;
 cfg ig_private.integration_config;day_start timestamptz; cap int;j public.ig_ai_jobs;t uuid=gen_random_uuid();
begin
 select * into r from ig_private.catalogue_runs where state in ('queued','working','waiting') and due<=now()
 and (lease_until is null or lease_until<=now()) order by due for update skip locked limit 1;
 if not found then return null;end if;
 select * into strict c from public.ig_brand_catalogues where id=r.catalogue_id;
 size=ig_private.catalogue_background_source(c,r.bucket,r.path);
 if size is null then update ig_private.catalogue_runs set state='review',note='Source access changed. Review the original catalogue.' where catalogue_id=c.id;return null;end if;
 select x into n from generate_series(r.first_page,least(r.last_page,coalesce(c.page_count,500))) x
 where not exists(select 1 from public.ig_catalogue_pages p where p.catalogue_id=c.id and p.page_number=x and p.status='ready'
  and not exists(select 1 from jsonb_array_elements(p.result->'products') with ordinality products(v,i)
   where not exists(select 1 from public.ig_catalogue_items it where it.page_id=p.id and it.item_no=products.i-1 and it.content_id is not null)))
 order by x limit 1;
 if n is null then update ig_private.catalogue_runs set state='complete',note=null,page_id=null,lease=null,lease_until=null where catalogue_id=c.id;return null;end if;
 perform pg_advisory_xact_lock(hashtextextended(c.id||':'||n,0));
 select * into pg from public.ig_catalogue_pages where catalogue_id=c.id and page_number=n for update;
 if r.page_id=pg.id and r.attempts>=4 then
  update ig_private.catalogue_runs set state='review',note='Repeated interruptions on page '||n||'. Review the source and resume this page.' where catalogue_id=c.id; return null;
 end if;
 if pg.status='processing' and pg.lease_until>now() then update ig_private.catalogue_runs set due=pg.lease_until where catalogue_id=c.id;return null;end if;
 select * into j from public.ig_ai_jobs where actor_id=c.actor_id and context->>'catalogue_id'=c.id::text and context->>'page'=n::text
 and context->>'sha256'=c.sha256 and status in ('ready','saved') and jsonb_typeof(draft->'products')='array' order by created_at desc limit 1;
 if j.id is null and pg.status is distinct from 'ready' then
  perform pg_advisory_xact_lock(hashtextextended('ig-ai-daily',0));
  select * into cfg from ig_private.integration_config where id='openai';
  if cfg.mode is distinct from 'enabled' then update ig_private.catalogue_runs set state='waiting',due=now()+interval '1 hour',note='Waiting for OpenAI to be enabled.' where catalogue_id=c.id;return null;end if;
  day_start=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  cap=least(100,greatest(1,coalesce((cfg.settings->>'daily_request_limit')::int,20)));
  if (select count(*) from public.ig_ai_jobs where created_at>=day_start)>=cap then
   update ig_private.catalogue_runs set state='waiting',due=day_start+interval '24 hours',note='Daily AI allowance reached. Resumes after midnight India time.' where catalogue_id=c.id;return null;
  end if;
  if exists(select 1 from public.ig_ai_jobs where actor_id=c.actor_id and created_at>now()-interval '30 seconds') then
   update ig_private.catalogue_runs set due=now()+interval '31 seconds' where catalogue_id=c.id;return null;end if;
  insert into public.ig_ai_jobs(actor_id,practice,context) values(c.actor_id,'horeca',jsonb_build_object('kind','brand_catalogue','catalogue_id',c.id,'page',n,'sha256',c.sha256)) returning * into j;
 end if;
 if pg.status is distinct from 'ready' then
  insert into public.ig_catalogue_pages(catalogue_id,page_number,status,lease_token,lease_until) values(c.id,n,'processing',t,now()+interval '6 minutes')
  on conflict(catalogue_id,page_number) do update set status='processing',lease_token=t,lease_until=now()+interval '6 minutes',note=null returning * into pg;
 end if;
 update ig_private.catalogue_runs set state='working',page_id=pg.id,lease=t,lease_until=now()+interval '6 minutes',due=now()+interval '6 minutes',note=null,
 attempts=case when page_id=pg.id then attempts+1 else 1 end where catalogue_id=c.id;
 return jsonb_build_object('id',c.id,'name',c.name,'brand',c.brand,'page',n,'lease',t,'size',size,'ai_job',j.id,'cached',coalesce(pg.result,j.draft),'ready',pg.status='ready','page_count',c.page_count);
end $$;
revoke all on function ig_private.catalogue_background_claim() from public,anon,authenticated;

create function ig_private.catalogue_background_finish(r ig_private.catalogue_runs,c public.ig_brand_catalogues,pg public.ig_catalogue_pages,p jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare row jsonb;item int;cid uuid;sku text;media uuid;data jsonb;record public.ig_content;cnt int=0;result jsonb=p->'result';
begin
 if jsonb_typeof(result->'products') is distinct from 'array' or jsonb_array_length(result->'products')>24 then raise exception 'Invalid catalogue page';end if;
 update public.ig_catalogue_pages set status='ready',result=result_with_photos.v,lease_token=null,lease_until=null,note=null
 from (values(p->'result')) result_with_photos(v) where id=pg.id;
 update public.ig_brand_catalogues set page_count=(p->>'page_count')::int where id=c.id;
 for row,item in select value,(ordinality-1)::int from jsonb_array_elements(result->'products') with ordinality loop
  if length(btrim(row->>'title'))<2 or nullif(btrim(row->>'evidence'),'') is null then raise exception 'Missing source evidence';end if;
  select i.content_id,i.media_id into cid,media from public.ig_catalogue_items i where i.page_id=pg.id and i.item_no=item;
  if media is not null and not exists(select 1 from public.ig_source_media m join storage.objects o on o.bucket_id='ig-source-media' and o.name=m.path
     where m.id=media and m.actor_id=c.actor_id and m.rights_reference=c.rights_reference) then raise exception 'Incomplete source image transfer';end if;
  if media is not null then update public.ig_source_media set state='ready' where id=media;end if;
  if cid is null and nullif(btrim(row->>'reference'),'') is not null then
   perform pg_advisory_xact_lock(hashtextextended(lower(c.brand)||':'||lower(btrim(row->>'reference')),0));
   select id into cid from public.ig_content where kind='product' and lower(public_data->>'brand')=lower(c.brand)
    and lower(public_data->>'reference')=lower(btrim(row->>'reference')) order by created_at,id limit 1;
  end if;
  if cid is null then
   sku=ig_private.next_product_sku(c.brand);
   data=jsonb_build_object('sku',sku,'brand',c.brand,'category',row->>'category','reference',row->>'reference','uom',coalesce(nullif(btrim(row->>'uom'),''),'each'),
    'seo_keywords',left(concat_ws(', ',nullif(row->>'search_phrases',''),row->>'category',c.brand,nullif(row->>'reference','')),500));
   insert into public.ig_content(kind,practice,slug,title,summary,body,seo_title,seo_description,public_data,created_by,updated_by)
   values('product','horeca','sku-'||lower(sku),row->>'title',row->>'summary',row->>'specifications',left(concat_ws(' | ',row->>'title',c.brand),90),
    left(coalesce(nullif(row->>'summary',''),row->>'title'),200),data,c.actor_id,c.actor_id) returning * into record;
   cid=record.id;cnt=cnt+1;
   insert into public.ig_content_revisions(content_id,version,snapshot,actor_id) values(cid,record.version,to_jsonb(record),c.actor_id);
  end if;
  insert into public.ig_catalogue_items(page_id,item_no,content_id) values(pg.id,item,cid) on conflict(page_id,item_no) do update set content_id=excluded.content_id;
  if r.auto_images and (media is null or row->>'image_quality'='enhance') and exists(select 1 from public.ig_content where id=cid and status='draft' and published_version is null and deleted_at is null) then
   insert into ig_private.catalogue_artwork(content_id,catalogue_id,media_id) values(cid,c.id,media) on conflict do nothing;
  end if;
 end loop;
 update ig_private.catalogue_runs set state=case when state='paused' then 'paused' else 'queued' end,due=now()+interval '31 seconds',attempts=0,note=null,lease=null,lease_until=null where catalogue_id=c.id;
 insert into public.ig_audit(actor_id,action,entity_id,detail) values(c.actor_id,'catalogue.page_prepared',c.id::text,jsonb_build_object('page',pg.page_number,'drafts',cnt));
 return jsonb_build_object('created',cnt);
end $$;
revoke all on function ig_private.catalogue_background_finish(ig_private.catalogue_runs,public.ig_brand_catalogues,public.ig_catalogue_pages,jsonb) from public,anon,authenticated;

create function public.ig_catalogue_background(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r ig_private.catalogue_runs;c public.ig_brand_catalogues;pg public.ig_catalogue_pages;m public.ig_source_media;
 id uuid;item int;original int;size bigint;task text=p->>'action';
begin
 if not ig_private.integration_server(secret) then raise exception 'Worker authorisation required' using errcode='42501';end if;
 if task='claim' then return ig_private.catalogue_background_claim();end if;
 select * into r from ig_private.catalogue_runs where catalogue_id=(p->>'id')::uuid and lease=(p->>'lease')::uuid and lease_until>now() for update;
 if not found then raise exception 'Catalogue lease expired';end if;
 select * into strict c from public.ig_brand_catalogues where ig_brand_catalogues.id=r.catalogue_id;
 select * into strict pg from public.ig_catalogue_pages where ig_catalogue_pages.id=r.page_id and catalogue_id=c.id;
 if task='fail' then
  update public.ig_catalogue_pages set status='failed',note=left(p->>'note',480),lease_token=null,lease_until=null where ig_catalogue_pages.id=pg.id and status='processing' and lease_token=r.lease;
  update ig_private.catalogue_runs set state=case when state='paused' then 'paused' when attempts>=4 then 'review' else 'waiting' end,
   due=now()+interval '5 minutes'*greatest(1,attempts),note=left(p->>'note',480),lease=null,lease_until=null where catalogue_id=c.id;
  return '{}'::jsonb;
 end if;
 size=ig_private.catalogue_background_source(c,r.bucket,r.path);
 if size is null then raise exception 'Registered source is unavailable';end if;
 if task='source' then return jsonb_build_object('bucket',r.bucket,'path',r.path);end if;
 if task='asset' then
  item=(p->>'item')::int; original=coalesce((p->>'original')::int,item);
  if item not between 0 and 23 or original not between 0 and item then raise exception 'Invalid catalogue item';end if;
  select sm.* into m from public.ig_catalogue_items i join public.ig_source_media sm on sm.id=i.media_id where i.page_id=pg.id and i.item_no=original;
  if not found then
   if original<>item then raise exception 'Missing shared model photograph';end if;
   if (select count(*) from public.ig_source_media where actor_id=c.actor_id and created_at>now()-interval '24 hours')>=500 then raise exception 'Daily catalogue image limit reached';end if;
   id=gen_random_uuid();
   insert into public.ig_source_media(id,actor_id,practice,path,source_name,rights_reference,alt,preset)
   values(id,c.actor_id,'horeca',c.actor_id||'/'||id||'.jpg',left(c.name||' · page '||pg.page_number,180),c.rights_reference,left(p->>'alt',250),'square') returning * into m;
  end if;
  insert into public.ig_catalogue_items(page_id,item_no,media_id) values(pg.id,item,m.id) on conflict(page_id,item_no) do update set media_id=excluded.media_id;
  return jsonb_build_object('bucket','ig-source-media','path',m.path,'uploaded',exists(select 1 from storage.objects o where o.bucket_id='ig-source-media' and o.name=m.path));
 end if;
 if task='finish' then return ig_private.catalogue_background_finish(r,c,pg,p);end if;
 raise exception 'Unknown worker operation';
end $$;
revoke all on function public.ig_catalogue_background(text,jsonb) from public;
grant execute on function public.ig_catalogue_background(text,jsonb) to anon,authenticated,service_role;

-- Artwork budgets share their lock and accounting ledger with staff-generated images.
create function public.ig_catalogue_next_artwork(secret text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a ig_private.catalogue_artwork;c public.ig_brand_catalogues;r ig_private.catalogue_runs;d public.ig_content;cfg ig_private.integration_config;
 req uuid;job uuid;day_start timestamptz;brief text;input jsonb;enhance boolean;
begin
 if not ig_private.integration_server(secret) then raise exception 'Worker authorisation required' using errcode='42501';end if;
 select art.* into a from ig_private.catalogue_artwork art join ig_private.catalogue_runs run on run.catalogue_id=art.catalogue_id
 where run.auto_images and run.state not in ('paused','review') and art.due<=now() order by art.due for update of art skip locked limit 1;
 if not found then return null;end if;
 select * into strict c from public.ig_brand_catalogues where id=a.catalogue_id;
 select * into strict r from ig_private.catalogue_runs where catalogue_id=c.id;
 select * into d from public.ig_content where id=a.content_id and kind='product' and practice='horeca' and status='draft' and published_version is null and deleted_at is null;
 enhance=a.media_id is not null;req=coalesce(a.media_id,a.content_id);
 if d.id is null or (nullif(d.public_data->>'image','') is not null and (not enhance or d.public_data->>'image'<>'/images/library/'||a.media_id||'.jpg'))
 or (enhance and not ig_private.catalogue_photo_matches(d.id,a.media_id)) then delete from ig_private.catalogue_artwork where content_id=a.content_id;return null;end if;
 if ig_private.catalogue_background_source(c,r.bucket,r.path) is null then update ig_private.catalogue_runs set state='review',note='Catalogue source access changed.' where catalogue_id=c.id;return null;end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-provider-runway',0));
 select * into cfg from ig_private.integration_config where id='runway';
 if cfg.mode is distinct from 'enabled' then update ig_private.catalogue_artwork set due=now()+interval '1 hour',note='Waiting for image provider.' where content_id=a.content_id;return null;end if;
 if exists(select 1 from public.ig_provider_jobs where actor_id=c.actor_id and request_id=req) then delete from ig_private.catalogue_artwork where content_id=a.content_id;return null;end if;
 day_start=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
 if (select count(*) from public.ig_provider_jobs where provider='runway' and created_at>=day_start)>=least(100,greatest(1,coalesce((cfg.settings->>'daily_request_limit')::int,10)))
 or (select coalesce(sum(estimated_credits),0) from public.ig_provider_jobs where provider='runway' and created_at>=day_start)+5>least(1200,greatest(5,coalesce((cfg.settings->>'daily_credit_limit')::int,120))) then
  update ig_private.catalogue_artwork set due=day_start+interval '24 hours',note='Waiting for image allowance.' where content_id=a.content_id;return null;end if;
 if exists(select 1 from public.ig_provider_jobs where provider='runway' and actor_id=c.actor_id and created_at>now()-interval '30 seconds') then return null;end if;
 brief=case when enhance then 'Retouch the exact product in @source. Preserve geometry, finish, markings, material and parts. Correct exposure and sharpness; retain original detail.'
 else 'Create a labelled illustrative studio concept from the product specifications. Avoid invented logos, markings, components or features.' end
 ||' Neutral background, natural shadow, full product visible. '||left(concat_ws('. ',d.title,d.summary,d.body),550);
 input=jsonb_build_object('content_id',d.id,'product_id',d.id,'product_title',d.title,'product_sku',d.public_data->>'sku','kind','image','ratio','720:720','duration',0,'prompt',brief,'estimated_credits',5,'public_approved',true,
  'product_image_mode',case when enhance then 'enhance' else 'generate' end)||case when enhance then jsonb_build_object('reference_media_id',a.media_id) else '{}'::jsonb end;
 insert into public.ig_provider_jobs(request_id,actor_id,practice,provider,kind,input,config_version,estimated_credits) values(req,c.actor_id,'horeca','runway','image',input,cfg.version,5) returning id into job;
 delete from ig_private.catalogue_artwork where content_id=a.content_id;
 insert into public.ig_audit(actor_id,action,entity_id,detail) values(c.actor_id,'catalogue.artwork_queued',job::text,jsonb_build_object('product',d.id));
 return jsonb_build_object('queued',true);
end $$;
revoke all on function public.ig_catalogue_next_artwork(text) from public;
grant execute on function public.ig_catalogue_next_artwork(text) to anon,authenticated;

-- Reuse the production relay; send a wake-up only for work that is due.
do $$
declare before text;after text;
begin
 before=pg_get_functiondef('ig_private.run_email_worker()'::regprocedure);
 after=replace(before,'if not exists(select 1 from public.ig_outbox','if not exists(select 1 from ig_private.catalogue_runs where state in (''queued'',''working'',''waiting'') and due<=now() and (lease_until is null or lease_until<=now()))
 and not exists(select 1 from ig_private.catalogue_artwork a join ig_private.catalogue_runs r using(catalogue_id) where r.auto_images and r.state not in (''paused'',''review'') and a.due<=now())
 and not exists(select 1 from public.ig_outbox');
 if before=after then raise exception 'Unexpected recovery schedule definition';end if;
 execute after;
end $$;
