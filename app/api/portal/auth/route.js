import { serverClient } from "../../../../lib/supabase/server";
import { verifyEmailCode } from "../../../../lib/email-auth.mjs";
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
    const email =
      typeof p.email === "string" ? p.email.trim().toLowerCase() : "";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 254)
      throw new HttpError("Enter a valid email address");
    if (p.action === "verify")
      return privateJson(await verifyEmailCode(client.auth, p));
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
      p.password.length < 12
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
    return privateJson({ ok: true, next: "/account" });
  } catch (e) {
    return errorJson(e);
  }
}
