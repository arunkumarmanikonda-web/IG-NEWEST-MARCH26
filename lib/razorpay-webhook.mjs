import {createHash} from 'node:crypto';
import {verifyRazorpayWebhook} from './provider-adapters.mjs';
import {readRaw} from './http.mjs';

const supported = new Set(['payment.captured', 'payment.failed', 'refund.processed', 'refund.failed']);

// Unrelated merchant events are acknowledged only after signature verification.
// Database/provider outages must remain retryable, never be treated as unrelated.
export async function receiveRazorpayWebhook(request, dependencies) {
  try {
    const raw = await readRaw(request, 100000);
    const signature = request.headers.get('x-razorpay-signature');
    if (!/^[a-f0-9]{64}$/i.test(signature || '')) return new Response('Invalid signature', {status: 401});
    let event;
    try { event = JSON.parse(raw); } catch { return new Response('Invalid event', {status: 400}); }
    if (!event || typeof event.event !== 'string') return new Response('Invalid event', {status: 400});
    const valid = secrets => secrets.some(secret => verifyRazorpayWebhook(raw, signature, secret));
    async function ignoreAuthenticated() {
      return valid(await dependencies.currentSecrets())
        ? Response.json({ignored: true})
        : new Response('Invalid signature', {status: 401});
    }
    if (!supported.has(event.event)) return await ignoreAuthenticated();
    const payment = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;
    const paymentId = payment?.id || refund?.payment_id;
    if (!/^pay_[A-Za-z0-9]+$/.test(paymentId || '')) return new Response('Invalid payment reference', {status: 400});
    let binding;
    try {
      binding = await dependencies.binding(undefined, payment?.order_id, payment?.order_id ? undefined : paymentId);
    } catch (error) {
      if (error.message === 'Payment not found') return await ignoreAuthenticated();
      throw error;
    }
    if (!valid(await dependencies.boundSecrets(binding))) return new Response('Invalid signature', {status: 401});
    const bodyHash = createHash('sha256').update(raw).digest('hex');
    const eventId = request.headers.get('x-razorpay-event-id') || 'sha256:' + bodyHash;
    if (eventId.length > 200 || /[\r\n\x00]/.test(eventId)) return new Response('Invalid event reference', {status: 400});
    const result = await dependencies.reconcile(binding, paymentId, {
      source: 'webhook', event_id: eventId, body_hash: bodyHash, event_kind: event.event,
    });
    return Response.json({ok: true, duplicate: result.duplicate});
  } catch {
    return new Response('Reconciliation unavailable', {status: 503});
  }
}
