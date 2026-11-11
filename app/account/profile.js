"use client";
import { useState } from "react";
import Link from "next/link";
import { browserClient } from "../../lib/supabase/browser";
export async function portalAction(module, payload) {
  const res = await fetch("/api/portal/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, payload }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result.data;
}
export default function Account({ profile, email }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [accepted, setAccepted] = useState(profile.policy_version === "2026-11-11");
  async function run(task) {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-form">
      <div className="eyebrow">INDIA GULLY PORTAL</div>
      <h1>Your account.</h1>
      <p>{email}</p>
      {profile.must_change_password && (
        <p role="alert">
          Change your initial password in{" "}
          <Link href="/account/security">Security & MFA</Link> before activating
          staff access.
        </p>
      )}
      {!accepted ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await portalAction("account", {
                action: "accept_policies",
                version: "2026-11-11",
                terms: true,
                privacy: true,
                dataUse: true,
              });
              setAccepted(true);
              setMessage("Your policy acceptance has been recorded.");
            });
          }}
        >
          <h2>Complete registration</h2>
          <p>
            Record acceptance of the current policies, version 11 November 2026.
          </p>
          <label className="check">
            <input type="checkbox" required />I accept the{" "}
            <Link href="/terms" target="_blank">
              Terms of Use
            </Link>
            .
          </label>
          <label className="check">
            <input type="checkbox" required />I have read the{" "}
            <Link href="/privacy" target="_blank">
              Privacy Notice
            </Link>
            .
          </label>
          <label className="check">
            <input type="checkbox" required />I agree to the{" "}
            <Link href="/data-usage" target="_blank">
              Data Usage Policy
            </Link>
            .
          </label>
          <button className="button" disabled={busy}>
            Record acceptance
          </button>
        </form>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(async () => {
                await portalAction("account", {
                  action: "profile",
                  display_name: f.get("name"),
                  company: f.get("company"),
                });
                setMessage("Profile saved.");
              });
            }}
          >
            <label>
              Your name
              <input
                name="name"
                defaultValue={profile.display_name}
                maxLength={120}
                required
              />
            </label>
            <label>
              Organisation
              <input
                name="company"
                defaultValue={profile.company}
                maxLength={180}
              />
            </label>
            <button className="button" disabled={busy}>
              Save profile
            </button>
          </form>
          <div className="workspace-actions">
            <Link href="/account/security">Security & MFA</Link>
            <Link href="/account/preferences">Communication preferences</Link>
            <Link href="/account/nda">Confidentiality & NDA requests</Link>
            <Link href="/account/data-rooms">My project data rooms</Link>
            {profile.roles.some((x) => !["client", "vendor"].includes(x)) && (
              <Link href="/admin">Staff workspace</Link>
            )}
          </div>
          <button
            className="text-button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await portalAction("invitation");
                setMessage(
                  result.accepted
                    ? "Staff access activated. Open the staff workspace."
                    : "No pending invitation matches your verified email.",
                );
                if (result.accepted) location.assign("/admin");
              })
            }
          >
            Activate staff invitation
          </button>
          <p className="workspace-small">
            Staff invitations require a verified email and completed
            multi-factor authentication.
          </p>
        </>
      )}
      <p role="status" className="portal-message">
        {message}
      </p>
      <button
        className="text-button"
        disabled={busy}
        onClick={() =>
          run(async () => {
            await browserClient().auth.signOut({ scope: "global" });
            location.assign("/login");
          })
        }
      >
        Sign out of all sessions
      </button>
    </div>
  );
}
