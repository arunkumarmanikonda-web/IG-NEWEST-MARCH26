import 'server-only';
import {setTimeout as delay} from 'node:timers/promises';
import {runtimeConfigs, integrationRpc} from './runtime-config';
import {sendResendPayload} from './provider-adapters.mjs';
import {enquiryEmail} from './email-message.mjs';

export async function dispatchEmailQueue(enquiryId) {
  const configs = await runtimeConfigs(), config = configs.resend;
  if (config?.mode !== 'enabled') return {sent: 0, disabled: true};
  if (!config.secrets.api_key || !config.secrets.webhook_secret) throw new Error('Email credentials missing');
  const jobs = await integrationRpc('ig_delivery', {action: 'claim', enquiry_id: enquiryId});
  let sent = 0;
  const origin=process.env.VERCEL_ENV==='production'?process.env.NEXT_PUBLIC_SITE_URL:
    process.env.VERCEL_BRANCH_URL?'https://'+process.env.VERCEL_BRANCH_URL:process.env.NEXT_PUBLIC_SITE_URL;
  for (const [index, job] of jobs.entries()) {
    if (index) await delay(600);
    // Freeze every outbound byte before sending, including sender and enquiry text.
    const payload = await integrationRpc('ig_delivery', {action: 'prepare', id: job.id,
      lease_token: job.lease_token, payload: enquiryEmail(configs, job, origin)});
    let provider_id, error;
    try {
      const result = await sendResendPayload(config, payload, 'ig-enquiry/' + job.id);
      if (!result.id) throw new Error('Provider did not acknowledge the message');
      provider_id = result.id;
      sent++;
    } catch {
      error = 'Provider delivery failed or was not confirmed. Retry within the idempotency window.';
    }
    await integrationRpc('ig_delivery', {action: 'finish', id: job.id,
      lease_token: job.lease_token, provider_id, error});
  }
  return {sent};
}
