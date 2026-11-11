// Only provider-fetched values may enter the reconciliation RPC.
export function paymentSnapshot(payment, request) {
  if (!payment || !/^pay_[A-Za-z0-9]+$/.test(payment.id || '') ||
      payment.order_id !== request.provider_order_id || payment.amount !== request.amount_paise ||
      payment.currency !== 'INR' || !['created','authorized','captured','refunded','failed'].includes(payment.status)) {
    throw new Error('Provider payment does not match this request');
  }
  const refunded = payment.amount_refunded ?? 0;
  if (!Number.isSafeInteger(refunded) || refunded < 0 || refunded > payment.amount ||
      (['captured','refunded'].includes(payment.status) && payment.captured !== true) ||
      (payment.status === 'refunded' && refunded !== payment.amount) ||
      (!['captured','refunded'].includes(payment.status) && refunded !== 0)) {
    throw new Error('Provider refund or capture state is inconsistent');
  }
  return {provider_order_id:payment.order_id,provider_payment_id:payment.id,amount_paise:payment.amount,
    currency:payment.currency,provider_status:payment.status,captured:payment.captured === true,refunded_paise:refunded};
}
export function chooseOrderPayment(collection, request) {
  if (!Array.isArray(collection?.items) || collection.items.length > 100) throw new Error('Provider payment list is invalid');
  const payments = collection.items.map(p => ({payment:p,snapshot:paymentSnapshot(p,request)}));
  const settled = payments.filter(p => ['captured','refunded'].includes(p.snapshot.provider_status));
  if (settled.length > 1) throw new Error('Multiple captured payments require manual reconciliation');
  if (settled.length) return settled[0].payment;
  return payments.sort((a,b)=>(b.payment.created_at||0)-(a.payment.created_at||0))[0]?.payment || null;
}
export function paymentStatusLabel(request) {
  if (request.status === 'paid' && request.refunded_paise === request.amount_paise) return 'Refunded';
  if (request.status === 'paid' && request.refunded_paise > 0) return 'Partially refunded';
  if (request.status === 'pending' && request.provider_status === 'failed') return 'Payment attempt failed';
  return ({paid:'Paid',pending:'Awaiting payment',open:'Open',initializing:'Reconciliation required',cancelled:'Cancelled'})[request.status] || request.status;
}
