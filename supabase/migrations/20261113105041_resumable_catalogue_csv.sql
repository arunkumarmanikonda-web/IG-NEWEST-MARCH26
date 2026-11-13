-- Each CSV batch commits atomically. A lost response can be replayed without new SKUs.
create table ig_private.catalogue_import_batches(
 actor_id uuid not null references auth.users(id),batch_key text not null,
 payload_hash text not null, result jsonb,created_at timestamptz not null default now(),
 primary key(actor_id,batch_key),
 check(batch_key ~ '^[a-f0-9]{64}:[0-9]{1,10}$')
);
alter table ig_private.catalogue_import_batches enable row level security;
revoke all on ig_private.catalogue_import_batches from public,anon,authenticated;
alter function ig_private.catalogue_import(jsonb) rename to catalogue_import_before_resumable;
revoke all on function ig_private.catalogue_import_before_resumable(jsonb) from public,anon,authenticated;
create function ig_private.catalogue_import(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare k text=p->>'batch_key';h text;r ig_private.catalogue_import_batches;answer jsonb;
begin
 if not ig_private.allowed('content.write') or not ig_private.content_scope('product') or not ig_private.scope_allowed('horeca','write') then raise exception 'Catalogue edit permission and MFA required' using errcode='42501';end if;
 if k is null then return ig_private.catalogue_import_before_resumable(p);end if;
 if k!~'^[a-f0-9]{64}:[0-9]{1,10}$' then raise exception 'Invalid catalogue batch reference';end if;
 h=encode(extensions.digest(convert_to((p->'rows')::text,'UTF8'),'sha256'),'hex');
 insert into ig_private.catalogue_import_batches(actor_id,batch_key,payload_hash) values(auth.uid(),k,h) on conflict do nothing;
 select * into r from ig_private.catalogue_import_batches where actor_id=auth.uid() and batch_key=k for update;
 if r.payload_hash is distinct from h then raise exception 'This catalogue batch reference contains different products';end if;
 if r.result is not null then return r.result||'{"recovered":true}';end if;
 answer=ig_private.catalogue_import_before_resumable(p-'batch_key');
 update ig_private.catalogue_import_batches set result=answer where actor_id=auth.uid() and batch_key=k;
 return answer;
end $$;
revoke all on function ig_private.catalogue_import(jsonb) from public,anon;
grant execute on function ig_private.catalogue_import(jsonb) to authenticated;
