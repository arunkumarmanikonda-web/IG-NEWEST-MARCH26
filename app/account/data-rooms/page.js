import {currentPolicies} from "../../../lib/policies";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import "../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "My project data rooms",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { client, user, profile } = await accountContext();
  if (!user || !profile) redirect("/login");
  const release=await currentPolicies();
  if (!release) redirect("/account");
  const policyVersion=release.version;
  if (profile.must_change_password) redirect("/account/security");
  if (profile.status !== "active" || profile.policy_version !== policyVersion)
    redirect("/account");
  const { data, error } = await client.rpc("ig_room_dashboard", { p: {} });
  return (
    <main id="main" className="auth-page">
      <div className="nda-account">
        <Link href="/account">← Your dashboard</Link>
        <h1>Your project data rooms.</h1>
        <p>
          Your team shares engagement reports here after approving your access.
          Opportunity rooms additionally require a reviewed, project-specific NDA.
        </p>
        {error ? (
          <p role="alert">Data rooms are temporarily unavailable.</p>
        ) : (
          <div className="room-card-grid">
            {data?.map((r) => (
              <Link
                className="workspace-card"
                key={r.id}
                href={"/account/data-rooms/" + r.id}
              >
                <div className="eyebrow">{r.room_type==='engagement'?'CLIENT REPORT ROOM':'PRIVATE PROJECT ROOM'}</div>
                <h2>{r.title}</h2>
                <p>{r.files.length} files · Open authorised room ↗</p>
              </Link>
            ))}
          </div>
        )}
        {!error && !data?.length && (
          <p className="workspace-note">
            No rooms are currently shared with you.{" "}
            <Link href="/account/nda">Review your NDA requests</Link> or speak
            with the advisory team.
          </p>
        )}
      </div>
    </main>
  );
}
