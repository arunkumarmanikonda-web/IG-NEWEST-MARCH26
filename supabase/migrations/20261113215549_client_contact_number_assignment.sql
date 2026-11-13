create or replace function ig_private.client_manage(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;contact jsonb;contacts jsonb='[]';client_id uuid;client public.ig_clients;contact_phone text;constraint_name text;
begin
 if not ig_private.allowed('admin.read') then raise exception 'Staff verification and current account required' using errcode='42501';end if;
 if p->>'action'='contacts_add' or (p->>'action'='client_save' and p ? 'contacts') then
  if jsonb_typeof(p->'contacts') is distinct from 'array' or jsonb_array_length(p->'contacts')>50 then raise exception 'Supply up to 50 contacts at a time';end if;
  if p->>'action'='contacts_add' and jsonb_array_length(p->'contacts')=0 then raise exception 'Enter at least one contact name and email address';end if;
  if p->>'action'='client_save' then
   result=ig_private.client_manage_before_contact_numbers(p-'contacts');client_id=(result->>'id')::uuid;
  else client_id=(p->>'client_id')::uuid;end if;
  select * into client from public.ig_clients where id=client_id for update;
  if client.id is null or not ig_private.client_staff(client.id,'crm') then raise exception 'Practice CRM permission required' using errcode='42501';end if;
  for contact in select value from jsonb_array_elements(p->'contacts') loop
   if jsonb_typeof(contact) is distinct from 'object' then raise exception 'Each contact must contain a name and email address';end if;
   contacts=contacts||jsonb_build_array(ig_private.client_manage(contact||jsonb_build_object('action','contact_save','client_id',client.id,'id',null)));
  end loop;
  if p->>'action'='client_save' then return result||jsonb_build_object('contacts',contacts);end if;
  return jsonb_build_object('client_id',client.id,'added',jsonb_array_length(contacts),'contacts',contacts);
 elsif p->>'action'='contact_save' then
  -- Serialize additions against the client so concurrent batches respect capacity.
  select * into client from public.ig_clients where id=(p->>'client_id')::uuid for update;
  if client.id is null or not ig_private.client_staff(client.id,'crm') then raise exception 'Practice CRM permission required' using errcode='42501';end if;
  if p ? 'phone' then
   contact_phone=trim(coalesce(p->>'phone',''));
   if contact_phone<>'' and (length(contact_phone)>40 or contact_phone !~ '^\+?[0-9 ().-]+$' or length(regexp_replace(contact_phone,'[^0-9]','','g')) not between 7 and 15) then raise exception 'Enter a valid contact number with 7–15 digits, including the country code';end if;
  end if;
  result=ig_private.client_manage_before_contact_numbers(p);
  if p ? 'phone' then
   update public.ig_client_contacts set phone=contact_phone where id=(result->>'id')::uuid returning to_jsonb(ig_client_contacts.*) into result;
  end if;
  return result;
 end if;
 return ig_private.client_manage_before_contact_numbers(p);
exception when unique_violation then
 get stacked diagnostics constraint_name=CONSTRAINT_NAME;
 if constraint_name='ig_client_contacts_client_id_email_key' then raise exception 'This email already belongs to a contact for this client. Edit that contact or use a different email.';end if;
 raise;
end $$;
