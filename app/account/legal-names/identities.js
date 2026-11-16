"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalAction } from "../profile";
import { browserClient } from "../../../lib/supabase/browser";
import { slotLabels, evidenceSlots } from "../../../lib/identity-evidence.mjs";

function IdentityFields({ entity, offline, busy, run, finish }) {
  const [kind, setKind] = useState(entity?.kind || "company");
  return (
    <form
      className="workspace-form"
      onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        run(async () => {
          await portalAction("identity", {
            ...values,
            action: entity ? "edit" : "create",
            id: entity?.id,
            revision: entity?.revision,
            consent: true,
          });
          finish();
        });
      }}
    >
      <label>
        Register as
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="company">Company</option>
          <option value="individual">Individual</option>
        </select>
      </label>
      <label>
        Full legal name
        <input
          name="legal_name"
          minLength={2}
          maxLength={kind === "individual" ? 120 : 180}
          defaultValue={entity?.legal_name}
          required
        />
      </label>
      <label>
        {kind === "company" ? "Date of incorporation" : "Date of birth"}
        <input
          type="date"
          name="vital_date"
          defaultValue={entity?.vital_date}
          required
        />
      </label>
      {kind === "company" ? (
        <>
          <label>
            Corporate Identification Number (CIN)
            <input
              name="cin"
              pattern="[LlUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}"
              defaultValue={entity?.cin}
              required
            />
          </label>
          <label>
            GSTIN
            <input
              name="gstin"
              pattern="[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z][Zz][0-9A-Za-z]"
              defaultValue={entity?.gstin}
              required
            />
          </label>
          <label>
            Authorised signatory named in the board resolution
            <input
              name="signer"
              minLength={2}
              maxLength={120}
              defaultValue={entity?.signer}
              required
            />
          </label>
        </>
      ) : (
        <>
          <label>
            Permanent Account Number (PAN)
            <input
              name="pan"
              pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
              defaultValue={entity?.pan}
              required
            />
          </label>
          <label>
            Second identity document
            <select
              name="id_method"
              defaultValue={entity?.id_method || "passport"}
            >
              <option value="passport">Passport identity page</option>
              {offline && (
                <option value="aadhaar_offline">
                  Voluntary Aadhaar offline verification
                </option>
              )}
            </select>
          </label>
        </>
      )}
      <label className="check wide">
        <input type="checkbox" required />I authorise India Gully to compare the
        supplied identity documents with these particulars, retain the
        verification record for account and agreement administration, and make
        it available to authorised reviewers. I am authorised to supply these
        records.
      </label>
      <p className="wide">
        Use this verified name for project agreements and procurement. For
        consent or deletion requests, visit{" "}
        <a href="/account/privacy">Privacy requests</a>.
      </p>
      <button className="primary" disabled={busy}>
        {entity
          ? "Save corrections and replace evidence"
          : "Save legal name and continue"}
      </button>
    </form>
  );
}
function Evidence({ entity, slot, busy, run }) {
  const [file, setFile] = useState(null);
  const result = entity.checks[slot];
  const offline = slot === "aadhaar_offline";
  return (
    <div className="workspace-card">
      <strong>{slotLabels[slot]}</strong>
      {result && (
        <p>
          {result.status === "matched"
            ? "Document particulars match."
            : "Requires review."}{" "}
          {Object.entries(result.fields)
            .filter(([, v]) => !v)
            .map(([k]) => k)
            .join(" · ")}
        </p>
      )}
      {(!result || (offline && result.status !== "matched")) && (
        <>
          <label>
            {offline
              ? "Select the extracted XML. Only the check result is retained."
              : "Upload a PDF, JPEG or PNG"}
            <input
              type="file"
              accept={offline ? ".xml" : "application/pdf,image/png,image/jpeg"}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          {offline && (
            <p>
              By choosing Check this document, you consent to India Gully
              checking the UIDAI signature, legal name and date of birth for
              this application. The XML is processed in memory. You can choose a
              passport instead.
            </p>
          )}
          <button
            type="button"
            disabled={busy || (offline && !file)}
            onClick={() =>
              run(async () => {
                if (file && !offline) {
                  const key = [
                    entity.user_id,
                    entity.id,
                    entity.revision,
                    slot,
                  ].join("/");
                  const { error } = await browserClient()
                    .storage.from("client-kyc")
                    .upload(key, file, { upsert: false });
                  // A saved immutable upload may already exist if the earlier check was interrupted.
                  if (
                    error &&
                    !(
                      /already exists|duplicate/i.test(error.message) ||
                      Number(error.statusCode) === 409
                    )
                  )
                    throw new Error(
                      "The document could not be uploaded. Check the connection and retry.",
                    );
                }
                const response = await fetch("/api/account/identity-check", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: entity.id,
                    revision: entity.revision,
                    slot,
                    ...(offline ? { xml: await file.text() } : {}),
                  }),
                });
                const outcome = await response
                  .json()
                  .catch(() => ({
                    error:
                      "Document processing was interrupted. Retry the saved upload.",
                  }));
                if (!response.ok) throw new Error(outcome.error);
              })
            }
          >
            {busy
              ? "Working…"
              : file
                ? "Check this document"
                : "Check previously uploaded document"}
          </button>
        </>
      )}
    </div>
  );
}
export default function Identities({ entities, offline = false }) {
  const [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function run(fn) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      router.refresh();
      setMessage("Your identity record has been updated.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-card">
      <h2>Your Legal Names</h2>
      <p>
        Add the individual or company that will sign. Each verified legal name
        is available for future projects and HORECA requests.
      </p>
      {entities.map((e) => (
        <article className="workspace-card" key={e.id}>
          <h3>{e.legal_name}</h3>
          <p>
            {
              {
                draft: "Documents pending",
                submitted: "With India Gully for review",
                verified: "Verified and available to use",
                needs_changes: "Corrections requested",
              }[e.status]
            }
            {e.review_note && " · " + e.review_note}
          </p>
          {e.status === "draft" && (
            <>
              <p>
                Only upload the document requested in each field. Keep full
                Aadhaar numbers out of all uploads.
              </p>
              {evidenceSlots(e).map((slot) => (
                <Evidence
                  entity={e}
                  slot={slot}
                  key={e.revision + slot}
                  busy={busy}
                  run={run}
                />
              ))}
              <button
                className="primary"
                disabled={
                  busy ||
                  !evidenceSlots(e).every(
                    (slot) =>
                      e.checks[slot] &&
                      (slot !== "aadhaar_offline" ||
                        e.checks[slot].status === "matched"),
                  )
                }
                onClick={() =>
                  run(() =>
                    portalAction("identity", {
                      action: "submit",
                      id: e.id,
                      revision: e.revision,
                    }),
                  )
                }
              >
                Submit for verification
              </button>
            </>
          )}
          {["draft", "needs_changes"].includes(e.status) && (
            <details
              onToggle={(event) => {
                if (event.currentTarget.open) setEditing(e.id);
              }}
            >
              <summary>Correct details or replace documents</summary>
              {editing === e.id && (
                <>
                  <p>
                    Saving corrections starts a new document review for this
                    legal name.
                  </p>
                  <IdentityFields
                    entity={e}
                    offline={offline}
                    busy={busy}
                    run={run}
                    finish={() => setEditing(null)}
                  />
                </>
              )}
            </details>
          )}
        </article>
      ))}
      {editing === "new" || !entities.length ? (
        <IdentityFields
          offline={offline}
          busy={busy}
          run={run}
          finish={() => setEditing(null)}
        />
      ) : (
        <button type="button" disabled={busy} onClick={() => setEditing("new")}>
          Add another legal name
        </button>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
