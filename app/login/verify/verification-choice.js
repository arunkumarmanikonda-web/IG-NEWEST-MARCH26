'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function VerificationChoice({ email, factors }) {
  const [method, setMethod] = useState(factors.length ? 'authenticator' : 'email');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [factorId, setFactorId] = useState(factors[0]?.id || '');
  async function send(action) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/portal/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, token, factorId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.next) location.replace(result.next);
      else { setSent(true); setMessage(result.message); }
    } catch (error) { setMessage(error.message || 'Please try again.'); }
    finally { setBusy(false); }
  }
  function choose(value) { setMethod(value); setMessage(''); setToken(''); }
  return <form className="portal-form verification-card" onSubmit={event => { event.preventDefault(); send(method === 'authenticator' ? 'staff_totp_verify' : sent ? 'staff_email_verify' : 'staff_email_code'); }}>
    <div className="eyebrow">PRIVATE WORKSPACE</div>
    <h1>One final check.</h1>
    <p>Choose how to verify your sign-in. Either option opens the same workspace.</p>
    <p className="verification-email">{email}</p>
    <div className="signin-methods" role="group" aria-label="Verification method">
      <button type="button" aria-pressed={method === 'authenticator'} disabled={busy} onClick={() => choose('authenticator')}>Authenticator app</button>
      <button type="button" aria-pressed={method === 'email'} disabled={busy} onClick={() => choose('email')}>Email code</button>
    </div>
    {method === 'authenticator' && !factors.length ? <div className="verification-note"><p>No authenticator is set up for this account yet. You can use an email code now or set up your authenticator.</p><Link className="text-link" href="/account/security">Set up authenticator</Link></div> : <>
      {method === 'authenticator' && factors.length > 1 && <label>Authenticator<select value={factorId} onChange={event => setFactorId(event.target.value)}>{factors.map(factor => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Authenticator'}</option>)}</select></label>}
      {(method === 'authenticator' || sent) && <label>{method === 'authenticator' ? 'Six-digit authenticator code' : 'Code from your email'}<input name="token" value={token} onChange={event => setToken(event.target.value)} type="text" inputMode="numeric" autoComplete="one-time-code" pattern={method === 'authenticator' ? '[0-9]{6}' : '[0-9]{6,10}'} maxLength={method === 'authenticator' ? 6 : 10} required autoFocus /></label>}
      <button className="button" disabled={busy}>{busy ? 'Please wait…' : method === 'email' && !sent ? 'Email my verification code' : 'Verify and open workspace'}</button>
      {method === 'email' && sent && <button className="text-button" type="button" disabled={busy} onClick={() => send('staff_email_code')}>Send a new code</button>}
    </>}
    {message && <p className="portal-message" role="status">{message}</p>}
    <p className="workspace-small">Your recorded policy acceptance is already saved.</p>
    <button type="button" className="text-button" disabled={busy} onClick={async () => { await fetch('/api/portal/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signout' }) }); location.replace('/login'); }}>Sign in with another account</button>
  </form>;
}
