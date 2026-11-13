import {currentPolicies} from '../../../../lib/policies';
import { serverClient } from "../../../../lib/supabase/server";
import { verifyEmailCode } from "../../../../lib/email-auth.mjs";
import { finishSignIn } from "../../../../lib/sign-in.mjs";
import { anonymousServerClient } from "../../../../lib/runtime-config";
import {
  readJson,
  requestOrigin,
  privateJson,
  HttpError,
  errorJson,
} from "../../../../lib/http.mjs";
export async function POST(request) {
  try {
    const p = await readJson(request, 8192),
      client = await serverClient();
    if (p.action === "signout") {
      await client.auth.signOut({ scope: "global" });
      return privateJson({ ok: true });
    }
    if (p.action === "continue") return privateJson(await finishSignIn(client));
    if (["staff_email_code", "staff_email_verify", "staff_totp_verify"].includes(p.action)) {
      const { data: identity, error: identityError } = await client.auth.getUser();
      if (identityError || !identity?.user?.email_confirmed_at) throw new HttpError("Sign in before completing verification.", 401);
      const { data: profile } = await client.from("ig_profiles").select("status").eq("id", identity.user.id).maybeSingle();
      if (profile?.status !== "active") throw new HttpError("Active account required.", 403);
      if (p.action === "staff_email_code") {
        const { error } = await client.auth.signInWithOtp({ email: identity.user.email, options: { shouldCreateUser: false } });
        if (error) throw new HttpError(error.status === 429 ? "Please wait a minute before requesting another code." : "We could not send a code. Please try again.", error.status === 429 ? 429 : 503);
        return privateJson({ ok: true, message: "Your verification code is on its way. Check your inbox and spam folder." });
      }
      if (p.action === "staff_email_verify") {
        await verifyEmailCode(client.auth, { email: identity.user.email, purpose: "login", token: p.token });
        const { data: verified } = await client.auth.getUser();
        if (verified?.user?.id !== identity.user.id) throw new HttpError("Account verification did not match. Please sign in again.", 401);
      } else {
        if (typeof p.factorId !== "string" || !/^[0-9a-f-]{36}$/i.test(p.factorId) || typeof p.token !== "string" || !/^\d{6}$/.test(p.token)) throw new HttpError("Enter the six-digit code from your authenticator.");
        const { error } = await client.auth.mfa.challengeAndVerify({ factorId: p.factorId, code: p.token });
        if (error) throw new HttpError("This authenticator code is invalid or has expired. Please try the current code.", 401);
      }
      return privateJson(await finishSignIn(client));
    }
    const email =
      typeof p.email === "string" ? p.email.trim().toLowerCase() : "";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 254)
      throw new HttpError("Enter a valid email address");
    if (p.action === "verify") {
      const result = await verifyEmailCode(client.auth, p);
      return privateJson(p.purpose === "recovery" ? result : await finishSignIn(client));
    }
    if (p.action === "signup" && !await currentPolicies())
      throw new HttpError("Account registration is not open yet. Please contact hello@indiagully.com.", 503);
    if (p.action === "email_code") {
      const eligibility = await anonymousServerClient().rpc("ig_client_login_eligible", {
        secret: process.env.INTEGRATION_MASTER_KEY, email_address: email,
      });
      if (eligibility.error) throw new HttpError("Email sign-in is temporarily unavailable", 503);
      // Only approved CRM contacts may create an account through this endpoint.
      // Returning users are not asked to accept registration policies again.
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: eligibility.data === true } });
      if (error?.status === 429) throw new HttpError("Please wait a minute before requesting another code.", 429);
      if (error && error.status !== 400 && error.status !== 422) throw new HttpError("Email sign-in is temporarily unavailable. Please try again.", 503);
      return privateJson({ ok: true, ...(p.inline ? { verifyEmail: true } : { next: "/auth/verify?purpose=login" }),
        message: "If this email is registered or authorised by India Gully, your sign-in code is on its way. Check your inbox and spam folder." });
    }
    if (p.action === "resend") {
      const { error } = await client.auth.resend({ type: "signup", email });
      if (error) throw new HttpError("Please wait before requesting another code. Contact hello@indiagully.com if the problem continues.", 429);
      return privateJson({ ok: true, message: "If an unverified account exists, a new verification code has been requested." });
    }
    if (p.action === "recover") {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/auth/callback", requestOrigin(request)).href,
      });
      if (error)
        throw new HttpError(
          "Password recovery is unavailable. Contact hello@indiagully.com.",
          503,
        );
      return privateJson({
        ok: true,
        next: "/auth/verify?purpose=recovery",
        message:
          "If an eligible account exists, a recovery email has been requested.",
      });
    }
    if (
      typeof p.password !== "string" ||
      p.password.length > 128 ||
      p.password.length < (p.action === "signup" ? 12 : 1)
    )
      throw new HttpError("Use a password of 12–128 characters");
    if (p.action === "signup") {
      if (p.terms !== true || p.privacy !== true || p.dataUse !== true)
        throw new HttpError(
          "Accept the terms, privacy notice and data usage policy",
        );
      const { data, error } = await client.auth.signUp({
        email,
        password: p.password,
        options: {
          emailRedirectTo: new URL("/auth/callback", requestOrigin(request))
            .href,
          data: { display_name: String(p.name || "").slice(0, 120) },
        },
      });
      if (error)
        throw new HttpError(
          "Registration could not be completed. Please try again or contact hello@indiagully.com.",
          503,
        );
      return privateJson({
        ok: true,
        confirmEmail: !data.session,
        next: data.session ? "/account" : "/auth/verify",
        message:
          "Confirm your email, then sign in and record your policy acceptance.",
      });
    }
    if (p.action !== "signin") throw new HttpError("Unsupported action");
    const { error } = await client.auth.signInWithPassword({
      email,
      password: p.password,
    });
    if (error)
      throw new HttpError(
        "Unable to sign in. Check your credentials and email confirmation.",
        401,
      );
    return privateJson(await finishSignIn(client));
  } catch (e) {
    return errorJson(e);
  }
}
