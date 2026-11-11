"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { browserClient } from "../../../lib/supabase/browser";
export default function Security() {
  const [factors, setFactors] = useState([]),
    [qr, setQr] = useState(""),
    [factor, setFactor] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [aal, setAal] = useState("");
  async function refresh() {
    const c = browserClient();
    const [{ data, error }, { data: level }] = await Promise.all([
      c.auth.mfa.listFactors(),
      c.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (error) throw error;
    setFactors(data.totp || []);
    setAal(level?.currentLevel || "aal1");
  }
  useEffect(() => {
    refresh().catch((e) => setMessage(e.message));
  }, []);
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
      <div className="eyebrow">ACCOUNT SECURITY</div>
      <h1>Protect your access.</h1>
      <p>
        Staff operations require an authenticator code in addition to your
        password.
      </p>
      <p>
        Current session:{" "}
        <strong>
          {aal === "aal2"
            ? "Multi-factor verified"
            : "Password / email verified"}
        </strong>
      </p>
      {qr && (
        <>
          <p>Scan this QR code in your authenticator app. Keep it private.</p>
          <img
            className="security-qr"
            src={qr}
            alt="Private authenticator enrolment QR code"
          />
        </>
      )}
      {!factor && (
        <>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const { data, error } = await browserClient().auth.mfa.enroll({
                  factorType: "totp",
                  friendlyName:
                    "India Gully " + new Date().toISOString().slice(0, 16),
                });
                if (error) throw error;
                setQr(data.totp.qr_code);
                setFactor(data.id);
              })
            }
          >
            Add authenticator
          </button>
          {factors
            .filter((f) => f.status === "verified")
            .map((f) => (
              <div className="workspace-actions" key={f.id}>
                <button
                  disabled={busy}
                  onClick={() => {
                    setFactor(f.id);
                    setMessage(
                      "Enter the current code from your authenticator.",
                    );
                  }}
                >
                  Verify {f.friendly_name || "authenticator"}
                </button>
              </div>
            ))}
        </>
      )}
      {factor && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = new FormData(e.currentTarget).get("code");
            run(async () => {
              const { error } =
                await browserClient().auth.mfa.challengeAndVerify({
                  factorId: factor,
                  code,
                });
              if (error) throw error;
              setQr("");
              setFactor("");
              await refresh();
              setMessage(
                "Multi-factor authentication verified. You can return to your account.",
              );
            });
          }}
        >
          <label>
            Six-digit authenticator code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </label>
          <button className="button" disabled={busy}>
            Verify code
          </button>
        </form>
      )}
      <hr />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const password = new FormData(e.currentTarget).get("password");
          run(async () => {
            const { error } = await browserClient().auth.updateUser({
              password,
            });
            if (error) throw error;
            setMessage("Password updated.");
          });
        }}
      >
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <button className="button" disabled={busy}>
          Update password
        </button>
      </form>
      <p role="status" className="portal-message">
        {message}
      </p>
      <Link href="/account">Return to your account</Link>
    </div>
  );
}
