"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../account/profile";
export default function NdaManager({ requests, templates, isOwner }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function run(p) {
    setBusy(true);
    setMessage("");
    try {
      await portalAction("nda_admin", p);
      setMessage("Saved.");
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-card">
      <h2>NDA & disclosure requests</h2>
      <p>
        Approval confirms this project’s NDA review. Use Project data rooms to
        grant access, choose download permissions and set an expiry.
      </p>
      <p role="status" className="portal-message">
        {message}
      </p>
      {requests.map((r) => (
        <article className="workspace-card" key={r.id}>
          <h3>{r.public_title}</h3>
          <p>
            {r.status} · {r.signed_name || "Acceptance pending"} · User{" "}
            {r.user_id}
          </p>
          <p>{r.purpose}</p>
          {r.accepted_at && (
            <details>
              <summary>Acceptance evidence</summary>
              <p>
                {r.signed_name} · {r.organisation} ·{" "}
                {new Date(r.accepted_at).toISOString()}
              </p>
              <p>
                Version {r.agreement_snapshot?.version} ·{" "}
                {r.agreement_snapshot?.recipient_email}
              </p>
              <div className="agreement-text">{r.agreement_snapshot?.body}</div>
              <p className="workspace-note">
                SHA-256: {r.agreement_snapshot?.sha256}
              </p>
            </details>
          )}
          <form
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run({
                action: "review",
                id: r.id,
                version: r.version,
                status: f.get("status"),
                note: f.get("note"),
              });
            }}
          >
            <label>
              Decision
              <select name="status" required defaultValue="">
                <option value="">Choose a decision</option>
                <option value="approved">Approve disclosure request</option>
                <option value="declined">Decline</option>
                <option value="revoked">Revoke approval</option>
              </select>
            </label>
            <label className="wide">
              Response visible to the requester
              <textarea
                name="note"
                maxLength={2000}
                defaultValue={r.response_note}
              />
            </label>
            <button
              className="primary"
              disabled={busy || ["withdrawn", "revoked"].includes(r.status)}
            >
              Record decision
            </button>
          </form>
        </article>
      ))}
      {!requests.length && <p>No requests received.</p>}
      <h2>Agreement versions</h2>
      {templates.map((t) => (
        <details key={t.id}>
          <summary>
            {t.version} · {t.status} · {t.title}
          </summary>
          <div className="agreement-text">{t.body}</div>
          {isOwner && t.status === "draft" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run({
                  action: "template_publish",
                  id: t.id,
                  legal_reviewed: true,
                });
              }}
            >
              <label className="check">
                <input required type="checkbox" />
                The legal wording and scope have been reviewed and approved for
                this website’s disclosure process.
              </label>
              <button className="primary" disabled={busy}>
                Activate this version
              </button>
            </form>
          )}
          {isOwner && t.status === "active" && (
            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Retire this agreement and pause new acceptances?"))
                  run({ action: "template_retire", id: t.id });
              }}
            >
              Retire agreement
            </button>
          )}
        </details>
      ))}
      {isOwner && (
        <form
          className="workspace-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run({
              action: "template_create",
              version: f.get("version"),
              title: f.get("title"),
              body: f.get("body"),
            });
          }}
        >
          <h3 className="wide">Create a new draft version</h3>
          <label>
            Version reference
            <input name="version" maxLength={60} required />
          </label>
          <label>
            Title
            <input name="title" maxLength={180} required />
          </label>
          <label className="wide">
            Complete agreement text
            <textarea
              name="body"
              minLength={100}
              maxLength={30000}
              required
              className="body-editor"
            />
          </label>
          <p className="wide">
            Published agreement text is immutable. Create a new version for
            changes; previous acceptance receipts retain the exact original
            wording.
          </p>
          <button className="primary" disabled={busy}>
            Save draft agreement
          </button>
        </form>
      )}
    </section>
  );
}
