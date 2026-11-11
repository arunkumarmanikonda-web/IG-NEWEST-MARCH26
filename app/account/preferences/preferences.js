"use client";
import { useState } from "react";
import Link from "next/link";
import { portalAction } from "../profile";
const choices = [
  "real-estate",
  "transaction-advisory",
  "debt-special-situations",
  "hospitality",
  "retail-leasing",
  "entertainment",
  "horeca",
];
export default function Preferences({ history }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const latest = Object.fromEntries(
    [...history].reverse().map((x) => [x.purpose, x]),
  );
  return (
    <form
      className="portal-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          for (const purpose of [
            "email_marketing",
            "personalisation",
            "remarketing",
            "sms",
          ])
            await portalAction("account", {
              action: "consent",
              purpose,
              granted: f.get(purpose) === "on",
              practices: f.getAll("practices"),
            });
          setMessage("Preferences recorded. Unchecked purposes are withdrawn.");
        } catch (e) {
          setMessage(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="eyebrow">YOUR CHOICES</div>
      <h1>Stay informed, your way.</h1>
      <p>
        These choices are optional. Account access and NDA requests do not
        depend on marketing consent.
      </p>
      {[
        ["email_marketing", "Email updates about your selected practices"],
        ["personalisation", "Use recorded interests to personalise updates"],
        ["remarketing", "Advertising remarketing when enabled"],
        ["sms", "Promotional SMS when enabled"],
      ].map(([id, label]) => (
        <label className="check" key={id}>
          <input
            type="checkbox"
            name={id}
            defaultChecked={latest[id]?.granted === true}
          />
          {label}
        </label>
      ))}
      <fieldset>
        <legend>Practices of interest</legend>
        {choices.map((id) => (
          <label className="check" key={id}>
            <input
              type="checkbox"
              name="practices"
              value={id}
              defaultChecked={latest.email_marketing?.practices?.includes(id)}
            />
            {id.replaceAll("-", " ")}
          </label>
        ))}
      </fieldset>
      <p>
        No advertising pixels or automated marketing delivery are active in this
        preview.
      </p>
      <button className="button" disabled={busy}>
        Save preferences
      </button>
      <p role="status">{message}</p>
      <Link href="/account">Return to account</Link>
    </form>
  );
}
