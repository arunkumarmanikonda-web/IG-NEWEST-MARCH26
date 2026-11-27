import { collectionMoney } from '../../lib/collection-money.mjs';

const statusLabels = {
  prepared: 'Prepared', creating: 'Processing', review: 'Review required', active: 'Awaiting payment',
  paid: 'Paid', expired: 'Expired', cancelled: 'Cancelled',
};

export default async function MobilePaymentStatus({client}) {
  const {data: items, error} = await client.rpc('ig_collection_manage', {p: {action: 'list'}});
  return <section className="workspace-card"><h2>Collection status</h2>
    <p>Manage payment links on the India Gully website.</p>
    {error ? <p role="alert">Collections could not be loaded for this workspace.</p> :
      items?.length ? items.map(item => {
        const status = item.status === 'active' && Date.parse(item.expires_at) <= Date.now() ? 'expired' : item.status;
        return <article className="enquiry-record" key={item.id}>
          <h3>{item.invoice_ref || item.reference}</h3>
          <p>{collectionMoney(item.amount_paise)} · {statusLabels[status] || status}</p>
        </article>;
      }) : <p>No collections are available in your permitted practices.</p>}
  </section>;
}
