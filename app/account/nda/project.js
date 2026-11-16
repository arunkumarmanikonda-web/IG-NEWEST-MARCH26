"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AgreementText from "../../agreement-text";
import { portalAction } from "../profile";
import Identities from "../legal-names/identities";

export default function ProjectRequest({
  item,
  template,
  disclaimer,
  entities,
  request,
  offline,
  feature = null,
}) {
  const router = useRouter();
  const verified = entities.filter((e) => e.status === "verified");
  const [entityId, select] = useState(
    verified.length === 1 ? verified[0].id : "",
  );
  const [purpose, setPurpose] = useState(request?.purpose || ""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const entity = verified.find((e) => e.id === entityId);
  async function send(module, p) {
    setBusy(true);
    setMessage("");
    try {
      await portalAction(module, feature ? { ...p, feature_id: feature } : p);
      router.refresh();
      setMessage(
        p.action !== "request"
          ? "Your signed agreement has been submitted for access review."
          : "Your request has been recorded.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (request && request.status !== "requested")
    return (
      <section className="workspace-card">
        <h2>{item.title}</h2>
        <p>Access request · {request.status}</p>
        {request.accepted_at && (
          <details>
            <summary>View your signed agreement and receipt</summary>
            <p>
              {request.signed_name} ·{" "}
              {request.agreement_snapshot?.legal_name || request.organisation} ·{" "}
              {new Date(request.accepted_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </p>
            <p>
              Receipt {request.id} · Version{" "}
              {request.agreement_snapshot?.version}
            </p>
            <AgreementText text={request.agreement_snapshot?.body}/>
            {request.agreement_snapshot?.disclaimer && <p>{request.agreement_snapshot.disclaimer}</p>}
          </details>
        )}
        {request.response_note && <p>{request.response_note}</p>}
        <Link href="/account/data-rooms">View my granted data rooms</Link>
      </section>
    );
  return (
    <>
      <header>
        <h1>Request Data Room Access</h1>
        <p>{item.title}</p>
      </header>
      {verified.length ? (
        <details className="workspace-card">
          <summary>Manage or add a legal name</summary>
          <Identities entities={entities} offline={offline} />
        </details>
      ) : (
        <Identities entities={entities} offline={offline} />
      )}
      <section className="workspace-card">
        <h2>Project Confidentiality Agreement</h2>
        <p>
          {request
            ? "Your project request is on file."
            : "Request confidential documents for this project."}{" "}
          India Gully reviews access after you sign.
        </p>
        <form
          className="workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            if (template && entity)
              send("project_signature", {
                slug: item.slug,
                kind: item.kind,
                entity_id: entity.id,
                purpose,
                template_id: template.id,
                accepted: f.has("accepted"),
                disclaimer,
              });
            else
              send("project_signature", {
                action: "request",
                kind: item.kind,
                slug: item.slug,
                purpose,
              });
          }}
        >
          <label className="wide">
            Purpose of access
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <label className="wide">
            Legal name
            <select value={entityId} onChange={(e) => select(e.target.value)}>
              <option value="">Select a verified legal name</option>
              {verified.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.legal_name}
                </option>
              ))}
            </select>
          </label>
          {template ? (
            <>
              <h3 className="wide">{template.title}</h3>
              <p>Version {template.version}</p>
              <AgreementText wide text={[
                  item.title,
                  "Recipient: " + (entity?.legal_name || "Select a legal name"),
                  "Authorised signatory: " +
                    (entity?.signer || "Pending selection"),
                  "Purpose: " + purpose.trim(),
                  "",
                  template.body,
                ].join("\n")}/>
            </>
          ) : (
            <p className="wide">
              India Gully is preparing the agreement for this project. You can
              register your interest and complete identity review now.
            </p>
          )}
          {template && entity ? (
            <>
              <label className="check wide" key={JSON.stringify([template.id,entity.id,purpose,disclaimer])}>
                <input type="checkbox" name="accepted" required />{disclaimer}
              </label>
              <button className="primary" disabled={busy}>
                Accept and Submit
              </button>
            </>
          ) : (
            !request && (
              <button className="primary" disabled={busy}>
                Record Project Access Request
              </button>
            )
          )}
        </form>
        <p role="status">{message}</p>
      </section>
    </>
  );
}
