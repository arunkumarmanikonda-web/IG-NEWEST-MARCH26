"use client";
import { useState } from "react";
import Link from "next/link";

export default function SignInForm({ returnTo = null }) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("passcode");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const action =
      mode === "passcode" ? "signin" : codeSent ? "verify" : "email_code";
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          inline: true,
          ...(action === "signin"
            ? { password: fields.get("password") }
            : action === "verify"
              ? { purpose: "login", token: fields.get("token") }
              : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.verifyEmail) {
        setCodeSent(true);
        setMessage(result.message);
      } else if (result.next)
        location.replace(
          returnTo && ["/account", "/admin"].includes(result.next)
            ? returnTo
            : result.next,
        );
    } catch (error) {
      setMessage(
        error.message || "We could not sign you in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function switchMode(next) {
    setMode(next);
    setCodeSent(false);
    setMessage("");
  }
  return (
    <form className="portal-form" onSubmit={submit}>
      <div className="eyebrow">INDIA GULLY · PRIVATE ACCESS</div>
      <h1>Welcome back.</h1>
      <p>
        Choose an email code or use your passcode. Staff can verify with an
        authenticator or an email code before entering their workspace.
      </p>
      <div className="signin-methods" role="group" aria-label="Sign-in method">
        <button
          type="button"
          aria-pressed={mode === "passcode"}
          disabled={busy}
          onClick={() => switchMode("passcode")}
        >
          Passcode
        </button>
        <button
          type="button"
          aria-pressed={mode === "email"}
          disabled={busy}
          onClick={() => switchMode("email")}
        >
          Email code
        </button>
      </div>
      <label>
        Email address
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          readOnly={codeSent}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {mode === "passcode" && (
        <label>
          Passcode
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </label>
      )}
      {mode === "email" && codeSent && (
        <label>
          Email verification code
          <input
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            required
            autoFocus
          />
        </label>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? "Please wait…"
          : mode === "email" && !codeSent
            ? "Send sign-in code"
            : "Sign in to my dashboard"}
      </button>
      {message && (
        <p role="status" className="portal-message">
          {message}
        </p>
      )}
      {codeSent && (
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => {
            setCodeSent(false);
            setMessage("");
          }}
        >
          Change email or request a new code
        </button>
      )}
      {mode === "passcode" && (
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => switchMode("email")}
        >
          Forgot your passcode? Sign in by email
        </button>
      )}
      <p className="workspace-small">
        Use the email registered with India Gully. Need an account?{" "}
        <Link href="/register">Register here</Link>.
      </p>
    </form>
  );
}
