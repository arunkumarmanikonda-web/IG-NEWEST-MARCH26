create table public.ig_nda_templates (
 id uuid primary key default gen_random_uuid(),
 version text not null unique check(length(version) between 1 and 60),
 title text not null check(length(title) between 1 and 180),
 body text not null check(length(body) between 100 and 30000),
 status text not null default 'draft' check(status in ('draft','active','retired')),
 created_at timestamptz not null default now(),
 published_at timestamptz,
 created_by uuid references auth.users(id)
);
create unique index ig_nda_one_active on public.ig_nda_templates(status) where status='active';
create index ig_nda_template_creator on public.ig_nda_templates(created_by);
create table public.ig_nda_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 content_id uuid not null references public.ig_content(id),
 public_title text not null,
 purpose text not null check(length(purpose) between 10 and 2000),
 status text not null default 'requested' check(status in ('requested','accepted','approved','declined','revoked','withdrawn')),
 template_id uuid references public.ig_nda_templates(id),
 agreement_snapshot jsonb,
 signed_name text, organisation text,
 accepted_at timestamptz, reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 response_note text not null default '' check(length(response_note)<=2000),
 version integer not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(user_id,content_id),
 check((accepted_at is null and agreement_snapshot is null and template_id is null) or
       (accepted_at is not null and agreement_snapshot is not null and template_id is not null and length(signed_name)>1)),
 check(status not in ('accepted','approved') or accepted_at is not null)
);
create index ig_nda_request_content on public.ig_nda_requests(content_id);
create index ig_nda_request_template on public.ig_nda_requests(template_id);
create index ig_nda_request_reviewer on public.ig_nda_requests(reviewed_by);
alter table public.ig_nda_templates enable row level security;
alter table public.ig_nda_requests enable row level security;
revoke all on public.ig_nda_templates,public.ig_nda_requests from anon,authenticated;
grant select on public.ig_nda_templates,public.ig_nda_requests to authenticated;
create policy nda_templates_read on public.ig_nda_templates for select to authenticated using(
 (status='active' and (select ig_private.allowed('account'))) or (select ig_private.allowed('nda.manage'))
 or (select ig_private.allowed('account')) and exists(select 1 from public.ig_nda_requests r where r.user_id=(select auth.uid()) and r.template_id=id)
);
create policy nda_requests_read on public.ig_nda_requests for select to authenticated using(
 (user_id=(select auth.uid()) and (select ig_private.allowed('account'))) or (select ig_private.allowed('nda.manage'))
);

create function ig_private.nda_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_nda_requests; t public.ig_nda_templates; c public.ig_public_content; sign_name text; org text;
begin
 if not ig_private.allowed('account') then raise exception 'Verified account and current policy acceptance required' using errcode='42501'; end if;
 if p->>'action'='request' then
  select * into c from public.ig_public_content where kind='opportunity' and slug=p->>'slug';
  if c.id is null then raise exception 'Published opportunity not found'; end if;
  insert into public.ig_nda_requests(user_id,content_id,public_title,purpose)
  values(auth.uid(),c.id,c.title,trim(coalesce(p->>'purpose','')))
  on conflict(user_id,content_id) do nothing;
  select * into r from public.ig_nda_requests where user_id=auth.uid() and content_id=c.id;
  perform ig_private.record_audit('nda.requested',r.id::text);
  return to_jsonb(r);
 end if;
 select * into r from public.ig_nda_requests where id=(p->>'id')::uuid and user_id=auth.uid() for update;
 if r.id is null then raise exception 'Request not found' using errcode='42501'; end if;
 if r.version is distinct from (p->>'version')::int then raise exception 'Request changed. Reload before continuing.' using errcode='40001'; end if;
 if p->>'action'='accept' then
  if r.status<>'requested' then raise exception 'This request cannot accept an agreement in its current state'; end if;
  select * into t from public.ig_nda_templates where id=(p->>'template_id')::uuid and status='active' for share;
  if t.id is null then raise exception 'Agreement changed. Reload and review the current version.' using errcode='40001'; end if;
  if coalesce(p->>'agreed','false')<>'true' or coalesce(p->>'authority','false')<>'true' then raise exception 'Confirm acceptance and signing authority'; end if;
  sign_name=trim(coalesce(p->>'signed_name','')); org=trim(coalesce(p->>'organisation',''));
  if length(sign_name) not between 2 and 120 or length(org)>180 then raise exception 'Enter a valid full name and organisation'; end if;
  update public.ig_nda_requests set status='accepted',template_id=t.id,signed_name=sign_name,organisation=org,accepted_at=now(),
  agreement_snapshot=jsonb_build_object('title',t.title,'version',t.version,'body',t.body,'sha256',encode(extensions.digest(convert_to(t.body,'UTF8'),'sha256'),'hex'),'recipient_email',(select email from auth.users where id=auth.uid()),'opportunity',r.public_title,'purpose',r.purpose,'method','typed-name-and-explicit-acceptance','authority_confirmed',true),
  updated_at=now(),version=version+1 where id=r.id returning * into r;
 elsif p->>'action'='withdraw' then
  if r.status in ('withdrawn','revoked') then raise exception 'Request already closed'; end if;
  update public.ig_nda_requests set status='withdrawn',updated_at=now(),version=version+1 where id=r.id returning * into r;
 else raise exception 'Unsupported action'; end if;
 perform ig_private.record_audit('nda.'||(p->>'action'),r.id::text,jsonb_build_object('template',r.template_id,'version',r.version));
 return to_jsonb(r);
