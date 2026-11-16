create table public.ig_legal_entities(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users,
 kind text not null check(kind in ('company','individual')), legal_name text not null check(length(legal_name) between 2 and 180),
 vital_date date not null, signer text not null check(length(signer) between 2 and 120),
 cin text, gstin text, pan text, id_method text,
 status text not null default 'draft' check(status in ('draft','submitted','verified','needs_changes')),
 revision integer not null default 1, checks jsonb not null default '{}', review_note text not null default '',
 reviewed_by uuid references auth.users, reviewed_at timestamptz, consent_at timestamptz not null default now(),
 consent_version text not null default 'identity-review-v1',
 constraint ig_entity_identifiers check (
  (kind='company' and cin is not null and cin ~ '^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$' and gstin is not null and gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' and pan is null and id_method is null)
  or (kind='individual' and pan is not null and pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' and id_method is not null and id_method in ('passport','aadhaar_offline') and cin is null and gstin is null))
);
create unique index ig_entity_company_owner on public.ig_legal_entities(user_id,cin) where kind='company';
create unique index ig_entity_person_owner on public.ig_legal_entities(user_id,pan) where kind='individual';
create index ig_entity_queue on public.ig_legal_entities(status,consent_at);
create index ig_entity_owner on public.ig_legal_entities(user_id);
create index ig_entity_reviewer on public.ig_legal_entities(reviewed_by);
create function ig_private.kyc_reviewer() returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('nda.manage') and ig_private.staff_verified() and exists(select from public.ig_profiles where id=auth.uid() and roles && array['owner','administrator']::text[])
$$;
alter table public.ig_legal_entities enable row level security;
revoke all on public.ig_legal_entities from public,anon,authenticated;
grant select on public.ig_legal_entities to authenticated;
create policy identity_read on public.ig_legal_entities for select to authenticated using (
 (user_id=(select auth.uid()) and (select ig_private.allowed('account'))) or (select ig_private.kyc_reviewer())
);
create function ig_private.kyc_slots(e public.ig_legal_entities) returns text[] language sql immutable set search_path='' as $$
 select case when e.kind='company' then array['incorporation','gst','resolution'] else array['pan',e.id_method] end
$$;
-- A review authorisation records who requested the file. No document contents or identity numbers enter the audit log.
create index ig_kyc_document_audit on public.ig_audit(actor_id,entity_id,created_at desc) where action='kyc.review_document';
insert into storage.buckets(id,name,public,allowed_mime_types) values('client-kyc','client-kyc',false,array['application/pdf','image/png','image/jpeg']);
create function ig_private.kyc_object(object_name text,writing boolean) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select from public.ig_legal_entities e,unnest(ig_private.kyc_slots(e)) slot where slot<>'aadhaar_offline'
 and object_name=concat_ws('/',e.user_id,e.id,e.revision,slot) and (
 (e.user_id=auth.uid() and ig_private.allowed('account') and (not writing or e.status='draft' and not e.checks ? slot)) or
 (not writing and e.status='submitted' and e.user_id<>auth.uid() and ig_private.kyc_reviewer() and exists(
   select from public.ig_audit audit where audit.action='kyc.review_document'
   and audit.actor_id=auth.uid() and audit.entity_id=e.id::text and audit.created_at>now()-interval '2 minutes'
   and audit.detail->>'slot'=slot and audit.detail->>'revision'=e.revision::text
 ))))
$$;
revoke all on function ig_private.kyc_reviewer(),ig_private.kyc_object(text,boolean),ig_private.kyc_slots(public.ig_legal_entities) from public,anon;
grant execute on function ig_private.kyc_reviewer(),ig_private.kyc_object(text,boolean) to authenticated;
create policy private_kyc_upload on storage.objects for insert to authenticated with check(bucket_id='client-kyc' and ig_private.kyc_object(name,true));
create policy private_kyc_read on storage.objects for select to authenticated using(bucket_id='client-kyc' and ig_private.kyc_object(name,false));

create function public.ig_client_identity(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.ig_legal_entities; a text=p->>'action'; k text=p->>'kind'; n text=trim(p->>'legal_name'); s text=trim(p->>'signer'); d date; slot text;
begin
 if not ig_private.allowed('account') then raise exception 'Complete account registration first' using errcode='42501'; end if;
 if a='list' then return coalesce((select jsonb_agg(jsonb_build_object('id',id,'legal_name',legal_name,'status',status,'kind',kind,'signer',signer) order by legal_name) from public.ig_legal_entities where user_id=auth.uid()),'[]'); end if;
 if a in ('create','edit') then
  if p->>'consent' is distinct from 'true' then raise exception 'Consent to identity review is required'; end if;
  d=(p->>'vital_date')::date;
  if d is null or d>current_date or (k='individual' and d>(current_date-interval '18 years')::date) then raise exception 'Check the date of birth or incorporation';end if;
  if k='individual' then s=n;end if;
  if a='create' then
   insert into public.ig_legal_entities(user_id,kind,legal_name,vital_date,signer,cin,gstin,pan,id_method)
   values(auth.uid(),k,n,d,s,upper(nullif(trim(p->>'cin'),'')),upper(nullif(trim(p->>'gstin'),'')),upper(nullif(trim(p->>'pan'),'')),nullif(p->>'id_method','')) returning * into e;
  else
   update public.ig_legal_entities set kind=k,legal_name=n,vital_date=d,signer=s,cin=upper(nullif(trim(p->>'cin'),'')),gstin=upper(nullif(trim(p->>'gstin'),'')),pan=upper(nullif(trim(p->>'pan'),'')),id_method=nullif(p->>'id_method',''),status='draft',revision=revision+1,checks='{}',consent_at=now(),review_note='',reviewed_at=null,reviewed_by=null where id=(p->>'id')::uuid and user_id=auth.uid() and status in ('draft','needs_changes') and revision=(p->>'revision')::int returning * into e;
  end if;
 elsif a='submit' then
  select * into e from public.ig_legal_entities where id=(p->>'id')::uuid and user_id=auth.uid() and revision=(p->>'revision')::int and status='draft' for update;
  if e.id is null then raise exception 'Reload the legal name before submitting';end if;
  foreach slot in array ig_private.kyc_slots(e) loop
   if not e.checks ? slot then raise exception 'Complete every evidence check first';end if;
   if slot='aadhaar_offline' and e.checks->slot->>'status'<>'matched' then raise exception 'Verify the offline identity document or select passport';end if;
  end loop;
  update public.ig_legal_entities set status='submitted' where id=e.id;
 elsif a='review_document' then
  if not ig_private.kyc_reviewer() then raise exception 'Identity review permission required' using errcode='42501';end if;
  slot=p->>'slot';
  select * into e from public.ig_legal_entities where id=(p->>'id')::uuid and status='submitted'
    and revision=(p->>'revision')::int and user_id<>auth.uid();
  if e.id is null or slot is null or slot='aadhaar_offline' or not slot=any(ig_private.kyc_slots(e)) or not e.checks ? slot then
   raise exception 'Document unavailable for review' using errcode='42501';
  end if;
  perform ig_private.record_audit('kyc.review_document',e.id::text,jsonb_build_object('revision',e.revision,'slot',slot));
  return jsonb_build_object('path',concat_ws('/',e.user_id,e.id,e.revision,slot));
 elsif a in ('verify','return') then
  if not ig_private.kyc_reviewer() then raise exception 'Identity review permission required' using errcode='42501';end if;
  if length(coalesce(p->>'note',''))>1000 or (a='return' and length(trim(coalesce(p->>'note','')))<3) or (a='verify' and p->>'reviewed' is distinct from 'true') then raise exception 'Confirm your review or explain the correction';end if;
  update public.ig_legal_entities set status=case when a='verify' then 'verified' else 'needs_changes' end,
  reviewed_at=now(),reviewed_by=auth.uid(),review_note=coalesce(p->>'note','') where id=(p->>'id')::uuid and status='submitted' and user_id<>auth.uid() and revision=(p->>'revision')::int returning * into e;
 else raise exception 'Unknown identity operation';end if;
 if e.id is null then raise exception 'Record changed or unavailable';end if;
 perform ig_private.record_audit('kyc.'||a,e.id::text,jsonb_build_object('revision',e.revision));
 return jsonb_build_object('id',e.id,'revision',e.revision);
end $$;
create function public.ig_kyc_check_result(secret text,p jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare e public.ig_legal_entities; slot text=p->>'slot'; v jsonb=p->'result';
begin
 if not ig_private.integration_server(secret) or not ig_private.allowed('account') then raise exception 'Verified processing session required' using errcode='42501';end if;
 select * into e from public.ig_legal_entities where id=(p->>'id')::uuid and user_id=auth.uid() and status='draft' and revision=(p->>'revision')::int for update;
 if e.id is null or not slot=any(ig_private.kyc_slots(e)) or v->>'status' not in ('matched','review') then raise exception 'Verification changed. Reload the form.';end if;
 if slot<>'aadhaar_offline' and not exists(select from storage.objects where bucket_id='client-kyc' and name=concat_ws('/',e.user_id,e.id,e.revision,slot)) then raise exception 'Evidence is missing';end if;
 update public.ig_legal_entities set checks=checks||jsonb_build_object(slot,v) where id=e.id;
 return true;
end $$;
revoke all on function public.ig_client_identity(jsonb),public.ig_kyc_check_result(text,jsonb) from public,anon;
grant execute on function public.ig_client_identity(jsonb),public.ig_kyc_check_result(text,jsonb) to authenticated;

alter table public.ig_nda_templates add column content_id uuid references public.ig_content;
drop index public.ig_nda_one_active;
create unique index ig_global_nda_active on public.ig_nda_templates(status) where status='active' and content_id is null;
create unique index ig_project_nda_active on public.ig_nda_templates(content_id) where status='active' and content_id is not null;
create index ig_template_project on public.ig_nda_templates(content_id);
alter table public.ig_nda_requests add column legal_entity_id uuid references public.ig_legal_entities;
create index ig_nda_entity on public.ig_nda_requests(legal_entity_id);
-- Preserve prior receipts. Project terms have their own release sequence independent of global drafts.
do $$
declare spec text=pg_get_functiondef('ig_private.nda_admin_before_practices(jsonb)'::regprocedure);
begin
 if position('insert into public.ig_nda_templates(version,title,body,created_by)' in spec)=0 then raise exception 'Unexpected NDA release function';end if;
 spec=replace(spec,'insert into public.ig_nda_templates(version,title,body,created_by) values(trim(p->>''version''),trim(p->>''title''),p->>''body'',auth.uid())','insert into public.ig_nda_templates(version,title,body,created_by,content_id) values(trim(p->>''version''),trim(p->>''title''),p->>''body'',auth.uid(),nullif(p->>''content_id'','''')::uuid)');
 spec=replace(spec,'set status=''retired'' where status=''active''','set status=''retired'' where status=''active'' and content_id is not distinct from t.content_id');
 execute spec;
end $$;
create function public.ig_project_disclaimer() returns text language sql immutable set search_path='' as $$
 select 'I am authorised to sign for the selected legal name. I have read and accept this project''s confidentiality agreement. By clicking Accept and Submit, I sign this agreement electronically.'::text
$$;
revoke all on function public.ig_project_disclaimer() from public,anon;
grant execute on function public.ig_project_disclaimer() to authenticated;

create function ig_private.require_project_signature() returns trigger language plpgsql set search_path='' as $$
declare e public.ig_legal_entities; t public.ig_nda_templates; body text;
begin
 if new.accepted_at is not null and old.accepted_at is null and (new.legal_entity_id is not null or exists(select from public.ig_data_rooms where content_id=new.content_id and active)) then
  select * into e from public.ig_legal_entities where id=new.legal_entity_id and user_id=new.user_id and status='verified' for share;
  select * into t from public.ig_nda_templates where id=new.template_id and content_id=new.content_id and status='active' for share;
  if e.id is null or t.id is null or new.signed_name<>e.signer then raise exception 'Choose a verified legal name and the current project agreement';end if;
  body=concat_ws(E'\n',new.public_title,'Recipient: '||e.legal_name,'Authorised signatory: '||e.signer,'Purpose: '||new.purpose,'',t.body);
  new.organisation=case when e.kind='company' then e.legal_name else '' end;
  new.agreement_snapshot=new.agreement_snapshot||jsonb_build_object('body',body,'sha256',encode(extensions.digest(convert_to(body,'UTF8'),'sha256'),'hex'),'legal_entity',e.id,'legal_name',e.legal_name,'kyc_revision',e.revision,'content_id',new.content_id,'method','project-disclaimer-acceptance','disclaimer',public.ig_project_disclaimer());
 end if;
 if new.template_id is not null and exists(select from public.ig_nda_templates where id=new.template_id and content_id is not null and content_id<>new.content_id) then raise exception 'Agreement belongs to a different project';end if;
 return new;
end $$;
create trigger scope_project_signature before update on public.ig_nda_requests for each row execute function ig_private.require_project_signature();

create function public.ig_project_signature(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.ig_legal_entities; r public.ig_nda_requests; c public.ig_public_content; t public.ig_nda_templates;
begin
 if not ig_private.allowed('account') then raise exception 'Complete verified registration first' using errcode='42501';end if;
 select * into c from public.ig_public_content where kind in ('opportunity','project') and kind=coalesce(p->>'kind','opportunity') and slug=p->>'slug';
 perform 1 from public.ig_data_rooms where active and content_id=c.id for share;
 if not found then raise exception 'This project data room is unavailable';end if;
 if p->>'action'='request' then
  insert into public.ig_nda_requests(user_id,content_id,public_title,purpose) values(auth.uid(),c.id,c.title,trim(p->>'purpose')) on conflict(user_id,content_id) do nothing;
  select * into strict r from public.ig_nda_requests where user_id=auth.uid() and content_id=c.id;
  perform ig_private.record_audit('nda.requested',r.id::text);
  return to_jsonb(r);
 end if;
 select * into e from public.ig_legal_entities where user_id=auth.uid() and id=(p->>'entity_id')::uuid and status='verified' for share;
 if e.id is null or p->'accepted' is distinct from 'true'::jsonb or p->>'disclaimer' is distinct from public.ig_project_disclaimer() then
  raise exception 'Select a verified legal name and accept the current project disclaimer';
 end if;
 select * into t from public.ig_nda_templates where id=(p->>'template_id')::uuid and status='active' and content_id=c.id for share;
 if t.id is null then raise exception 'The agreement has changed. Review its current version.';end if;
 insert into public.ig_nda_requests(user_id,content_id,public_title,purpose,legal_entity_id) values(auth.uid(),c.id,c.title,trim(p->>'purpose'),e.id) on conflict(user_id,content_id) do nothing;
 select * into r from public.ig_nda_requests where user_id=auth.uid() and content_id=c.id for update;
 if r.status in ('accepted','approved') and r.legal_entity_id=e.id and r.template_id=t.id and r.purpose=trim(p->>'purpose') then return to_jsonb(r);end if;
 if r.status<>'requested' then raise exception 'A disclosure decision or signature already exists for this project. Check your requests.';end if;
 update public.ig_nda_requests set legal_entity_id=e.id,purpose=trim(p->>'purpose') where id=r.id;
 return ig_private.nda_action(p||jsonb_build_object('action','accept','id',r.id,'version',r.version,'signed_name',e.signer,'organisation',e.legal_name,'agreed',true,'authority',true));
end $$;
revoke all on function public.ig_project_signature(jsonb) from public,anon;
grant execute on function public.ig_project_signature(jsonb) to authenticated;
-- Include the entity in the existing idempotency digest, and freeze the name on the RFQ.
alter table public.ig_procurement_requests add column legal_entity_id uuid references public.ig_legal_entities;
create index ig_procurement_entity on public.ig_procurement_requests(legal_entity_id);
do $$
declare spec text=pg_get_functiondef('ig_private.procurement(jsonb)'::regprocedure); needle text='if a=''submit'' then';
begin
 if position(needle in spec)=0 then raise exception 'Unexpected procurement function';end if;
 spec=replace(spec,needle,needle||$part$
  if nullif(p->>'entity_id','') is not null then
   if not exists(select from public.ig_legal_entities where id=(p->>'entity_id')::uuid and user_id=auth.uid() and status='verified' for share) then raise exception 'Select your own verified legal name';end if;
  end if;
 $part$);
 if position('return to_jsonb(r);' in spec)=0 then raise exception 'Unknown procurement receipt';end if;
 -- Bind at insertion; other operations and retries preserve the original identity.
 spec=replace(spec,'insert into public.ig_procurement_requests(', 'insert into public.ig_procurement_requests(legal_entity_id,');
 spec=regexp_replace(spec,'(insert into public.ig_procurement_requests\([^;]*?\)[[:space:]]*values[[:space:]]*\()', '\1nullif(p->>''entity_id'','''')::uuid,','i');
 execute spec;
end $$;
-- Store the reviewed purchasing name on the request as it stood at submission.
create function ig_private.procurement_entity_snapshot() returns trigger language plpgsql set search_path='' as $$
declare e public.ig_legal_entities;
begin
 if new.legal_entity_id is not null then
  select * into strict e from public.ig_legal_entities where id=new.legal_entity_id and user_id=new.user_id and status='verified';
  new.requirement=new.requirement||jsonb_build_object('legal_name',e.legal_name,'legal_entity_id',e.id);
 end if;
 return new;
end $$;
create trigger procurement_entity_snapshot before insert on public.ig_procurement_requests for each row execute function ig_private.procurement_entity_snapshot();
-- Prepare reviewable project copies of the existing house wording. Only the owner releases them.
insert into public.ig_nda_templates(version,title,body,content_id)
 select 'project-'||c.id::text||'-v1',left(c.title||' · Confidentiality Agreement',180),t.body,c.id
 from public.ig_public_content c join public.ig_data_rooms r on r.content_id=c.id and r.active
 cross join lateral (select body from public.ig_nda_templates where content_id is null and status in ('active','draft') order by (status='active') desc,created_at desc limit 1)t
 where c.kind in ('opportunity','project') and not exists(select from public.ig_nda_templates old where old.content_id=c.id);

do $$
declare spec text=pg_get_functiondef('ig_private.room_manage_core(jsonb)'::regprocedure);
begin
 spec=replace(spec,'and kind=''opportunity'') then raise exception ''Choose a real estate opportunity''','and kind in (''opportunity'',''project'')) then raise exception ''Choose a listing or project''');
 execute spec;
end $$;

create function public.ig_edit_project_nda(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.ig_nda_templates;
begin
 if not ig_private.allowed('nda.manage') or not exists(select from public.ig_profiles where id=auth.uid() and 'owner'=any(roles)) then raise exception 'Owner access required' using errcode='42501';end if;
 update public.ig_nda_templates set title=trim(p->>'title'),body=p->>'body'
 where id=(p->>'id')::uuid and status='draft' and content_id is not null and body=p->>'original_body' and title=p->>'original_title' returning * into t;
 if t.id is null then raise exception 'The draft changed. Reload before saving.' using errcode='40001';end if;
 perform ig_private.record_audit('nda.draft_edited',t.id::text);
 return jsonb_build_object('id',t.id);
end $$;
revoke all on function public.ig_edit_project_nda(jsonb) from public,anon;
grant execute on function public.ig_edit_project_nda(jsonb) to authenticated;
