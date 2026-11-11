"use client";
import { useState } from "react";
import Link from "next/link";
export default function AuthForm({ register = false }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: recovery ? "recover" : register ? "signup" : "signin",
          email: form.get("email"),
          password: form.get("password"),
          name: form.get("name"),
          terms: form.get("terms") === "on",
          privacy: form.get("privacy") === "on",
          dataUse: form.get("dataUse") === "on",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.next) location.assign(data.next);
      else setMessage(data.message);
    } catch (e) {
      setMessage(e.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="portal-form" onSubmit={submit}>
      <div className="eyebrow">INDIA GULLY ACCOUNT</div>
      <h1>
        {recovery
          ? "Recover access"
          : register
            ? "Create your account"
            : "Welcome back."}
      </h1>
      <p>
        {register
          ? "Register to manage your interests and request controlled information."
          : "Sign in to your account or authorised staff workspace."}
      </p>
      {register && (
        <label>
          Your name
          <input name="name" autoComplete="name" maxLength={120} required />
        </label>
      )}
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      {!recovery && (
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={12}
            maxLength={128}
            required
          />
          <small>At least 12 characters.</small>
        </label>
      )}
      {register && (
        <fieldset>
          <legend>Required agreements</legend>
          <label className="check">
            <input name="terms" type="checkbox" required />I accept the{" "}
            <Link href="/terms" target="_blank">
              Terms of Use
            </Link>
            .
          </label>
          <label className="check">
            <input name="privacy" type="checkbox" required />I have read the{" "}
            <Link href="/privacy" target="_blank">
              Privacy Notice
            </Link>
            .
          </label>
          <label className="check">
            <input name="dataUse" type="checkbox" required />I agree to the{" "}
            <Link href="/data-usage" target="_blank">
              Data Usage Policy
            </Link>
            .
          </label>
          <p>
            Marketing preferences are optional and managed separately after
            sign-in.
          </p>
        </fieldset>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? "Please wait…"
          : recovery
            ? "Request recovery email"
            : register
              ? "Create account"
              : "Sign in"}
      </button>
      <p role="status" className="portal-message">
        {message}
      </p>
      {!register && (
        <p><Link href="/auth/verify">Verify your email or request a new code</Link></p>
      )}
      {!register && (
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setRecovery(!recovery);
            setMessage("");
          }}
        >
          {recovery ? "Return to sign in" : "Forgot password?"}
        </button>
      )}
      <p>
        {register ? (
          <Link href="/login">Already registered? Sign in</Link>
        ) : (
          <Link href="/register">Create an account</Link>
        )}
      </p>
    </form>
  );
}
