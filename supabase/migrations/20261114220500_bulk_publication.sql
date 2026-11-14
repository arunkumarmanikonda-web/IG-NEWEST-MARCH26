-- Each saved revision uses the normal publication checks. One invalid product
-- does not roll back the other approved records in the batch.
create function public.ig_bulk_publication(p jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  choice text := p->>'action';
  row_data jsonb;
  results jsonb := '[]';
  answer jsonb;
  correct_state boolean;
begin
  if choice is null or choice not in ('publish','archive') or
     jsonb_typeof(p->'rows') is distinct from 'array' then
    raise exception 'Select records and a publication action.';
  end if;
  if jsonb_array_length(p->'rows') not between 1 and 25 then
    raise exception 'Send between 1 and 25 records in each request.';
  end if;
  for row_data in select value from jsonb_array_elements(p->'rows') order by value->>'id' loop
    begin
      if row_data->'verify_only' = 'true'::jsonb then
        if not ig_private.allowed('content.publish') or not ig_private.content_access((row_data->>'id')::uuid,'publish') then
          raise exception 'Practice publication permission required' using errcode='42501';
        end if;
        select case when choice='publish' then s.version=c.version else s.id is null end into correct_state
          from public.ig_content c left join public.ig_public_content s on s.id=c.id
          where c.id=(row_data->>'id')::uuid and c.version=(row_data->>'version')::int and c.deleted_at is null;
        if correct_state is distinct from true then
          raise exception 'Visibility or revision changed. Refresh and review the current record.' using errcode='40001';
        end if;
        answer := jsonb_build_object('ok', true);
      else
        answer := public.ig_content_action(jsonb_build_object(
          'id',row_data->>'id','version',row_data->'version','action',choice,
          'factsConfirmed',p->'factsConfirmed','rightsConfirmed',p->'rightsConfirmed',
          'privacyConfirmed',p->'privacyConfirmed'));
      end if;
      results := results || jsonb_build_array(jsonb_build_object('id',row_data->>'id','ok',answer->'ok'));
    exception when raise_exception or insufficient_privilege or serialization_failure
        or check_violation or unique_violation or foreign_key_violation or invalid_text_representation then
      results := results || jsonb_build_array(jsonb_build_object(
        'id',row_data->>'id','ok',false,'error',case
          when sqlstate='23505' then 'A live record already uses this reference.'
          when sqlstate='23503' then 'A linked record needs attention before publication.'
          when sqlstate='23514' or sqlstate='22P02' then 'Check this record’s required fields and save the draft again.'
          else sqlerrm end));
    end;
  end loop;
  return results;
end $$;
revoke all on function public.ig_bulk_publication(jsonb) from public,anon;
grant execute on function public.ig_bulk_publication(jsonb) to authenticated;
notify pgrst, 'reload schema';
