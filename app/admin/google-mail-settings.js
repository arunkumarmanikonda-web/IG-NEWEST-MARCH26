'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function GoogleMailSettings({config, production}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasSecret = config.credential_fields.includes('client_secret');
  const enabled = config.mode === 'enabled';

  async function save(event) {
    event.preventDefault();
    if (busy || !production) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/settings', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          id:'google_mail', version:config.version, mode:fields.get('mode'),
          settings:{client_id:fields.get('client_id').trim()},
          credentials:{client_secret:fields.get('client_secret').trim()},
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save Google Workspace settings.');
      form.elements.client_secret.value = '';
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <details open id="google-mail" className="enquiry-record">
    <summary>Google Workspace mail · {enabled?'enabled':'setup'} </summary>
    <h3>Connect staff mailboxes</h3>
    <p>In your company’s Google Cloud project, enable the Gmail API and create an OAuth client. Choose <strong>Web application</strong> and register this authorised redirect URI exactly.</p>
    <p><code>https://indiagully.com/api/mailbox/callback</code></p>
    <div className="workspace-actions">
      <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noreferrer">Enable Gmail API ↗</a>
      <a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noreferrer">Open Google OAuth clients ↗</a>
    </div>
    {production?<form className="workspace-form" onSubmit={save}>
      <label>Client ID<input name="client_id" defaultValue={config.settings.client_id} autoComplete="off" maxLength={2000} placeholder="…apps.googleusercontent.com"/></label>
      <label>Client secret<input name="client_secret" type="password" autoComplete="new-password" maxLength={5000} placeholder={hasSecret?'Saved securely':'Enter the secret issued by Google'}/></label>
      <label>Staff mailbox access<select name="mode" defaultValue={config.version===1?'enabled':config.mode}>
        <option value="enabled">Enable staff connections</option><option value="disabled">Disable staff connections</option>
      </select></label>
      <div className="workspace-actions wide"><button disabled={busy}>{busy?'Saving…':'Save mailbox settings'}</button>
        <a href="/admin/mailbox">My business mailbox</a></div>
      <p className="wide" role="status">{error || (config.version===1?'Awaiting Google credentials.':enabled?'Settings saved. Each staff member can now authorise their own mailbox.':'Settings saved. Staff mailbox access is disabled.')}</p>
    </form>:<p>Open the production owner dashboard to change these settings.</p>}
  </details>;
}
