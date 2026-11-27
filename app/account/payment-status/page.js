import Link from 'next/link';
import { redirect } from 'next/navigation';
import { accountContext } from '../../../lib/supabase/server';
import { collectionMoney } from '../../../lib/collection-money.mjs';
import { paymentStatusLabel } from '../../../lib/payment-state.mjs';
import '../../portal.css';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Invoices and payment status', robots: {index: false, follow: false}};

export default async function PaymentStatusPage() {
  const {client, user} = await accountContext();
  if (!user) redirect('/login');
  const {data: invoices, error} = await client.from('ig_payment_requests')
    .select('id,invoice_ref,description,amount_paise,refunded_paise,status,provider_status,mode')
    .eq('user_id', user.id).order('created_at', {ascending: false});

  return <main id="main" className="auth-page"><div className="nda-account">
    <Link href="/account">← Your account</Link>
    <section className="workspace-card"><h1>Invoices and payment status</h1>
      <p>To pay an invoice, visit indiagully.com separately and sign in to your account.</p>
      {error ? <p role="alert">Invoices could not be loaded.</p> :
        invoices?.length ? invoices.map(invoice => <article className="enquiry-record" key={invoice.id}>
          <h2>{invoice.invoice_ref}</h2><p>{invoice.description}</p>
          <strong>{collectionMoney(invoice.amount_paise)}</strong>
          <p>{paymentStatusLabel(invoice)}{invoice.mode === 'test' && ' · Test payment'}</p>
          {invoice.refunded_paise > 0 && <p>Refunded {collectionMoney(invoice.refunded_paise)}</p>}
        </article>) : <p>No invoices have been issued to your account.</p>}
    </section>
  </div></main>;
}
