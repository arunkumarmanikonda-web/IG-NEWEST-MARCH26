import { collectionSnapshot, fetchCollectionLink } from './collection-links.mjs';
import { fetchRazorpayPayment } from './provider-adapters.mjs';
import { HttpError } from './http.mjs';

export function mayRefund(profile) {
  return profile?.roles?.some(role => role === 'owner' || role === 'administrator') === true;
}

function readRefund(entry, paymentId) {
  if (entry?.payment_id !== paymentId || !/^rfnd_[A-Za-z0-9]+$/.test(entry.id || '') ||
      entry.currency !== 'INR' || !Number.isSafeInteger(entry.amount) || entry.amount <= 0 ||
      !['pending', 'processed', 'failed'].includes(entry.status)) {
    throw new HttpError('Razorpay returned an inconsistent refund. Review the payment in Razorpay.', 502);
  }
  return { id: entry.id, amount: entry.amount, status: entry.status };
}

async function refundRequest(config, path, options, fetcher) {
  const { key_id } = config.settings;
  const response = await fetcher('https://api.razorpay.com/v1/payments/' + path, {
    ...options, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Authorization: 'Basic ' + Buffer.from(key_id + ':' + config.secrets.key_secret).toString('base64'),
      'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    if (/balance.*(low|insufficient)|insufficient.*balance/i.test(data?.error?.description || '')) {
      throw new HttpError('Razorpay reports insufficient merchant balance for this refund.', 409);
    }
    throw new HttpError('Razorpay could not confirm this request. Check refund history before retrying.', 502);
  }
  return data;
}

export async function reviewCollectionRefund(config, row, fetcher = fetch) {
  const link = await fetchCollectionLink(config, row, fetcher);
  const snapshot = collectionSnapshot(link, row);
  if (snapshot.provider_status !== 'paid' || !Array.isArray(link.payments)) {
    throw new HttpError('Razorpay has not confirmed a paid collection with payment details.', 409);
  }
  const ids = [...new Set(link.payments.filter(p => p.status === 'captured' || p.status === 'refunded')
    .map(p => p.payment_id || p.id))];
  if (ids.length !== 1 || !/^pay_[A-Za-z0-9]+$/.test(ids[0])) {
    throw new HttpError('One captured payment could not be identified for this collection. Review it in Razorpay.', 409);
  }
  const id = ids[0];
  const [payment, history] = await Promise.all([fetchRazorpayPayment(config, id, fetcher),
    refundRequest(config, id + '/refunds?count=100', { method: 'GET' }, fetcher)]);
  if (payment.id !== id || payment.captured !== true || !['captured','refunded'].includes(payment.status) ||
      payment.currency !== 'INR' || payment.amount !== row.amount_paise || !Number.isSafeInteger(payment.amount_refunded) ||
      payment.amount_refunded < 0 || payment.amount_refunded > payment.amount || !Array.isArray(history.items) ||
      history.items.length >= 100 || history.count !== history.items.length) {
    throw new HttpError('The payment and refund history could not be reconciled. Review this payment in Razorpay.', 409);
  }
  const refunds = history.items.map(item => readRefund(item, id));
  const processed = refunds.filter(r => r.status === 'processed').reduce((sum,r) => sum + r.amount, 0);
  const pending = refunds.some(r => r.status === 'pending');
  const reconciled = processed === payment.amount_refunded && (payment.status !== 'refunded' || processed === payment.amount);
  return { payment_id: id, method: payment.method, amount: payment.amount, refunds,
    remaining: reconciled && !pending ? payment.amount - processed : 0, pending, reconciled };
}

export async function issueCollectionRefund(config, row, review, input, actor, fetcher = fetch) {
  if (input.confirmed !== true || input.payment_id !== review.payment_id || !review.reconciled || review.pending ||
      !Number.isSafeInteger(review.remaining) || review.remaining < 100 || input.amount !== review.remaining) {
    throw new HttpError('The refundable balance changed or the payment was not confirmed. Review the collection again.', 409);
  }
  const receipt = 'IGR-' + review.payment_id + '-' + review.remaining;
  const entry = await refundRequest(config, review.payment_id + '/refund', { method: 'POST',
    headers: { 'X-Refund-Idempotency': receipt }, body: JSON.stringify({ amount: review.remaining, speed: 'normal', receipt,
      notes: { collection_reference: row.reference, requested_by: actor } }) }, fetcher);
  const refund = readRefund(entry, review.payment_id);
  if (refund.amount !== review.remaining || entry.receipt !== receipt) throw new HttpError('Check the provider refund history before retrying.', 502);
  return refund;
}
