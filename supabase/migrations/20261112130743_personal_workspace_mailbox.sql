-- Per-user encrypted Google credentials and drafts. No cross-user mailbox delegation.
create table ig_private.mailboxes(user_id uuid primary key references auth.users(id) on delete cascade,email text not null,sealed jsonb not null,version integer not null default 1,connected_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table ig_private.mailbox_states(user_id uuid primary key references auth.users(id) on delete cascade,state_hash text not null,expires_at timestamptz not null);
create table ig_private.mailbox_messages(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,payload_hash text not null,sealed jsonb not null,status text not null default 'draft' check(status in('draft','sending','sent','uncertain')),version integer not null default 1,provider_id text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index mailbox_messages_user on ig_private.mailbox_messages(user_id,created_at desc);
alter table ig_private.mailboxes enable row level security;
alter table ig_private.mailbox_states enable row level security;
alter table ig_private.mailbox_messages enable row level security;
revoke all on ig_private.mailboxes,ig_private.mailbox_states,ig_private.mailbox_messages from public,anon,authenticated;
create function ig_private.mailbox_runtime(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a text=p->>'action';uid uuid=auth.uid();m ig_private.mailboxes;o ig_private.mailbox_messages;did uuid;expected integer;
begin
 if not ig_private.integration_server(secret) or not ig_private.allowed('admin.read') then raise exception 'Staff identity, MFA and server authorisation required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('ig-mailbox:'||uid::text,0));
 if a='begin' then
  if p->>'state_hash'!~'^[a-f0-9]{64}$' then raise exception 'Invalid state';end if;
  insert into ig_private.mailbox_states values(uid,p->>'state_hash',now()+interval '10 minutes') on conflict(user_id) do update set state_hash=excluded.state_hash,expires_at=excluded.expires_at;return '{"ok":true}';
 elsif a='consume' then
  delete from ig_private.mailbox_states where user_id=uid and state_hash=p->>'state_hash' and expires_at>now();if not found then raise exception 'Connection request expired or used';end if;return '{"ok":true}';
 elsif a='get' then select * into m from ig_private.mailboxes where user_id=uid;return case when m.user_id is null then null else to_jsonb(m) end;
 elsif a='dashboard' then
  return jsonb_build_object('connection',(select to_jsonb(b)-'sealed'-'user_id' from ig_private.mailboxes b where user_id=uid),'messages',coalesce((select jsonb_agg(to_jsonb(d)-'user_id' order by created_at desc) from (select * from ig_private.mailbox_messages where user_id=uid order by created_at desc limit 50)d),'[]'));
 elsif a='connect' then
  if lower(p->>'email') is distinct from (select lower(email) from auth.users where id=uid) or jsonb_typeof(p->'sealed')<>'object' then raise exception 'Mailbox must match verified staff email';end if;
  insert into ig_private.mailboxes(user_id,email,sealed) values(uid,lower(p->>'email'),p->'sealed') on conflict(user_id) do update set email=excluded.email,sealed=excluded.sealed,updated_at=now(),version=ig_private.mailboxes.version+1;
  perform ig_private.record_audit('mailbox.connected',uid,'{}');return '{"ok":true}';
 elsif a='refresh' then
  update ig_private.mailboxes set sealed=p->'sealed',version=version+1,updated_at=now() where user_id=uid and version=(p->>'version')::integer;return jsonb_build_object('updated',found);
 elsif a='disconnect' then
  delete from ig_private.mailboxes where user_id=uid;delete from ig_private.mailbox_states where user_id=uid;perform ig_private.record_audit('mailbox.disconnected',uid,'{}');return '{"ok":true}';
 end if;
 did=(p->>'id')::uuid;if did is null then raise exception 'Message identity required';end if;
 select * into o from ig_private.mailbox_messages where id=did for update;
 if o.id is not null and o.user_id<>uid then raise exception 'Message not available' using errcode='42501';end if;
 if a='draft' then
  if p->>'hash'!~'^[a-f0-9]{64}$' or jsonb_typeof(p->'sealed')<>'object' or length((p->'sealed')::text)>60000 then raise exception 'Invalid message';end if;
  if o.id is null then
   if (select count(*) from ig_private.mailbox_messages where user_id=uid and created_at>now()-interval '1 day')>=100 then raise exception 'Daily message limit reached';end if;
   insert into ig_private.mailbox_messages(id,user_id,payload_hash,sealed) values(did,uid,p->>'hash',p->'sealed') returning * into o;
  elsif o.status='draft' and o.version=(p->>'version')::integer then
   update ig_private.mailbox_messages set payload_hash=p->>'hash',sealed=p->'sealed',version=version+1,updated_at=now() where id=did returning * into o;
  elsif o.status='draft' and o.payload_hash=p->>'hash' then null;
  else raise exception 'Draft changed or sending already started' using errcode='40001';end if;
  return to_jsonb(o)-'sealed'-'payload_hash'-'user_id';
 elsif a='claim_send' then
  if o.id is null or o.payload_hash is distinct from p->>'hash' then raise exception 'Save and review this exact draft before sending';end if;
  if o.status='sent' then return to_jsonb(o)-'sealed'-'payload_hash'-'user_id';end if;
  if o.status<>'draft' or o.version is distinct from (p->>'version')::integer then raise exception 'Sending already started or draft changed. Check Gmail Sent before sending again.' using errcode='40001';end if;
  if not exists(select 1 from ig_private.mailboxes where user_id=uid) then raise exception 'Connect your mailbox';end if;
  update ig_private.mailbox_messages set status='sending',version=version+1,updated_at=now() where id=did returning * into o;
  perform ig_private.record_audit('mailbox.send_requested',did,'{}');return to_jsonb(o)-'sealed'-'payload_hash'-'user_id';
 elsif a='finish_send' then
  if o.status<>'sending' or p->>'status' not in('sent','uncertain') then raise exception 'Invalid delivery transition';end if;
  if p->>'status'='sent' and coalesce(p->>'provider_id','')!~'^[a-zA-Z0-9_-]{1,100}$' then raise exception 'Provider acknowledgement missing';end if;
  update ig_private.mailbox_messages set status=p->>'status',provider_id=p->>'provider_id',version=version+1,updated_at=now() where id=did returning * into o;
  perform ig_private.record_audit('mailbox.'||(p->>'status'),did,'{}');return to_jsonb(o)-'sealed'-'payload_hash'-'user_id';
 end if;
 raise exception 'Unknown mailbox operation';
end $$;
create function public.ig_mailbox_runtime(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.mailbox_runtime(secret,p)$$;
revoke all on function ig_private.mailbox_runtime(text,jsonb),public.ig_mailbox_runtime(text,jsonb) from public,anon;
grant execute on function ig_private.mailbox_runtime(text,jsonb),public.ig_mailbox_runtime(text,jsonb) to authenticated;
