'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function VerifyForm({ purpose }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(action) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/portal/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, purpose, email, ...(action === 'verify' ? { token } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (action === 'verify') { setToken(''); location.replace(result.next); }
      else setMessage(result.message);
    } catch (error) { setMessage(error.message || 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <form className="portal-form" onSubmit={event => { event.preventDefault(); submit('verify'); }}>
    <div className="eyebrow">INDIA GULLY ACCOUNT</div>
    <h1>{purpose === 'recovery' ? 'Recover your account.' : 'Verify your email.'}</h1>
    <p>{purpose === 'recovery' ? 'Enter the recovery code sent to your account email. You can then choose a new password.' : 'Enter your account email and the verification code in your India Gully email.'}</p>
    <p>Codes are single-use. You can enter the code here even if you opened the email on another device.</p>
    <label>Email address<input type="email" name="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} /></label>
    <label>Verification code<input name="token" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required value={token} onChange={event => setToken(event.target.value)} /></label>
    <button className="button" disabled={busy}>{busy ? 'Please wait…' : purpose === 'recovery' ? 'Verify and reset password' : 'Verify email'}</button>
    <button type="button" className="text-button" disabled={busy || !email.trim()} onClick={event => {
      const input = event.currentTarget.form.elements.namedItem('email');
      if (input.reportValidity()) submit(purpose === 'recovery' ? 'recover' : 'resend');
    }}>Send a new code</button>
    <p role="status" className="portal-message">{message}</p>
    <p><Link href="/login">Return to sign in</Link></p>
  </form>;
}
