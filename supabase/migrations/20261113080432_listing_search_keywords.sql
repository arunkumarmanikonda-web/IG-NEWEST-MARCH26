-- Add reviewed search phrases to the existing metadata allowlist. Permission,
-- scope, MFA, revision, disclosure and maximum-field-length checks are unchanged.
do $$
declare definition text; updated text;
begin
 select pg_get_functiondef('ig_private.save_content_unscoped(jsonb)'::regprocedure) into definition;
 if position('''seo_keywords''' in definition)>0 then return; end if;
 updated=replace(definition,'''tenure'',''availability'']','''tenure'',''availability'',''seo_keywords'']');
 if updated=definition then raise exception 'Content allowlist changed; review migration before applying'; end if;
 execute updated;
end $$;
