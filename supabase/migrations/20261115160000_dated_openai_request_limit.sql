-- A dated setup allowance uses the existing 100-request ceiling. As soon as
-- the India calendar day ends, every claim uses the owner's normal limit.
create function ig_private.openai_daily_cap(settings jsonb, india_day date)
returns integer language sql immutable set search_path='' as $$
 select case when settings->>'setup_quota_date'=to_char(india_day,'YYYY-MM-DD') then 100
 else least(100,greatest(1,coalesce((settings->>'daily_request_limit')::integer,20))) end
$$;
revoke all on function ig_private.openai_daily_cap(jsonb,date) from public,anon,authenticated;

do $$
declare fn regprocedure; previous text; pattern text; revised text; arg text;
begin
 foreach fn in array array['ig_private.ai_prepare(jsonb)'::regprocedure,'ig_private.catalogue_background_claim()'::regprocedure] loop
  arg=case when fn='ig_private.ai_prepare(jsonb)'::regprocedure then 'settings' else 'cfg.settings' end;
  previous=pg_get_functiondef(fn);
  pattern=format('least(100,greatest(1,coalesce((%s->>''daily_request_limit'')::int,20)))',arg);
  revised=replace(previous,pattern,format('ig_private.openai_daily_cap(%s,(now() at time zone ''Asia/Kolkata'')::date)',arg));
  if revised=previous then raise exception 'Request budget definition changed for %',fn;end if;
  execute revised;
 end loop;
end $$;
