create table ig_private.website_drafts (
  section text primary key, version integer not null, content jsonb not null,
  edited_at timestamptz not null default now()
);
create table ig_private.website_releases (
  section text not null references ig_private.website_drafts(section), version integer not null,
  content jsonb not null, effective_at timestamptz not null,
  primary key(section,version)
);
alter table ig_private.website_drafts enable row level security;
alter table ig_private.website_releases enable row level security;
revoke all on ig_private.website_drafts, ig_private.website_releases from public,anon,authenticated;
-- Preserve revisions created by the existing CMS before scheduled releases were installed.
insert into ig_private.website_drafts(section,version,content)
select substr(slug,16),version,body::jsonb from public.ig_content
where kind='page' and practice='corporate' and left(slug,15)='website-editor-' and body is json;
insert into ig_private.website_releases(section,version,content,effective_at)
select d.section,p.version,p.body::jsonb,p.published_at from public.ig_public_content p
join ig_private.website_drafts d on p.kind='page' and p.slug='website-editor-'||d.section
where p.body is json;
create function ig_private.live_website() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_object_agg(section,content),'{}'::jsonb) from
    (select distinct on (section) section,content from ig_private.website_releases where effective_at<=now()
     order by section,effective_at desc,version desc) live
$$;
revoke all on function ig_private.live_website() from public;
grant execute on function ig_private.live_website() to anon,authenticated;
create function public.ig_live_website() returns jsonb language sql stable security invoker set search_path='' as $$select ig_private.live_website()$$;
revoke all on function public.ig_live_website() from public;
grant execute on function public.ig_live_website() to anon,authenticated;

create function ig_private.website_edit(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare k text=p->>'section'; op text=p->>'action'; old_version int; next_version int; effective timestamptz;
begin
  if auth.uid() is null or not ig_private.allowed('content.write') or not ig_private.scope_allowed('corporate','write') then
    raise exception 'Website editing permission required' using errcode='42501';
  end if;
  if op='list' then
    return (select coalesce(jsonb_object_agg(d.section,to_jsonb(d)||jsonb_build_object('scheduled_at',
      (select max(effective_at) from ig_private.website_releases r where r.section=d.section and effective_at>now()),
      'live_version',(select version from ig_private.website_releases r where r.section=d.section and effective_at<=now() order by effective_at desc,version desc limit 1))),'{}'::jsonb) from ig_private.website_drafts d);
  end if;
  if op is null or op not in ('save','publish') or k is null or k not in ('home','home-layout','about','journey','principles','navigation','disciplines','practice-detail','practices','projects','horeca','opportunities','insights','our-work','leadership','contact','valuation','nda','search') then raise exception 'Invalid website edit'; end if;
  if p->'content' is null or jsonb_typeof(p->'content') not in ('object','array') or octet_length((p->'content')::text)>180000 then raise exception 'Invalid section content'; end if;
  if op='publish' and (p->>'reviewed') is distinct from 'true' then raise exception 'Review before publishing'; end if;
  if op='publish' and (not ig_private.allowed('content.publish') or not ig_private.scope_allowed('corporate','publish')) then raise exception 'Website publication permission required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('website:'||k,0));
  select version into old_version from ig_private.website_drafts where section=k;
  if coalesce(old_version,0) is distinct from (p->>'version')::int then raise exception 'Another editor saved this section. Reload before saving.' using errcode='40001'; end if;
  next_version=coalesce(old_version,0)+1;
  insert into ig_private.website_drafts(section,version,content) values(k,next_version,p->'content')
  on conflict(section) do update set version=excluded.version,content=excluded.content,edited_at=now();
  if op='publish' then
    effective=greatest(now(),coalesce((p->>'effective_at')::timestamptz,now()));
    delete from ig_private.website_releases where section=k and effective_at>now();
    insert into ig_private.website_releases values(k,next_version,p->'content',effective);
  end if;
  perform ig_private.record_audit('website.'||op,k,jsonb_build_object('version',next_version,'effective_at',effective));
  return jsonb_build_object('version',next_version,'effective_at',effective);
end $$;
revoke all on function ig_private.website_edit(jsonb) from public,anon;
grant execute on function ig_private.website_edit(jsonb) to authenticated;
create function public.ig_website_edit(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.website_edit(p)$$;
revoke all on function public.ig_website_edit(jsonb) from public,anon;
grant execute on function public.ig_website_edit(jsonb) to authenticated;

do $$
declare old_definition text; updated text;
begin
 select pg_get_functiondef('ig_private.catalogue_manage(jsonb)'::regprocedure) into old_definition;
 updated=replace(old_definition,'''public_data'',d));cid=', $new$
 'seo_title',left(concat_ws(' | ',v->>'title',c.brand),90),
 'seo_description',left(coalesce(nullif(v->>'summary',''),concat_ws(' ',c.brand,v->>'title',v->>'category')),200),
 'public_data',d||jsonb_build_object('seo_keywords',left(concat_ws(', ',nullif(trim(v->>'search_phrases'),''),
   nullif(trim(v->>'title'),''),nullif(trim(v->>'category'),''),nullif(trim(c.brand||' '||coalesce(v->>'reference','')),'')),500))));cid=$new$);
 if updated=old_definition then raise exception 'Unexpected catalogue draft function'; end if;
 execute updated;
end $$;
