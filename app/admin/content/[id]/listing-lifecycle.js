"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../../../account/profile";
import { archiveDateAfter, archiveDateDeadline, archiveDateLabel, indiaDate } from "../../../../lib/listing-schedule.mjs";
import "./listing-lifecycle.css";

const statuses = [["available","Available"],["under_offer","Under offer"],["reserved","Reserved"],["sold","Sold"],["withdrawn","Withdrawn"]];

export default function ListingLifecycle({ item, disabled = false }) {
  const router = useRouter();
  const lock = useRef(false);
  const [status,setStatus] = useState(item.listing_status || "available");
  const [label,setLabel] = useState(item.listing_status_label || "");
  const [keep,setKeep] = useState(Boolean(item.archive_until));
  const [date,setDate] = useState(item.archive_until ? indiaDate(item.archive_until) : archiveDateAfter(30));
  const [period,setPeriod] = useState(item.archive_until ? "custom" : "30");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const archived = item.listing_archived === true;
  const canonical = statuses.find(([value])=>value===status)?.[1] || "Available";
  async function submit(action) {
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      let deadline = null;
      if ((archived || action === "archive") && keep) {
        deadline = archiveDateDeadline(date);
        if (new Date(deadline).getTime() <= Date.now()) throw new Error("Choose today or a future display date.");
      }
      const result = await portalAction("listing_lifecycle", {
        id:item.id, lifecycle_version:item.listing_lifecycle_version || 1,
        action, status, label:label.trim(), archive_until:deadline,
      });
      setMessage(action === "archive" ? keep
        ? "Archived. The approved listing stays visible through " + archiveDateLabel(deadline) + " (India time)."
        : "Archived and removed from public listings. Your record and data room remain saved."
        : archived ? "Archive display settings updated." : result.public_visible
          ? "Availability updated on the published listing. Editorial draft changes remain unpublished."
          : "Availability saved. Publish the approved revision when you are ready to display this listing.");
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <section id="listing-availability" className="listing-lifecycle-panel" aria-labelledby="listing-lifecycle-title">
    <div className="listing-lifecycle-heading"><div><span className="eyebrow">PROPERTY STATUS</span><h3 id="listing-lifecycle-title">Availability & archive display</h3></div><span className="status-chip">{label.trim() || canonical}{label.trim() && label.trim().toLowerCase() !== canonical.toLowerCase() ? " · " + canonical : ""}{archived ? " · Archived" : ""}</span></div>
    <p>Keep the listing's commercial status current without republishing its description. A custom label adds your preferred wording while the underlying status remains clear to visitors and Gullu.</p>
    {disabled && <p className="workspace-note">Save your editorial changes before updating availability.</p>}
    <fieldset disabled={disabled || busy}>
      <div className="listing-lifecycle-fields">
        <label>Property status<select value={status} onChange={event=>setStatus(event.target.value)}>{statuses.map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></label>
        <label>Custom public label (optional)<input value={label} maxLength={50} onChange={event=>setLabel(event.target.value)} placeholder="e.g. Successfully placed"/><small>Use a label that accurately reflects the selected status.</small></label>
      </div>
      {!archived && <button type="button" className="primary" onClick={()=>submit("save")}>Save availability</button>}
      <div className="listing-archive-controls">
        <h4>{archived ? "Archived listing visibility" : "When you archive this listing"}</h4>
        <label className="check"><input type="checkbox" checked={keep} onChange={event=>setKeep(event.target.checked)}/>Keep the approved listing visible for a limited period</label>
        <p>{keep ? "Visitors can still read the approved property information with its status clearly marked. It is removed from active promotions and new data-room requests." : "Archiving removes the listing from the public website immediately."}</p>
        {keep && <div className="listing-lifecycle-fields"><label>Display period<select value={period} onChange={event=>{setPeriod(event.target.value);if(event.target.value!=="custom")setDate(archiveDateAfter(event.target.value));}}><option value="30">30 days from today</option><option value="60">60 days from today</option><option value="90">90 days from today</option><option value="custom">Custom date</option></select></label><label>Show through (India time)<input type="date" min={indiaDate()} required value={date} onChange={event=>{setDate(event.target.value);setPeriod("custom");}}/><small>Public visibility ends at 11:59:59 pm IST on this date.</small></label></div>}
        {archived && item.archive_until && <p>Current display deadline: <strong>{archiveDateLabel(item.archive_until)}</strong>. {new Date(item.archive_until).getTime() < Date.now() ? "The public display period has ended." : "The listing will disappear automatically after this date."}</p>}
        <button type="button" className={archived ? "primary" : ""} onClick={()=>submit(archived ? "save" : "archive")}>{archived ? "Save archive settings" : keep ? "Archive and keep visible until this date" : "Archive and hide now"}</button>
      </div>
    </fieldset>
    <p className="workspace-small">Only a previously published revision can remain on public display. Restoring creates a private draft; publish it again when ready. Existing authorised client data-room access is managed separately.</p>
    {message && <p role="status" className="workspace-note">{message}</p>}
  </section>;
}
