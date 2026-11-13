-- One administrator action creates distinct grants for every selected email.
alter function ig_private.room_manage(jsonb) rename to room_manage_before_bulk;
revoke all on function ig_private.room_manage_before_bulk(jsonb) from public,anon,authenticated;
create function ig_private.room_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare contact uuid;room uuid=(p->>'room_id')::uuid;added int=0;existing int=0;result jsonb;
begin
 if p->>'action'<>'contact_grant_bulk' then return ig_private.room_manage_before_bulk(p);end if;
 if not ig_private.room_staff(room) then raise exception 'Practice administrator permission required' using errcode='42501';end if;
 if jsonb_typeof(p->'contact_ids') is distinct from 'array' or jsonb_array_length(p->'contact_ids') not between 1 and 50 then raise exception 'Select between 1 and 50 contacts';end if;
 for contact in select distinct value::uuid from jsonb_array_elements_text(p->'contact_ids') loop
  if not exists(select 1 from public.ig_client_contacts c join public.ig_engagements e on e.client_id=c.client_id join public.ig_data_rooms d on d.engagement_id=e.id where c.id=contact and d.id=room and c.active and c.portal_enabled) then raise exception 'Every contact must be an active portal contact for this client';end if;
  if exists(select 1 from public.ig_room_grants where room_id=room and contact_id=contact) then existing=existing+1;
  else
   result=ig_private.room_manage_before_bulk((p-'contact_ids')||jsonb_build_object('action','contact_grant','contact_id',contact));added=added+1;
  end if;
 end loop;
 perform ig_private.record_audit('room.bulk_shared',room::text,jsonb_build_object('added',added,'existing_unchanged',existing));
 return jsonb_build_object('added',added,'existing_unchanged',existing);
end $$;
revoke all on function ig_private.room_manage(jsonb) from public,anon;
grant execute on function ig_private.room_manage(jsonb) to authenticated;
