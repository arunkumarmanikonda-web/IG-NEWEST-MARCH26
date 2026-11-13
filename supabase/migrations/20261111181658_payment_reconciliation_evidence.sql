-- Additive payment recovery and refund evidence. Existing paid records remain paid.
alter table public.ig_payment_requests
 add column refunded_paise bigint not null default 0 check(refunded_paise>=0 and refunded_paise<=amount_paise),
 add column provider_status text,
 add column last_reconciled_at timestamptz,
 add column last_webhook_at timestamptz,
 add column reconcile_requested_at timestamptz;
create table ig_private.payment_events(
 event_id text primary key check(length(event_id) between 1 and 200),
 request_id uuid not null references public.ig_payment_requests(id),
 body_hash text not null check(body_hash~'^[a-f0-9]{64}$'),
 event_kind text not null check(event_kind in ('payment.captured','payment.failed','refund.processed','refund.failed')),
 provider_payment_id text not null,
 provider_status text not null,
 refunded_paise bigint not null,
 created_at timestamptz not null default now()
);
create index ig_payment_events_request on ig_private.payment_events(request_id,created_at desc);
alter table ig_private.payment_events enable row level security;
revoke all on ig_private.payment_events from public,anon,authenticated;

create function ig_private.payment_reconcile(secret text,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.ig_payment_requests;e ig_private.payment_events;settled boolean;refund bigint;changed boolean;
begin
 if not coalesce(ig_private.integration_server(secret),false) then raise exception 'Server authorisation required' using errcode='42501';end if;
 select * into r from public.ig_payment_requests where id=(p->>'id')::uuid for update;
 if r.id is null or r.status not in ('pending','paid') then raise exception 'Payment is not available for reconciliation';end if;
 if p->>'provider_order_id' is distinct from r.provider_order_id or (p->>'amount_paise')::bigint is distinct from r.amount_paise
  or p->>'currency' is distinct from 'INR' or not coalesce(p->>'provider_payment_id'~'^pay_[A-Za-z0-9]+$',false)
  or not coalesce(p->>'provider_status' in ('created','authorized','captured','refunded','failed'),false)
  or not coalesce(p->>'source' in ('callback','webhook','admin','customer'),false) then raise exception 'Payment mismatch';end if;
 settled=p->>'provider_status' in ('captured','refunded');refund=(p->>'refunded_paise')::bigint;
 if refund is null or refund<0 or refund>r.amount_paise or (settled and p->>'captured' is distinct from 'true')
  or (not settled and refund<>0) or (p->>'provider_status'='refunded' and refund<>r.amount_paise) then raise exception 'Invalid capture or refund state';end if;
 if p->>'source'='webhook' then
  if not coalesce(length(p->>'event_id') between 1 and 200,false) or not coalesce(p->>'body_hash'~'^[a-f0-9]{64}$',false)
   or not coalesce(p->>'event_kind' in ('payment.captured','payment.failed','refund.processed','refund.failed'),false) then raise exception 'Webhook evidence required';end if;
  insert into ig_private.payment_events(event_id,request_id,body_hash,event_kind,provider_payment_id,provider_status,refunded_paise)
   values(p->>'event_id',r.id,p->>'body_hash',p->>'event_kind',p->>'provider_payment_id',p->>'provider_status',refund) on conflict do nothing;
  if not found then
   select * into e from ig_private.payment_events where event_id=p->>'event_id';
   if e.body_hash is distinct from p->>'body_hash' or e.request_id is distinct from r.id then raise exception 'Webhook event conflict';end if;
   return to_jsonb(r)||'{"duplicate":true}'::jsonb;
  end if;
 end if;
 if settled and r.status='paid' and r.provider_payment_id is distinct from p->>'provider_payment_id' then raise exception 'A different payment is already recorded';end if;
 changed=(settled and (r.status<>'paid' or refund>r.refunded_paise)) or (not settled and r.status<>'paid' and r.provider_status is distinct from p->>'provider_status');
 update public.ig_payment_requests set
  status=case when settled then 'paid' else status end,
  provider_payment_id=case when settled then p->>'provider_payment_id' else provider_payment_id end,
  provider_status=case when status='paid' and (not settled or refund<refunded_paise) then provider_status else p->>'provider_status' end,
  refunded_paise=greatest(refunded_paise,refund),
  paid_at=case when settled then coalesce(paid_at,now()) else paid_at end,
  last_reconciled_at=now(),
  last_webhook_at=case when p->>'source'='webhook' then now() else last_webhook_at end
 where id=r.id returning * into r;
 if changed then perform ig_private.record_audit('payment.reconciled',r.id::text,jsonb_build_object('status',r.status,'refunded_paise',r.refunded_paise,'source',p->>'source'));end if;
 return to_jsonb(r);
end $$;
create function public.ig_payment_reconcile(secret text,p jsonb) returns jsonb
language sql security invoker set search_path='' as $$select ig_private.payment_reconcile(secret,p)$$;
revoke all on function ig_private.payment_reconcile(text,jsonb),public.ig_payment_reconcile(text,jsonb) from public,anon,authenticated;
grant execute on function ig_private.payment_reconcile(text,jsonb),public.ig_payment_reconcile(text,jsonb) to anon,authenticated;

create function ig_private.payment_reconciliation_access(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.ig_payment_requests;
begin
 if not ig_private.allowed('account') or exists(select 1 from public.ig_profiles where id=auth.uid() and must_change_password) then raise exception 'Verified active account required' using errcode='42501';end if;
 select * into r from public.ig_payment_requests where id=(p->>'id')::uuid for update;
 if r.id is null then raise exception 'Payment request not found' using errcode='42501';end if;
 if coalesce((p->>'staff')::boolean,false) then
  if not ig_private.allowed('users.manage') or not ig_private.scope_allowed(r.practice,'commerce') then raise exception 'Practice commerce permission and MFA required' using errcode='42501';end if;
 elsif r.user_id is distinct from auth.uid() then raise exception 'Payment request not found' using errcode='42501';end if;
 if r.status not in ('pending','paid') or r.provider_order_id is null then raise exception 'No provider order is available to reconcile';end if;
 if r.reconcile_requested_at>now()-interval '15 seconds' then raise exception 'Please wait 15 seconds before refreshing this payment again';end if;
 update public.ig_payment_requests set reconcile_requested_at=now() where id=r.id;
 return jsonb_build_object('id',r.id);
end $$;
create function public.ig_payment_reconciliation_access(p jsonb) returns jsonb
language sql security invoker set search_path='' as $$select ig_private.payment_reconciliation_access(p)$$;
revoke all on function ig_private.payment_reconciliation_access(jsonb),public.ig_payment_reconciliation_access(jsonb) from public,anon,authenticated;
grant execute on function ig_private.payment_reconciliation_access(jsonb),public.ig_payment_reconciliation_access(jsonb) to authenticated;

-- Refund events can contain the payment identifier without an order entity.
do $$declare s text;begin
 select pg_get_functiondef('ig_private.payment_server(text,jsonb)'::regprocedure) into s;
 s=replace(s,$find$provider_order_id=p->>'provider_order_id')$find$,$replace$provider_order_id=p->>'provider_order_id' or provider_payment_id=p->>'provider_payment_id')$replace$);
 execute s;
end $$;
