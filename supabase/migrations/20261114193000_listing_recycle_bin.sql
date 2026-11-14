alter table public.ig_content add column deleted_at timestamptz;

alter function ig_private.content_action(jsonb) rename to content_action_before_trash;
revoke all on function ig_private.content_action_before_trash(jsonb) from public, anon, authenticated;

create function ig_private.content_action(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.ig_content; a text=p->>'action'; answer jsonb;
begin
  if not ig_private.content_access((p->>'id')::uuid,'publish') then
    raise exception 'Practice publication permission required' using errcode='42501';
  end if;
  select * into item from public.ig_content where id=(p->>'id')::uuid for update;
  if item.id is null then raise exception 'Listing unavailable'; end if;
  if a='trash' then
    answer=ig_private.content_action_before_trash(p||jsonb_build_object('action','archive'));
    update public.ig_content set deleted_at=coalesce(deleted_at,now()) where id=item.id;
    perform ig_private.record_audit('content.trashed',item.id::text,jsonb_build_object('version',item.version));
    return answer;
  end if;
  if item.deleted_at is not null and a not in ('restore','delete') then
    raise exception 'Restore this listing from Deleted before changing its publication.';
  end if;
  answer=ig_private.content_action_before_trash(p);
  if a='restore' and item.deleted_at is not null then
    update public.ig_content set deleted_at=null where id=item.id;
  end if;
  return answer;
end $$;
revoke all on function ig_private.content_action(jsonb) from public,anon;
grant execute on function ig_private.content_action(jsonb) to authenticated;
create or replace function public.ig_content_action(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.content_action(p)$$;
