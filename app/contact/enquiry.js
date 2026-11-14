"use client";
import { useState, useRef, useEffect } from "react";
import AdvertisingEvent from "../advertising-event";
import Link from "next/link";
import { contact } from "../../lib/content.mjs";
import { Arrow } from "../components";
export default function Enquiry({ initialInterest, submitRequest = fetch }) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(null);
  const requestId = useRef(null),
    confirmation = useRef(null);
  const interests = [
    ...new Set(
      [
        initialInterest,
        "Real Estate Advisory",
        "Transaction Advisory",
        "Debt & Special Situations",
        "Hospitality project",
        "Design & PMC",
        "Retail & Leasing",
        "Entertainment",
        "HORECA procurement",
        "Feasibility study",
        "Valuation",
        "Audit",
        "General enquiry",
      ].filter(Boolean),
    ),
  ];
  useEffect(() => {
    if (saved) {
      confirmation.current?.focus();
      confirmation.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [saved]);
  async function submit(event) {
    event.preventDefault();
    if (busy || saved) return;
    setBusy(true);
    setStatus("");
    const d = new FormData(event.currentTarget);
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await submitRequest("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId.current,
          name: d.get("name"),
          organisation: d.get("organisation"),
          email: d.get("email"),
          phone: d.get("phone"),
          practice: d.get("interest"),
          message: d.get("message"),
          privacy: d.get("privacy") === "on",
          website: d.get("website"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!result.id)
        throw new Error(
          "The confirmation reference was not returned. Please contact our team before submitting again.",
        );
      setSaved({
        id: result.id,
        ads:result.ads,
        name: d.get("name"),
        interest: d.get("interest"),
      });
    } catch (e) {
      setStatus(
        e.message || "Unable to save. Please email " + contact.email + ".",
      );
    } finally {
      setBusy(false);
    }
  }
  if (saved)
    return (
      <section
        ref={confirmation}
        tabIndex={-1}
        className="enquiry-success"
        aria-labelledby="enquiry-thanks"
        role="status"
      >
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <div className="eyebrow">ENQUIRY RECEIVED</div>
        {saved.ads && <AdvertisingEvent practice={saved.ads.practice} receipt={saved.id} proof={saved.ads.proof}/>}
        <h2 id="enquiry-thanks">Thank you, {saved.name.split(" ")[0]}.</h2>
        <p>
          Your enquiry has been recorded for our advisory team. We will review
          your brief and contact you using the details you supplied.
        </p>
        <div className="enquiry-reference">
          <span>Your enquiry reference</span>
          <strong>{saved.id}</strong>
          <small>Please quote this reference in any follow-up.</small>
        </div>
        <p>
          <strong>Area of interest:</strong> {saved.interest}
        </p>
        <p>
          For an urgent conversation, call{" "}
          <a href={"tel:" + contact.phone.replace(/\s/g, "")}>
            {contact.phone}
          </a>{" "}
          or email <a href={"mailto:" + contact.email}>{contact.email}</a>.
        </p>
        <div className="form-buttons">
          <Link className="button" href="/practices">
            Explore our practices <Arrow />
          </Link>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setSaved(null);
              requestId.current = null;
              setStatus("");
            }}
          >
            Send another enquiry
          </button>
        </div>
      </section>
    );
  return (
    <form className="enquiry-form" onSubmit={submit}>
      <h2>Share your enquiry.</h2>
      <p>
        Send a short brief to our advisory team. Please keep confidential
        documents for the agreed disclosure process.
      </p>
      <div className="form-grid">
        <label>
          Your name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Organisation
          <input
            name="organisation"
            autoComplete="organization"
            maxLength={150}
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          Phone number
          <input type="tel" name="phone" autoComplete="tel" maxLength={30} />
        </label>
        <label className="full">
          Area of interest
          <select name="interest" defaultValue={initialInterest || ""} required>
            <option value="" disabled>
              Select an area of interest
            </option>
            {interests.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          A short brief
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={1500}
            placeholder="Your objective, location, project stage and preferred next step."
          />
        </label>
      </div>
      <div className="enquiry-trap" aria-hidden="true">
        <label>
          Website
          <input name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>
      <label className="consent-copy">
        <input name="privacy" type="checkbox" required /> I have read the{" "}
        <Link href="/privacy">privacy notice</Link> and agree to the use of this
        information to respond to my enquiry. This does not subscribe me to
        marketing.
      </label>
      <div className="form-buttons">
        <button className="button" type="submit" disabled={busy || saved}>
          {saved ? "Enquiry saved" : busy ? "Saving…" : "Submit enquiry"}{" "}
          <Arrow />
        </button>
      </div>
      {status && (
        <p className="form-status" role="alert">
          {status}
        </p>
      )}
      <p className="consent-copy">
        You can also email{" "}
        <a href={"mailto:" + contact.email}>{contact.email}</a>.
      </p>
    </form>
  );
}
