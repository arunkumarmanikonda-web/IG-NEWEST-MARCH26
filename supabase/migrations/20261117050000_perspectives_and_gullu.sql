-- Runtime-only state. Public articles and enquiries retain the normal CMS / CRM identities.
create table ig_private.intelligence_settings (
 id boolean primary key default true check(id), enabled boolean not null default true,
 cadence_days int not null default 7 check(cadence_days in (7,14)), preferred_topic text not null default '',
 next_at timestamptz not null default now(), attempts int not null default 0
);
insert into ig_private.intelligence_settings(id) values(true);
create table ig_private.perspective_runs (
 id uuid primary key default gen_random_uuid(), status text not null check(status in ('researching','published','held')),
 started_at timestamptz not null default now(), finished_at timestamptz, title text, error text,
 verification jsonb, candidates jsonb, selection_reason text, content_id uuid references public.ig_content(id) on delete set null
);
create index ig_perspective_runs_recent on ig_private.perspective_runs(started_at desc);
create table ig_private.gullu_turns (
 turn_id uuid primary key, session_id uuid not null, question text not null, answer text not null,
 sources jsonb not null, practice_interest text not null, consent_version text not null default 'gullu-1',
 created_at timestamptz not null default now(), follow_up boolean not null default false,
 enquiry_id uuid references public.ig_enquiries(id) on delete set null
);
create index ig_gullu_recent on ig_private.gullu_turns(created_at desc);
create index ig_gullu_sessions on ig_private.gullu_turns(session_id);
revoke all on ig_private.intelligence_settings,ig_private.perspective_runs,ig_private.gullu_turns from public,anon,authenticated;
alter table ig_private.intelligence_settings enable row level security;
alter table ig_private.perspective_runs enable row level security;
alter table ig_private.gullu_turns enable row level security;

