import Link from "next/link";
import { redirect } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import Identities from "./identities";
import "../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Legal names and verification",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { client, user, policiesAccepted } = await accountContext();
  if (!user) redirect("/login?next=%2Faccount%2Flegal-names");
  if (!policiesAccepted) redirect("/account?next=%2Faccount%2Flegal-names");
  const { data, error } = await client
    .from("ig_legal_entities")
    .select("*")
    .eq("user_id", user.id)
    .order("consent_at");
  return (
    <main id="main" className="auth-page">
      <div className="nda-account">
        <Link href="/account">← Your account</Link>
        <h1>Legal Names and Verification</h1>
        {error ? (
          <p role="alert">Identity records are temporarily unavailable.</p>
        ) : (
          <Identities
            entities={data}
            offline={!!process.env.UIDAI_OFFLINE_SIGNING_CERT}
          />
        )}
      </div>
    </main>
  );
}
