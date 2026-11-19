"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../account/profile";
import { directRoomRecipients, roomNdaRecipients, roomShareContacts, ROOM_SHARE_LIMIT } from "../../lib/room-sharing.mjs";

const deliveryLabels = {
  awaiting_provider: "Queued", queued: "Queued", accepted: "Sent · accepted by email provider",
  delivered: "Delivered to mail server", failed: "Delivery attempt failed", suppressed: "Delivery blocked",
};
const dateInIndia = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
function expiryDate() {
  return new Date(Date.now() + (30 * 24 + 5.5) * 3600000).toISOString().slice(0, 10);
}

export default function RoomSharing({ room, engagement, contacts = [], clients = [], requests = [], grants = [], supportsNda = false }) {
  const router = useRouter();
  const standardAvailable = Boolean(engagement || supportsNda);
  const [accessBasis, setAccessBasis] = useState(standardAvailable ? "standard" : "admin_authorised");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [additionalRecipients, setAdditionalRecipients] = useState("");
  const [authorisationReason, setAuthorisationReason] = useState("");
  const [authorisationConfirmed, setAuthorisationConfirmed] = useState(false);
  const [readiness,setReadiness]=useState(null);
  const [mode,setMode]=useState('none');
  const [receipts, setReceipts] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [statusError, setStatusError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef(null);
  const inFlight = useRef(false);
  const direct = accessBasis === "admin_authorised";
  const roomAvailable = room.active && (!engagement || engagement.active);
  const recipients = direct ? roomShareContacts(contacts, clients) : engagement
    ? contacts.filter(c => c.client_id === engagement.client_id && c.active && c.portal_enabled)
    : roomNdaRecipients(requests, room.content_id);
  const shownRecipients = recipients.filter(c => [c.name, c.email, c.client_name].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  let prepared = null, recipientError = "";
  if (direct) {
    try { prepared = directRoomRecipients(recipients, selected, additionalRecipients); }
    catch (error) { recipientError = error.message; }
  }
  const recipientCount = direct ? prepared?.count || 0 : selected.length;
  const emailReady = direct ? prepared?.emailReady : selected.length > 0 && selected.every(id => recipients.some(c => c.id === id && c.circulation));
  const authorisationReady = !direct || (authorisationConfirmed && authorisationReason.trim().length >= 5);
  const select = id => setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  function changeBasis(value) {
    setAccessBasis(value); setSelected([]); setSearch(""); setAdditionalRecipients("");
    setAuthorisationReason(""); setAuthorisationConfirmed(false); setMessage(""); request.current = null;
  }
  useEffect(() => {
    let mounted = true, checking = false;
    async function readStatus() {
      if (document.visibilityState === "hidden" || checking) return;
      checking = true;
      try {
        const [result,ready]=await Promise.all([portalAction("room_share",{action:"status",room_id:room.id}),portalAction("room_share",{action:"readiness",room_id:room.id,download_mode:mode})]);
        if(mounted)setReadiness(ready);
        if (mounted) { setReceipts(result); setStatusError(false); }
      } catch {
        if (mounted) setStatusError(true);
      } finally { checking = false; }
    }
    readStatus();
    const interval = window.setInterval(readStatus, 30000);
    document.addEventListener("visibilitychange", readStatus);
    return () => { mounted = false; clearInterval(interval); document.removeEventListener("visibilitychange", readStatus); };
  }, [room.id, room.version, refresh, mode]);
  async function share(event) {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || "share";
    if (inFlight.current || !recipientCount || recipientError || !authorisationReady || (action === "share" && !emailReady)) return;
    const f = new FormData(event.currentTarget);
    const payload = { action, room_id: room.id, recipient_ids: [...selected].sort(), download_mode: f.get("mode"),
      expires_at: new Date(f.get("expiry") + "T23:59:59+05:30").toISOString() };
    if (direct) {
      Object.assign(payload, { access_basis: "admin_authorised", recipient_ids: prepared.recipient_ids,
        recipients: prepared.recipients, authorisation_reason: authorisationReason.trim(), confirm_authorisation: authorisationConfirmed });
    } else if (engagement && !engagement.confidentiality_confirmed) {
      payload.confirm_terms = f.get("terms") === "on";
      payload.terms_reference = f.get("reference");
      payload.engagement_version = engagement.version;
    }
    const signature = JSON.stringify(payload);
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      const result = await portalAction("room_share", { ...payload, batch_id: request.current.id });
      const count = result.recipients;
      setMessage("Room access active for " + count + (count === 1 ? " recipient." : " recipients.") +
        (action === "access" ? " Access only. No email requested." : " Email notices queued: " + result.queued + "." +
          (result.recent ? " Already notified or queued recently: " + result.recent + "." : "")));
      request.current = null; setSelected([]); setAdditionalRecipients("");
      setAuthorisationReason(""); setAuthorisationConfirmed(false); setRefresh(n => n + 1); router.refresh();
    } catch (e) { setMessage(e.message || "Sharing could not be confirmed. Retry the same selection."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <section id="room-permissions" className="room-share-panel workspace-card" aria-labelledby="room-share-title">
    <h3 id="room-share-title">Share this room</h3>
    {readiness&&!readiness.ready&&<div role="status"><strong>{readiness.issues.length} files need attention before sharing</strong><ul>{readiness.issues.map(f=><li key={f.id}>{f.name}: {f.reason}</li>)}</ul><p>Existing permissions remain in place. Review each original and preview below.</p></div>}
    {!roomAvailable && <p>This room or its engagement is paused. Reactivate it before sharing.</p>}
    <fieldset className="contact-picker" disabled={busy}>
      <legend>Access basis</legend>
      {standardAvailable && <label className="check"><input type="radio" name="room-access-basis" value="standard"
        checked={!direct} onChange={() => changeBasis("standard")} />
        {engagement ? "Engagement contacts" : "Approved NDA recipients"}</label>}
      <label className="check"><input type="radio" name="room-access-basis" value="admin_authorised"
        checked={direct} onChange={() => changeBasis("admin_authorised")} />Admin-authorised access</label>
    </fieldset>
    {direct ? <p>Share this room with selected client contacts or any named email recipient, including someone who has not registered yet. Your authorisation applies only to this room and these recipients; a signed NDA is not required for this access.</p>
      : <p>{engagement ? "Share under the engagement’s confidentiality terms." : "Share with recipients whose signed NDA has been approved for this project."} To grant access separately, choose Admin-authorised access.</p>}
    {!direct && recipients.length === 0 ? <p>{engagement
      ? <><Link href="/admin/clients">Add an active contact with portal access to this client</Link>, or choose Admin-authorised access above to invite someone by email.</>
      : <>There are no eligible approved NDA recipients. <Link href="/admin/nda">Review NDA requests</Link>, or choose Admin-authorised access above to share before an NDA is signed.</>}</p> :
    <form className="workspace-form" onSubmit={share}>
      {!!recipients.length && <fieldset className="wide contact-picker" disabled={busy}>
        <legend>{direct ? "Existing client contacts (optional)" : engagement ? "Client contacts" : "Recipients with an approved project NDA"}</legend>
        <label>Find a recipient<input value={search} onChange={e => setSearch(e.target.value)} type="search"
          placeholder={direct ? "Name, email or client" : "Name or email"} /></label>
        <p>{selected.length} selected · {shownRecipients.length} matching contacts</p>
        <button type="button" className="text-button" onClick={() => setSelected(shownRecipients.slice(0, ROOM_SHARE_LIMIT).map(c => c.id))}>
          {shownRecipients.length > ROOM_SHARE_LIMIT ? "Select first 50 shown" : "Select shown"}</button>{" "}
        <button type="button" className="text-button" onClick={() => setSelected([])}>Clear selection</button>
        <div className="contact-picker-list">{shownRecipients.map(c => {
          const grant = grants.find(g => direct ? g.access_basis === "admin_authorised" &&
            (g.recipient_contact_id === c.id || g.recipient_email?.toLowerCase() === c.email.toLowerCase())
            : (engagement ? g.contact_id : g.nda_request_id) === c.id);
          const active = grant?.active && new Date(grant.expires_at) > new Date();
          return <label className="check" key={c.id}><input type="checkbox" checked={selected.includes(c.id)}
            disabled={!selected.includes(c.id) && selected.length >= ROOM_SHARE_LIMIT} onChange={() => select(c.id)} />
            <span><strong>{c.name}</strong><span>{c.email}{c.client_name ? " · " + c.client_name : ""}</span><small>{active ? "Already has access" : grant ? "Renew access" : "New access"}
              {!c.circulation && " · Email circulation off"}</small></span></label>;
        })}</div>
      </fieldset>}
      {direct && <>
        <label className="wide">Invite by email<textarea value={additionalRecipients} disabled={busy} rows={4}
          maxLength={20000} onChange={e => setAdditionalRecipients(e.target.value)} aria-describedby="room-recipient-help"
          aria-invalid={!!recipientError} placeholder={"client@example.com\nClient Name <another@example.com>"} /></label>
        <p className="wide" id="room-recipient-help">One email per line; names are optional. Choose existing contacts above, enter email addresses, or use both. Up to 50 recipients per share. A client record is not required.</p>
        {recipientError && <p role="alert" className="wide">{recipientError}</p>}
        <label className="wide">Reason for admin-authorised access<textarea required minLength={5} maxLength={500} rows={2}
          value={authorisationReason} disabled={busy} onChange={e => setAuthorisationReason(e.target.value)}
          placeholder="Record why these recipients may access this room before or without an NDA." /></label>
        <label className="check wide"><input required type="checkbox" checked={authorisationConfirmed} disabled={busy}
          onChange={e => setAuthorisationConfirmed(e.target.checked)} />
          I authorise these selected recipients to access this room. An NDA is not required for this access, and my decision will be recorded in the audit trail.</label>
      </>}
      {!direct && engagement && !engagement.confidentiality_confirmed && <>
        <label className="wide">Executed agreement reference<input name="reference" required minLength={5} maxLength={500}
          defaultValue={engagement.confidentiality_reference || ""} /></label>
        <label className="check wide"><input required type="checkbox" name="terms" />
          I have verified that the executed engagement and confidentiality terms authorise disclosure to these contacts.</label>
      </>}
      <label>Download permissions<select value={mode} disabled={busy} onChange={e=>setMode(e.target.value)} name="mode">
        <option value="none">View only</option><option value="all">Allow downloads where file settings permit</option>
        <option value="selected">Only files individually approved for download</option></select></label>
      <label>Access expires at end of day, IST<input name="expiry" required type="date" disabled={busy} defaultValue={expiryDate()} /></label>
      <p className="wide">These settings apply to new or renewed access. Active recipients keep their current permissions. Recipients must sign in with the invited email address; copying a link alone does not grant access. Share &amp; email sends each recipient a separate invitation.</p>
      {!!recipientCount && !emailReady && <p className="wide">One or more selected contacts have email circulation turned off. Choose access only or update their circulation preference in Clients &amp; engagements.</p>}
      <div className="workspace-actions wide">
        <button className="primary" value="share" disabled={busy || !roomAvailable || !emailReady || !authorisationReady || !!recipientError}>Share &amp; email{recipientCount ? " ("+recipientCount+")" : ""}</button>
        <button value="access" disabled={busy || !roomAvailable || !recipientCount || !authorisationReady || !!recipientError}>Grant access only</button>
      </div>
    </form>}
    {message && <p role="status" className="portal-message">{message}</p>}
    <h4>Email delivery</h4>
    {statusError && <p role="status">Delivery status is temporarily unavailable.</p>}
    {receipts?.length ? <div className="table-scroll"><table className="workspace-table"><thead><tr>
      <th scope="col">Recipient</th><th scope="col">Latest email</th><th scope="col">Queued at, IST</th></tr></thead>
      <tbody>{receipts.map(row => <tr key={row.recipient}><td>{row.recipient}</td><td>{deliveryLabels[row.status] || row.status}</td>
        <td>{dateInIndia.format(new Date(row.created_at))}</td></tr>)}</tbody></table></div> :
      !statusError && <p>{receipts ? "No email notices recorded for this room." : "Checking email delivery…"}</p>}
  </section>;
}
