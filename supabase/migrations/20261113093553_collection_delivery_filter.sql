-- A targeted claim supports immediate collection delivery and isolated verification.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.delivery(text,jsonb)'::regprocedure) into s;
 if position($f$and (nullif(p->>'enquiry_id','') is null$f$ in s)=0 then raise exception 'Unexpected delivery filter';end if;
 s=replace(s,$f$and (nullif(p->>'enquiry_id','') is null$f$,$f$and (nullif(p->>'collection_link_id','') is null or o.collection_link_id=(p->>'collection_link_id')::uuid)
    and (nullif(p->>'enquiry_id','') is null$f$);
 execute s;
end $$;
