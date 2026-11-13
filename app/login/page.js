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
export default async function Login() {
  const { user, profile, signInStatus } = await accountContext();
  if (user && profile) redirect(accountDestination(profile, signInStatus));
  return (
    <main id="main" className="auth-page">
      <SignInForm />
    </main>
  );
}
