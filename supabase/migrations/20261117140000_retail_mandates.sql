-- Both sides use normal content revisions and the existing private AI intake.
alter table public.ig_content drop constraint ig_content_kind_check;
alter table public.ig_content add constraint ig_content_kind_check check(kind in
 ('page','practice','opportunity','product','project','article','person','faq','retail_space','retail_requirement'));

do $$ declare s text; revised text; begin
 select pg_get_functiondef('ig_private.content_intake(jsonb)'::regprocedure) into s;
 revised=replace(s,$x$kind not in ('opportunity',$x$,$x$kind not in ('retail_space','retail_requirement','opportunity',$x$);
 if revised=s then raise exception 'Unsupported intake definition';end if;execute revised;
 select pg_get_functiondef('ig_private.content_scope(text)'::regprocedure) into s;
 revised=replace(s,$x$k='opportunity'$x$,$x$k in ('opportunity','retail_space','retail_requirement')$x$);
 if revised=s then raise exception 'Unsupported content scope';end if;execute revised;
 select pg_get_functiondef('ig_private.save_content_unscoped(jsonb)'::regprocedure) into s;
 revised=replace(s,$x$if k<>all(array['city'$x$,$x$if k<>all(array['units','plans','formats','floors','zoning','handover','markets','area_range','frontage','city'$x$);
 if revised=s then raise exception 'Unsupported metadata keys';end if;execute revised;
 select pg_get_functiondef('ig_private.save_content_before_auto_sku(jsonb)'::regprocedure) into s;
 revised=replace(s,'length(d::text)>15000','length((d-''units''-''plans'')::text)>15000');
 if revised=s then raise exception 'Unsupported metadata size check';end if;execute revised;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('ig-retail-plans','ig-retail-plans',false,31457280,array['application/pdf','image/png','image/jpeg','image/webp']);

create function ig_private.retail_plan_upload(path text) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('content.write') and exists(select from public.ig_content c
 where c.id::text=split_part(path,'/',1) and c.kind='retail_space' and c.deleted_at is null and ig_private.content_access(c.id,'write'))
 and path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](pdf|jpg|png|webp)$'
$$;
revoke all on function ig_private.retail_plan_upload(text) from public,anon;
grant execute on function ig_private.retail_plan_upload(text) to authenticated;
create policy retail_plan_insert on storage.objects for insert to authenticated with check(bucket_id='ig-retail-plans' and ig_private.retail_plan_upload(name));
create policy retail_plan_read on storage.objects for select to anon,authenticated using(bucket_id='ig-retail-plans' and exists(
 select 1 from public.ig_public_content c where c.id::text=split_part(name,'/',1) and c.kind='retail_space'
 and c.public_data->'plans' @> jsonb_build_array(jsonb_build_object('path',name))));

create function ig_private.check_retail_data() returns trigger language plpgsql set search_path='' as $$
declare d jsonb=new.public_data; row jsonb; field text; begin
 if new.kind not in ('retail_space','retail_requirement') then
  if d ?| array['units','plans','formats','floors','zoning','handover','markets','area_range','frontage'] then raise exception 'Retail fields require a retail mandate';end if;
  return new;
 end if;
 if new.kind='retail_requirement' and d ?| array['units','plans'] then raise exception 'Drawings and units belong to promoter mandates';end if;
 if d ? 'units' then
  if jsonb_typeof(d->'units')<>'array' or jsonb_array_length(d->'units')>400 then raise exception 'Use a schedule of up to 400 units per mandate';end if;
  for row in select value from jsonb_array_elements(d->'units') loop
   if jsonb_typeof(row)<>'object' or not(row ?& array['unit','floor','area','basis','zone','status']) or
      (row-array['unit','floor','area','basis','zone','status'])<>'{}' or length(trim(row->>'unit'))<1 or
      row->>'status' not in ('To confirm','Available','On hold','Under offer','Leased','Withdrawn') then raise exception 'Invalid unit schedule entry';end if;
   for field in select jsonb_object_keys(row) loop
    if jsonb_typeof(row->field)<>'string' or length(row->>field)>160 then raise exception 'Invalid unit schedule value';end if;
   end loop;
  end loop;
  if exists(select 1 from jsonb_array_elements(d->'units') u group by lower(trim(u->>'floor')),lower(trim(u->>'unit')) having count(*)>1) then raise exception 'A floor and unit reference must be unique';end if;
 end if;
 if d ? 'plans' then
  if jsonb_typeof(d->'plans')<>'array' or jsonb_array_length(d->'plans')>40 then raise exception 'Choose up to 40 public plans';end if;
  for row in select value from jsonb_array_elements(d->'plans') loop
   if jsonb_typeof(row)<>'object' or not(row ?& array['path','label','type']) or (row-array['path','label','type'])<>'{}' or
      coalesce(length(trim(row->>'label')),0) not between 1 and 120 or row->>'type' is null or row->>'type' not in ('Floor drawing','Zoning plan','Unit schedule') or
      split_part(row->>'path','/',1) is distinct from new.id::text or not exists(select 1 from storage.objects o where o.bucket_id='ig-retail-plans' and o.name=row->>'path')
      then raise exception 'Select an approved plan uploaded for this mandate';end if;
  end loop;
 end if;
 return new;
end $$;
-- The caller's storage insert is immutable. The trigger can check existence without exposing a draft copy.
alter function ig_private.check_retail_data() security definer;
revoke all on function ig_private.check_retail_data() from public,anon,authenticated;
create trigger retail_fields before insert or update of public_data on public.ig_content for each row execute function ig_private.check_retail_data();

-- Store the represented client and a separate collaboration room. Intake originals stay staff-only.
create table public.ig_retail_accounts (
 content_id uuid primary key references public.ig_content, engagement_id uuid not null unique references public.ig_engagements
);
create table public.ig_retail_members (
 content_id uuid not null references public.ig_retail_accounts, contact_id uuid not null references public.ig_client_contacts,
 grant_id uuid not null unique references public.ig_room_grants, side text not null check(side in ('Promoter','Brand')),
 dashboard boolean not null default true, allow_upload boolean not null default false, primary key(content_id,contact_id)
);
create index ig_retail_members_contact on public.ig_retail_members(contact_id);
alter table public.ig_retail_accounts enable row level security;
alter table public.ig_retail_members enable row level security;
revoke all on public.ig_retail_accounts, public.ig_retail_members from public,anon,authenticated;
grant select on public.ig_retail_accounts,public.ig_retail_members to authenticated;
create policy retail_account_staff on public.ig_retail_accounts for select to authenticated using(ig_private.allowed('nda.manage') and ig_private.content_access(content_id,'data_rooms'));
create policy retail_member_staff on public.ig_retail_members for select to authenticated using(ig_private.allowed('nda.manage') and ig_private.content_access(content_id,'data_rooms'));

create function ig_private.retail_member_valid(gid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_retail_members m join public.ig_retail_accounts a using(content_id)
 join public.ig_content c on c.id=m.content_id join public.ig_engagements e on e.id=a.engagement_id
 join public.ig_clients principal on principal.id=e.client_id join public.ig_data_rooms d on d.engagement_id=e.id
 join public.ig_room_grants g on g.id=m.grant_id and g.room_id=d.id and g.contact_id=m.contact_id
 where g.id=gid and c.deleted_at is null and c.status<>'archived' and principal.stage<>'archived' and m.dashboard and d.active and e.active and
 e.confidentiality_confirmed and g.active and g.expires_at>now() and ig_private.contact_is_me(g.contact_id))
$$;
-- Respect standard grants for all other project and engagement rooms.
alter function ig_private.grant_valid(uuid) rename to grant_valid_before_retail;
revoke all on function ig_private.grant_valid_before_retail(uuid) from public,anon,authenticated;
create function ig_private.grant_valid(gid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case when exists(select from public.ig_retail_members where grant_id=gid) then ig_private.retail_member_valid(gid)
 else ig_private.grant_valid_before_retail(gid) end
$$;
revoke all on function ig_private.grant_valid(uuid) from public,anon;
grant execute on function ig_private.grant_valid(uuid) to authenticated;
create function public.ig_retail_can_upload(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select from public.ig_retail_members m join public.ig_room_grants g on g.id=m.grant_id where g.room_id=room and m.allow_upload and ig_private.retail_member_valid(g.id))
$$;
create function public.ig_retail_dashboard() returns table(title text,side text,room_id uuid,room_open boolean) language sql stable security definer set search_path='' as $$
 select e.title,m.side,d.id,ig_private.retail_member_valid(m.grant_id) from public.ig_retail_members m
 join public.ig_retail_accounts a using(content_id) join public.ig_content c on c.id=a.content_id
 join public.ig_engagements e on e.id=a.engagement_id join public.ig_clients principal on principal.id=e.client_id
 join public.ig_data_rooms d on d.engagement_id=e.id join public.ig_room_grants g on g.id=m.grant_id
 where m.dashboard and e.active and c.deleted_at is null and c.status<>'archived' and principal.stage<>'archived' and ig_private.contact_is_me(m.contact_id) order by e.title
$$;

create function public.ig_retail_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.ig_content; a public.ig_retail_accounts; e public.ig_engagements; d public.ig_data_rooms; t public.ig_client_contacts;
 g public.ig_room_grants; recipient uuid; new_client jsonb; cid uuid; exp timestamptz; mode text=p->>'mode'; terms text=trim(coalesce(p->>'terms',''));
begin
 select * into c from public.ig_content where id=(p->>'content_id')::uuid for update;
 if c.id is null or c.kind not in ('retail_space','retail_requirement') or c.deleted_at is not null or not ig_private.allowed('nda.manage') or not ig_private.content_access(c.id,'data_rooms')
 then raise exception 'Retail practice administrator required' using errcode='42501';end if;
 select * into a from public.ig_retail_accounts where content_id=c.id;
 if p->>'action'='assign' then
  if a.content_id is not null then raise exception 'A represented client is already assigned';end if;
  if p ? 'new_client' and p->'new_client'<>'null'::jsonb then
   perform pg_advisory_xact_lock(hashtextextended('retail-client:'||lower(trim(p->'new_client'->>'name')),0));
   if exists(select from public.ig_clients where practice='retail-leasing' and lower(trim(name))=lower(trim(p->'new_client'->>'name')) and stage<>'archived') then raise exception 'This organisation already exists. Select the existing client.';end if;
   if jsonb_typeof(p->'new_client'->'contacts') is distinct from 'array' or jsonb_array_length(p->'new_client'->'contacts') not between 1 and 50 then raise exception 'Add at least one named dashboard contact';end if;
   new_client=ig_private.client_manage(jsonb_build_object('action','client_save','name',p->'new_client'->>'name','practice','retail-leasing','stage','engaged',
     'contacts',(select jsonb_agg(jsonb_build_object('name',v->>'name','email',v->>'email','portal_enabled',true,'circulation',false)) from jsonb_array_elements(p->'new_client'->'contacts') v)));
   cid=(new_client->>'id')::uuid;
   p=jsonb_set(p,'{contact_ids}',(select jsonb_agg(v->'id') from jsonb_array_elements(new_client->'contacts') v));
  else cid=nullif(p->>'client_id','')::uuid;end if;
  if not ig_private.client_staff(cid,'rooms') or not exists(select from public.ig_clients where id=cid and stage<>'archived') then raise exception 'Choose an active client in your scope';end if;
  if length(terms)<5 or p->>'confirmed' is distinct from 'true' then raise exception 'Confirm the executed mandate and confidentiality reference';end if;
  insert into public.ig_engagements(client_id,title,service,reference,confidentiality_reference,confidentiality_confirmed,created_by)
   values(cid,trim(p->>'title'),'other',left(terms,120),terms,true,auth.uid()) returning * into e;
  insert into public.ig_data_rooms(engagement_id,title,created_by) values(e.id,e.title,auth.uid()) returning * into d;
  insert into public.ig_retail_accounts values(c.id,e.id);
  if jsonb_typeof(p->'contact_ids') is distinct from 'array' or jsonb_array_length(p->'contact_ids') not between 1 and 50 then raise exception 'Select at least one configured dashboard email for the represented client';end if;
  for recipient in select distinct value::uuid from jsonb_array_elements_text(p->'contact_ids') loop
   if not exists(select from public.ig_client_contacts where id=recipient and client_id=cid) then raise exception 'Choose contacts of the represented client';end if;
   perform public.ig_retail_manage(jsonb_build_object('action','contact','content_id',c.id,'contact_id',recipient,'side',case when c.kind='retail_space' then 'Promoter' else 'Brand' end,'mode','dashboard','expires_at',now()+interval '90 days'));
  end loop;
  perform ig_private.record_audit('retail.client_assigned',c.id::text,jsonb_build_object('client_id',cid));
  return jsonb_build_object('room_id',d.id);
 end if;
 select * into d from public.ig_data_rooms where engagement_id=a.engagement_id;
 if p->>'action' is distinct from 'contact' or not ig_private.room_staff(d.id) then raise exception 'Assign the represented client first';end if;
 select * into t from public.ig_client_contacts where id=(p->>'contact_id')::uuid;
 if not ig_private.client_staff(t.client_id,'rooms') or t.id is null then raise exception 'Contact outside your scope';end if;
 if mode is null or mode not in ('off','dashboard','view','upload') or p->>'side' is null or p->>'side' not in ('Promoter','Brand') then raise exception 'Choose access and party';end if;
 if mode<>'off' and (not t.active or not t.portal_enabled or not exists(select from public.ig_clients where id=t.client_id and stage<>'archived')) then raise exception 'Enable this contact in Global clients first';end if;
 exp=case when mode='off' then now() when mode='dashboard' then now()+interval '90 days' else (p->>'expires_at')::timestamptz end;
 if mode in ('view','upload') and (exp is null or exp<=now() or exp>now()+interval '1 year') then raise exception 'Choose an expiry within one year';end if;
 insert into public.ig_room_grants(room_id,contact_id,active,expires_at,download_mode,created_by)
 values(d.id,t.id,mode in ('view','upload'),exp,'none',auth.uid())
 on conflict(room_id,contact_id) where contact_id is not null do update set active=excluded.active,expires_at=excluded.expires_at,version=public.ig_room_grants.version+1,updated_at=now() returning * into g;
 insert into public.ig_retail_members values(c.id,t.id,g.id,p->>'side',mode<>'off',mode='upload')
 on conflict(content_id,contact_id) do update set side=excluded.side,dashboard=excluded.dashboard,allow_upload=excluded.allow_upload;
 perform ig_private.record_audit('retail.contact_access',c.id::text,jsonb_build_object('contact_id',t.id,'mode',mode));
 return jsonb_build_object('room_id',d.id);
end $$;
revoke all on function ig_private.retail_member_valid(uuid),public.ig_retail_dashboard(),public.ig_retail_can_upload(uuid),public.ig_retail_manage(jsonb) from public,anon;
grant execute on function public.ig_retail_dashboard(),public.ig_retail_can_upload(uuid),public.ig_retail_manage(jsonb) to authenticated;

-- The existing broker checks MIME and file contents before completion. A guest may only
-- submit a new original and complete their own pending upload while the grant remains valid.
alter function ig_private.room_manage(jsonb) rename to room_manage_before_retail;
revoke all on function ig_private.room_manage_before_retail(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare room uuid; f public.ig_room_files; fid uuid;begin
 if p->>'action'='upload_prepare' then room=(p->>'room_id')::uuid;
 elsif p->>'action'='upload_complete' then select * into f from public.ig_room_files where id=(p->>'id')::uuid for update;room=f.room_id;
 end if;
 if room is null or ig_private.room_staff(room) or not public.ig_retail_can_upload(room) then return ig_private.room_manage_before_retail(p);end if;
 if not ig_private.valid_identity() then raise exception 'Verified sign-in required' using errcode='42501';end if;
 if p->>'action'='upload_prepare' then
  if nullif(p->>'preview_for','') is not null then raise exception 'Upload an original contribution';end if;
  fid=gen_random_uuid();
  insert into public.ig_room_files(id,room_id,name,folder,object_key,mime,bytes,download_enabled,created_by)
  values(fid,room,trim(p->>'name'),'Client uploads',room::text||'/'||fid::text,p->>'mime',(p->>'bytes')::bigint,false,auth.uid()) returning * into f;
 else
  if f.created_by is distinct from auth.uid() or f.status<>'pending' or f.version is distinct from (p->>'version')::int
    or ig_private.room_broker_valid(p->>'broker_secret') is not true then raise exception 'Verified upload required' using errcode='42501';end if;
  update public.ig_room_files set status='ready',version=version+1 where id=f.id returning * into f;
 end if;
 perform ig_private.record_audit('retail.'||(p->>'action'),f.id::text);return to_jsonb(f);
end $$;
revoke all on function ig_private.room_manage(jsonb) from public,anon;
grant execute on function ig_private.room_manage(jsonb) to authenticated;
do $$ declare s text; revised text;begin
 select pg_get_functiondef('ig_private.room_authorize(jsonb)'::regprocedure) into s;
 revised=replace(s,'if not staff or f.status','if not (staff or (f.created_by=auth.uid() and public.ig_retail_can_upload(f.room_id))) or f.status');
 if s=revised then raise exception 'Unsupported room authorizer';end if;execute revised;
end $$;

create function ig_private.check_mandate_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.kind in ('retail_space','retail_requirement') and not exists(select from public.ig_retail_accounts a
 join public.ig_engagements e on e.id=a.engagement_id join public.ig_clients c on c.id=e.client_id
 where a.content_id=new.id and e.active and e.confidentiality_confirmed and c.stage<>'archived')
 then raise exception 'Assign the represented client and signed mandate before publishing';end if;
 return new;
end $$;
revoke all on function ig_private.check_mandate_publication() from public,anon,authenticated;
create trigger retail_publish before insert or update on public.ig_public_content for each row execute function ig_private.check_mandate_publication();

create function ig_private.check_mandate_practice() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select from public.ig_content where id=new.id and kind in ('retail_space','retail_requirement') and practice<>'retail-leasing')
 then raise exception 'Retail mandates belong to Retail & Leasing';end if;
 return null;
end $$;
create constraint trigger retail_practice after insert or update of practice on public.ig_content deferrable initially deferred for each row execute function ig_private.check_mandate_practice();
