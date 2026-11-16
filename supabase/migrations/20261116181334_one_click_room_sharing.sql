-- Staff can grant access and enqueue a separate secure link per selected recipient atomically.
alter table public.ig_outbox add column nda_request_id uuid references public.ig_nda_requests(id);
alter table public.ig_outbox drop constraint ig_outbox_subject;
alter table public.ig_outbox add constraint ig_outbox_subject check (
  (kind in ('internal','acknowledgement') and enquiry_id is not null and collection_link_id is null and room_id is null and contact_id is null and nda_request_id is null) or
  (kind='payment_link' and collection_link_id is not null and enquiry_id is null and room_id is null and contact_id is null and nda_request_id is null) or
  (kind='room_update' and room_id is not null and circulation_batch is not null and enquiry_id is null and collection_link_id is null and num_nonnulls(contact_id,nda_request_id)=1)
);
create unique index ig_room_nda_notice_once on public.ig_outbox(circulation_batch,nda_request_id) where nda_request_id is not null;
create index ig_room_notice_history on public.ig_outbox(room_id,recipient,created_at desc) where room_id is not null;

create table ig_private.room_share_receipts(
  batch_id uuid primary key,room_id uuid not null references public.ig_data_rooms(id),actor_id uuid not null,
  request_hash text not null,result jsonb not null
);
alter table ig_private.room_share_receipts enable row level security;
revoke all on ig_private.room_share_receipts from public,anon,authenticated;
create index room_share_receipt_room on ig_private.room_share_receipts(room_id);

create function ig_private.room_notice_eligible(room uuid,contact uuid,nda uuid,email_address text)
returns boolean language sql stable security definer set search_path='' as $$
  select case when nda is null then ig_private.circulation_eligible(room,contact,email_address)
  else exists (
    select 1 from public.ig_room_grants g join public.ig_data_rooms r on r.id=g.room_id
    join public.ig_nda_requests n on n.id=g.nda_request_id and n.user_id=g.user_id and n.content_id=r.content_id
    join auth.users u on u.id=n.user_id join public.ig_profiles pr on pr.id=u.id
    where g.room_id=room and g.nda_request_id=nda and g.active and r.active and g.expires_at>now()
      and n.status='approved' and n.accepted_at>now()-interval '3 years' and pr.status='active'
      and lower(u.email)=email_address and lower(n.agreement_snapshot->>'recipient_email')=email_address
  ) end
$$;
revoke all on function ig_private.room_notice_eligible(uuid,uuid,uuid,text) from public,anon,authenticated;

