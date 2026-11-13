create table public.ig_payment_requests(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 invoice_ref text not null check(length(invoice_ref) between 1 and 80),description text not null check(length(description) between 10 and 1000),
 practice text not null,amount_paise bigint not null check(amount_paise between 100 and 1000000000),
 status text not null default 'open' check(status in ('open','initializing','pending','paid','cancelled')),
 provider_order_id text unique,provider_payment_id text unique,mode text,accepted_policy text,accepted_at timestamptz,
 created_by uuid references auth.users(id),created_at timestamptz not null default now(),paid_at timestamptz,expires_at timestamptz not null,
 unique(user_id,invoice_ref)
);
create table ig_private.payment_bindings(request_id uuid primary key references public.ig_payment_requests(id),config jsonb not null);
alter table public.ig_payment_requests enable row level security;
alter table ig_private.payment_bindings enable row level security;
revoke all on public.ig_payment_requests,ig_private.payment_bindings from public,anon,authenticated;
grant select on public.ig_payment_requests to authenticated;
create policy payment_read on public.ig_payment_requests for select to authenticated using((user_id=(select auth.uid()) and (select ig_private.allowed('account'))) or (ig_private.allowed('users.manage') and ig_private.scope_allowed(practice,'commerce')));
create index ig_payment_creator on public.ig_payment_requests(created_by);
create function ig_private.payment_admin(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_payment_requests;
begin
 if not ig_private.allowed('users.manage') then raise exception 'Administrator access required' using errcode='42501';end if;
 if p->>'action'='create' then
  if not ig_private.scope_allowed(p->>'practice','commerce') then raise exception 'Practice commerce permission required' using errcode='42501';end if;
  if not exists(select 1 from public.ig_profiles pr join auth.users u on u.id=pr.id where pr.id=(p->>'user_id')::uuid and pr.status='active' and u.email_confirmed_at is not null) then raise exception 'A verified active customer is required';end if;
  if coalesce(p->>'invoice_confirmed','false')<>'true' then raise exception 'Confirm the agreed invoice and total including taxes and charges';end if;
  if (p->>'expires_at')::timestamptz<=now() or (p->>'expires_at')::timestamptz>now()+interval '90 days' then raise exception 'Expiry must be within 90 days';end if;
  insert into public.ig_payment_requests(user_id,invoice_ref,description,practice,amount_paise,created_by,expires_at) values((p->>'user_id')::uuid,trim(p->>'invoice_ref'),trim(p->>'description'),p->>'practice',(p->>'amount_paise')::bigint,auth.uid(),(p->>'expires_at')::timestamptz) returning * into r;
 elsif p->>'action'='cancel' then
  select * into r from public.ig_payment_requests where id=(p->>'id')::uuid for update;
  if r.id is null or not ig_private.scope_allowed(r.practice,'commerce') then raise exception 'Practice commerce permission required' using errcode='42501';end if;
  if r.status<>'open' then raise exception 'Only unstarted requests may be cancelled. Reconcile provider payments first.';end if;
  update public.ig_payment_requests set status='cancelled' where id=r.id returning * into r;
 else raise exception 'Unknown payment action';end if;
 perform ig_private.record_audit('payment.'||(p->>'action'),r.id::text,jsonb_build_object('amount_paise',r.amount_paise));return to_jsonb(r);
end $$;
create function public.ig_payment_admin(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.payment_admin(p)$$;
revoke all on function public.ig_payment_admin(jsonb),ig_private.payment_admin(jsonb) from public,anon;
grant execute on function public.ig_payment_admin(jsonb),ig_private.payment_admin(jsonb) to authenticated;
create function ig_private.payment_start(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_payment_requests;c ig_private.integration_config;
begin
 if not ig_private.allowed('account') or not ig_private.integration_server(p->>'server_secret') then raise exception 'Verified server request required' using errcode='42501';end if;
 select * into r from public.ig_payment_requests where id=(p->>'id')::uuid and user_id=auth.uid() for update;
 if r.id is null or r.expires_at<=now() or r.status not in ('open','pending') then raise exception 'Payment request is unavailable or awaiting reconciliation';end if;
 if coalesce(p->>'accepted','false')<>'true' then raise exception 'Accept the invoice and procurement terms';end if;
 if r.status='pending' then return to_jsonb(r);end if;
 select * into c from ig_private.integration_config where id='razorpay' and mode in ('test','live');
 if c.id is null or r.amount_paise>(c.settings->>'max_payment_paise')::bigint then raise exception 'Payment provider is not activated for this amount';end if;
 if c.mode='live' and (not exists(select 1 from ig_private.integration_config where id='business' and settings->>'statutory_details_confirmed'='true') or not exists(select 1 from public.ig_policy_releases where current and legal_reviewed)) then raise exception 'Statutory and legal activation incomplete';end if;
 insert into ig_private.payment_bindings(request_id,config) values(r.id,to_jsonb(c));
 update public.ig_payment_requests set status='initializing',mode=c.mode,accepted_policy=ig_private.current_policy(),accepted_at=now() where id=r.id returning * into r;
 perform ig_private.record_audit('payment.started',r.id::text);return to_jsonb(r);
end $$;
create function public.ig_payment_start(p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.payment_start(p)$$;
revoke all on function public.ig_payment_start(jsonb),ig_private.payment_start(jsonb) from public,anon;
grant execute on function public.ig_payment_start(jsonb),ig_private.payment_start(jsonb) to authenticated;
create function ig_private.payment_server(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.ig_payment_requests;b jsonb;
begin
 if not ig_private.integration_server(secret) then raise exception 'Server authorisation required' using errcode='42501';end if;
 select * into r from public.ig_payment_requests where (id=nullif(p->>'id','')::uuid or provider_order_id=p->>'provider_order_id') for update;
 if r.id is null then raise exception 'Payment not found';end if;
 select config into b from ig_private.payment_bindings where request_id=r.id;
 if p->>'action'='get' then return jsonb_build_object('request',to_jsonb(r),'config',b);
 elsif p->>'action'='bind' then
  if r.status<>'initializing' or p->>'provider_order_id'!~'^order_[A-Za-z0-9]+$' then raise exception 'Invalid order transition';end if;
  update public.ig_payment_requests set provider_order_id=p->>'provider_order_id',status='pending' where id=r.id returning * into r;
 elsif p->>'action'='paid' then
  if r.status not in ('pending','paid') or p->>'provider_order_id' is distinct from r.provider_order_id or (p->>'amount_paise')::bigint is distinct from r.amount_paise or p->>'currency'<>'INR' or p->>'provider_payment_id'!~'^pay_[A-Za-z0-9]+$' then raise exception 'Payment mismatch';end if;
  if r.status='paid' and r.provider_payment_id is distinct from p->>'provider_payment_id' then raise exception 'Payment already recorded';end if;
  update public.ig_payment_requests set status='paid',provider_payment_id=p->>'provider_payment_id',paid_at=coalesce(paid_at,now()) where id=r.id returning * into r;
 else raise exception 'Unknown payment operation';end if;
 return to_jsonb(r);
end $$;
create function public.ig_payment_server(secret text,p jsonb) returns jsonb language sql security invoker set search_path='' as $$select ig_private.payment_server(secret,p)$$;
revoke all on function public.ig_payment_server(text,jsonb),ig_private.payment_server(text,jsonb) from public;
grant execute on function public.ig_payment_server(text,jsonb),ig_private.payment_server(text,jsonb) to anon,authenticated;
