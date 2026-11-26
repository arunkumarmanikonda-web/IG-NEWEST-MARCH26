-- Recruitment records are separate from commercial enquiries and public content.
-- No applicant data, file bytes, or internal notes are exposed through public reads.
create table ig_private.career_settings (
 id boolean primary key default true check(id), enabled boolean not null default true,
 headline text not null default 'Build your next chapter with India Gully.' check(length(headline) between 5 and 160),
 intro text not null default 'Bring your perspective to a team working across real estate, hospitality, retail and commercial advisory.' check(length(intro) between 20 and 3000),
 empty_message text not null default 'There are no open roles at the moment. Please check back for future opportunities.' check(length(empty_message) between 10 and 1000),
 application_intro text not null default 'Tell us about your experience and the work you would like to do with us.' check(length(application_intro) between 10 and 1200),
 version integer not null default 1 check(version>0), updated_at timestamptz not null default now()
);
insert into ig_private.career_settings(id) values(true);
create table ig_private.career_jobs (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(length(slug) between 2 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(length(title) between 3 and 160), department text not null check(length(department) between 2 and 120),
 location text not null check(length(location) between 2 and 160), work_mode text not null check(work_mode in ('onsite','hybrid','remote')),
 employment_type text not null check(employment_type in ('full-time','part-time','contract','internship')),
 summary text not null check(length(summary) between 20 and 1000), description text not null check(length(description) between 40 and 15000),
 responsibilities text not null default '' check(length(responsibilities)<=10000), requirements text not null default '' check(length(requirements)<=10000),
 salary_text text not null default '' check(length(salary_text)<=250), closes_at timestamptz,
 status text not null default 'draft' check(status in ('draft','published','closed','archived')),
 version integer not null default 1 check(version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create table ig_private.career_applications (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique, payload_hash text not null check(length(payload_hash)=64),
 job_id uuid not null references ig_private.career_jobs(id), job_title text not null,
 name text not null check(length(name) between 2 and 120), email text not null check(length(email)<=254 and email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'),
 phone text not null default '' check(length(phone)<=30), current_location text not null default '' check(length(current_location)<=160),
 message text not null check(length(message) between 20 and 5000), portfolio_url text not null default '' check(length(portfolio_url)<=1000),
 resume_name text not null default '' check(length(resume_name)<=180), resume_bytes integer not null default 0 check(resume_bytes between 0 and 2097152),
 resume_sha256 text not null default '', privacy_version text not null default 'recruitment-2026-11-27', consent_at timestamptz not null default now(),
 status text not null default 'new' check(status in ('new','reviewing','shortlisted','interview','hired','declined','withdrawn')),
 notes text not null default '' check(length(notes)<=5000), version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table ig_private.career_resumes (
 application_id uuid primary key references ig_private.career_applications(id) on delete cascade,
 bytes bytea not null check(octet_length(bytes) between 1 and 2097152)
);
create index career_applications_job_created on ig_private.career_applications(job_id,created_at desc);
create index career_jobs_public on ig_private.career_jobs(status,closes_at);
alter table ig_private.career_settings enable row level security;
alter table ig_private.career_jobs enable row level security;
alter table ig_private.career_applications enable row level security;
alter table ig_private.career_resumes enable row level security;
revoke all on ig_private.career_settings,ig_private.career_jobs,ig_private.career_applications,ig_private.career_resumes from public,anon,authenticated;

create function ig_private.careers_allowed() returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and ig_private.allowed('users.manage') and ig_private.staff_verified()
$$;
revoke all on function ig_private.careers_allowed() from public,anon;
grant execute on function ig_private.careers_allowed() to authenticated;

create function ig_private.careers_public() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('settings',to_jsonb(s)-'id'-'updated_at','jobs',
 coalesce((select jsonb_agg(to_jsonb(j)-'version'-'updated_at' order by j.published_at desc,j.id)
 from ig_private.career_jobs j where s.enabled and j.status='published' and (j.closes_at is null or j.closes_at>now())),'[]'::jsonb))
 from ig_private.career_settings s where id=true
$$;
create function public.ig_careers_public() returns jsonb language sql security invoker set search_path='' as $$select ig_private.careers_public()$$;
revoke all on function ig_private.careers_public(),public.ig_careers_public() from public;
grant execute on function ig_private.careers_public(),public.ig_careers_public() to anon,authenticated;

create function ig_private.careers_admin(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action'; s ig_private.career_settings; j ig_private.career_jobs; candidate ig_private.career_applications; d jsonb; b bytea; v integer;
begin
 if not ig_private.careers_allowed() then raise exception 'Verified administrator access is required for Careers.' using errcode='42501';end if;
 if a='status' then
  return jsonb_build_object('settings',(select to_jsonb(x)-'id' from ig_private.career_settings x where id=true),
   'jobs',coalesce((select jsonb_agg(to_jsonb(x) order by x.updated_at desc,x.id) from ig_private.career_jobs x),'[]'::jsonb),
   'applications',coalesce((select jsonb_agg(to_jsonb(x)-'payload_hash'-'request_id'-'resume_sha256' order by x.created_at desc,x.id) from ig_private.career_applications x),'[]'::jsonb));
 elsif a='save_settings' then
  d=p->'settings';
  if jsonb_typeof(d->'enabled') is distinct from 'boolean' then raise exception 'Choose whether the careers page is open';end if;
  select * into s from ig_private.career_settings where id=true for update;
  if (d->>'version')::integer is distinct from s.version then raise exception 'Careers settings changed. Refresh before saving.' using errcode='40001';end if;
  update ig_private.career_settings set enabled=(d->>'enabled')::boolean,headline=trim(d->>'headline'),intro=trim(d->>'intro'),empty_message=trim(d->>'empty_message'),application_intro=trim(d->>'application_intro'),version=version+1,updated_at=now() where id=true returning * into s;
  perform ig_private.record_audit('careers.settings_updated','careers',jsonb_build_object('version',s.version,'enabled',s.enabled));
  return jsonb_build_object('ok',true,'settings',to_jsonb(s)-'id');
 elsif a='save_job' then
  d=p->'job';
  if nullif(d->>'id','') is null then
   insert into ig_private.career_jobs(slug,title,department,location,work_mode,employment_type,summary,description,responsibilities,requirements,salary_text,closes_at,status,published_at)
   values(trim(d->>'slug'),trim(d->>'title'),trim(d->>'department'),trim(d->>'location'),d->>'work_mode',d->>'employment_type',trim(d->>'summary'),trim(d->>'description'),trim(coalesce(d->>'responsibilities','')),trim(coalesce(d->>'requirements','')),trim(coalesce(d->>'salary_text','')),nullif(d->>'closes_at','')::timestamptz,d->>'status',case when d->>'status'='published' then now() else null end) returning * into j;
  else
   select * into j from ig_private.career_jobs where id=(d->>'id')::uuid for update;
   if j.id is null then raise exception 'Role not found' using errcode='P0002';end if;
   if (d->>'version')::integer is distinct from j.version then raise exception 'This role changed. Refresh before saving.' using errcode='40001';end if;
   update ig_private.career_jobs set slug=trim(d->>'slug'),title=trim(d->>'title'),department=trim(d->>'department'),location=trim(d->>'location'),work_mode=d->>'work_mode',employment_type=d->>'employment_type',summary=trim(d->>'summary'),description=trim(d->>'description'),responsibilities=trim(coalesce(d->>'responsibilities','')),requirements=trim(coalesce(d->>'requirements','')),salary_text=trim(coalesce(d->>'salary_text','')),closes_at=nullif(d->>'closes_at','')::timestamptz,status=d->>'status',published_at=case when d->>'status'='published' then coalesce(published_at,now()) else published_at end,updated_at=now(),version=version+1 where id=j.id returning * into j;
  end if;
  perform ig_private.record_audit('careers.role_saved',j.id::text,jsonb_build_object('status',j.status,'version',j.version));
  return jsonb_build_object('ok',true,'job',to_jsonb(j));
 elsif a='update_application' then
  select * into candidate from ig_private.career_applications where id=(p->>'id')::uuid for update;
  if candidate.id is null then raise exception 'Application not found' using errcode='P0002';end if;
  if (p->>'version')::integer is distinct from candidate.version then raise exception 'This application changed. Refresh before saving.' using errcode='40001';end if;
  update ig_private.career_applications set status=p->>'status',notes=coalesce(p->>'notes',''),updated_at=now(),version=version+1 where id=candidate.id returning * into candidate;
  perform ig_private.record_audit('careers.application_updated',candidate.id::text,jsonb_build_object('status',candidate.status,'version',candidate.version));
  return jsonb_build_object('ok',true,'application',to_jsonb(candidate)-'payload_hash'-'request_id'-'resume_sha256');
 elsif a='resume' then
  select * into candidate from ig_private.career_applications where id=(p->>'id')::uuid;
  select bytes into b from ig_private.career_resumes where application_id=candidate.id;
  if b is null then raise exception 'CV not found' using errcode='P0002';end if;
  perform ig_private.record_audit('careers.resume_downloaded',candidate.id::text);
  return jsonb_build_object('name',candidate.resume_name,'base64',encode(b,'base64'));
 end if;
 raise exception 'Choose a careers action';
end $$;
create function public.ig_careers_admin(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.careers_admin(p)$$;
revoke all on function ig_private.careers_admin(jsonb),public.ig_careers_admin(jsonb) from public,anon;
grant execute on function ig_private.careers_admin(jsonb),public.ig_careers_admin(jsonb) to authenticated;

create function ig_private.careers_apply(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare expected text; fingerprint text; old ig_private.career_applications; j ig_private.career_jobs; candidate ig_private.career_applications; b bytea; rate integer; rkey text; enabled boolean;
begin
 select secret_hash into expected from ig_private.ingest_config where id=true;
 if expected is null or secret is null or length(secret)<40 or encode(extensions.digest(secret,'sha256'),'hex')<>expected then raise exception 'Application ingestion unavailable' using errcode='42501';end if;
 if coalesce(p->>'privacy','false')<>'true' or coalesce(p->>'rate_key','')!~'^[a-f0-9]{64}$' then raise exception 'Consent and request context required';end if;
 if p->>'request_id' is null or p->>'job_id' is null then raise exception 'Application and role references required';end if;
 -- Serialize retries and job closure to avoid accepting against stale public data.
 perform pg_advisory_xact_lock(hashtextextended('career:'||(p->>'request_id'),0));
 fingerprint=encode(extensions.digest((p-'rate_key')::text,'sha256'),'hex');
 select * into old from ig_private.career_applications where request_id=(p->>'request_id')::uuid;
 if old.id is not null then
  if old.payload_hash<>fingerprint then raise exception 'Application reference already used' using errcode='23505';end if;
  return jsonb_build_object('id',old.id,'reference',old.id,'saved',true);
 end if;
 select s.enabled into enabled from ig_private.career_settings s where id=true for share;
 select * into j from ig_private.career_jobs where id=(p->>'job_id')::uuid for share;
 if not coalesce(enabled,false) or j.id is null or j.status<>'published' or (j.closes_at is not null and j.closes_at<=now()) then raise exception 'This role is no longer accepting applications' using errcode='P0002';end if;
 if coalesce(p->>'portfolio_url','')<>'' and (p->>'portfolio_url'!~'^https://[^/@[:space:]]+\.[^/@[:space:]]+(/|$)' or length(p->>'portfolio_url')>1000) then raise exception 'Use a public HTTPS profile or CV link';end if;
 if p ? 'resume' then
  if jsonb_typeof(p->'resume') is distinct from 'object' or coalesce(p->'resume'->>'type','')<>'application/pdf' or length(coalesce(p->'resume'->>'name','')) not between 1 and 180 or p->'resume'->>'name'~'[\\/[:cntrl:]]' or lower(p->'resume'->>'name')!~'\.pdf$' or length(coalesce(p->'resume'->>'base64',''))>2796204 then raise exception 'Invalid PDF CV';end if;
  b=decode(p->'resume'->>'base64','base64');
  if octet_length(b) not between 1 and 2097152 or coalesce(p->'resume'->>'sha256','')<>encode(extensions.digest(b,'sha256'),'hex') or octet_length(b)<>(p->'resume'->>'bytes')::integer then raise exception 'Invalid CV integrity';end if;
 end if;
 if b is null and nullif(p->>'portfolio_url','') is null then raise exception 'Add a PDF CV or professional profile link';end if;
 rkey='career:'||(p->>'rate_key');
 insert into ig_private.rate_limits(key,window_start,count) values(rkey,now(),1)
 on conflict(key) do update set window_start=case when rate_limits.window_start<now()-interval '1 hour' then now() else rate_limits.window_start end,count=case when rate_limits.window_start<now()-interval '1 hour' then 1 else rate_limits.count+1 end returning count into rate;
 if rate>5 then raise exception 'Please wait before submitting another application' using errcode='P0429';end if;
 insert into ig_private.career_applications(request_id,payload_hash,job_id,job_title,name,email,phone,current_location,message,portfolio_url,resume_name,resume_bytes,resume_sha256)
 values((p->>'request_id')::uuid,fingerprint,j.id,j.title,trim(p->>'name'),lower(trim(p->>'email')),trim(coalesce(p->>'phone','')),trim(coalesce(p->>'current_location','')),trim(p->>'message'),coalesce(p->>'portfolio_url',''),coalesce(p->'resume'->>'name',''),coalesce(octet_length(b),0),coalesce(p->'resume'->>'sha256','')) returning * into candidate;
 if b is not null then insert into ig_private.career_resumes(application_id,bytes) values(candidate.id,b);end if;
 insert into public.ig_audit(action,entity_id,detail) values('careers.application_received',candidate.id::text,jsonb_build_object('job_id',j.id));
 return jsonb_build_object('id',candidate.id,'reference',candidate.id,'saved',true);
end $$;
create function public.ig_careers_apply(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.careers_apply(secret,p)$$;
revoke all on function ig_private.careers_apply(text,jsonb),public.ig_careers_apply(text,jsonb) from public;
grant execute on function ig_private.careers_apply(text,jsonb),public.ig_careers_apply(text,jsonb) to anon,authenticated;
