-- Only availability of a room is public. Room IDs, filenames and grants remain private.
create function public.ig_room_listing_slugs(content_kind text default 'opportunity') returns text[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(c.slug order by c.slug),array[]::text[]) from public.ig_public_content c
 where c.kind in ('opportunity','project') and c.kind=content_kind and exists(select from public.ig_data_rooms r where r.content_id=c.id and r.active)
$$;
revoke all on function public.ig_room_listing_slugs(text) from public;
grant execute on function public.ig_room_listing_slugs(text) to anon,authenticated;
