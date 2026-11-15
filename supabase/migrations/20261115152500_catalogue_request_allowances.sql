-- Only the catalogue worker can spend a scoped allowance. Ordinary staff requests
-- always enter the standard daily budget, regardless of their submitted JSON.
create table ig_private.catalogue_request_allowances (
 catalogue_id uuid primary key references public.ig_brand_catalogues(id),
 first_page int not null check(first_page>=1),
 last_page int not null check(last_page between first_page and 500),
 request_limit int not null check(request_limit>0),
 used int not null default 0 check(used between 0 and request_limit),
 created_at timestamptz not null default now(),
 closed_at timestamptz
);
revoke all on ig_private.catalogue_request_allowances from public,anon,authenticated;
alter table ig_private.catalogue_request_allowances enable row level security;
alter table public.ig_ai_jobs add column catalogue_extra boolean not null default false;

create or replace function ig_private.ai_prepare(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.ig_ai_jobs;cap int;
begin
 if not ig_private.allowed('content.write') or not ig_private.scope_allowed(p->>'practice','write') then raise exception 'Practice content permission and MFA required' using errcode='42501';end if;
 if not exists(select 1 from ig_private.integration_config where id='openai' and mode='enabled') then raise exception 'OpenAI is disabled';end if;
 if jsonb_typeof(p->'context') is distinct from 'object' or length((p->'context')::text)>25000 then raise exception 'Invalid editorial input';end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-ai-daily',0));
 select least(100,greatest(1,coalesce((settings->>'daily_request_limit')::int,20))) into cap from ig_private.integration_config where id='openai';
 if (select count(*) from public.ig_ai_jobs where not catalogue_extra and created_at>=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')>=cap then raise exception 'Daily AI request limit reached';end if;
 if exists(select 1 from public.ig_ai_jobs where actor_id=auth.uid() and created_at>now()-interval '30 seconds') then raise exception 'Wait 30 seconds before generating another draft';end if;
 insert into public.ig_ai_jobs(actor_id,practice,context) values(auth.uid(),p->>'practice',p->'context') returning * into j;
 perform ig_private.record_audit('ai.draft_requested',j.id::text);return jsonb_build_object('id',j.id);
end $$;

create or replace function ig_private.catalogue_background_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare r ig_private.catalogue_runs;c public.ig_brand_catalogues;pg public.ig_catalogue_pages;n int;size bigint;
 use_extra boolean=false;
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
 if n is null then
  update ig_private.catalogue_request_allowances a set closed_at=now()
  where a.catalogue_id=c.id and a.closed_at is null and r.first_page<=a.first_page and r.last_page>=a.last_page;
  update ig_private.catalogue_runs set state='complete',note=null,page_id=null,lease=null,lease_until=null where catalogue_id=c.id;return null;end if;
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
  if (select count(*) from public.ig_ai_jobs where not catalogue_extra and created_at>=day_start)>=cap then
   select exists(select 1 from ig_private.catalogue_request_allowances a where a.catalogue_id=c.id
    and n between a.first_page and a.last_page and a.closed_at is null and a.used<a.request_limit) into use_extra;
   if not use_extra then
    update ig_private.catalogue_runs set state='waiting',due=day_start+interval '24 hours',note='Daily AI allowance reached. Resumes after midnight India time.' where catalogue_id=c.id;
    return null;
   end if;
  end if;
  if exists(select 1 from public.ig_ai_jobs where actor_id=c.actor_id and created_at>now()-interval '30 seconds') then
   update ig_private.catalogue_runs set due=now()+interval '31 seconds' where catalogue_id=c.id;return null;
  end if;
  if use_extra then
   update ig_private.catalogue_request_allowances a set used=a.used+1
    where a.catalogue_id=c.id and n between a.first_page and a.last_page and a.closed_at is null and a.used<a.request_limit;
   if not found then raise exception 'Catalogue allowance changed. Retry the claim.' using errcode='40001';end if;
  end if;
  insert into public.ig_ai_jobs(actor_id,practice,catalogue_extra,context) values(c.actor_id,'horeca',use_extra,jsonb_build_object('kind','brand_catalogue','catalogue_id',c.id,'page',n,'sha256',c.sha256)) returning * into j;
 end if;
 if pg.status is distinct from 'ready' then
  insert into public.ig_catalogue_pages(catalogue_id,page_number,status,lease_token,lease_until) values(c.id,n,'processing',t,now()+interval '6 minutes')
  on conflict(catalogue_id,page_number) do update set status='processing',lease_token=t,lease_until=now()+interval '6 minutes',note=null returning * into pg;
 end if;
 update ig_private.catalogue_runs set state='working',page_id=pg.id,lease=t,lease_until=now()+interval '6 minutes',due=now()+interval '6 minutes',note=null,
 attempts=case when page_id=pg.id then attempts+1 else 1 end where catalogue_id=c.id;
 return jsonb_build_object('id',c.id,'name',c.name,'brand',c.brand,'page',n,'lease',t,'size',size,'ai_job',j.id,'cached',coalesce(pg.result,j.draft),'ready',pg.status='ready','page_count',c.page_count);
end $$;
