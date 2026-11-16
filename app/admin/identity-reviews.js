"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";
import { portalAction } from "../account/profile";
import { slotLabels } from "../../lib/identity-evidence.mjs";
export default function IdentityReviews({ records }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function perform(action) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-card">
      <h2>Legal Name Verification</h2>
      {records.length === 0 && <p>No identity submissions await review.</p>}
      {records.map((e) => (
        <article className="workspace-card" key={e.id}>
          <h3>{e.legal_name}</h3>
          <p>
            {e.kind === "company"
              ? "Company · incorporated"
              : "Individual · born"}{" "}
            {e.vital_date} · Signatory {e.signer}
          </p>
          <p>{[e.cin, e.gstin, e.pan].filter(Boolean).join(" · ")}</p>
          {Object.entries(e.checks).map(([slot, r]) => (
            <div key={slot}>
              <strong>{slotLabels[slot]}</strong> ·{" "}
              {r.status === "matched" ? "Matched" : "Review needed"}
              <p>
                {Object.entries(r.fields || {})
                  .map(
                    ([k, v]) => k + " — " + (v ? "matched" : "check manually"),
                  )
                  .join(" · ")}
              </p>
              {slot !== "aadhaar_offline" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    perform(async () => {
                      const permission = await portalAction("identity", {
                        action: "review_document",
                        id: e.id,
                        revision: e.revision,
                        slot,
                      });
                      const { data, error } = await browserClient()
                        .storage.from("client-kyc")
                        .download(permission.path);
                      if (error)
                        throw new Error("Evidence could not be retrieved.");
                      const url = URL.createObjectURL(data),
                        a = document.createElement("a");
                      a.href = url;
                      a.download =
                        slot +
                        ({
                          "application/pdf": ".pdf",
                          "image/jpeg": ".jpg",
                          "image/png": ".png",
                        }[data.type] || "");
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 3000);
                    })
                  }
                >
                  Download private evidence
                </button>
              )}
            </div>
          ))}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const f = new FormData(event.currentTarget),
                action = event.nativeEvent.submitter.value;
              perform(() =>
                portalAction("identity", {
                  id: e.id,
                  revision: e.revision,
                  action,
                  reviewed: f.has("reviewed"),
                  note: f.get("note"),
                }),
              );
            }}
          >
            <label>
              Review note visible to client
              <textarea name="note" maxLength={1000} />
            </label>
            <label className="check">
              <input name="reviewed" type="checkbox" />I reviewed the supporting
              documents, identity matches and authority to sign, including each
              flagged field.
            </label>
            <button disabled={busy} value="verify">
              Verify legal name
            </button>{" "}
            <button disabled={busy} value="return">
              Return for correction
            </button>
          </form>
        </article>
      ))}
      <p role="status">{message}</p>
    </section>
  );
}
