'use client';

import { useEffect, useRef, useState } from 'react';
import { createMobileStaffEntry, mobileStaffEntryError } from '../../../lib/mobile-staff-entry.mjs';

export default function MobileStaffEntry() {
  const entry = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  if (!entry.current) entry.current = createMobileStaffEntry();

  useEffect(() => {
    let active = true;
    const pending = attempt === 0 ? entry.current.start() : entry.current.retry();
    pending.then(destination => {
      if (active) window.location.replace(destination);
    }).catch(() => {
      if (active) setError(mobileStaffEntryError);
    });
    // Do not launch another reset during effect replay or follow a late result
    // after the user has left this entry page.
    return () => { active = false; };
  }, [attempt]);

  return <section className="portal-form" aria-busy={!error}>
    <div className="eyebrow">INDIA GULLY · STAFF ACCESS</div>
    <h1>{error ? 'Staff sign-in could not start.' : 'Preparing staff sign-in.'}</h1>
    {error ? <>
      <p role="alert">{error}</p>
      <button className="button" type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Retry</button>
    </> : <p role="status">Starting a fresh staff sign-in. Your other devices stay signed in.</p>}
    <noscript><p>Enable JavaScript to start a fresh staff sign-in. The workspace has not been opened.</p></noscript>
  </section>;
}
