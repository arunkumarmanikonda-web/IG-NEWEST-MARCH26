-- Expose a public invoker wrapper; only reviewed media paths are returned.
alter function public.ig_public_media_path(uuid) set schema ig_private;
create function public.ig_public_media_path(media_id uuid) returns text language sql stable security invoker set search_path='' as $$select ig_private.ig_public_media_path(media_id)$$;
revoke all on function public.ig_public_media_path(uuid),ig_private.ig_public_media_path(uuid) from public;
grant execute on function public.ig_public_media_path(uuid),ig_private.ig_public_media_path(uuid) to anon,authenticated;
create table public.ig_operation_revisions(
 record_id uuid not null references public.ig_operations(id),version int not null,snapshot jsonb not null,actor_id uuid references auth.users(id),created_at timestamptz not null default now(),primary key(record_id,version)
);
create index ig_operation_revision_actor on public.ig_operation_revisions(actor_id);
alter table public.ig_operation_revisions enable row level security;
revoke all on public.ig_operation_revisions from public,anon,authenticated;
grant select on public.ig_operation_revisions to authenticated;
create policy operation_revision_read on public.ig_operation_revisions for select to authenticated using(exists(select 1 from public.ig_operations where id=record_id));
create function ig_private.ops_revision() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.ig_operation_revisions(record_id,version,snapshot,actor_id) values(new.id,new.version,to_jsonb(new),new.updated_by);return new;
end$$;
revoke all on function ig_private.ops_revision() from public,anon,authenticated;
create trigger ops_revision after insert or update on public.ig_operations for each row execute function ig_private.ops_revision();
create unique index ig_movement_reference on public.ig_operations(parent_id,lower(data->>'reference'),(data->>'direction')) where kind='movement';
-- A single global directory supplies names only; contact and room access stays separately scoped.
create function ig_private.client_directory() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not ig_private.allowed('admin.read') then raise exception 'Staff access and MFA required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'stage',stage,'reference',reference,'practice',practice) order by name) from public.ig_clients where stage<>'archived'),'[]');end$$;
create function public.ig_client_directory() returns jsonb language sql stable security invoker set search_path='' as $$select ig_private.client_directory()$$;
revoke all on function ig_private.client_directory(),public.ig_client_directory() from public,anon;
grant execute on function ig_private.client_directory(),public.ig_client_directory() to authenticated;
do $$declare s text;begin
 select pg_get_functiondef('ig_private.ops_save(jsonb)'::regprocedure) into s;
 s=replace(s,$find$if cid is not null and not ig_private.client_staff(cid,'read') then raise exception 'Client access required' using errcode='42501';end if;$find$,$replace$if cid is not null and not exists(select 1 from public.ig_clients where id=cid and stage<>'archived') then raise exception 'Select an active client';end if;
 if old.id is not null and old.client_id is distinct from cid and exists(select 1 from public.ig_operations where parent_id=old.id) then raise exception 'Client is locked once child records exist';end if;$replace$);
 s=replace(s,$find$if parent.status in ('delivered','cancelled') then raise exception 'Order is closed';end if;$find$,$replace$if parent.status='cancelled' or (parent.status='delivered' and d->>'direction'<>'customer-return') then raise exception 'Order is closed; record a customer return to reopen fulfilment';end if;$replace$);
 s=replace(s,$find$if nullif(d->>'date','') is null then raise exception 'Movement date required';end if;$find$,$replace$if nullif(d->>'date','') is null or (d->>'date')::date>(now() at time zone 'Asia/Kolkata')::date then raise exception 'Use a movement date up to today';end if;$replace$);
 execute s;
end$$;
