do $$declare s text;begin
 select pg_get_functiondef('ig_private.save_content(jsonb)'::regprocedure) into s;
 s=replace(s,'path text=d','image_path text=d');
 s=replace(s,$a$if path like '/images/library/%'$a$,$a$if image_path like '/images/library/%'$a$);
 s=replace(s,$a$'.jpg'=path and$a$,$a$'.jpg'=image_path and$a$);
 execute s;
end$$;
