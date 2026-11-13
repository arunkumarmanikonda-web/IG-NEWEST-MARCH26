import { portalReturn } from "../../lib/portal-return.mjs";
import SignInForm from "./signin-form";
import { redirect } from "next/navigation";
import { accountContext } from "../../lib/supabase/server";
import { accountDestination } from "../../lib/sign-in.mjs";
import "../portal.css";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }) {
  const { user, profile, signInStatus } = await accountContext();
  const returnTo = portalReturn((await searchParams)?.next);
  if (user && profile) {
    const destination = accountDestination(profile, signInStatus);
    redirect(
      returnTo &&
        signInStatus.accepted &&
        ["/account", "/admin"].includes(destination)
        ? returnTo
        : destination,
    );
  }
  return (
    <main id="main" className="auth-page">
      <SignInForm returnTo={returnTo} />
    </main>
  );
}