-- Recheck the precise grant at dispatch, including previously queued notices.
do $$
declare src text:=pg_get_functiondef('ig_private.delivery(text,jsonb)'::regprocedure); anchor text:='and (nullif(p->>''enquiry_id'','''') is null or o.enquiry_id=(p->>''enquiry_id'')::uuid)';
begin
  if strpos(src,anchor)=0 or strpos(src,'ig_private.circulation_eligible(o.room_id,o.contact_id,o.recipient)')=0
    or strpos(src,'ig_private.circulation_eligible(j.room_id,j.contact_id,j.recipient)')=0 then raise exception 'Review current delivery implementation'; end if;
  src:=replace(src,anchor,anchor||' and (p->>''circulation_batch'' is null or o.circulation_batch=(p->>''circulation_batch'')::uuid)');
  src:=replace(src,'ig_private.circulation_eligible(o.room_id,o.contact_id,o.recipient)','ig_private.room_notice_eligible(o.room_id,o.contact_id,o.nda_request_id,o.recipient)');
  src:=replace(src,'ig_private.circulation_eligible(j.room_id,j.contact_id,j.recipient)','ig_private.room_notice_eligible(j.room_id,j.contact_id,j.nda_request_id,j.recipient)');
  execute src;
end $$;

create function ig_private.room_share(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  room uuid:=(p->>'room_id')::uuid; batch uuid:=(p->>'batch_id')::uuid; intent text:=p->>'action';
  d public.ig_data_rooms; e public.ig_engagements; g public.ig_room_grants; previous ig_private.room_share_receipts;
  target uuid; contact uuid; nda uuid; usr uuid; address text; added int:=0; renewed int:=0; queued int:=0; recent int:=0;
  request_hash text:=encode(extensions.digest(convert_to((p-'batch_id')::text,'UTF8'),'sha256'),'hex'); answer jsonb; ids uuid[]; args jsonb;
begin
  if not ig_private.room_staff(room) then raise exception 'Room administration permission required' using errcode='42501'; end if;
  if intent='status' then
    select coalesce(jsonb_agg(to_jsonb(latest) order by latest.created_at desc),'[]') into answer from (
      select distinct on (o.recipient) o.recipient,o.status,o.created_at from public.ig_outbox o
      where o.room_id=room and o.kind='room_update' order by o.recipient,o.created_at desc,o.id desc
    ) latest;
    return answer;
  end if;
  if intent is null or intent not in ('share','access') or batch is null then raise exception 'Choose a sharing action'; end if;
  perform pg_advisory_xact_lock(hashtextextended('room-circulation:'||room::text,0));
  select * into previous from ig_private.room_share_receipts where batch_id=batch;
  if found then
    if previous.room_id<>room or previous.actor_id<>auth.uid() or previous.request_hash<>request_hash then raise exception 'Sharing request changed. Review and submit again.'; end if;
    return previous.result;
  end if;
  if jsonb_typeof(p->'recipient_ids') is distinct from 'array' or jsonb_array_length(p->'recipient_ids') not between 1 and 50 then raise exception 'Select between 1 and 50 recipients'; end if;
  if coalesce(p->>'download_mode','') not in ('none','selected','all') then raise exception 'Select download permissions'; end if;
  select array_agg(distinct value::uuid order by value::uuid) into ids from jsonb_array_elements_text(p->'recipient_ids');
  select * into strict d from public.ig_data_rooms where id=room for share;
  if not d.active then raise exception 'This room is paused'; end if;
  if d.engagement_id is not null then
    select * into strict e from public.ig_engagements where id=d.engagement_id for update;
    if not e.active or exists(select 1 from public.ig_clients where id=e.client_id and stage='archived') then raise exception 'This engagement or client is inactive';end if;
    if not e.confidentiality_confirmed then
      if p->'confirm_terms' is distinct from 'true'::jsonb or length(btrim(coalesce(p->>'terms_reference',''))) not between 5 and 500 then
        raise exception 'Confirm the executed engagement terms and enter the agreement reference before sharing';end if;
      perform ig_private.client_manage(to_jsonb(e)||jsonb_build_object('action','engagement_save','version',p->'engagement_version',
        'confidentiality_confirmed',true,'confidentiality_reference',btrim(p->>'terms_reference')));
    end if;
  end if;
  if intent='share' then
    if not exists(select 1 from ig_private.integration_config where id='resend' and mode='enabled') then raise exception 'Email delivery is disabled. Enable delivery or choose Grant access only.'; end if;
    insert into ig_private.room_circulations(id,room_id,created_by) values(batch,room,auth.uid());
  end if;
  foreach target in array ids loop
    if d.engagement_id is not null then
      contact:=target;
      select c.email into address from public.ig_client_contacts c where c.id=contact and c.client_id=e.client_id and c.active and c.portal_enabled for share;
      if address is null then raise exception 'Choose active portal contacts belonging to this client'; end if;
    else
      nda:=target;
      select n.user_id,lower(n.agreement_snapshot->>'recipient_email') into usr,address from public.ig_nda_requests n
        join auth.users u on u.id=n.user_id join public.ig_profiles pr on pr.id=u.id
        where n.id=nda and n.content_id=d.content_id and n.status='approved' and n.accepted_at>now()-interval '3 years'
          and lower(n.agreement_snapshot->>'recipient_email')=lower(u.email) and pr.status='active' for share of n;
      if address is null then raise exception 'Select an approved, signed NDA for the current project and registered email'; end if;
    end if;
    select * into g from public.ig_room_grants where room_id=room and (contact_id=contact or user_id=usr) for update;
    args:=jsonb_build_object('room_id',room,'contact_id',contact,'nda_request_id',nda,'download_mode',p->>'download_mode','expires_at',p->>'expires_at');
    if g.id is null then
      perform ig_private.room_manage(args||jsonb_build_object('action',case when nda is null then 'contact_grant' else 'grant' end));
      added:=added+1;
    elsif g.nda_request_id is distinct from nda then
      raise exception 'The existing access belongs to another NDA. Review the grant before sharing.';
    elsif not g.active or g.expires_at<=now() then
      perform ig_private.room_manage(args||jsonb_build_object('action','grant_update','id',g.id,'version',g.version,'active',true));
      renewed:=renewed+1;
    end if;
    if intent='share' then
      if not ig_private.room_notice_eligible(room,contact,nda,address) or exists(select 1 from ig_private.email_suppressions where email=address) then
        raise exception 'Email is unavailable for %. Review circulation preferences or choose Grant access only.',address; end if;
      if exists(select 1 from public.ig_outbox o where o.room_id=room and o.recipient=address and o.created_at>now()-interval '5 minutes'
          and o.status in ('awaiting_provider','queued','accepted','delivered')) then recent:=recent+1;
      else
        insert into public.ig_outbox(room_id,contact_id,nda_request_id,circulation_batch,recipient,kind)
          values(room,contact,nda,batch,address,'room_update');
        queued:=queued+1;
      end if;
    end if;
  end loop;
  answer:=jsonb_build_object('batch_id',batch,'recipients',cardinality(ids),'added',added,'renewed',renewed,'queued',queued,'recent',recent);
  insert into ig_private.room_share_receipts values(batch,room,auth.uid(),request_hash,answer);
  perform ig_private.record_audit('room.'||intent,room::text,answer);
  return answer;
end $$;
create function public.ig_room_share(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.room_share(p)$$;
revoke all on function public.ig_room_share(jsonb),ig_private.room_share(jsonb) from public,anon;
grant execute on function public.ig_room_share(jsonb),ig_private.room_share(jsonb) to authenticated;
notify pgrst,'reload schema';