create function public.ig_gullu_admit(secret text,p jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare k text; n int; h text=p->>'visitor_hash';
begin
 if ig_private.integration_server(secret) is not true then raise exception 'Server required' using errcode='42501'; end if;
 if h is null or h !~ '^[a-f0-9]{64}$' then return false; end if;
 foreach k in array array['gullu:visitor:'||h,'gullu:site'] loop
  insert into ig_private.rate_limits(key,window_start,count) values(k,now(),1)
  on conflict(key) do update set count=case when rate_limits.window_start<=now()-interval '1 hour' then 1 else rate_limits.count+1 end,
  window_start=case when rate_limits.window_start<=now()-interval '1 hour' then now() else rate_limits.window_start end returning count into n;
  if n > (case when k='gullu:site' then 300 else 35 end) then return false; end if;
 end loop;
 return true;
end $$;
create function public.ig_gullu_record(secret text,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t ig_private.gullu_turns; e uuid; email text=lower(trim(p->>'contact_email')); recipient text;
begin
 if ig_private.integration_server(secret) is not true then raise exception 'Server required' using errcode='42501'; end if;
 if (p->'consent') is distinct from 'true'::jsonb or coalesce(length(p->>'question'),0) not between 1 and 4000
 or coalesce(length(p->>'answer'),0) not between 1 and 16000 or coalesce(jsonb_typeof(p->'sources'),'')<>'array' then raise exception 'Invalid conversation'; end if;
 insert into ig_private.gullu_turns(turn_id,session_id,question,answer,sources,practice_interest)
 values((p->>'turn_id')::uuid,(p->>'session_id')::uuid,p->>'question',p->>'answer',p->'sources',left(coalesce(nullif(p->>'practice_interest',''),'General enquiry'),120))
 on conflict(turn_id) do nothing;
 select * into strict t from ig_private.gullu_turns where turn_id=(p->>'turn_id')::uuid for update;
 if t.session_id<>(p->>'session_id')::uuid or t.question<>p->>'question' or t.answer<>p->>'answer' then raise exception 'Turn mismatch';end if;
 if p->'follow_up'='true'::jsonb and not t.follow_up then
  if email is null or length(email)>254 or email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' then raise exception 'Email required';end if;
  insert into public.ig_enquiries(name,email,practice,message,privacy_version) values(left(coalesce(nullif(trim(p->>'contact_name'),''),'Gullu visitor'),100),email,t.practice_interest,left(t.question,1500),'gullu-1') returning id into e;
  foreach recipient in array array['akm@indiagully.com','amit.jhingan@indiagully.com','pavan@indiagully.com'] loop
   insert into public.ig_outbox(enquiry_id,recipient,kind) values(e,recipient,'internal');
  end loop;
  update ig_private.gullu_turns set enquiry_id=e,follow_up=true where turn_id=t.turn_id;
 end if;
 return jsonb_build_object('saved',true,'enquiry_id',coalesce(e,t.enquiry_id));
end $$;
revoke all on function public.ig_gullu_record(text,jsonb),public.ig_gullu_admit(text,jsonb) from public;
grant execute on function public.ig_gullu_record(text,jsonb),public.ig_gullu_admit(text,jsonb) to anon,authenticated;

create function public.ig_perspective_worker(secret text,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cfg ig_private.intelligence_settings; r ig_private.perspective_runs; item public.ig_content;
 a text=p->>'action'; article jsonb=p->'article'; cycle timestamptz; pd jsonb; slug_base text;
begin
 if ig_private.integration_server(secret) is not true then raise exception 'Server required' using errcode='42501';end if;
 select * into strict cfg from ig_private.intelligence_settings where id for update;
 cycle=(date_trunc('week',now() at time zone 'Asia/Kolkata')+make_interval(days=>cfg.cadence_days,hours=>9)) at time zone 'Asia/Kolkata';
 if a='claim' then
  if not cfg.enabled or cfg.next_at>now() then return null;end if;
  update ig_private.perspective_runs set status='held',finished_at=now(),error='Worker lease expired' where status='researching';
  if cfg.attempts>=3 then
   update ig_private.intelligence_settings set attempts=0,next_at=cycle where id; return null;
  end if;
  insert into ig_private.perspective_runs(status) values('researching') returning * into r;
  update ig_private.intelligence_settings set next_at=now()+interval '7 minutes',attempts=attempts+1 where id;
  return jsonb_build_object('run_id',r.id,'cadence_days',cfg.cadence_days,'preferred_topic',cfg.preferred_topic,
   'recent_titles',(select coalesce(jsonb_agg(title),'[]') from (select title from public.ig_public_content where kind='article' order by published_at desc limit 35) articles),
   'popular_practices',(select coalesce(jsonb_agg(interest),'[]') from (select practice_interest interest from ig_private.gullu_turns where created_at>now()-interval '30 days' group by practice_interest having count(distinct session_id)>=3 order by count(*) desc limit 4) top));
 end if;
 select * into r from ig_private.perspective_runs where id=(p->>'run_id')::uuid and status='researching' for update;
 if r.id is null then return null;end if;
 if a='hold' then
  update ig_private.perspective_runs set status='held',finished_at=now(),error=left(coalesce(p->>'error','Evidence review incomplete'),400) where id=r.id;
  update ig_private.intelligence_settings set next_at=case when attempts>=3 then cycle else now()+interval '30 minutes' end,
   attempts=case when attempts>=3 then 0 else attempts end where id;return null;
 end if;
 if a<>'publish' or not cfg.enabled or cfg.next_at<now() then raise exception 'Run cannot publish';end if;
 if jsonb_typeof(article->'sources') is distinct from 'array' or jsonb_array_length(article->'sources')<2
 or jsonb_typeof(article->'sections') is distinct from 'array' or jsonb_array_length(article->'sections')<2
 or jsonb_typeof(article->'verification') is distinct from 'object' or coalesce(article#>>'{verification,report}','') !~ '^VERIFIED'
 or coalesce(length(article->>'title'),0) not between 5 and 180 or coalesce(length(article->>'body'),0)<150 then raise exception 'Incomplete article';end if;
 if exists(select 1 from public.ig_public_content where kind='article' and lower(title)=lower(article->>'title')) then raise exception 'This perspective is already published';end if;
 slug_base=trim(both '-' from regexp_replace(lower(left(article->>'title',88)),'[^a-z0-9]+','-','g'));
 pd=jsonb_build_object('engine','perspectives','sector',article->>'practice','sections',article->'sections','sources',article->'sources','image',coalesce(p->>'image','/images/city.jpg'));
 insert into public.ig_content(kind,slug,title,summary,body,seo_title,seo_description,public_data,status,published_version)
 values('article',coalesce(nullif(slug_base,''),'perspective')||'-'||left(r.id::text,8),article->>'title',article->>'summary',article->>'body',left(article->>'title',90),left(article->>'summary',200),pd,'published',1) returning * into item;
 insert into public.ig_content_revisions(content_id,version,snapshot) values(item.id,item.version,to_jsonb(item));
 insert into public.ig_public_content(id,kind,slug,title,summary,body,seo_title,seo_description,public_data,version)
 values(item.id,item.kind,item.slug,item.title,item.summary,item.body,item.seo_title,item.seo_description,item.public_data,item.version);
 update ig_private.perspective_runs set status='published',finished_at=now(),content_id=item.id,title=item.title,verification=article->'verification',candidates=article->'candidates',selection_reason=article->>'selectionReason' where id=r.id;
 update ig_private.intelligence_settings set attempts=0,next_at=cycle where id;
 insert into public.ig_audit(action,entity_id,detail) values('perspectives.auto_published',item.id::text,jsonb_build_object('run_id',r.id));
 return jsonb_build_object('slug',item.slug);
end $$;
revoke all on function public.ig_perspective_worker(text,jsonb) from public;
grant execute on function public.ig_perspective_worker(text,jsonb) to anon,authenticated;
