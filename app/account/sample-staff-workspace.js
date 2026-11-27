"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { browserClient } from "../../lib/supabase/browser";
import "../brand-workspace.css";

async function post(path, body) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The operation could not be completed.");
  return result;
}
const records = input => post("/api/play-review/records", input);
const files = input => post("/api/data-room/upload", { ...input, workspace: "assigned-sample" });

export default function SampleStaffWorkspace({ initial }) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const active = useRef(false);
  async function execute(action, message) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setStatus("");
    try {
      await action();
      setData(await records({ action: "overview" }));
      setStatus(message);
    } catch (error) {
      setStatus(error.message || "Please try again.");
    } finally {
      active.current = false;
      setBusy(false);
    }
  }
  async function upload(form) {
    const entry = new FormData(form);
    const file = entry.get("file");
    if (!file || !file.size || file.size > 20 * 1024 * 1024) throw new Error("Choose a file up to 20 MB.");
    const request = crypto.randomUUID();
    const slot = await files({ action: "prepare", request, item: entry.get("purpose"), name: file.name, mime: file.type, bytes: file.size });
    const { error } = await browserClient().storage.from("ig-data-rooms").uploadToSignedUrl(slot.path, slot.token, file, { contentType: file.type, upsert: false });
    if (error) throw new Error("The private file upload failed. Please retry.");
    await files({ action: "complete", id: slot.id, version: slot.version });
    form.reset();
  }
  return <main id="main" className="auth-page account-dashboard"><div>
    <header className="portal-form"><div className="eyebrow">India Gully · Staff workspace</div><h1>Assigned sample projects</h1>
      <p>Edit the hotel listing and its catalogue item, share documents with the sample client, and test payment links.</p>
    </header>
    {status && <p role="status" className="portal-form">{status}</p>}
    {data.items.map(record => <form key={record.item + record.version} className="portal-form" onSubmit={event => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      execute(() => records({ action: "edit", item: record.item, version: record.version, title: fields.get("title"), summary: fields.get("summary") }), "Changes saved.");
    }}>
      <h2>{record.item === "listing" ? "Hospitality listing" : "Catalogue item"}</h2>
      <label>Title<input required name="title" maxLength={180} defaultValue={record.title}/></label>
      <label>Summary<textarea name="summary" maxLength={500} defaultValue={record.summary}/></label>
      <button className="button" disabled={busy}>Save {record.item === "listing" ? "listing" : "catalogue item"}</button>
    </form>)}
    <section className="portal-form"><h2>Files and catalogue media</h2>
      <form onSubmit={e => { e.preventDefault(); const form = e.currentTarget; execute(() => upload(form), "Upload checked. You can now share it with the sample client."); }}>
        <label>Use<select name="purpose"><option value="document">Hotel document</option><option value="image">Catalogue image</option></select></label>
        <label>File, up to 20 MB<input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required/></label>
        <button className="button" disabled={busy}>Upload private file</button>
      </form>
      <ul>{data.files.map(f => <li key={f.id}>{f.name} · {f.purpose === "image" ? "Catalogue image" : "Hotel document"} · {f.shared ? "Shared with sample client" : <button type="button" disabled={busy} onClick={() => execute(() => records({ action: "share", id: f.id }), "Shared in the sample client’s hotel room.")}>Share with sample client</button>}</li>)}</ul>
    </section>
    <section className="portal-form"><h2>Simulated payment links</h2>
      <form onSubmit={e => {
        e.preventDefault();
        const form = e.currentTarget;
        const fields = new FormData(form);
        const request = paymentRequest || crypto.randomUUID();
        setPaymentRequest(request);
        execute(async () => { await records({ action: "payment", request, amount: fields.get("amount"), purpose: fields.get("purpose") }); setPaymentRequest(null); form.reset(); }, "Sample payment link created.");
      }}>
        <label>Amount in rupees<input type="number" name="amount" min="0.01" max="100000" step="0.01" required/></label>
        <label>Purpose<input name="purpose" maxLength={100} required/></label>
        <button className="button" disabled={busy}>Create simulated link</button>
      </form>
      <ul>{data.links.map(link => <li key={link.id}><Link href={"/account/review-payment/" + link.id}>{link.purpose} · ₹{Number(link.amount).toLocaleString("en-IN")}</Link></li>)}</ul>
    </section>
    <Link className="button secondary" href="/login/mobile">Sign out of this session</Link>
  </div></main>;
}
