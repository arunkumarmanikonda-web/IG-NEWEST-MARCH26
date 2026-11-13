import {createHmac} from 'node:crypto';
// Production secrets are imported into the existing encrypted configuration.
// This preserves immutable payment bindings and never enables collection.
export function stageRazorpayLive(previous, env = {}) {
  if (env.VERCEL_ENV !== 'production') throw new Error('Live credentials can only be staged in production');
  if (previous.mode === 'live') throw new Error('Live payments are already active. Use the reviewed credential-rotation process.');
  const keyId = env.RAZORPAY_LIVE_KEY_ID || '';
  const secret = env.RAZORPAY_LIVE_KEY_SECRET || '';
  if (!/^rzp_live_[A-Za-z0-9]+$/.test(keyId) || secret.length < 12 || secret.length > 5000 || /[\r\n\x00]/.test(secret)) {
    throw new Error('Save RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET in Vercel Production Secrets, then redeploy production');
  }
  const credentials = { key_secret: secret };
  if (env.RAZORPAY_LIVE_WEBHOOK_SECRET) credentials.webhook_secret = env.RAZORPAY_LIVE_WEBHOOK_SECRET;
  return {
    mode: 'disabled',
    settings: { ...previous.settings, key_id: keyId, merchant_verified: false },
    credentials,
    clear_credentials: true,
  };
}

// Read-only credential acceptance. Never return merchant order data to the browser.
export async function checkRazorpayCredentials(config, fetcher = fetch) {
  const keyId = config?.settings?.key_id || '';
  const secret = config?.secrets?.key_secret || '';
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId) || !secret) {
    return {ok: false, message: 'Save the matching Razorpay key ID and secret before checking the connection.'};
  }
  const response = await fetcher('https://api.razorpay.com/v1/orders?count=1', {
    method: 'GET', cache: 'no-store', redirect: 'error',
    signal: AbortSignal.timeout(15000),
    headers: {Authorization: 'Basic ' + Buffer.from(keyId + ':' + secret).toString('base64')},
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.entity !== 'collection' || !Array.isArray(data.items) || !Number.isInteger(data.count)) {
    throw new Error('Razorpay credentials could not be verified. Check the matching key pair in Razorpay.');
  }
  return {ok: true, message: 'Razorpay credentials accepted. No order, payment or refund was created. Live webhook and payment acceptance checks remain required.'};
}

// Probe only the deployment's own fixed public relay. Never creates a payment.
export async function checkRazorpayWebhook(config, supabaseOrigin, fetcher = fetch) {
  const secret = config?.secrets?.webhook_secret;
  if (!secret) return {ok: false, message: 'Save the Razorpay webhook secret before checking the receiver.'};
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(supabaseOrigin || '')) throw new Error('Webhook receiver is not configured');
  const body = JSON.stringify({entity: 'event', event: 'india_gully.connection_check'});
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  const url = supabaseOrigin + '/functions/v1/ig-provider-webhook/razorpay';
  const invalidSignature = (signature[0] === '0' ? '1' : '0') + signature.slice(1);
  for (const [value, expected] of [[invalidSignature, 401], [signature, 200]]) {
    const response = await fetcher(url, {
      method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: {'Content-Type': 'application/json', 'x-razorpay-signature': value}, body,
    });
    if (response.status !== expected || (expected === 200 && await response.text() !== 'Accepted')) {
      throw new Error('Webhook receiver verification failed');
    }
  }
  return {ok: true, message: 'Webhook receiver verified: the saved signature was accepted and an altered signature rejected. No payment was created. A Razorpay-originated event is still needed to confirm both services use the same secret.'};
}
