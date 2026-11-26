"use client";
import Link from "next/link";
import { useRef, useState } from "react";

const MAX_RESUME_BYTES = 2 * 1024 * 1024;
function encodeFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("The selected file could not be read. Please select it again."));
    reader.readAsDataURL(file);
  });
}

export default function ApplicationForm({ job }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [reference, setReference] = useState("");
  const requestId = useRef(null), success = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const values = new FormData(event.currentTarget);
      const resume = values.get("resume"), portfolio = String(values.get("portfolio_url") || "").trim();
      const hasFile = resume instanceof File && resume.size > 0;
      if (!hasFile && !portfolio) throw new Error("Please attach your CV as a PDF or add a secure link to your CV or professional profile.");
      if (hasFile && resume.size > MAX_RESUME_BYTES) throw new Error("Your PDF must be 2 MB or smaller.");
      if (hasFile && !/\.pdf$/i.test(resume.name)) throw new Error("Please choose a PDF file for your CV.");
      if (portfolio) { let url; try { url = new URL(portfolio); } catch { throw new Error("Enter a complete HTTPS link to your CV or professional profile."); } if (url.protocol !== "https:") throw new Error("Use an HTTPS link to your CV or professional profile."); }
      requestId.current ||= crypto.randomUUID();
      const payload = { request_id: requestId.current, job_id: job.id, name: String(values.get("name") || ""), email: String(values.get("email") || ""), phone: String(values.get("phone") || ""), current_location: String(values.get("current_location") || ""), message: String(values.get("message") || ""), portfolio_url: portfolio, privacy: values.get("privacy") === "on", website: String(values.get("website") || "") };
      if (hasFile) payload.resume = { name: resume.name, type: "application/pdf", base64: await encodeFile(resume) };
      const response = await fetch("/api/careers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your application could not be submitted. Please try again.");
      setReference(result.reference || result.id || requestId.current);
      requestAnimationFrame(() => success.current?.focus());
    } catch (failure) { setError(failure.message || "Your application could not be submitted. Please try again."); }
    finally { setBusy(false); }
  }
  if (reference) return <div className="career-application-success" role="status" ref={success} tabIndex={-1}><div className="eyebrow">APPLICATION RECEIVED</div><h3>Thank you for introducing yourself.</h3><p>Your application for <strong>{job.title}</strong> has been saved for our recruitment team to review.</p><p className="career-reference">Your reference<br /><strong>{reference}</strong></p><Link className="button" href="/careers">Back to careers</Link></div>;
  return <form className="career-application-form" onSubmit={submit}>
    <fieldset disabled={busy}><legend className="visually-hidden">Application details</legend><div className="career-form-grid">
      <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Mobile number <span className="career-optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>
      <label>Current city <span className="career-optional">(optional)</span><input name="current_location" autoComplete="address-level2" maxLength={160} /></label>
      <label className="career-wide">Your CV <span className="career-optional">(PDF, up to 2 MB)</span><input name="resume" type="file" accept=".pdf,application/pdf" aria-describedby="career-cv-help" /><small id="career-cv-help">Attach a PDF or share an HTTPS link below. You can include both.</small></label>
      <label className="career-wide">CV or professional profile link <span className="career-optional">(optional with a PDF)</span><input name="portfolio_url" type="url" placeholder="https://" maxLength={1000} /><small>Use a link our team can access without requesting permission.</small></label>
      <label className="career-wide">A little about you<textarea name="message" rows={5} required minLength={20} maxLength={5000} placeholder="Tell us about your experience and interest in this role." /><small>20–5,000 characters.</small></label>
      <div className="career-honeypot" aria-hidden="true"><label>Website<input name="website" autoComplete="off" tabIndex={-1} /></label></div>
    </div>
    <label className="career-consent"><input type="checkbox" name="privacy" required /><span>I agree to India Gully using the information and CV I submit to assess my application and contact me about this role. I have read the <Link href="/privacy" target="_blank" rel="noreferrer">Privacy notice</Link>.</span></label>
    {error && <p className="career-form-error" role="alert">{error}</p>}
    <button className="button career-primary" type="submit" disabled={busy}>{busy ? "Submitting application…" : "Submit application"}</button><p className="career-form-note">Your details are shared privately with authorised recruitment administrators.</p>
    </fieldset>
  </form>;
}
