'use client';
import { useRef, useState } from 'react';
import { practiceOptions } from '../../lib/business.mjs';

export default function MobilePayment({ practices, simulated, limit }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const sending = useRef(false);
  async function create() {
    if (sending.current || !draft) return;
    sending.current = true;
    setBusy(true);
    setMessage('');
    try {
      const url = simulated ? '/api/play-review/records' : '/api/admin/collections';
      const body = simulated
        ? {action: 'payment', request: draft.request_id, amount: draft.amount, purpose: draft.description}
        : {...draft, action: 'create', confirmed: true};
      const response = await fetch(url, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create this payment request.');
      if (simulated) {
        setLink('/account?samples=1');
        setMessage('Sample payment request recorded. Open the sample workspace to view the link.');
      } else {
        setLink(result.item?.status === 'active' && /^https:\/\//.test(result.item?.short_url || '') ? result.item.short_url : '');
        setMessage(result.item?.status === 'active' ? 'Payment link created.' : 'Request recorded. Check its status in website collections before creating another.');
      }
      setDraft(null);
    } catch (error) { setMessage(error.message); }
    finally { sending.current = false; setBusy(false); }
  }
  return <section className="workspace-card"><h2>Create a payment link</h2>
    {simulated && <p>Sample payments only. No money will be collected.</p>}
    {message && <p role="status">{message}</p>}{link && <p><a href={link}>{simulated ? 'Open sample payment links' : 'Open secure payment link'}</a></p>}
    {!practices.length ? <p>Your account has no assigned collection practice.</p> : <>
      <form className="workspace-form" hidden={Boolean(draft)} onSubmit={e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        setDraft({practice: f.practice, customer_name: f.name, customer_email: f.email, contact_id: null,
          amount: f.amount, invoice_ref: f.invoice, description: f.description,
          expires_at: new Date(f.expiry + 'T23:59:59+05:30').toISOString(), request_id: crypto.randomUUID()});
        setMessage(''); setLink('');
      }}>
        <label>Practice<select name="practice" required>{practices.map(p => <option key={p} value={p}>{practiceOptions.find(x => x[0] === p)?.[1] || p}</option>)}</select></label>
        <label>Client name<input name="name" required minLength={2} maxLength={120}/></label>
        <label>Client email<input name="email" type="email" required maxLength={254}/></label>
        <label>Amount in rupees<input name="amount" type="number" required min="0.01" max={limit} step="0.01"/></label>
        <label>Invoice or quotation reference<input name="invoice" required maxLength={80}/></label>
        <label>Purpose<textarea name="description" required minLength={10} maxLength={100}/></label>
        <label>Valid until (India time)<input name="expiry" type="date" required defaultValue={new Date(Date.now()+7*86400000).toISOString().slice(0,10)} min={new Date().toISOString().slice(0,10)} max={new Date(Date.now()+89*86400000).toISOString().slice(0,10)}/></label>
        <button className="primary">Review payment request</button>
      </form>
      {draft && <section><h3>Confirm payment request</h3><p>{draft.customer_name} · {draft.customer_email}</p>
        <p>₹{draft.amount} · {draft.invoice_ref} · {draft.description}</p><p>Valid until {new Date(draft.expires_at).toLocaleDateString('en-IN', {timeZone: 'Asia/Kolkata'})}.</p>
        <p>Confirm the client has agreed the amount, taxes and terms.</p>
        <button className="primary" disabled={busy} onClick={create}>Confirm and create</button>
        <button className="secondary" disabled={busy} onClick={() => setDraft(null)}>Edit details</button>
      </section>}
    </>}
  </section>;
}
