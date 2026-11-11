"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../profile";
const date = (x) =>
  new Date(x).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
export default function NdaAccount({
  requests,
  template,
  opportunities,
  selected,
  profile,
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function run(payload) {
    setBusy(true);
    setMessage("");
    try {
      await portalAction("nda", payload);
      router.refresh();
      setMessage("Your request has been updated.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form
        className="workspace-card workspace-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          run({
            action: "request",
            slug: f.get("slug"),
            purpose: f.get("purpose"),
          });
        }}
      >
        <h2 className="wide">Request an opportunity dossier</h2>
        <label className="wide">
          Opportunity
          <select name="slug" defaultValue={selected} required>
            <option value="">Choose an opportunity</option>
            {opportunities.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.title}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          Evaluation purpose
          <textarea
            name="purpose"
            required
            minLength={10}
            maxLength={2000}
            placeholder="Your investment or operating objective, the organisation represented and information needed."
          />
        </label>
        <p className="wide">
          A request does not grant access. The team reviews each request against
          the mandate’s disclosure conditions.
        </p>
        <button className="primary" disabled={busy}>
          Record request
        </button>
      </form>
      {!template && (
        <p className="workspace-note">
          The applicable agreement is being prepared. You can record your
          request now; acceptance becomes available once the agreement is
          approved for use.
        </p>
      )}
      <p role="status" className="portal-message">
        {message}
      </p>
      {requests.map((r) => (
        <article className="workspace-card" key={r.id}>
          <div className="eyebrow">
            {r.status.replaceAll("_", " ")} · {date(r.created_at)} IST
          </div>
          <h2>{r.public_title}</h2>
          <p>{r.purpose}</p>
          {r.response_note && (
            <p className="workspace-note">India Gully: {r.response_note}</p>
          )}
          {r.status === "requested" && template && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run({
                  action: "accept",
                  id: r.id,
                  version: r.version,
                  template_id: template.id,
                  signed_name: f.get("signed_name"),
                  organisation: f.get("organisation"),
                  agreed: true,
                  authority: true,
                });
              }}
            >
              <h3>{template.title}</h3>
              <p>
                Version {template.version}. Read the complete agreement before
                accepting.
              </p>
              <div className="agreement-text">{template.body}</div>
              <label>
                Full legal name
                <input
                  name="signed_name"
                  defaultValue={profile.display_name}
                  minLength={2}
                  maxLength={120}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Organisation, if represented
                <input
                  name="organisation"
                  defaultValue={profile.company}
                  maxLength={180}
                  autoComplete="organization"
                />
              </label>
              <label className="check">
                <input type="checkbox" required />I have read and accept this
                agreement for the opportunity and purpose recorded above.
              </label>
              <label className="check">
                <input type="checkbox" required />I am authorised to make this
                undertaking for myself and any organisation identified above.
              </label>
              <button className="primary" disabled={busy}>
                Accept agreement and submit for review
              </button>
            </form>
          )}
          {r.accepted_at && (
            <details>
              <summary>View acceptance receipt</summary>
              <dl className="receipt">
                <dt>Accepted by</dt>
                <dd>
                  {r.signed_name}
                  {r.organisation ? " · " + r.organisation : ""}
                </dd>
                <dt>Account</dt>
                <dd>{r.agreement_snapshot?.recipient_email}</dd>
                <dt>Agreement version</dt>
                <dd>{r.agreement_snapshot?.version}</dd>
                <dt>Accepted at</dt>
                <dd>{date(r.accepted_at)} IST</dd>
                <dt>Record</dt>
                <dd>{r.id}</dd>
                <dt>Text SHA-256</dt>
                <dd>{r.agreement_snapshot?.sha256}</dd>
              </dl>
              <div className="agreement-text">{r.agreement_snapshot?.body}</div>
              <p>
                Method: typed name and explicit electronic acceptance. This is
                not a certificate-based digital signature.
              </p>
            </details>
          )}
          {r.status === "approved" && (
            <p className="workspace-note">
              Your disclosure request is approved. The advisory team will
              coordinate the permitted information through the agreed delivery
              process.
            </p>
          )}
          {!["withdrawn", "revoked"].includes(r.status) && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "Withdraw this information request? Existing confidentiality obligations remain in force.",
                  )
                )
                  run({ action: "withdraw", id: r.id, version: r.version });
              }}
            >
              Withdraw request
            </button>
          )}
        </article>
      ))}
      {!requests.length && <p>You have no information requests yet.</p>}
    </>
  );
}
