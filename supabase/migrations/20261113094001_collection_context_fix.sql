-- Resolve the contact alias independently of the selected-contact row variable.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.collection_manage(jsonb)'::regprocedure) into s;
 s=replace(s,$f$'contacts',(select coalesce(jsonb_agg(jsonb_build_object('id',ct.id,'name',ct.name,'email',ct.email,'client',cl.name,'practice',cl.practice) order by cl.name,ct.name),'[]') from public.ig_client_contacts ct join public.ig_clients cl on cl.id=ct.client_id where ct.active$f$,$f$'contacts',(select coalesce(jsonb_agg(jsonb_build_object('id',contact_row.id,'name',contact_row.name,'email',contact_row.email,'client',cl.name,'practice',cl.practice) order by cl.name,contact_row.name),'[]') from public.ig_client_contacts contact_row join public.ig_clients cl on cl.id=contact_row.client_id where contact_row.active$f$);
 s=replace(s,$f$'collector',(select display_name$f$,$f$'user_id',auth.uid(),'collector',(select display_name$f$);
 execute s;
end $$;
