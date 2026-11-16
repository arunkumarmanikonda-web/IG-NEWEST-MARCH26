"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../account/profile";

const deliveryLabels = {
  awaiting_provider: "Queued", queued: "Queued", accepted: "Sent · accepted by email provider",
  delivered: "Delivered to mail server", failed: "Delivery attempt failed", suppressed: "Delivery blocked",
};
const dateInIndia = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
function expiryDate() {
  return new Date(Date.now() + (30 * 24 + 5.5) * 3600000).toISOString().slice(0, 10);
}

export default function RoomSharing({ room, engagement, contacts, requests, grants }) {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [receipts, setReceipts] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [statusError, setStatusError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef(null);
  const inFlight = useRef(false);
  const ndaCutoff = new Date();
  ndaCutoff.setUTCFullYear(ndaCutoff.getUTCFullYear() - 3);
  const roomAvailable = room.active && (!engagement || engagement.active);
  const recipients = engagement
    ? contacts.filter(c => c.client_id === engagement.client_id && c.active && c.portal_enabled)
    : requests.filter(n => n.content_id === room.content_id && n.status === "approved" && n.agreement_snapshot?.recipient_email &&
        new Date(n.accepted_at) > ndaCutoff)
        .map(n => ({ id: n.id, name: n.signed_name, email: n.agreement_snapshot.recipient_email, circulation: true }));
  const emailReady = selected.length > 0 && selected.every(id => recipients.some(c => c.id === id && c.circulation));
  const select = id => setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  useEffect(() => {
    let mounted = true, checking = false;
    async function readStatus() {
      if (document.visibilityState === "hidden" || checking) return;
      checking = true;
      try {
        const result = await portalAction("room_share", { action: "status", room_id: room.id });
        if (mounted) { setReceipts(result); setStatusError(false); }
      } catch {
        if (mounted) setStatusError(true);
      } finally { checking = false; }
    }
    readStatus();
    const interval = window.setInterval(readStatus, 30000);
    document.addEventListener("visibilitychange", readStatus);
    return () => { mounted = false; clearInterval(interval); document.removeEventListener("visibilitychange", readStatus); };
  }, [room.id, refresh]);
  async function share(event) {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || "share";
    if (inFlight.current || !selected.length || (action === "share" && !emailReady)) return;
    const f = new FormData(event.currentTarget);
    const payload = { action, room_id: room.id, recipient_ids: [...selected].sort(), download_mode: f.get("mode"),
      expires_at: new Date(f.get("expiry") + "T23:59:59+05:30").toISOString() };
    if (engagement && !engagement.confidentiality_confirmed) {
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
      request.current = null; setSelected([]); setRefresh(n => n + 1); router.refresh();
    } catch (e) { setMessage(e.message || "Sharing could not be confirmed. Retry the same selection."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <section id="room-permissions" className="room-share-panel workspace-card" aria-labelledby="room-share-title">
    <h3 id="room-share-title">Share this room</h3>
    {!roomAvailable && <p>This room or its engagement is paused. Reactivate it before sharing.</p>}
    {recipients.length === 0 ? <p>{engagement
      ? <Link href="/admin/clients">Add an active contact with portal access to this client.</Link>
      : <Link href="/admin/nda">Review the signed NDA requests for this project.</Link>}</p> :
    <form className="workspace-form" onSubmit={share}>
      <fieldset className="wide contact-picker" disabled={busy}>
        <legend>{engagement ? "Client contacts" : "Recipients with an approved project NDA"}</legend>
        <button type="button" className="text-button" onClick={() => setSelected(recipients.slice(0,50).map(c => c.id))}>
          {recipients.length > 50 ? "Select first 50" : "Select all"}</button>{" "}
        <button type="button" className="text-button" onClick={() => setSelected([])}>Clear selection</button>
        <div className="contact-picker-list">{recipients.map(c => {
          const grant = grants.find(g => (engagement ? g.contact_id : g.nda_request_id) === c.id);
          const active = grant?.active && new Date(grant.expires_at) > new Date();
          return <label className="check" key={c.id}><input type="checkbox" checked={selected.includes(c.id)}
            disabled={!selected.includes(c.id) && selected.length >= 50} onChange={() => select(c.id)} />
            <span><strong>{c.name}</strong><span>{c.email}</span><small>{active ? "Already has access" : grant ? "Renew access" : "New access"}
              {!c.circulation && " · Email circulation off"}</small></span></label>;
        })}</div>
      </fieldset>
      {engagement && !engagement.confidentiality_confirmed && <>
        <label className="wide">Executed agreement reference<input name="reference" required minLength={5} maxLength={500}
          defaultValue={engagement.confidentiality_reference || ""} /></label>
        <label className="check wide"><input required type="checkbox" name="terms" />
          I have verified that the executed engagement and confidentiality terms authorise disclosure to these contacts.</label>
      </>}
      <label>Download permissions<select name="mode" defaultValue="none">
        <option value="none">View only</option><option value="all">Allow downloads where file settings permit</option>
        <option value="selected">Only files individually approved for download</option></select></label>
      <label>Access expires at end of day, IST<input name="expiry" required type="date" defaultValue={expiryDate()} /></label>
      <p className="wide">These settings apply to new or renewed access. Active recipients keep their current permissions. Each selected recipient receives a separate secure link when you choose Share &amp; email.</p>
      {!!selected.length && !emailReady && <p className="wide">One or more selected contacts have email circulation turned off. Choose access only or update their circulation preference in Clients &amp; engagements.</p>}
      <div className="workspace-actions wide">
        <button className="primary" value="share" disabled={busy || !roomAvailable || !emailReady}>Share &amp; email{selected.length ? " ("+selected.length+")" : ""}</button>
        <button value="access" disabled={busy || !roomAvailable || !selected.length}>Grant access only</button>
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
