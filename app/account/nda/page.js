import {currentPolicies} from "../../../lib/policies";
import { redirect } from "next/navigation";
import Link from "next/link";
import { accountContext } from "../../../lib/supabase/server";
import { published } from "../../../lib/cms";
import NdaAccount from "./requests";
import "../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "My NDA & information requests",
  robots: { index: false, follow: false },
};
export default async function Page({ searchParams }) {
  const {version: policyVersion}=await currentPolicies();
  const { client, user, profile } = await accountContext();
  if (!user || !profile) redirect("/login");
  if (profile.status !== "active" || profile.policy_version !== policyVersion)
    redirect("/account");
  const query = await searchParams;
  const [{ data: requests, error }, { data: templates, error: te }, items] =
    await Promise.all([
      client
        .from("ig_nda_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      client.from("ig_nda_templates").select("*").eq("status", "active"),
      published("opportunity"),
    ]);
  return (
    <main id="main" className="auth-page">
      <div className="nda-account">
        <Link href="/account">← Your account</Link>
        <h1>Confidential information.</h1>
        <p>Your requests, agreements and disclosure decisions in one place.</p>
        {error || te ? (
          <p role="alert">
            Requests are temporarily unavailable. Please try again.
          </p>
        ) : (
          <NdaAccount
            requests={requests || []}
            template={templates?.[0] || null}
            opportunities={(items || []).map((x) => ({
              slug: x.slug,
              title: x.title,
            }))}
            selected={query.opportunity || ""}
            profile={profile}
          />
        )}
      </div>
    </main>
  );
}