end $$;
create function public.ig_nda_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.nda_action(p)$$;

create function ig_private.nda_admin(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_nda_requests; t public.ig_nda_templates; target text;
begin
 if not ig_private.allowed('nda.manage') then raise exception 'Owner or administrator permission and MFA required' using errcode='42501'; end if;
 if p->>'action' in ('template_create','template_publish','template_retire') then
  if not exists(select 1 from public.ig_profiles where id=auth.uid() and 'owner'=any(roles)) then raise exception 'Only the owner can manage legal agreement versions' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(7193322);
  if p->>'action'='template_create' then
   insert into public.ig_nda_templates(version,title,body,created_by) values(trim(p->>'version'),trim(p->>'title'),p->>'body',auth.uid()) returning * into t;
  else
   select * into t from public.ig_nda_templates where id=(p->>'id')::uuid for update;
   if t.id is null then raise exception 'Agreement not found'; end if;
   if p->>'action'='template_publish' then
    if t.status<>'draft' then raise exception 'Only a draft agreement can be published'; end if;
    if coalesce(p->>'legal_reviewed','false')<>'true' then raise exception 'Confirm legal review before publishing'; end if;
    update public.ig_nda_templates set status='retired' where status='active';
    update public.ig_nda_templates set status='active',published_at=now() where id=t.id returning * into t;
   else
    update public.ig_nda_templates set status='retired' where id=t.id returning * into t;
   end if;
  end if;
  perform ig_private.record_audit('nda.'||(p->>'action'),t.id::text,jsonb_build_object('version',t.version));
  return to_jsonb(t);
 end if;
 select * into r from public.ig_nda_requests where id=(p->>'id')::uuid for update;
 if r.id is null then raise exception 'Request not found'; end if;
 if r.version is distinct from (p->>'version')::int then raise exception 'Request changed. Reload before continuing.' using errcode='40001'; end if;
 target=p->>'status';
 if target not in ('approved','declined','revoked') or target is null then raise exception 'Unsupported review decision'; end if;
 if r.status in ('withdrawn','revoked') then raise exception 'Closed requests cannot be approved'; end if;
 if target='approved' and (r.accepted_at is null or not exists(select 1 from public.ig_nda_templates where id=r.template_id and status='active')) then raise exception 'Acceptance of the active agreement is required before approval'; end if;
 update public.ig_nda_requests set status=target,response_note=coalesce(p->>'note',''),reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now(),version=version+1 where id=r.id returning * into r;
 perform ig_private.record_audit('nda.reviewed',r.id::text,jsonb_build_object('decision',target,'version',r.version));
 return to_jsonb(r);
end $$;
create function public.ig_nda_admin(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.nda_admin(p)$$;
revoke all on function ig_private.nda_action(jsonb),ig_private.nda_admin(jsonb),public.ig_nda_action(jsonb),public.ig_nda_admin(jsonb) from public,anon;
grant execute on function ig_private.nda_action(jsonb),ig_private.nda_admin(jsonb),public.ig_nda_action(jsonb),public.ig_nda_admin(jsonb) to authenticated;

insert into public.ig_nda_templates(version,title,body) values('draft-2026-11-11','Opportunity confidentiality undertaking',$terms$Purpose and parties
This undertaking is addressed to Vivacious Entertainment and Hospitality Private Limited, operating as India Gully. The recipient identified in the acceptance record requests information solely to assess the specific opportunity and purpose recorded with that request.

Confidential information
Information provided by India Gully or an authorised disclosing party in connection with that assessment, including property identity, commercial terms, financial information, business plans, documents and discussions, is confidential where marked confidential or reasonably understood to be confidential.

Permitted use and recipients
The recipient will use the information only for the stated assessment, protect it with reasonable care, and disclose it only to professional advisers or personnel who need it for that purpose and are bound by confidentiality obligations. The recipient is responsible for disclosures made by those persons.

Exclusions and required disclosure
This undertaking does not cover information demonstrably already public without a breach, lawfully held before disclosure, independently developed, or lawfully received from a third party without a confidentiality restriction. Disclosure required by law or an authorised regulator is permitted, with prior notice to India Gully where legally permitted and limited to what is required.

Return and retention
On written request, the recipient will return or delete confidential information, except records required by law or professional retention duties. Any retained confidential information remains subject to this undertaking.

Duration
Confidentiality obligations continue for three years from the recorded acceptance date. This undertaking does not transfer ownership of information or grant a licence beyond the stated evaluation purpose.

No transaction commitment
Disclosure does not create an offer, guarantee of accuracy, commitment to transact, exclusivity or authority to approach a property owner. Any transaction, reliance, access conditions or additional restrictions require separate documentation with the relevant parties.

Governing law and disputes
This undertaking is governed by the laws of India. Courts with competent jurisdiction in New Delhi will have jurisdiction, subject to applicable law.

Electronic acceptance
The recipient confirms the full name and organisation recorded, authority to make this undertaking, and acceptance of the displayed version. The system records the agreement text, version, recipient account and time of acceptance. Acceptance does not itself grant access to restricted documents; India Gully must approve each disclosure request.$terms$);
