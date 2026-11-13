create table public.ig_ai_jobs(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),practice text not null,
 context jsonb not null check(length(context::text)<=25000),status text not null default 'processing' check(status in ('processing','ready','failed','saved')),
 draft jsonb,usage jsonb,provider_id text,content_id uuid references public.ig_content(id),created_at timestamptz not null default now(),finished_at timestamptz
);
create index ig_ai_actor_date on public.ig_ai_jobs(actor_id,created_at);
create index ig_ai_content on public.ig_ai_jobs(content_id);
alter table public.ig_ai_jobs enable row level security;
revoke all on public.ig_ai_jobs from public,anon,authenticated;
grant select on public.ig_ai_jobs to authenticated;
create policy ai_own_read on public.ig_ai_jobs for select to authenticated using(ig_private.allowed('content.write') and ig_private.scope_allowed(practice,'write') and (actor_id=auth.uid() or exists(select 1 from public.ig_profiles where id=auth.uid() and 'owner'=any(roles))));
create function ig_private.ai_prepare(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.ig_ai_jobs;cap int;
begin
 if not ig_private.allowed('content.write') or not ig_private.scope_allowed(p->>'practice','write') then raise exception 'Practice content permission and MFA required' using errcode='42501';end if;
 if not exists(select 1 from ig_private.integration_config where id='openai' and mode='enabled') then raise exception 'OpenAI is disabled';end if;
 if jsonb_typeof(p->'context') is distinct from 'object' or length((p->'context')::text)>25000 then raise exception 'Invalid editorial input';end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-ai-daily',0));
 select least(100,greatest(1,coalesce((settings->>'daily_request_limit')::int,20))) into cap from ig_private.integration_config where id='openai';
 if (select count(*) from public.ig_ai_jobs where created_at>=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')>=cap then raise exception 'Daily AI request limit reached';end if;
 if exists(select 1 from public.ig_ai_jobs where actor_id=auth.uid() and created_at>now()-interval '30 seconds') then raise exception 'Wait 30 seconds before generating another draft';end if;
 insert into public.ig_ai_jobs(actor_id,practice,context) values(auth.uid(),p->>'practice',p->'context') returning * into j;
 perform ig_private.record_audit('ai.draft_requested',j.id::text);return jsonb_build_object('id',j.id);
end $$;
create function public.ig_ai_prepare(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.ai_prepare(p)$$;
create function ig_private.ai_finish(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 if p->>'status' not in ('ready','failed') or length(coalesce((p->'draft')::text,''))>70000 then raise exception 'Invalid draft result';end if;
 update public.ig_ai_jobs set status=p->>'status',draft=p->'draft',usage=p->'usage',provider_id=left(p->>'provider_id',200),finished_at=now() where id=(p->>'id')::uuid and status='processing';
 if not found then raise exception 'Draft is no longer awaiting completion';end if;
 perform ig_private.record_audit('ai.draft_'||(p->>'status'),p->>'id');return '{"ok":true}';
end $$;
create function public.ig_ai_finish(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.ai_finish(secret,p)$$;
create function ig_private.ai_save(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.ig_ai_jobs;result jsonb;k text;
begin
 select * into j from public.ig_ai_jobs where id=(p->>'id')::uuid for update;
 if j.id is null or j.actor_id<>auth.uid() or not ig_private.allowed('content.write') or not ig_private.scope_allowed(j.practice,'write') then raise exception 'Draft ownership and practice permission required' using errcode='42501';end if;
 if j.status='saved' then return jsonb_build_object('id',j.content_id);end if;
 if j.status<>'ready' or p->>'reviewed' is distinct from 'true' then raise exception 'Review the completed draft before saving';end if;
 k=case j.context->>'kind' when 'property' then 'opportunity' when 'product' then 'product' when 'article' then 'article' else 'page' end;
 result=ig_private.save_content(jsonb_build_object('kind',k,'practice',j.practice,'slug',p->>'slug','title',j.draft->>'title','summary',j.draft->>'summary','body',j.draft->>'body','seo_title',j.draft->>'seo_title','seo_description',j.draft->>'seo_description','public_data','{}'::jsonb,'term_ids','[]'::jsonb));
 update public.ig_ai_jobs set status='saved',content_id=(result->>'id')::uuid where id=j.id;
 perform ig_private.record_audit('ai.saved_as_draft',j.id::text,jsonb_build_object('content_id',result->>'id'));return result;
end $$;
create function public.ig_ai_save(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.ai_save(p)$$;
revoke all on function ig_private.ai_prepare(jsonb),public.ig_ai_prepare(jsonb),ig_private.ai_save(jsonb),public.ig_ai_save(jsonb) from public,anon;
grant execute on function ig_private.ai_prepare(jsonb),public.ig_ai_prepare(jsonb),ig_private.ai_save(jsonb),public.ig_ai_save(jsonb) to authenticated;
revoke all on function ig_private.ai_finish(text,jsonb),public.ig_ai_finish(text,jsonb) from public;
grant execute on function ig_private.ai_finish(text,jsonb),public.ig_ai_finish(text,jsonb) to anon,authenticated;
