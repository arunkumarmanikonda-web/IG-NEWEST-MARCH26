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
