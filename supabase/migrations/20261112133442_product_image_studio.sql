-- Approved source photos may stay private while a leased worker obtains a short-lived reference URL.
do $migration$
declare s text;
begin
 select pg_get_functiondef('ig_private.provider_prepare(jsonb)'::regprocedure) into s;
 s=replace(s,$find$and state='ready' and published and practice=p->>'practice'$find$,$replace$and state='ready' and practice=p->>'practice'$replace$);
 s=replace(s,'Select a released source image in this practice','Select a ready source image in this practice');
 s=replace(s,$find$ if v ? 'reference_media_id' then$find$,$replace$ if v ? 'product_image_mode' then
  if p->>'practice'<>'horeca' or p->>'kind'<>'image' or v->>'product_image_mode' not in('generate','enhance') or length(coalesce(v->>'product_title','')) not between 2 and 180 or (v->>'product_image_mode'='enhance' and nullif(v->>'reference_media_id','') is null) then raise exception 'Valid product image brief required';end if;
  if v ? 'product_id' and not exists(select 1 from public.ig_content where id=(v->>'product_id')::uuid and kind='product' and practice='horeca') then raise exception 'Invalid HORECA product';end if;
 end if;
 if v ? 'reference_media_id' then$replace$);
 execute s;
end $migration$;
create function ig_private.provider_reference(secret text,p jsonb) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare j public.ig_provider_jobs;path text;
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 select * into j from public.ig_provider_jobs where id=(p->>'id')::uuid and status='submitting' and lease_token=(p->>'lease_token')::uuid and lease_until>now() and provider='runway' and kind='image';
 if j.id is null then raise exception 'Active creative lease required';end if;
 if not exists(select 1 from public.ig_profiles profile where id=j.actor_id and status='active' and not must_change_password and policy_version=(select version from public.ig_policy_releases where current) and roles && array['owner','administrator','publisher','editor','property_manager','procurement_manager','marketing_manager'] and ('owner'=any(roles) or coalesce(practice_grants->j.practice,'[]') ? 'write')) then raise exception 'Source processing permission has been revoked';end if;
 select m.path into path from public.ig_source_media m where m.id=(j.input->>'reference_media_id')::uuid and m.practice=j.practice and m.state='ready';
 if path is null then raise exception 'Source image unavailable';end if;return jsonb_build_object('path',path);
end $$;
create function public.ig_provider_reference(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.provider_reference(secret,p)$$;
revoke all on function ig_private.provider_reference(text,jsonb),public.ig_provider_reference(text,jsonb) from public;grant execute on function ig_private.provider_reference(text,jsonb),public.ig_provider_reference(text,jsonb) to anon,authenticated,service_role;
create or replace function ig_private.save_content_before_intake(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare path text=p->'public_data'->>'image';jid uuid;j public.ig_provider_jobs;alt text=coalesce(p->'public_data'->>'image_alt','');
begin
 if path like '/images/generated/%' then
  if path!~'^/images/generated/[0-9a-f-]{36}\.(png|jpg|webp)$' then raise exception 'Invalid generated image path';end if;
  jid=split_part(split_part(path,'/',4),'.',1)::uuid;
  select * into j from public.ig_provider_jobs where id=jid and status='ready' and kind='image' and published and asset_key=split_part(path,'/',4) and ig_private.scope_allowed(practice,'write');
  if j.id is null then raise exception 'Use a reviewed and released creative from your assigned practice';end if;
  if alt not ilike 'Illustrative AI-generated concept%' and not(p->>'kind'='product' and j.input->>'product_image_mode'='enhance' and j.input ? 'reference_media_id' and alt ilike 'AI-enhanced product image%') then raise exception 'Use the generated or enhanced image disclosure';end if;
 end if;
 return ig_private.save_content_before_generated_media(p);
end $$;
