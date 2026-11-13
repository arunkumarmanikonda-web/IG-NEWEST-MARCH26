import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {receiveRazorpayWebhook} from '../lib/razorpay-webhook.mjs';
import {checkRazorpayWebhook} from '../lib/razorpay-live.mjs';

const secret = 'controlled-webhook-test-secret';
const unsupported = {event: 'india_gully.connection_check'};
const captured = {event: 'payment.captured', payload: {payment: {entity: {id: 'pay_Test', order_id: 'order_Test'}}}};
function signed(event, key = secret, headers = {}) {
  const raw = JSON.stringify(event);
  return new Request('https://example.com/api/webhooks/razorpay', {method: 'POST', body: raw,
    headers: {'x-razorpay-signature': createHmac('sha256', key).update(raw).digest('hex'), ...headers}});
}
function dependencies(overrides = {}) {
  return {currentSecrets: async () => [secret],
    binding: async () => {throw new Error('Payment not found');},
    boundSecrets: async () => [secret], reconcile: async () => {throw new Error('Must not reconcile');}, ...overrides};
}

test('Unknown event types require a valid signature and cannot reach payment reconciliation', async () => {
  const deps = dependencies({binding: () => {throw new Error('Must not look up payment');}});
  assert.equal((await receiveRazorpayWebhook(signed(unsupported, 'wrong'), deps)).status, 401);
  const response = await receiveRazorpayWebhook(signed(unsupported), deps);
  assert.equal(response.status, 200);assert.deepEqual(await response.json(), {ignored: true});
});

test('Unrelated merchant payments are ignored only with a valid current webhook secret', async () => {
  assert.equal((await receiveRazorpayWebhook(signed(captured, 'wrong'), dependencies())).status, 401);
  assert.deepEqual(await (await receiveRazorpayWebhook(signed(captured), dependencies())).json(), {ignored: true});
});

test('Database and provider failures stay retryable rather than silently acknowledging an event', async () => {
  for (const message of ['Database unavailable', 'Payment configuration missing', 'Server authorisation required']) {
    assert.equal((await receiveRazorpayWebhook(signed(captured), dependencies({binding: async () => {throw new Error(message);}}))).status, 503);
  }
  assert.equal((await receiveRazorpayWebhook(signed(captured), dependencies({binding: async () => ({id: 'owned'})}))).status, 503);
});

test('Owned payments retain binding-specific signature verification and duplicate evidence', async () => {
  let calls = 0;
  const deps = dependencies({binding: async () => ({id: 'owned'}), currentSecrets: async () => ['rotated-current'],
    reconcile: async (binding, id, evidence) => {
      calls++;assert.equal(binding.id, 'owned');assert.equal(id, 'pay_Test');assert.equal(evidence.event_id, 'evt_Test');
      assert.equal(evidence.source, 'webhook');assert.equal(evidence.event_kind, 'payment.captured');
      assert.match(evidence.body_hash, /^[a-f0-9]{64}$/);return {duplicate: true};
    }});
  assert.equal((await receiveRazorpayWebhook(signed(captured, 'wrong'), deps)).status, 401);
  const response = await receiveRazorpayWebhook(signed(captured, secret, {'x-razorpay-event-id': 'evt_Test'}), deps);
  assert.deepEqual(await response.json(), {ok: true, duplicate: true});assert.equal(calls, 1);
});

test('Refund events resolve by provider payment ID and malformed payment references cannot reconcile', async () => {
  let checked = false;
  const event = {event: 'refund.processed', payload: {refund: {entity: {payment_id: 'pay_Refund'}}}};
  const deps = dependencies({binding: async (id, order, payment) => {
    checked = true;assert.equal(id, undefined);assert.equal(order, undefined);assert.equal(payment, 'pay_Refund');
    throw new Error('Payment not found');
  }});
  assert.equal((await receiveRazorpayWebhook(signed(event), deps)).status, 200);assert.equal(checked, true);
  assert.equal((await receiveRazorpayWebhook(signed({event: 'payment.failed', payload: {}}), deps)).status, 400);
});

test('Receiver diagnostic checks rejection and acceptance without a payment event or provider call', async () => {
  let calls = 0;
  const config = {mode: 'disabled', secrets: {webhook_secret: secret}};
  const result = await checkRazorpayWebhook(config, 'https://abcdefghijklmnopqrst.supabase.co', async (url, options) => {
    calls++;assert.equal(url, 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/ig-provider-webhook/razorpay');
    assert.equal(options.redirect, 'error');assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).event, 'india_gully.connection_check');
    const response = await receiveRazorpayWebhook(new Request(url, options), dependencies());
    return new Response(response.ok ? 'Accepted' : 'Not accepted', {status: response.status});
  });
  assert.equal(result.ok, true);assert.equal(calls, 2);assert.equal(config.mode, 'disabled');
  assert.doesNotMatch(JSON.stringify(result), new RegExp(secret));
});

test('Receiver diagnostic fails closed on an unsigned receiver, missing secret, or arbitrary destination', async () => {
  const config = {secrets: {webhook_secret: secret}};
  const mustNotFetch = () => {throw new Error('Must not fetch');};
  assert.equal((await checkRazorpayWebhook({}, 'https://abcdefghijklmnopqrst.supabase.co', mustNotFetch)).ok, false);
  for (const origin of ['http://abcdefghijklmnopqrst.supabase.co', 'https://evil.example', 'https://abcdefghijklmnopqrst.supabase.co/redirect']) {
    await assert.rejects(() => checkRazorpayWebhook(config, origin, mustNotFetch));
  }
  await assert.rejects(() => checkRazorpayWebhook(config, 'https://abcdefghijklmnopqrst.supabase.co', async () => new Response('Accepted')));
});
