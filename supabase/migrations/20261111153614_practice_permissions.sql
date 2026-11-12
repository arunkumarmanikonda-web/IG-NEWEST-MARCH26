-- Practice permissions are a second gate. A role alone never grants practice data.
create function ig_private.valid_practice_grants(g jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text;v jsonb;
begin
 if jsonb_typeof(g) is distinct from 'object' then return false;end if;
 for k,v in select * from jsonb_each(g) loop
  if k not in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate') or jsonb_typeof(v) is distinct from 'array' then return false;end if;
  if exists(select 1 from jsonb_array_elements(v) x where jsonb_typeof(x)<>'string' or x#>>'{}' not in ('read','write','publish','enquiries','data_rooms','commerce')) then return false;end if;
  if jsonb_array_length(v)>0 and not v ? 'read' then return false;end if;
 end loop;
 return true;
end $$;
revoke all on function ig_private.valid_practice_grants(jsonb) from public,anon;
grant execute on function ig_private.valid_practice_grants(jsonb) to authenticated;
alter table public.ig_profiles add column practice_grants jsonb not null default '{}' check(ig_private.valid_practice_grants(practice_grants));
alter table ig_private.staff_invites add column practice_grants jsonb not null default '{}' check(ig_private.valid_practice_grants(practice_grants));
alter table public.ig_content add column practice text not null default 'corporate' check(practice in ('real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate'));
update public.ig_content set practice=case when kind='opportunity' then 'real-estate' when kind='product' then 'horeca' when kind='project' then 'hospitality' else 'corporate' end;
create index ig_content_practice on public.ig_content(practice);
do $$declare g jsonb;begin
 select jsonb_object_agg(k,'["read","write","publish","enquiries","data_rooms","commerce"]'::jsonb) into g from unnest(array['real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate'])k;
 update public.ig_profiles p set practice_grants=g from auth.users u where p.id=u.id and lower(u.email) in ('akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com');
 update ig_private.staff_invites set practice_grants=g where email in ('akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com');
end $$;
create function ig_private.scope_allowed(practice text,capability text) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('admin.read') and exists(select 1 from public.ig_profiles p where p.id=auth.uid() and ('owner'=any(p.roles) or coalesce(p.practice_grants->practice,'[]') ? capability))
$$;
create function ig_private.content_access(item uuid,capability text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ig_content c where c.id=item and ig_private.scope_allowed(c.practice,capability))
$$;
create function ig_private.room_staff(room uuid) returns boolean language sql stable security definer set search_path='' as $$
 select ig_private.allowed('nda.manage') and exists(select 1 from public.ig_data_rooms d where d.id=room and ig_private.content_access(d.content_id,'data_rooms'))
$$;
revoke all on function ig_private.scope_allowed(text,text),ig_private.content_access(uuid,text),ig_private.room_staff(uuid) from public,anon;
grant execute on function ig_private.scope_allowed(text,text),ig_private.content_access(uuid,text),ig_private.room_staff(uuid) to authenticated;
alter policy content_read on public.ig_content to authenticated using(ig_private.allowed('content.read') and ig_private.content_scope(kind) and ig_private.scope_allowed(practice,'read'));
alter policy enquiries_read on public.ig_enquiries to authenticated using(ig_private.allowed('enquiries.manage') and ig_private.scope_allowed(practice,'enquiries'));
alter policy outbox_read on public.ig_outbox to authenticated using(exists(select 1 from public.ig_enquiries e where e.id=enquiry_id));
alter function ig_private.save_content(jsonb) rename to save_content_before_practices;
revoke all on function ig_private.save_content_before_practices(jsonb) from public,anon,authenticated;
create function ig_private.save_content(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;old_practice text;next_practice text;
begin
 if not ig_private.allowed('content.write') then raise exception 'Content permission required' using errcode='42501';end if;
 if nullif(p->>'id','') is not null then
  select practice into old_practice from public.ig_content where id=(p->>'id')::uuid for update;
  if not ig_private.scope_allowed(old_practice,'write') then raise exception 'Practice edit permission required' using errcode='42501';end if;
 end if;
 next_practice=coalesce(nullif(p->>'practice',''),old_practice,case when p->>'kind'='opportunity' then 'real-estate' when p->>'kind'='product' then 'horeca' when p->>'kind'='project' then 'hospitality' else 'corporate' end);
 if not ig_private.scope_allowed(next_practice,'write') then raise exception 'Destination practice edit permission required' using errcode='42501';end if;
 result=ig_private.save_content_before_practices(p);
 update public.ig_content set practice=next_practice where id=(result->>'id')::uuid returning to_jsonb(ig_content.*) into result;
 update public.ig_content_revisions set snapshot=result where content_id=(result->>'id')::uuid and version=(result->>'version')::int;
 return result;
end $$;
create or replace function public.ig_save_content(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.save_content(p)$$;
alter function ig_private.content_action(jsonb) rename to content_action_before_practices;
revoke all on function ig_private.content_action_before_practices(jsonb) from public,anon,authenticated;
create function ig_private.content_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.content_access((p->>'id')::uuid,'publish') then raise exception 'Practice publication permission required' using errcode='42501';end if;
 return ig_private.content_action_before_practices(p);
end $$;
create or replace function public.ig_content_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.content_action(p)$$;

alter function ig_private.users_action(jsonb) rename to users_action_before_practices;
revoke all on function ig_private.users_action_before_practices(jsonb) from public,anon,authenticated;
create function ig_private.users_action(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare own boolean;g jsonb;result jsonb;target public.ig_profiles;
begin
 if not ig_private.allowed('users.manage') then raise exception 'User administration permission required' using errcode='42501';end if;
 select 'owner'=any(roles) into own from public.ig_profiles where id=auth.uid();
 if p->>'action' in ('invite','update') then
  g=coalesce(p->'practice_grants','{}');
  if not ig_private.valid_practice_grants(g) then raise exception 'Invalid practice rights';end if;
  if not own and (g<>'{}'::jsonb or exists(select 1 from jsonb_array_elements_text(p->'roles')r where r not in ('client','vendor'))) then raise exception 'Only the super user may assign staff roles or practice rights' using errcode='42501';end if;
 end if;
 if p->>'action' in ('update','close','revoke_sessions') then
  select * into target from public.ig_profiles where id=(p->>'id')::uuid for update;
  if not own and not target.roles<@array['client','vendor'] then raise exception 'Only the super user may change staff access' using errcode='42501';end if;
 end if;
 result=ig_private.users_action_before_practices(p);
 if p->>'action'='invite' then update ig_private.staff_invites set practice_grants=g where email=lower(trim(p->>'email'));
 elsif p->>'action'='update' then update public.ig_profiles set practice_grants=g where id=(p->>'id')::uuid;end if;
 if p->>'action' in ('invite','update') then perform ig_private.record_audit('user.practice_rights',coalesce(p->>'id',lower(trim(p->>'email'))),jsonb_build_object('grants',g));end if;
 return result;
end $$;
create or replace function public.ig_users_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.users_action(p)$$;
do $$declare s text;begin
 select pg_get_functiondef('ig_private.accept_invitation()'::regprocedure) into s;
 s=replace(s,'set roles=invite.roles,','set roles=invite.roles,practice_grants=invite.practice_grants,');execute s;
 select pg_get_functiondef('ig_private.admin_users()'::regprocedure) into s;
 s=replace(s,'select id,email,roles,accepted_by','select id,email,roles,practice_grants,accepted_by');execute s;
end $$;
create or replace function ig_private.enquiry_update(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.ig_enquiries;assignee uuid=nullif(p->>'assigned_to','')::uuid;
begin
 select * into e from public.ig_enquiries where id=(p->>'id')::uuid for update;
 if not ig_private.allowed('enquiries.manage') or e.id is null or not ig_private.scope_allowed(e.practice,'enquiries') then raise exception 'Practice enquiry permission required' using errcode='42501';end if;
 if assignee is not null and not exists(select 1 from public.ig_profiles where id=assignee and status='active' and ('owner'=any(roles) or (roles&&array['administrator','sales'] and coalesce(practice_grants->e.practice,'[]') ? 'enquiries'))) then raise exception 'Assignee requires access to this practice';end if;
 update public.ig_enquiries set status=p->>'status',assigned_to=assignee where id=e.id;
 perform ig_private.record_audit('enquiry.updated',e.id::text);return jsonb_build_object('ok',true);
end $$;

-- Scope all existing NDA/data-room paths, including privileged RPC internals.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.room_access(uuid)'::regprocedure) into s;
 s=replace(s,$find$ig_private.allowed('nda.manage')$find$,'ig_private.room_staff(room)');execute s;
 select pg_get_functiondef('ig_private.room_download(uuid)'::regprocedure) into s;
 s=replace(s,$find$ig_private.allowed('nda.manage')$find$,'exists(select 1 from public.ig_room_files sf where sf.id=file and ig_private.room_staff(sf.room_id))');execute s;
 select pg_get_functiondef('ig_private.room_authorize(jsonb)'::regprocedure) into s;
 s=replace(s,$find$staff=ig_private.allowed('nda.manage');$find$,'');
 s=replace(s,$find$if f.id is null or not ig_private.room_access(f.room_id)$find$,'staff=ig_private.room_staff(f.room_id); if f.id is null or not ig_private.room_access(f.room_id)');execute s;
end $$;
alter function ig_private.room_manage(jsonb) rename to room_manage_before_practices;
revoke all on function ig_private.room_manage_before_practices(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare room uuid; a text=p->>'action';
begin
 if a='create' then
  if not ig_private.allowed('nda.manage') or not ig_private.content_access((p->>'content_id')::uuid,'data_rooms') then raise exception 'Practice data-room permission required' using errcode='42501';end if;
 else
  if a in ('folder_create','upload_prepare','grant') then room=(p->>'room_id')::uuid;
  elsif a='room_update' then room=(p->>'id')::uuid;
  elsif a='folder_delete' then select room_id into room from public.ig_room_folders where id=(p->>'id')::uuid;
  elsif a in ('upload_complete','file_update') then select room_id into room from public.ig_room_files where id=(p->>'id')::uuid;
  elsif a='grant_update' then select room_id into room from public.ig_room_grants where id=(p->>'id')::uuid;
  elsif a='file_rule' then select room_id into room from public.ig_room_grants where id=(p->>'grant_id')::uuid;end if;
  if room is null or not ig_private.room_staff(room) then raise exception 'Practice data-room permission required' using errcode='42501';end if;
 end if;
 return ig_private.room_manage_before_practices(p);
end $$;
create or replace function public.ig_room_manage(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_manage(p)$$;
alter function ig_private.nda_admin(jsonb) rename to nda_admin_before_practices;
revoke all on function ig_private.nda_admin_before_practices(jsonb) from public,anon,authenticated;
create function ig_private.nda_admin(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item uuid;
begin
 if p->>'action' not in ('template_create','template_publish','template_retire') then
  select content_id into item from public.ig_nda_requests where id=(p->>'id')::uuid;
  if item is null or not ig_private.content_access(item,'data_rooms') then raise exception 'Practice NDA permission required' using errcode='42501';end if;
 end if;
 return ig_private.nda_admin_before_practices(p);
end $$;
create or replace function public.ig_nda_admin(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.nda_admin(p)$$;
alter policy staff_read on public.ig_data_rooms to authenticated using(ig_private.room_staff(id));
alter policy staff_read on public.ig_room_files to authenticated using(ig_private.room_staff(room_id));
alter policy staff_read on public.ig_room_grants to authenticated using(ig_private.room_staff(room_id));
alter policy staff_read on public.ig_room_folders to authenticated using(ig_private.room_staff(room_id));
alter policy staff_read on public.ig_room_file_rules to authenticated using(exists(select 1 from public.ig_room_grants g where g.id=grant_id));
alter policy nda_requests_read on public.ig_nda_requests to authenticated using((user_id=(select auth.uid()) and (select ig_private.valid_identity())) or (ig_private.allowed('nda.manage') and ig_private.content_access(content_id,'data_rooms')));
create or replace function ig_private.admin_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not ig_private.allowed('admin.read') then raise exception 'Staff access and MFA required' using errcode='42501';end if;
 return jsonb_build_object('content',(select count(*) from public.ig_content where ig_private.scope_allowed(practice,'read')),'published',(select count(*) from public.ig_content where published_version is not null and ig_private.scope_allowed(practice,'read')),'enquiries',case when ig_private.allowed('enquiries.manage') then (select count(*) from public.ig_enquiries where status<>'closed' and ig_private.scope_allowed(practice,'enquiries')) else null end,'users',case when ig_private.allowed('users.manage') then (select count(*) from public.ig_profiles) else null end);
end $$;
revoke all on function ig_private.save_content(jsonb),ig_private.content_action(jsonb),ig_private.users_action(jsonb),ig_private.room_manage(jsonb),ig_private.nda_admin(jsonb) from public,anon;
grant execute on function ig_private.save_content(jsonb),ig_private.content_action(jsonb),ig_private.users_action(jsonb),ig_private.room_manage(jsonb),ig_private.nda_admin(jsonb) to authenticated;
-- Keep credentials out of plain settings without rejecting max_output_tokens.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.config_save(jsonb)'::regprocedure) into s;
 s=replace(s,$find$k ~* 'secret|password|token|api_key'$find$,$find$k in ('secret','password','token','api_key','key_secret','webhook_secret','access_token','refresh_token')$find$);execute s;
end $$;
