-- Audit F04/F07/F15: bounded KYC work, durable component outcomes, database hygiene.
create index if not exists ig_catalogue_artwork_catalogue on ig_private.catalogue_artwork(catalogue_id);
create index if not exists ig_catalogue_artwork_media on ig_private.catalogue_artwork(media_id);
create index if not exists ig_catalogue_runs_page on ig_private.catalogue_runs(page_id);
create index if not exists ig_gullu_enquiry on ig_private.gullu_turns(enquiry_id);
create index if not exists ig_perspective_content on ig_private.perspective_runs(content_id);
create index if not exists ig_operations_kind on public.ig_operations(kind);
create index if not exists ig_outbox_nda on public.ig_outbox(nda_request_id);
alter table ig_private.catalogue_artwork enable row level security;
alter table ig_private.catalogue_runs enable row level security;
alter policy ai_own_read on public.ig_ai_jobs using (
 ig_private.allowed('content.write') and ig_private.scope_allowed(practice,'write') and
 (actor_id=(select auth.uid()) or exists(select 1 from public.ig_profiles where id=(select auth.uid()) and 'owner'=any(roles))));
update storage.buckets set file_size_limit=10000000 where id='client-kyc';
create table ig_private.kyc_work (
 user_id uuid primary key references auth.users on delete cascade,
 lease uuid, expires_at timestamptz, window_at timestamptz not null default now(), attempts integer not null default 0
);
alter table ig_private.kyc_work enable row level security;
revoke all on ig_private.kyc_work from public,anon,authenticated;
create function public.ig_kyc_admit(p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare w ig_private.kyc_work; token uuid=gen_random_uuid();
begin
 if not ig_private.allowed('account') then raise exception 'Sign in required' using errcode='42501';end if;
 if p->>'action'='release' then
  update ig_private.kyc_work set expires_at=now() where user_id=auth.uid() and lease=(p->>'lease')::uuid;
  return null;
 end if;
 if not exists(select from public.ig_legal_entities e where e.id=(p->>'id')::uuid and e.user_id=auth.uid() and e.revision=(p->>'revision')::int and e.status='draft' and p->>'slot'=any(ig_private.kyc_slots(e))) then raise exception 'Evidence request unavailable' using errcode='42501';end if;
 insert into ig_private.kyc_work(user_id) values(auth.uid()) on conflict do nothing;
 select * into w from ig_private.kyc_work where user_id=auth.uid() for update;
 if w.expires_at>now() or (w.window_at>now()-interval '1 hour' and w.attempts>=12) then return null;end if;
 update ig_private.kyc_work set lease=token,expires_at=now()+interval '2 minutes',
 attempts=case when window_at<=now()-interval '1 hour' then 1 else attempts+1 end,
 window_at=case when window_at<=now()-interval '1 hour' then now() else window_at end where user_id=auth.uid();
 return token;
end $$;
revoke all on function public.ig_kyc_admit(jsonb) from public,anon;
grant execute on function public.ig_kyc_admit(jsonb) to authenticated;

create table ig_private.worker_health (
 component text primary key check(component in ('email','providers','campaigns','collections','catalogue','artwork','perspectives','gullu_reports')),
 lease uuid, started_at timestamptz, finished_at timestamptz, last_success timestamptz,
 ok boolean, failures integer not null default 0, detail text not null default 'Awaiting first run'
);
alter table ig_private.worker_health enable row level security;
revoke all on ig_private.worker_health from public,anon,authenticated;
insert into ig_private.worker_health(component) select unnest(array['email','providers','campaigns','collections','catalogue','artwork','perspectives','gullu_reports']);
create function public.ig_worker_health(secret text,p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare w ig_private.worker_health; token uuid=gen_random_uuid();
begin
 if not ig_private.integration_server(secret) then raise exception 'Worker authentication required' using errcode='42501';end if;
 select * into w from ig_private.worker_health where component=p->>'component' for update;
 if w.component is null then raise exception 'Unknown worker';end if;
 if p->>'action'='start' then
  if w.lease is not null and w.started_at>now()-interval '6 minutes' then return null;end if;
  update ig_private.worker_health set lease=token,started_at=now(),detail='Processing' where component=w.component;
  return token;
 elsif p->>'action'='finish' then
  update ig_private.worker_health set lease=null,finished_at=now(),ok=case when p->>'idle'='true' then coalesce(ok,true) else (p->>'ok')='true' end,
   last_success=case when p->>'ok'='true' and coalesce(p->>'idle','false')<>'true' then now() else last_success end,
   failures=case when p->>'idle'='true' then failures when p->>'ok'='true' then 0 else failures+1 end,
   detail=case when p->>'idle'='true' then case when ok=false then 'Previous processing failure needs review. No new work due.' else 'Ready. No work due.' end else left(coalesce(p->>'detail',''),200) end
   where component=w.component and lease=(p->>'lease')::uuid;
  return null;
 end if;
 raise exception 'Unknown worker action';
end $$;
revoke all on function public.ig_worker_health(text,jsonb) from public;
grant execute on function public.ig_worker_health(text,jsonb) to anon,authenticated;
create function public.ig_worker_status() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.allowed('content.write') or not ig_private.staff_verified() then raise exception 'Staff permission required' using errcode='42501';end if;
 return (select jsonb_agg(jsonb_build_object('component',component,'last_success',last_success,'last_attempt',started_at,'detail',detail,
  'status',case when started_at is null then 'Awaiting first run' when started_at<now()-interval '15 minutes' then 'Stale: check scheduler' when lease is not null and started_at<now()-interval '6 minutes' then 'Timed out' when lease is not null then 'Running' when ok then 'Completed' else 'Needs attention' end) order by component) from ig_private.worker_health);
end $$;
revoke all on function public.ig_worker_status() from public,anon;
grant execute on function public.ig_worker_status() to authenticated;


notify pgrst,'reload schema';
